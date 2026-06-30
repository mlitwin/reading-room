import SwiftUI
import WebKit

/// Single-document reader: one `ReaderWebHost` web view, no paging. Books use
/// `BookPager` instead. Reports load/scroll/popover events into `BookViewState`
/// via the host delegate, and restores the saved scroll once on the first load.
struct PieceWebView: UIViewRepresentable {
    let initialURL: URL
    var initialScrollY: Double = 0
    let mirrorRoot: URL
    let state: BookViewState

    func makeCoordinator() -> Coordinator {
        Coordinator(state: state, initialScrollY: initialScrollY)
    }

    func makeUIView(context: Context) -> WKWebView {
        // Single docs aren't part of a book's nav, so there's no uses_latin flag;
        // inject the lexicon (matching prior behavior) in case one carries Latin.
        let host = ReaderWebHost(mirrorRoot: mirrorRoot, injectLexicon: true, delegate: context.coordinator)
        context.coordinator.host = host
        state.webView = host.webView
        return host.webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        guard !context.coordinator.didLoad else { return }
        context.coordinator.didLoad = true
        state.isLoading = true
        state.errorMessage = nil
        context.coordinator.host?.loadFile(initialURL)
    }

    @MainActor
    final class Coordinator: ReaderWebDelegate {
        let state: BookViewState
        let initialScrollY: Double
        var host: ReaderWebHost?
        var didLoad = false
        private var didRestore = false

        init(state: BookViewState, initialScrollY: Double) {
            self.state = state
            self.initialScrollY = initialScrollY
        }

        func readerDidStartLoad(_ host: ReaderWebHost) {
            state.isLoading = true
            state.isPopoverOpen = false
            state.errorMessage = nil
            state.scrollY = 0
        }

        func readerDidFinishLoad(_ host: ReaderWebHost, url: URL?, canGoBack: Bool) {
            state.isLoading = false
            state.errorMessage = nil
            state.webViewCanGoBack = canGoBack
            if let url, let p = host.htmlPath(from: url) { state.currentPath = p }
            if !didRestore {
                didRestore = true
                state.scrollY = initialScrollY
                if initialScrollY > 0 {
                    let js = "window.scrollTo(0, \(initialScrollY));"
                    host.webView.evaluateJavaScript(js)
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                        host.webView.evaluateJavaScript(js)
                    }
                }
                state.didResume = true
            }
        }

        func readerDidFail(_ host: ReaderWebHost, message: String) {
            state.isLoading = false
            state.errorMessage = message
        }

        func readerPopover(_ host: ReaderWebHost, open: Bool) {
            state.isPopoverOpen = open
        }

        func readerScroll(_ host: ReaderWebHost, y: Double) {
            state.scrollY = y
        }
    }
}

import SwiftUI
import WebKit
import Observation

@Observable
final class BookViewState {
    var webView: WKWebView?
    var currentPath: String?
    var isLoading: Bool = true
    var errorMessage: String?
    var nav: BookNav?

    var currentEntry: NavEntry? {
        guard let nav, let currentPath else { return nil }
        return nav.pages.first { $0.htmlPath == currentPath }
    }

    func navigate(toHtmlPath htmlPath: String, baseURL: URL) {
        let url = baseURL.appendingPathComponent(htmlPath)
        webView?.load(URLRequest(url: url))
    }
}

struct PieceDetailView: View {
    let piece: Piece
    @Environment(SettingsStore.self) private var settings
    @State private var state = BookViewState()

    private var initialURL: URL {
        settings.baseURL.appendingPathComponent(piece.htmlPath)
    }

    var body: some View {
        VStack(spacing: 0) {
            // Drop the leading "Library" crumb — the native nav-bar back
            // button already does that. Suppress the row entirely at the
            // book root, where nothing remains.
            if piece.isBook, let entry = state.currentEntry {
                let ancestors = Array(entry.breadcrumbs.dropFirst())
                if !ancestors.isEmpty {
                    breadcrumbRow(entry: entry, ancestors: ancestors)
                }
            }

            ZStack {
                PieceWebView(
                    initialURL: initialURL,
                    baseURL: settings.baseURL,
                    state: state
                )

                if state.isLoading && state.errorMessage == nil {
                    ProgressView()
                }

                if let errorMessage = state.errorMessage {
                    VStack(spacing: 8) {
                        Text("Couldn't load page").font(.headline)
                        Text(errorMessage).font(.caption).foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding()
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
                    .padding()
                }
            }

            if piece.isBook, let entry = state.currentEntry, (entry.prev != nil || entry.next != nil) {
                bottomNavBar(entry: entry)
            }
        }
        .navigationTitle(piece.title)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            guard piece.isBook, state.nav == nil else { return }
            do {
                let client = ContentClient(baseURL: settings.baseURL)
                state.nav = try await client.fetchNav(forBookSlug: piece.slug)
            } catch {
                // Non-fatal — the WebView still renders the embedded HTML chrome.
            }
        }
    }

    @ViewBuilder
    private func breadcrumbRow(entry: NavEntry, ancestors: [Crumb]) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                ForEach(Array(ancestors.enumerated()), id: \.element.id) { idx, crumb in
                    if idx > 0 {
                        Text("›")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                    Button {
                        state.navigate(toHtmlPath: crumb.htmlPath, baseURL: settings.baseURL)
                    } label: {
                        Text(crumb.title)
                            .font(.caption)
                            .lineLimit(1)
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.mini)
                }
                Text("›").font(.caption).foregroundStyle(.tertiary)
                Text(entry.title)
                    .font(.caption.weight(.semibold))
                    .lineLimit(1)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
        }
        .background(.thinMaterial)
        .overlay(alignment: .bottom) {
            Divider()
        }
    }

    @ViewBuilder
    private func bottomNavBar(entry: NavEntry) -> some View {
        HStack(spacing: 12) {
            navButton(crumb: entry.prev, direction: .prev)
            Spacer(minLength: 8)
            navButton(crumb: entry.next, direction: .next)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(.thinMaterial)
        .overlay(alignment: .top) {
            Divider()
        }
    }

    private enum NavDirection { case prev, next }

    @ViewBuilder
    private func navButton(crumb: Crumb?, direction: NavDirection) -> some View {
        if let crumb {
            Button {
                state.navigate(toHtmlPath: crumb.htmlPath, baseURL: settings.baseURL)
            } label: {
                HStack(spacing: 4) {
                    if direction == .prev {
                        Image(systemName: "chevron.backward")
                        Text(crumb.title).lineLimit(1)
                    } else {
                        Text(crumb.title).lineLimit(1)
                        Image(systemName: "chevron.forward")
                    }
                }
                .font(.callout)
            }
            .buttonStyle(.plain)
            .foregroundStyle(.tint)
        } else {
            // Keeps the opposite-side button anchored.
            Color.clear.frame(width: 1, height: 1)
        }
    }
}

struct PieceWebView: UIViewRepresentable {
    let initialURL: URL
    let baseURL: URL
    let state: BookViewState

    // Hide HTML chrome that the native UI is replacing (site header,
    // breadcrumb, page-nav). The web reader keeps them visible since it has
    // no other chrome.
    private static let hideChromeJS = """
        (function() {
          var style = document.createElement('style');
          style.textContent = 'header.site, nav.breadcrumb, nav.page-nav { display: none !important; } article { margin-top: 1rem !important; }';
          document.head.appendChild(style);
        })();
        """

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    func makeUIView(context: Context) -> WKWebView {
        let userContent = WKUserContentController()
        userContent.addUserScript(WKUserScript(
            source: Self.hideChromeJS,
            injectionTime: .atDocumentEnd,
            forMainFrameOnly: true
        ))

        let config = WKWebViewConfiguration()
        config.userContentController = userContent

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.scrollView.contentInsetAdjustmentBehavior = .automatic
        webView.isOpaque = false
        webView.allowsBackForwardNavigationGestures = true
        state.webView = webView
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        if context.coordinator.didLoadInitial { return }
        context.coordinator.didLoadInitial = true
        state.isLoading = true
        state.errorMessage = nil
        webView.load(URLRequest(url: initialURL))
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        let parent: PieceWebView
        var didLoadInitial = false

        init(_ parent: PieceWebView) { self.parent = parent }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            if navigationAction.navigationType == .linkActivated,
               let target = navigationAction.request.url {
                let currentHost = webView.url?.host
                if let host = target.host, host == currentHost {
                    decisionHandler(.allow)
                } else {
                    UIApplication.shared.open(target)
                    decisionHandler(.cancel)
                }
                return
            }
            decisionHandler(.allow)
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            parent.state.isLoading = true
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            parent.state.isLoading = false
            parent.state.errorMessage = nil
            updateCurrentPath(webView: webView)
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            parent.state.isLoading = false
            parent.state.errorMessage = error.localizedDescription
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            parent.state.isLoading = false
            parent.state.errorMessage = error.localizedDescription
        }

        private func updateCurrentPath(webView: WKWebView) {
            guard let url = webView.url else { return }
            parent.state.currentPath = htmlPath(from: url, base: parent.baseURL)
        }

        // Returns the path portion of `url` relative to `base`'s path. Handles
        // both root-hosted (http://localhost:5173/) and path-prefixed
        // (https://antoninus.org/reading-room/) base URLs.
        private func htmlPath(from url: URL, base: URL) -> String? {
            guard let baseComps = URLComponents(url: base, resolvingAgainstBaseURL: false),
                  let urlComps = URLComponents(url: url, resolvingAgainstBaseURL: false),
                  urlComps.scheme == baseComps.scheme,
                  urlComps.host == baseComps.host else { return nil }
            var basePath = baseComps.path
            if !basePath.hasSuffix("/") { basePath += "/" }
            var pagePath = urlComps.path
            if pagePath.hasPrefix(basePath) {
                pagePath = String(pagePath.dropFirst(basePath.count))
            } else if pagePath.hasPrefix("/") {
                pagePath = String(pagePath.dropFirst())
            }
            return pagePath
        }
    }
}

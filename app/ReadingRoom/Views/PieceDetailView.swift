import SwiftUI
import WebKit

struct PieceDetailView: View {
    let piece: Piece
    @Environment(SettingsStore.self) private var settings

    @State private var isLoading: Bool = true
    @State private var errorMessage: String?

    private var pieceURL: URL {
        settings.baseURL.appendingPathComponent(piece.htmlPath)
    }

    var body: some View {
        ZStack {
            PieceWebView(
                url: pieceURL,
                isLoading: $isLoading,
                errorMessage: $errorMessage
            )
            .ignoresSafeArea(edges: .bottom)

            if isLoading && errorMessage == nil {
                ProgressView()
            }

            if let errorMessage {
                VStack(spacing: 8) {
                    Text("Couldn't load piece").font(.headline)
                    Text(errorMessage).font(.caption).foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                    Button("Retry") {
                        self.errorMessage = nil
                        isLoading = true
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
                .padding()
            }
        }
        .navigationTitle(piece.title)
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct PieceWebView: UIViewRepresentable {
    let url: URL
    @Binding var isLoading: Bool
    @Binding var errorMessage: String?

    // Hide the site header + per-piece footer from the rendered HTML — the
    // native navigation chrome already provides title + back, and the source
    // link in the footer leads to a raw .md file that's not useful in-app.
    private static let hideChromeJS = """
        (function() {
          var style = document.createElement('style');
          style.textContent = 'header.site, footer.piece { display: none !important; } article { margin-top: 1rem !important; }';
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
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        if context.coordinator.loadedURL != url {
            context.coordinator.loadedURL = url
            isLoading = true
            errorMessage = nil
            webView.load(URLRequest(url: url))
        }
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        var parent: PieceWebView
        var loadedURL: URL?

        init(_ parent: PieceWebView) { self.parent = parent }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            // Only the initial request (loadedURL) is allowed to load in-place.
            // Anything the user taps goes to Safari.
            if navigationAction.navigationType == .linkActivated,
               let target = navigationAction.request.url {
                UIApplication.shared.open(target)
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            parent.isLoading = false
            parent.errorMessage = nil
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            parent.isLoading = false
            parent.errorMessage = error.localizedDescription
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            parent.isLoading = false
            parent.errorMessage = error.localizedDescription
        }
    }
}

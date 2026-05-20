import SwiftUI
import WebKit

/// Renders a single note's HTML fragment (math + code + everything else)
/// inside its own WKWebView, sharing the site's reader.css. Click handling
/// is bridged: note-link clicks open another note; regular link clicks
/// dismiss + navigate the outer WebView.
struct NoteWebView: UIViewRepresentable {
    let html: String
    let baseURL: URL
    let onOpenNote: (String) -> Void
    let onContentLink: (URL) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    // Capture-phase click interception. `note:` buttons post their key;
    // any other anchor posts its raw href (Swift resolves it against
    // baseURL). preventDefault on both so the inner WebView never tries to
    // navigate inside the sheet.
    private static let bridgeJS = """
        (function() {
          document.addEventListener('click', function(e) {
            var btn = e.target.closest('button.note-link');
            if (btn) {
              e.preventDefault();
              e.stopPropagation();
              var t = btn.getAttribute('popovertarget') || '';
              var key = t.replace(/^note-/, '');
              if (key) window.webkit.messageHandlers.note.postMessage({ key: key });
              return;
            }
            var a = e.target.closest('a[href]');
            if (a) {
              e.preventDefault();
              var href = a.getAttribute('href');
              if (href) window.webkit.messageHandlers.content.postMessage({ href: href });
            }
          }, true);
        })();
        """

    func makeUIView(context: Context) -> WKWebView {
        let userContent = WKUserContentController()
        userContent.add(context.coordinator, name: "note")
        userContent.add(context.coordinator, name: "content")
        userContent.addUserScript(WKUserScript(
            source: Self.bridgeJS,
            injectionTime: .atDocumentEnd,
            forMainFrameOnly: true
        ))
        let config = WKWebViewConfiguration()
        config.userContentController = userContent

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.scrollView.contentInsetAdjustmentBehavior = .automatic
        webView.isOpaque = false
        webView.allowsBackForwardNavigationGestures = false
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        if context.coordinator.loadedHtml != html {
            context.coordinator.loadedHtml = html
            webView.loadHTMLString(Self.wrap(html), baseURL: baseURL)
        }
    }

    // The baseURL passed to loadHTMLString is the notes page's URL (e.g.
    // <site>/<book>/notes.html), so relative asset paths use `../assets/...`
    // to reach <site>/assets/ — same depth as the notes page itself.
    private static func wrap(_ inner: String) -> String {
        return """
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="../assets/katex.min.css">
        <link rel="stylesheet" href="../assets/highlight.css">
        <link rel="stylesheet" href="../assets/reader.css">
        <style>
          html, body { overflow-x: hidden; }
          body { margin: 0.75rem 1rem; }
        </style>
        </head>
        <body>
          <div class="body">
        \(inner)
          </div>
        </body>
        </html>
        """
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        let parent: NoteWebView
        var loadedHtml: String?

        init(_ parent: NoteWebView) { self.parent = parent }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard let body = message.body as? [String: Any] else { return }
            switch message.name {
            case "note":
                if let key = body["key"] as? String {
                    DispatchQueue.main.async { self.parent.onOpenNote(key) }
                }
            case "content":
                if let href = body["href"] as? String,
                   let url = URL(string: href, relativeTo: parent.baseURL) {
                    DispatchQueue.main.async { self.parent.onContentLink(url) }
                }
            default: break
            }
        }
    }
}

import UIKit
import WebKit

/// Events from a reader WebView, reported back to whatever owns the page
/// (the single-doc `PieceWebView` or a pager page). All on the main actor.
@MainActor
protocol ReaderWebDelegate: AnyObject {
    func readerDidStartLoad(_ host: ReaderWebHost)
    func readerDidFinishLoad(_ host: ReaderWebHost, url: URL?, canGoBack: Bool)
    func readerDidFail(_ host: ReaderWebHost, message: String)
    func readerPopover(_ host: ReaderWebHost, open: Bool)
    func readerScroll(_ host: ReaderWebHost, y: Double)
}

/// Owns one configured reader WKWebView: the chrome-hiding + popover/scroll
/// bridges, the on-demand reference-notes channel, file-link policy, and the
/// (optionally injected) lexicon. Shared by the single-doc reader and every
/// page of the book pager so they behave identically.
final class ReaderWebHost: NSObject {
    let mirrorRoot: URL
    weak var delegate: ReaderWebDelegate?
    let webView: WKWebView

    init(mirrorRoot: URL, injectLexicon: Bool, delegate: ReaderWebDelegate?) {
        self.mirrorRoot = mirrorRoot
        self.delegate = delegate

        let userContent = WKUserContentController()

        // fetch() is blocked for file:// in WKWebView, so cards.js reads the
        // lexicon from this global instead. 5 MB — only injected for Latin books
        // (gated by the caller) so non-Latin books never pay the parse cost.
        if injectLexicon {
            let lexiconURL = mirrorRoot.appendingPathComponent("assets/lexicon.json")
            if let data = try? Data(contentsOf: lexiconURL),
               let json = String(data: data, encoding: .utf8) {
                userContent.addUserScript(WKUserScript(
                    source: "window.__readingRoomLexicon = \(json);",
                    injectionTime: .atDocumentStart,
                    forMainFrameOnly: true
                ))
            }
        }
        for source in [Self.hideChromeJS, Self.popoverBridgeJS, Self.scrollBridgeJS] {
            userContent.addUserScript(WKUserScript(
                source: source,
                injectionTime: .atDocumentEnd,
                forMainFrameOnly: true
            ))
        }

        let config = WKWebViewConfiguration()
        config.userContentController = userContent
        webView = WKWebView(frame: .zero, configuration: config)

        super.init()

        // Weak proxy so the content controller doesn't retain-cycle the host.
        let proxy = WeakScriptMessageHandler(self)
        userContent.add(proxy, name: "popover")
        userContent.add(proxy, name: "scrollpos")
        userContent.add(proxy, name: "refnotes")

        webView.navigationDelegate = self
        webView.scrollView.contentInsetAdjustmentBehavior = .automatic
        webView.scrollView.alwaysBounceHorizontal = false
        webView.isOpaque = false
        webView.allowsBackForwardNavigationGestures = false
    }

    func loadFile(_ url: URL) {
        // file:// needs explicit read access to the mirror root for ../assets.
        webView.loadFileURL(url, allowingReadAccessTo: mirrorRoot)
    }

    func load(htmlPath: String) {
        loadFile(localURL(for: htmlPath))
    }

    func localURL(for htmlPath: String) -> URL {
        var url = mirrorRoot
        for component in htmlPath.split(separator: "/") {
            url = url.appendingPathComponent(String(component))
        }
        return url
    }

    /// The mirror-relative html path of a loaded file URL, or nil if it's not
    /// under the mirror (external link).
    func htmlPath(from url: URL) -> String? {
        guard url.isFileURL else { return nil }
        let pagePath = url.standardizedFileURL.path
        let rootPath = mirrorRoot.standardizedFileURL.path
        let prefix = rootPath.hasSuffix("/") ? rootPath : rootPath + "/"
        guard pagePath.hasPrefix(prefix) else { return nil }
        return String(pagePath.dropFirst(prefix.count))
    }

    // MARK: - Injected scripts

    private static let hideChromeJS = """
        (function() {
          var style = document.createElement('style');
          style.textContent = 'header.site, nav.breadcrumb, nav.page-nav { display: none !important; } article { margin-top: 1rem !important; }';
          document.head.appendChild(style);
        })();
        """

    private static let popoverBridgeJS = """
        (function() {
          var host = document.getElementById('popover-host');
          if (!host) return;
          host.addEventListener('toggle', function(e) {
            var open = e.newState === 'open';
            if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.popover) {
              window.webkit.messageHandlers.popover.postMessage({ open: open });
            }
          });
        })();
        """

    private static let scrollBridgeJS = """
        (function() {
          var t;
          function post() {
            if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.scrollpos) {
              window.webkit.messageHandlers.scrollpos.postMessage({ y: window.scrollY });
            }
          }
          window.addEventListener('scroll', function() {
            clearTimeout(t);
            t = setTimeout(post, 250);
          }, { passive: true });
        })();
        """
}

// MARK: - Message handling

extension ReaderWebHost: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        let body = message.body as? [String: Any] ?? [:]
        switch message.name {
        case "popover":
            delegate?.readerPopover(self, open: body["open"] as? Bool ?? false)
        case "scrollpos":
            if let y = body["y"] as? Double { delegate?.readerScroll(self, y: y) }
        case "refnotes":
            provideReferenceNotes()
        default:
            break
        }
    }

    // Read the synced reference-notes asset (FileManager — WKWebView can't fetch
    // file://), inject it as a JS global, and resolve the pending cards.js
    // promise. Loaded only on the first ag: tap. 2.4 MB, never always-on.
    private func provideReferenceNotes() {
        let url = mirrorRoot.appendingPathComponent("assets/latin-reference-notes.json")
        let resolve = "if (window.__resolveReferenceNotes) window.__resolveReferenceNotes();"
        var js = resolve
        if let data = try? Data(contentsOf: url),
           let json = String(data: data, encoding: .utf8) {
            js = "window.__readingRoomReferenceNotes = (\(json)).notes; " + resolve
        }
        webView.evaluateJavaScript(js)
    }
}

// MARK: - Navigation

extension ReaderWebHost: WKNavigationDelegate {
    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationAction: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        if navigationAction.navigationType == .linkActivated,
           let target = navigationAction.request.url {
            if target.isFileURL, target.path.hasPrefix(mirrorRoot.path) {
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
        delegate?.readerDidStartLoad(self)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        delegate?.readerDidFinishLoad(self, url: webView.url, canGoBack: webView.canGoBack)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        delegate?.readerDidFail(self, message: error.localizedDescription)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        delegate?.readerDidFail(self, message: error.localizedDescription)
    }
}

/// Forwards content-controller messages to a weakly-held target, so the
/// WKUserContentController (retained by the web view config) doesn't form a
/// retain cycle with the host that owns the web view.
private final class WeakScriptMessageHandler: NSObject, WKScriptMessageHandler {
    weak var target: WKScriptMessageHandler?
    init(_ target: WKScriptMessageHandler) { self.target = target }
    func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
        target?.userContentController(c, didReceive: m)
    }
}

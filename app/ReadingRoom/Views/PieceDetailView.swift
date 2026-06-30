import SwiftUI
import WebKit
import Observation

@Observable
final class BookViewState {
    var webView: WKWebView?
    var currentPath: String?
    var isLoading: Bool = true
    // True when the in-page WebView has back history — e.g. after the popover's
    // "Open full section ↗" excursion to a reference page. Drives the native
    // Back control so the reader can return (cards.js then restores the popover
    // from the #g= reading-state in the URL). See the navigation plan, Phase E.
    var webViewCanGoBack: Bool = false
    var errorMessage: String?
    var nav: BookNav?
    /// True while the web-side popover (#popover-host) is visible — vocab
    /// cards, prose notes, and A&G refs all render here. iOS no longer has a
    /// separate native note sheet; the in-page popover is the single surface.
    var isPopoverOpen: Bool = false
    /// Last reported page scroll offset (page coords, from the JS scroll
    /// bridge). Persisted for silent resume. Reset to 0 on each navigation.
    var scrollY: Double = 0
    /// Gate: true once the initial resume load has applied its saved position.
    /// Suppresses saving before then so the resume load can't overwrite the
    /// stored scroll with 0.
    var didResume: Bool = false

    var currentEntry: NavEntry? {
        guard let nav, let currentPath else { return nil }
        return nav.pages.first { $0.htmlPath == currentPath }
    }

    func navigate(toHtmlPath htmlPath: String, mirrorRoot: URL) {
        var url = mirrorRoot
        for component in htmlPath.split(separator: "/") {
            url = url.appendingPathComponent(String(component))
        }
        webView?.load(URLRequest(url: url))
    }
}

struct PieceDetailView: View {
    let piece: Piece
    @Environment(SiteSync.self) private var siteSync
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var scenePhase
    @State private var state = BookViewState()
    @State private var fallbackToast: String?

    // Silent resume: reopen at the saved page if it still exists in the mirror,
    // otherwise the piece's own entry page. The saved scroll offset (if any) is
    // handed to the WebView and restored after the first load finishes.
    private var savedPosition: ReadingPosition? {
        ReadingPositionStore.position(forSlug: piece.slug)
    }

    private var initialURL: URL {
        if let pos = savedPosition {
            let url = siteSync.localURL(for: pos.htmlPath)
            if FileManager.default.fileExists(atPath: url.path) { return url }
        }
        return siteSync.localURL(for: piece.htmlPath)
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
                    initialScrollY: savedPosition?.scrollY ?? 0,
                    mirrorRoot: siteSync.mirrorRoot,
                    state: state
                )

                if state.isLoading && state.errorMessage == nil {
                    ProgressView()
                }

                if let errorMessage = state.errorMessage {
                    VStack(spacing: 10) {
                        Text("Couldn't load page").font(.headline)
                        Text(errorMessage).font(.caption).foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                        HStack(spacing: 12) {
                            if state.webViewCanGoBack {
                                Button("Back") {
                                    state.errorMessage = nil
                                    state.webView?.goBack()
                                }
                            }
                            Button("Dismiss") { state.errorMessage = nil }
                                .buttonStyle(.borderedProminent)
                        }
                        .padding(.top, 2)
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
        .overlay(alignment: .top) {
            if let msg = fallbackToast {
                Text(msg)
                    .font(.caption)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(.regularMaterial, in: Capsule())
                    .padding(.top, 8)
                    .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
        .navigationTitle(piece.title)
        .navigationBarTitleDisplayMode(.inline)
        // While the web popover is open, hide the system back chevron. It
        // leaves the nav bar exposed, and reaching up for back to dismiss the
        // popover would otherwise pop the whole book to the library. The
        // popover carries its own prominent close. See nav UX work.
        .navigationBarBackButtonHidden(state.isPopoverOpen)
        // Return from an in-WebView excursion (the popover's "Open full section
        // ↗" jump to a reference page). Distinct from the system back-to-library
        // button; appears only when the WebView has its own history. On return,
        // cards.js restores the popover from the #g= reading-state.
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                if state.webViewCanGoBack {
                    Button {
                        state.webView?.goBack()
                    } label: {
                        Label("Back to reading", systemImage: "arrow.uturn.backward")
                    }
                }
            }
        }
        // Swipe gesture for book navigation. .simultaneousGesture so we
        // don't fight WebView scroll / selection / math-block horizontal
        // scroll. 60-pt threshold + horizontal-dominance check avoids
        // triggering on incidental drags. Guard on isPopoverOpen so a swipe
        // never fires through an open popover (vocab card / note / A&G ref).
        .simultaneousGesture(
            DragGesture(minimumDistance: 40)
                .onEnded { value in
                    guard !state.isPopoverOpen else { return }
                    let dx = value.translation.width
                    let dy = value.translation.height
                    guard abs(dx) > 60, abs(dx) > abs(dy) * 1.5 else { return }
                    let target = dx < 0 ? state.currentEntry?.next : state.currentEntry?.prev
                    if let target {
                        state.navigate(toHtmlPath: target.htmlPath, mirrorRoot: siteSync.mirrorRoot)
                    }
                }
        )
        // Disable the NavigationStack's interactive pop gesture while on a
        // book page that has card-level prev/next navigation, so horizontal
        // swipes navigate cards rather than popping to the library.
        // Disable the pop gesture for the entire book view — swipe is claimed
        // for card-level prev/next and should never exit to the library.
        // Non-book pieces leave the pop gesture intact (swipe → back to library).
        .background(NavigationPopGestureControl(disabled: piece.isBook))
        .task {
            guard piece.isBook, state.nav == nil else { return }
            state.nav = loadNavFromMirror(slug: piece.slug)
        }
        .onChange(of: siteSync.lastSyncDate) { _, _ in
            handleSyncCompleted()
        }
        // Persist eagerly: on each navigation (page identity), on each settled
        // scroll update (from the JS bridge, debounced), and on leave/background.
        // The scroll-update path is what survives a hard kill — lifecycle events
        // don't fire when the process is SIGKILLed (e.g. relaunch from Xcode).
        .onChange(of: state.currentPath) { _, _ in saveReadingPosition() }
        .onChange(of: state.scrollY) { _, _ in saveReadingPosition() }
        .onChange(of: scenePhase) { _, phase in
            if phase != .active { saveReadingPosition() }
        }
        .onDisappear { saveReadingPosition() }
    }

    private func saveReadingPosition() {
        // Don't persist until the resume load has settled, or the initial
        // currentPath/scrollY writes would clobber the stored scroll with 0.
        guard state.didResume, let path = state.currentPath else { return }
        ReadingPositionStore.save(
            ReadingPosition(htmlPath: path, scrollY: state.scrollY),
            forSlug: piece.slug
        )
    }

    // Called after each successful sync. If the page the user is reading
    // still exists in the mirror, do nothing. Otherwise, fall back: book
    // root if it survived; otherwise dismiss to the library.
    private func handleSyncCompleted() {
        if piece.isBook {
            state.nav = loadNavFromMirror(slug: piece.slug)
        }
        guard let current = state.currentPath else { return }
        let currentURL = siteSync.localURL(for: current)
        if FileManager.default.fileExists(atPath: currentURL.path) { return }

        // The page is gone. Try book root first.
        if piece.isBook {
            let rootURL = siteSync.localURL(for: piece.htmlPath)
            if FileManager.default.fileExists(atPath: rootURL.path) {
                showToast("Page removed; showing book index.")
                state.navigate(toHtmlPath: piece.htmlPath, mirrorRoot: siteSync.mirrorRoot)
                return
            }
        }
        // Book itself is gone — dismiss to the library.
        showToast("Page removed.")
        dismiss()
    }

    private func showToast(_ message: String) {
        withAnimation { fallbackToast = message }
        Task {
            try? await Task.sleep(nanoseconds: 2_500_000_000)
            withAnimation { fallbackToast = nil }
        }
    }

    private func loadNavFromMirror(slug: String) -> BookNav? {
        let url = siteSync.localURL(for: "\(slug)/nav.json")
        guard let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(BookNav.self, from: data)
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
                        state.navigate(toHtmlPath: crumb.htmlPath, mirrorRoot: siteSync.mirrorRoot)
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
                state.navigate(toHtmlPath: crumb.htmlPath, mirrorRoot: siteSync.mirrorRoot)
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

// Disables the UINavigationController's interactive pop gesture recognizer
// while active, so horizontal swipes can be claimed for card-level navigation.
// Stores a weak reference to the nav controller in its Coordinator so the
// gesture is reliably re-enabled when the view leaves the hierarchy.
private struct NavigationPopGestureControl: UIViewRepresentable {
    let disabled: Bool

    final class Coordinator {
        weak var navigationController: UINavigationController?
    }

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        view.backgroundColor = .clear
        view.isUserInteractionEnabled = false
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        // Defer to avoid mutating UIKit state during a SwiftUI layout pass.
        DispatchQueue.main.async {
            if context.coordinator.navigationController == nil {
                var r: UIResponder? = uiView.next
                while let responder = r {
                    if let nc = responder as? UINavigationController {
                        context.coordinator.navigationController = nc
                        break
                    }
                    r = responder.next
                }
            }
            context.coordinator.navigationController?
                .interactivePopGestureRecognizer?.isEnabled = !disabled
        }
    }

    static func dismantleUIView(_ uiView: UIView, coordinator: Coordinator) {
        coordinator.navigationController?.interactivePopGestureRecognizer?.isEnabled = true
    }
}

struct PieceWebView: UIViewRepresentable {
    let initialURL: URL
    // Scroll offset to restore once, after the initial (resume) load finishes.
    var initialScrollY: Double = 0
    let mirrorRoot: URL
    let state: BookViewState

    // Hide HTML chrome that the native UI is replacing: site header,
    // breadcrumb, and footer prev/next. Note popovers are left intact —
    // prose notes now render in the same in-page #popover-host as vocab
    // cards and A&G refs (unified note surface). (The web reader keeps
    // everything visible since it has no native chrome.)
    private static let hideChromeJS = """
        (function() {
          var style = document.createElement('style');
          style.textContent = 'header.site, nav.breadcrumb, nav.page-nav { display: none !important; } article { margin-top: 1rem !important; }';
          document.head.appendChild(style);
        })();
        """

    // Bridge the vocab card popover's open/close state to Swift so the
    // swipe gesture can be suppressed while the card is visible.
    // The popover toggle event does not bubble, so we attach directly to the
    // #popover-host element (which is in the static HTML at document end).
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

    // Report the page scroll offset (page coords) to Swift, debounced to the
    // trailing edge so it fires once the reader pauses/stops. Persisting on this
    // signal is what makes silent resume survive a hard process kill.
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

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    func makeUIView(context: Context) -> WKWebView {
        let userContent = WKUserContentController()

        // fetch() is blocked for file:// URLs in WKWebView. Inject the lexicon
        // as a JS global so cards.js can skip the fetch entirely on iOS.
        let lexiconURL = mirrorRoot.appendingPathComponent("assets/lexicon.json")
        if let lexiconData = try? Data(contentsOf: lexiconURL),
           let lexiconJSON = String(data: lexiconData, encoding: .utf8) {
            userContent.addUserScript(WKUserScript(
                source: "window.__readingRoomLexicon = \(lexiconJSON);",
                injectionTime: .atDocumentStart,
                forMainFrameOnly: true
            ))
        }

        userContent.addUserScript(WKUserScript(
            source: Self.hideChromeJS,
            injectionTime: .atDocumentEnd,
            forMainFrameOnly: true
        ))
        userContent.addUserScript(WKUserScript(
            source: Self.popoverBridgeJS,
            injectionTime: .atDocumentEnd,
            forMainFrameOnly: true
        ))
        userContent.addUserScript(WKUserScript(
            source: Self.scrollBridgeJS,
            injectionTime: .atDocumentEnd,
            forMainFrameOnly: true
        ))
        userContent.add(context.coordinator, name: "popover")
        userContent.add(context.coordinator, name: "scrollpos")
        // On-demand source for the in-flow A&G reference notes: cards.js posts
        // here on the first ag: tap; we read the synced asset and inject it,
        // then resolve. Avoids a 2.4 MB always-on global at page load.
        userContent.add(context.coordinator, name: "refnotes")

        let config = WKWebViewConfiguration()
        config.userContentController = userContent

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.scrollView.contentInsetAdjustmentBehavior = .automatic
        webView.scrollView.alwaysBounceHorizontal = false
        webView.isOpaque = false
        // Disabled: the book-prev swipe replaces it, and the semantic overlap
        // (WebView-history-back vs book-prev) is confusing.
        webView.allowsBackForwardNavigationGestures = false
        state.webView = webView
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        if context.coordinator.didLoadInitial { return }
        context.coordinator.didLoadInitial = true
        state.isLoading = true
        state.errorMessage = nil
        // file:// URLs need explicit read-access to the mirror root so the
        // page can pull in ../assets/reader.css and siblings.
        webView.loadFileURL(initialURL, allowingReadAccessTo: mirrorRoot)
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        let parent: PieceWebView
        var didLoadInitial = false
        var didRestoreScroll = false

        init(_ parent: PieceWebView) { self.parent = parent }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard let body = message.body as? [String: Any] else { return }
            switch message.name {
            case "popover":
                let open = body["open"] as? Bool ?? false
                DispatchQueue.main.async { self.parent.state.isPopoverOpen = open }
            case "scrollpos":
                if let y = body["y"] as? Double {
                    DispatchQueue.main.async { self.parent.state.scrollY = y }
                }
            case "refnotes":
                provideReferenceNotes(to: message.webView)
            default:
                break
            }
        }

        // Read the synced reference-notes asset from the mirror (FileManager —
        // WKWebView can't fetch file://), inject it as a JS global, and resolve
        // the pending cards.js promise. Loaded only on the first ag: tap.
        private func provideReferenceNotes(to webView: WKWebView?) {
            let url = parent.mirrorRoot.appendingPathComponent("assets/latin-reference-notes.json")
            let resolve = "if (window.__resolveReferenceNotes) window.__resolveReferenceNotes();"
            var js = resolve
            if let data = try? Data(contentsOf: url),
               let json = String(data: data, encoding: .utf8) {
                js = "window.__readingRoomReferenceNotes = (\(json)).notes; " + resolve
            }
            DispatchQueue.main.async { webView?.evaluateJavaScript(js) }
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            if navigationAction.navigationType == .linkActivated,
               let target = navigationAction.request.url {
                // file:// links inside the mirror — allow. Anything else
                // (http/mailto/...) hand off to the OS.
                if target.isFileURL,
                   target.path.hasPrefix(parent.mirrorRoot.path) {
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
            parent.state.isPopoverOpen = false
            parent.state.errorMessage = nil   // clear a prior error when navigating
            // New page starts at the top; later didFinish restores the saved
            // offset for the resume load only. Keeps the wrong page's scroll
            // from being persisted against a freshly-navigated page.
            parent.state.scrollY = 0
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            parent.state.isLoading = false
            parent.state.errorMessage = nil
            parent.state.webViewCanGoBack = webView.canGoBack
            updateCurrentPath(webView: webView)
            restoreScrollIfNeeded(webView)
        }

        // Restore the saved scroll offset exactly once, on the first (resume)
        // load, in page coordinates (matching the JS scroll bridge). Re-applied
        // shortly after because content height can still be settling at
        // didFinish, which would otherwise clamp the target. Setting state.scrollY
        // up front, then opening the didResume gate, means the first persisted
        // save records the restored offset rather than 0.
        private func restoreScrollIfNeeded(_ webView: WKWebView) {
            guard !didRestoreScroll else { return }
            didRestoreScroll = true
            let y = parent.initialScrollY
            parent.state.scrollY = y
            if y > 0 {
                let js = "window.scrollTo(0, \(y));"
                webView.evaluateJavaScript(js)
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                    webView.evaluateJavaScript(js)
                }
            }
            parent.state.didResume = true
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
            parent.state.currentPath = htmlPath(from: url, mirrorRoot: parent.mirrorRoot)
        }

        // For file:// URLs we ask: does the page's path live under the
        // mirror root? If so, the relative remainder IS the html path
        // (e.g. "calculus-on-manifolds/index.html").
        private func htmlPath(from url: URL, mirrorRoot: URL) -> String? {
            guard url.isFileURL else { return nil }
            let pagePath = url.standardizedFileURL.path
            let rootPath = mirrorRoot.standardizedFileURL.path
            let prefix = rootPath.hasSuffix("/") ? rootPath : rootPath + "/"
            guard pagePath.hasPrefix(prefix) else { return nil }
            return String(pagePath.dropFirst(prefix.count))
        }
    }
}

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

    /// Installed by the active renderer. The pager pages to the target; the
    /// single-doc reader loads it into its one web view (the default below).
    var navigator: ((String) -> Void)?

    func navigate(toHtmlPath htmlPath: String, mirrorRoot: URL) {
        if let navigator {
            navigator(htmlPath)
            return
        }
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
    @State private var showTOC = false

    private var hasTOC: Bool {
        piece.isBook && (state.nav?.pages.count ?? 0) > 1
    }

    // True when the reader is on an off-book reference page reached from the
    // popover's "Open full section ↗" — i.e. the current page isn't one of the
    // book's own nav pages, and there's WebView history to return through.
    private var isOnReferenceExcursion: Bool {
        state.currentPath != nil && state.currentEntry == nil && state.webViewCanGoBack
    }

    // Silent resume: reopen at the saved page if it still exists in the mirror,
    // otherwise the piece's own entry page. The saved scroll offset (if any) is
    // handed to the WebView and restored after the first load finishes.
    private var savedPosition: ReadingPosition? {
        ReadingPositionStore.position(forSlug: piece.slug)
    }

    // Resume at the saved page if it still exists, else the piece's entry page.
    private var initialPath: String {
        if let pos = savedPosition {
            let url = siteSync.localURL(for: pos.htmlPath)
            if FileManager.default.fileExists(atPath: url.path) { return pos.htmlPath }
        }
        return piece.htmlPath
    }

    private var initialURL: URL { siteSync.localURL(for: initialPath) }

    var body: some View {
        VStack(spacing: 0) {
            // Drop the leading "Library" crumb — the native nav-bar back
            // button already does that. Suppress the row entirely at the
            // book root, where nothing remains.
            if piece.isBook, let entry = state.currentEntry {
                let ancestors = Array(entry.breadcrumbs.dropFirst())
                if !ancestors.isEmpty {
                    breadcrumbRow(entry: entry, ancestors: ancestors)
                        .modifier(InertWhilePopover(active: state.isPopoverOpen))
                }
            }

            ZStack {
                if piece.isBook {
                    // Native horizontal pager over the book's pages. Waits for
                    // nav.json (loaded in .task) so it knows the page sequence.
                    if let nav = state.nav {
                        BookPager(
                            nav: nav,
                            mirrorRoot: siteSync.mirrorRoot,
                            state: state,
                            initialPath: initialPath,
                            initialScrollY: savedPosition?.scrollY ?? 0
                        )
                    } else {
                        Color.clear
                    }
                } else {
                    PieceWebView(
                        initialURL: initialURL,
                        initialScrollY: savedPosition?.scrollY ?? 0,
                        mirrorRoot: siteSync.mirrorRoot,
                        state: state
                    )
                }

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
                    .modifier(InertWhilePopover(active: state.isPopoverOpen))
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
        // Books use a custom context-aware leading chevron (below); hide the
        // system one. Non-book pieces keep the system back (and its edge-swipe).
        // Either is hidden while the popover is open, so the top bar is inert.
        .navigationBarBackButtonHidden(piece.isBook || state.isPopoverOpen)
        // Freeze the page scroll behind the popover. Without this, a drag on the
        // popover — especially its non-scrolling header — bleeds through to the
        // WebView's scroll view and moves the article underneath. The popover's
        // own `.popover-body` keeps its inner scroll (a separate scroller).
        .onChange(of: state.isPopoverOpen) { _, open in
            state.webView?.scrollView.isScrollEnabled = !open
        }
        .toolbar {
            // One back control, "up one level": on an off-book reference page
            // (reached via the popover's "Open full section ↗"), it returns to
            // the reading spot (cards.js restores the popover from #g=); on a
            // normal book page it exits to the library. The label says where
            // you'll land. Replaces the old dual back/forward + uturn controls.
            ToolbarItem(placement: .topBarLeading) {
                if piece.isBook && !state.isPopoverOpen {
                    Button {
                        if isOnReferenceExcursion {
                            state.webView?.goBack()
                        } else {
                            dismiss()
                        }
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "chevron.backward")
                            Text(isOnReferenceExcursion ? "Reading" : "Library")
                        }
                    }
                }
            }
            ToolbarItem(placement: .topBarTrailing) {
                // Table of contents — jump anywhere in the book. Hidden while the
                // popover is open, matching the inert-top-bar modal behavior.
                if hasTOC && !state.isPopoverOpen {
                    Button {
                        showTOC = true
                    } label: {
                        Label("Contents", systemImage: "list.bullet")
                    }
                }
            }
        }
        .sheet(isPresented: $showTOC) {
            BookTOCView(
                pages: state.nav?.pages ?? [],
                currentPath: state.currentPath,
                onSelect: { htmlPath in
                    state.navigate(toHtmlPath: htmlPath, mirrorRoot: siteSync.mirrorRoot)
                }
            )
        }
        // Page turning is handled natively by the BookPager (UIPageViewController):
        // horizontal swipe = prev/next page with live preview, vertical scroll
        // stays with the WebView — UIKit arbitrates the two axes.
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
        // Mark this as the open piece for reopen-on-launch. Cleared on disappear,
        // which fires on a pop back to the library but NOT on backgrounding/kill —
        // so we only auto-reopen when the app was closed while reading.
        .onAppear { ReadingPositionStore.lastOpenSlug = piece.slug }
        .onDisappear {
            saveReadingPosition()
            ReadingPositionStore.lastOpenSlug = nil
        }
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

// Dims and disables native book chrome (breadcrumb row, bottom nav bar) while
// the web popover is open, so only the popover is live — a modal feel without
// the layout shift that hiding the rows would cause.
private struct InertWhilePopover: ViewModifier {
    let active: Bool

    func body(content: Content) -> some View {
        content
            .disabled(active)
            .opacity(active ? 0.35 : 1)
            .animation(.easeInOut(duration: 0.15), value: active)
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

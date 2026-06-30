import SwiftUI
import UIKit
import WebKit

/// Horizontal pager over a book's `nav.pages`, one WKWebView per page, so the
/// page-turn is a native swipe with live preview and clean arbitration against
/// vertical scrolling. UIPageViewController keeps only the current page and its
/// neighbors alive. Shared reading state (current path, scroll, popover) tracks
/// whichever page is current.
struct BookPager: UIViewControllerRepresentable {
    let nav: BookNav
    let mirrorRoot: URL
    let state: BookViewState
    let initialPath: String
    let initialScrollY: Double

    func makeCoordinator() -> Coordinator {
        Coordinator(
            state: state,
            mirrorRoot: mirrorRoot,
            pages: nav.pages,
            injectLexicon: nav.usesLatin,
            initialPath: initialPath,
            initialScrollY: initialScrollY
        )
    }

    func makeUIViewController(context: Context) -> UIPageViewController {
        let pvc = UIPageViewController(
            transitionStyle: .scroll,
            navigationOrientation: .horizontal,
            options: [.interPageSpacing: 24]
        )
        pvc.dataSource = context.coordinator
        pvc.delegate = context.coordinator
        context.coordinator.pager = pvc

        let startIndex = context.coordinator.index(forHtmlPath: initialPath) ?? 0
        if let first = context.coordinator.pageController(forIndex: startIndex) {
            pvc.setViewControllers([first], direction: .forward, animated: false)
            context.coordinator.onBecameCurrent(first)
        }

        // Route TOC / bottom-bar / breadcrumb jumps through the pager.
        state.navigator = { [weak coordinator = context.coordinator] path in
            coordinator?.jump(toHtmlPath: path)
        }
        return pvc
    }

    func updateUIViewController(_ pvc: UIPageViewController, context: Context) {
        context.coordinator.refresh(pages: nav.pages)
        // Suspend paging while a popover is open or during an off-book reference
        // excursion (where the neighbors aren't this page's true neighbors).
        let onExcursion = state.currentPath != nil && state.currentEntry == nil
        let allowPaging = !state.isPopoverOpen && !onExcursion
        pvc.dataSource = allowPaging ? context.coordinator : nil
    }

    static func dismantleUIViewController(_ pvc: UIPageViewController, coordinator: Coordinator) {
        coordinator.state.navigator = nil
    }

    final class Coordinator: NSObject, UIPageViewControllerDataSource, UIPageViewControllerDelegate, ReaderWebDelegate {
        let state: BookViewState
        let mirrorRoot: URL
        var pages: [NavEntry]
        let injectLexicon: Bool
        let initialPath: String
        let initialScrollY: Double

        weak var pager: UIPageViewController?
        private var cache: [Int: PageHostController] = [:]
        private var didRestore = false

        init(state: BookViewState, mirrorRoot: URL, pages: [NavEntry], injectLexicon: Bool, initialPath: String, initialScrollY: Double) {
            self.state = state
            self.mirrorRoot = mirrorRoot
            self.pages = pages
            self.injectLexicon = injectLexicon
            self.initialPath = initialPath
            self.initialScrollY = initialScrollY
        }

        func index(forHtmlPath path: String) -> Int? {
            pages.firstIndex { $0.htmlPath == path }
        }

        func pageController(forIndex index: Int) -> PageHostController? {
            guard pages.indices.contains(index) else { return nil }
            if let cached = cache[index] { return cached }
            let vc = PageHostController(
                index: index,
                entry: pages[index],
                mirrorRoot: mirrorRoot,
                injectLexicon: injectLexicon,
                delegate: self
            )
            cache[index] = vc
            return vc
        }

        func refresh(pages: [NavEntry]) {
            // Keep index lookups valid after a sync. Visible VCs are left as-is;
            // PieceDetailView.handleSyncCompleted handles a removed current page.
            if pages.map(\.htmlPath) != self.pages.map(\.htmlPath) {
                self.pages = pages
            }
        }

        // MARK: Paging to a specific page (TOC, bottom bar, breadcrumb)

        func jump(toHtmlPath path: String) {
            guard let pager else { return }
            let currentIndex = (pager.viewControllers?.first as? PageHostController)?.index ?? 0
            guard let target = index(forHtmlPath: path) else {
                // Off-book target (rare via jump) — load into the current page.
                (pager.viewControllers?.first as? PageHostController)?.host.load(htmlPath: path)
                return
            }
            if target == currentIndex { return }
            guard let vc = pageController(forIndex: target) else { return }
            let direction: UIPageViewController.NavigationDirection = target > currentIndex ? .forward : .reverse
            pager.setViewControllers([vc], direction: direction, animated: true) { [weak self] done in
                guard done, let self else { return }
                self.prune(around: target)
                self.onBecameCurrent(vc)
            }
        }

        private func prune(around index: Int) {
            for key in cache.keys where abs(key - index) > 1 { cache[key] = nil }
        }

        // MARK: UIPageViewControllerDataSource

        func pageViewController(_ pageViewController: UIPageViewController, viewControllerBefore viewController: UIViewController) -> UIViewController? {
            guard let i = (viewController as? PageHostController)?.index else { return nil }
            return pageController(forIndex: i - 1)
        }

        func pageViewController(_ pageViewController: UIPageViewController, viewControllerAfter viewController: UIViewController) -> UIViewController? {
            guard let i = (viewController as? PageHostController)?.index else { return nil }
            return pageController(forIndex: i + 1)
        }

        // MARK: UIPageViewControllerDelegate

        func pageViewController(_ pageViewController: UIPageViewController, didFinishAnimating finished: Bool, previousViewControllers: [UIViewController], transitionCompleted completed: Bool) {
            guard completed, let current = pageViewController.viewControllers?.first as? PageHostController else { return }
            prune(around: current.index)
            onBecameCurrent(current)
        }

        // Point shared state at a newly-current page.
        func onBecameCurrent(_ vc: PageHostController) {
            state.webView = vc.host.webView
            state.isPopoverOpen = false
            state.scrollY = 0
            state.webViewCanGoBack = vc.host.webView.canGoBack
            if let url = vc.host.webView.url, let p = vc.host.htmlPath(from: url) {
                state.currentPath = p
            } else {
                state.currentPath = vc.entry.htmlPath
            }
        }

        // MARK: ReaderWebDelegate — only the current page drives shared state.

        private func isCurrent(_ host: ReaderWebHost) -> Bool {
            (pager?.viewControllers?.first as? PageHostController)?.host === host
        }

        func readerDidStartLoad(_ host: ReaderWebHost) {
            guard isCurrent(host) else { return }
            state.isLoading = true
            state.isPopoverOpen = false
            state.errorMessage = nil
            state.scrollY = 0
        }

        func readerDidFinishLoad(_ host: ReaderWebHost, url: URL?, canGoBack: Bool) {
            let path = url.flatMap { host.htmlPath(from: $0) }
            // Restore the saved scroll once, when the initial resume page loads.
            if !didRestore, path == initialPath {
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
            guard isCurrent(host) else { return }
            state.isLoading = false
            state.errorMessage = nil
            state.webViewCanGoBack = canGoBack
            if let path { state.currentPath = path }
        }

        func readerDidFail(_ host: ReaderWebHost, message: String) {
            guard isCurrent(host) else { return }
            state.isLoading = false
            state.errorMessage = message
        }

        func readerPopover(_ host: ReaderWebHost, open: Bool) {
            guard isCurrent(host) else { return }
            state.isPopoverOpen = open
        }

        func readerScroll(_ host: ReaderWebHost, y: Double) {
            guard isCurrent(host) else { return }
            state.scrollY = y
        }
    }
}

/// A single book page: a view controller whose view is one reader WKWebView.
final class PageHostController: UIViewController {
    let index: Int
    let entry: NavEntry
    let host: ReaderWebHost
    private var didLoad = false

    init(index: Int, entry: NavEntry, mirrorRoot: URL, injectLexicon: Bool, delegate: ReaderWebDelegate) {
        self.index = index
        self.entry = entry
        self.host = ReaderWebHost(mirrorRoot: mirrorRoot, injectLexicon: injectLexicon, delegate: delegate)
        super.init(nibName: nil, bundle: nil)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("init(coder:) not supported") }

    override func loadView() {
        view = host.webView
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        guard !didLoad else { return }
        didLoad = true
        host.load(htmlPath: entry.htmlPath)
    }
}

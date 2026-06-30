import SwiftUI
import WebKit

struct LibraryView: View {
    @Environment(LibraryStore.self) private var library
    @Environment(SiteSync.self) private var siteSync
    @State private var showSettings = false
    @State private var path: [Piece] = []
    @State private var didAutoOpen = false
    @State private var searchText = ""

    // Case-insensitive match across title, author, summary, and tags. Empty
    // query returns everything.
    private var filteredPieces: [Piece] {
        let q = searchText.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !q.isEmpty else { return library.pieces }
        return library.pieces.filter { piece in
            piece.title.lowercased().contains(q)
                || (piece.author?.lowercased().contains(q) ?? false)
                || piece.summary.lowercased().contains(q)
                || piece.tags.contains { $0.lowercased().contains(q) }
        }
    }

    var body: some View {
        NavigationStack(path: $path) {
            content
                .navigationTitle("Reading Room")
                .searchable(text: $searchText, prompt: "Search title, author, tag")
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) {
                        Button {
                            Task { await hardRefresh() }
                        } label: {
                            if siteSync.isSyncing {
                                ProgressView()
                            } else {
                                Image(systemName: "arrow.clockwise")
                            }
                        }
                        .disabled(siteSync.isSyncing)
                        .accessibilityLabel("Refresh from source")
                    }
                    ToolbarItem(placement: .topBarTrailing) {
                        Button { showSettings = true } label: {
                            Image(systemName: "gearshape")
                        }
                    }
                }
                .refreshable { await refreshFromNetwork() }
                .sheet(isPresented: $showSettings) { SettingsView() }
                .task {
                    if case .idle = library.state {
                        await library.refresh(from: siteSync.mirrorRoot)
                    }
                    attemptAutoOpen()
                }
                .onChange(of: library.pieces) { _, _ in attemptAutoOpen() }
                .onChange(of: siteSync.lastSyncDate) { _, _ in
                    Task { await library.refresh(from: siteSync.mirrorRoot) }
                }
        }
    }

    // Reopen the piece the app was last closed inside, once, after the library
    // loads. A nil lastOpenSlug (the reader backed out before closing) leaves us
    // on the library. Runs at most once per launch.
    private func attemptAutoOpen() {
        guard !didAutoOpen, !library.pieces.isEmpty else { return }
        didAutoOpen = true
        guard let slug = ReadingPositionStore.lastOpenSlug,
              let piece = library.pieces.first(where: { $0.slug == slug }) else { return }
        path = [piece]
    }

    // Pull-to-refresh: trigger a network sync, await it, then re-read the
    // library from the (now-updated) local mirror.
    private func refreshFromNetwork() async {
        let task = siteSync.sync()
        await task.value
        await library.refresh(from: siteSync.mirrorRoot)
    }

    // Hard refresh: clear WKWebView caches AND sync. The WebView reads from
    // file:// so its data store is mostly noise now, but kept for parity with
    // the old behavior.
    private func hardRefresh() async {
        URLCache.shared.removeAllCachedResponses()
        await WKWebsiteDataStore.default().removeData(
            ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(),
            modifiedSince: .distantPast
        )
        await refreshFromNetwork()
    }

    @ViewBuilder
    private var content: some View {
        if library.pieces.isEmpty {
            switch library.state {
            case .idle, .loading:
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            case .failed(let message):
                VStack(spacing: 12) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.largeTitle)
                        .foregroundStyle(.secondary)
                    Text("Couldn't load library").font(.headline)
                    Text(message)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                    Button("Retry") {
                        Task { await refreshFromNetwork() }
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            case .loaded:
                Text("No pieces here yet")
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        } else {
            List(filteredPieces) { piece in
                NavigationLink(value: piece) {
                    PieceRow(piece: piece)
                }
            }
            .overlay {
                if filteredPieces.isEmpty {
                    ContentUnavailableView.search(text: searchText)
                }
            }
            .navigationDestination(for: Piece.self) { piece in
                PieceDetailView(piece: piece)
            }
        }
    }
}

private struct PieceRow: View {
    let piece: Piece

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(piece.title).font(.headline)
            HStack(spacing: 8) {
                if let author = piece.author, !author.isEmpty { Text(author) }
                if let date = piece.date, !date.isEmpty { Text(date) }
            }
            .font(.caption)
            .foregroundStyle(.secondary)
            if !piece.summary.isEmpty {
                Text(piece.summary)
                    .font(.callout)
                    .foregroundStyle(.secondary)
                    .lineLimit(3)
            }
            if !piece.tags.isEmpty {
                Text(piece.tags.joined(separator: " · "))
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
        }
        .padding(.vertical, 4)
    }
}

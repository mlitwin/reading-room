import SwiftUI

struct LibraryView: View {
    @Environment(LibraryStore.self) private var library
    @State private var showSettings = false

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Reading Room")
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button { showSettings = true } label: {
                            Image(systemName: "gearshape")
                        }
                    }
                }
                .refreshable { await library.refresh() }
                .sheet(isPresented: $showSettings) { SettingsView() }
                .task {
                    if case .idle = library.state { await library.refresh() }
                }
        }
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
                    Button("Retry") { Task { await library.refresh() } }
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
            List(library.pieces) { piece in
                NavigationLink(value: piece) {
                    PieceRow(piece: piece)
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

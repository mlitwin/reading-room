import SwiftUI

/// A sheet that presents one note at a time, with a hand-rolled history
/// stack so note→note links push and a back arrow pops. The inner
/// WKWebView is shared across the stack — only one WebView per sheet
/// regardless of how deep the reader navigates.
struct NoteSheet: View {
    let notesDict: [String: NoteData]
    let initialKey: String
    let baseURL: URL
    let onContentLink: (URL) -> Void

    @State private var history: [String]
    @State private var detent: PresentationDetent = .large
    @Environment(\.dismiss) private var dismiss

    init(
        notesDict: [String: NoteData],
        initialKey: String,
        baseURL: URL,
        onContentLink: @escaping (URL) -> Void
    ) {
        self.notesDict = notesDict
        self.initialKey = initialKey
        self.baseURL = baseURL
        self.onContentLink = onContentLink
        _history = State(initialValue: [initialKey])
    }

    private var currentKey: String { history.last ?? initialKey }
    private var current: NoteData? { notesDict[currentKey] }

    var body: some View {
        VStack(spacing: 0) {
            topBar
            Divider()
            if let note = current {
                NoteWebView(
                    html: note.html,
                    baseURL: baseURL,
                    onOpenNote: { key in
                        guard notesDict[key] != nil else { return }
                        withAnimation { history.append(key) }
                    },
                    onContentLink: { url in
                        // Dismiss first; let the outer view handle the
                        // actual navigation once the sheet is gone.
                        dismiss()
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                            onContentLink(url)
                        }
                    }
                )
            } else {
                Spacer()
                Text("Note not found: \(currentKey)")
                    .font(.callout)
                    .foregroundStyle(.secondary)
                Spacer()
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    @ViewBuilder
    private var topBar: some View {
        HStack {
            if history.count > 1 {
                Button {
                    withAnimation { _ = history.removeLast() }
                } label: {
                    Image(systemName: "chevron.backward")
                        .frame(width: 32, height: 32)
                }
            } else {
                Color.clear.frame(width: 32, height: 32)
            }
            Spacer(minLength: 8)
            Text(current?.title ?? "")
                .font(.headline)
                .lineLimit(1)
            Spacer(minLength: 8)
            Button { dismiss() } label: {
                Image(systemName: "xmark")
                    .frame(width: 32, height: 32)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(.thinMaterial)
    }
}

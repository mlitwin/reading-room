import SwiftUI

/// A sheet listing a book's full page tree, reconstructed from `nav.json`'s flat
/// `pages` array (indent = breadcrumb depth). The current page is highlighted
/// and scrolled into view on open. Tapping a row jumps there and dismisses.
struct BookTOCView: View {
    let pages: [NavEntry]
    let currentPath: String?
    let onSelect: (String) -> Void   // html path

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollViewReader { proxy in
                List(pages) { entry in
                    Button {
                        onSelect(entry.htmlPath)
                        dismiss()
                    } label: {
                        row(entry)
                    }
                    .listRowBackground(
                        entry.htmlPath == currentPath
                            ? Color.accentColor.opacity(0.15)
                            : Color.clear
                    )
                }
                .listStyle(.plain)
                .navigationTitle("Contents")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("Done") { dismiss() }
                    }
                }
                .onAppear {
                    guard let currentPath else { return }
                    // Defer one tick so the list has laid out before scrolling.
                    DispatchQueue.main.async {
                        proxy.scrollTo(currentPath, anchor: .center)
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func row(_ entry: NavEntry) -> some View {
        let depth = max(0, entry.breadcrumbs.count - 1)
        let isCurrent = entry.htmlPath == currentPath
        HStack(spacing: 8) {
            // Fixed-width marker so indentation stays aligned whether or not the
            // row is the current page.
            Circle()
                .fill(isCurrent ? Color.accentColor : .clear)
                .frame(width: 6, height: 6)
            Text(entry.title)
                .font(font(forDepth: depth))
                .fontWeight(isCurrent ? .semibold : .regular)
                .foregroundStyle(
                    isCurrent
                        ? AnyShapeStyle(Color.accentColor)
                        : (depth >= 2 ? AnyShapeStyle(.secondary) : AnyShapeStyle(.primary))
                )
            Spacer(minLength: 0)
        }
        .padding(.leading, CGFloat(depth) * 16)
        .padding(.vertical, 2)
        .contentShape(Rectangle())
    }

    private func font(forDepth depth: Int) -> Font {
        switch depth {
        case 0: return .headline
        case 1: return .body
        default: return .callout
        }
    }
}

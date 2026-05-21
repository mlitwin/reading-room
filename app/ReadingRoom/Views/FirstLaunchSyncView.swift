import SwiftUI

/// Shown on the very first launch while we populate the local mirror.
/// The library is unusable until at least `index.json` is on disk; this
/// view blocks entry to the library and offers a cancel button.
struct FirstLaunchSyncView: View {
    @Environment(SiteSync.self) private var siteSync
    let onReady: () -> Void

    var body: some View {
        VStack(spacing: 18) {
            Spacer()
            Image(systemName: "books.vertical")
                .font(.system(size: 64))
                .foregroundStyle(.tertiary)
            Text("Setting up the reading room")
                .font(.headline)
            if let err = siteSync.lastError {
                Text(err)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            } else if siteSync.isSyncing {
                ProgressView(value: siteSync.progress)
                    .progressViewStyle(.linear)
                    .frame(maxWidth: 240)
                Text("\(Int(siteSync.progress * 100))%")
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(.secondary)
            }
            Spacer()
            HStack(spacing: 16) {
                if siteSync.isSyncing {
                    Button("Cancel") { siteSync.cancel() }
                        .buttonStyle(.bordered)
                }
                if !siteSync.isSyncing && siteSync.lastError != nil {
                    Button("Retry") {
                        siteSync.sync()
                    }
                    .buttonStyle(.borderedProminent)
                }
                if siteSync.mirrorExists() {
                    Button("Continue") { onReady() }
                        .buttonStyle(.borderedProminent)
                }
            }
            .padding(.bottom, 32)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .task {
            // Kick off the initial sync if nothing is running yet.
            if !siteSync.isSyncing && !siteSync.mirrorExists() {
                siteSync.sync()
            }
        }
        .onChange(of: siteSync.mirrorExists()) { _, ready in
            if ready && !siteSync.isSyncing { onReady() }
        }
        .onChange(of: siteSync.isSyncing) { _, syncing in
            if !syncing && siteSync.mirrorExists() { onReady() }
        }
    }
}

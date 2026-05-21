import SwiftUI

@main
struct ReadingRoomApp: App {
    @State private var settings: SettingsStore
    @State private var library: LibraryStore
    @State private var siteSync: SiteSync

    init() {
        let s = SettingsStore()
        _settings = State(initialValue: s)
        _library = State(initialValue: LibraryStore(settings: s))
        // Force-try: failure is filesystem-level (can't create Application
        // Support) — unrecoverable for an offline-first app anyway.
        _siteSync = State(initialValue: try! SiteSync(baseURL: s.baseURL))
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(settings)
                .environment(library)
                .environment(siteSync)
        }
    }
}

/// Gate between "still doing first-launch sync" and "library is usable."
/// On every launch after the mirror exists, we go straight to the library
/// and run a background sync in parallel.
struct RootView: View {
    @Environment(SiteSync.self) private var siteSync
    @Environment(SettingsStore.self) private var settings
    @State private var mirrorReady: Bool

    init() {
        // Default — replaced on first body render via .task.
        _mirrorReady = State(initialValue: false)
    }

    var body: some View {
        Group {
            if mirrorReady {
                LibraryView()
            } else {
                FirstLaunchSyncView(onReady: { mirrorReady = true })
            }
        }
        .task {
            siteSync.setBaseURL(settings.baseURL)
            if siteSync.mirrorExists() {
                mirrorReady = true
                // Kick off a background refresh, never blocks.
                siteSync.sync()
            }
        }
    }
}

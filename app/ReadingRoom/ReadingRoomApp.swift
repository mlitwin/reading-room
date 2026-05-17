import SwiftUI

@main
struct ReadingRoomApp: App {
    @State private var settings: SettingsStore
    @State private var library: LibraryStore

    init() {
        let s = SettingsStore()
        _settings = State(initialValue: s)
        _library = State(initialValue: LibraryStore(settings: s))
    }

    var body: some Scene {
        WindowGroup {
            LibraryView()
                .environment(settings)
                .environment(library)
        }
    }
}

import Foundation
import Observation

@Observable
final class LibraryStore {
    enum LoadState {
        case idle
        case loading
        case loaded
        case failed(String)
    }

    var pieces: [Piece] = []
    var state: LoadState = .idle

    private let settings: SettingsStore

    init(settings: SettingsStore) {
        self.settings = settings
    }

    func refresh() async {
        state = .loading
        do {
            let client = ContentClient(baseURL: settings.baseURL)
            let index = try await client.fetchIndex()
            pieces = index.pieces
            state = .loaded
        } catch {
            state = .failed(error.localizedDescription)
        }
    }
}

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

    /// Reload the library from the on-disk mirror at `mirrorRoot`.
    /// Content comes from the local file system; the network is the
    /// SiteSync's concern.
    func refresh(from mirrorRoot: URL) async {
        state = .loading
        let indexPath = mirrorRoot.appendingPathComponent("index.json")
        do {
            let data = try Data(contentsOf: indexPath)
            let index = try JSONDecoder().decode(LibraryIndex.self, from: data)
            pieces = index.pieces
            state = .loaded
        } catch {
            state = .failed(error.localizedDescription)
        }
    }
}

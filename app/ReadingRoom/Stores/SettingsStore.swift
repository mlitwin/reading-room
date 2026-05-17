import Foundation
import Observation

@Observable
final class SettingsStore {
    static let defaultBaseURL = URL(string: "http://localhost:5173")!
    private static let baseURLKey = "ReadingRoom.baseURL"

    var baseURL: URL {
        didSet {
            UserDefaults.standard.set(baseURL.absoluteString, forKey: Self.baseURLKey)
        }
    }

    init() {
        if let s = UserDefaults.standard.string(forKey: Self.baseURLKey), let url = URL(string: s) {
            self.baseURL = url
        } else {
            self.baseURL = Self.defaultBaseURL
        }
    }
}

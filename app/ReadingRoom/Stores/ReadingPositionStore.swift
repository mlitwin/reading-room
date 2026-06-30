import Foundation

/// One reading position: the last page visited within a piece and the vertical
/// scroll offset on it. Persisted per piece slug so reopening resumes silently
/// where the reader left off.
struct ReadingPosition: Codable {
    let htmlPath: String
    let scrollY: Double
}

/// UserDefaults-backed map of `slug -> ReadingPosition`. Stored as one JSON blob
/// under a single key; small enough that read-modify-write on each save is fine.
enum ReadingPositionStore {
    private static let key = "ReadingRoom.readingPositions"

    private static func load() -> [String: ReadingPosition] {
        guard let data = UserDefaults.standard.data(forKey: key),
              let dict = try? JSONDecoder().decode([String: ReadingPosition].self, from: data)
        else { return [:] }
        return dict
    }

    static func position(forSlug slug: String) -> ReadingPosition? {
        load()[slug]
    }

    static func save(_ position: ReadingPosition, forSlug slug: String) {
        var dict = load()
        dict[slug] = position
        if let data = try? JSONEncoder().encode(dict) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }
}

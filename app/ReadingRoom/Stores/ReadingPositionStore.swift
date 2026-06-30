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

    // Slug of the piece the reader currently has open. Set when a piece appears,
    // cleared when it's popped back to the library. On launch, a non-nil value
    // means the app was last closed (backgrounded or killed) while reading —
    // so reopen straight into it.
    private static let lastOpenKey = "ReadingRoom.lastOpenSlug"

    static var lastOpenSlug: String? {
        get { UserDefaults.standard.string(forKey: lastOpenKey) }
        set {
            if let newValue {
                UserDefaults.standard.set(newValue, forKey: lastOpenKey)
            } else {
                UserDefaults.standard.removeObject(forKey: lastOpenKey)
            }
        }
    }
}

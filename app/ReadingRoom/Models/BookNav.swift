import Foundation

struct BookNav: Codable {
    let pages: [NavEntry]
    // True when the book has Latin passages — gates the 5 MB lexicon injection
    // so non-Latin books never pay the parse cost. Absent/old nav.json → false.
    let usesLatin: Bool

    enum CodingKeys: String, CodingKey {
        case pages
        case usesLatin = "uses_latin"
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        pages = try c.decode([NavEntry].self, forKey: .pages)
        usesLatin = (try? c.decodeIfPresent(Bool.self, forKey: .usesLatin) ?? false) ?? false
    }
}

struct NavEntry: Codable, Identifiable, Hashable {
    let slug: String
    let title: String
    let htmlPath: String
    let breadcrumbs: [Crumb]
    let prev: Crumb?
    let next: Crumb?

    var id: String { htmlPath }

    enum CodingKeys: String, CodingKey {
        case slug, title, breadcrumbs, prev, next
        case htmlPath = "html_path"
    }
}

struct Crumb: Codable, Hashable, Identifiable {
    let title: String
    let htmlPath: String

    var id: String { htmlPath }

    enum CodingKeys: String, CodingKey {
        case title
        case htmlPath = "html_path"
    }
}

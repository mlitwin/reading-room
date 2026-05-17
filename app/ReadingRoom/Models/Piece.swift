import Foundation

struct Piece: Identifiable, Codable, Hashable {
    let slug: String
    let title: String
    let author: String?
    let date: String?
    let tags: [String]
    let summary: String
    let htmlPath: String

    var id: String { slug }

    // A Book is a folder Piece rendered at `<slug>/index.html`; its nav.json
    // lives at `<slug>/nav.json`. Single-doc Pieces render at `<slug>.html`
    // and have no nav.json.
    var isBook: Bool { htmlPath.hasSuffix("/index.html") }

    enum CodingKeys: String, CodingKey {
        case slug, title, author, date, tags, summary
        case htmlPath = "html_path"
    }
}

struct LibraryIndex: Codable {
    let generatedAt: String?
    let pieces: [Piece]

    enum CodingKeys: String, CodingKey {
        case generatedAt = "generated_at"
        case pieces
    }
}

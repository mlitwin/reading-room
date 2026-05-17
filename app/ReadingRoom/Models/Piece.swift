import Foundation

struct Piece: Identifiable, Codable, Hashable {
    let slug: String
    let title: String
    let author: String?
    let date: String?
    let tags: [String]
    let summary: String
    let mdPath: String
    let htmlPath: String

    var id: String { slug }

    enum CodingKeys: String, CodingKey {
        case slug, title, author, date, tags, summary
        case mdPath = "md_path"
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

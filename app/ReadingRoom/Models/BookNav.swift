import Foundation

struct BookNav: Codable {
    let pages: [NavEntry]
    let notes: [String: NoteData]?
    let notesHtmlPath: String?

    enum CodingKeys: String, CodingKey {
        case pages, notes
        case notesHtmlPath = "notes_html_path"
    }
}

struct NoteData: Codable, Hashable {
    let title: String
    let html: String
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

import Foundation

struct ContentClient {
    let baseURL: URL

    func fetchIndex() async throws -> LibraryIndex {
        let url = baseURL.appendingPathComponent("index.json")
        let (data, response) = try await URLSession.shared.data(from: url)
        try Self.validate(response: response)
        return try JSONDecoder().decode(LibraryIndex.self, from: data)
    }

    func fetchNav(forBookSlug slug: String) async throws -> BookNav {
        let url = baseURL.appendingPathComponent(slug).appendingPathComponent("nav.json")
        let (data, response) = try await URLSession.shared.data(from: url)
        try Self.validate(response: response)
        return try JSONDecoder().decode(BookNav.self, from: data)
    }

    private static func validate(response: URLResponse) throws {
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
    }
}

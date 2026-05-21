import Foundation
import CryptoKit
import Observation

/// The asset manifest emitted by the generator. Lists every file under
/// `docs/` with a sha256 and size; consumed here to skip unchanged files.
struct AssetManifest: Codable {
    let generatedAt: String?
    let files: [ManifestEntry]

    enum CodingKeys: String, CodingKey {
        case generatedAt = "generated_at"
        case files
    }
}

struct ManifestEntry: Codable, Hashable {
    let path: String
    let sha256: String
    let size: Int
}

/// Owns the local mirror of the site (under Application Support) and the
/// background sync that keeps it up to date. The WebView reads from the
/// mirror only; the network is the sync's problem.
///
/// Concurrency: `@MainActor @Observable` so SwiftUI binds directly to its
/// state fields. Sync work happens inside `Task { ... }` that yields with
/// `await` for network I/O.
@MainActor
@Observable
final class SiteSync {
    let mirrorRoot: URL
    var baseURL: URL

    var isSyncing: Bool = false
    var progress: Double = 0
    var lastSyncDate: Date?
    var lastError: String?
    /// Book slugs whose update failed during the most recent sync.
    var partialFailures: [String] = []

    private var currentTask: Task<Void, Never>?

    init(baseURL: URL) throws {
        self.baseURL = baseURL
        let support = try FileManager.default.url(
            for: .applicationSupportDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        )
        self.mirrorRoot = support.appendingPathComponent("site-mirror", isDirectory: true)
        try FileManager.default.createDirectory(at: mirrorRoot, withIntermediateDirectories: true)
    }

    // MARK: - Public

    func setBaseURL(_ url: URL) {
        guard url != baseURL else { return }
        baseURL = url
    }

    /// Local file URL for a manifest path like "calculus-on-manifolds/index.html".
    func localURL(for path: String) -> URL {
        var url = mirrorRoot
        for component in path.split(separator: "/") {
            url = url.appendingPathComponent(String(component))
        }
        return url
    }

    /// True once the initial sync has populated the mirror — by convention,
    /// we mark this by the presence of `index.json`.
    func mirrorExists() -> Bool {
        FileManager.default.fileExists(atPath: localURL(for: "index.json").path)
    }

    /// Cancel any in-flight sync. The sync task respects cooperative
    /// cancellation: in-flight downloads abort, staging directories get
    /// cleaned up, already-swapped books remain in place.
    func cancel() {
        currentTask?.cancel()
    }

    /// Start a sync. Re-entrant: if a sync is in flight it gets cancelled
    /// and replaced. Errors surface in `lastError`; this method never throws.
    @discardableResult
    func sync() -> Task<Void, Never> {
        currentTask?.cancel()
        let task = Task { [weak self] in
            guard let self else { return }
            await self.performSync()
        }
        currentTask = task
        return task
    }

    // MARK: - Implementation

    private func performSync() async {
        isSyncing = true
        progress = 0
        lastError = nil
        partialFailures = []
        defer {
            isSyncing = false
            progress = 0
            currentTask = nil
        }

        do {
            try Task.checkCancellation()

            // 1. Fetch the new manifest.
            let newManifest = try await fetchManifest()
            try Task.checkCancellation()

            // 2. Compute which entries need downloading.
            let oldManifest = loadOldManifest()
            let downloads = computeDownloads(new: newManifest, old: oldManifest)
            let total = downloads.count

            // 3. Group everything by book / site for atomic-per-book swaps.
            let allByBook = groupByBook(newManifest.files)
            let downloadsByBook = groupByBook(downloads)

            var completed = 0
            let onFile: @MainActor () -> Void = { [weak self] in
                completed += 1
                if total > 0 {
                    self?.progress = Double(completed) / Double(total)
                }
            }

            // 4. Process per-book groups first; site-level last (so index.json
            //    is never written before its books are in place).
            for (slug, downloadEntries) in downloadsByBook
                where slug != nil && !downloadEntries.isEmpty
            {
                try Task.checkCancellation()
                do {
                    try await processBook(
                        slug: slug!,
                        bookEntries: allByBook[slug] ?? [],
                        downloads: downloadEntries,
                        onFile: onFile
                    )
                } catch is CancellationError {
                    throw CancellationError()
                } catch {
                    partialFailures.append(slug!)
                }
            }

            // 5. Site-level files (index.json, assets/*, top-level pieces).
            //    These are independent; replace each individually. Save
            //    index.json last so the library never advertises a book that
            //    isn't yet on disk.
            if let siteEntries = downloadsByBook[nil] {
                try Task.checkCancellation()
                let (indexEntries, otherEntries) = siteEntries.partitioned(by: { $0.path == "index.json" })
                try await processSiteFiles(otherEntries, onFile: onFile)
                try await processSiteFiles(indexEntries, onFile: onFile)
            }

            // 6. Save the new manifest alongside the mirror so the next
            //    sync can detect what changed.
            try saveManifest(newManifest)

            lastSyncDate = Date()
        } catch is CancellationError {
            lastError = nil  // user-initiated cancel isn't an error to surface
        } catch {
            lastError = error.localizedDescription
        }
    }

    private func fetchManifest() async throws -> AssetManifest {
        let url = baseURL.appendingPathComponent("assets.json")
        let (data, response) = try await URLSession.shared.data(from: url)
        try validate(response: response)
        return try JSONDecoder().decode(AssetManifest.self, from: data)
    }

    private func computeDownloads(new: AssetManifest, old: AssetManifest?) -> [ManifestEntry] {
        let oldByPath = Dictionary(uniqueKeysWithValues: (old?.files ?? []).map { ($0.path, $0) })
        var out: [ManifestEntry] = []
        for entry in new.files {
            let localPath = localURL(for: entry.path)
            let onDisk = FileManager.default.fileExists(atPath: localPath.path)
            if !onDisk {
                out.append(entry)
                continue
            }
            // Manifest says unchanged AND file exists → trust it.
            if let oldEntry = oldByPath[entry.path], oldEntry.sha256 == entry.sha256 {
                continue
            }
            // Manifest changed or no prior manifest — hash the local file.
            if let data = try? Data(contentsOf: localPath),
               Self.sha256(of: data) == entry.sha256 {
                continue
            }
            out.append(entry)
        }
        return out
    }

    private func groupByBook(_ entries: [ManifestEntry]) -> [String?: [ManifestEntry]] {
        var groups: [String?: [ManifestEntry]] = [:]
        for entry in entries {
            if isSiteLevel(entry.path) {
                groups[nil, default: []].append(entry)
            } else {
                let slug = String(entry.path.prefix(while: { $0 != "/" }))
                groups[slug, default: []].append(entry)
            }
        }
        return groups
    }

    private func isSiteLevel(_ path: String) -> Bool {
        path == "index.json"
            || path == "assets.json"
            || path.hasPrefix("assets/")
            || !path.contains("/")     // single-doc piece at root
    }

    private func processBook(
        slug: String,
        bookEntries: [ManifestEntry],
        downloads: [ManifestEntry],
        onFile: @MainActor () -> Void
    ) async throws {
        let stagingDir = mirrorRoot.appendingPathComponent("\(slug).staging", isDirectory: true)
        try? FileManager.default.removeItem(at: stagingDir)
        try FileManager.default.createDirectory(at: stagingDir, withIntermediateDirectories: true)
        // Cleanup if we throw before the swap.
        var swapped = false
        defer {
            if !swapped { try? FileManager.default.removeItem(at: stagingDir) }
        }

        let liveBookDir = mirrorRoot.appendingPathComponent(slug, isDirectory: true)
        let downloadPaths = Set(downloads.map { $0.path })
        let slugPrefixLen = slug.count + 1  // "<slug>/"

        for entry in bookEntries {
            try Task.checkCancellation()
            let bookRel = String(entry.path.dropFirst(slugPrefixLen))
            let destURL = stagingDir.appendingPathComponent(bookRel)
            try FileManager.default.createDirectory(
                at: destURL.deletingLastPathComponent(),
                withIntermediateDirectories: true
            )

            if downloadPaths.contains(entry.path) {
                let data = try await downloadFile(at: entry.path)
                try data.write(to: destURL)
                onFile()
            } else {
                // Unchanged — copy from current live mirror.
                let liveSrc = liveBookDir.appendingPathComponent(bookRel)
                if FileManager.default.fileExists(atPath: liveSrc.path) {
                    try FileManager.default.copyItem(at: liveSrc, to: destURL)
                } else {
                    // Corrupt mirror — download as fallback.
                    let data = try await downloadFile(at: entry.path)
                    try data.write(to: destURL)
                    onFile()
                }
            }
        }

        // Atomic swap.
        if FileManager.default.fileExists(atPath: liveBookDir.path) {
            _ = try FileManager.default.replaceItemAt(liveBookDir, withItemAt: stagingDir)
        } else {
            try FileManager.default.moveItem(at: stagingDir, to: liveBookDir)
        }
        swapped = true
    }

    private func processSiteFiles(_ entries: [ManifestEntry], onFile: @MainActor () -> Void) async throws {
        for entry in entries {
            try Task.checkCancellation()
            let destURL = localURL(for: entry.path)
            try FileManager.default.createDirectory(
                at: destURL.deletingLastPathComponent(),
                withIntermediateDirectories: true
            )
            let data = try await downloadFile(at: entry.path)
            try data.write(to: destURL, options: .atomic)
            onFile()
        }
    }

    private func downloadFile(at path: String) async throws -> Data {
        let url = baseURL.appendingPathComponent(path)
        let (data, response) = try await URLSession.shared.data(from: url)
        try validate(response: response)
        return data
    }

    private func validate(response: URLResponse) throws {
        guard let http = response as? HTTPURLResponse,
              (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
    }

    private func loadOldManifest() -> AssetManifest? {
        guard let data = try? Data(contentsOf: localURL(for: "assets.json")) else { return nil }
        return try? JSONDecoder().decode(AssetManifest.self, from: data)
    }

    private func saveManifest(_ manifest: AssetManifest) throws {
        let url = localURL(for: "assets.json")
        try FileManager.default.createDirectory(
            at: url.deletingLastPathComponent(),
            withIntermediateDirectories: true
        )
        let data = try JSONEncoder().encode(manifest)
        try data.write(to: url, options: .atomic)
    }

    private static func sha256(of data: Data) -> String {
        SHA256.hash(data: data).reduce(into: "") { $0 += String(format: "%02x", $1) }
    }
}

// MARK: - Helpers

private extension Array {
    /// Splits the array into elements matching `predicate` and the rest.
    func partitioned(by predicate: (Element) -> Bool) -> (matching: [Element], rest: [Element]) {
        var matching: [Element] = []
        var rest: [Element] = []
        for e in self {
            if predicate(e) { matching.append(e) } else { rest.append(e) }
        }
        return (matching, rest)
    }
}

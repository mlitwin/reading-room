import SwiftUI

struct SettingsView: View {
    @Environment(SettingsStore.self) private var settings
    @Environment(LibraryStore.self) private var library
    @Environment(SiteSync.self) private var siteSync
    @Environment(\.dismiss) private var dismiss

    @State private var baseURLString: String = ""

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Base URL", text: $baseURLString)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled(true)
                    Button("Reset to default") {
                        baseURLString = SettingsStore.defaultBaseURL.absoluteString
                    }
                } header: {
                    Text("Source")
                } footer: {
                    Text("Where the app fetches index.json and markdown from. Default: \(SettingsStore.defaultBaseURL.absoluteString)")
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }
                }
            }
            .onAppear { baseURLString = settings.baseURL.absoluteString }
        }
    }

    private func save() {
        if let url = URL(string: baseURLString) {
            settings.baseURL = url
            siteSync.setBaseURL(url)
            Task {
                await siteSync.sync().value
                await library.refresh(from: siteSync.mirrorRoot)
            }
        }
        dismiss()
    }
}

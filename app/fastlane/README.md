fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios generate

```sh
[bundle exec] fastlane ios generate
```

Regenerate Xcode project from project.yml via XcodeGen

### ios bootstrap_app_id

```sh
[bundle exec] fastlane ios bootstrap_app_id
```

Create the app identifier on the Developer Portal and a matching ASC record (idempotent)

### ios bootstrap_profile

```sh
[bundle exec] fastlane ios bootstrap_profile
```

Ensure a Distribution cert and App Store provisioning profile exist (idempotent)

### ios bootstrap

```sh
[bundle exec] fastlane ios bootstrap
```

One-time bootstrap: app id + cert + provisioning profile

### ios archive

```sh
[bundle exec] fastlane ios archive
```

Archive iOS app (Release) -> build/ReadingRoom.ipa

### ios alpha

```sh
[bundle exec] fastlane ios alpha
```

Build Release and upload to TestFlight

### ios generate_release_notes

```sh
[bundle exec] fastlane ios generate_release_notes
```

Write fastlane/ReleaseNotes.md from `git log <last-tag>..HEAD`

### ios bump_patch

```sh
[bundle exec] fastlane ios bump_patch
```

Bump patch version + build number, commit, tag

### ios bump_minor

```sh
[bundle exec] fastlane ios bump_minor
```

Bump minor version + build number, commit, tag

### ios bump_major

```sh
[bundle exec] fastlane ios bump_major
```

Bump major version + build number, commit, tag

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).

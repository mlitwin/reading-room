PROJECT ?= ReadingRoom.xcodeproj
SCHEME ?= ReadingRoom
SIMULATOR ?= iPhone 16
OS ?= 18.5
DEST ?= platform=iOS Simulator,name=$(SIMULATOR),OS=$(OS)
CONFIGURATION ?= Debug
BUNDLE_ID ?= org.antoninus.readingroom.app
DERIVED_DATA ?= ./build/DerivedData
APP_PATH := $(DERIVED_DATA)/Build/Products/$(CONFIGURATION)-iphonesimulator/ReadingRoom.app

# Lazily resolve a simulator UDID matching SIMULATOR + OS. Recursive (`=`) so it
# doesn't run during plain `make help`.
SIM_UDID = $(shell xcrun simctl list devices available -j 2>/dev/null | \
  python3 -c "import json,sys; data=json.load(sys.stdin); rt='com.apple.CoreSimulator.SimRuntime.iOS-$(subst .,-,$(OS))'; print(next((d['udid'] for d in data['devices'].get(rt,[]) if d['name']=='$(SIMULATOR)' and d.get('isAvailable',True)), ''))" 2>/dev/null)

OP_RUN ?= op run --env-file apple.env --

.PHONY: help generate build boot install launch run simulators clean \
        install-fastlane bootstrap bootstrap-app-id bootstrap-profile \
        fastlane-archive fastlane-alpha \
        prep-alpha prep-patch prep-minor prep-major

.DEFAULT_GOAL := help

help:
	@echo "Local dev:"
	@echo "  generate          Regenerate $(PROJECT) from project.yml (xcodegen)"
	@echo "  build             Build $(SCHEME) for the simulator"
	@echo "  boot              Boot $(SIMULATOR) (iOS $(OS)) and open Simulator.app"
	@echo "  install           build + boot + install the app on the simulator"
	@echo "  launch            Launch the installed app"
	@echo "  run               build + boot + install + launch"
	@echo "  simulators        List available iPhone simulators"
	@echo "  clean             Remove build/ and the generated $(PROJECT)"
	@echo ""
	@echo "Fastlane (one-time setup):"
	@echo "  install-fastlane  bundle install"
	@echo "  bootstrap         Create app id + cert + provisioning profile"
	@echo "  bootstrap-app-id  Create the Developer Portal id + ASC record"
	@echo "  bootstrap-profile Ensure Distribution cert + App Store profile exist"
	@echo ""
	@echo "Release:"
	@echo "  fastlane-archive  Build Release IPA locally (no creds needed)"
	@echo "  fastlane-alpha    Build + upload to TestFlight"
	@echo "  prep-alpha        Generate release notes, commit, bump patch + tag"
	@echo "  prep-patch / prep-minor / prep-major   Version bump + tag"
	@echo ""
	@echo "Variables (override with VAR=value): SIMULATOR, OS, CONFIGURATION"

generate:
	@command -v xcodegen >/dev/null 2>&1 || { echo "Error: xcodegen not found. Install with: brew install xcodegen" >&2; exit 127; }
	@xcodegen generate
	@echo "Generated $(PROJECT)"

build: generate
	@echo "Building $(SCHEME) for $(SIMULATOR) (iOS $(OS))..."
	@xcodebuild build \
		-project $(PROJECT) \
		-scheme $(SCHEME) \
		-configuration $(CONFIGURATION) \
		-destination "$(DEST)" \
		-derivedDataPath $(DERIVED_DATA) \
		CODE_SIGNING_ALLOWED=NO

boot:
	@if [ -z "$(SIM_UDID)" ]; then echo "Error: no simulator matching SIMULATOR=\"$(SIMULATOR)\", OS=$(OS). Try: make simulators" >&2; exit 1; fi
	@xcrun simctl boot "$(SIM_UDID)" 2>/dev/null || true
	@open -a Simulator
	@xcrun simctl bootstatus "$(SIM_UDID)" >/dev/null

install: build boot
	@xcrun simctl install "$(SIM_UDID)" "$(APP_PATH)"

launch: install
	@xcrun simctl launch "$(SIM_UDID)" $(BUNDLE_ID)

run: launch
	@echo "Launched $(BUNDLE_ID) on $(SIMULATOR) (UDID $(SIM_UDID))"

simulators:
	@xcrun simctl list devices available | grep -i iphone

clean:
	@rm -rf build $(PROJECT)
	@echo "Cleaned build/ and $(PROJECT)"

# --- Fastlane ---------------------------------------------------------------

install-fastlane:
	bundle config set --local path 'vendor/bundle'
	bundle install

bootstrap-app-id:
	$(OP_RUN) bundle exec fastlane bootstrap_app_id

bootstrap-profile:
	$(OP_RUN) bundle exec fastlane bootstrap_profile

bootstrap:
	$(OP_RUN) bundle exec fastlane bootstrap

fastlane-archive:
	bundle exec fastlane archive

fastlane-alpha:
	$(OP_RUN) bundle exec fastlane alpha

prep-alpha:
	bundle exec fastlane generate_release_notes
	@echo "📄 Review fastlane/ReleaseNotes.md above before continuing."
	git add fastlane/ReleaseNotes.md
	git commit -m "Update release notes for alpha"
	bundle exec fastlane bump_patch

prep-patch:
	bundle exec fastlane bump_patch

prep-minor:
	bundle exec fastlane bump_minor

prep-major:
	bundle exec fastlane bump_major

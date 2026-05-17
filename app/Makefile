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

.PHONY: help generate build boot install launch run simulators clean

.DEFAULT_GOAL := help

help:
	@echo "Targets:"
	@echo "  generate    Regenerate $(PROJECT) from project.yml (xcodegen)"
	@echo "  build       Build $(SCHEME) for the simulator"
	@echo "  boot        Boot $(SIMULATOR) (iOS $(OS)) and open Simulator.app"
	@echo "  install     build + boot + install the app on the simulator"
	@echo "  launch      Launch the installed app"
	@echo "  run         build + boot + install + launch"
	@echo "  simulators  List available iPhone simulators"
	@echo "  clean       Remove build/ and the generated $(PROJECT)"
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

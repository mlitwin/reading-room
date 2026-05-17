# Reading Room

Personal markdown reading material, rendered as a static site and as a custom iOS app reader.

**Live site:** https://antoninus.org/reading-room/

The site is served by GitHub Pages out of `docs/`. The same `index.json` and raw `.md` files that drive the web reader are also what the iOS app pulls from.

See [plan.md](./plan.md) for the design overview.

## Layout

```
content/        markdown sources (the canonical content)
site/
  generator/    Node ESM build (build.js, serve.js, templates/)
  reader/       CSS for the rendered pages
docs/           generated output, served by GitHub Pages — committed, do not hand-edit
app/            iOS reader app (XcodeGen + SwiftUI)
```

## Site

```
make install    # one-time, installs the generator's npm deps
make build      # rebuild docs/ from content/
make serve      # watch content/ and reader/, rebuild + serve at http://localhost:5173
make clean      # remove docs/
```

Adding a piece: drop a markdown file into `content/` with YAML front matter (`title`, `author`, `date`, `tags`, `summary`), then `make build` and commit both `content/` and `docs/`. The dev server has CORS open so the iOS simulator can read from it directly.

## iOS app

Requires Xcode + `xcodegen` (`brew install xcodegen`). The app talks to whatever URL is set in Settings; the default is `http://localhost:5173`, so leave `make serve` running in another shell during development.

```
cd app
make generate   # regenerate ReadingRoom.xcodeproj from project.yml
make build      # build for the simulator
make run        # build, boot the simulator, install, launch
make simulators # list available simulators
make clean      # remove build/ and the generated .xcodeproj
```

Override the target simulator with `make run SIMULATOR="iPhone 16 Pro" OS=18.5`. The project includes an ATS exception for `localhost` so the simulator can hit the local dev server over plain HTTP.

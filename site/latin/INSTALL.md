# site/latin — Morpheus install

The Latin pipeline shells out to a local build of the [perseids-tools/morpheus](https://github.com/perseids-tools/morpheus) fork through `site/latin/morpheus.sh`. The build lives outside this repo as a sibling clone alongside `whitakers_words/` and `reading-room/`.

Confirmed on macOS Tahoe 15 (Darwin 25) / Apple clang 21 / Apple Silicon.

## Prerequisites

```sh
xcode-select --install   # if you don't already have the command-line tools
brew install flex        # for libfl, needed by Morpheus's lexer
```

## Clone

```sh
cd ~/Dev/github.com/mlitwin
git clone https://github.com/perseids-tools/morpheus.git
```

## Build the C binaries

```sh
cd ~/Dev/github.com/mlitwin/morpheus/src
export LIBRARY_PATH="$(brew --prefix flex)/lib:$LIBRARY_PATH"
make clean
CFLAGS='-std=gnu89 -Wno-return-type -Wno-implicit-function-declaration -Wno-incompatible-function-pointer-types -I../includes' make LOADLIBES='-ll'
make install
```

The README in `perseids-tools/morpheus` lists the first two `-Wno-*` flags. The third — `-Wno-incompatible-function-pointer-types` — is needed for clang 21 (which is stricter than the clang 14 the upstream tested against). Without it the build fails on a `qsort` callback pointer in `genwd.c`.

## Build the Latin stem index

```sh
cd ~/Dev/github.com/mlitwin/morpheus/stemlib/Latin
PATH="$PATH:../../bin" MORPHLIB='..' make
PATH="$PATH:../../bin" MORPHLIB='..' make    # the upstream README says to run twice
```

The second run resolves some derivation-table dependencies that the first run only stages.

## Smoke test

From the `reading-room` repo root:

```sh
echo mutastis | site/latin/morpheus.sh
```

Expected:

```
mutastis
<NL>V mu_tastis,muto#1  perf ind act 2nd pl		contr	avperf,are_vb</NL>
```

The `contr` tag marks the syncopated 1st-conj perfect that Whitaker's misses; `#1` distinguishes homograph lemmas (e.g. `dico#1` "dedicate" vs `dico#2` "say"). The wrapper validates the build before each call and emits a helpful pointer back to this page if anything is missing.

## Pointing the wrapper somewhere else

`morpheus.sh` defaults to `~/Dev/github.com/mlitwin/morpheus`. To use a different build location, override the environment:

```sh
MORPHEUS_ROOT=/some/other/path echo mutastis | site/latin/morpheus.sh
```

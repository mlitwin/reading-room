#!/usr/bin/env bash
# morpheus.sh — single entry point for Morpheus Latin morphology calls.
#
# Reads Latin tokens on stdin (one per line), writes Morpheus's raw <NL>
# analysis blocks to stdout. Wraps the perseids-tools/morpheus build at
# ~/Dev/github.com/mlitwin/morpheus (sibling repo to reading-room).
#
# Usage:
#   echo "mutastis" | site/latin/morpheus.sh
#   printf "mutastis\nanimus\nprimaque\n" | site/latin/morpheus.sh
#
# All Morpheus invocations from the reading-room build system go through
# this script so the project's permission grants and the path/env wiring
# live in one place.
set -euo pipefail

MORPHEUS_ROOT="${MORPHEUS_ROOT:-$HOME/Dev/github.com/mlitwin/morpheus}"
CRUNCHER="$MORPHEUS_ROOT/bin/cruncher"
STEMLIB="$MORPHEUS_ROOT/stemlib"

if [[ ! -x "$CRUNCHER" ]]; then
  echo "morpheus.sh: cruncher not found at $CRUNCHER" >&2
  echo "morpheus.sh: see site/latin/INSTALL.md for build instructions" >&2
  exit 1
fi
if [[ ! -d "$STEMLIB/Latin/steminds" ]]; then
  echo "morpheus.sh: Latin stem indices missing at $STEMLIB/Latin/steminds" >&2
  echo "morpheus.sh: run the stemlib bootstrap from site/latin/INSTALL.md" >&2
  exit 1
fi

exec env MORPHLIB="$STEMLIB" "$CRUNCHER" -S -L

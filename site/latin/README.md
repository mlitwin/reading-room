# site/latin

Seed tooling for the Ovid Metamorphoses book. Runs Whitaker's Words (Python
port — https://github.com/blagae/whitakers_words) on a Latin passage and
emits a draft `<div class="latin-passage">` block. Output is hand-curated by
the author before being dropped into the passage markdown.

## Setup

Whitaker's lives outside this repo, at `~/Dev/github.com/mlitwin/whitakers_words`:

```sh
cd ~/Dev/github.com/mlitwin
git clone https://github.com/blagae/whitakers_words.git
```

Then create the local venv with the build-time deps pinned (pkg_resources was
removed from setuptools 81; whitakers_words needs the older API):

```sh
cd site/latin
python3 -m venv .venv
source .venv/bin/activate
pip install 'setuptools<81'
# One-time: generate Whitaker's lookup tables
cd ~/Dev/github.com/mlitwin/whitakers_words
python3 -c "from whitakers_words.datagenerator import generate_all_dicts; generate_all_dicts()"
```

## Use

```sh
cd site/latin && source .venv/bin/activate
echo "In nova fert animus mutatas dicere formas" | python3 seed.py
```

See `seed.py` docstring for output format and the v0 limitations the
author should expect to fix during curation.

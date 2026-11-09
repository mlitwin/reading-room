# Content license

Copyright (c) 2026 Matthew Litwin, and the third-party sources listed below.

Unless a file or directory states otherwise, the following are licensed under
the **Creative Commons Attribution-ShareAlike 4.0 International License**
(CC BY-SA 4.0), <https://creativecommons.org/licenses/by-sa/4.0/>
(legal code: <https://creativecommons.org/licenses/by-sa/4.0/legalcode>):

- `content/` — texts, translations, notes, commentary, and the Latin language
  data (`content/_language/latin/`: grammar, lexicon, reference grammar; book
  `vocabulary/` overlays; manuscript and correspondence JSON)
- `docs/` — the generated site, including its data assets (lexicon, glossary,
  concordances, reference-grammar pages and notes); the reader code bundled
  into `docs/` remains under the MIT license in `LICENSE`
- `site/latin/sources/` — vendored and derived source data

You may share and adapt this material for any purpose, provided you give
appropriate credit (to this project and to the sources below), indicate if
changes were made, and distribute your contributions under the same license.

The software (generator, reader, pipeline scripts, iOS app) is licensed
separately under the MIT license; see `LICENSE`. The share-alike terms here
apply to the content and data, not to the code that processes them.

## Third-party sources and attribution

Works in the public domain remain so; the licenses below apply to the digital
editions, markup, and derived data.

- **Ovid, *Metamorphoses*** — Latin text and the English translation by Brookes
  More (1922), from the Perseus Digital Library TEI editions
  (`phi0959.phi006.perseus-lat2`, `phi0959.phi006.perseus-eng3`), Trustees of
  Tufts University, with funding from the National Endowment for the
  Humanities. Underlying texts public domain; Perseus markup CC BY-SA.
  <https://www.perseus.tufts.edu/>
- **Allen and Greenough, *New Latin Grammar*** (Ginn & Co., 1903) — Perseus
  Digital Library TEI edition, with corrections by Dickinson College
  Commentaries (2013–2016). Underlying text public domain; markup CC BY-SA.
  Source of `content/_language/latin/reference-grammar.json` and the reference
  grammar pages.
- **Lewis and Short, *A Latin Dictionary*** (1879) — Perseus Digital Library
  XML, as converted to JSON by IohannesArnold/lewis-short-json
  (<https://github.com/IohannesArnold/lewis-short-json>). Underlying text public
  domain; Perseus markup CC BY-SA. Used for gloss curation.
- **Wiktionary** — Latin entries from English Wiktionary
  (<https://en.wiktionary.org/>), CC BY-SA 4.0, by Wiktionary contributors;
  extracted with wiktextract and published at <https://kaikki.org/>
  (Tatu Ylonen, "Wiktextract: Wiktionary as Machine-Readable Structured Data",
  LREC 2022). Source of `site/latin/sources/wiktionary-cache.json`.
- **Whitaker's WORDS** — dictionary and inflection data by William Whitaker,
  via the Python reimplementation blagae/whitakers_words (MIT License);
  used to generate lexicon paradigms and glosses.
  <https://github.com/blagae/whitakers_words>
- **Morpheus** — morphological analyses cached in
  `site/latin/sources/morpheus-cache.json`, produced with the Perseus Morpheus
  analyzer (perseids-tools/morpheus, <https://github.com/perseids-tools/morpheus>).
- **Andrew Marvell, "Hortus" and "The Garden"** — from *Miscellaneous Poems*
  (1681), public domain, transcribed via Wikisource.
- **App icon** (`art/app-icon/`) — reverse of a silver tetradrachm of
  Ptolemy II, American Numismatic Society accession 1944.100.76124; image
  public domain. <https://numismatics.org/collection/1944.100.76124>

## Attribution for reuse

When redistributing or adapting this content, a credit line such as the
following satisfies the attribution requirement for this project:

> Reading Room content © Matthew Litwin, CC BY-SA 4.0; includes material from
> the Perseus Digital Library, Dickinson College Commentaries, and Wiktionary
> (CC BY-SA). <https://antoninus.org/reading-room/>

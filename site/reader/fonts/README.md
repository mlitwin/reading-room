# Reader fonts

**Charis** 7.000 (SIL Global), the site's text face: prose, Latin passages,
cards and paradigms, the Reference Grammar, and IPA. It covers every
character the Latin content uses — macrons, breves stacked on macrons,
the IPA in the pronunciation lines (t͡ʃ, kae̯, ɫ, ɲ, ʷ, ʰ), and the Roman
numeral signs ↀ Ↄ — the same on web, macOS, and iOS. iOS ships none of
the IPA-capable fonts by default, so without this the reader fell back
glyph by glyph to whatever the system had.

- Source: https://github.com/silnrsi/font-charis/releases/tag/v7.000,
  `Charis-7.000.zip` (sha256 `e3237b1303c5d31af8f59b1d1914886c5e873b77c71390e4742fb3bc1c187666`),
  files from its `web/` folder.
- **Unmodified.** The OFL reserves the names "Charis" and "SIL"; a subset is
  a Modified Version that must be renamed (OFL-FAQ 2.6). We ship SIL's own
  WOFF2 files as released so the name stays. Four faces: Regular, Italic,
  Bold, BoldItalic (CSS weight 600 resolves to Bold).
- License: SIL Open Font License 1.1 — `OFL.txt` must travel with the fonts.

The build copies this folder to `docs/assets/fonts/` (beside KaTeX's fonts);
`site/reader/css/00-fonts.css` declares the faces and the `--font-text` stack.

**Greek, later:** Charis has only basic Greek (no polytonic). When Greek
text arrives, add Gentium 7 (SIL, same license and RFN rules) here as a
second `@font-face` family with a Greek `unicode-range`; `--font-text`
already lists `"Gentium"` after `"Charis"`, so Greek characters will fall
through to it with no other change.

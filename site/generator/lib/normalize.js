// Surface normalization for the language pipeline.
//
// Applied identically across:
//   - glossary keys (build-glossary.js)
//   - concordance surfaces (build-concordance.js)
//   - markdown span contents at extraction time
//
// Invariant C7. Any divergence between producers and consumers will silently
// break C1 (token surface → glossary entry) lookups.

/**
 * Normalize a Latin word form for surface-matching.
 *  - Unicode-decompose then strip combining diacritics (macron, breve, ogonek, etc.)
 *  - Lowercase
 *  - Fold j → i, v → u (orthographic vowel/consonant unification)
 *  - Assimilate "in" → "im" before {b, m, p} (Latin orthographic convention:
 *    inmensa = immensa, inminet = imminet, inpia = impia). Classical
 *    inscriptions and manuscripts mix both spellings; modernized editions
 *    use "im", but Ovid's text often retains "in". Folded here so the
 *    glossary doesn't need to store both surfaces.
 *
 * Punctuation is *not* stripped here — tokenization removes that earlier.
 * Leading hyphen is preserved (enclitic forms like "-que" keep the marker
 * for invariant C10's substring check).
 *
 * @param {string} word
 * @returns {string}
 */
export function normalizeSurface(word) {
  if (typeof word !== 'string') {
    throw new TypeError(`normalizeSurface: expected string, got ${typeof word}`);
  }
  const noDiacritics = word.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const lower = noDiacritics.toLowerCase();
  const ju = lower.replace(/j/g, 'i').replace(/v/g, 'u');
  // Word-initial Latin prefix-assimilation normalization. Manuscripts and
  // modern editions mix the assimilated and unassimilated spellings; fold
  // everything to the assimilated form so the glossary doesn't need to store
  // both (and lemma_ids can keep their etymological prefix).
  //   in-[bmp]  → im-[bmp]  (inmensus → immensus, inpia → impia)
  //   in-[lr]   → il-l / ir-r (inludere → illudere, inrigare → irrigare)
  //   ad-{cfglnprst} → assimilated double (adfert → affert, adsumo → assumo)
  //   ex-f      → eff           (exfodit → effodit)
  //   ob-[cfgp] → assimilated   (obcurro → occurro, obfero → offero)
  //   sub-[cfgmp] → assimilated (subfero → suffero, submitto → summitto)
  //   con-[lr]  → assimilated   (conligo → colligo, conrumpo → corrumpo)
  return ju
    .replace(/^in([bmp])/, 'im$1')
    .replace(/^in([lr])/, 'i$1$1')
    .replace(/^ad([cfglnprst])/, 'a$1$1')
    .replace(/^exf/, 'eff')
    .replace(/^ob([cfgp])/, 'o$1$1')
    .replace(/^sub([cfgmp])/, 'su$1$1')
    .replace(/^con([lr])/, 'co$1$1')
    .replace(/^con([bmp])/, 'com$1');
}

// Recognized Latin enclitic suffixes for the C10 invariant. Restricted to the
// two suffixes that don't collide with regular Latin inflection:
//   -que : never appears as a non-enclitic word ending in classical Latin
//   -ve  : rare collision (a handful of nouns end in -ve, all attestable)
//
// "-ne" is intentionally excluded despite being a real enclitic. Far too many
// inflected forms end in -ne (ablative singulars in -ne, vocative singulars
// like "domine", words like "origine", "margine") — a substring-only check
// produces overwhelming false positives. Distinguishing enclitic -ne from
// inflectional -ne requires lexical context; that belongs in editorial work,
// not a structural invariant.
//
// "-cum" is similarly excluded: it only attaches to personal pronouns
// (mecum, tecum, secum) and surface-detecting that without context is noisy.
export const ENCLITIC_SUFFIXES = ['que', 've'];

/**
 * Returns the enclitic suffix found at the end of `word`, or null. Operates on
 * already-normalized input (so callers should run normalizeSurface first).
 *
 * Filters out short words that *are* enclitics standing alone (e.g. "que" as
 * the bare enclitic token has length 3 and ends in "que" trivially).
 *
 * @param {string} normalized
 * @returns {string | null}
 */
export function findUnsplitEnclitic(normalized) {
  for (const suf of ENCLITIC_SUFFIXES) {
    if (normalized.length > suf.length && normalized.endsWith(suf)) {
      return suf;
    }
  }
  return null;
}

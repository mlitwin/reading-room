// Parse-atom closure helper — shared by L10 / Gl6 / C12.
//
// The parse-code vocabulary is grammar.json: every atom appearing in a dotted
// parse code (lexicon cell keys, glossary/concordance candidate parses) must
// be a grammar category value id, a fused person+number code (1sg … 3pl), or
// an explicitly allowlisted marker. This is the invariant that keeps the data
// from drifting away from what the card UI can label and link (an unmapped
// atom renders as a dead, unlinked chip).

// Markers that are not grammatical atoms but legitimately appear in parses:
//   inv     — indeclinable, from noParadigmParse()
//   enclit  — id-suffix spelling of pos "enclitic" (markdown span convention)
//   alt     — suppletive / alternate-form surface marker
//   unk     — unresolved first-pass analysis (unknown_adv backlog; Phase 2
//             of development/latin-support-analysis.md retires this)
//   n, v    — id-suffix codes emitted by noParadigmParse() for paradigmless
//             lemmata reclassified to another POS (ceu_n → adv keeps "n")
export const MARKER_ATOMS = new Set(['inv', 'enclit', 'alt', 'unk', 'n', 'v']);

/**
 * Build the set of valid parse atoms from grammar.json.
 * @param {import('../schema/language.schema.js').Grammar} grammar
 * @returns {Set<string>}
 */
export function grammarAtomSet(grammar) {
  const atoms = new Set(MARKER_ATOMS);
  const byCat = new Map(grammar.categories.map((c) => [c.id, c.values]));
  for (const values of byCat.values()) {
    for (const v of values) atoms.add(v.id);
  }
  for (const p of byCat.get('person') ?? []) {
    for (const n of byCat.get('number') ?? []) atoms.add(p.id + n.id);
  }
  return atoms;
}

/**
 * Return the atoms of one dotted parse code that are not in the valid set.
 * @param {string} parse
 * @param {Set<string>} atoms
 */
export function undefinedAtoms(parse, atoms) {
  return parse.split('.').filter((a) => !atoms.has(a));
}

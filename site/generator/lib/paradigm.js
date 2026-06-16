// Shared paradigm expansion helpers used by build-glossary.js and the
// glossary/lexicon validators.

export function cellForms(value) {
  return Array.isArray(value) ? value : [value];
}

// For lemmata without a paradigm, the "uninflected" parse code is the pos
// abbreviation extracted from the lemma id (matches markdown span convention).
export function noParadigmParse(lemma) {
  const ix = lemma.id.lastIndexOf('_');
  return ix >= 0 ? lemma.id.slice(ix + 1) : 'inv';
}

// Noun paradigms store gender-less parse codes (nom.sg, abl.pl). Markdown
// spans tag noun tokens with the lemma's fixed gender baked in
// (animus_n:nom.sg.masc). To make the two comparable in C3 without storing
// every noun cell three times, append the lemma's gender(s) to noun cell parse
// codes when emitting glossary entries.
export function genderStampParses(parse, lemma) {
  if (lemma.pos !== 'noun' || !lemma.gender) return [parse];
  if (/\.(masc|fem|neut)(\.|$)/.test(parse)) return [parse];
  const genders = Array.isArray(lemma.gender) ? lemma.gender : [lemma.gender];
  return genders.map((g) => `${parse}.${g}`);
}

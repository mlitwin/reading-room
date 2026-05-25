#!/usr/bin/env python3
"""
seed.py — seed a Latin passage's `<div class="latin-passage">` block.

Reads Latin text from stdin (one or more lines), runs Whitaker's Words on
each token, and writes a draft markdown block to stdout. Each token becomes
a `<span data-lemma="..." data-parse="...">word</span>`, with a `data-ambiguous`
attribute when multiple analyses survive. Line breaks in the input become
`<br>` between tokens.

Usage:
    python3 seed.py < passage.txt > passage-spans.md

The author then opens the output, fixes any miscalled parses, drops it into
the passage markdown, and (later) runs `seed-vocab.py` for the new lemmas.

Whitaker's lives at ~/Dev/github.com/mlitwin/whitakers_words next to this
repo (clone of https://github.com/blagae/whitakers_words). Run inside the
sibling venv: `source .venv/bin/activate && python3 seed.py < text > out.html`.

v0 known limitations — output still needs hand-curation:
  * data-lemma is the first Whitaker's stem (e.g. `nov`, `anim`), not the
    canonical headword (`novus`, `animus`). Author renames.
  * Enclitics (-que, -ne, -ve) not split off; appear attached (`primaque`).
  * Participle parse codes emit `Nonepl.perf.pass` instead of `ppp.acc.pl.fem`
    when Person feature is None — fix in parse_code_for.
  * Disambiguation is naive (picks first candidate); `dicere` comes back as
    `2sg.pres.subj.pass` instead of `inf.pres.act`. Prefer common parses.
  * Whitaker's doesn't always recognise syncopated/poetic forms
    (e.g. `mutastis` returns "?"). Author writes those by hand.
"""
import os
import re
import sys

WHITAKERS_DIR = os.path.expanduser('~/Dev/github.com/mlitwin/whitakers_words')
sys.path.insert(0, WHITAKERS_DIR)

from whitakers_words.parser import Parser  # noqa: E402

# Feature-enum → compact-code piece. Tense/mood/voice abbreviations match
# the conventions in content/ovid-metamorphoses/vocabulary/*.json paradigms.
TENSE = {'PRES': 'pres', 'IMPF': 'imperf', 'PERF': 'perf', 'PLUP': 'plup',
         'FUT':  'fut',  'FUTP': 'futperf'}
MOOD  = {'IND': 'ind', 'SUB': 'subj', 'IMP': 'imp', 'INF': 'inf', 'PPL': 'ppl'}
VOICE = {'ACTIVE': 'act', 'PASSIVE': 'pass'}
CASE  = {'NOM': 'nom', 'GEN': 'gen', 'DAT': 'dat', 'ACC': 'acc',
         'ABL': 'abl', 'VOC': 'voc', 'LOC': 'loc'}
NUMBER = {'S': 'sg', 'P': 'pl'}
GENDER = {'M': 'masc', 'F': 'fem', 'N': 'neut', 'C': 'comm', 'X': ''}

def enum_value(v):
    """Pull the .value string from an enum, or return the str repr."""
    return getattr(v, 'value', None) or getattr(v, 'name', str(v))

def feature(feats, key):
    """Look up `feats[key]`, return the enum's underlying name (for our maps)."""
    v = feats.get(key)
    if v is None: return None
    return getattr(v, 'name', None) or str(v)

def parse_code_for(inflection, word_type):
    """Translate one Whitaker's inflection into a compact dotted parse code."""
    feats = inflection.features
    mood = feature(feats, 'Mood')
    if word_type == 'V':
        # Verb: person.number.tense.mood.voice
        person = feature(feats, 'Person')   # 1 / 2 / 3
        number = NUMBER.get(feature(feats, 'Number'), '')
        tense  = TENSE.get(feature(feats, 'Tense'), '')
        voice  = VOICE.get(feature(feats, 'Voice'), '')
        if mood == 'PPL':
            # Participle: use ppp/pap/fap depending on tense+voice.
            tag = {
                ('PERF', 'PASSIVE'): 'ppp',
                ('PRES', 'ACTIVE'):  'pap',
                ('FUT',  'ACTIVE'):  'fap',
            }.get((feature(feats, 'Tense'), feature(feats, 'Voice')), 'ppl')
            case = CASE.get(feature(feats, 'Case'), '')
            num  = number
            gen  = GENDER.get(feature(feats, 'Gender'), '')
            return '.'.join(x for x in [tag, case, num, gen] if x)
        if mood == 'INF':
            return '.'.join(x for x in ['inf', tense, voice] if x)
        m = MOOD.get(mood, '')
        return '.'.join(x for x in [f"{person}{number}", tense, m, voice] if x)
    if word_type in ('N', 'PRON', 'NUM'):  # Noun / pronoun / numeral
        case = CASE.get(feature(feats, 'Case'), '')
        num  = NUMBER.get(feature(feats, 'Number'), '')
        return '.'.join(x for x in [case, num] if x)
    if word_type == 'ADJ':
        case = CASE.get(feature(feats, 'Case'), '')
        num  = NUMBER.get(feature(feats, 'Number'), '')
        gen  = GENDER.get(feature(feats, 'Gender'), '')
        return '.'.join(x for x in [case, num, gen] if x)
    # Indeclinables.
    return {'PREP': 'prep', 'CONJ': 'conj', 'ADV': 'adv', 'INTERJ': 'interj'}.get(word_type, '')

def lemma_for(lexeme):
    """Whitaker's gives a list of stems; reconstruct a canonical headword."""
    roots = [r for r in lexeme.get('roots', []) if r]
    wt = lexeme.get('wordType', None)
    wt_name = getattr(wt, 'name', str(wt))
    if not roots:
        return ''
    if wt_name == 'V':
        # First-person singular present: first root + standard ending by conj
        return roots[0] + 'o' if not roots[0].endswith(('o', 'i')) else roots[0]
    # Nouns/adjs/etc: first root as-is (rough approximation)
    return roots[0]

def analyse(parser, token):
    """Return (lemma, parse_code, ambiguous_alternatives) for a token."""
    try:
        result = parser.parse(token)
    except Exception:
        return ('?', '?', [])
    if not result.forms:
        return ('?', '?', [])
    candidates = []
    for form in result.forms:
        for analysis in form.analyses.values():
            lexeme = analysis.lexeme if hasattr(analysis, 'lexeme') else analysis['lexeme']
            for infl in (analysis.inflections if hasattr(analysis, 'inflections') else analysis['inflections']):
                wt = lexeme.get('wordType') if isinstance(lexeme, dict) else lexeme.wordType
                wt_name = getattr(wt, 'name', str(wt))
                lemma = lemma_for(lexeme if isinstance(lexeme, dict) else lexeme.__dict__)
                code = parse_code_for(infl if hasattr(infl, 'features') else type('I', (), infl)(), wt_name)
                candidates.append((lemma, code))
    seen = set()
    uniq = []
    for c in candidates:
        if c not in seen:
            seen.add(c)
            uniq.append(c)
    primary = uniq[0]
    return (primary[0], primary[1], uniq[1:])

WORD_RE = re.compile(r"([A-Za-zĀ-ž]+)([^A-Za-zĀ-ž]*)")

def tokenise(text):
    """Yield (word, trailing_punctuation) pairs in source order."""
    for m in WORD_RE.finditer(text):
        word, trail = m.group(1), m.group(2)
        if word:
            yield (word, trail)

def main():
    parser = Parser()
    src = sys.stdin.read()
    lines = src.splitlines()
    out_lines = []
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
        parts = []
        for word, trail in tokenise(line):
            lemma, code, alts = analyse(parser, word)
            attrs = f'data-lemma="{lemma}" data-parse="{code}"'
            if alts:
                alt_str = '|'.join(f"{l}:{c}" for l, c in alts[:3])
                attrs += f' data-ambiguous="{alt_str}"'
            parts.append(f'<span {attrs}>{word}</span>{trail}')
        joined = ' '.join(parts)
        if i < len(lines) - 1:
            joined += '<br>'
        out_lines.append(joined)
    print('<div class="latin-passage">')
    print('\n'.join(out_lines))
    print('</div>')

if __name__ == '__main__':
    main()

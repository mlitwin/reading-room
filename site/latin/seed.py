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

Each span gets a `data-matches="lemma1:parse1,parse2;lemma2:parse3"` attribute
listing every (lemma, parse) Whitaker's reports for the surface form. We do
not disambiguate — the card popover is a study tool that highlights every
cell the form could fill and surfaces every lemma it could belong to.

v1 known limitations — output still needs hand-curation:
  * Lemma reconstruction is heuristic (round-trips candidate endings through
    Whitaker's). Irregular pronouns (`vos`, `di`) and a handful of nouns
    still come back as raw stems.
  * Enclitics (-que, -ne, -ve) not split off; appear attached (`primaque`).
  * Whitaker's doesn't recognise some syncopated/poetic forms
    (e.g. `mutastis`); those emit `?:?` and the author writes them by hand.
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
        case_f = feature(feats, 'Case')
        # Participle test: Whitaker's may set Mood=PPL or just leave Person None
        # and provide Case/Number/Gender features.
        if mood == 'PPL' or (person is None and case_f is not None):
            tag = {
                ('PERF', 'PASSIVE'): 'ppp',
                ('PRES', 'ACTIVE'):  'pap',
                ('FUT',  'ACTIVE'):  'fap',
            }.get((feature(feats, 'Tense'), feature(feats, 'Voice')), 'ppl')
            case = CASE.get(case_f, '')
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

def lemma_for(lexeme, parser, _cache={}):
    """Whitaker's gives a list of stems; reconstruct a canonical headword by
    appending the conventional dictionary-form ending to the first stem and
    asking Whitaker's to verify. The first candidate that comes back as the
    expected dictionary form wins. Falls back to the bare stem."""
    roots = [r for r in lexeme.get('roots', []) if r]
    wt = lexeme.get('wordType', None)
    wt_name = getattr(wt, 'name', str(wt))
    form_info = lexeme.get('form') or []   # e.g. ['N', 'T'] for caelum (neuter)
    gender_code = form_info[0] if form_info else ''
    # Irregular verbs with no clean stem — Whitaker reports them with empty
    # roots. `sum` is the most important; many of its forms (est, sunt, erat)
    # show up here. Hardcode the lemma since stem-round-trip can't recover it.
    if wt_name == 'V' and not roots:
        return 'sum'
    if not roots:
        return ''
    stem = roots[0]
    cache_key = (wt_name, tuple(roots), gender_code)
    if cache_key in _cache:
        return _cache[cache_key]

    # Candidate endings ordered by frequency for the part of speech. For
    # nouns we put the gender-appropriate ending first when Whitaker tells
    # us the gender, so `cael` → `caelum` (neuter) instead of `caelus`.
    if wt_name == 'V':
        candidates = [stem + 'o', stem + 'eo', stem + 'io', stem, stem + 'or']
        expected = ('1', 'S', 'PRES', 'IND', 'ACTIVE')
    elif wt_name == 'N':
        common = [stem, stem + 'is', stem + 'es', stem + 's', stem + 'or']
        if gender_code == 'N':
            candidates = [stem + 'um', stem + 'us'] + common + [stem + 'a', stem + 'er']
        elif gender_code == 'F':
            candidates = [stem + 'a', stem + 'is', stem + 'es'] + common + [stem + 'us', stem + 'um', stem + 'er']
        else:   # M, C (common), or unknown
            candidates = [stem + 'us', stem + 'er'] + common + [stem + 'a', stem + 'um']
        expected = ('NOM', 'S')
    elif wt_name == 'ADJ':
        candidates = [stem + 'us', stem + 'is', stem + 'er', stem + 'x', stem]
        expected = ('NOM', 'S', 'M')
    elif wt_name == 'PRON':
        # Pronoun stems often need a quirky ending. Cover the relative/
        # interrogative qui (stem 'qu') plus the demonstratives hic/is/ipse.
        candidates = [stem + 'i', stem + 'is', stem, stem + 'e', stem + 'o', stem + 'a']
        expected = ('NOM', 'S')
    else:
        _cache[cache_key] = stem
        return stem

    for cand in candidates:
        try:
            res = parser.parse(cand)
        except Exception:
            continue
        if not res.forms:
            continue
        for form in res.forms:
            for analysis in form.analyses.values():
                lex2 = analysis.lexeme if hasattr(analysis, 'lexeme') else analysis['lexeme']
                roots2 = (lex2.get('roots') if isinstance(lex2, dict) else lex2.roots) or []
                if list(roots2) != list(roots):
                    continue
                infls = analysis.inflections if hasattr(analysis, 'inflections') else analysis['inflections']
                for infl in infls:
                    feats = infl.features if hasattr(infl, 'features') else infl['features']
                    fnames = tuple(getattr(feats.get(k), 'name', '') for k in
                                   ('Person', 'Number', 'Tense', 'Mood', 'Voice')) if wt_name == 'V' else \
                              tuple(getattr(feats.get(k), 'name', '') for k in ('Case', 'Number', 'Gender'))
                    # Compare only the prefix we care about (verbs ignore length-3 expected).
                    if all(e == '' or fnames[i] == e for i, e in enumerate(expected)):
                        _cache[cache_key] = cand
                        return cand
    _cache[cache_key] = stem
    return stem

def analyse_once(parser, token):
    """Single-shot Whitaker's analysis. Returns [{lemma, parses}, ...]."""
    try:
        result = parser.parse(token.lower())
    except Exception:
        return []
    if not result.forms:
        return []
    grouped = {}
    order = []
    for form in result.forms:
        for analysis in form.analyses.values():
            lexeme = analysis.lexeme if hasattr(analysis, 'lexeme') else analysis['lexeme']
            for infl in (analysis.inflections if hasattr(analysis, 'inflections') else analysis['inflections']):
                wt = lexeme.get('wordType') if isinstance(lexeme, dict) else lexeme.wordType
                wt_name = getattr(wt, 'name', str(wt))
                lemma = lemma_for(lexeme if isinstance(lexeme, dict) else lexeme.__dict__, parser)
                code = parse_code_for(infl if hasattr(infl, 'features') else type('I', (), infl)(), wt_name)
                if not lemma or not code:
                    continue
                if lemma not in grouped:
                    grouped[lemma] = []
                    order.append(lemma)
                if code not in grouped[lemma]:
                    grouped[lemma].append(code)
    return [{'lemma': l, 'parses': grouped[l]} for l in order]

# Enclitics in Latin: -que (and), -ne (question marker), -ve (or). Some words
# end in these letters without carrying the enclitic (e.g. "atque" = at+que
# is genuinely the conjunction, "neque" too, "quoque", "namque"); a short
# whitelist of words to NEVER split keeps these intact.
NEVER_SPLIT_ENCLITIC = {'atque', 'neque', 'quoque', 'namque', 'denique', 'utique',
                        'undique', 'usque', 'quaque', 'itaque', 'plerumque',
                        'cuique', 'quique', 'unde', 'inde', 'sive', 'siue'}
ENCLITICS = ('que', 'ne', 've')

def split_enclitic(token):
    """If `token` ends in -que/-ne/-ve and the prefix is a valid Latin word
    (parses non-trivially), return (prefix, enclitic). Otherwise None."""
    if token.lower() in NEVER_SPLIT_ENCLITIC:
        return None
    for enc in ENCLITICS:
        if len(token) > len(enc) + 2 and token.lower().endswith(enc):
            return (token[:-len(enc)], enc)
    return None

def analyse(parser, token):
    """Analyse a token, splitting trailing enclitics (-que, -ne, -ve) when
    they make the prefix parseable. Returns a list of (segment, matches)
    pairs so the caller can emit one span per segment."""
    direct = analyse_once(parser, token)
    if direct:
        return [(token, direct)]
    split = split_enclitic(token)
    if split:
        prefix, enc = split
        prefixMatches = analyse_once(parser, prefix)
        if prefixMatches:
            enc_lemma = {'que': 'que', 'ne': 'ne', 've': 've'}[enc]
            return [(prefix, prefixMatches), (enc, [{'lemma': enc_lemma, 'parses': ['enclit']}])]
    return [(token, [])]

WORD_RE = re.compile(r"([A-Za-zĀ-ž]+)([^A-Za-zĀ-ž]*)")

def tokenise(text):
    """Yield (word, trailing_punctuation) pairs in source order."""
    for m in WORD_RE.finditer(text):
        word, trail = m.group(1), m.group(2)
        if word:
            yield (word, trail)

def matches_attr(matches):
    """Serialise [{lemma, parses}, ...] into `data-matches="lemma:p1,p2;lemma2:p3"`."""
    if not matches:
        return 'data-matches="?:?"'
    return 'data-matches="' + ';'.join(
        f"{m['lemma']}:{','.join(m['parses'])}" for m in matches
    ) + '"'

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
            segments = analyse(parser, word)
            # Each segment becomes its own span; segments emitted adjacent
            # with no space so an enclitic like -que visually stays attached
            # to its host word (`primaque` → `prima`+`que` as two adjacent
            # buttons).
            spans = ''.join(
                f'<span {matches_attr(matches)}>{seg}</span>'
                for seg, matches in segments
            )
            parts.append(f'{spans}{trail}')
        joined = ' '.join(parts)
        if i < len(lines) - 1:
            joined += '<br>'
        out_lines.append(joined)
    print('<div class="latin-passage">')
    print('\n'.join(out_lines))
    print('</div>')

if __name__ == '__main__':
    main()

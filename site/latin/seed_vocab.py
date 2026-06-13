#!/usr/bin/env python3
"""
seed_vocab.py — generate vocabulary-card skeletons for Latin lemmas.

Reads lemma names from stdin (one per line, blank lines OK) or from
`--from-piece <path>` (a piece markdown file whose Latin spans are scanned
for their lemmas). For each lemma:

  1. Skip if `content/_latin-lexicon/<lemma>.json` is already present.
  2. Skip if `site/latin/staging/lexicon/<lemma>.json` already drafted.
  3. Look up the lemma in Whitaker's DICTLINE.GEN by stem.
  4. Generate a paradigm from INFLECTS.LAT.
  5. Write a draft skeleton to `site/latin/staging/lexicon/<lemma>.json`.

The skeleton is intentionally minimal — the author hand-edits glosses
(trims to 3–5 short ones, reorders by reading-context fit) and reviews
the paradigm before marking `reviewed: true` and moving the file into
`content/_latin-lexicon/`.

Data sources (read directly, no Python deps):

  ~/Dev/github.com/mlitwin/whitakers_words/whitakers_words/data/
    DICTLINE.GEN   — 39,338 dictionary entries (stems + glosses + POS)
    INFLECTS.LAT   — 3,207 inflection ending rules

Both are plain text; we use the same slice offsets as the whitakers_words
port's `datagenerator.py`.
"""
import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
LEXICON_DIR = REPO_ROOT / 'content' / '_latin-lexicon'
STAGING_DIR = REPO_ROOT / 'site' / 'latin' / 'staging' / 'lexicon'

WHITAKERS_DATA = Path.home() / 'Dev' / 'github.com' / 'mlitwin' / 'whitakers_words' / 'whitakers_words' / 'data'
DICTLINE_PATH = WHITAKERS_DATA / 'DICTLINE.GEN'
INFLECTS_PATH = WHITAKERS_DATA / 'INFLECTS.LAT'

# Slice positions from whitakers_words/datagenerator.py:
PARTS_SLICE       = slice(None, 76)
POS_SLICE         = slice(76, 83)
FORM_SLICE        = slice(83, 100)
PROPERTIES_SLICE  = slice(100, 110)
SENSE_SLICE       = slice(109, None)

# Morpheus inflection-class → Whitaker (pos, n1, n2). Covers the
# productive declensions and conjugations; long tail falls back to
# stem-matching with whatever Whitaker reports for the lemma.
INFL_CLASS_MAP = {
    # nouns
    'us_i':    ('N', 2, 1),
    'i_orum':  ('N', 2, 1),
    'a_ae':    ('N', 1, 1),
    'ae_arum': ('N', 1, 1),
    'is_is':   ('N', 3, 1),
    's_is':    ('N', 3, 1),
    'us_us':   ('N', 4, 1),
    'es_ei':   ('N', 5, 1),
    # adjectives
    'us_a_um': ('ADJ', 1, 1),
    'er_a_um': ('ADJ', 1, 2),
    'is_e':    ('ADJ', 3, 1),
    # verbs
    'are_vb':  ('V', 1, 1),
    'ere_vb':  ('V', 2, 1),     # 2nd conj
    'ire_vb':  ('V', 4, 1),
    # 3rd conj has many variants; Whitaker uses 3 1, 3 2, 3 3
}

# Dictionary-form ending → strip-and-replace pairs for stem reconstruction.
# Used as a fallback when the inflection class lookup misses; we strip
# the lemma's likely dictionary ending to recover the stem and search.
# For each POS, ordered list of (lemma_suffix, replacement, form_filter)
# tuples. The form_filter is (n1_str, n2_str_or_None, gender_or_None) and
# is used by `lookup_entry` to disambiguate when multiple DICTLINE entries
# share the same stem.
LEMMA_STEM_ENDINGS = {
    'N': [
        ('us', '', ('2', '1', 'M')),       # animus, -i, m.
        ('us', '', ('4', '1', 'M')),       # exitus, -us, m.
        ('us', '', ('4', '1', 'F')),       # manus, -us, f.
        ('us', 'u', ('4', '0', None)),     # alt 4th-decl form
        ('um', '', ('2', '2', 'N')),       # caelum, -i, n.
        ('um', '', ('2', '0', 'N')),       # alt
        ('um', '', ('2', '1', 'N')),       # spatium-style
        ('um', '', ('2', None, 'N')),      # any 2nd-decl neuter (4th-variant etc.)
        ('um', '', ('5', '2', None)),      # possum-like irregulars
        ('a',  '', ('2', '2', 'N')),       # arma (plural-only neuter)
        ('a',  '', ('1', '1', 'F')),       # forma, -ae, f.
        ('es', '', ('5', '1', 'F')),       # facies, -ei, f.
        ('e',  '', ('5', '1', 'F')),       # res, ei (rare lemma form)
        ('is', '', ('3', '1', None)),      # ignis, -is
        ('s',  '', ('3', '2', None)),      # tellus, -uris / mons, montis
        ('s',  '', ('3', None, None)),
        ('or', '', ('3', None, None)),     # arbor, -is
        ('o',  'on', ('3', None, None)),   # origo → origin-
        ('o',  'in', ('3', None, None)),   # virgo → virgin-
        ('o',  '', ('3', None, None)),     # leo → leon (already plain)
        ('en', '', ('3', None, 'N')),      # carmen → carmin-
        ('', '', None),                    # final no-strip fallback
    ],
    'ADJ': [
        ('us', '', ('1', '1', None)),      # novus, -a, -um
        ('er', '', ('1', '2', None)),      # liber, -era, -erum
        ('er', 'r', ('1', '2', None)),
        ('x',  '', ('3', None, None)),     # felix, fugax
        ('is', '', ('3', None, None)),     # facilis, -e
        ('s',  '', ('3', None, None)),
        ('', '', None),
    ],
    'V':   [
        ('eo', '', ('2', '1', None)),
        ('io', '', ('4', '1', None)),
        ('io', '', ('3', '2', None)),      # capio (3rd-conj io-stem)
        ('or', '', ('3', None, None)),     # deponents (loquor, sequor)
        ('or', '', ('1', '1', None)),
        ('o',  '', ('1', '1', None)),      # 1st conj (creo, muto)
        ('o',  '', ('3', '1', None)),      # 3rd conj (cerno)
        ('o',  '', ('3', '2', None)),
        ('o',  '', None),                  # final fallback
        ('',   '', None),
    ],
    'PRON': [
        ('e',  '', ('6', None, None)),     # ipse → ips
        ('a',  '', ('6', None, None)),     # illa → ill
        ('s',  '', ('3', None, None)),     # is
        ('c',  '', None),                  # hic
        ('', '', None),
    ],
    'NUM': [
        ('o',  '', None),                  # duo
        ('s',  '', None),                  # tres
        ('', '', None),
    ],
}

# POS to try when we have no Morpheus inflection-class hint. Indeclinable
# parts of speech come last because they overwhelm the index if tried first.
DEFAULT_POS_ORDER     = ['N', 'ADJ', 'V', 'PRON', 'NUM', 'ADV', 'CONJ', 'PREP', 'INTERJ']
VERB_LIKELY_POS_ORDER = ['V', 'N', 'ADJ', 'PRON', 'NUM', 'ADV', 'CONJ', 'PREP', 'INTERJ']

POS_TO_CARD = {'N': 'noun', 'ADJ': 'adj', 'V': 'verb', 'PREP': 'prep',
               'CONJ': 'conj', 'ADV': 'adv', 'INTERJ': 'interj', 'PRON': 'pron'}

GENDER_MAP = {'M': 'm', 'F': 'f', 'N': 'n', 'C': 'c'}


# ---------- DICTLINE.GEN ---------------------------------------------------

def load_dictline():
    """Parse DICTLINE.GEN. Returns:
        entries: list of dict
        by_stem: stem_token → list of entry indices
    """
    entries = []
    by_stem = {}
    with open(DICTLINE_PATH, encoding='ISO-8859-1') as f:
        for i, line in enumerate(f):
            parts_field = line[PARTS_SLICE]
            stems = [s for s in parts_field.replace('zzz', '-').split() if s]
            stems = [s.lower() for s in stems]
            pos = line[POS_SLICE].strip()
            form_raw = line[FORM_SLICE].strip().split()
            properties = line[PROPERTIES_SLICE].split()
            sense_raw = line[SENSE_SLICE].strip()
            senses = [s.strip() for s in sense_raw.split(';') if s.strip()]
            # Whitaker carries multi-line dictionary entries by prefixing the
            # continuation with `|`; merge into the previous entry.
            if senses and senses[0].startswith('|'):
                senses[0] = senses[0].lstrip('|').strip()
                if entries:
                    entries[-1]['senses'].extend(senses)
                continue
            entry = {
                'idx': i,
                'stems': stems,
                'pos': pos,
                'form': form_raw,
                'properties': properties,
                'senses': senses,
            }
            entries.append(entry)
            for s in stems:
                by_stem.setdefault(s, []).append(len(entries) - 1)
    return entries, by_stem


# ---------- INFLECTS.LAT --------------------------------------------------

def load_inflects():
    """Parse INFLECTS.LAT. Returns:
        rules[(pos, n1, n2)] = list of {form, ending, stem_idx}
    """
    rules = {}
    with open(INFLECTS_PATH) as f:
        for raw in f:
            line = raw.strip()
            if not line or line.startswith('--'):
                continue
            if '--' in line:
                line = line[:line.index('--')].strip()
            info = line.split()
            if len(info) < 6:
                continue
            pos = info[0]
            try:
                n1, n2 = int(info[1]), int(info[2])
            except (ValueError, IndexError):
                continue
            ending = info[-3]
            try:
                used_stem = int(info[-5]) - 1   # 1-based → 0-based
            except ValueError:
                if ending and not ending.isalpha():
                    ending = ''
                    used_stem = int(info[-4]) - 1
                else:
                    continue
            if not ending.isalpha():
                ending = ''
            if pos == 'V' or pos == 'VPAR':
                form = tuple(info[3:8])     # tense, voice, mood, person, number
            elif pos in ('ADJ', 'NUM'):
                form = tuple(info[3:7])     # case, number, gender, degree
            elif pos in ('N', 'PRON', 'SUPINE'):
                form = tuple(info[3:6])     # case, number, gender
            else:
                form = tuple(info[1:-5])    # indeclinables: rare
            rules.setdefault((pos, n1, n2), []).append({
                'form': form,
                'ending': ending,
                'stem_idx': used_stem,
            })
    return rules


# ---------- lemma lookup --------------------------------------------------

def lemma_to_stem_candidates(lemma, pos):
    """Yield (stem, form_filter) for a Morpheus lemma + Whitaker POS. The
    form_filter encodes the lemma's strongest expectation about which
    DICTLINE entry is right (`mundum` ending → 2-2 N), used to disambiguate
    when multiple entries share a stem."""
    yield (lemma, None)  # sometimes the lemma is its own stem (indeclinables)
    for entry in LEMMA_STEM_ENDINGS.get(pos, []):
        suffix, replacement, form_filter = entry
        if not suffix:
            yield (lemma + replacement, form_filter)
            continue
        if lemma.endswith(suffix):
            yield (lemma[:-len(suffix)] + replacement, form_filter)


def _form_matches(entry_form, form_filter):
    """Return how well a DICTLINE entry's form field matches a filter tuple
    `(n1, n2_or_None, gender_or_None)`. 0 = no match, higher = more specific."""
    if form_filter is None:
        return 1  # no filter applied — neutral score
    n1_want, n2_want, gender_want = form_filter
    if not entry_form or len(entry_form) < 2:
        return 0
    if entry_form[0] != n1_want:
        return 0
    score = 2
    if n2_want is not None:
        if entry_form[1] != n2_want:
            return 0
        score += 1
    if gender_want is not None:
        entry_gender = entry_form[2] if len(entry_form) > 2 else None
        if entry_gender != gender_want:
            return 0
        score += 1
    return score


def lookup_entry(lemma, morpheus_pos, infl_class, by_stem, entries):
    """Find the best DICTLINE entry for a Morpheus lemma. Returns the entry
    dict, or None if nothing matched."""
    # Whitaker's data is lowercase; Morpheus may report proper nouns
    # capitalised (`Pythion`, `Arcitenens`). Compare lowercase.
    lemma = lemma.lower()
    # Hyphenated preverbs (`ex-ardeo`, `per-caleo`): strip the prefix and
    # re-lookup the bare verb. If the bare verb resolves we return its entry;
    # the seeded card files under the hyphenated lemma name but presents the
    # base verb's paradigm and gloss.
    if '-' in lemma:
        base = lemma.split('-')[-1]
        if base and base != lemma:
            return lookup_entry(base, morpheus_pos, infl_class, by_stem, entries)
    forced = INFL_CLASS_MAP.get(infl_class)
    if forced:
        pos_options = [forced[0]]
    elif infl_class == 'prep':   pos_options = ['PREP']
    elif infl_class == 'conj':   pos_options = ['CONJ']
    elif infl_class == 'adverb': pos_options = ['ADV']
    elif infl_class == 'interj': pos_options = ['INTERJ']
    elif re.search(r'(eo|io|or|o)$', lemma):
        pos_options = VERB_LIKELY_POS_ORDER
    else:
        pos_options = DEFAULT_POS_ORDER

    candidates = []
    for pos in pos_options:
        for stem, form_filter in lemma_to_stem_candidates(lemma, pos):
            for idx in by_stem.get(stem, []):
                entry = entries[idx]
                if entry['pos'] != pos:
                    continue
                # If the caller had a Morpheus infl_class hint, require it to match.
                if forced and entry['form'] and len(entry['form']) >= 2:
                    try:
                        if (int(entry['form'][0]) != forced[1]
                                or int(entry['form'][1]) != forced[2]):
                            continue
                    except ValueError:
                        pass
                # Score: ending-form match × 10 + stem-position bonus.
                form_score = _form_matches(entry['form'], form_filter)
                if form_score == 0:
                    continue
                stem_idx = entry['stems'].index(stem) if stem in entry['stems'] else 99
                # Stems earlier in the list (0 = primary stem) score higher.
                stem_bonus = max(0, 5 - stem_idx)
                total = form_score * 10 + stem_bonus
                candidates.append((total, entry))

    if not candidates:
        return None
    candidates.sort(key=lambda x: -x[0])
    return candidates[0][1]


# ---------- skeleton emission --------------------------------------------

def card_pos_label(entry):
    return POS_TO_CARD.get(entry['pos'], entry['pos'].lower())


def gender_from_form(entry):
    if entry['pos'] != 'N' or len(entry['form']) < 3:
        return None
    return GENDER_MAP.get(entry['form'][2], None)


def head_line(lemma, entry):
    pos = entry['pos']
    if pos == 'V' and len(entry['stems']) >= 4 and entry['stems'][2] and entry['stems'][3]:
        # Reconstruct principal parts by attaching conventional endings.
        # `mut, mut, mutav, mutat` → muto, mutare, mutavi, mutatum
        s1, s2, s3, s4 = entry['stems'][:4]
        try:
            n1, n2 = int(entry['form'][0]), int(entry['form'][1])
        except (ValueError, IndexError):
            n1, n2 = 0, 0
        present = lemma
        if (n1, n2) == (1, 1):  inf = s2 + 'are'
        elif (n1, n2) == (2, 1): inf = s2 + 'ere'
        elif (n1, n2) == (3, 1) or n1 == 3: inf = s2 + 'ere'
        elif (n1, n2) == (4, 1): inf = s2 + 'ire'
        else: inf = s2 + 're'
        perf = s3 + 'i'
        supine = s4 + 'um'
        return f'{present}, {inf}, {perf}, {supine}', [present, inf, perf, supine]
    if pos == 'N':
        gender = gender_from_form(entry) or ''
        gender_tag = {'m': 'm.', 'f': 'f.', 'n': 'n.', 'c': 'c.'}.get(gender, '')
        # Conventional genitive-stub by declension. For neuter 2nd-decl
        # nouns it's `-i` (caelum, -i, n.) same as the masc variant.
        n1 = entry['form'][0] if entry['form'] else ''
        if n1 == '2':
            return f'{lemma}, -i, {gender_tag}', None
        if n1 == '1':
            return f'{lemma}, -ae, {gender_tag}', None
        if n1 == '3':
            return f'{lemma}, -is, {gender_tag}', None
        if n1 == '4':
            return f'{lemma}, -us, {gender_tag}', None
        if n1 == '5':
            return f'{lemma}, -ei, {gender_tag}', None
        return f'{lemma}, {gender_tag}'.rstrip(', '), None
    if pos == 'ADJ':
        return f'{lemma}, -a, -um', None
    if pos == 'PREP':
        # Whitaker's form info often tells the case it governs.
        return f'{lemma}', None
    return lemma, None


# ---------- paradigm generation -------------------------------------------

NOUN_ROWS = ['nom', 'gen', 'dat', 'acc', 'abl']
VERB_PRESENT_COLS = ['pres.ind.act', 'perf.ind.act', 'pres.imp.act']
ADJ_ROWS = ['nom', 'gen', 'dat', 'acc', 'abl']

def rule_specificity(rule_form, n2_specific, gender_upper):
    """Higher = more specific. Variant-specific rules beat declension-wide;
    explicit-gender rules beat 'X' rules; gender mismatch returns 0 (skip)."""
    gender_filter = rule_form[2] if len(rule_form) > 2 else 'X'
    if gender_filter == gender_upper:
        gender_score = 2
    elif gender_filter == 'X':
        gender_score = 1
    elif gender_filter == 'C' and gender_upper in ('M', 'F'):
        gender_score = 1
    else:
        return 0  # gender doesn't match — skip rule
    variant_score = 2 if n2_specific else 1
    return variant_score * 10 + gender_score


def generate_noun_paradigm(entry, lemma, rules):
    gender = gender_from_form(entry) or 'm'
    gender_upper = gender.upper()
    try:
        n1, n2 = int(entry['form'][0]), int(entry['form'][1])
    except (ValueError, IndexError):
        return None
    # Variant-specific rules first, declension-wide (n2=0) fallback.
    variant_rules = rules.get(('N', n1, n2), [])
    generic_rules = rules.get(('N', n1, 0), []) if n2 != 0 else []
    all_rules = [(r, True) for r in variant_rules] + [(r, False) for r in generic_rules]
    if not all_rules:
        return None
    by_cell = {}  # cell_key → list of (specificity, form_string)
    for rule, is_variant in all_rules:
        form = rule['form']
        if len(form) < 2:
            continue
        case, num = form[0], form[1]
        if case in ('VOC', 'LOC'):
            continue
        row = case.lower()
        col = 'sg' if num == 'S' else 'pl'
        if row not in NOUN_ROWS or col not in ('sg', 'pl'):
            continue
        spec = rule_specificity(form, is_variant, gender_upper)
        if spec == 0:
            continue
        stem = entry['stems'][rule['stem_idx']] if rule['stem_idx'] < len(entry['stems']) else entry['stems'][0]
        if not stem:
            continue
        candidate = stem + rule['ending']
        by_cell.setdefault(f'{row}.{col}', []).append((spec, candidate))
    cells = {}
    for key, opts in by_cell.items():
        opts.sort(key=lambda x: -x[0])
        cells[key] = opts[0][1]
    if not cells:
        return None
    return {
        'type': 'noun',
        'rows': NOUN_ROWS,
        'cols': ['sg', 'pl'],
        'cells': cells,
    }


def generate_adj_paradigm(entry, lemma, rules):
    try:
        n1, n2 = int(entry['form'][0]), int(entry['form'][1])
    except (ValueError, IndexError):
        return None
    variant_rules = rules.get(('ADJ', n1, n2), [])
    generic_rules = rules.get(('ADJ', n1, 0), []) if n2 != 0 else []
    all_rules = [(r, True) for r in variant_rules] + [(r, False) for r in generic_rules]
    if not all_rules:
        return None
    by_cell = {}
    for rule, is_variant in all_rules:
        form = rule['form']
        if len(form) < 3:
            continue
        case, num, gen = form[0], form[1], form[2]
        if case in ('VOC', 'LOC'):
            continue
        row = case.lower()
        col_num = 'sg' if num == 'S' else 'pl'
        col_gen = {'M': 'masc', 'F': 'fem', 'N': 'neut'}.get(gen)
        if col_gen is None or row not in ADJ_ROWS:
            continue
        col = f'{col_num}.{col_gen}'
        stem = entry['stems'][rule['stem_idx']] if rule['stem_idx'] < len(entry['stems']) else entry['stems'][0]
        if not stem:
            continue
        spec = 20 if is_variant else 10  # adjectives match all three genders explicitly
        by_cell.setdefault(f'{row}.{col}', []).append((spec, stem + rule['ending']))
    cells = {}
    for key, opts in by_cell.items():
        opts.sort(key=lambda x: -x[0])
        cells[key] = opts[0][1]
    if not cells:
        return None
    cols = [f'{n}.{g}' for n in ('sg', 'pl') for g in ('masc', 'fem', 'neut')]
    return {
        'type': 'adj',
        'rows': ADJ_ROWS,
        'cols': cols,
        'cells': cells,
    }


def generate_verb_paradigm(entry, lemma, rules):
    """Generate just the present/perfect indicative active and present
    imperative active rows — the columns the existing cards use."""
    try:
        n1, n2 = int(entry['form'][0]), int(entry['form'][1])
    except (ValueError, IndexError):
        return None
    inflect_entries = rules.get(('V', n1, n2), [])
    if not inflect_entries:
        return None
    cells = {}
    keep = {
        ('PRES', 'ACTIVE', 'IND'): 'pres.ind.act',
        ('PERF', 'ACTIVE', 'IND'): 'perf.ind.act',
        ('PRES', 'ACTIVE', 'IMP'): 'pres.imp.act',
    }
    for rule in inflect_entries:
        form = rule['form']
        if len(form) < 5:
            continue
        tense, voice, mood, person, number = form[:5]
        col = keep.get((tense, voice, mood))
        if col is None:
            continue
        if person not in ('1', '2', '3') or number not in ('S', 'P'):
            continue
        row = f'{person}{ "sg" if number == "S" else "pl" }'
        stem = entry['stems'][rule['stem_idx']] if rule['stem_idx'] < len(entry['stems']) else entry['stems'][0]
        if not stem:
            continue
        key = f'{row}.{col}'
        if key not in cells:
            cells[key] = stem + rule['ending']
    if not cells:
        return None
    return {
        'type': 'verb',
        'rows': ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'],
        'cols': VERB_PRESENT_COLS,
        'cells': cells,
    }


# ---------- main ----------------------------------------------------------

LATIN_SPAN_RE = re.compile(r'data-matches="([^"]+)"')

def lemmas_from_piece(path):
    """Extract every lemma referenced in a piece's <span data-matches="..."> tags."""
    text = Path(path).read_text(encoding='utf-8')
    out = []
    seen = set()
    for m in LATIN_SPAN_RE.finditer(text):
        for chunk in m.group(1).split(';'):
            lemma = chunk.split(':', 1)[0].strip()
            if lemma and lemma != '?' and lemma not in seen:
                seen.add(lemma)
                out.append(lemma)
    return out


def already_exists(lemma):
    if (LEXICON_DIR / f'{lemma}.json').exists():
        return 'lexicon'
    if (STAGING_DIR / f'{lemma}.json').exists():
        return 'staging'
    return None


def seed_lemma(lemma, entries, by_stem, rules):
    """Look up `lemma` in DICTLINE and emit a skeleton card.
    Returns (status, message)."""
    where = already_exists(lemma)
    if where:
        return 'skip', f'already in {where}'

    entry = lookup_entry(lemma, morpheus_pos='N', infl_class='', by_stem=by_stem, entries=entries)
    if not entry:
        return 'miss', 'no DICTLINE match'

    card = {
        'lemma': lemma,
        'pos': card_pos_label(entry),
        'glosses': entry['senses'][:6],
        'reviewed': False,
    }
    head_text, principal = head_line(lemma, entry)
    card['head'] = head_text
    if principal:
        card['principal_parts'] = principal
    paradigm = None
    if entry['pos'] == 'N':
        paradigm = generate_noun_paradigm(entry, lemma, rules)
    elif entry['pos'] == 'ADJ':
        paradigm = generate_adj_paradigm(entry, lemma, rules)
    elif entry['pos'] == 'V':
        paradigm = generate_verb_paradigm(entry, lemma, rules)
    if paradigm:
        card['paradigm'] = paradigm

    STAGING_DIR.mkdir(parents=True, exist_ok=True)
    (STAGING_DIR / f'{lemma}.json').write_text(
        json.dumps(card, ensure_ascii=False, indent=2) + '\n',
        encoding='utf-8',
    )
    return 'wrote', f'{entry["pos"]} {entry["form"][:3] if entry["form"] else ""}'


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--from-piece', help='Read lemmas from a piece markdown file')
    ap.add_argument('--limit', type=int, default=0, help='Stop after N lemmas')
    args = ap.parse_args()

    if not DICTLINE_PATH.exists() or not INFLECTS_PATH.exists():
        sys.exit(f'seed_vocab.py: Whitaker data not found at {WHITAKERS_DATA}')

    if args.from_piece:
        lemmas = lemmas_from_piece(args.from_piece)
    else:
        lemmas = [line.strip() for line in sys.stdin if line.strip()]

    if args.limit:
        lemmas = lemmas[:args.limit]

    print(f'Loading DICTLINE.GEN ...', file=sys.stderr)
    entries, by_stem = load_dictline()
    print(f'  {len(entries)} entries, {len(by_stem)} stems indexed', file=sys.stderr)
    print(f'Loading INFLECTS.LAT ...', file=sys.stderr)
    rules = load_inflects()
    print(f'  {sum(len(v) for v in rules.values())} inflection rules', file=sys.stderr)

    counts = {'wrote': 0, 'skip': 0, 'miss': 0}
    misses = []
    for lemma in lemmas:
        status, msg = seed_lemma(lemma, entries, by_stem, rules)
        counts[status] += 1
        if status == 'miss':
            misses.append(lemma)
    print(f'\nseed_vocab: {counts["wrote"]} written, '
          f'{counts["skip"]} skipped, {counts["miss"]} no match',
          file=sys.stderr)
    if misses:
        print(f'misses: {" ".join(misses)}', file=sys.stderr)


if __name__ == '__main__':
    main()

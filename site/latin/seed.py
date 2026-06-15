#!/usr/bin/env python3
"""
seed.py — seed a Latin passage's `<div class="latin-passage">` block using
Morpheus (perseids-tools fork, sibling repo at ~/Dev/github.com/mlitwin/morpheus).

Reads Latin text from stdin, runs Morpheus on each token, emits a draft
markdown block to stdout. Each surface form becomes
    <span data-matches="lemma1:p1,p2;lemma2:p3">word</span>
preserving every (lemma, parse) Morpheus reports. The author hand-curates
the order to put the primary reading first.

All Morpheus invocations go through the project-blessed wrapper at
`site/latin/morpheus.sh`. The wrapper sets MORPHLIB, validates the build,
and execs the local `cruncher -S -L` binary.

Surface forms are cached in `sources/morpheus-cache.json` so repeated runs
across pieces don't re-query Morpheus for shared lemmas.

Output format notes:
  * Morpheus auto-strips trailing -que/-ne/-ve enclitics from a surface
    form before analysing it. When the surface in Morpheus's output is
    shorter than the input token by exactly such a clitic suffix, we
    emit two adjacent spans (prefix + clitic) so the popovers fire
    separately, matching the existing card model.
  * Morpheus tags syncopated 1st-conj perfects (`mutastis` for *mutavistis*)
    with `contr` and alternative perfect-active forms (`dixere`) with
    `poetic`; both parse cleanly without preprocessing.
  * A few of Morpheus's preferred lemma names differ from the cards we
    already shipped under content/_latin-lexicon/. LEMMA_ALIAS maps
    Morpheus's canonical lemma back to the existing card filename when
    that's the right choice for the existing book; remove an entry to
    promote Morpheus's lemma as the canonical one (then rename the card).
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
WRAPPER   = REPO_ROOT / 'site' / 'latin' / 'morpheus.sh'
CACHE_PATH = Path(__file__).resolve().parent / 'sources' / 'morpheus-cache.json'

# Morpheus surface lemma → lexicon filename stem to use instead.
# apparatus_to_spans.py resolves stems to IDs via stem_to_ids; this alias
# redirects before that resolution so Morpheus's non-standard spellings
# point at the correct stem.
LEMMA_ALIAS = {
    'coepio':   'coeptum',  # Morpheus uses coepio; card is filed under coeptum
    'ad-spiro': 'aspiro',   # Morpheus splits the preverb; card is aspiro
}

# Morpheus morphology vocabulary → our compact dotted parse codes.
PERSON_MAP = {'1st': '1', '2nd': '2', '3rd': '3'}
NUMBER_MAP = {'sg': 'sg', 'pl': 'pl', 'dual': 'dual'}
TENSE_MAP  = {'pres': 'pres', 'imperf': 'imperf', 'fut': 'fut',
              'perf': 'perf', 'plup': 'plup', 'futperf': 'futperf'}
MOOD_MAP   = {'ind': 'ind', 'subj': 'subj', 'opt': 'opt', 'imp': 'imp',
              'imperat': 'imp',   # Morpheus spells this out; 'imp' is the short form
              'inf': 'inf', 'part': 'ppl', 'gerundive': 'gerundive',
              'gerund': 'gerund'}
VOICE_MAP  = {'act': 'act', 'pass': 'pass', 'mid': 'mid', 'mp': 'mp'}
CASE_MAP   = {'nom': 'nom', 'gen': 'gen', 'dat': 'dat', 'acc': 'acc',
              'abl': 'abl', 'voc': 'voc', 'loc': 'loc'}
GENDER_MAP = {'masc': 'masc', 'fem': 'fem', 'neut': 'neut'}

# Tense+voice combo on a participle → tag used in our parse codes.
PARTICIPLE_TAG = {
    ('pres', 'act'):  'pap',
    ('perf', 'pass'): 'ppp',
    ('fut',  'act'):  'fap',
    ('fut',  'pass'): 'fpp',
}

# Inflection-class column → indeclinable POS tag, used when Morpheus tags
# a function word as `N` (its catchall for unanalysable forms).
INDECL_POS = {'prep': 'prep', 'conj': 'conj', 'adverb': 'adv',
              'interj': 'interj', 'numeral': 'num',
              'indecl': 'adv',    # catch-all for undeclined function words (tot, nefas, nil…)
              'exclam': 'interj', # exclamations (o!, vae!)
              }

# -------- cache --------------------------------------------------------------

def load_cache():
    if CACHE_PATH.exists():
        return json.loads(CACHE_PATH.read_text(encoding='utf-8'))
    return {}

def save_cache(cache):
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(
        json.dumps(cache, ensure_ascii=False, indent=2, sort_keys=True) + '\n',
        encoding='utf-8',
    )

# -------- Morpheus invocation ------------------------------------------------

NL_RE = re.compile(r'<NL>(.*?)</NL>', re.DOTALL)

def query_morpheus(tokens):
    """Send a batch of unique tokens through morpheus.sh; return
    {token: [raw_nl_block, ...]} with empty list for unrecognised words."""
    if not tokens:
        return {}
    proc = subprocess.run(
        [str(WRAPPER)],
        input='\n'.join(tokens) + '\n',
        capture_output=True,
        text=True,
        check=True,
    )
    out = {t: [] for t in tokens}
    expected = set(tokens)
    current = None
    for line in proc.stdout.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        # Drop cruncher's `:longtime` instrumentation lines.
        if stripped.startswith(':'):
            continue
        # An input echo line — sets the current token for any <NL> blocks
        # that follow.
        if stripped in expected and '<NL>' not in line:
            current = stripped
            continue
        # Else, one or more <NL>...</NL> analysis blocks for the current echo.
        for m in NL_RE.finditer(line):
            if current is not None:
                out[current].append(m.group(1).strip())
    return out

# -------- per-analysis parsing ----------------------------------------------

def strip_macron(s):
    """Morpheus marks vowel length with underscores: `mu_tastis`. Strip them
    to recover the surface form for comparison with the input token."""
    return s.replace('_', '')

def split_inflection_class(field):
    """The inflection-class column can be `avperf,are_vb` (a stem class
    combined with a paradigm), `us_a_um`, `pron2`, `prep`, etc. Return the
    last comma-separated piece as the paradigm identifier."""
    return field.split(',')[-1].strip()

def parse_nl_block(block, apply_alias=True):
    """Parse `V mu_tastis,muto#1  perf ind act 2nd pl\t\tcontr\tavperf,are_vb`
    into a dict {pos_raw, surface, lemma, morph[], tags, infl_class}."""
    # Columns are tab-separated, but the morphology column is internally
    # space-separated. Split on tabs first to peel off tags / infl_class.
    columns = block.split('\t')
    head = columns[0].strip()
    dialect = columns[1].strip() if len(columns) > 1 else ''
    tags = columns[2].strip() if len(columns) > 2 else ''
    infl_class = columns[3].strip() if len(columns) > 3 else ''

    tokens = head.split()
    pos_raw = tokens[0] if tokens else ''
    if len(tokens) < 2:
        return None
    surface_lemma = tokens[1]
    if ',' in surface_lemma:
        surface_raw, lemma_raw = surface_lemma.split(',', 1)
    else:
        surface_raw = lemma_raw = surface_lemma
    surface = strip_macron(surface_raw)
    # Strip homograph suffix (`muto#1` → `muto`).
    lemma = lemma_raw.split('#', 1)[0]
    if apply_alias:
        lemma = LEMMA_ALIAS.get(lemma, lemma)

    morph = tokens[2:]
    return {
        'pos_raw': pos_raw,
        'surface': surface,
        'lemma': lemma,
        'morph': morph,
        'tags': tags,
        'infl_class': split_inflection_class(infl_class),
        'dialect': dialect,
    }

def fan_out(values):
    """Slash-separated alternative → list. `nom/voc` → ['nom', 'voc']."""
    return [v for v in values.split('/') if v]

def morph_to_parse_codes(a):
    """Translate one analysis's morphology vector into a list of dotted
    parse codes. Multiple cases/genders/numbers fan out into separate
    codes. Indeclinables (prep/conj/adv/interj) return a single tag."""
    pos = a['pos_raw']
    infl = a['infl_class']
    morph = a['morph']

    # Indeclinables: Morpheus tags them N (catchall); the real POS is in
    # the inflection-class column.
    if pos == 'N' and infl in INDECL_POS:
        return [INDECL_POS[infl]]

    # Feature extraction.
    person = number = tense = mood = voice = None
    cases, genders, numbers = [], [], []
    for tok in morph:
        for piece in fan_out(tok):
            if piece in PERSON_MAP: person = PERSON_MAP[piece]
            elif piece in NUMBER_MAP:
                n = NUMBER_MAP[piece]
                if n not in numbers: numbers.append(n)
            elif piece in TENSE_MAP:  tense = TENSE_MAP[piece]
            elif piece in MOOD_MAP:   mood = MOOD_MAP[piece]
            elif piece in VOICE_MAP:  voice = VOICE_MAP[piece]
            elif piece in CASE_MAP:
                c = CASE_MAP[piece]
                if c not in cases: cases.append(c)
            elif piece in GENDER_MAP:
                g = GENDER_MAP[piece]
                if g not in genders: genders.append(g)

    codes = []

    # Participles (Morpheus often reports them as `P ... perf part pass ...`
    # or with mood=part inside a V-tagged analysis).
    if pos == 'P' or mood == 'ppl' or 'part' in morph:
        tag = PARTICIPLE_TAG.get((tense, voice), 'ppl')
        for case in cases or ['']:
            for num in numbers or ['']:
                for gen in genders or ['']:
                    parts = [tag, case, num, gen]
                    code = '.'.join(p for p in parts if p)
                    if code and code not in codes:
                        codes.append(code)
        return codes

    # Infinitives.
    if mood == 'inf':
        parts = ['inf', tense, voice]
        code = '.'.join(p for p in parts if p)
        return [code] if code else []

    # Finite verbs: person+number.tense.mood.voice
    if pos == 'V' and person:
        for num in numbers or ['']:
            pn = person + num
            parts = [pn, tense, mood, voice]
            code = '.'.join(p for p in parts if p)
            if code and code not in codes:
                codes.append(code)
        return codes

    # Nominals (nouns, adjectives, pronouns): case + num [+ gender].
    # If Morpheus gives gender/number but no case (citation-form entries like
    # `aether, -is`), default to nominative so the candidate is still usable.
    effective_cases = cases if cases else (['nom'] if (genders or numbers) else [])
    if effective_cases:
        for case in effective_cases:
            for num in numbers or ['']:
                if genders:
                    for gen in genders:
                        parts = [case, num, gen]
                        code = '.'.join(p for p in parts if p)
                        if code and code not in codes:
                            codes.append(code)
                else:
                    parts = [case, num]
                    code = '.'.join(p for p in parts if p)
                    if code and code not in codes:
                        codes.append(code)
        return codes

    return []

# -------- token-level orchestration -----------------------------------------

def analyse_token(token, cache, apply_alias=True):
    """Return the list of dicts {pos, surface, lemma, morph, tags, infl_class}
    for `token`; consults & populates `cache`. The returned list may be empty."""
    key = token.lower()
    if key not in cache:
        # Single-token batch; query_morpheus also handles the multi-token case.
        result = query_morpheus([key])
        cache[key] = result[key]
    out = []
    for nl in cache[key]:
        parsed = parse_nl_block(nl, apply_alias=apply_alias)
        if parsed:
            out.append(parsed)
    return out

def group_by_lemma(analyses):
    """Collect parse codes per lemma in source order. Returns
    [(lemma, [code, ...]), ...]."""
    groups = {}
    order = []
    for a in analyses:
        codes = morph_to_parse_codes(a)
        if not codes:
            continue
        if a['lemma'] not in groups:
            groups[a['lemma']] = []
            order.append(a['lemma'])
        for c in codes:
            if c not in groups[a['lemma']]:
                groups[a['lemma']].append(c)
    return [(l, groups[l]) for l in order]

ENCLITICS = ('que', 'ne', 've')

def detect_enclitic(token, analyses):
    """If Morpheus auto-stripped a trailing -que/-ne/-ve, split the token.
    Returns (prefix_token, enclitic) or (None, None)."""
    if not analyses:
        return None, None
    low = token.lower()
    for enc in ENCLITICS:
        if low.endswith(enc) and len(low) > len(enc):
            stem = low[:-len(enc)]
            # Morpheus's analyses all match the stem → it was treated as enclitic.
            if all(a['surface'].lower() == stem for a in analyses):
                return token[:-len(enc)], enc
    return None, None

# -------- output rendering --------------------------------------------------

def matches_attr(groups):
    if not groups:
        return 'data-matches="?:?"'
    parts = [f'{lemma}:{",".join(codes)}' for lemma, codes in groups]
    return 'data-matches="' + ';'.join(parts) + '"'

WORD_RE = re.compile(r"([A-Za-zĀ-ž]+)([^A-Za-zĀ-ž]*)")

def tokenise(text):
    for m in WORD_RE.finditer(text):
        word, trail = m.group(1), m.group(2)
        if word:
            yield (word, trail)

def render_token(token, cache):
    """Return the span HTML for `token`. Handles enclitic-splitting by
    emitting two adjacent spans."""
    analyses = analyse_token(token, cache)
    prefix_tok, enc = detect_enclitic(token, analyses)
    if prefix_tok is not None:
        # Re-analyse the prefix on its own (so multi-lemma alternatives that
        # only exist without the clitic-stripping show up).
        prefix_analyses = analyse_token(prefix_tok, cache)
        prefix_groups = group_by_lemma(prefix_analyses)
        enc_groups = [(enc, ['enclit'])]
        return (
            f'<span {matches_attr(prefix_groups)}>{prefix_tok}</span>'
            f'<span {matches_attr(enc_groups)}>{enc}</span>'
        )
    groups = group_by_lemma(analyses)
    return f'<span {matches_attr(groups)}>{token}</span>'

# -------- main --------------------------------------------------------------

def main():
    if not WRAPPER.exists():
        sys.exit(f'seed.py: wrapper not found at {WRAPPER}. See site/latin/INSTALL.md.')
    cache = load_cache()
    src = sys.stdin.read()
    lines = src.splitlines()

    # Pre-warm the cache in a single batched Morpheus invocation. Collect
    # every distinct surface form across the whole passage, plus the
    # enclitic prefixes we'll need to re-analyse for any -que/-ne/-ve word.
    all_tokens = []
    seen = set()
    for line in lines:
        for word, _ in tokenise(line):
            for candidate in {word.lower()} | {word.lower()[:-len(enc)]
                                              for enc in ENCLITICS
                                              if word.lower().endswith(enc)
                                              and len(word) > len(enc)}:
                if candidate and candidate not in cache and candidate not in seen:
                    seen.add(candidate)
                    all_tokens.append(candidate)
    if all_tokens:
        new_results = query_morpheus(all_tokens)
        cache.update(new_results)
        save_cache(cache)

    out_lines = []
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
        parts = []
        for word, trail in tokenise(line):
            parts.append(render_token(word, cache) + trail)
        joined = ' '.join(parts)
        if i < len(lines) - 1:
            joined += '<br>'
        out_lines.append(joined)
    print('<div class="latin-passage">')
    print('\n'.join(out_lines))
    print('</div>')

if __name__ == '__main__':
    main()

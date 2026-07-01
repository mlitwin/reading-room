#!/usr/bin/env python3
"""Build the Marvell Hortus / The Garden book data from source texts.

Bespoke ingest (Hortus is not in Perseus). Produces, under
content/marvell-hortus/:

  manuscript.latin.json     tokenized Hortus (movements A,B,C,D,I have Latin)
  manuscript.english.json   The Garden, 9 stanzas as movements (with line nums)
  correspondences.json      asymmetric latin<->english alignment (gaps + lacuna)
  vocabulary/<id>.json       skeleton cards for lemmas absent from the shared
                            consolidated lexicon (Option 1: seed then curate)

Inputs:
  .tmp/hortus-apparatus.json          Morpheus apparatus (run with --overrides)
  downloads/marvell/the-garden.txt    the English poem

Movements (chapters 01-09 = A-I). Latin line numbers are 1-based within the
whole poem; English likewise 1-72.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'site' / 'latin'))
import trim_primary  # noqa: E402
import seed_vocab as sv  # noqa: E402
from apparatus_to_spans import infer_pos_from_codes  # noqa: E402

# Whitaker WORDS mapping: our POS -> DICTLINE pos code, for paradigm generation.
WHITAKER_POS = {'noun': 'N', 'adj': 'ADJ', 'verb': 'V'}


def load_whitaker():
    """Load DICTLINE + INFLECTS once; return the generator context, or None if
    the Whitaker data isn't present (paradigms are then skipped — head+glosses
    still ship, an L8 warning-class backlog item)."""
    if not sv.DICTLINE_PATH.exists() or not sv.INFLECTS_PATH.exists():
        print(f"whitaker: data not at {sv.WHITAKERS_DATA} — skipping paradigm generation", file=sys.stderr)
        return None
    entries, by_stem = sv.load_dictline()
    rules = sv.load_inflects()
    return {'entries': entries, 'by_stem': by_stem, 'rules': rules}


def generate_paradigm(stem, pos, principal_parts, wh, prefix=''):
    """Return (paradigm, ppp_paradigm) from Whitaker for a regular noun / adj /
    verb, or (None, None). `prefix` prefixes every generated main-paradigm cell
    (compound verbs looked up under their base, e.g. implecto ← plecto + "im").
    The ppp table is built from the real principal parts, so it is not prefixed."""
    if wh is None:
        return None, None
    mpos = WHITAKER_POS.get(pos)
    if not mpos:
        return None, None
    entry = sv.lookup_entry(stem, morpheus_pos=pos, infl_class='', by_stem=wh['by_stem'], entries=wh['entries'])
    paradigm = ppp = None
    if entry and entry['pos'] == mpos:
        if mpos == 'N':
            paradigm = sv.generate_noun_paradigm(entry, stem, wh['rules'])
        elif mpos == 'ADJ':
            paradigm = sv.generate_adj_paradigm(entry, stem, wh['rules'])
        elif mpos == 'V':
            paradigm = sv.generate_verb_paradigm(entry, stem, wh['rules'])
    if paradigm and prefix:
        paradigm['cells'] = {k: (prefix + v if isinstance(v, str) else [prefix + x for x in v])
                             for k, v in paradigm['cells'].items()}
    if mpos == 'V' and principal_parts and len(principal_parts) >= 4:
        ppp = sv.generate_ppp_paradigm(principal_parts)
    return paradigm, ppp


# ---- Hand-authored paradigms for lemmas Whitaker misses or renders thin -----
# Standard ending tables for the regular declension classes; reproducible from a
# small `paradigm_spec` (class + stem [+ nom]) in lexicon-curation.json.
_NOUN_ROWS = ['nom', 'gen', 'dat', 'acc', 'abl']
_ADJ_COLS = ['sg.masc', 'sg.fem', 'sg.neut', 'pl.masc', 'pl.fem', 'pl.neut']

_NOUN_ENDINGS = {
    'decl1': {'nom.sg': 'a', 'gen.sg': 'ae', 'dat.sg': 'ae', 'acc.sg': 'am', 'abl.sg': 'a',
              'nom.pl': 'ae', 'gen.pl': 'arum', 'dat.pl': 'is', 'acc.pl': 'as', 'abl.pl': 'is'},
    'decl2': {'nom.sg': 'us', 'gen.sg': 'i', 'dat.sg': 'o', 'acc.sg': 'um', 'abl.sg': 'o',
              'nom.pl': 'i', 'gen.pl': 'orum', 'dat.pl': 'is', 'acc.pl': 'os', 'abl.pl': 'is'},
}


def _noun_table(cells, cols=('sg', 'pl')):
    return {'type': 'noun', 'rows': _NOUN_ROWS, 'cols': list(cols), 'cells': cells}


def _adj3(stem, nom):
    """Third-declension i-stem adjective. nom=None → two-termination (-is/-e);
    nom given → one-termination (simplex, trux …), all genders share nom.sg."""
    nm = nf = (stem + 'is') if nom is None else nom
    nn = (stem + 'e') if nom is None else nom
    accn = nn
    cells = {}
    for g, nomsg, accsg in (('masc', nm, stem + 'em'), ('fem', nf, stem + 'em'), ('neut', nn, accn)):
        cells[f'nom.sg.{g}'] = nomsg
        cells[f'gen.sg.{g}'] = stem + 'is'
        cells[f'dat.sg.{g}'] = stem + 'i'
        cells[f'acc.sg.{g}'] = accsg
        cells[f'abl.sg.{g}'] = stem + 'i'
    for g, nompl, accpl in (('masc', stem + 'es', stem + 'es'), ('fem', stem + 'es', stem + 'es'),
                            ('neut', stem + 'ia', stem + 'ia')):
        cells[f'nom.pl.{g}'] = nompl
        cells[f'gen.pl.{g}'] = stem + 'ium'
        cells[f'dat.pl.{g}'] = stem + 'ibus'
        cells[f'acc.pl.{g}'] = accpl
        cells[f'abl.pl.{g}'] = stem + 'ibus'
    return {'type': 'adj', 'rows': _NOUN_ROWS, 'cols': _ADJ_COLS, 'cells': cells}


def manual_paradigm(spec):
    cls, stem, nom = spec['class'], spec.get('stem', ''), spec.get('nom')
    if cls in _NOUN_ENDINGS:
        return _noun_table({k: stem + e for k, e in _NOUN_ENDINGS[cls].items()})
    if cls == 'decl3m':  # 3rd-decl consonant stem; nom.sg irregular, oblique on stem
        cells = {'nom.sg': nom, 'gen.sg': stem + 'is', 'dat.sg': stem + 'i', 'acc.sg': stem + 'em', 'abl.sg': stem + 'e',
                 'nom.pl': stem + 'es', 'gen.pl': stem + 'um', 'dat.pl': stem + 'ibus', 'acc.pl': stem + 'es', 'abl.pl': stem + 'ibus'}
        return _noun_table(cells)
    if cls == 'greek1f':  # Greek 1st-decl -e (Chloe), singular only
        cells = {'nom.sg': nom, 'gen.sg': stem + 'es', 'dat.sg': stem + 'ae', 'acc.sg': stem + 'en', 'abl.sg': nom}
        return _noun_table(cells, cols=('sg',))
    if cls == 'adj12':  # 1st/2nd-decl -us/-a/-um
        e = {'sg.masc': 'us', 'sg.fem': 'a', 'sg.neut': 'um'}
        obl = {'gen': {'masc': 'i', 'fem': 'ae', 'neut': 'i'}, 'dat': {'masc': 'o', 'fem': 'ae', 'neut': 'o'},
               'acc': {'masc': 'um', 'fem': 'am', 'neut': 'um'}, 'abl': {'masc': 'o', 'fem': 'a', 'neut': 'o'}}
        plur = {'nom': {'masc': 'i', 'fem': 'ae', 'neut': 'a'}, 'gen': {'masc': 'orum', 'fem': 'arum', 'neut': 'orum'},
                'dat': {'masc': 'is', 'fem': 'is', 'neut': 'is'}, 'acc': {'masc': 'os', 'fem': 'as', 'neut': 'a'},
                'abl': {'masc': 'is', 'fem': 'is', 'neut': 'is'}}
        cells = {}
        for g in ('masc', 'fem', 'neut'):
            cells[f'nom.sg.{g}'] = stem + e[f'sg.{g}']
            for r in ('gen', 'dat', 'acc', 'abl'):
                cells[f'{r}.sg.{g}'] = stem + obl[r][g]
            for r in ('nom', 'gen', 'dat', 'acc', 'abl'):
                cells[f'{r}.pl.{g}'] = stem + plur[r][g]
        return {'type': 'adj', 'rows': _NOUN_ROWS, 'cols': _ADJ_COLS, 'cells': cells}
    if cls in ('adj3two', 'adj3one'):
        return _adj3(stem, nom if cls == 'adj3one' else None)
    raise SystemExit(f'manual_paradigm: unknown class {cls!r}')

OUT_DIR = ROOT / 'content' / 'marvell-hortus'
VOCAB_DIR = OUT_DIR / 'vocabulary'
APPARATUS = ROOT / '.tmp' / 'hortus-apparatus.json'
GARDEN = ROOT / 'downloads' / 'marvell' / 'the-garden.txt'
CURATION = OUT_DIR / 'lexicon-curation.json'

POS_ABBREV = {  # grammar pos id -> lemma-id suffix
    'noun': 'n', 'verb': 'v', 'adj': 'adj', 'adv': 'adv', 'prep': 'prep',
    'conj': 'conj', 'pron': 'pron', 'interj': 'interj', 'num': 'num',
    'enclitic': 'enclit',
}
CASE_GENDER_RE = re.compile(r'\b(masc|fem|neut)\b')

# Latin movement -> inclusive line range (1-based over the 58 normalized lines).
LATIN_MOVEMENTS = {
    '1.01': (1, 6), '1.02': (7, 19), '1.03': (20, 30),
    '1.04': (31, 48), '1.09': (49, 58),
}
MOVEMENT_TITLES = {
    '01': 'The Vain Wreaths / Garlands of Repose',
    '02': 'Quiet and Innocence; the Citizen of the Grove',
    '03': 'The Lovely Green; Lovers Carving Names',
    '04': 'Love Retreats to the Trees; Gods in Pursuit',
    '05': 'The Garden’s Abundance',
    '06': 'The Mind Withdrawing',
    '07': 'The Soul in the Boughs',
    '08': 'Solitary in Paradise',
    '09': 'The Floral Sundial',
}


def load_apparatus():
    return json.loads(APPARATUS.read_text(encoding='utf-8'))


def synth_id(stem, pos):
    return f"{stem}_{POS_ABBREV.get(pos, 'x')}"


def curated_card(stem, entry, ctx):
    """Build a rich lexicon card from a curation entry, with a Whitaker-generated
    paradigm attached where one is available (regular nouns/adjs/verbs)."""
    card = {'id': synth_id(stem, entry['pos']), 'lemma': stem, 'pos': entry['pos']}
    if entry.get('gender') is not None:
        card['gender'] = entry['gender']
    card['glosses'] = entry['glosses']
    card['head'] = entry.get('head', stem)
    pp = entry.get('principal_parts')
    if pp:
        card['principal_parts'] = pp
    if entry.get('defective'):
        card['defective'] = True
        return card  # defectives (memini, potis) have no regular table to generate
    # 1. Hand-authored paradigm for lemmas Whitaker misses or renders thin.
    spec = ctx['curation'].get('paradigm_spec', {}).get(stem)
    if spec:
        card['paradigm'] = manual_paradigm(spec)
        return card
    # 2. Whitaker generation (optionally under a base lemma + prefix).
    paradigm, ppp = generate_paradigm(
        entry.get('whitaker_lemma', stem), entry['pos'], pp, ctx.get('whitaker'),
        prefix=entry.get('prefix', ''))
    if paradigm:
        card['paradigm'] = paradigm
    if ppp:
        card['ppp_paradigm'] = ppp
    return card


def resolve_stem(stem, codes, ctx):
    """Resolve a Morpheus lemma stem to (id, pos), preferring curation, then the
    consolidated lexicon. Returns (None, None) if unresolved. Registers a card
    for curated/synthesized ids that are not already in the shared lexicon."""
    cur = ctx['curation']['lemmata']
    if stem in cur:
        eid = synth_id(stem, cur[stem]['pos'])
        if eid not in ctx['lexicon_pos']:
            ctx['cards'].setdefault(eid, curated_card(stem, cur[stem], ctx))
        return eid, cur[stem]['pos']
    ids = ctx['stem_to_ids'].get(stem, [])
    if len(ids) == 1:
        return ids[0], ctx['lexicon_pos'].get(ids[0], '')
    if len(ids) > 1:
        best = max(ids, key=lambda eid: sum(
            trim_primary.code_pos_score(code, ctx['lexicon_pos'].get(eid, '')) for code in codes))
        return best, ctx['lexicon_pos'].get(best, '')
    return None, None


def synth_stub(stem, codes, ctx):
    """Last resort for an uncurated, unknown stem: skeleton card + synth id."""
    pos = infer_pos_from_codes(codes, {}, stem)
    if pos == 'unknown':
        pos = 'noun'
    eid = synth_id(stem, pos)
    if eid not in ctx['cards']:
        card = {'id': eid, 'lemma': stem, 'pos': pos,
                'glosses': ['(gloss pending — Hortus stub)'], 'head': stem}
        if pos == 'noun':
            m = CASE_GENDER_RE.search(' '.join(codes))
            if m:
                card['gender'] = m.group(1)
        card['notes'] = 'Auto-seeded skeleton for Marvell Hortus; needs curation.'
        ctx['cards'][eid] = card
    return eid, pos


def resolve_token(surface, candidates, ctx):
    """Return (data_matches, primary_id, primary_codes, pos_hint)."""
    # 1. Explicit per-surface primary override (Morpheus mis-analysis).
    override = ctx['curation']['surface_primary'].get(surface.lower())
    if override:
        stem, codes = override
        eid, pos = resolve_stem(stem, codes, ctx)
        if eid is None:  # override names a stem we couldn't resolve — synth it
            eid, pos = synth_stub(stem, codes, ctx)
        return f"{eid}:{','.join(codes)}" if codes else eid, eid, codes, pos

    # 2. Resolve every candidate; keep those that map to a real id.
    resolvable = []
    for c in candidates:
        eid, _ = resolve_stem(c['lemma'], c.get('codes', []), ctx)
        if eid is not None:
            resolvable.append((eid, c.get('codes', [])))
    if resolvable:
        resolvable.sort(key=lambda ic: trim_primary.candidate_score(ic[0], ic[1], ctx['lexicon_pos']), reverse=True)
        primary_id, primary_codes = resolvable[0]
        parts = [f"{i}:{','.join(cs)}" if cs else i for i, cs in resolvable]
        pos = infer_pos_from_codes(primary_codes, ctx['lexicon_pos'], primary_id)
        return ';'.join(parts), primary_id, primary_codes, pos

    # 3. Nothing resolved: skeleton the best guess.
    stem, codes = candidates[0]['lemma'], candidates[0].get('codes', [])
    eid, pos = synth_stub(stem, codes, ctx)
    return f"{eid}:{','.join(codes)}" if codes else eid, eid, codes, pos


def build_latin(apparatus, ctx):
    # Map global line index -> movement path.
    def movement_for(idx):
        for path, (a, b) in LATIN_MOVEMENTS.items():
            if a <= idx <= b:
                return path
        raise SystemExit(f"line {idx} not in any Latin movement")

    lines = []
    for L in apparatus['lines']:
        idx = L['line_index']
        section = movement_for(idx)
        tokens = []
        toks = L['tokens']
        for ti, t in enumerate(toks):
            dm, pid, pcodes, pos = resolve_token(t['surface'], t.get('candidates', []), ctx)
            word = {'kind': 'word', 'surface': t['surface'], 'lemma_id': pid,
                    'parses': pcodes or ['indecl'], 'pos_hint': pos, '__data_matches': dm}
            tokens.append(word)
            trail = t.get('trail', '')
            if trail:
                tokens.append({'kind': 'punct', 'text': trail})
            if ti != len(toks) - 1:
                tokens.append({'kind': 'ws'})
        lines.append({'n': idx, 'section': section, 'tokens': tokens})

    sections = [{'path': '1', 'level': 'book', 'label': 'Hortus'}]
    for path, (a, b) in LATIN_MOVEMENTS.items():
        ch = path.split('.')[1]
        sections.append({'path': path, 'level': 'chapter', 'label': f'Movement {ch}',
                         'title': MOVEMENT_TITLES[ch], 'line_range': [a, b]})
    return {'text_id': 'marvell-hortus', 'language_id': 'latin',
            'title': 'Hortus', 'author': 'Andrew Marvell',
            'hierarchy': [{'id': 'book', 'label': 'Poem'}, {'id': 'chapter', 'label': 'Movement'}],
            'sections': sections, 'lines': lines}


def parse_garden():
    """Return {stanza_int: [line, ...]} from the-garden.txt (9 stanzas x 8)."""
    raw = GARDEN.read_text(encoding='utf-8').splitlines()
    start = 0
    for i, ln in enumerate(raw):
        if set(ln.strip()) == {'='} and len(ln.strip()) > 10:
            start = i + 1
            break
    stanzas, cur = {}, None
    for ln in raw[start:]:
        s = ln.strip()
        if not s:
            continue
        m = re.match(r'^([IVX]+)\.$', s)
        if m:
            cur = {'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
                   'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9}[m.group(1)]
            stanzas[cur] = []
        elif cur:
            stanzas[cur].append(s)
    return stanzas


def build_english(stanzas):
    sections = [{'path': '1', 'level': 'book', 'label': 'The Garden'}]
    lines = []
    n = 0
    for st in range(1, 10):
        ch = f'{st:02d}'
        body = stanzas[st]
        for ln in body:
            n += 1
            lines.append({'n': n, 'section': f'1.{ch}', 'tokens': [{'kind': 'punct', 'text': ln}]})
        sections.append({'path': f'1.{ch}', 'level': 'chapter', 'label': f'Stanza {st}',
                         'title': MOVEMENT_TITLES[ch],
                         'translation': '\n'.join(body)})
    return {'text_id': 'marvell-hortus', 'language_id': 'english',
            'title': 'The Garden', 'author': 'Andrew Marvell',
            'facing_heading': 'The Garden',
            'hierarchy': [{'id': 'book', 'label': 'Poem'}, {'id': 'chapter', 'label': 'Stanza'}],
            'sections': sections, 'lines': lines}


def build_correspondences():
    m = [
        {'source': [1, 6], 'target': [1, 8], 'kind': 'parallel'},
        {'source': [7, 13], 'target': [9, 16], 'kind': 'parallel',
         'note': 'Hortus expands the praise of Quiet and Simplicity.'},
        {'source': [14, 19], 'kind': 'source-only',
         'note': "Hortus-only: the 'new citizen of the grove' conceit and the invocation of the Muses and Apollo have no counterpart in The Garden."},
        {'source': [20, 30], 'target': [17, 24], 'kind': 'parallel'},
        {'source': [31, 48], 'target': [25, 32], 'kind': 'parallel',
         'note': 'Hortus greatly expands the gods-in-trees material (Cupid disarmed; Jupiter and the oak; Mars and the ash).'},
        {'source': None, 'target': [33, 40], 'kind': 'lacuna',
         'note': "Desunt multa — the surviving Latin breaks off here. The Garden's stanza V (the garden's sensuous abundance) has no Latin counterpart."},
        {'target': [41, 48], 'kind': 'target-only',
         'note': "No Latin counterpart: The Garden VI, the Mind withdrawing to 'a green thought in a green shade'."},
        {'target': [49, 56], 'kind': 'target-only',
         'note': 'No Latin counterpart: The Garden VII, the Soul gliding into the boughs.'},
        {'target': [57, 64], 'kind': 'target-only',
         'note': 'No Latin counterpart: The Garden VIII, solitary Adam in Paradise.'},
        {'source': [49, 58], 'target': [65, 72], 'kind': 'parallel',
         'note': 'The floral sundial resumes after the lacuna.'},
    ]
    return {'text_id': 'marvell-hortus',
            'pairs': [{'source': 'latin', 'target': 'english', 'mappings': m}]}


def main():
    apparatus = load_apparatus()
    ctx = {
        'stem_to_ids': trim_primary.load_stem_to_ids(),
        'lexicon_pos': trim_primary.load_lexicon_pos(),
        'curation': json.loads(CURATION.read_text(encoding='utf-8')),
        'cards': {},
        'whitaker': load_whitaker(),
    }

    latin = build_latin(apparatus, ctx)
    english = build_english(parse_garden())
    corr = build_correspondences()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    VOCAB_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / 'manuscript.latin.json').write_text(json.dumps(latin, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (OUT_DIR / 'manuscript.english.json').write_text(json.dumps(english, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (OUT_DIR / 'correspondences.json').write_text(json.dumps(corr, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    # Rewrite vocabulary/ from scratch so it stays a pure derived artifact.
    for old in VOCAB_DIR.glob('*.json'):
        old.unlink()
    cards = ctx['cards']
    for eid, card in sorted(cards.items()):
        (VOCAB_DIR / f'{eid}.json').write_text(json.dumps(card, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    n_stub = sum(1 for c in cards.values() if 'gloss pending' in c['glosses'][0])
    n_curated = len(cards) - n_stub
    n_para = sum(1 for c in cards.values() if c.get('paradigm'))
    n_declinable = sum(1 for c in cards.values() if c['pos'] in ('noun', 'adj', 'verb') and not c.get('defective'))
    print(f"latin: {len(latin['lines'])} lines, {len(latin['sections'])-1} movements")
    print(f"english: {len(english['lines'])} lines, {len(english['sections'])-1} stanzas")
    print(f"vocabulary cards: {len(cards)} ({n_curated} curated, {n_stub} skeleton)")
    print(f"paradigms generated: {n_para}/{n_declinable} declinable lemmas")
    no_para = sorted(e for e, c in cards.items()
                     if c['pos'] in ('noun', 'adj', 'verb') and not c.get('defective') and not c.get('paradigm'))
    if no_para:
        print("no paradigm (proper nouns / deponents / DICTLINE misses):", ', '.join(no_para))


if __name__ == '__main__':
    main()

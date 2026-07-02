#!/usr/bin/env python3
"""Phase 1 corrections from development/latin-support-analysis.md.

Lexicon (content/_language/latin/lexicon.json):
  1. Second-declension vocatives: -us nouns/adjectives whose voc.sg was
     auto-filled as a copy of nom.sg get the correct -e (or -ie for -ius,
     'mi' for meus); deus keeps voc 'deus' (A&G §49.c).
  2. a-eo_v (fabricated "aeo, aeare") -> aeas_n, the river Aeas of Met 1.580.
  3. fabricator_v (verb card for a noun token) -> fabricator_n.
  4. uno_v: hybrid unire-paradigm-with-uno-cell -> regular 1st conjugation
     uno, unare (Whitaker), grids transformed from fabrico_v.
  5. ador_v / genitor_v / pastor_v / aequor_v: passive-surface headword cards
     duplicating (or garbling) real lemmata, referenced by no token -> deleted.
  6. Parse-atom rename ppl -> pap in every cell key (grammar.json models the
     present active participle as pap; ppl was seed.py's fallback spelling).

Manuscripts (content/{ovid-metamorphoses,marvell-hortus}/manuscript.latin.json):
  - ppl. -> pap. in parses and __data_matches.
  - Aeas token re-pointed to aeas_n; fabricator token to fabricator_n.
  - stanza slugs pointing at deleted ids re-pointed to the surviving lemma.
  - voc parses that no longer match the corrected vocative cells are dropped.

Idempotent: re-running after a successful run is a no-op.
"""

import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
LEXICON_PATH = REPO_ROOT / 'content' / '_language' / 'latin' / 'lexicon.json'
MANUSCRIPTS = [
    REPO_ROOT / 'content' / 'ovid-metamorphoses' / 'manuscript.latin.json',
    REPO_ROOT / 'content' / 'marvell-hortus' / 'manuscript.latin.json',
]

DELETED_STANZA_REPOINT = {
    'ador_v': 'adoro_v',
    'genitor_v': 'genitor_n',
    'pastor_v': 'pastor_n',
    'aequor_v': 'aequor_n',
    'fabricator_v': 'fabricator_n',
    'aea': 'aeas_n',
    'a-eo_v': 'aeas_n',
}


def norm(s):
    return s.lower().replace('v', 'u').replace('j', 'i')


def cell_forms(v):
    return v if isinstance(v, list) else [v]


def first(v):
    return v[0] if isinstance(v, list) else v


# ── 1. vocative corrections ─────────────────────────────────────────────────

def second_decl_vocative(nom):
    """Correct voc.sg for a 2nd-declension -us form (A&G §49.c)."""
    if nom.endswith('ius'):
        # Common nouns and adjectives in -ius decline regularly to -ie.
        # (Proper names in -ius, filius, genius would take -i, but none of
        # the affected entries are in that class.)
        return nom[:-3] + 'ie'
    return nom[:-2] + 'e'


def fix_vocatives(lemmata, report):
    """Fix voc.sg (nouns) / voc.sg.masc (adj, meus) where it wrongly copies nom."""
    changed = {}   # lemma_id -> {cell_key: new_form}
    for lem in lemmata:
        paradigm = lem.get('paradigm')
        if not paradigm:
            continue
        cells = paradigm.get('cells', {})
        if lem['pos'] == 'noun':
            pairs = [('nom.sg', 'voc.sg', 'gen.sg')]
        elif lem['pos'] in ('adj', 'pron'):
            pairs = [('nom.sg.masc', 'voc.sg.masc', 'gen.sg.masc')]
        else:
            continue
        for nom_k, voc_k, gen_k in pairs:
            nom = first(cells.get(nom_k) or '')
            voc = cells.get(voc_k)
            gen = first(cells.get(gen_k) or '')
            if not nom or voc is None or not nom.endswith('us'):
                continue
            if first(voc) != nom:
                continue                      # already distinct (radius etc.)
            if gen != nom[:-2] + 'i':
                continue                      # not 2nd declension
            if lem['id'] == 'deus_n':
                continue                      # voc deus is the classical form
            if lem['id'] == 'meus_pron':
                new = 'mi'                    # A&G §145a
            elif lem['pos'] == 'pron':
                continue                      # other pronouns: leave alone
            else:
                new = second_decl_vocative(nom)
            cells[voc_k] = new
            changed.setdefault(lem['id'], {})[voc_k] = new
    report['vocatives_fixed'] = sum(len(v) for v in changed.values())
    return changed


# ── 2–5. entry replacements ─────────────────────────────────────────────────

AEAS_ENTRY = {
    'id': 'aeas_n',
    'lemma': 'aeas',
    'pos': 'noun',
    'gender': 'masc',
    'head': 'Aeas, Aeantis, m.',
    'glosses': [
        'the Aeas (Aous)',
        'river of Epirus, flowing past Apollonia into the Ionian Sea',
    ],
    'defective': True,
    'paradigm': {
        'type': 'noun',
        'rows': ['nom', 'voc', 'gen', 'dat', 'acc', 'abl'],
        'cols': ['sg'],
        'cells': {
            'nom.sg': 'Aeas',
            'voc.sg': 'Aeas',
            'gen.sg': 'Aeantis',
            'dat.sg': 'Aeanti',
            'acc.sg': 'Aeanta',
            'abl.sg': 'Aeante',
        },
    },
}


def third_decl_masc(stem, nom):
    return {
        'nom.sg': nom, 'voc.sg': nom,
        'gen.sg': stem + 'is', 'dat.sg': stem + 'i',
        'acc.sg': stem + 'em', 'abl.sg': stem + 'e',
        'nom.pl': stem + 'es', 'voc.pl': stem + 'es',
        'gen.pl': stem + 'um', 'dat.pl': stem + 'ibus',
        'acc.pl': stem + 'es', 'abl.pl': stem + 'ibus',
    }


FABRICATOR_ENTRY = {
    'id': 'fabricator_n',
    'lemma': 'fabricator',
    'pos': 'noun',
    'gender': 'masc',
    'head': 'fabricator, -oris, m.',
    'glosses': ['maker, artificer, framer'],
    'paradigm': {
        'type': 'noun',
        'rows': ['nom', 'voc', 'gen', 'dat', 'acc', 'abl'],
        'cols': ['sg', 'pl'],
        'cells': third_decl_masc('fabricator', 'fabricator'),
    },
}


def transform_grid(grid, old_stem, new_stem):
    out = {k: grid[k] for k in grid if k != 'cells'}
    out['cells'] = {}
    for key, val in grid['cells'].items():
        forms = [re.sub('^' + old_stem, new_stem, f) for f in cell_forms(val)]
        out['cells'][key] = forms if isinstance(val, list) else forms[0]
    return out


def rewrite_entries(lemmata, report):
    by_id = {l['id']: l for l in lemmata}

    # a-eo_v -> aeas_n
    if 'a-eo_v' in by_id:
        i = lemmata.index(by_id['a-eo_v'])
        lemmata[i] = AEAS_ENTRY
        report['replaced'] = report.get('replaced', []) + ['a-eo_v -> aeas_n']

    # fabricator_v -> fabricator_n
    if 'fabricator_v' in by_id:
        i = lemmata.index(by_id['fabricator_v'])
        lemmata[i] = FABRICATOR_ENTRY
        report['replaced'] = report.get('replaced', []) + ['fabricator_v -> fabricator_n']

    # uno_v: regular 1st conjugation, grids transformed from fabrico_v
    uno = by_id.get('uno_v')
    if uno and uno.get('principal_parts') != ['uno', 'unare', 'unavi', 'unatum']:
        template = by_id['fabrico_v']
        uno['lemma'] = 'uno'
        uno['principal_parts'] = ['uno', 'unare', 'unavi', 'unatum']
        uno['glosses'] = ['unite, make one, combine']
        uno['notes'] = ('Rare verb (Whitaker: uno, unare). In most passages '
                        'uno is the ablative of unus.')
        uno['paradigm'] = transform_grid(template['paradigm'], 'fabric', 'un')
        if template.get('ppp_paradigm'):
            uno['ppp_paradigm'] = transform_grid(template['ppp_paradigm'], 'fabric', 'un')
        report['replaced'] = report.get('replaced', []) + ['uno_v -> uno/unare (1st conj.)']

    # carus_n: DICTLINE's proper noun (the emperor Carus) was picked for
    # Met 1.486 "genitor carissime" — Daphne's "dearest father". Reglossed as
    # the substantivized adjective until the degree work (Phase 2) models
    # superlatives properly.
    carus = by_id.get('carus_n')
    if carus and any('Emperor' in g for g in carus.get('glosses', [])):
        carus['glosses'] = ['dear one, beloved']
        carus['notes'] = ('Substantivized from the adjective carus; carissime '
                          '(Met 1.486) is its superlative vocative.')
        report['replaced'] = report.get('replaced', []) + ['carus_n reglossed']

    # deletions
    deleted = []
    for lid in ('ador_v', 'genitor_v', 'pastor_v', 'aequor_v'):
        if lid in by_id:
            lemmata.remove(by_id[lid])
            deleted.append(lid)
    report['deleted'] = deleted


# ── 6. ppl -> pap rename ────────────────────────────────────────────────────

def rename_ppl_cells(lemmata, report):
    n = 0
    for lem in lemmata:
        for grid_name in ('paradigm', 'ppp_paradigm'):
            grid = lem.get(grid_name)
            if not grid:
                continue
            cells = grid.get('cells', {})
            for key in [k for k in cells if k.split('.')[0] == 'ppl']:
                cells['pap' + key[3:]] = cells.pop(key)
                n += 1
            for hdr in ('rows', 'cols'):
                if hdr in grid:
                    grid[hdr] = [re.sub(r'\bppl\b', 'pap', h) for h in grid[hdr]]
    report['ppl_cells_renamed'] = n


# ── manuscript reconciliation ───────────────────────────────────────────────

def rename_ppl_parse(p):
    return '.'.join('pap' if a == 'ppl' else a for a in p.split('.'))


def voc_parse_stale(lemma_id, parse, surface, changed_voc, by_id):
    """True if `parse` is a voc parse whose corrected cell no longer matches."""
    cells_changed = changed_voc.get(lemma_id)
    if not cells_changed:
        return False
    lem = by_id.get(lemma_id)
    # Suppletive / alternate-form surfaces (carissime on carus) never matched
    # a cell literally; their analysis rides on the alt marker, not the cell.
    if lem and any(norm(surface) == norm(f) for f in lem.get('alt_forms', [])):
        return False
    key = parse
    if lem and lem['pos'] == 'noun':
        key = re.sub(r'\.(masc|fem|neut)(?=\.|$)', '', parse)
    new_form = cells_changed.get(key)
    if new_form is None:
        return False
    return norm(surface) != norm(new_form)


def fix_token(tok, changed_voc, by_id, report):
    surface = tok['surface']

    # targeted re-points
    if tok.get('lemma_id') == 'a-eo_v':
        tok.update(lemma_id='aeas_n', parses=['nom.sg.masc'], pos_hint='noun')
        report['tokens_repointed'] = report.get('tokens_repointed', 0) + 1
    if tok.get('lemma_id') == 'fabricator_v':
        tok['lemma_id'] = 'fabricator_n'
        tok['pos_hint'] = 'noun'
        report['tokens_repointed'] = report.get('tokens_repointed', 0) + 1

    # repair pass: restore the alt-form voc parse an earlier run dropped
    if (tok.get('lemma_id') == 'carus_n' and norm(surface) == 'carissime'
            and not tok.get('parses')):
        tok['parses'] = ['voc.sg.masc']
        report['tokens_repaired'] = report.get('tokens_repaired', 0) + 1

    if tok.get('stanza') in DELETED_STANZA_REPOINT:
        tok['stanza'] = DELETED_STANZA_REPOINT[tok['stanza']]
        report['stanza_repointed'] = report.get('stanza_repointed', 0) + 1

    matches = tok.get('__data_matches')
    if matches:
        groups = []
        for part in matches.split(';'):
            lemma_id, parse_str = part.split(':', 1)
            parses = [rename_ppl_parse(p) for p in parse_str.split(',')]
            kept = [p for p in parses
                    if not voc_parse_stale(lemma_id, p, surface, changed_voc, by_id)]
            if len(kept) != len(parses):
                report['voc_parses_dropped'] = (
                    report.get('voc_parses_dropped', 0) + len(parses) - len(kept))
            if kept:
                groups.append((lemma_id, kept))
        tok['__data_matches'] = ';'.join(
            f'{lid}:{",".join(ps)}' for lid, ps in groups)
        tok['parses'] = [p for _, ps in groups for p in ps]
    else:
        lemma_id = tok.get('lemma_id')
        parses = [rename_ppl_parse(p) for p in tok.get('parses', [])]
        kept = [p for p in parses
                if not voc_parse_stale(lemma_id, p, surface, changed_voc, by_id)]
        if len(kept) != len(parses):
            report['voc_parses_dropped'] = (
                report.get('voc_parses_dropped', 0) + len(parses) - len(kept))
        tok['parses'] = kept


def main():
    lexicon = json.loads(LEXICON_PATH.read_text())
    lemmata = lexicon['lemmata']
    report = {}

    changed_voc = fix_vocatives(lemmata, report)
    rewrite_entries(lemmata, report)
    rename_ppl_cells(lemmata, report)

    LEXICON_PATH.write_text(json.dumps(lexicon, indent=2, ensure_ascii=False) + '\n')

    by_id = {l['id']: l for l in lemmata}
    for ms_path in MANUSCRIPTS:
        ms = json.loads(ms_path.read_text())
        for line in ms['lines']:
            for tok in line['tokens']:
                if tok.get('kind') == 'word':
                    fix_token(tok, changed_voc, by_id, report)
        ms_path.write_text(json.dumps(ms, indent=2, ensure_ascii=False) + '\n')

    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    sys.exit(main())

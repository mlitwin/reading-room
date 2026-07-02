#!/usr/bin/env python3
"""Marvell-hortus apparatus hardening (latin-support follow-up).

The marvell vocabulary overlay was seeded with sparse mechanical grids
(20-cell verbs, no subjunctive, no participles — 'praecingat' had no cell to
live in), and the marvell concordance was outside the validation fence until
validate.js learned to iterate texts. This script closes the data half:

  A. Overlay verbs regenerated as full grids by three-stem transform from the
     shared lexicon's machine-generated 173-cell templates (fabrico=1st,
     rego=3rd, audio=4th, conor=1st dep., sequor=3rd dep.). Every template
     form must match a stem (asserted), and the target's citation form must
     land in its own cells (L9).
  B. eo_v — a fabricated first-conjugation grid ("eas, eabat, eare") papered
     over with 17 alt_forms — is rebuilt from redeo_v's real grid by
     stripping the red- prefix; the eo-compounds (abeo shared; coeo/depereo
     overlay) are regenerated as prefix+eo-grid. potior_v is built from
     audio_v's passive cells (deponent = passive morphology, filed under both
     .act and .pass keys per the nascor convention). memini_v gets its
     perfect-system defective grid. potis/quisnam/concolor get hand grids.
  C. Token-driven variant cells: for every marvell token whose surface
     matches no cell of its candidate lemma but whose parses all exist as
     cell keys, the surface is appended to those cells — this captures
     Marvell's Neo-Latin orthography (sylua, quoties, unquam) and syncopated
     perfects (celarant, notasti, uiolasse) exactly where attested. Tokens
     that still don't fit are reported for manual triage.
  D. pos_hint recomputed from the (selected) candidate lemma.
  E. The 20 multi-candidate tokens get editorial selected_lemma_id (C11).

Idempotent.
"""

import json
import re
import sys
import unicodedata
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
LEXICON_PATH = REPO_ROOT / 'content' / '_language' / 'latin' / 'lexicon.json'
VOCAB_DIR = REPO_ROOT / 'content' / 'marvell-hortus' / 'vocabulary'
MANUSCRIPT_PATH = REPO_ROOT / 'content' / 'marvell-hortus' / 'manuscript.latin.json'


def norm(s):
    s = ''.join(ch for ch in unicodedata.normalize('NFD', s)
                if not unicodedata.combining(ch))
    return s.lower().replace('v', 'u').replace('j', 'i')


def forms(v):
    return v if isinstance(v, list) else [v]


# ── A. three-stem template transforms ────────────────────────────────────────

def transform_forms(grid, stem_map):
    """stem_map: ordered [(template_stem, target_stem)], longest first.
    target_stem None drops the cell (e.g. no supine stem)."""
    out = {k: grid[k] for k in grid if k != 'cells'}
    out['cells'] = {}
    for key, val in grid['cells'].items():
        new = []
        dropped = False
        for f in forms(val):
            for old, tgt in stem_map:
                if f.startswith(old):
                    if tgt is None:
                        dropped = True
                    else:
                        new.append(tgt + f[len(old):])
                    break
            else:
                raise AssertionError(f'form "{f}" ({key}) matches no template stem')
        if dropped and not new:
            continue
        out['cells'][key] = new if isinstance(val, list) else new[0]
    return out


# template id -> its stems, longest first (supine, perfect, present)
TEMPLATES = {
    'fabrico_v': ['fabricat', 'fabricav', 'fabric'],
    'rego_v': ['rect', 'rex', 'reg'],
    'audio_v': ['audit', 'audiv', 'audi'],
    'conor_v': ['conat', 'con'],
    'sequor_v': ['secut', 'sequ'],
}

# overlay verb -> (template, target stems in template order, None = drop)
VERB_PLANS = {
    # first conjugation
    'anhelo_v':   ('fabrico_v', ['anhelat', 'anhelav', 'anhel']),
    'celo_v':     ('fabrico_v', ['celat', 'celav', 'cel']),
    'erro_v':     ('fabrico_v', ['errat', 'errav', 'err']),
    'inambulo_v': ('fabrico_v', ['inambulat', 'inambulav', 'inambul']),
    'numero_v':   ('fabrico_v', ['numerat', 'numerav', 'numer']),
    'orno_v':     ('fabrico_v', ['ornat', 'ornav', 'orn']),
    'pererro_v':  ('fabrico_v', ['pererrat', 'pererrav', 'pererr']),
    'temero_v':   ('fabrico_v', ['temerat', 'temerav', 'temer']),
    'verso_v':    ('fabrico_v', ['versat', 'versav', 'vers']),
    'violo_v':    ('fabrico_v', ['violat', 'violav', 'viol']),
    # third conjugation
    'praecingo_v':  ('rego_v', ['praecinct', 'praecinx', 'praecing']),
    'sculpo_v':     ('rego_v', ['sculpt', 'sculps', 'sculp']),
    'inscribo_v':   ('rego_v', ['inscript', 'inscrips', 'inscrib']),
    'neglego_v':    ('rego_v', ['neglect', 'neglex', 'negleg']),
    'implecto_v':   ('rego_v', ['implex', 'implexu', 'implect']),
    'intendo_v':    ('rego_v', ['intent', 'intend', 'intend']),
    'suspendo_v':   ('rego_v', ['suspens', 'suspend', 'suspend']),
    'inverto_v':    ('rego_v', ['invers', 'invert', 'invert']),
    'defervesco_v': ('rego_v', [None, 'deferbu', 'defervesc']),  # no supine
    # fourth conjugation
    'indormio_v': ('audio_v', ['indormit', 'indormiv', 'indormi']),
    # deponents
    'laetor_v': ('conor_v', ['laetat', 'laet']),
    'testor_v': ('conor_v', ['testat', 'test']),
    'allabor_v': ('sequor_v', ['allaps', 'allab']),
    'expergiscor_v': ('sequor_v', ['experrect', 'expergisc']),
}


def regen_verb(card, template_card, target_stems, report):
    stems = TEMPLATES[template_card['id']]
    stem_map = list(zip(stems, target_stems))
    card['paradigm'] = transform_forms(template_card['paradigm'], stem_map)
    if template_card.get('ppp_paradigm') and target_stems[0] is not None:
        card['ppp_paradigm'] = transform_forms(template_card['ppp_paradigm'], stem_map)
    else:
        card.pop('ppp_paradigm', None)
    report['verbs_regenerated'] = report.get('verbs_regenerated', 0) + 1


# ── A2. -io verb imperfect/future repair ─────────────────────────────────────
# The original grid generator formed imperfects as stem-minus-vowel + -bam and
# futures as stem + -bit for every conjugation. That is correct for 1st/2nd
# and (by luck of its stem handling) plain 3rd, but wrong for -io verbs of the
# 3rd and 4th: audio got "audbat" (for audiebat) and "audibit" (for audiet).
# 50 shared verbs are affected. Regenerate those two tenses from the i-stem.

IO_TENSES = {
    'imperf.ind.act': ['ebam', 'ebas', 'ebat', 'ebamus', 'ebatis', 'ebant'],
    'imperf.ind.pass': ['ebar', 'ebaris', 'ebatur', 'ebamur', 'ebamini', 'ebantur'],
    'fut.ind.act': ['am', 'es', 'et', 'emus', 'etis', 'ent'],
    'fut.ind.pass': ['ar', 'eris', 'etur', 'emur', 'emini', 'entur'],
}
PERSONS = ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl']


def fix_io_verbs(cards, dirty, report):
    for card in cards:
        if card.get('pos') != 'verb' or not card.get('paradigm'):
            continue
        cells = card['paradigm']['cells']
        one = cells.get('1sg.pres.ind.act')
        one = one[0] if isinstance(one, list) else one
        if not one:
            continue
        if one.endswith('io'):
            stem = one[:-1]
        elif one.endswith('ior'):
            stem = one[:-2]
        else:
            continue
        changed = False
        for tense, ends in IO_TENSES.items():
            for person, end in zip(PERSONS, ends):
                key = f'{person}.{tense}'
                if key not in cells:
                    continue
                correct = stem + end
                if forms(cells[key]) != [correct]:
                    cells[key] = correct
                    changed = True
        pp = card.get('principal_parts') or []
        inf = cells.get('inf.pres.act')
        inf = inf[0] if isinstance(inf, list) else inf
        # 4th-conjugation infinitive cells were generated 2nd-conj style
        # ("reperere" for reperire). If the passive 2sg shows the i-stem, the
        # infinitive must too.
        two_pass_probe = cells.get('2sg.pres.ind.pass')
        two_pass_probe = two_pass_probe[0] if isinstance(two_pass_probe, list) else two_pass_probe
        if two_pass_probe == stem + 'ris' and inf and inf != stem + 're':
            cells['inf.pres.act'] = stem + 're'
            inf = stem + 're'
            changed = True
        if (two_pass_probe == stem + 'ris' and 'inf.pres.pass' in cells
                and forms(cells['inf.pres.pass']) != [stem + 'ri']):
            cells['inf.pres.pass'] = stem + 'ri'
            changed = True
        # True 4th conjugation (not 3rd -io): also repair the passive imperfect
        # subjunctive ("auderer" → audirer) and 2sg passive imperative, both of
        # which the generator built on a fake 2nd-conjugation infinitive.
        # Detect by infinitive (audire) or, for deponents, 2sg.pres.ind.pass
        # (mentiris vs. 3io pateris).
        two_pass = cells.get('2sg.pres.ind.pass')
        two_pass = two_pass[0] if isinstance(two_pass, list) else two_pass
        is_fourth = (inf and inf.endswith('ire')) or two_pass == stem + 'ris'
        if is_fourth:
            subj_pass = {
                '1sg': stem + 'rer', '2sg': [stem + 'reris', stem + 'rere'],
                '3sg': stem + 'retur', '1pl': stem + 'remur',
                '2pl': stem + 'remini', '3pl': stem + 'rentur',
            }
            for person, correct in subj_pass.items():
                key = f'{person}.imperf.subj.pass'
                if key in cells and forms(cells[key]) != forms(correct):
                    cells[key] = correct
                    changed = True
            key = '2sg.pres.imp.pass'
            if key in cells and forms(cells[key]) != [stem + 're']:
                cells[key] = stem + 're'
                changed = True
        if len(pp) >= 2 and inf and inf.endswith('ire') and pp[1] != inf:
            pp[1] = inf
            changed = True
        if changed:
            dirty.add(card['id'])
            report['io_verbs_fixed'] = report.get('io_verbs_fixed', 0) + 1


# ── B. specials ──────────────────────────────────────────────────────────────

def rebuild_eo_family(shared_by_id, overlay_cards, report):
    redeo = shared_by_id['redeo_v']
    eo = shared_by_id['eo_v']
    if forms(eo['paradigm']['cells'].get('inf.pres.act', ''))[0] != 'ire':
        eo['principal_parts'] = ['eo', 'ire', 'ii', 'itum']
        eo['paradigm'] = transform_forms(redeo['paradigm'], [('red', '')])
        eo['ppp_paradigm'] = transform_forms(redeo['ppp_paradigm'], [('red', '')])
        eo.pop('alt_forms', None)
        report['eo_rebuilt'] = True
    for lid, prefix, pp in [
        ('abeo_v', 'ab', ['abeo', 'abire', 'abii', 'abitum']),
        ('coeo_v', 'co', ['coeo', 'coire', 'coii', 'coitum']),
        ('depereo_v', 'deper', ['depereo', 'deperire', 'deperii', 'deperitum']),
    ]:
        card = shared_by_id.get(lid) or overlay_cards.get(lid)
        if not card:
            continue
        card['principal_parts'] = pp
        card['paradigm'] = transform_forms(eo['paradigm'], [('', prefix)])
        card['ppp_paradigm'] = transform_forms(eo['ppp_paradigm'], [('', prefix)])
        report.setdefault('eo_compounds', []).append(lid)


def build_potior(card, audio, report):
    """Fourth-conjugation deponent from audio_v's passive morphology; deponent
    forms are filed under both .act and .pass keys (nascor_v convention)."""
    cells = {}
    src = audio['paradigm']['cells']
    def tr(f):
        for old, new in (('audit', 'potit'), ('audiv', 'potiv'), ('audi', 'poti')):
            if f.startswith(old):
                return new + f[len(old):]
        raise AssertionError(f'unexpected audio form {f}')
    for key, val in src.items():
        parts = key.split('.')
        if parts[-1] == 'pass' and parts[0] != 'inf':
            f = [tr(x) for x in forms(val)]
            f = f if isinstance(val, list) else f[0]
            cells[key] = f
            cells['.'.join(parts[:-1] + ['act'])] = f
        elif key == 'inf.pres.pass':
            f = tr(forms(val)[0])
            cells['inf.pres.pass'] = f
            cells['inf.pres.act'] = f
        elif parts[0] in ('pap', 'ger', 'gerundive'):
            f = [tr(x) for x in forms(val)]
            cells[key] = f if isinstance(val, list) else f[0]
    card['paradigm'] = {
        'type': 'verb',
        'rows': audio['paradigm']['rows'],
        'cols': [c for c in audio['paradigm']['cols'] if c.endswith('.pass')]
                + [c.rsplit('.', 1)[0] + '.act' for c in audio['paradigm']['cols'] if c.endswith('.pass')],
        'cells': cells,
    }
    card['ppp_paradigm'] = transform_forms(audio['ppp_paradigm'],
                                           [('audit', 'potit'), ('audi', 'poti')])
    report['potior_rebuilt'] = True


MEMINI_CELLS = {
    'inf.perf.act': 'meminisse',
    '2sg.pres.imp.act': 'memento', '2pl.pres.imp.act': 'mementote',
}
for _p, _ends in [
    ('perf.ind.act', ['i', 'isti', 'it', 'imus', 'istis', 'erunt']),
    ('plup.ind.act', ['eram', 'eras', 'erat', 'eramus', 'eratis', 'erant']),
    ('futperf.ind.act', ['ero', 'eris', 'erit', 'erimus', 'eritis', 'erint']),
    ('perf.subj.act', ['erim', 'eris', 'erit', 'erimus', 'eritis', 'erint']),
    ('plup.subj.act', ['issem', 'isses', 'isset', 'issemus', 'issetis', 'issent']),
]:
    for _person, _e in zip(['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'], _ends):
        MEMINI_CELLS[f'{_person}.{_p}'] = 'memin' + _e


def build_specials(overlay_cards, report):
    memini = overlay_cards.get('memini_v')
    if memini is not None and not (memini.get('paradigm') or {}).get('cells'):
        memini['paradigm'] = {
            'type': 'verb', 'rows': ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'],
            'cols': ['perf.ind.act', 'plup.ind.act', 'futperf.ind.act',
                     'perf.subj.act', 'plup.subj.act'],
            'cells': dict(MEMINI_CELLS),
        }
        memini['notes'] = ('Defective: perfect system only, with present force '
                           '("I remember"). Imperative memento.')
        report['memini_grid'] = True

    potis = overlay_cards.get('potis_adj')
    if potis is not None and not potis.get('paradigm'):
        potis['paradigm'] = {
            'type': 'adj', 'rows': ['nom', 'voc', 'gen', 'dat', 'acc', 'abl'],
            'cols': ['sg.masc', 'sg.fem', 'sg.neut'],
            'cells': {
                'nom.sg.masc': 'potis', 'nom.sg.fem': 'potis', 'nom.sg.neut': 'pote',
                'acc.sg.masc': 'potis', 'acc.sg.fem': 'potis', 'acc.sg.neut': 'pote',
            },
        }
        potis['defective'] = True
        potis['notes'] = ('Indeclinable predicative adjective (potis / pote); '
                          'no oblique forms in classical use.')
        report['potis_grid'] = True

    quisnam = overlay_cards.get('quisnam_pron')
    if quisnam is not None and not quisnam.get('paradigm'):
        quisnam['paradigm'] = {
            'type': 'pron', 'rows': ['nom', 'gen', 'dat', 'acc', 'abl'],
            'cols': ['sg.masc', 'sg.fem', 'sg.neut'],
            'cells': {
                'nom.sg.masc': 'quisnam', 'nom.sg.fem': 'quaenam', 'nom.sg.neut': 'quidnam',
                'gen.sg.masc': 'cuiusnam', 'gen.sg.fem': 'cuiusnam', 'gen.sg.neut': 'cuiusnam',
                'dat.sg.masc': 'cuinam', 'dat.sg.fem': 'cuinam', 'dat.sg.neut': 'cuinam',
                'acc.sg.masc': 'quemnam', 'acc.sg.fem': 'quamnam', 'acc.sg.neut': 'quidnam',
                'abl.sg.masc': 'quonam', 'abl.sg.fem': 'quanam', 'abl.sg.neut': 'quonam',
            },
        }
        quisnam['defective'] = True
        report['quisnam_grid'] = True

    concolor = overlay_cards.get('concolor_adj')
    if concolor is not None and 'nom.sg.masc' not in concolor['paradigm']['cells']:
        c = {}
        for g in ('masc', 'fem', 'neut'):
            c[f'nom.sg.{g}'] = 'concolor'
            c[f'voc.sg.{g}'] = 'concolor'
            c[f'gen.sg.{g}'] = 'concoloris'
            c[f'dat.sg.{g}'] = 'concolori'
            c[f'acc.sg.{g}'] = 'concolor' if g == 'neut' else 'concolorem'
            c[f'abl.sg.{g}'] = 'concolori'
            pl = 'concoloria' if g == 'neut' else 'concolores'
            for case in ('nom', 'voc', 'acc'):
                c[f'{case}.pl.{g}'] = pl
            c[f'gen.pl.{g}'] = 'concolorum'
            c[f'dat.pl.{g}'] = 'concoloribus'
            c[f'abl.pl.{g}'] = 'concoloribus'
        concolor['paradigm']['cells'] = c
        concolor['paradigm']['cols'] = ['sg.masc', 'sg.fem', 'sg.neut',
                                        'pl.masc', 'pl.fem', 'pl.neut']
        report['concolor_grid'] = True


# ── B1b. ire-family participles/gerunds + third-declension plurals + voc ────

def fix_ire_family(cards, dirty, report):
    """Compounds of ire (and ire itself) had participle obliques and gerunds
    on the wrong stem (redientem, rediendi — for redeuntem, redeundi). The
    nominative iens is correct; obliques use eunt-, gerund/gerundive eund-."""
    for card in cards:
        if card.get('pos') != 'verb' or not card.get('paradigm'):
            continue
        cells = card['paradigm']['cells']
        one = cells.get('1sg.pres.ind.act')
        one = one[0] if isinstance(one, list) else one
        inf = cells.get('inf.pres.act')
        inf = inf[0] if isinstance(inf, list) else inf
        if not one or not one.endswith('eo') or not (inf or '').endswith('ire'):
            continue
        prefix = one[:-2]
        pap = {'nom.sg': 'iens', 'voc.sg': 'iens', 'gen.sg': 'euntis',
               'dat.sg': 'eunti', 'abl.sg': 'eunte',
               'gen.pl': 'euntium', 'dat.pl': 'euntibus', 'abl.pl': 'euntibus'}
        changed = False
        for key in [k for k in cells if k.startswith('pap.')]:
            _, case, num, g = key.split('.')
            if f'{case}.{num}' in pap:
                correct = prefix + pap[f'{case}.{num}']
            elif num == 'sg':  # acc.sg
                correct = prefix + ('iens' if g == 'neut' else 'euntem')
            else:              # nom/voc/acc pl
                correct = prefix + ('euntia' if g == 'neut' else 'euntes')
            if forms(cells[key]) != [correct]:
                cells[key] = correct
                changed = True
        ger = {'ger.gen.sg': 'eundi', 'ger.dat.sg': 'eundo',
               'ger.acc.sg': 'eundum', 'ger.abl.sg': 'eundo'}
        for key, suffix in ger.items():
            if key in cells and forms(cells[key]) != [prefix + suffix]:
                cells[key] = prefix + suffix
                changed = True
        for key in [k for k in cells if k.startswith('gerundive.')]:
            _, case, num, g = key.split('.')
            correct = prefix + 'eund' + ADJ12_ENDINGS[f'{num}.{g}'][case]
            if forms(cells[key]) != [correct]:
                cells[key] = correct
                changed = True
        if changed:
            dirty.add(card['id'])
            report['ire_family_fixed'] = report.get('ire_family_fixed', 0) + 1


GREEK_NOM_ENDINGS = ('e', 'es', 'as', 'os', 'on', 'eus')


def fix_nominal_grids_global(cards, dirty, report):
    """Two systematic gaps in the generated noun/adj grids:
    - third-declension acc.pl was emitted only as the i-stem -is form; add the
      normal -es form (keeping -is, which Ovid's tokens attest for i-stems);
    - vocatives were often omitted. voc.pl = nom.pl is exceptionless; voc.sg
      follows A&G §49.c for 2nd-decl -us and equals nom.sg elsewhere (Greek
      nominatives are left alone — the card renderer falls back voc→nom)."""
    for card in cards:
        if card.get('pos') not in ('noun', 'adj') or not card.get('paradigm'):
            continue
        cells = card['paradigm']['cells']
        changed = False
        first = lambda v: v[0] if isinstance(v, list) else v

        if card['pos'] == 'noun':
            ap, np = cells.get('acc.pl'), cells.get('nom.pl')
            if ap and np and first(np).endswith('es') and first(ap) == first(np)[:-2] + 'is':
                cells['acc.pl'] = [first(np), first(ap)]
                changed = True
            pairs = [('nom.sg', 'voc.sg', 'gen.sg'), ('nom.pl', 'voc.pl', None)]
        else:
            pairs = [(f'nom.{num}.{g}', f'voc.{num}.{g}', f'gen.{num}.{g}')
                     for num in ('sg', 'pl') for g in ('masc', 'fem', 'neut')]

        for nom_k, voc_k, gen_k in pairs:
            if voc_k in cells or nom_k not in cells:
                continue
            nom = first(cells[nom_k])
            gen = first(cells.get(gen_k) or '') if gen_k else ''
            if nom_k.endswith('.pl') or '.pl.' in nom_k:
                cells[voc_k] = cells[nom_k]
                changed = True
            elif nom.endswith('us') and gen == nom[:-2] + 'i':
                if card['id'] in ('deus_n',):
                    cells[voc_k] = nom
                elif nom.endswith('ius') and card['pos'] == 'noun' and nom[:1].isupper():
                    cells[voc_k] = nom[:-2]
                elif nom.endswith('ius'):
                    cells[voc_k] = nom[:-3] + 'ie'
                else:
                    cells[voc_k] = nom[:-2] + 'e'
                changed = True
            elif not nom.lower().endswith(GREEK_NOM_ENDINGS) and not nom.endswith('us'):
                cells[voc_k] = cells[nom_k]
                changed = True
            elif nom.endswith('us') and gen != nom[:-2] + 'i' and gen:
                cells[voc_k] = cells[nom_k]  # 4th declension etc.
                changed = True
        if changed:
            dirty.add(card['id'])
            report['nominal_grids_filled'] = report.get('nominal_grids_filled', 0) + 1


# ── B2. nominal grid completion + attested comparatives + lapsus_n ──────────

ADJ12_ENDINGS = {
    'sg.masc': {'nom': 'us', 'voc': 'e', 'gen': 'i', 'dat': 'o', 'acc': 'um', 'abl': 'o'},
    'sg.fem':  {'nom': 'a', 'voc': 'a', 'gen': 'ae', 'dat': 'ae', 'acc': 'am', 'abl': 'a'},
    'sg.neut': {'nom': 'um', 'voc': 'um', 'gen': 'i', 'dat': 'o', 'acc': 'um', 'abl': 'o'},
    'pl.masc': {'nom': 'i', 'voc': 'i', 'gen': 'orum', 'dat': 'is', 'acc': 'os', 'abl': 'is'},
    'pl.fem':  {'nom': 'ae', 'voc': 'ae', 'gen': 'arum', 'dat': 'is', 'acc': 'as', 'abl': 'is'},
    'pl.neut': {'nom': 'a', 'voc': 'a', 'gen': 'orum', 'dat': 'is', 'acc': 'a', 'abl': 'is'},
}


def adj12_cells(stem, prefix=''):
    return {f'{prefix}{case}.{col}': stem + end
            for col, ends in ADJ12_ENDINGS.items() for case, end in ends.items()}


def comp_cells(stem, prefix='comp.'):
    c = {}
    for g in ('masc', 'fem', 'neut'):
        n = stem + ('ius' if g == 'neut' else 'ior')
        c[f'{prefix}nom.sg.{g}'] = n
        c[f'{prefix}voc.sg.{g}'] = n
        c[f'{prefix}gen.sg.{g}'] = stem + 'ioris'
        c[f'{prefix}dat.sg.{g}'] = stem + 'iori'
        c[f'{prefix}acc.sg.{g}'] = n if g == 'neut' else stem + 'iorem'
        c[f'{prefix}abl.sg.{g}'] = stem + 'iore'
        pl = stem + ('iora' if g == 'neut' else 'iores')
        for case in ('nom', 'voc', 'acc'):
            c[f'{prefix}{case}.pl.{g}'] = pl
        c[f'{prefix}gen.pl.{g}'] = stem + 'iorum'
        c[f'{prefix}dat.pl.{g}'] = stem + 'ioribus'
        c[f'{prefix}abl.pl.{g}'] = stem + 'ioribus'
    return c


LAPSUS_ENTRY = {
    'id': 'lapsus_n',
    'lemma': 'lapsus',
    'pos': 'noun',
    'gender': 'masc',
    'head': 'lapsus, -us, m.',
    'glosses': ['a gliding, sliding, flowing', 'the smooth passage (of time, water, stars)'],
    'paradigm': {
        'type': 'noun',
        'rows': ['nom', 'voc', 'gen', 'dat', 'acc', 'abl'],
        'cols': ['sg', 'pl'],
        'cells': {
            'nom.sg': 'lapsus', 'voc.sg': 'lapsus', 'gen.sg': 'lapsus',
            'dat.sg': 'lapsui', 'acc.sg': 'lapsum', 'abl.sg': 'lapsu',
            'nom.pl': 'lapsus', 'voc.pl': 'lapsus', 'gen.pl': 'lapsuum',
            'dat.pl': 'lapsibus', 'acc.pl': 'lapsus', 'abl.pl': 'lapsibus',
        },
    },
}


def fix_nominals(overlay_cards, overlay_files, shared_by_id, report, dirty):
    # First/second-declension overlay adjectives: complete to the full 36-cell
    # grid (the seeder dropped vocatives and dative/ablative plurals).
    for card in overlay_cards.values():
        if card.get('pos') != 'adj' or not card.get('paradigm'):
            continue
        m = re.match(r'^(\S+?)us, -a, -um', card.get('head') or '')
        if not m:
            continue
        cells = card['paradigm']['cells']
        full = adj12_cells(m.group(1))
        added = 0
        for key, val in full.items():
            if key not in cells:
                cells[key] = val
                added += 1
        if added:
            card['paradigm']['cols'] = ['sg.masc', 'sg.fem', 'sg.neut',
                                        'pl.masc', 'pl.fem', 'pl.neut']
            dirty.add(card['id'])
            report['adj_cells_completed'] = report.get('adj_cells_completed', 0) + added

    # civis: nominative/vocative plural cives (grid had only the i-stem -is
    # alternative), vocatives.
    civis = overlay_cards.get('civis_n')
    if civis:
        c = civis['paradigm']['cells']
        want = {'nom.pl': ['cives', 'civis'], 'acc.pl': ['cives', 'civis'],
                'voc.pl': ['cives', 'civis'], 'voc.sg': 'civis'}
        for k, v in want.items():
            if forms(c.get(k, [])) != forms(v):
                c[k] = v
                dirty.add('civis_n')
                report['civis_fixed'] = True

    # cancer: grid was third-declension ("canceris") against its own head
    # (cancer, -cri) — regenerate as second declension in -er.
    cancer = overlay_cards.get('cancer_n')
    if cancer and forms(cancer['paradigm']['cells'].get('gen.sg', ''))[0] != 'cancri':
        cancer['paradigm']['cells'] = {
            'nom.sg': 'cancer', 'voc.sg': 'cancer', 'gen.sg': 'cancri',
            'dat.sg': 'cancro', 'acc.sg': 'cancrum', 'abl.sg': 'cancro',
            'nom.pl': 'cancri', 'voc.pl': 'cancri', 'gen.pl': 'cancrorum',
            'dat.pl': 'cancris', 'acc.pl': 'cancros', 'abl.pl': 'cancris',
        }
        dirty.add('cancer_n')
        report['cancer_fixed'] = True

    # Attested comparatives: potior(i) on potis, candidior on candidus.
    potis = overlay_cards.get('potis_adj')
    if potis and 'comp.dat.sg.masc' not in potis['paradigm']['cells']:
        potis['paradigm']['cells'].update(comp_cells('pot'))
        dirty.add('potis_adj')
        report['potis_comp'] = True
    candidus = overlay_cards.get('candidus_adj')
    if candidus and 'comp.nom.sg.masc' not in candidus['paradigm']['cells']:
        candidus['paradigm']['cells'].update(comp_cells('candid'))
        dirty.add('candidus_adj')
        report['candidus_comp'] = True

    # audio: future active participle (auditurus attested at line 36).
    audio = shared_by_id['audio_v']
    if 'fap.nom.sg.masc' not in audio['paradigm']['cells']:
        audio['paradigm']['cells'].update(adj12_cells('auditur', prefix='fap.'))
        dirty.add('audio_v')
        report['audio_fap'] = True

    # Chloe: Greek name, singular-only by nature (L8 floor doesn't apply).
    chloe = overlay_cards.get('Chloe_n')
    if chloe and not chloe.get('defective'):
        chloe['defective'] = True
        dirty.add('Chloe_n')
        report['chloe_defective'] = True

    # lapsus, -us: "Temporis O suaves lapsus!" (line 57) is the fourth-
    # declension noun, not labor.
    if 'lapsus_n' not in overlay_cards:
        overlay_cards['lapsus_n'] = LAPSUS_ENTRY
        overlay_files['lapsus_n'] = VOCAB_DIR / 'lapsus_n.json'
        dirty.add('lapsus_n')
        report['lapsus_added'] = True


# ── C/D/E. manuscript-driven repairs ─────────────────────────────────────────

# Editorial disambiguation for the 20 multi-candidate tokens (C11), read from
# the poem: line number -> surface -> lemma.
C11_SELECTIONS = {
    (1, 'genus'): 'genus_n',        # "mortale genus" — vocative address
    (14, 'nouum'): 'novus_adj',     # agrees with Municipem
    (15, 'regna'): 'regnum_n',      # "in florea Regna"
    (17, 'armenta'): 'armentum_n',  # herds (nom. pl.)
    (19, 'sola'): 'solus_adj',      # "Consortia sola"
    (20, 'quem'): 'quis_pron',      # interrogative
    (21, 'quam'): 'qui_pron',       # "Quam ... vincentem" acc. sg. fem.
    (22, 'uiridis'): 'viridis_adj', # agrees with Virtus
    (24, 'uoces'): 'vox_n',         # subject of aequare clause
    (25, 'quis'): 'quis_pron',      # "quis credat?"
    (30, 'libro'): 'liber_n',       # "in proprio libro" — bark/book
    (32, 'amor'): 'amor_n',         # personified Love
    (33, 'tela'): 'telum_n',        # "stridula tela" — weapons
    (39, 'experti'): 'experior_v',  # "experti toties" perf. part.
    (39, 'nymphas'): 'nympha_n',
    (49, 'sine'): 'sine_prep',
    (50, 'qui'): 'qui_pron',
    (50, 'flore'): 'flos_n',        # "laeto flore"
    (52, 'signa'): 'signum_n',      # "fragrantia Signa"
    (56, 'sua'): 'suus_pron',       # agrees with pensa
}


# Tokens whose candidate lemma or parses need recomputation against the
# corrected grids: (line, normalized surface) -> lemma_id.
RECOMPUTE_TOKENS = {
    (16, 'conscie'): 'conscius_adj',   # voc.sg.neut was junk
    (26, 'potiori'): 'potis_adj',      # comparative dative
    (52, 'candidior'): 'candidus_adj', # comparative
    (53, 'cancri'): 'cancer_n',        # regenerated 2nd-decl grid
    (57, 'lapsus'): 'lapsus_n',        # was labor_n with a ppp parse
}


def matching_parses(lemma, surface):
    """Every cell of the lemma whose form matches the surface, gender-stamped
    for nouns like build-glossary."""
    target = norm(surface)
    genders = lemma.get('gender')
    if genders and not isinstance(genders, list):
        genders = [genders]
    out = []
    for which in ('paradigm', 'ppp_paradigm'):
        grid = lemma.get(which)
        if not grid:
            continue
        for key, val in grid['cells'].items():
            if not any(norm(f) == target for f in forms(val)):
                continue
            if (lemma['pos'] == 'noun' and genders
                    and not re.search(r'\.(masc|fem|neut)(\.|$)', key)):
                out.extend(f'{key}.{g}' for g in genders)
            else:
                out.append(key)
    seen = set()
    return [p for p in out if not (p in seen or seen.add(p))]


def cell_index(lemma):
    """normalized form -> set of cell keys, over both grids."""
    idx = {}
    for which in ('paradigm', 'ppp_paradigm'):
        grid = lemma.get(which)
        if not grid:
            continue
        for key, val in grid['cells'].items():
            for f in forms(val):
                idx.setdefault(norm(f), set()).add(key)
    return idx


def find_cell(lemma, key):
    for which in ('paradigm', 'ppp_paradigm'):
        grid = lemma.get(which)
        if grid and key in grid['cells']:
            return grid['cells'], key
    return None, None


def strip_gender(parse):
    return re.sub(r'\.(masc|fem|neut)(?=\.|$)', '', parse)


def repair_tokens(ms, by_id, dirty, report):
    manual = []
    for line in ms['lines']:
        for tok in line['tokens']:
            if tok.get('kind') != 'word':
                continue
            surface = tok['surface']
            target = norm(surface)

            # E. editorial selections
            sel = C11_SELECTIONS.get((line.get('n'), target))
            if sel and not tok.get('selected_lemma_id'):
                tok['selected_lemma_id'] = sel
                report['c11_selected'] = report.get('c11_selected', 0) + 1

            # targeted recompute against corrected grids
            rec = RECOMPUTE_TOKENS.get((line.get('n'), target))
            if rec:
                lemma = by_id[rec]
                parses = matching_parses(lemma, surface)
                assert parses, f'recompute {surface} -> {rec}: no matching cells'
                tok['lemma_id'] = rec
                tok['parses'] = parses
                tok['pos_hint'] = lemma['pos']
                tok.pop('__data_matches', None)
                tok.pop('selected_lemma_id', None)
                report['tokens_recomputed'] = report.get('tokens_recomputed', 0) + 1

            # candidates: (lemma_id, parses)
            if tok.get('__data_matches'):
                cands = [(p.split(':', 1)[0], p.split(':', 1)[1].split(','))
                         for p in tok['__data_matches'].split(';')]
            else:
                cands = [(tok['lemma_id'], tok.get('parses', []))]

            # scrub: a noun parse stamped with a gender the lemma doesn't have
            # (genus_n tagged nom.sg.masc — genus is neuter) is annotation junk.
            scrubbed = False
            new_cands = []
            for lid, parses in cands:
                lem = by_id.get(lid)
                if lem and lem.get('pos') == 'noun' and lem.get('gender'):
                    genders = lem['gender'] if isinstance(lem['gender'], list) else [lem['gender']]
                    kept = [p for p in parses
                            if not (re.search(r'\.(masc|fem|neut)(?=\.|$)', p)
                                    and re.search(r'\.(masc|fem|neut)(?=\.|$)', p).group(1) not in genders)]
                    if kept and kept != parses:
                        parses = kept
                        scrubbed = True
                new_cands.append((lid, parses))
            if scrubbed:
                cands = new_cands
                if tok.get('__data_matches'):
                    tok['__data_matches'] = ';'.join(
                        f'{lid}:{",".join(ps)}' for lid, ps in cands)
                tok['parses'] = [p for _, ps in cands for p in ps]
                report['gender_parses_scrubbed'] = report.get('gender_parses_scrubbed', 0) + 1

            # D. pos_hint from the effective candidate
            eff = tok.get('selected_lemma_id') or cands[0][0]
            lemma = by_id.get(eff)
            if lemma:
                hint = 'enclit' if lemma['pos'] == 'enclitic' else lemma['pos']
                if tok.get('pos_hint') != lemma['pos'] and tok.get('pos_hint') != hint:
                    tok['pos_hint'] = lemma['pos']
                    report['pos_hints_fixed'] = report.get('pos_hints_fixed', 0) + 1

            # C. attested-variant cells
            for lid, parses in cands:
                lem = by_id.get(lid)
                if not lem:
                    manual.append((line.get('n'), surface, lid, 'lemma missing'))
                    continue
                if not lem.get('paradigm') and not lem.get('ppp_paradigm'):
                    if target != norm(lem['lemma']) and target not in map(norm, lem.get('alt_forms', [])):
                        lem.setdefault('alt_forms', []).append(surface)
                        dirty.add(lid)
                        report['alt_forms_added'] = report.get('alt_forms_added', 0) + 1
                    continue
                idx = cell_index(lem)
                if target in idx:
                    continue
                keys = []
                ok = True
                for p in parses:
                    cells, key = find_cell(lem, p)
                    if cells is None and lem['pos'] == 'noun':
                        cells, key = find_cell(lem, strip_gender(p))
                    if cells is None:
                        ok = False
                        break
                    keys.append((cells, key))
                if not ok:
                    manual.append((line.get('n'), surface, lid, f'parses {parses} have no cells'))
                    continue
                seen_keys = set()
                for cells, key in keys:
                    if (id(cells), key) in seen_keys:
                        continue
                    seen_keys.add((id(cells), key))
                    cur = forms(cells[key])
                    if not any(norm(f) == target for f in cur):
                        cells[key] = cur + [surface]
                report['variant_cells_added'] = report.get('variant_cells_added', 0) + 1
                dirty.add(lid)
    report['manual'] = [f'{n}: {s} -> {lid}: {why}' for n, s, lid, why in manual]


def recompute_marvell_parses(ms, by_id, report):
    """Final canonicalization: every candidate's parses become exactly the
    cells its surface fills (the study-tool convention), matching what the
    glossary derives — so C3 can't disagree. Paradigmless and alt-form-only
    candidates keep their annotated parses; candidates whose lemma yields the
    surface nowhere are dropped (junk like optimas_n on 'optate')."""
    for line in ms['lines']:
        for tok in line['tokens']:
            if tok.get('kind') != 'word':
                continue
            surface = tok['surface']
            if tok.get('__data_matches'):
                cands = [(p.split(':', 1)[0], p.split(':', 1)[1].split(','))
                         for p in tok['__data_matches'].split(';')]
            else:
                cands = [(tok['lemma_id'], tok.get('parses', []))]
            keep = []
            changed = False
            for lid, parses in cands:
                lem = by_id.get(lid)
                if not lem:
                    keep.append((lid, parses))
                    continue
                if not lem.get('paradigm') and not lem.get('ppp_paradigm'):
                    keep.append((lid, parses))
                    continue
                mp = matching_parses(lem, surface)
                if mp:
                    if mp != parses:
                        changed = True
                    keep.append((lid, mp))
                elif any(norm(surface) == norm(f) for f in lem.get('alt_forms', [])):
                    keep.append((lid, parses))
                else:
                    changed = True
                    report.setdefault('candidates_dropped', []).append(
                        f"{line.get('n')}: {surface} -> {lid}")
            if not keep:
                report.setdefault('recompute_manual', []).append(
                    f"{line.get('n')}: {surface}")
                continue
            if not changed:
                continue
            if len(keep) > 1:
                tok['__data_matches'] = ';'.join(
                    f'{lid}:{",".join(ps)}' for lid, ps in keep)
            else:
                tok.pop('__data_matches', None)
                tok.pop('selected_lemma_id', None)
            if tok.get('selected_lemma_id') and tok['selected_lemma_id'] not in [k for k, _ in keep]:
                report.setdefault('selection_lost', []).append(
                    f"{line.get('n')}: {surface}")
                tok.pop('selected_lemma_id', None)
            tok['lemma_id'] = tok.get('selected_lemma_id') or keep[0][0]
            tok['parses'] = [p for _, ps in keep for p in ps]
            report['parses_recomputed'] = report.get('parses_recomputed', 0) + 1


# ── main ─────────────────────────────────────────────────────────────────────

def main():
    lexicon = json.loads(LEXICON_PATH.read_text())
    shared_by_id = {l['id']: l for l in lexicon['lemmata']}

    overlay_cards = {}
    overlay_files = {}
    for f in sorted(VOCAB_DIR.glob('*.json')):
        card = json.loads(f.read_text())
        overlay_cards[card.get('id', f.stem)] = card
        overlay_files[card.get('id', f.stem)] = f

    report = {}
    dirty = set()  # lemma ids whose card changed

    # A2 first: templates (audio_v) must be correct before transforms use them.
    fix_io_verbs(list(shared_by_id.values()) + list(overlay_cards.values()),
                 dirty, report)

    # A. verb regeneration (skip if already full-size — idempotence)
    for lid, (tmpl_id, stems) in VERB_PLANS.items():
        card = overlay_cards[lid]
        if len(card['paradigm']['cells']) >= 120:
            continue
        regen_verb(card, shared_by_id[tmpl_id], stems, report)
        dirty.add(lid)

    # B. specials
    before = json.dumps({k: shared_by_id[k] for k in ('eo_v', 'abeo_v')}, sort_keys=True)
    rebuild_eo_family(shared_by_id, overlay_cards, report)
    if json.dumps({k: shared_by_id[k] for k in ('eo_v', 'abeo_v')}, sort_keys=True) != before:
        dirty.update(['eo_v', 'abeo_v'])
    dirty.update(report.get('eo_compounds', []))

    potior = overlay_cards['potior_v']
    if len(potior['paradigm']['cells']) < 60:
        build_potior(potior, shared_by_id['audio_v'], report)
        dirty.add('potior_v')

    build_specials(overlay_cards, report)
    fix_nominals(overlay_cards, overlay_files, shared_by_id, report, dirty)
    all_cards = list(shared_by_id.values()) + list(overlay_cards.values())
    fix_ire_family(all_cards, dirty, report)
    fix_nominal_grids_global(all_cards, dirty, report)
    for k, flag in (('memini_v', 'memini_grid'), ('potis_adj', 'potis_grid'),
                    ('quisnam_pron', 'quisnam_grid'), ('concolor_adj', 'concolor_grid')):
        if report.get(flag):
            dirty.add(k)

    # C/D/E over the manuscript, against the merged lemma view
    by_id = dict(shared_by_id)
    by_id.update(overlay_cards)
    ms = json.loads(MANUSCRIPT_PATH.read_text())
    repair_tokens(ms, by_id, dirty, report)
    recompute_marvell_parses(ms, by_id, report)

    # write back
    for lid in sorted(dirty):
        if lid in overlay_files:
            overlay_files[lid].write_text(
                json.dumps(overlay_cards[lid], indent=2, ensure_ascii=False) + '\n')
    if dirty & set(shared_by_id):
        LEXICON_PATH.write_text(json.dumps(lexicon, indent=2, ensure_ascii=False) + '\n')
    MANUSCRIPT_PATH.write_text(json.dumps(ms, indent=2, ensure_ascii=False) + '\n')

    print(json.dumps(report, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())

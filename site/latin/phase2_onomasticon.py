#!/usr/bin/env python3
"""Phase 2 of development/latin-support-analysis.md: retire the unknown_adv
sentinel by lemmatizing all 111 unresolved Ovid tokens.

~90 are proper nouns / derived adjectives (the onomasticon: rivers of the
Peneus catalogue, Arcadian mountains, theonyms, patronymics, ethnic
adjectives); ~20 are ordinary words the first-pass pipeline missed; four are
quote-interrupted -que enclitics.

For each token the assigned lemma either already exists in the lexicon or is
authored here (glosses cross-checked against the vendored Lewis & Short).
Token parses are computed mechanically: every paradigm cell of the assigned
lemma whose form matches the token surface (normalized), gender-stamped for
nouns exactly as build-glossary does — the card is a study tool, not an
answer key.

Deponent verbs (moderor, conplector) are stem-transformed from the existing
machine-generated deponent grids (conor_v, sequor_v). Idempotent.
"""

import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
LEXICON_PATH = REPO_ROOT / 'content' / '_language' / 'latin' / 'lexicon.json'
MANUSCRIPT_PATH = REPO_ROOT / 'content' / 'ovid-metamorphoses' / 'manuscript.latin.json'

NOUN_ROWS = ['nom', 'voc', 'gen', 'dat', 'acc', 'abl']
ADJ_COLS = ['sg.masc', 'sg.fem', 'sg.neut', 'pl.masc', 'pl.fem', 'pl.neut']


def norm(s):
    return s.lower().replace('v', 'u').replace('j', 'i')


def forms(v):
    return v if isinstance(v, list) else [v]


# ── paradigm builders ────────────────────────────────────────────────────────

def decl1(stem, sg_only=False):
    c = {'nom.sg': stem + 'a', 'voc.sg': stem + 'a', 'gen.sg': stem + 'ae',
         'dat.sg': stem + 'ae', 'acc.sg': stem + 'am', 'abl.sg': stem + 'a'}
    if not sg_only:
        c.update({'nom.pl': stem + 'ae', 'voc.pl': stem + 'ae',
                  'gen.pl': stem + 'arum', 'dat.pl': stem + 'is',
                  'acc.pl': stem + 'as', 'abl.pl': stem + 'is'})
    return c


def decl2m(stem, sg_only=False):
    c = {'nom.sg': stem + 'us', 'voc.sg': stem + 'e', 'gen.sg': stem + 'i',
         'dat.sg': stem + 'o', 'acc.sg': stem + 'um', 'abl.sg': stem + 'o'}
    if not sg_only:
        c.update({'nom.pl': stem + 'i', 'voc.pl': stem + 'i',
                  'gen.pl': stem + 'orum', 'dat.pl': stem + 'is',
                  'acc.pl': stem + 'os', 'abl.pl': stem + 'is'})
    return c


def decl2n(stem, sg_only=False):
    c = {'nom.sg': stem + 'um', 'voc.sg': stem + 'um', 'gen.sg': stem + 'i',
         'dat.sg': stem + 'o', 'acc.sg': stem + 'um', 'abl.sg': stem + 'o'}
    if not sg_only:
        c.update({'nom.pl': stem + 'a', 'voc.pl': stem + 'a',
                  'gen.pl': stem + 'orum', 'dat.pl': stem + 'is',
                  'acc.pl': stem + 'a', 'abl.pl': stem + 'is'})
    return c


def decl3(nom, stem, gen_pl='um', sg_only=False):
    c = {'nom.sg': nom, 'voc.sg': nom, 'gen.sg': stem + 'is',
         'dat.sg': stem + 'i', 'acc.sg': stem + 'em', 'abl.sg': stem + 'e'}
    if not sg_only:
        c.update({'nom.pl': stem + 'es', 'voc.pl': stem + 'es',
                  'gen.pl': stem + gen_pl, 'dat.pl': stem + 'ibus',
                  'acc.pl': stem + 'es', 'abl.pl': stem + 'ibus'})
    return c


def noun(id_, lemma, gender, head, glosses, cells, defective=False,
         cols=None, notes=None):
    e = {'id': id_, 'lemma': lemma, 'pos': 'noun', 'gender': gender,
         'head': head, 'glosses': glosses}
    if notes:
        e['notes'] = notes
    if defective:
        e['defective'] = True
    if cols is None:
        nums = {k.split('.')[1] for k in cells}
        cols = [n for n in ('sg', 'pl') if n in nums]
    e['paradigm'] = {'type': 'noun', 'rows': NOUN_ROWS, 'cols': cols,
                     'cells': cells}
    return e


ADJ12_ENDINGS = {
    'sg.masc': {'nom': 'us', 'voc': 'e', 'gen': 'i', 'dat': 'o', 'acc': 'um', 'abl': 'o'},
    'sg.fem':  {'nom': 'a', 'voc': 'a', 'gen': 'ae', 'dat': 'ae', 'acc': 'am', 'abl': 'a'},
    'sg.neut': {'nom': 'um', 'voc': 'um', 'gen': 'i', 'dat': 'o', 'acc': 'um', 'abl': 'o'},
    'pl.masc': {'nom': 'i', 'voc': 'i', 'gen': 'orum', 'dat': 'is', 'acc': 'os', 'abl': 'is'},
    'pl.fem':  {'nom': 'ae', 'voc': 'ae', 'gen': 'arum', 'dat': 'is', 'acc': 'as', 'abl': 'is'},
    'pl.neut': {'nom': 'a', 'voc': 'a', 'gen': 'orum', 'dat': 'is', 'acc': 'a', 'abl': 'is'},
}


def adj12_cells(stem, prefix=''):
    c = {}
    for col, ends in ADJ12_ENDINGS.items():
        for case, end in ends.items():
            c[f'{prefix}{case}.{col}'] = stem + end
    return c


def adj(id_, lemma, head, glosses, cells, cols=None, notes=None, defective=False):
    e = {'id': id_, 'lemma': lemma, 'pos': 'adj', 'head': head,
         'glosses': glosses}
    if notes:
        e['notes'] = notes
    if defective:
        e['defective'] = True
    e['paradigm'] = {'type': 'adj', 'rows': NOUN_ROWS,
                     'cols': cols or ADJ_COLS, 'cells': cells}
    return e


def adj12(id_, lemma, stem, glosses, notes=None):
    return adj(id_, lemma, f'{stem}us, -a, -um', glosses, adj12_cells(stem),
               notes=notes)


def adj3_one(stem_nom, stem, gen_pl='ium', neut_pl=True):
    """One-ending third-declension adjective (concors, anguipes)."""
    abl = 'i' if gen_pl == 'ium' else 'e'
    c = {}
    for g in ('masc', 'fem', 'neut'):
        c[f'nom.sg.{g}'] = stem_nom
        c[f'voc.sg.{g}'] = stem_nom
        c[f'gen.sg.{g}'] = stem + 'is'
        c[f'dat.sg.{g}'] = stem + 'i'
        c[f'acc.sg.{g}'] = stem_nom if g == 'neut' else stem + 'em'
        c[f'abl.sg.{g}'] = stem + abl
    for g in ('masc', 'fem'):
        for case in ('nom', 'voc', 'acc'):
            c[f'{case}.pl.{g}'] = stem + 'es'
        c[f'gen.pl.{g}'] = stem + gen_pl
        c[f'dat.pl.{g}'] = stem + 'ibus'
        c[f'abl.pl.{g}'] = stem + 'ibus'
    if neut_pl:
        for case in ('nom', 'voc', 'acc'):
            c[f'{case}.pl.neut'] = stem + 'ia'
        c['gen.pl.neut'] = stem + gen_pl
        c['dat.pl.neut'] = stem + 'ibus'
        c['abl.pl.neut'] = stem + 'ibus'
    return c


def adj3_two(stem):
    """Two-ending third-declension adjective (Cerealis, -e)."""
    c = {}
    for g in ('masc', 'fem', 'neut'):
        n = stem + ('e' if g == 'neut' else 'is')
        c[f'nom.sg.{g}'] = n
        c[f'voc.sg.{g}'] = n
        c[f'gen.sg.{g}'] = stem + 'is'
        c[f'dat.sg.{g}'] = stem + 'i'
        c[f'acc.sg.{g}'] = n if g == 'neut' else stem + 'em'
        c[f'abl.sg.{g}'] = stem + 'i'
        pl = stem + ('ia' if g == 'neut' else 'es')
        for case in ('nom', 'voc', 'acc'):
            c[f'{case}.pl.{g}'] = pl
        c[f'gen.pl.{g}'] = stem + 'ium'
        c[f'dat.pl.{g}'] = stem + 'ibus'
        c[f'abl.pl.{g}'] = stem + 'ibus'
    return c


def conj3_active(pres_stem, perf_stem, ppp_stem=None):
    """Third-conjugation active grids (ardesco, prendo)."""
    P = pres_stem
    R = perf_stem
    c = {'inf.pres.act': P + 'ere'}
    person = ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl']
    for tag, ends in [
        ('pres.ind.act', ['o', 'is', 'it', 'imus', 'itis', 'unt']),
        ('imperf.ind.act', ['ebam', 'ebas', 'ebat', 'ebamus', 'ebatis', 'ebant']),
        ('fut.ind.act', ['am', 'es', 'et', 'emus', 'etis', 'ent']),
        ('pres.subj.act', ['am', 'as', 'at', 'amus', 'atis', 'ant']),
        ('imperf.subj.act', ['erem', 'eres', 'eret', 'eremus', 'eretis', 'erent']),
    ]:
        for p, end in zip(person, ends):
            c[f'{p}.{tag}'] = P + end
    for tag, ends in [
        ('perf.ind.act', ['i', 'isti', 'it', 'imus', 'istis', 'erunt']),
        ('plup.ind.act', ['eram', 'eras', 'erat', 'eramus', 'eratis', 'erant']),
        ('futperf.ind.act', ['ero', 'eris', 'erit', 'erimus', 'eritis', 'erint']),
        ('perf.subj.act', ['erim', 'eris', 'erit', 'erimus', 'eritis', 'erint']),
        ('plup.subj.act', ['issem', 'isses', 'isset', 'issemus', 'issetis', 'issent']),
    ]:
        for p, end in zip(person, ends):
            c[f'{p}.{tag}'] = R + end
    # present active participle
    for col in ADJ_COLS:
        num, g = col.split('.')
        if num == 'sg':
            c[f'pap.nom.{col}'] = P + 'ens'
            c[f'pap.voc.{col}'] = P + 'ens'
            c[f'pap.gen.{col}'] = P + 'entis'
            c[f'pap.dat.{col}'] = P + 'enti'
            c[f'pap.acc.{col}'] = P + ('ens' if g == 'neut' else 'entem')
            c[f'pap.abl.{col}'] = P + 'ente'
        else:
            base = P + ('entia' if g == 'neut' else 'entes')
            c[f'pap.nom.{col}'] = base
            c[f'pap.voc.{col}'] = base
            c[f'pap.acc.{col}'] = base
            c[f'pap.gen.{col}'] = P + 'entium'
            c[f'pap.dat.{col}'] = P + 'entibus'
            c[f'pap.abl.{col}'] = P + 'entibus'
    cols = ['pres.ind.act', 'imperf.ind.act', 'fut.ind.act', 'perf.ind.act',
            'plup.ind.act', 'futperf.ind.act', 'pres.subj.act',
            'imperf.subj.act', 'perf.subj.act', 'plup.subj.act']
    paradigm = {'type': 'verb', 'rows': ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'],
                'cols': cols, 'cells': c}
    ppp = None
    if ppp_stem:
        ppp = {'type': 'ppp',
               'rows': NOUN_ROWS,
               'cols': ADJ_COLS,
               'cells': adj12_cells(ppp_stem, prefix='ppp.')}
    return paradigm, ppp


def transform_grid(grid, old, new):
    out = {k: grid[k] for k in grid if k != 'cells'}
    out['cells'] = {}
    for key, val in grid['cells'].items():
        fs = [re.sub('^' + old, new, f) for f in forms(val)]
        out['cells'][key] = fs if isinstance(val, list) else fs[0]
    return out


# ── the onomasticon ──────────────────────────────────────────────────────────

def new_lemmata(by_id):
    L = []
    add = L.append

    # -- rivers of the Peneus catalogue (Met 1.577-580) and others
    add(noun('apidanus_n', 'apidanus', 'masc', 'Apidanus, -i, m.',
             ['the Apidanus', 'river of Thessaly, tributary of the Peneus'],
             decl2m('Apidan', sg_only=True), defective=True))
    add(noun('amphrysos_n', 'amphrysos', 'masc', 'Amphrysos (Amphrysus), -i, m.',
             ['the Amphrysos', 'river of Thessaly where Apollo kept the flocks of Admetus'],
             {'nom.sg': ['Amphrysos', 'Amphrysus'], 'voc.sg': 'Amphryse',
              'gen.sg': 'Amphrysi', 'dat.sg': 'Amphryso',
              'acc.sg': ['Amphryson', 'Amphrysum'], 'abl.sg': 'Amphryso'},
             defective=True))
    add(noun('sperchios_n', 'sperchios', 'masc', 'Sperchios (Spercheos), -i, m.',
             ['the Sperchios', 'river of southern Thessaly'],
             {'nom.sg': ['Sperchios', 'Spercheos'], 'gen.sg': 'Sperchei',
              'dat.sg': 'Spercheo', 'acc.sg': 'Spercheon', 'abl.sg': 'Spercheo'},
             defective=True))
    add(noun('enipeus_n', 'enipeus', 'masc', 'Enipeus, -ei, m.',
             ['the Enipeus', 'river of Thessaly, tributary of the Peneus'],
             {'nom.sg': 'Enipeus', 'voc.sg': 'Enipeu',
              'gen.sg': ['Enipei', 'Enipeos'], 'dat.sg': 'Enipeo',
              'acc.sg': 'Enipea', 'abl.sg': 'Enipeo'},
             defective=True))
    add(noun('ladon_n', 'ladon', 'masc', 'Ladon, -onis, m.',
             ['the Ladon', 'sandy river of Arcadia, where Syrinx was transformed'],
             decl3('Ladon', 'Ladon', sg_only=True), defective=True))

    # -- mountains and places
    add(noun('olympus_n', 'olympus', 'masc', 'Olympus, -i, m.',
             ['Olympus', 'mountain between Thessaly and Macedonia, seat of the gods'],
             decl2m('Olymp', sg_only=True), defective=True))
    add(noun('pelion_n', 'pelion', 'neut', 'Pelion, -ii, n.',
             ['Pelion', 'mountain of Thessaly, piled on Ossa by the Giants'],
             {'nom.sg': 'Pelion', 'voc.sg': 'Pelion', 'acc.sg': 'Pelion',
              'gen.sg': 'Pelii', 'dat.sg': 'Pelio', 'abl.sg': 'Pelio'},
             defective=True))
    add(noun('ossa_n', 'ossa', 'fem', 'Ossa, -ae, f.',
             ['Ossa', 'mountain of Thessaly, piled on Pelion in the Gigantomachy'],
             decl1('Oss', sg_only=True), defective=True))
    add(noun('parnasus_n', 'parnasus', 'masc', 'Parnasus, -i, m.',
             ['Parnassus', 'two-peaked mountain above Delphi, sacred to Apollo and the Muses'],
             decl2m('Parnas', sg_only=True), defective=True))
    add(noun('pindus_n', 'pindus', 'masc', 'Pindus, -i, m.',
             ['Pindus', 'mountain range of northern Greece; source of the Peneus'],
             decl2m('Pind', sg_only=True), defective=True))
    add(noun('lycaeus_n', 'lycaeus', 'masc', 'Lycaeus, -i, m.',
             ['Lycaeus', 'mountain of Arcadia sacred to Pan; also as adj., Lycaean'],
             decl2m('Lycae', sg_only=True), defective=True))
    add(noun('maenala_n', 'maenala', 'neut', 'Maenala, -orum, n. pl. (sg. Maenalus, m.)',
             ['Maenala', 'mountain range of Arcadia, haunt of Pan'],
             {'nom.pl': 'Maenala', 'voc.pl': 'Maenala', 'acc.pl': 'Maenala',
              'gen.pl': 'Maenalorum', 'dat.pl': 'Maenalis', 'abl.pl': 'Maenalis'},
             defective=True))
    add(noun('cyllene_n', 'cyllene', 'fem', 'Cyllene, -es, f.',
             ['Cyllene', 'mountain of Arcadia, birthplace of Mercury'],
             {'nom.sg': 'Cyllene', 'voc.sg': 'Cyllene', 'gen.sg': 'Cyllenes',
              'acc.sg': 'Cyllenen', 'abl.sg': 'Cyllene'},
             defective=True))
    add(noun('scythia_n', 'scythia', 'fem', 'Scythia, -ae, f.',
             ['Scythia', 'the far northern land beyond the Black Sea'],
             decl1('Scythi', sg_only=True), defective=True))
    add(noun('arcadia_n', 'arcadia', 'fem', 'Arcadia, -ae, f.',
             ['Arcadia', 'pastoral mountain region of the central Peloponnese'],
             decl1('Arcadi', sg_only=True), defective=True))
    add(noun('haemonia_n', 'haemonia', 'fem', 'Haemonia, -ae, f.',
             ['Haemonia', 'poetic name for Thessaly'],
             decl1('Haemoni', sg_only=True), defective=True))
    add(noun('lerna_n', 'lerna', 'fem', 'Lerna, -ae, f.',
             ['Lerna', 'marsh and pastures near Argos, lair of the Hydra'],
             decl1('Lern', sg_only=True), defective=True))
    add(noun('tempe_n', 'tempe', 'neut', 'Tempe, n. pl. (indecl.)',
             ['Tempe', 'the gorge of the Peneus between Olympus and Ossa'],
             {'nom.pl': 'Tempe', 'voc.pl': 'Tempe', 'acc.pl': 'Tempe'},
             defective=True))
    add(noun('tenedos_n', 'tenedos', 'fem', 'Tenedos, -i, f.',
             ['Tenedos', 'island off the Troad with a shrine of Apollo'],
             {'nom.sg': 'Tenedos', 'voc.sg': 'Tenede', 'gen.sg': 'Tenedi',
              'dat.sg': 'Tenedo', 'acc.sg': 'Tenedon', 'abl.sg': 'Tenedo'},
             defective=True))
    add(noun('capitolium_n', 'capitolium', 'neut', 'Capitolium, -ii, n.',
             ['the Capitol', 'the Capitoline hill and temple of Jupiter at Rome; pl., its buildings'],
             decl2n('Capitoli')))
    add(noun('tartara_n', 'tartara', 'neut', 'Tartara, -orum, n. pl. (sg. Tartarus, m.)',
             ['Tartarus', 'the abyss of the underworld where the wicked are punished'],
             {'nom.pl': 'Tartara', 'voc.pl': 'Tartara', 'acc.pl': 'Tartara',
              'gen.pl': 'Tartarorum', 'dat.pl': 'Tartaris', 'abl.pl': 'Tartaris'},
             defective=True))

    # -- peoples
    add(noun('aethiops_n', 'aethiops', 'masc', 'Aethiops, -opis, m.',
             ['an Ethiopian', 'dweller of the sun-scorched south'],
             {**decl3('Aethiops', 'Aethiop'),
              'acc.pl': ['Aethiopes', 'Aethiopas']}))
    add(noun('indus_n', 'indus', 'masc', 'Indus, -i, m.',
             ['an Indian', 'dweller of the far east'],
             decl2m('Ind')))
    add(noun('arcas_n', 'arcas', 'masc', 'Arcas, -adis, m.',
             ['an Arcadian', 'also Arcas, son of Jupiter and Callisto'],
             {**decl3('Arcas', 'Arcad'), 'acc.pl': ['Arcades', 'Arcadas']}))

    # -- theonyms and persons
    add(noun('amphitrite_n', 'amphitrite', 'fem', 'Amphitrite, -es, f.',
             ['Amphitrite', 'sea-goddess, wife of Neptune; by metonymy, the sea'],
             {'nom.sg': 'Amphitrite', 'voc.sg': 'Amphitrite',
              'gen.sg': 'Amphitrites', 'acc.sg': 'Amphitriten',
              'abl.sg': 'Amphitrite'},
             defective=True))
    add(noun('astraea_n', 'astraea', 'fem', 'Astraea, -ae, f.',
             ['Astraea', 'goddess of justice, last immortal to leave the earth'],
             decl1('Astrae', sg_only=True), defective=True))
    add(noun('nereus_n', 'nereus', 'masc', 'Nereus, -ei, m.',
             ['Nereus', 'old sea-god, father of the Nereids; by metonymy, the sea'],
             {'nom.sg': 'Nereus', 'voc.sg': 'Nereu',
              'gen.sg': ['Nerei', 'Nereos'], 'dat.sg': 'Nereo',
              'acc.sg': ['Nerea', 'Nereum'], 'abl.sg': 'Nereo'},
             defective=True))
    add(noun('erinys_n', 'erinys', 'fem', 'Erinys, -yos, f.',
             ['an Erinys, Fury', 'avenging spirit; by metonymy, frenzy, curse'],
             {'nom.sg': 'Erinys', 'voc.sg': 'Erinys', 'gen.sg': 'Erinyos',
              'acc.sg': 'Erinyn', 'abl.sg': 'Erinye',
              'nom.pl': 'Erinyes', 'voc.pl': 'Erinyes', 'acc.pl': 'Erinyas'},
             defective=True))
    add(noun('themis_n', 'themis', 'fem', 'Themis, -idis, f.',
             ['Themis', 'goddess of divine order and prophecy, holder of the Delphic oracle before Apollo'],
             {'nom.sg': 'Themis', 'voc.sg': ['Themi', 'Themis'],
              'gen.sg': 'Themidis', 'dat.sg': 'Themidi',
              'acc.sg': ['Themin', 'Themidem'], 'abl.sg': 'Themide'},
             defective=True))
    add(noun('triton_n', 'triton', 'masc', 'Triton, -onis, m.',
             ['Triton', 'sea-god, trumpeter of Neptune with his conch shell'],
             {'nom.sg': 'Triton', 'voc.sg': 'Triton', 'gen.sg': 'Tritonis',
              'dat.sg': 'Tritoni', 'acc.sg': ['Tritona', 'Tritonem'],
              'abl.sg': 'Tritone'},
             defective=True))
    add(noun('diana_n', 'diana', 'fem', 'Diana, -ae, f.',
             ['Diana', 'virgin goddess of the hunt, sister of Apollo'],
             decl1('Dian', sg_only=True), defective=True))
    add(noun('epaphus_n', 'epaphus', 'masc', 'Epaphus, -i, m.',
             ['Epaphus', 'son of Jupiter and Io'],
             decl2m('Epaph', sg_only=True), defective=True))
    add(noun('iapetus_n', 'iapetus', 'masc', 'Iapetus, -i, m.',
             ['Iapetus', 'Titan, father of Prometheus'],
             decl2m('Iapet', sg_only=True), defective=True))
    add(noun('pleias_n', 'pleias', 'fem', 'Pleias, -adis, f.',
             ['a Pleiad', 'one of the seven daughters of Atlas; here Maia, mother of Mercury'],
             {**decl3('Pleias', 'Pleiad'), 'acc.pl': ['Pleiades', 'Pleiadas']}))
    add(noun('phoronis_n', 'phoronis', 'fem', 'Phoronis, -idis, f.',
             ['the Phoronid', 'descendant of Phoroneus, i.e. Io'],
             {'nom.sg': 'Phoronis', 'voc.sg': 'Phoronis',
              'gen.sg': ['Phoronidis', 'Phoronidos'], 'dat.sg': 'Phoronidi',
              'acc.sg': ['Phoronida', 'Phoronidem'], 'abl.sg': 'Phoronide'},
             defective=True))
    add(noun('titania_n', 'titania', 'fem', 'Titania, -ae, f.',
             ['the Titaness', 'female descendant of the Titans; here Pyrrha, granddaughter of Iapetus'],
             decl1('Titani', sg_only=True), defective=True))
    add(noun('cyllenius_n', 'cyllenius', 'masc', 'Cyllenius, -ii, m.',
             ['the Cyllenian', 'Mercury, born on mount Cyllene'],
             {'nom.sg': 'Cyllenius', 'voc.sg': 'Cylleni', 'gen.sg': 'Cyllenii',
              'dat.sg': 'Cyllenio', 'acc.sg': 'Cyllenium', 'abl.sg': 'Cyllenio'},
             defective=True))
    add(noun('hymen_n', 'hymen', 'masc', 'Hymen, -enis, m.',
             ['Hymen', 'god of marriage; the wedding song'],
             {'nom.sg': 'Hymen', 'voc.sg': 'Hymen', 'gen.sg': 'Hymenis',
              'dat.sg': 'Hymeni', 'acc.sg': ['Hymena', 'Hymenem'],
              'abl.sg': 'Hymene'},
             defective=True))

    # -- patronymics
    add(noun('promethides_n', 'promethides', 'masc', 'Promethides, -ae, m.',
             ['son of Prometheus', 'i.e. Deucalion'],
             {'nom.sg': 'Promethides', 'gen.sg': 'Promethidae',
              'dat.sg': 'Promethidae', 'acc.sg': 'Promethiden',
              'abl.sg': 'Promethide'},
             defective=True))
    add(noun('epimethis_n', 'epimethis', 'fem', 'Epimethis, -idis, f.',
             ['daughter of Epimetheus', 'i.e. Pyrrha'],
             {'nom.sg': 'Epimethis', 'gen.sg': 'Epimethidis',
              'dat.sg': 'Epimethidi', 'acc.sg': ['Epimethida', 'Epimethidem'],
              'abl.sg': 'Epimethide'},
             defective=True))
    add(noun('atlantiades_n', 'atlantiades', 'masc', 'Atlantiades, -ae, m.',
             ['descendant of Atlas', 'i.e. Mercury, son of the Pleiad Maia'],
             {'nom.sg': 'Atlantiades', 'gen.sg': 'Atlantiadae',
              'dat.sg': 'Atlantiadae', 'acc.sg': 'Atlantiaden',
              'abl.sg': 'Atlantiade'},
             defective=True))
    add(noun('arestorides_n', 'arestorides', 'masc', 'Arestorides, -ae, m.',
             ['son of Arestor', 'i.e. Argus, the hundred-eyed watchman'],
             {'nom.sg': 'Arestorides', 'gen.sg': 'Arestoridae',
              'dat.sg': 'Arestoridae', 'acc.sg': 'Arestoriden',
              'abl.sg': 'Arestoride'},
             defective=True))

    # -- divine and natural collectives
    add(noun('faunus_n', 'faunus', 'masc', 'Faunus, -i, m.',
             ['Faunus; pl., fauns', 'rustic woodland gods'],
             decl2m('Faun')))
    add(noun('silvanus_n', 'silvanus', 'masc', 'Silvanus, -i, m.',
             ['Silvanus; pl., silvans', 'gods of the woods'],
             decl2m('Silvan')))
    add(noun('gigas_n', 'gigas', 'masc', 'Gigas, -antis, m.',
             ['a Giant', 'one of the earth-born assailants of heaven'],
             {**decl3('Gigas', 'Gigant'), 'acc.pl': ['Gigantes', 'Gigantas']}))
    add(noun('cyclops_n', 'cyclops', 'masc', 'Cyclops, -opis, m.',
             ['a Cyclops', 'one-eyed smiths who forge Jupiter’s thunderbolts'],
             {**decl3('Cyclops', 'Cyclop'), 'acc.pl': ['Cyclopes', 'Cyclopas']}))
    add(noun('nereis_n', 'nereis', 'fem', 'Nereis, -idis, f.',
             ['a Nereid', 'sea-nymph, daughter of Nereus'],
             {**decl3('Nereis', 'Nereid'), 'acc.pl': ['Nereidas', 'Nereides']}))
    add(noun('naias_n', 'naias', 'fem', 'naias (nais), -adis, f.',
             ['a naiad', 'nymph of fresh waters'],
             {'nom.sg': ['naias', 'nais'], 'voc.sg': ['naias', 'nais'],
              'gen.sg': ['naiadis', 'naidis'], 'dat.sg': ['naiadi', 'naidi'],
              'acc.sg': ['naiada', 'naida'], 'abl.sg': ['naiade', 'naide'],
              'nom.pl': ['naiades', 'naides'], 'voc.pl': ['naiades', 'naides'],
              'gen.pl': ['naiadum', 'naidum'], 'dat.pl': ['naiadibus', 'naidibus'],
              'acc.pl': ['naiadas', 'naidas'], 'abl.pl': ['naiadibus', 'naidibus']}))
    add(noun('hamadryas_n', 'hamadryas', 'fem', 'hamadryas, -adis, f.',
             ['a hamadryad', 'tree-nymph whose life is bound to her tree'],
             {**decl3('hamadryas', 'hamadryad'),
              'acc.pl': ['hamadryadas', 'hamadryades']}))
    add(noun('delphin_n', 'delphin', 'masc', 'delphin, -inis, m.',
             ['dolphin'],
             {**decl3('delphin', 'delphin'),
              'acc.pl': ['delphinas', 'delphines']}))
    add(noun('trio_n', 'trio', 'masc', 'trio, -onis, m.',
             ['plough-ox', 'pl., the Triones: the oxen of the Wain, the stars of the Great and Little Bear'],
             decl3('trio', 'trion')))

    # -- ordinary nouns
    add(noun('vomer_n', 'vomer', 'masc', 'vomer, -eris, m.',
             ['ploughshare'],
             decl3('vomer', 'vomer')))
    add(noun('faex_n', 'faex', 'fem', 'faex, faecis, f.',
             ['dregs, sediment', 'impurity'],
             decl3('faex', 'faec')))
    add(noun('cumba_n', 'cumba', 'fem', 'cumba (cymba), -ae, f.',
             ['small boat, skiff'],
             decl1('cumb')))
    add(noun('monimentum_n', 'monimentum', 'neut', 'monimentum (monumentum), -i, n.',
             ['memorial, reminder', 'record, monument'],
             decl2n('moniment')))
    add(noun('gestamen_n', 'gestamen', 'neut', 'gestamen, -inis, n.',
             ['a thing carried or worn', 'burden, equipment, ornament'],
             {'nom.sg': 'gestamen', 'voc.sg': 'gestamen', 'acc.sg': 'gestamen',
              'gen.sg': 'gestaminis', 'dat.sg': 'gestamini', 'abl.sg': 'gestamine',
              'nom.pl': 'gestamina', 'voc.pl': 'gestamina', 'acc.pl': 'gestamina',
              'gen.pl': 'gestaminum', 'dat.pl': 'gestaminibus',
              'abl.pl': 'gestaminibus'}))
    add(noun('adspergo_n', 'adspergo', 'fem', 'adspergo (aspergo), -inis, f.',
             ['sprinkling, spray'],
             decl3('adspergo', 'adspergin')))
    add(noun('conpago_n', 'conpago', 'fem', 'conpago (compago), -inis, f.',
             ['a joining, fastening', 'joint, seam, structure'],
             decl3('conpago', 'conpagin')))
    add(noun('persis_n', 'persis', 'fem', 'Persis, -idis, f.',
             ['Persia', 'the Persian land'],
             {'nom.sg': 'Persis', 'voc.sg': 'Persis', 'gen.sg': 'Persidis',
              'dat.sg': 'Persidi', 'acc.sg': ['Persida', 'Persidem'],
              'abl.sg': 'Perside'},
             defective=True))

    # -- adjectives (ethnic, divine, and descriptive)
    add(adj12('nabataeus_adj', 'nabataeus', 'Nabatae',
              ['Nabataean', 'of Nabataea in Arabia; eastern']))
    add(adj12('stygius_adj', 'stygius', 'Stygi',
              ['Stygian', 'of the Styx, the river of the underworld; infernal']))
    add(adj12('caesareus_adj', 'caesareus', 'Caesare',
              ['of Caesar', 'imperial']))
    add(adj12('romanus_adj', 'romanus', 'Roman',
              ['Roman']))
    add(adj12('molossus_adj', 'molossus', 'Moloss',
              ['Molossian', 'of the Molossi of Epirus, famed for their hounds']))
    add(adj12('aeolius_adj', 'aeolius', 'Aeoli',
              ['Aeolian', 'of Aeolus, keeper of the winds']))
    add(adj12('aonius_adj', 'aonius', 'Aoni',
              ['Aonian', 'Boeotian; as subst., the Aonians']))
    add(adj12('oetaeus_adj', 'oetaeus', 'Oetae',
              ['Oetaean', 'of mount Oeta']))
    add(adj12('delphicus_adj', 'delphicus', 'Delphic',
              ['Delphic', 'of Delphi and its oracle of Apollo']))
    add(adj12('patareus_adj', 'patareus', 'Patare',
              ['Patarean', 'of Patara in Lycia, seat of an oracle of Apollo']))
    add(adj12('gallicus_adj', 'gallicus', 'Gallic',
              ['Gaulish', 'of Gaul; Gallicus canis, a Gaulish hound']))
    add(adj12('latius_adj', 'latius', 'Lati',
              ['Latian', 'of Latium; Roman']))
    add(adj12('lyrceus_adj', 'lyrceus', 'Lyrce',
              ['Lyrcean', 'of mount Lyrceum between Argolis and Arcadia']))
    add(adj12('argolicus_adj', 'argolicus', 'Argolic',
              ['Argolic', 'of Argos, Argive']))
    add(adj12('iunonius_adj', 'iunonius', 'Iunoni',
              ['of Juno', 'Junonian']))
    add(adj12('nonacrinus_adj', 'nonacrinus', 'Nonacrin',
              ['of Nonacris', 'Arcadian']))
    add(adj12('apollineus_adj', 'apollineus', 'Apolline',
              ['of Apollo', 'Apollonian']))
    add(adj12('lycaonius_adj', 'lycaonius', 'Lycaoni',
              ['of Lycaon', 'the impious Arcadian king turned wolf']))
    add(adj12('latonius_adj', 'latonius', 'Latoni',
              ['of Latona', 'as fem. subst., Latonia: Diana, Latona’s daughter']))
    add(adj12('delius_adj', 'delius', 'Deli',
              ['Delian', 'of Delos; as masc. subst., the Delian: Apollo']))
    add(adj('cerealis_adj', 'cerealis', 'Cerealis, -e',
            ['of Ceres', 'of grain or cultivation'],
            adj3_two('Cereal')))
    add(adj('concors_adj', 'concors', 'concors, -cordis',
            ['harmonious, agreeing', 'of one mind'],
            adj3_one('concors', 'concord')))
    add(adj('anguipes_adj', 'anguipes', 'anguipes, -pedis',
            ['snake-footed', 'epithet of the Giants'],
            adj3_one('anguipes', 'anguiped', gen_pl='um', neut_pl=False)))
    add(adj('liniger_adj', 'liniger', 'liniger, -gera, -gerum',
            ['linen-wearing', 'epithet of Isis and her worshippers'],
            {**adj12_cells('liniger'),
             'nom.sg.masc': 'liniger', 'voc.sg.masc': 'liniger'}))
    add(adj('corycis_adj', 'corycis', 'Corycis, -idis, f. adj.',
            ['Corycian', 'of the Corycian cave on Parnassus; Corycides nymphae, its nymphs'],
            {'nom.sg.fem': 'Corycis', 'voc.sg.fem': 'Corycis',
             'gen.sg.fem': 'Corycidis', 'dat.sg.fem': 'Corycidi',
             'acc.sg.fem': ['Corycida', 'Corycidem'], 'abl.sg.fem': 'Corycide',
             'nom.pl.fem': 'Corycides', 'voc.pl.fem': 'Corycides',
             'gen.pl.fem': 'Corycidum', 'dat.pl.fem': 'Corycidibus',
             'acc.pl.fem': 'Corycidas', 'abl.pl.fem': 'Corycidibus'},
            cols=['sg.fem', 'pl.fem'], defective=True))
    add(adj('cephisis_adj', 'cephisis', 'Cephisis, -idis, f. adj.',
            ['of the Cephisus', 'the river of Phocis and Boeotia'],
            {'nom.sg.fem': 'Cephisis', 'voc.sg.fem': 'Cephisis',
             'gen.sg.fem': 'Cephisidis', 'dat.sg.fem': 'Cephisidi',
             'acc.sg.fem': ['Cephisida', 'Cephisidem'], 'abl.sg.fem': 'Cephiside',
             'nom.pl.fem': 'Cephisides', 'voc.pl.fem': 'Cephisides',
             'gen.pl.fem': 'Cephisidum', 'dat.pl.fem': 'Cephisidibus',
             'acc.pl.fem': 'Cephisidas', 'abl.pl.fem': 'Cephisidibus'},
            cols=['sg.fem', 'pl.fem'], defective=True))

    # -- verbs
    p, ppp = conj3_active('ardesc', 'ars')
    add({'id': 'ardesco_v', 'lemma': 'ardesco', 'pos': 'verb',
         'principal_parts': ['ardesco', 'ardescere', 'arsi'],
         'glosses': ['catch fire, kindle', 'begin to blaze'],
         'notes': 'Inchoative of ardeo; no supine.',
         'paradigm': p})
    p, ppp = conj3_active('prend', 'prend', ppp_stem='prens')
    add({'id': 'prendo_v', 'lemma': 'prendo', 'pos': 'verb',
         'principal_parts': ['prendo', 'prendere', 'prendi', 'prensum'],
         'glosses': ['grasp, seize, catch'],
         'notes': 'Contracted form of prehendo.',
         'paradigm': p, 'ppp_paradigm': ppp})

    # deponents, stem-transformed from existing machine-generated grids
    conor = by_id['conor_v']
    moderor = {'id': 'moderor_v', 'lemma': 'moderor', 'pos': 'verb',
               'principal_parts': ['moderor', 'moderari', 'moderatus sum'],
               'glosses': ['guide, direct, govern', 'restrain, moderate'],
               'notes': 'Deponent.',
               'paradigm': transform_grid(conor['paradigm'], 'con', 'moder'),
               'ppp_paradigm': transform_grid(conor['ppp_paradigm'], 'con', 'moder')}
    # Ovid's "moderantum" (Met 1.83) is the contracted pap gen. pl.
    for g in ('masc', 'fem', 'neut'):
        key = f'pap.gen.pl.{g}'
        if key in moderor['paradigm']['cells']:
            moderor['paradigm']['cells'][key] = sorted(
                set(forms(moderor['paradigm']['cells'][key])) | {'moderantum'})
    add(moderor)

    sequor = by_id['sequor_v']
    add({'id': 'conplector_v', 'lemma': 'conplector', 'pos': 'verb',
         'principal_parts': ['conplector', 'conplecti', 'conplexus sum'],
         'glosses': ['embrace, clasp', 'encompass'],
         'notes': 'Deponent; also spelled complector.',
         'paradigm': transform_grid(sequor['paradigm'], 'sequ', 'conplect'),
         'ppp_paradigm': transform_grid(sequor['ppp_paradigm'], 'secut', 'conplex')})

    return L


# Existing lemmata that need extra cell forms for attested contractions.
CELL_ADDITIONS = [
    ('nosco_v', 'paradigm', '3pl.plup.ind.act', 'norant'),      # syncopated noverant
    ('caelestis_adj', 'paradigm', 'gen.pl.masc', 'caelestum'),  # contracted -um
    ('caelestis_adj', 'paradigm', 'gen.pl.fem', 'caelestum'),
    ('caelestis_adj', 'paradigm', 'gen.pl.neut', 'caelestum'),
]

# normalized surface -> lemma_id, for every unknown_adv token.
TOKEN_MAP = {
    'amphitrite': 'amphitrite_n', 'concordi': 'concors_adj',
    'nabataea': 'nabataeus_adj', 'persida': 'persis_n',
    'zephyro': 'zephyrius_adv', 'scythiam': 'scythia_n', 'triones': 'trio_n',
    'faecis': 'faex_n', 'iapeto': 'iapetus_n', 'moderantum': 'moderor_v',
    'norant': 'nosco_v', 'uomeribus': 'vomer_n', 'tartara': 'tartara_n',
    'cerealia': 'cerealis_adj', 'stygiis': 'stygius_adj',
    'caelestum': 'caelestis_adj', 'astraea': 'astraea_n',
    'gigantas': 'gigas_n', 'olympum': 'olympus_n', 'pelion': 'pelion_n',
    'ossae': 'ossa_n', 'monimenta': 'monimentum_n',
    'lycaoniae': 'lycaonius_adj', 'anguipedum': 'anguipes_adj',
    'nereus': 'nereus_n', 'stygio': 'stygius_adj', 'fauni': 'faunus_n',
    'siluani': 'silvanus_n', 'caesareo': 'caesareus_adj',
    'romanum': 'romanus_adj', 'olympo': 'olympus_n', 'maenala': 'maenala_n',
    'cyllene': 'cyllene_n', 'lycaei': 'lycaeus_n', 'arcadis': 'arcas_n',
    'molossa': 'molossus_adj', 'erinys': 'erinys_n',
    'ardesceret': 'ardesco_v', 'cyclopum': 'cyclops_n',
    'aeoliis': 'aeolius_adj', 'cumba': 'cumba_n', 'nereides': 'nereis_n',
    'delphines': 'delphin_n', 'uelocia': 'velox_adj', 'aonios': 'aonius_adj',
    'oetaeis': 'oetaeus_adj', 'parnasus': 'parnasus_n',
    'corycidas': 'corycis_adj', 'themin': 'themis_n', 'tritona': 'triton_n',
    'cephisidas': 'cephisis_adj', 'themi': 'themis_n',
    'promethides': 'promethides_n', 'epimethida': 'epimethis_n',
    'titania': 'titania_n', 'discors': 'discors_adj', 'delius': 'delius_adj',
    'que': 'que_enclit', 'gestamina': 'gestamen_n', 'parnasi': 'parnasus_n',
    'apollineas': 'apollineus_adj', 'hymen': 'hymen_n', 'dianae': 'diana_n',
    'delphica': 'delphicus_adj', 'tenedos': 'tenedos_n',
    'patarea': 'patareus_adj', 'gallicus': 'gallicus_adj',
    'conplexus': 'conplector_v', 'latiis': 'latius_adj',
    'capitolia': 'capitolium_n', 'haemoniae': 'haemonia_n',
    'tempe': 'tempe_n', 'pindo': 'pindus_n', 'adspergine': 'adspergo_n',
    'sperchios': 'sperchios_n', 'enipeus': 'enipeus_n',
    'apidanus': 'apidanus_n', 'amphrysos': 'amphrysos_n',
    'lernae': 'lerna_n', 'lyrcea': 'lyrceus_adj',
    'arestoridae': 'arestorides_n', 'naides': 'naias_n',
    'phoronidos': 'phoronis_n', 'pleias': 'pleias_n',
    'iunonius': 'iunonius_adj', 'atlantiades': 'atlantiades_n',
    'arcadiae': 'arcadia_n', 'hamadryadas': 'hamadryas_n',
    'nonacrinas': 'nonacrinus_adj', 'naias': 'naias_n',
    'latonia': 'latonius_adj', 'lycaeo': 'lycaeus_n', 'ladonis': 'ladon_n',
    'pana': 'pan_n', 'prensam': 'prendo_v', 'conpagine': 'conpago_n',
    'cyllenius': 'cyllenius_n', 'erinyn': 'erinys_n',
    'argolicae': 'argolicus_adj', 'stygias': 'stygius_adj',
    'linigera': 'liniger_adj', 'epaphus': 'epaphus_n', 'phoebo': 'Phoebus_n',
    'epaphi': 'epaphus_n', 'aethiopas': 'aethiops_n', 'indos': 'indus_n',
}


def comp_cells(stem, prefix='comp.'):
    """Comparative grid: third-declension (carior, carius)."""
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


def fix_carus(lemmata, by_id, ms, report):
    """Phase 1 left Met 1.486 'carissime' riding an alt marker on the
    substantive carus_n. With the degree category modeled, replace it with a
    proper adjective card carrying comparative and superlative grids, and give
    the token its real parse."""
    if 'carus_adj' in by_id:
        return
    cells = adj12_cells('car')
    cells.update(comp_cells('car'))
    cells.update(adj12_cells('carissim', prefix='superl.'))
    entry = {'id': 'carus_adj', 'lemma': 'carus', 'pos': 'adj',
             'head': 'carus, -a, -um (carior, carissimus)',
             'glosses': ['dear, beloved', 'costly, precious'],
             'paradigm': {'type': 'adj', 'rows': NOUN_ROWS, 'cols': ADJ_COLS,
                          'cells': cells}}
    if 'carus_n' in by_id:
        lemmata[lemmata.index(by_id.pop('carus_n'))] = entry
    else:
        lemmata.append(entry)
    by_id['carus_adj'] = entry
    for line in ms['lines']:
        for tok in line['tokens']:
            if tok.get('kind') == 'word' and tok.get('lemma_id') == 'carus_n':
                tok['lemma_id'] = 'carus_adj'
                tok['parses'] = ['superl.voc.sg.masc']
                tok['pos_hint'] = 'adj'
                tok['stanza'] = 'carus_adj'
    report['carus'] = 'carus_n -> carus_adj with comp./superl. grids'


def matching_parses(lemma, surface):
    """Every cell of the lemma whose form matches the surface, gender-stamped
    for nouns exactly like build-glossary's genderStampParses."""
    target = norm(surface)
    out = []
    genders = lemma.get('gender')
    if genders and not isinstance(genders, list):
        genders = [genders]
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
    # de-dup preserving order
    seen = set()
    return [p for p in out if not (p in seen or seen.add(p))]


# Pre-existing capitalized near-duplicates of cards authored here; none was
# referenced by any token, so the lowercase card wins and these are removed.
DUPLICATE_IDS = ['Apidanus_n', 'Faunus_n', 'Persis_n', 'Aethiops_n',
                 'Stygius_adj', 'Nabataeus_adj']


def main():
    lexicon = json.loads(LEXICON_PATH.read_text())
    lemmata = lexicon['lemmata']
    lexicon['lemmata'] = lemmata = [l for l in lemmata if l['id'] not in DUPLICATE_IDS]
    by_id = {l['id']: l for l in lemmata}
    report = {'lemmata_added': 0, 'tokens_resolved': 0}

    for entry in new_lemmata(by_id):
        if entry['id'] in by_id:
            continue
        lemmata.append(entry)
        by_id[entry['id']] = entry
        report['lemmata_added'] += 1

    for lid, which, key, extra in CELL_ADDITIONS:
        cells = by_id[lid][which]['cells']
        cur = forms(cells[key])
        if extra not in cur:
            cells[key] = cur + [extra]

    ms = json.loads(MANUSCRIPT_PATH.read_text())
    fix_carus(lemmata, by_id, ms, report)
    LEXICON_PATH.write_text(json.dumps(lexicon, indent=2, ensure_ascii=False) + '\n')

    unresolved = []
    for line in ms['lines']:
        for tok in line['tokens']:
            if tok.get('kind') != 'word' or tok.get('lemma_id') != 'unknown_adv':
                continue
            lid = TOKEN_MAP.get(norm(tok['surface']))
            if not lid:
                unresolved.append(tok['surface'])
                continue
            lemma = by_id[lid]
            if lid == 'que_enclit':
                parses = ['enclit']
                pos_hint = 'enclitic'
            else:
                parses = matching_parses(lemma, tok['surface'])
                pos_hint = lemma['pos']
            if not parses:
                unresolved.append(f"{tok['surface']} (no cell in {lid})")
                continue
            tok['lemma_id'] = lid
            tok['parses'] = parses
            tok['pos_hint'] = pos_hint
            tok['stanza'] = lid
            report['tokens_resolved'] += 1

    MANUSCRIPT_PATH.write_text(json.dumps(ms, indent=2, ensure_ascii=False) + '\n')
    report['unresolved'] = unresolved
    print(json.dumps(report, indent=2))
    return 1 if unresolved else 0


if __name__ == '__main__':
    sys.exit(main())

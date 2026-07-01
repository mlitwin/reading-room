#!/usr/bin/env python3
"""Build an apparatus-criticus JSON artifact from raw Latin passage text."""
import argparse
import json
import sys

import seed

# Surface-form → (lemma, [parse_code, ...]) for proper nouns and other forms
# that Morpheus does not analyse. Keyed by lowercase surface. Multiple
# inflected forms of the same noun are listed explicitly so every occurrence
# in the text resolves to the right card.
PROPER_NOUN_SURFACE: dict[str, tuple[str, list[str]]] = {
    # Iuppiter / Iuppiteris
    'iuppiter': ('iuppiter', ['nom.sg.masc']),
    'iovis':    ('iuppiter', ['gen.sg.masc']),
    'iovi':     ('iuppiter', ['dat.sg.masc']),
    'iovem':    ('iuppiter', ['acc.sg.masc']),
    'iove':     ('iuppiter', ['abl.sg.masc']),
    # Io (the Argive princess)
    'io':       ('io',  ['nom.sg.fem']),
    # Inachus
    'inachus':  ('inachus', ['nom.sg.masc']),
    'inachi':   ('inachus', ['gen.sg.masc']),
    'inacho':   ('inachus', ['dat.sg.masc', 'abl.sg.masc']),
    'inachum':  ('inachus', ['acc.sg.masc']),
    'inachidos':('inachus', ['gen.sg.fem']),  # patronymic gen.
    'inachides':('inachus', ['nom.sg.masc']), # patronymic nom.
    'inachidas':('inachus', ['acc.pl.masc']),
    'inachidas':('inachus', ['acc.pl.masc']),
    # Argus (the hundred-eyed)
    'argus':    ('argus', ['nom.sg.masc']),
    'argi':     ('argus', ['gen.sg.masc']),
    'argo':     ('argus', ['dat.sg.masc', 'abl.sg.masc']),
    'argum':    ('argus', ['acc.sg.masc']),
    'arge':     ('argus', ['voc.sg.masc']),
    # Python — existing card stem is 'Python' (capital P)
    'python':   ('Python', ['nom.sg.masc']),
    'pythona':  ('Python', ['acc.sg.masc']),
    'pythonis': ('Python', ['gen.sg.masc']),
    # Phoebus (Apollo) — existing card stem is 'Phoebus' (capital P)
    'phoebus':  ('Phoebus', ['nom.sg.masc']),
    'phoebo':   ('Phoebus', ['dat.sg.masc', 'abl.sg.masc']),
    'phoebi':   ('Phoebus', ['gen.sg.masc']),
    'phoebum':  ('Phoebus', ['acc.sg.masc']),
    'phoebe':   ('Phoebus', ['voc.sg.masc']),
    'phoebes':  ('Phoebus', ['gen.sg.masc']),
    # Deucalion
    'deucalion': ('deucalion', ['nom.sg.masc']),
    'deucalionis': ('deucalion', ['gen.sg.masc']),
    'deucalioni': ('deucalion', ['dat.sg.masc']),
    'deucaliona': ('deucalion', ['acc.sg.masc']),
    # Pyrrha
    'pyrrha':   ('pyrrha', ['nom.sg.fem']),
    'pyrrhae':  ('pyrrha', ['gen.sg.fem', 'dat.sg.fem']),
    'pyrrham':  ('pyrrha', ['acc.sg.masc']),
    # Iuno
    'iuno':     ('iuno', ['nom.sg.fem']),
    'iunonis':  ('iuno', ['gen.sg.fem']),
    'iunoni':   ('iuno', ['dat.sg.fem']),
    'iunonem':  ('iuno', ['acc.sg.fem']),
    'iunone':   ('iuno', ['abl.sg.fem']),
    # Saturnus
    'saturnus': ('saturnus', ['nom.sg.masc']),
    'saturni':  ('saturnus', ['gen.sg.masc']),
    'saturno':  ('saturnus', ['dat.sg.masc', 'abl.sg.masc']),
    'saturnum': ('saturnus', ['acc.sg.masc']),
    'saturnia': ('saturnus', ['nom.sg.fem']),   # epithet form
    'saturnius':('saturnus', ['nom.sg.masc']),  # epithet form
    # Phaethon
    'phaethon': ('phaethon', ['nom.sg.masc']),
    'phaethontis':('phaethon', ['gen.sg.masc']),
    'phaethonti':('phaethon', ['dat.sg.masc']),
    'phaethonta':('phaethon', ['acc.sg.masc']),
    # Syringa / Syrinx
    'syringa':  ('syrinx', ['nom.sg.fem']),
    'syringem': ('syrinx', ['acc.sg.fem']),
    # Pan
    'pan':      ('pan', ['nom.sg.masc']),
    'panos':    ('pan', ['gen.sg.masc']),
    'pani':     ('pan', ['dat.sg.masc']),
    'pana':     ('pan', ['acc.sg.masc']),
    # Nilus — existing card stem is 'Nilus' (capital N)
    'nilus':    ('Nilus', ['nom.sg.masc']),
    'nili':     ('Nilus', ['gen.sg.masc']),
    'nilo':     ('Nilus', ['dat.sg.masc', 'abl.sg.masc']),
    'nilum':    ('Nilus', ['acc.sg.masc']),
    'nil':      ('Nilus', ['acc.sg.masc']),   # poetic shortening
    # Titan
    'titan':    ('titan', ['nom.sg.masc']),
    # Aether (also in Morpheus cache but as citation form without case)
    'aether':   ('aether', ['nom.sg.masc']),
    'aethera':  ('aether', ['acc.sg.masc']),
    'aetheris': ('aether', ['gen.sg.masc']),
    'aetheri':  ('aether', ['dat.sg.masc']),
    'aethere':  ('aether', ['abl.sg.masc']),
    # Peneus / Peneius (river and father of Daphne)
    'peneus':   ('peneus', ['nom.sg.masc']),
    'penei':    ('peneus', ['gen.sg.masc']),
    'peneo':    ('peneus', ['dat.sg.masc', 'abl.sg.masc']),
    'peneia':   ('peneus', ['nom.sg.fem', 'voc.sg.fem']),  # Peneian (adj/epithet)
    'peneide':  ('peneus', ['abl.sg.fem']),
    'peneidas': ('peneus', ['acc.pl.fem']),
    'peneida':  ('peneus', ['acc.sg.fem']),
}


def classify(candidates):
    if not candidates:
        return 'unresolved'
    if len(candidates) == 1:
        return 'resolved_unambiguous'
    return 'ambiguous'


def candidate_groups(analyses):
    groups = seed.group_by_lemma(analyses)
    return [{'lemma': lemma, 'codes': codes} for lemma, codes in groups]


def token_record(surface, trail, analyses, source='morpheus'):
    candidates = candidate_groups(analyses)
    rec = {
        'surface': surface,
        'trail': trail,
        'source': source,
        'classification': classify(candidates),
        'candidates': candidates,
        'raw_analysis_count': len(analyses),
    }
    if rec['classification'] == 'ambiguous':
        rec['note'] = 'multiple-candidates'
    if rec['classification'] == 'unresolved':
        rec['note'] = 'no-candidates'
    return rec


def prewarm_cache(lines, cache):
    all_tokens = []
    seen = set()
    for line in lines:
        for word, _ in seed.tokenise(line):
            options = {word.lower()}
            for enc in seed.ENCLITICS:
                if word.lower().endswith(enc) and len(word) > len(enc):
                    options.add(word.lower()[:-len(enc)])
            for tok in options:
                if tok and tok not in cache and tok not in seen:
                    seen.add(tok)
                    all_tokens.append(tok)
    if all_tokens:
        cache.update(seed.query_morpheus(all_tokens))
        seed.save_cache(cache)


def build_line_tokens(line, cache):
    out = []
    for word, trail in seed.tokenise(line):
        key = word.lower()
        # Proper-noun override: maps surface directly to lemma+codes, bypassing
        # Morpheus (which doesn't analyse proper nouns).
        if key in PROPER_NOUN_SURFACE:
            lemma, codes = PROPER_NOUN_SURFACE[key]
            out.append({
                'surface': word,
                'trail': trail,
                'source': 'proper-noun-override',
                'classification': 'resolved_unambiguous',
                'candidates': [{'lemma': lemma, 'codes': codes}],
                'raw_analysis_count': 0,
            })
            continue
        analyses = seed.analyse_token(word, cache, apply_alias=False)
        # Also check enclitic-stripped form against proper-noun override.
        prefix, enclitic = seed.detect_enclitic(word, analyses)
        if prefix is not None:
            if prefix.lower() in PROPER_NOUN_SURFACE:
                lemma, codes = PROPER_NOUN_SURFACE[prefix.lower()]
                out.append({
                    'surface': prefix,
                    'trail': '',
                    'source': 'proper-noun-override',
                    'classification': 'resolved_unambiguous',
                    'candidates': [{'lemma': lemma, 'codes': codes}],
                    'raw_analysis_count': 0,
                })
            else:
                prefix_analyses = seed.analyse_token(prefix, cache, apply_alias=False)
                out.append(token_record(prefix, '', prefix_analyses))
            out.append({
                'surface': enclitic,
                'trail': trail,
                'source': 'enclitic-rule',
                'classification': 'resolved_unambiguous',
                'candidates': [{'lemma': enclitic, 'codes': ['enclit']}],
                'raw_analysis_count': 0,
                'note': 'split-enclitic',
            })
            continue
        out.append(token_record(word, trail, analyses))
    return out


def load_overrides(path):
    """Merge a per-text proper-noun overrides file into PROPER_NOUN_SURFACE.

    Keeps shared tooling text-agnostic: Ovid's registry stays inline; other
    texts (e.g. Marvell's Hortus) supply their own names via --overrides.
    File shape: { "surface_lowercase": ["lemma", ["code", ...]], ... }.
    """
    data = json.loads(open(path, encoding='utf-8').read())
    for surface, (lemma, codes) in data.items():
        PROPER_NOUN_SURFACE[surface.lower()] = (lemma, list(codes))
    return len(data)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--card', default='', help='Optional card label for metadata')
    ap.add_argument('--overrides', default='', help='Optional per-text proper-noun overrides JSON')
    args = ap.parse_args()

    if args.overrides:
        n = load_overrides(args.overrides)
        print(f'build_apparatus: merged {n} proper-noun override(s) from {args.overrides}', file=sys.stderr)

    lines = [line.strip() for line in sys.stdin.read().splitlines() if line.strip()]
    cache = seed.load_cache()
    prewarm_cache(lines, cache)

    apparatus_lines = []
    counts = {'resolved_unambiguous': 0, 'ambiguous': 0, 'unresolved': 0}
    for idx, line in enumerate(lines, start=1):
        tokens = build_line_tokens(line, cache)
        for t in tokens:
            counts[t['classification']] += 1
        apparatus_lines.append({'line_index': idx, 'text': line, 'tokens': tokens})

    out = {
        'schema_version': 1,
        'stage': 'apparatus_criticus',
        'card': args.card,
        'lines': apparatus_lines,
        'summary': counts,
    }
    json.dump(out, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write('\n')


if __name__ == '__main__':
    main()

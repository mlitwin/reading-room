#!/usr/bin/env python3
"""Build an apparatus-criticus JSON artifact from raw Latin passage text."""
import argparse
import json
import sys

import seed


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
        analyses = seed.analyse_token(word, cache, apply_alias=False)
        prefix, enclitic = seed.detect_enclitic(word, analyses)
        if prefix is not None:
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


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--card', default='', help='Optional card label for metadata')
    args = ap.parse_args()

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

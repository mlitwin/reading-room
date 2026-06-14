#!/usr/bin/env python3
"""fix_pos_mismatches.py — update content spans where a lemma ID has changed or
where the assigned ID's POS is incompatible with the annotated parse codes and
a better-matching ID is now available.

Runs after new/corrected lexicon entries are added.  Re-inspects every
data-matches chunk in the content markdown files and, when the current ID's POS
clashes with the parse codes, attempts to substitute a better ID from the same
filename stem.

Usage:
    python3 fix_pos_mismatches.py [--dry-run]
"""
import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SHARED_LEXICON = ROOT / 'content' / '_latin-lexicon'
CONTENT = ROOT / 'content'

SPAN_RE = re.compile(
    r'(<span\b[^>]*?\bdata-matches=")([^"]+)("(?:[^>]*)?>)',
    re.DOTALL,
)
STANZA_ATTR_RE = re.compile(r'(\bdata-stanza=")([^"]+)(")')
CASE_PREFIX = ('nom.', 'gen.', 'dat.', 'acc.', 'abl.', 'voc.', 'loc.')

POS_ABBREV_RE = re.compile(r'_([a-z]+)$')

CODE_POS_SCORES = {
    'prep':   {'prep': 8},
    'conj':   {'conj': 8, 'adv': 4},
    'adv':    {'adv': 8, 'conj': 4, 'adj': 2, 'pron': 2},
    'enclit': {'conj': 8, 'adv': 8, 'enclitic': 8},
    'num':    {'num': 8, 'adj': 4},
}


def code_pos_score(code, pos):
    if code in CODE_POS_SCORES:
        return CODE_POS_SCORES[code].get(pos, -4)
    if code.startswith(('1sg.', '2sg.', '3sg.', '1pl.', '2pl.', '3pl.', 'inf.')):
        return 8 if pos == 'verb' else -4
    if code.startswith(('ppp.', 'pap.', 'fap.', 'fpp.')):
        if pos == 'verb': return 8
        if pos == 'adj':  return 2
        return -3
    if code.startswith(CASE_PREFIX):
        return 6 if pos in ('noun', 'adj', 'pron', 'num') else -3
    return 0


def load_lexicon():
    by_id = {}
    stem_to_ids = defaultdict(list)
    for path in sorted(SHARED_LEXICON.glob('*.json')):
        try:
            data = json.loads(path.read_text(encoding='utf-8'))
        except json.JSONDecodeError:
            continue
        entry_id = data.get('id') or path.stem
        by_id[entry_id] = data
        # Index by filename stem (primary key used in content spans)
        stem_to_ids[path.stem].append(entry_id)
        # Also index by lemma surface form so new disambiguation entries
        # (e.g. uno_v.json with lemma="uno") are found when looking up
        # the original surface stem.
        lemma_key = (data.get('lemma') or '').lower()
        if lemma_key and lemma_key != path.stem and entry_id not in stem_to_ids[lemma_key]:
            stem_to_ids[lemma_key].append(entry_id)
    return by_id, dict(stem_to_ids)


def id_to_stem(entry_id, stem_to_ids):
    """Recover the filename stem for a given entry ID."""
    # Most stems = id without the trailing _pos suffix
    # Build reverse map via stem_to_ids
    for stem, ids in stem_to_ids.items():
        if entry_id in ids:
            return stem
    # Fallback: strip trailing _<abbrev>
    m = POS_ABBREV_RE.search(entry_id)
    if m:
        return entry_id[:m.start()]
    return entry_id


def best_id_for_codes(codes, candidates, by_id):
    if not candidates:
        return None
    if len(candidates) == 1:
        return candidates[0]
    def score(eid):
        pos = by_id.get(eid, {}).get('pos', '')
        return sum(code_pos_score(c, pos) for c in codes) if codes else 0
    return max(candidates, key=score)


def is_compatible(entry_id, codes, by_id):
    pos = by_id.get(entry_id, {}).get('pos', '')
    if not pos or not codes:
        return True
    scores = [code_pos_score(c, pos) for c in codes]
    return any(s > 0 for s in scores)


def rewrite_chunk(chunk, by_id, stem_to_ids, changes):
    i = chunk.find(':')
    if i < 0:
        entry_id = chunk.strip()
        codes = []
    else:
        entry_id = chunk[:i].strip()
        codes = [c.strip() for c in chunk[i+1:].split(',') if c.strip()]

    entry_exists = bool(by_id.get(entry_id))

    if entry_exists and is_compatible(entry_id, codes, by_id):
        return chunk  # current ID is fine

    # Either the ID is stale (entry was renamed) or incompatible with codes.
    # Look up by stem and pick the best available ID.
    stem = id_to_stem(entry_id, stem_to_ids)
    candidates = stem_to_ids.get(stem, [])

    if not candidates:
        return chunk  # truly unknown stem

    new_id = best_id_for_codes(codes, candidates, by_id)

    if new_id and new_id != entry_id and by_id.get(new_id):
        changes.append((entry_id, new_id, codes))
        codes_str = ','.join(codes)
        return f'{new_id}:{codes_str}' if codes_str else new_id

    # No better candidate — if the current entry still exists, keep it.
    return chunk


def rewrite_matches(raw, by_id, stem_to_ids, changes):
    parts = [rewrite_chunk(c, by_id, stem_to_ids, changes) for c in raw.split(';')]
    return ';'.join(parts)


def rewrite_stanza(value, by_id, stem_to_ids):
    if by_id.get(value):
        return value  # still valid
    stem = id_to_stem(value, stem_to_ids)
    candidates = stem_to_ids.get(stem, [])
    if len(candidates) == 1:
        return candidates[0]
    verb = next((c for c in candidates if c.endswith('_v')), None)
    return verb or (candidates[0] if candidates else value)


def process_file(path, by_id, stem_to_ids, dry_run):
    text = path.read_text(encoding='utf-8')
    all_changes = []

    def replace_span(m):
        prefix, raw, suffix = m.group(1), m.group(2), m.group(3)
        changes = []
        new_raw = rewrite_matches(raw, by_id, stem_to_ids, changes)
        def rewrite_stanza_attr(sm):
            new_val = rewrite_stanza(sm.group(2), by_id, stem_to_ids)
            return sm.group(1) + new_val + sm.group(3)
        new_suffix = STANZA_ATTR_RE.sub(rewrite_stanza_attr, suffix)
        all_changes.extend(changes)
        return prefix + new_raw + new_suffix

    new_text = SPAN_RE.sub(replace_span, text)

    if new_text != text:
        rel = path.relative_to(ROOT)
        print(f'  {"would change" if dry_run else "changed"} {len(all_changes)} span(s) in {rel}')
        for old, new, codes in all_changes[:5]:
            print(f'    {old} → {new}  codes={codes}')
        if len(all_changes) > 5:
            print(f'    … and {len(all_changes)-5} more')
        if not dry_run:
            path.write_text(new_text, encoding='utf-8')

    return len(all_changes)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    by_id, stem_to_ids = load_lexicon()
    print(f'Loaded {len(by_id)} entries, {len(stem_to_ids)} stems', file=sys.stderr)

    total = 0
    for path in sorted(CONTENT.glob('**/*.md')):
        n = process_file(path, by_id, stem_to_ids, args.dry_run)
        total += n

    action = 'Would fix' if args.dry_run else 'Fixed'
    print(f'{action} {total} span(s) total.')


if __name__ == '__main__':
    main()

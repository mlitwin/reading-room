// Reference-grammar invariants (R0–R12). See Plans/latin-text-centered-reader-plan.md (A2).
//
// Validates content/_language/latin/reference-grammar.json — the site's own
// reference grammar, seeded from Allen & Greenough and edited by hand since —
// plus the agRefs bridge from grammar.json and the popover projection. Because
// the file is hand-edited, the checks cover what the seed used to guarantee:
// toc ⇄ sections consistency, resolvable cross-refs, a closed HTML vocabulary,
// and stable published URLs (section → page baseline).

import { ReferenceGrammarSchema, SECTION_ID } from '../schema/reference-grammar.schema.js';
import { indexReferenceGrammar } from '../lib/reference-grammar.js';
import { buildReferenceNotes } from '../build-reference-notes.js';

/** @typedef {import('../schema/reference-grammar.schema.js').ReferenceGrammar} ReferenceGrammar */
/** @typedef {import('./runner.js').Violation} Violation */
/** @typedef {import('./runner.js').Invariant} Invariant */

// The seed's HTML vocabulary. Widen deliberately when new matter needs it.
export const ALLOWED_TAGS = new Set(['p', 'span', 'em', 'strong', 'table', 'tr', 'td', 'th', 'ul', 'ol', 'li', 'a', 'br', 'sub', 'sup']);
export const ALLOWED_CLASSES = new Set(['lang-la', 'lang-foreign', 'gloss', 'quote', 'ag-list', 'ag-note', 'ag-note-foot', 'ag-table']);
const VOID_TAGS = new Set(['br']);

const CAPS_RUN = /[^\P{L}]+/gu;
function hasCapsRun(label) {
  for (const m of String(label).matchAll(CAPS_RUN)) {
    const run = m[0];
    if (/[a-z]/.test(run)) continue;
    if ([...run].filter((ch) => ch !== ch.toLowerCase()).length >= 2) return true;
  }
  return false;
}

// Tag-level HTML check: allowed tags / attributes / classes, balanced nesting.
export function htmlProblems(html) {
  const problems = [];
  const stack = [];
  for (const m of String(html).matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g)) {
    const [, close, rawTag, attrs] = m;
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) { problems.push(`tag <${tag}> not allowed`); continue; }
    if (close) {
      const open = stack.pop();
      if (open !== tag) { problems.push(`</${tag}> closes <${open ?? 'nothing'}>`); break; }
      continue;
    }
    for (const a of attrs.matchAll(/\s([a-zA-Z-]+)(?:="([^"]*)")?/g)) {
      const [, name, value = ''] = a;
      if (name === 'class') {
        for (const c of value.split(/\s+/).filter(Boolean)) {
          if (!ALLOWED_CLASSES.has(c)) problems.push(`class "${c}" not allowed`);
        }
      } else if (!(name === 'data-ref' && tag === 'a')) {
        problems.push(`attribute ${name} on <${tag}> not allowed`);
      }
    }
    if (tag === 'a' && !/\sdata-ref="/.test(attrs)) problems.push('<a> without data-ref');
    if (!VOID_TAGS.has(tag) && !attrs.trimEnd().endsWith('/')) stack.push(tag);
  }
  if (stack.length) problems.push(`unclosed <${stack[stack.length - 1]}>`);
  return problems;
}

/** Section → page slug map used for the URL-stability baseline. */
export function referenceUrlMap(ref) {
  return Object.fromEntries(indexReferenceGrammar(ref).secToPage);
}

function tocSectionIds(ref) {
  const out = [];
  const walk = (items) => {
    for (const it of items || []) typeof it === 'string' ? out.push(it) : walk(it.items);
  };
  for (const p of ref.toc || []) for (const c of p.chapters || []) walk(c.items);
  return out;
}

/** @type {Invariant[]} */
export const referenceGrammarInvariants = [
  {
    id: 'R0',
    description: 'Document matches the reference-grammar schema',
    check(ref) {
      const res = ReferenceGrammarSchema.safeParse(ref);
      if (res.success) return [];
      return res.error.issues.slice(0, 50).map((i) => ({ path: i.path.join('.'), message: i.message }));
    },
  },

  {
    id: 'R1',
    description: 'Every toc section id has a section body',
    check(ref) {
      return tocSectionIds(ref)
        .filter((id) => !ref.sections?.[id])
        .map((id) => ({ path: 'toc', message: `toc lists missing section "${id}"` }));
    },
  },

  {
    id: 'R2',
    description: 'Every section appears in the toc exactly once',
    check(ref) {
      const counts = new Map();
      for (const id of tocSectionIds(ref)) counts.set(id, (counts.get(id) ?? 0) + 1);
      const violations = [];
      for (const id of Object.keys(ref.sections || {})) {
        const n = counts.get(id) ?? 0;
        if (n !== 1) violations.push({ path: `sections["${id}"]`, message: n ? `listed ${n} times in the toc` : 'not in the toc (orphan)' });
      }
      return violations;
    },
  },

  {
    id: 'R3',
    description: 'Every cross-reference (data-ref) resolves to a section',
    check(ref) {
      const violations = [];
      for (const [id, info] of indexReferenceGrammar(ref).sections) {
        for (const t of info.xrefs) {
          if (!ref.sections[t]) violations.push({ path: `sections["${id}"].html`, message: `dangling cross-reference to "${t}"` });
        }
      }
      return violations;
    },
  },

  {
    id: 'R4',
    description: 'Every section has non-empty html',
    check(ref) {
      return Object.entries(ref.sections || {})
        .filter(([, sec]) => !sec.html || !sec.html.trim())
        .map(([id]) => ({ path: `sections["${id}"].html`, message: 'empty section body' }));
    },
  },

  {
    id: 'R5',
    description: 'grammar.json agRefs resolve to reference sections',
    /**
     * @param {ReferenceGrammar} ref
     * @param {{ grammar?: { categories: Array<{ id: string, values: Array<{ id: string, agRefs?: string[] }> }>, terms?: Array<{ id: string, agRefs?: string[] }> } }} ctx
     */
    check(ref, ctx) {
      const violations = [];
      const grammar = ctx?.grammar;
      if (!grammar) return violations;
      const checkRefs = (agRefs, path) => {
        for (const t of agRefs ?? []) {
          if (!ref.sections[t]) violations.push({ path, message: `references missing reference section "${t}"` });
        }
      };
      for (const cat of grammar.categories) {
        for (const val of cat.values) checkRefs(val.agRefs, `grammar.${cat.id}.${val.id}.agRefs`);
      }
      for (const term of grammar.terms ?? []) checkRefs(term.agRefs, `grammar.term.${term.id}.agRefs`);
      return violations;
    },
  },

  {
    id: 'R6',
    description: 'Part ids, chapter ids, and chapter slugs are unique',
    check(ref) {
      const violations = [];
      const seen = { part: new Set(), chapter: new Set(), slug: new Set() };
      const dup = (kind, v, path) => {
        if (seen[kind].has(v)) violations.push({ path, message: `duplicate ${kind} "${v}"` });
        seen[kind].add(v);
      };
      for (const p of ref.toc || []) {
        dup('part', p.id, `toc["${p.id}"]`);
        for (const c of p.chapters || []) {
          dup('chapter', c.id, `toc["${p.id}"].chapters["${c.id}"]`);
          dup('slug', c.slug, `toc["${p.id}"].chapters["${c.id}"].slug`);
        }
      }
      return violations;
    },
  },

  {
    id: 'R7',
    description: 'Section ids and sources agree (§ numbers are seeded sections; rr- ids are editorial)',
    check(ref) {
      const violations = [];
      const sources = new Set((ref.sources || []).map((s) => s.id));
      for (const [id, sec] of Object.entries(ref.sections || {})) {
        const path = `sections["${id}"]`;
        if (!SECTION_ID.test(id)) violations.push({ path, message: 'id is neither a § number nor rr-slug' });
        if (sec.source !== 'editorial' && !sources.has(sec.source)) {
          violations.push({ path, message: `source "${sec.source}" is not in sources[] (or "editorial")` });
        }
        if (/^\d+$/.test(id) && sec.source === 'editorial') violations.push({ path, message: '§-number ids are reserved for seeded sections; use rr-…' });
        if (id.startsWith('rr-') && sec.source !== 'editorial') violations.push({ path, message: 'rr- ids are editorial matter (source: "editorial")' });
        if (sec.source === 'editorial' && !sec.heading) violations.push({ path, message: 'editorial sections need their own heading' });
      }
      return violations;
    },
  },

  {
    id: 'R8',
    description: 'Section HTML uses only the allowed tags, attributes, and classes, and is balanced',
    check(ref) {
      const violations = [];
      for (const [id, sec] of Object.entries(ref.sections || {})) {
        const probs = [...new Set(htmlProblems(sec.html))];
        for (const p of probs) violations.push({ path: `sections["${id}"].html`, message: p });
      }
      return violations;
    },
  },

  {
    id: 'R9',
    description: 'Published URLs are stable: section → page matches the committed baseline',
    /** @param {ReferenceGrammar} ref @param {{ urlBaseline?: Record<string, string> }} ctx */
    check(ref, ctx) {
      const baseline = ctx?.urlBaseline;
      if (!baseline) return [];
      const current = referenceUrlMap(ref);
      const violations = [];
      for (const [id, slug] of Object.entries(baseline)) {
        if (!(id in current)) violations.push({ path: `sections["${id}"]`, message: `removed; its URL ${slug}.html#sec-${id} would break` });
        else if (current[id] !== slug) violations.push({ path: `sections["${id}"]`, message: `moved ${slug}.html → ${current[id]}.html` });
      }
      for (const id of Object.keys(current)) {
        if (!(id in baseline)) violations.push({ path: `sections["${id}"]`, message: `new section not in the URL baseline (run npm run reference:baseline)` });
      }
      return violations;
    },
  },

  {
    id: 'R10',
    description: 'Popover projection: every in-flow data-ag resolves to a note',
    check(ref) {
      const violations = [];
      const { notes } = buildReferenceNotes(ref);
      for (const note of Object.values(notes)) {
        for (const m of note.html.matchAll(/data-ag="([^"]+)"/g)) {
          if (!notes[m[1]]) violations.push({ path: `notes["${note.id}"].html`, message: `data-ag="${m[1]}" has no note` });
        }
      }
      return violations;
    },
  },

  {
    id: 'R11',
    severity: 'warning',
    description: 'Headings are in display case (no leftover ALL CAPS)',
    check(ref) {
      const violations = [];
      const walk = (items, path) => {
        for (const it of items || []) {
          if (typeof it === 'string') continue;
          if (hasCapsRun(it.label)) violations.push({ path, message: `group "${it.label}"` });
          walk(it.items, path);
        }
      };
      for (const p of ref.toc || []) {
        if (hasCapsRun(p.label)) violations.push({ path: `toc["${p.id}"]`, message: `part "${p.label}"` });
        for (const c of p.chapters || []) {
          if (hasCapsRun(c.label)) violations.push({ path: `toc["${p.id}"].chapters["${c.id}"]`, message: `chapter "${c.label}"` });
          walk(c.items, `toc["${p.id}"].chapters["${c.id}"]`);
        }
      }
      for (const [id, sec] of Object.entries(ref.sections || {})) {
        if (sec.heading && hasCapsRun(sec.heading)) violations.push({ path: `sections["${id}"].heading`, message: sec.heading });
      }
      return violations;
    },
  },

  {
    id: 'R12',
    severity: 'warning',
    description: 'Edited seeded sections say what changed (edit_note)',
    check(ref) {
      return Object.entries(ref.sections || {})
        .filter(([, sec]) => sec.edited && !sec.edit_note)
        .map(([id]) => ({ path: `sections["${id}"]`, message: 'edited: true without an edit_note' }));
    },
  },
];

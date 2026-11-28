// Derived view of the Reference Grammar (content/_language/{lang}/reference-grammar.json).
//
// The JSON stores only authored data: the toc tree (parts → chapters → groups →
// section ids) and each section's body. Everything else — chapter membership,
// group headings, document order, prev/next, outgoing cross-refs, the page a
// section lands on — is derived here, once, and shared by the standalone
// document builder, the popover projection, the validator, and build.js's
// `ag:`/`ref:` link resolution. See Plans/latin-text-centered-reader-plan.md (D1).

const REF_RE = /data-ref="([^"]+)"/g;

/** Outgoing cross-reference ids in a section body, in first-seen order. */
export function sectionXrefs(html) {
  const out = [];
  for (const m of String(html).matchAll(REF_RE)) {
    if (!out.includes(m[1])) out.push(m[1]);
  }
  return out;
}

/**
 * Index the toc. Tolerates dangling toc ids (they're reported by the
 * invariants); such ids appear in `order` but have no `sections` entry.
 *
 * @param {object} ref  parsed reference-grammar.json
 * @returns {{
 *   title: string,
 *   order: string[],
 *   parts: Array<{ id: string, label: string, chapters: object[] }>,
 *   chapters: Array<{ id: string, slug: string, label: string, part: object, sectionIds: string[], entries: Array<{ id: string, groups: string[] }> }>,
 *   chapterById: Map<string, object>,
 *   sections: Map<string, { id: string, chapter: object, groups: string[], heading: string, prev: string|null, next: string|null, xrefs: string[], source: string, source_page?: number, edited: boolean, html: string }>,
 *   secToPage: Map<string, string>,
 * }}
 */
export function indexReferenceGrammar(ref) {
  const order = [];
  const chapters = [];
  const chapterById = new Map();
  const placed = new Map();   // id → { chapter, groups }

  function walk(items, groups, chapter) {
    for (const item of items || []) {
      if (typeof item === 'string') {
        order.push(item);
        chapter.sectionIds.push(item);
        chapter.entries.push({ id: item, groups });
        if (!placed.has(item)) placed.set(item, { chapter, groups });
      } else {
        walk(item.items, [...groups, item.label], chapter);
      }
    }
  }

  const parts = (ref.toc || []).map((p) => {
    const part = { id: p.id, label: p.label, chapters: [] };
    for (const c of p.chapters || []) {
      const chapter = { id: c.id, slug: c.slug, label: c.label, part, sectionIds: [], entries: [], items: c.items };
      part.chapters.push(chapter);
      chapters.push(chapter);
      chapterById.set(c.id, chapter);
      walk(c.items, [], chapter);
    }
    return part;
  });

  const sections = new Map();
  const secToPage = new Map();
  const real = order.filter((id, i) => ref.sections?.[id] && order.indexOf(id) === i);
  real.forEach((id, i) => {
    const sec = ref.sections[id];
    const { chapter, groups } = placed.get(id);
    sections.set(id, {
      id,
      chapter,
      groups,
      heading: sec.heading || groups[groups.length - 1] || chapter.label,
      prev: real[i - 1] ?? null,
      next: real[i + 1] ?? null,
      xrefs: sectionXrefs(sec.html),
      source: sec.source,
      source_page: sec.source_page,
      edited: sec.edited === true,
      html: sec.html,
    });
    secToPage.set(id, chapter.slug);
  });

  return { title: ref.title, order, parts, chapters, chapterById, sections, secToPage };
}

// Paradigm tables are wide (up to ~11 columns). Wrap each in a horizontally
// scrollable container so it doesn't overflow a phone or the popover.
export function wrapTables(html) {
  return String(html)
    .replace(/<table class="ag-table">/g, '<div class="ag-table-wrap"><table class="ag-table">')
    .replace(/<\/table>/g, '</table></div>');
}

/** Display label for a section: "§ 201" for A&G-numbered ids, else its heading. */
export function sectionLabel(info) {
  return /^\d+$/.test(info.id) ? `§ ${info.id}` : info.heading;
}

/** Short label for crumbs and popover titles ("§201", or the heading). */
export function sectionShortLabel(info) {
  return /^\d+$/.test(info.id) ? `§${info.id}` : info.heading;
}

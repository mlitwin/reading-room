// Popover controller for Latin lexicon cards and grammar notes.
//
// Card content is loaded lazily from assets/lexicon.json on first popover
// open and rendered into the single persistent `<aside id="popover-host">`.
// Grammar notes are pre-rendered as hidden `<aside class="note-popover-source">`
// elements in the page DOM (see build.js).
//
// Stack model: one per open-cycle, cleared on light-dismiss.
//   Card entry: { type:'card', lemma, label, matches, stanzaLemma,
//                 selectedLemma, selectedBy, activeLemma, formTab }
//   Note entry: { type:'note', sourceId, label }   (editorial, grammar, guide)
//   Ref entry:  { type:'ref', id, label }          (a Reference Grammar section)
//   Toc entry:  { type:'toc', id, label }          (its contents: '' or a chapter id)
(function () {

  // ── parse-code vocabulary — derived from grammar.json at runtime when the
  // grammar bundle has loaded. The hardcoded fallback below covers the cold
  // path before grammar arrives (first render, slow network, missing asset).
  // Both map a parse atom (e.g. "nom", "1") to `{label, note}` — label is the
  // text rendered in the parse chip, note is the slug used to open the
  // matching grammar gloss popover.
  var FALLBACK_PARSE_TOKEN_MAP = {
    nom: { label: 'nominative', note: 'nominative' },
    gen: { label: 'genitive', note: 'genitive' },
    dat: { label: 'dative', note: 'dative' },
    acc: { label: 'accusative', note: 'accusative' },
    abl: { label: 'ablative', note: 'ablative' },
    voc: { label: 'vocative', note: 'vocative' },
    sg: { label: 'singular', note: 'singular' },
    pl: { label: 'plural', note: 'plural' },
    masc: { label: 'masculine', note: 'masculine' },
    fem: { label: 'feminine', note: 'feminine' },
    neut: { label: 'neuter', note: 'neuter' },
    pres: { label: 'present', note: 'present' },
    imperf: { label: 'imperfect', note: 'imperfect' },
    perf: { label: 'perfect', note: 'perfect' },
    plup: { label: 'pluperfect', note: 'pluperfect' },
    fut: { label: 'future', note: 'future' },
    futperf: { label: 'future perfect', note: 'future-perfect' },
    ind: { label: 'indicative', note: 'indicative' },
    subj: { label: 'subjunctive', note: 'subjunctive' },
    imp: { label: 'imperative', note: 'imperative' },
    act: { label: 'active', note: 'active' },
    pass: { label: 'passive', note: 'passive' },
    inf: { label: 'infinitive', note: 'infinitive' },
    ppp: { label: 'perfect passive participle', note: 'perfect-passive-participle' },
    pap: { label: 'present active participle', note: 'present-active-participle' },
    fap: { label: 'future active participle', note: 'future-active-participle' },
    gerundive: { label: 'gerundive', note: 'gerundive' },
    ger: { label: 'gerund', note: 'gerund' },
    sup: { label: 'supine', note: 'supine' },
    c: { label: 'common gender', note: 'common-gender' },
    loc: { label: 'locative', note: 'locative' },
    comp: { label: 'comparative', note: 'comparative' },
    superl: { label: 'superlative', note: 'superlative' },
    prep: { label: 'preposition', note: 'preposition' },
    conj: { label: 'conjunction', note: 'conjunction' },
    enclit: { label: 'enclitic', note: 'enclitic' },
  };
  var FALLBACK_PERSON_MAP = {
    '1': { label: '1st-person', note: '1st-person' },
    '2': { label: '2nd-person', note: '2nd-person' },
    '3': { label: '3rd-person', note: '3rd-person' },
  };
  var FALLBACK_POS_NOTE = {
    noun: 'noun', verb: 'verb', adj: 'adjective', pron: 'pronoun',
    prep: 'preposition', conj: 'conjunction', enclitic: 'enclitic',
    adv: 'adverb', interj: 'interjection', num: 'numeral',
  };
  var PRINCIPAL_PART_NOTES = [
    'first-principal-part', 'second-principal-part',
    'third-principal-part', 'fourth-principal-part',
  ];

  // Live versions — start as the fallback shape, get replaced once
  // grammar.json loads. Mutations are done in place so existing closures
  // (renderHost etc.) don't need rebinding.
  var PARSE_TOKEN_MAP = Object.assign({}, FALLBACK_PARSE_TOKEN_MAP);
  var PERSON_MAP = Object.assign({}, FALLBACK_PERSON_MAP);
  var POS_NOTE = Object.assign({}, FALLBACK_POS_NOTE);

  function slugifyHeading(s) {
    return String(s).toLowerCase()
      .normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  // Replace the parse-token + pos maps with entries derived from grammar.json.
  // Keys are grammar value IDs (`nom`, `1`, `pres`, `ppp`, …); labels are the
  // long-form names (`Nominative` etc.) lowercased to match the existing UI;
  // note slugs are the slugified labels to match the build-time note ID
  // injection (`note-nominative` etc., aliased to `note-nom` by the build).
  function applyGrammar(grammar) {
    if (!grammar || !Array.isArray(grammar.categories)) return;
    var personCat = null, posCat = null;
    var parseMap = {}, posMap = {};
    for (var i = 0; i < grammar.categories.length; i++) {
      var cat = grammar.categories[i];
      for (var j = 0; j < cat.values.length; j++) {
        var v = cat.values[j];
        var label = String(v.label || v.id).toLowerCase();
        var note = slugifyHeading(v.label || v.id);
        var entry = { label: label, note: note };
        if (cat.id === 'pos') {
          posMap[v.id] = note;
          // For the chip-rendering path that splits parse codes, pos values
          // (`prep`, `conj`, …) also flow through PARSE_TOKEN_MAP, so include
          // them under their id too.
          parseMap[v.id] = entry;
        } else if (cat.id === 'person') {
          // Person codes don't go in PARSE_TOKEN_MAP — they're combined with
          // sg/pl in PERSON_MAP-handled "1sg"/"2pl"/etc.
          personCat = personCat || {};
          personCat[v.id] = entry;
        } else {
          parseMap[v.id] = entry;
        }
      }
    }
    // Apply: overlay grammar-derived entries onto the fallback maps so any
    // gaps in grammar (e.g. `sup` not modelled there) stay covered.
    for (var k in parseMap) PARSE_TOKEN_MAP[k] = parseMap[k];
    if (personCat) for (var kp in personCat) PERSON_MAP[kp] = personCat[kp];
    for (var kq in posMap) POS_NOTE[kq] = posMap[kq];
  }

  // ── HTML helpers
  function escHtml(s) {
    var d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
  }
  function escAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }
  // `inert` adds tabindex="-1" so the button is mouse-clickable but skipped by
  // keyboard/AT. Used inside the aria-hidden visual paradigm, where focusable
  // buttons would otherwise be a "focusable but hidden" anti-pattern.
  function noteBtn(note, label, inert) {
    return '<button class="note-link" type="button"'
      + (inert ? ' tabindex="-1"' : '')
      + ' popovertarget="note-' + escAttr(note) + '">' + escHtml(label) + '</button>';
  }

  // ── parse-code → linked tokens
  function tokenToLinks(tok) {
    var pn = /^([123])(sg|pl)$/.exec(tok);
    if (pn) return [PERSON_MAP[pn[1]], PARSE_TOKEN_MAP[pn[2]]];
    var m = PARSE_TOKEN_MAP[tok];
    if (m) return [m];
    return [{ label: tok, note: null }];
  }
  function expandParseLinks(parse) {
    if (!parse) return '';
    var pieces = [];
    parse.split('.').forEach(function (tok) { pieces.push.apply(pieces, tokenToLinks(tok)); });
    return pieces.map(function (p) {
      return p.note ? noteBtn(p.note, p.label, true) : '<span>' + escHtml(p.label) + '</span>';
    }).join(' ');
  }
  // Plain-text expansion of a parse code (no markup) for aria-labels.
  function parseToText(parse) {
    if (!parse) return '';
    var pieces = [];
    parse.split('.').forEach(function (tok) { pieces.push.apply(pieces, tokenToLinks(tok)); });
    return pieces.map(function (p) { return p.label; }).join(' ');
  }
  function renderCompactRowHeader(code) {
    var pieces = [];
    code.split('.').forEach(function (tok) {
      var pn = /^([123])(sg|pl)$/.exec(tok);
      if (pn) {
        pieces.push({ label: pn[1], note: PERSON_MAP[pn[1]].note });
        pieces.push({ label: pn[2], note: PARSE_TOKEN_MAP[pn[2]].note });
      } else {
        var m = PARSE_TOKEN_MAP[tok];
        pieces.push(m ? { label: tok, note: m.note } : { label: tok, note: null });
      }
    });
    return pieces.map(function (p) {
      return p.note ? noteBtn(p.note, p.label, true) : '<span>' + escHtml(p.label) + '</span>';
    }).join(' ');
  }

  // ── card HTML rendering (ported from build.js)
  function splitColumnsByGroup(cols, type) {
    function group(keyIdx, category) {
      var out = [], seen = Object.create(null);
      cols.forEach(function (c) {
        var parts = c.split('.');
        var key = parts[keyIdx];
        var subCol = parts.filter(function (_, i) { return i !== keyIdx; }).join('.');
        if (!seen[key]) { seen[key] = { groupKey: key, category: category, subCols: [] }; out.push(seen[key]); }
        seen[key].subCols.push({ orig: c, sub: subCol });
      });
      return out;
    }
    if (type === 'verb') {
      // Group by voice (index 2: act/pass) when passive columns are present,
      // so active and passive forms appear as labelled separate tables.
      // Fall back to mood grouping (index 1) for active-only paradigms.
      var hasPassive = cols.some(function (c) { return c.indexOf('.pass') !== -1; });
      return hasPassive ? group(2, 'Voice') : group(1, 'Mood');
    }
    // Nominal paradigms (adj/pron/ppp) split on number — sg.{m,f,n} and
    // pl.{m,f,n} land as separate tables with the gender as inner columns.
    if (type === 'adj' || type === 'pron' || type === 'ppp') return group(0, 'Number');
    return [{ groupKey: null, category: null, subCols: cols.map(function (c) { return { orig: c, sub: c }; }) }];
  }

  function cellForm(v) {
    return v == null ? null : (Array.isArray(v) ? v.join(', ') : v);
  }

  // Render one column-grouping (e.g. "active" voice) using the paradigm-grid
  // pattern (see development/paradigm-grid-pattern.md). Two layers:
  //   1. A visually-hidden semantic <table> carrying the accessibility
  //      semantics (column/row headers, table navigation).
  //   2. An aria-hidden visual grid: responsive wrapping column blocks whose
  //      rows align via subgrid, with row labels collapsed into a shared left
  //      gutter (absolutely-positioned, opaque-backed badges).
  function renderSection(p, sectionGroup, type, soloSection, rowPrefixOverride) {
    // PPP cells are stored with a 'ppp.' prefix on the row so their keys match
    // parse codes directly (e.g. ppp.acc.pl.fem). Marker grids (pap.,
    // gerundive., comp., …) pass their prefix explicitly.
    var rowPrefix = rowPrefixOverride != null
      ? rowPrefixOverride
      : (type === 'ppp' ? 'ppp.' : '');
    function hasForm(r, sc) { return p.cells[rowPrefix + r + '.' + sc.orig] != null; }
    // Canonical row order is preserved from p.rows (1sg…3pl, nom…abl).
    var rows = p.rows.filter(function (r) {
      return sectionGroup.subCols.some(function (sc) { return hasForm(r, sc); });
    });
    if (!rows.length) return '';
    // Drop sub-columns with no forms in any row for this section.
    var subCols = sectionGroup.subCols.filter(function (sc) {
      return rows.some(function (r) { return hasForm(r, sc); });
    });
    if (!subCols.length) return '';

    // ── (1) accessibility: semantic table, plain text, header association.
    var captionText = sectionGroup.groupKey && !soloSection
      ? (sectionGroup.category ? sectionGroup.category + ': ' : '') + parseToText(sectionGroup.groupKey)
      : '';
    var srHead = '<tr><td></td>' + subCols.map(function (sc) {
      return '<th scope="col">' + escHtml(parseToText(sc.sub) || sc.sub) + '</th>';
    }).join('') + '</tr>';
    var srBody = rows.map(function (r) {
      return '<tr><th scope="row">' + escHtml(parseToText(r) || r) + '</th>'
        + subCols.map(function (sc) {
            return '<td>' + escHtml(cellForm(p.cells[rowPrefix + r + '.' + sc.orig]) || '') + '</td>';
          }).join('')
        + '</tr>';
    }).join('');
    var srTable = '<div class="sr-only"><table>'
      + (captionText ? '<caption>' + escHtml(captionText) + '</caption>' : '')
      + '<thead>' + srHead + '</thead><tbody>' + srBody + '</tbody></table></div>';

    // ── (2) visual layer (aria-hidden).
    // Section label ("Voice: active") above the grid — dropped for a solo
    // section or when there's no group key (the <caption> covers AT).
    var section = sectionGroup.groupKey && !soloSection
      ? '<div class="paradigm-section">'
        + (sectionGroup.category
          ? '<span class="paradigm-section-label">' + escHtml(sectionGroup.category) + ':</span> '
          : '')
        + expandParseLinks(sectionGroup.groupKey)
        + '</div>'
      : '';
    // Row-header badge: every badge holds the full row-label stack, so it sizes
    // to max-content of all labels = the widest label. That gives a uniform
    // row-header column with no magic width. Only one label per badge is marked
    // --shown (visible); the rest stay laid out (visibility:hidden) so they keep
    // contributing width. Each row's compact header is rendered once (it carries
    // grammar links); a per-row badge is then assembled by marking that row's
    // label shown, and cloned into every column.
    var rowLabelHtml = rows.map(function (r) { return renderCompactRowHeader(r); });
    function badgeStack(shownIdx) {
      return rowLabelHtml.map(function (h, i) {
        var cls = 'paradigm-badge-label' + (i === shownIdx ? ' paradigm-badge-label--shown' : '');
        return '<span class="' + cls + '">' + h + '</span>';
      }).join('');
    }
    // One badge per row index (the active label twiddled), reused across columns.
    var cellBadges = rows.map(function (_, i) {
      return '<span class="paradigm-badge-box">'
        + '<span class="paradigm-badge">' + badgeStack(i) + '</span></span>';
    });
    // Gutter spacer: invisible; one stack with nothing shown — it only reserves
    // the (widest-label) width so the grid shifts right and the absolute badges
    // have a clear gutter.
    var gutter = '<div class="paradigm-gutter">'
      + '<span class="paradigm-badge">' + badgeStack(-1) + '</span></div>';
    var cols = subCols.map(function (sc) {
      // Always emit a col-head (even empty) so every column has exactly
      // --rows + 1 children for the subgrid row span to line up.
      var head = '<div class="paradigm-col-head">' + (sc.sub ? expandParseLinks(sc.sub) : '') + '</div>';
      var cells = rows.map(function (r, i) {
        var key = rowPrefix + r + '.' + sc.orig;
        var form = cellForm(p.cells[key]);
        // Keep a consistent row shape across columns: a column missing this row
        // (e.g. the imperative has no 1sg) still renders a placeholder cell so
        // the rows stay aligned. The nbsp keeps the empty cell from collapsing.
        if (form == null) {
          return '<div class="paradigm-cell paradigm-cell--empty">'
            + cellBadges[i]
            + '<span class="paradigm-form">&#160;</span>'
            + '</div>';
        }
        return '<div class="paradigm-cell" data-parse="' + escAttr(key) + '">'
          + cellBadges[i]
          + '<span class="paradigm-form">' + escHtml(form) + '</span>'
          + '</div>';
      }).join('');
      return '<div class="paradigm-col">' + head + cells + '</div>';
    }).join('');
    var visual = '<div class="paradigm-visual" aria-hidden="true">'
      + section
      + '<div class="paradigm-body">' + gutter + '<div class="paradigm-grid">' + cols + '</div></div>'
      + '</div>';
    var cls = ('card-paradigm ' + (type || '')).trim();
    return '<div class="' + cls + '" style="--rows:' + rows.length + '">' + srTable + visual + '</div>';
  }

  // Marker grids: cells stored under a non-finite / degree marker prefix
  // (pap.nom.sg.masc, ger.gen.sg, superl.voc.sg.masc, …). The main rows×cols
  // never address them, so without this they exist only for form-matching.
  // Render each marker present as its own labelled section, declined like a
  // nominal grid.
  var MARKER_GRIDS = ['pap', 'fap', 'gerundive', 'ger', 'comp', 'superl'];
  var MARKER_ROW_ORDER = ['nom', 'voc', 'gen', 'dat', 'acc', 'abl', 'loc'];
  var MARKER_COL_ORDER = ['sg.masc', 'sg.fem', 'sg.neut', 'pl.masc', 'pl.fem', 'pl.neut', 'sg', 'pl'];

  function renderMarkerGrids(p, markers) {
    if (!p || !p.cells) return '';
    var out = '';
    (markers || MARKER_GRIDS).forEach(function (marker) {
      var prefix = marker + '.';
      var colsSeen = Object.create(null);
      var any = false;
      Object.keys(p.cells).forEach(function (k) {
        if (k.indexOf(prefix) !== 0) return;
        any = true;
        colsSeen[k.slice(prefix.length).split('.').slice(1).join('.')] = true;
      });
      if (!any) return;
      var cols = MARKER_COL_ORDER.filter(function (c) { return colsSeen[c]; });
      if (!cols.length) return;
      var pseudo = { rows: MARKER_ROW_ORDER, cols: cols, cells: p.cells };
      var groups = splitColumnsByGroup(cols, 'adj');
      var solo = groups.length === 1;
      var m = PARSE_TOKEN_MAP[marker];
      var label = '<p class="card-ppp-label">'
        + (m && m.note ? noteBtn(m.note, m.label) : escHtml(marker))
        + '</p>';
      out += '<div class="card-paradigms card-ppp-paradigms">' + label
        + groups.map(function (g) { return renderSection(pseudo, g, 'adj', solo, prefix); }).join('\n')
        + '</div>';
    });
    return out;
  }

  // Verb cards: one tab per group of forms, in A&G's order (§§ 154–158) — the
  // finite moods, then the verb's noun and adjective forms. Only groups the
  // card has forms for get a tab. Tabs always show the grammars' abbreviation
  // (one row on a phone); the full name is the tab's tooltip / accessible name
  // and heads its panel, linked to the grammar note. applyFormTabs() opens the
  // tab holding the tapped form and marks every tab that holds it.
  var VERB_FORM_TABS = [
    { id: 'ind', abbr: 'Ind', full: 'Indicative', note: 'ind' },
    { id: 'subj', abbr: 'Subj', full: 'Subjunctive', note: 'subj' },
    { id: 'imp', abbr: 'Imp', full: 'Imperative', note: 'imp' },
    { id: 'inf', abbr: 'Inf', full: 'Infinitive', note: 'inf' },
    { id: 'part', abbr: 'Part', full: 'Participles' },
    { id: 'ger', abbr: 'Ger', full: 'Gerund' },
    { id: 'gdv', abbr: 'Gdv', full: 'Gerundive' },
  ];
  var PERSON_ROW = /^[123](?:sg|pl)$/;
  var INF_ROWS = ['pres', 'perf', 'fut'];
  var INF_COLS = ['act', 'pass'];

  function paradigmBlock(sections, extraClass) {
    return sections ? '<div class="card-paradigms' + (extraClass ? ' ' + extraClass : '') + '">' + sections + '</div>' : '';
  }

  // Finite forms of one mood: the card's tense.mood.voice columns for it,
  // active and passive as separate labelled grids.
  function renderMoodPanel(p, mood) {
    var cols = p.cols.filter(function (c) { return c.split('.')[1] === mood; });
    if (!cols.length) return '';
    var pseudo = { rows: p.rows.filter(function (r) { return PERSON_ROW.test(r); }), cols: cols, cells: p.cells };
    // Column heads name the tense only: the tab already names the mood.
    var groups = splitColumnsByGroup(cols, 'verb').map(function (g) {
      return Object.assign({}, g, { subCols: g.subCols.map(function (sc) {
        return { orig: sc.orig, sub: sc.sub.split('.').filter(function (a) { return a !== mood; }).join('.') };
      }) });
    });
    var solo = groups.length === 1;
    return paradigmBlock(groups.map(function (g) { return renderSection(pseudo, g, 'verb', solo); }).join('\n'));
  }

  // Infinitives (inf.tense.voice): tenses down, voices across.
  function renderInfinitivePanel(p) {
    var has = function (r, c) { return p.cells['inf.' + r + '.' + c] != null; };
    var rows = INF_ROWS.filter(function (r) { return INF_COLS.some(function (c) { return has(r, c); }); });
    if (!rows.length) return '';
    var cols = INF_COLS.filter(function (c) { return rows.some(function (r) { return has(r, c); }); });
    var group = { groupKey: null, category: null, subCols: cols.map(function (c) { return { orig: c, sub: c }; }) };
    return paradigmBlock(renderSection({ rows: rows, cols: cols, cells: p.cells }, group, 'verb', true, 'inf.'));
  }

  function renderPppGrid(card) {
    var ppp = card.ppp_paradigm;
    if (!(ppp && ppp.rows && ppp.cols && ppp.cells)) return '';
    var m = PARSE_TOKEN_MAP.ppp;
    var label = '<p class="card-ppp-label">' + (m && m.note ? noteBtn(m.note, m.label) : escHtml(ppp.label || 'ppp')) + '</p>';
    var groups = splitColumnsByGroup(ppp.cols, 'ppp');
    return paradigmBlock(label + groups.map(function (g) { return renderSection(ppp, g, 'ppp', false); }).join('\n'), 'card-ppp-paradigms');
  }

  // The panel's full-name heading. The gerund and gerundive grids carry their
  // own (linked) label already.
  function formPanelTitle(t) {
    if (t.id === 'ger' || t.id === 'gdv') return '';
    var m = t.note && PARSE_TOKEN_MAP[t.note];
    return '<p class="card-ppp-label form-panel-title">'
      + (m && m.note ? noteBtn(m.note, t.full) : escHtml(t.full)) + '</p>';
  }

  function renderVerbPanels(card) {
    var p = card.paradigm;
    return VERB_FORM_TABS.map(function (t) {
      var html = t.id === 'inf' ? renderInfinitivePanel(p)
        : t.id === 'part' ? renderMarkerGrids(p, ['pap', 'fap']) + renderPppGrid(card)
        : t.id === 'ger' ? renderMarkerGrids(p, ['ger'])
        : t.id === 'gdv' ? renderMarkerGrids(p, ['gerundive'])
        : renderMoodPanel(p, t.id);
      return { tab: t, html: html && formPanelTitle(t) + html };
    }).filter(function (x) { return x.html; });
  }

  function renderVerbParadigm(card) {
    var panels = renderVerbPanels(card);
    if (!panels.length) return '';
    if (panels.length === 1) return panels[0].html;
    var tabs = panels.map(function (x, i) {
      return '<button class="form-tab" type="button" role="tab" id="form-tab-' + x.tab.id + '"' +
        ' aria-controls="form-panel-' + x.tab.id + '" aria-selected="' + (i === 0) + '"' +
        ' tabindex="' + (i === 0 ? '0' : '-1') + '" data-form-tab="' + x.tab.id + '"' +
        ' title="' + escAttr(x.tab.full) + '" aria-label="' + escAttr(x.tab.full) + '" data-full="' + escAttr(x.tab.full) + '">' +
        '<span class="form-tab-label">' + escHtml(x.tab.abbr) + '</span></button>';
    }).join('');
    var bodies = panels.map(function (x, i) {
      return '<div class="form-panel" role="tabpanel" id="form-panel-' + x.tab.id + '"' +
        ' aria-labelledby="form-tab-' + x.tab.id + '" data-form-panel="' + x.tab.id + '"' +
        (i === 0 ? '' : ' hidden') + '>' + x.html + '</div>';
    }).join('');
    return '<div class="form-tabs" role="tablist" aria-label="Forms of the verb">' + tabs + '</div>' + bodies;
  }

  function renderParadigm(card) {
    var out = '';
    var p = card.paradigm;
    if (p && p.rows && p.cols && p.cells && (p.type || card.pos) === 'verb') return renderVerbParadigm(card);
    if (p && p.rows && p.cols && p.cells) {
      var type = p.type || card.pos || '';
      var groups = splitColumnsByGroup(p.cols, type);
      var solo = groups.length === 1;
      out += '<div class="card-paradigms">' + groups.map(function (g) {
        return renderSection(p, g, type, solo);
      }).join('\n') + '</div>';
      out += renderMarkerGrids(p);
    }
    var ppp = card.ppp_paradigm;
    if (ppp && ppp.rows && ppp.cols && ppp.cells) {
      var label = ppp.label ? '<p class="card-ppp-label">' + escHtml(ppp.label) + '</p>' : '';
      var groups2 = splitColumnsByGroup(ppp.cols, 'ppp');
      out += '<div class="card-paradigms card-ppp-paradigms">' + label +
        groups2.map(function (g) { return renderSection(ppp, g, 'ppp', false); }).join('\n') +
        '</div>';
    }
    return out;
  }

  function renderHeadLine(card) {
    if (card.pos === 'verb' && Array.isArray(card.principal_parts) && card.principal_parts.length === 4) {
      var slots = card.principal_parts.map(function (pp, i) {
        return noteBtn(PRINCIPAL_PART_NOTES[i], pp);
      });
      return '<p class="card-principal">' + slots.join(', ') + '</p>';
    }
    return card.head ? '<p class="card-principal">' + escHtml(card.head) + '</p>' : '';
  }

  // ── pronunciation line
  // Respelling + IPA in the reader's chosen system (site/reader/latin-pron.js)
  // of the form that was tapped, as this tab's reading — or of the headword
  // when the card was opened without a token, or the form's vowel lengths
  // aren't known. Lengths come from the card's `macrons` (attested forms,
  // macronized: site/latin/macronize_forms.py). The page's
  // <meta name="latin-pronunciation"> gives the book's default (front matter
  // `latin_pronunciation`); a toggle here overrides it, remembered per book
  // (the meta's data-scope).
  var PRON_KEY = 'rr.latinPronunciation.';
  var PRON_LABEL = { classical: 'Classical', ecclesiastical: 'Ecclesiastical' };

  function pronMeta() {
    return document.querySelector('meta[name="latin-pronunciation"]');
  }
  function pronSystem() {
    var meta = pronMeta();
    try {
      var saved = localStorage.getItem(PRON_KEY + ((meta && meta.getAttribute('data-scope')) || 'site'));
      if (PRON_LABEL[saved]) return saved;
    } catch (e) { /* storage blocked: fall through to the book default */ }
    var dflt = meta && meta.getAttribute('content');
    return PRON_LABEL[dflt] ? dflt : 'classical';
  }
  function setPronSystem(system) {
    var meta = pronMeta();
    try {
      localStorage.setItem(PRON_KEY + ((meta && meta.getAttribute('data-scope')) || 'site'), system);
    } catch (e) { /* not remembered; still applies to this page */ }
    var lines = document.querySelectorAll('.card-pron');
    for (var i = 0; i < lines.length; i++) fillPronLine(lines[i], system);
  }

  // macronize_forms.py's key: unmarked, lowercase, i/u for j/v, letters only.
  function pronKey(s) {
    return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/j/g, 'i').replace(/v/g, 'u').replace(/[^a-z]/g, '');
  }

  // The tapped form's macronized spelling(s) under this reading:
  // [{ word, parses }] — more than one when lengths differ by a parse the text
  // leaves open (rosa nom. / rosā abl.). Empty when the card doesn't know it.
  function pronForms(card, surface, parses) {
    var m = card && card.macrons && card.macrons[pronKey(surface)];
    if (!m) return [];
    if (typeof m === 'string') return [{ word: m }];
    var byForm = {};
    var order = [];
    (parses.length ? parses : Object.keys(m)).forEach(function (p) {
      var f = m[p];
      if (!f) return;
      if (!byForm[f]) { byForm[f] = []; order.push(f); }
      byForm[f].push(p);
    });
    return order.map(function (f) { return { word: f, parses: byForm[f] }; });
  }

  // Short labels telling variants apart: the parses' leading atom (case, or
  // person/mood), past any participle prefix — "nom., acc." vs "abl.".
  function pronLabels(groups) {
    var short = groups.map(function (g) {
      var seen = [];
      g.parses.forEach(function (p) {
        var a = p.split('.').filter(function (x) { return !/^(ppp|pap|fap|gerundive|comp|superl)$/.test(x); })[0];
        if (a && seen.indexOf(a) < 0) seen.push(a);
      });
      return seen.map(function (a) { return a + '.'; }).join(', ');
    });
    var distinct = short.every(function (l, i) { return short.indexOf(l) === i; });
    return distinct ? short : groups.map(function (g) { return g.parses.join(', '); });
  }

  // Show a form as the text spells it: its capital and j, the macrons added.
  function pronDisplay(word, spelling) {
    var w = window.LatinPron.mergeSpelling(word, spelling);
    return spelling && /^[A-Z]/.test(spelling) ? w.charAt(0).toUpperCase() + w.slice(1) : w;
  }

  function fillPronLine(el, system) {
    var forms = [];
    try { forms = JSON.parse(el.getAttribute('data-forms') || '[]'); } catch (e) { /* keep empty */ }
    var spelling = el.getAttribute('data-spell') || '';
    // Variants that sound alike in this system (Ecclesiastical has no vowel
    // length) collapse into one line.
    var groups = [];
    forms.forEach(function (f) {
      var p = window.LatinPron && window.LatinPron.pronounce(f.word, system, spelling);
      if (!p) return;
      var same = groups.filter(function (g) { return g.p.ipa === p.ipa; })[0];
      if (same) same.parses = same.parses.concat(f.parses || []);
      else groups.push({ word: f.word, p: p, parses: (f.parses || []).slice() });
    });
    var labels = groups.length > 1 ? pronLabels(groups) : [];
    var items = groups.map(function (g, i) {
      return '<span class="card-pron-item">' +
        '<span class="card-pron-form" lang="la">' + escHtml(pronDisplay(g.word, spelling)) + '</span>' +
        (labels[i] ? ' <span class="card-pron-label">' + escHtml(labels[i]) + '</span>' : '') +
        ' <span class="card-pron-respell">' + escHtml(g.p.respell) + '</span>' +
        ' <span class="card-pron-ipa">' + escHtml(g.p.ipa) + '</span></span>';
    });
    el.hidden = !items.length;
    el.querySelector('.card-pron-words').innerHTML = items.join('');
    var btns = el.querySelectorAll('.card-pron-system');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', String(btns[i].getAttribute('data-system') === system));
    }
  }

  // Renders the line for the headword, empty; applyCardState (which follows
  // every card render) retargets it at the tapped form and fills it.
  function renderPronLine(card) {
    if (!window.LatinPron || !card) return '';
    var word = card.headword || card.lemma;
    var system = pronSystem();
    if (!window.LatinPron.pronounce(word, system, card.lemma)) return '';
    var toggle = window.LatinPron.SYSTEMS.map(function (s) {
      return '<button class="card-pron-system" type="button" data-system="' + s + '" aria-pressed="' +
        (s === system) + '">' + PRON_LABEL[s] + '</button>';
    }).join('');
    return '<div class="card-pron" data-forms="' + escAttr(JSON.stringify([{ word: word }])) +
      '" data-spell="' + escAttr(card.lemma || '') + '">' +
      '<span class="card-pron-words"></span>' +
      '<span class="card-pron-controls">' +
      '<span class="card-pron-toggle" role="group" aria-label="Pronunciation">' + toggle + '</span>' +
      (document.getElementById('note-guide-pronunciation')
        ? '<button class="card-pron-help" type="button" data-guide-note="note-guide-pronunciation">guide</button>'
        : '') +
      '</span></div>';
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.card-pron-system');
    if (!b) return;
    e.preventDefault();
    setPronSystem(b.getAttribute('data-system'));
  });

  function renderPosChip(pos) {
    if (!pos) return '';
    var note = POS_NOTE[pos];
    if (!note) return '<span class="card-pos">' + escHtml(pos) + '</span>';
    return '<button class="card-pos note-link" type="button" popovertarget="note-' + escAttr(note) + '">' + escHtml(pos) + '</button>';
  }

  // ── reading tabs (multi-lemma and homographs)
  // A token's surface can be a form of several dictionary words (soft
  // disambiguation: every reading stays available). One opens by default; the
  // rest are tabs. See Plans/homograph-support-plan.md.

  // Default tab precedence: the learner's own last choice for this stack
  // entry → an editor's selection → Stanza's ✓ → the parser's selection →
  // first candidate. selectedBy is internal: it orders, it is never shown.
  function chooseInitialTab(available, entry) {
    var has = function (id) {
      return id && available.some(function (m) { return m.lemma === id; });
    };
    if (has(entry.activeLemma)) return entry.activeLemma;
    if (entry.selectedBy === 'editor' && has(entry.selectedLemma)) return entry.selectedLemma;
    if (has(entry.stanzaLemma)) return entry.stanzaLemma;
    if (has(entry.selectedLemma)) return entry.selectedLemma;
    return available[0].lemma;
  }

  var FREQ_RANK = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, I: 6, M: 6, N: 6 };

  // Tab order: the default first; then readings with the default's part of
  // speech; then commoner words (DICTLINE freq); then homograph number; then
  // data order. Computed here, not stored, so tuning never touches data.
  function orderReadings(available, defaultLemma, lex) {
    var def = lex[defaultLemma] || {};
    return available
      .map(function (m, i) {
        var c = lex[m.lemma] || {};
        return {
          m: m,
          key: [
            m.lemma === defaultLemma ? 0 : 1,
            c.pos === def.pos ? 0 : 1,
            c.freq in FREQ_RANK ? FREQ_RANK[c.freq] : 3.5,
            c.homograph || 0,
            i,
          ],
        };
      })
      .sort(function (a, b) {
        for (var k = 0; k < a.key.length; k++) {
          if (a.key[k] !== b.key[k]) return a.key[k] - b.key[k];
        }
        return 0;
      })
      .map(function (x) { return x.m; });
  }

  var SUPERSCRIPT = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
  var POS_ABBR = {
    noun: 'n.', verb: 'v.', adj: 'adj.', adv: 'adv.', pron: 'pron.', prep: 'prep.',
    conj: 'conj.', interj: 'interj.', num: 'num.', enclitic: 'encl.',
  };

  // Display name for a card: macronized headword (lēvis) + homograph number.
  function displayHeadword(lemmaId, card) {
    var name = (card && (card.headword || card.lemma)) || lemmaId;
    var n = card && card.homograph;
    return n ? name + String(n).split('').map(function (d) { return SUPERSCRIPT[+d]; }).join('') : name;
  }

  function firstGloss(card) {
    var g = card && Array.isArray(card.glosses) && card.glosses[0];
    if (!g) return '';
    return g.length > 32 ? g.slice(0, 31).replace(/[\s,;]+\S*$/, '') + '…' : g;
  }

  // Label parts for one reading tab (pure; also used by tests).
  function tabLabel(lemmaId, card) {
    var pos = card && card.pos;
    return {
      name: displayHeadword(lemmaId, card),
      pos: POS_ABBR[pos] || pos || '',
      gloss: firstGloss(card),
    };
  }

  function renderTabBar(ordered, activeLemma, defaultLemma, lex) {
    if (ordered.length <= 1) return '';
    var idx = 0;
    var tabs = ordered.map(function (m, i) {
      var isActive = m.lemma === activeLemma;
      if (isActive) idx = i;
      var l = tabLabel(m.lemma, lex[m.lemma]);
      var cls = 'card-tab' + (isActive ? ' active' : '') + (m.lemma === defaultLemma ? ' default' : '');
      var mark = m.lemma === defaultLemma ? '<span class="card-tab-check" aria-hidden="true">✓</span>' : '';
      var a11y = l.name + (l.pos ? ', ' + l.pos : '') + (l.gloss ? ': ' + l.gloss : '');
      return '<button class="' + cls + '" type="button" role="tab" aria-selected="' + isActive +
        '" tabindex="' + (isActive ? '0' : '-1') + '" aria-label="' + escAttr(a11y) +
        '" data-tab-lemma="' + escAttr(m.lemma) + '">' +
        '<span class="card-tab-name">' + escHtml(l.name) + mark +
        (l.pos ? ' <span class="card-tab-pos">' + escHtml(l.pos) + '</span>' : '') + '</span>' +
        (l.gloss ? '<span class="card-tab-gloss">' + escHtml(l.gloss) + '</span>' : '') +
        '</button>';
    }).join('');
    // Three or more readings: ‹ n / N › stepping; on phones only the active
    // tab shows between the arrows (CSS), on wider screens the strip scrolls.
    var step = ordered.length > 2
      ? '<button class="card-tab-step" type="button" data-tab-step="-1" aria-label="Previous reading">‹</button>' +
        '<span class="card-tab-count" aria-live="polite">' + (idx + 1) + ' / ' + ordered.length + '</span>' +
        '<button class="card-tab-step" type="button" data-tab-step="1" aria-label="Next reading">›</button>'
      : '';
    return '<div class="card-tab-bar' + (step ? ' stepped' : '') + '">' +
      (step ? '<span class="card-tab-nav">' + step + '</span>' : '') +
      '<div class="card-tab-strip" role="tablist" aria-label="Readings of this word">' + tabs + '</div>' +
      '</div>';
  }

  // Homographs of this card that are not readings of the tapped token
  // (levis "light" when the form can't be lēvis "smooth"): a quiet
  // cross-reference — the learning payoff without a false reading.
  var homographIndex = null;
  function unmarked(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }
  function homographsOf(lemmaId, lex) {
    if (!homographIndex) {
      homographIndex = {};
      Object.keys(lex).forEach(function (id) {
        var c = lex[id];
        if (!c || !c.lemma) return;
        var k = unmarked(c.lemma) + '|' + c.pos;
        (homographIndex[k] = homographIndex[k] || []).push(id);
      });
    }
    var card = lex[lemmaId];
    if (!card) return [];
    return (homographIndex[unmarked(card.lemma) + '|' + card.pos] || [])
      .filter(function (id) { return id !== lemmaId; });
  }

  function renderSeeAlso(lemmaId, available, lex) {
    var shown = {};
    available.forEach(function (m) { shown[m.lemma] = true; });
    var others = homographsOf(lemmaId, lex).filter(function (id) { return !shown[id]; });
    if (!others.length) return '';
    return '<p class="card-see-also">Not to be confused with: ' + others.map(function (id) {
      var l = tabLabel(id, lex[id]);
      return '<button class="card-see-also-link" type="button" data-lemma="' + escAttr(id) + '">' +
        escHtml(l.name) + '</button>' + (l.gloss ? ' (' + escHtml(l.gloss) + ')' : '');
    }).join(', ') + '</p>';
  }

  function availableReadings(entry, lex) {
    return parseMatches(entry.matches).filter(function (m) { return lex[m.lemma]; });
  }

  function renderCardBody(body, entry, lex) {
    var available = availableReadings(entry, lex);
    if (!available.length) return;
    var defaultLemma = chooseInitialTab(available, Object.assign({}, entry, { activeLemma: '' }));
    var activeLemma = chooseInitialTab(available, entry);
    var ordered = orderReadings(available, defaultLemma, lex);
    body.innerHTML = renderTabBar(ordered, activeLemma, defaultLemma, lex) +
      '<div class="card-content">' + renderCardInnerHtml(activeLemma, lex[activeLemma], available, lex) + '</div>';
    applyCardState(body.querySelector('.card-content'), activeLemma, available, defaultLemma, entry.surface || '', entry.formTab);
  }

  // Returns the innerHTML of the content area for one lemma.
  function renderCardInnerHtml(lemma, card, available, lex) {
    var label = displayHeadword(lemma, card);
    var head = renderHeadLine(card);
    var pos = renderPosChip(card.pos);
    var paradigm = renderParadigm(card);
    var glosses = Array.isArray(card.glosses) && card.glosses.length
      ? '<p class="card-glosses">' + card.glosses.map(escHtml).join('; ') + '</p>'
      : '';
    var notes = card.notes ? '<p class="card-notes">' + escHtml(card.notes) + '</p>' : '';
    var seeAlso = lex ? renderSeeAlso(lemma, available || [], lex) : '';
    return '<header class="card-head">' +
      '<h3 class="card-lemma">' + escHtml(label) + ' ' + pos + '</h3>' +
      '<div class="card-parse" aria-live="polite"></div>' +
      head +
      renderPronLine(card) +
      '</header>' +
      glosses +
      seeAlso +
      paradigm + notes;
  }

  function switchReading(newLemma, keepFocusOnStep) {
    var host = document.getElementById('popover-host');
    var curEntry = stackPos >= 0 ? stack[stackPos] : null;
    if (!host || !curEntry || curEntry.type !== 'card' || !lexiconCache || !lexiconCache[newLemma]) return;
    curEntry.activeLemma = newLemma;   // persist for back/forward navigation
    curEntry.formTab = '';             // a new reading opens on its own form
    var tabs = Array.prototype.slice.call(host.querySelectorAll('.card-tab'));
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-tab-lemma') === newLemma;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
      t.setAttribute('tabindex', on ? '0' : '-1');
      if (on && !keepFocusOnStep) t.focus();
      if (on && t.scrollIntoView) t.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
    var count = host.querySelector('.card-tab-count');
    if (count) {
      var i = tabs.findIndex(function (t) { return t.classList.contains('active'); });
      count.textContent = (i + 1) + ' / ' + tabs.length;
    }
    var content = host.querySelector('.card-content');
    if (content) {
      var avail = availableReadings(curEntry, lexiconCache);
      var defaultLemma = chooseInitialTab(avail, Object.assign({}, curEntry, { activeLemma: '' }));
      content.innerHTML = renderCardInnerHtml(newLemma, lexiconCache[newLemma], avail, lexiconCache);
      applyCardState(content, newLemma, avail, defaultLemma, curEntry.surface || '');
    }
  }

  // Arrow keys move between reading tabs (roving tabindex).
  document.addEventListener('keydown', function (e) {
    var tab = e.target.closest && e.target.closest('#popover-host .card-tab');
    if (!tab || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End')) return;
    var tabs = Array.prototype.slice.call(document.querySelectorAll('#popover-host .card-tab'));
    var i = tabs.indexOf(tab);
    var j = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1
      : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    e.preventDefault();
    switchReading(tabs[j].getAttribute('data-tab-lemma'), false);
  });

  // The reader's form-tab choice is kept on the card entry, so back/forward
  // and a restored #g= URL reopen it.
  function chooseFormTab(tab, focus) {
    var scope = tab.closest('.card-content');
    if (!scope) return;
    var id = tab.getAttribute('data-form-tab');
    selectFormTab(scope, id, focus);
    var curEntry = stackPos >= 0 ? stack[stackPos] : null;
    if (curEntry && curEntry.type === 'card') curEntry.formTab = id;
  }

  // Arrow keys move between form tabs (roving tabindex).
  document.addEventListener('keydown', function (e) {
    var tab = e.target.closest && e.target.closest('#popover-host .form-tab');
    if (!tab || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End')) return;
    var tabs = Array.prototype.slice.call(tab.parentNode.querySelectorAll('.form-tab'));
    var i = tabs.indexOf(tab);
    var j = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1
      : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    e.preventDefault();
    chooseFormTab(tabs[j], true);
  });

  // Test hook: pure tab logic, exercised by site/generator/__tests__.
  window.__readingRoomCardTabs = {
    chooseInitialTab: chooseInitialTab, orderReadings: orderReadings,
    tabLabel: tabLabel, displayHeadword: displayHeadword, homographsOf: homographsOf,
    resetHomographIndex: function () { homographIndex = null; },
    pronKey: pronKey, pronForms: pronForms, pronLabels: pronLabels,
  };

  // ── grammar loading
  // Grammar drives parse-chip labels and pos-note slugs. We try, in order:
  //   1. window.__readingRoomData.grammar  (iOS bundle injection)
  //   2. window.__readingRoomGrammar       (script-tag injection on file://)
  //   3. fetch('assets/latin-grammar.json') (web)
  // Result is applied in place via applyGrammar(); the hardcoded fallback
  // covers any failure mode silently.
  var grammarApplied = false;

  function tryApplyAmbientGrammar() {
    if (grammarApplied) return true;
    var rd = window.__readingRoomData;
    if (rd && rd.grammar) {
      applyGrammar(rd.grammar);
      grammarApplied = true;
      return true;
    }
    if (window.__readingRoomGrammar) {
      applyGrammar(window.__readingRoomGrammar);
      grammarApplied = true;
      return true;
    }
    return false;
  }

  function loadGrammarViaScript(prefix) {
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = prefix + 'assets/latin-grammar.js';
      s.onload = function () { tryApplyAmbientGrammar(); resolve(); };
      s.onerror = function () { resolve(); };  // silent fallback
      document.head.appendChild(s);
    });
  }

  function loadGrammar() {
    if (tryApplyAmbientGrammar()) return Promise.resolve();
    var meta = document.querySelector('meta[name="asset-prefix"]');
    var prefix = meta ? meta.content : './';
    if (window.location.protocol === 'file:') {
      return loadGrammarViaScript(prefix);
    }
    return fetch(prefix + 'assets/latin-grammar.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) { if (data) { applyGrammar(data); grammarApplied = true; } })
      .catch(function () { /* silent fallback */ });
  }

  // ── lexicon loading
  var lexiconCache = null;
  var lexiconLoading = null;

  // WKWebView blocks fetch() against file:// URLs (security policy). When the
  // page is served from file://, load lexicon.js via a <script> tag instead —
  // WebKit's native resource loader respects the allowingReadAccessTo grant.
  // On https:// (web), fetch() lexicon.json as normal.
  // Belt-and-suspenders: if the iOS app has been rebuilt with the Swift
  // injection, window.__readingRoomLexicon is already set and we skip both.
  function loadLexiconViaScript(prefix) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = prefix + 'assets/lexicon.js';
      s.onload = function () {
        if (window.__readingRoomLexicon) {
          lexiconCache = window.__readingRoomLexicon;
          lexiconLoading = null;
          resolve(lexiconCache);
        } else {
          reject(new Error('lexicon.js loaded but __readingRoomLexicon not set'));
        }
      };
      s.onerror = function () { reject(new Error('lexicon.js failed to load')); };
      document.head.appendChild(s);
    });
  }

  function loadLexicon() {
    if (lexiconCache) return Promise.resolve(lexiconCache);
    if (window.__readingRoomLexicon) {
      lexiconCache = window.__readingRoomLexicon;
      return Promise.resolve(lexiconCache);
    }
    if (lexiconLoading) return lexiconLoading;
    var meta = document.querySelector('meta[name="asset-prefix"]');
    var prefix = meta ? meta.content : './';
    if (window.location.protocol === 'file:') {
      lexiconLoading = loadLexiconViaScript(prefix);
    } else {
      lexiconLoading = fetch(prefix + 'assets/lexicon.json')
        .then(function (r) { return r.json(); })
        .then(function (data) { lexiconCache = data; lexiconLoading = null; return data; });
    }
    return lexiconLoading;
  }

  // ── reference-notes loading (Reference Grammar sections, rendered in-flow)
  // Language-level artifact, shared across texts. On https we fetch it lazily
  // on the first `ag:`/`ref:` tap; on file:// (iOS) the native layer reads it
  // and injects it. Cache holds the { id -> note } map (doc.notes); the toc
  // (parts → chapters → items) and title are kept alongside for contents
  // entries (window.__readingRoomReferenceToc on iOS).
  var referenceNotesCache = null;
  var referenceNotesLoading = null;
  var referenceToc = null;
  var referenceTitle = 'Reference Grammar';

  function adoptReferenceDoc(notes, toc, title) {
    referenceNotesCache = notes || null;
    if (toc) referenceToc = toc;
    if (title) referenceTitle = title;
    return referenceNotesCache;
  }

  function getReferenceNotes() {
    if (referenceNotesCache) return Promise.resolve(referenceNotesCache);
    var rd = window.__readingRoomData;
    if (rd && rd.referenceNotes) { referenceNotesCache = rd.referenceNotes; return Promise.resolve(referenceNotesCache); }
    if (window.__readingRoomReferenceNotes) {
      return Promise.resolve(adoptReferenceDoc(window.__readingRoomReferenceNotes, window.__readingRoomReferenceToc, window.__readingRoomReferenceTitle));
    }
    if (referenceNotesLoading) return referenceNotesLoading;
    if (window.location.protocol === 'file:') {
      // iOS (WKWebView can't fetch file://). Ask the native layer to read the
      // synced asset and inject window.__readingRoomReferenceNotes on demand,
      // then resolve. No data is loaded until the first ag: tap.
      var mh = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.refnotes;
      if (!mh) return Promise.resolve(null);
      referenceNotesLoading = new Promise(function (resolve) {
        window.__resolveReferenceNotes = function () {
          adoptReferenceDoc(window.__readingRoomReferenceNotes, window.__readingRoomReferenceToc, window.__readingRoomReferenceTitle);
          referenceNotesLoading = null;
          resolve(referenceNotesCache);
        };
        mh.postMessage({});
      });
      return referenceNotesLoading;
    }
    var meta = document.querySelector('meta[name="asset-prefix"]');
    var prefix = meta ? meta.content : './';
    referenceNotesLoading = fetch(prefix + 'assets/latin-reference-notes.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (doc) {
        referenceNotesLoading = null;
        return doc ? adoptReferenceDoc(doc.notes, doc.toc, doc.title) : null;
      })
      .catch(function () { referenceNotesLoading = null; return null; });
    return referenceNotesLoading;
  }

  function referenceNotesAvailable() {
    return Boolean(referenceNotesCache
      || window.__readingRoomReferenceNotes
      || (window.__readingRoomData && window.__readingRoomData.referenceNotes));
  }

  // ── data-matches parsing
  function parseMatches(s) {
    if (!s) return [];
    return s.split(';').map(function (chunk) {
      var i = chunk.indexOf(':');
      if (i < 0) return { lemma: chunk.trim(), parses: [] };
      return {
        lemma: chunk.slice(0, i).trim(),
        parses: chunk.slice(i + 1).split(',').map(function (s) { return s.trim(); }).filter(Boolean),
      };
    }).filter(function (m) { return m.lemma; });
  }

  function cssEscape(s) { return (window.CSS && CSS.escape) ? CSS.escape(s) : s; }

  // ── card-state application (highlight paradigm cells + render chips + stanza)
  // surface: the actual Latin token text (e.g. "mutatas"), shown in the parse slot.
  // Verb form tabs: mark every tab whose panel holds the tapped form (a form
  // can sit in more than one: amāre is the present infinitive and the
  // passive imperative), then open the reader's last choice for this card,
  // else the first tab holding the form, else the first tab.
  function applyFormTabs(scope, formTab) {
    var tabs = Array.prototype.slice.call(scope.querySelectorAll('.form-tab'));
    if (!tabs.length) return;
    var holding = [];
    tabs.forEach(function (t) {
      var id = t.getAttribute('data-form-tab');
      var panel = scope.querySelector('[data-form-panel="' + id + '"]');
      var has = !!(panel && panel.querySelector('.active-form'));
      t.classList.toggle('has-form', has);
      var label = t.getAttribute('data-full');
      t.setAttribute('aria-label', has ? label + ', has the tapped form' : label);
      if (has) holding.push(id);
    });
    var ids = tabs.map(function (t) { return t.getAttribute('data-form-tab'); });
    selectFormTab(scope, ids.indexOf(formTab) !== -1 ? formTab : (holding[0] || ids[0]));
  }

  function selectFormTab(scope, id, focus) {
    scope.querySelectorAll('.form-tab').forEach(function (t) {
      var on = t.getAttribute('data-form-tab') === id;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
      t.setAttribute('tabindex', on ? '0' : '-1');
      if (on && focus) t.focus();
    });
    scope.querySelectorAll('[data-form-panel]').forEach(function (p) {
      p.hidden = p.getAttribute('data-form-panel') !== id;
    });
  }

  function applyCardState(scope, lemma, matches, stanzaLemma, surface, formTab) {
    var thisMatch = matches.filter(function (m) { return m.lemma === lemma; })[0];
    var thisParses = thisMatch ? thisMatch.parses : [];
    scope.querySelectorAll('.paradigm-cell.active-form').forEach(function (el) {
      el.classList.remove('active-form');
    });
    thisParses.forEach(function (p) {
      var cell = scope.querySelector('.paradigm-cell[data-parse="' + cssEscape(p) + '"]');
      // Morpheus appends a gender suffix to noun codes (e.g. nom.sg.fem) but
      // noun paradigms store cells without gender (nom.sg). Fall back by
      // stripping the trailing .masc/.fem/.neut component if no exact match.
      if (!cell) {
        var stripped = p.replace(/\.(masc|fem|neut)$/, '');
        if (stripped !== p) cell = scope.querySelector('.paradigm-cell[data-parse="' + cssEscape(stripped) + '"]');
      }
      // Latin vocative = nominative in most declensions; if voc.* has no cell,
      // fall back to the corresponding nom.* cell.
      if (!cell && p.indexOf('voc.') === 0) {
        var nomFallback = 'nom.' + p.slice(4);
        cell = scope.querySelector('.paradigm-cell[data-parse="' + cssEscape(nomFallback) + '"]');
        if (!cell) {
          var nomStripped = nomFallback.replace(/\.(masc|fem|neut)$/, '');
          if (nomStripped !== nomFallback) cell = scope.querySelector('.paradigm-cell[data-parse="' + cssEscape(nomStripped) + '"]');
        }
      }
      if (cell) cell.classList.add('active-form');
    });
    applyFormTabs(scope, formTab);
    var pron = scope.querySelector('.card-pron');
    if (pron) {
      var forms = surface ? pronForms(lexiconCache && lexiconCache[lemma], surface, thisParses) : [];
      if (forms.length) {
        pron.setAttribute('data-forms', JSON.stringify(forms));
        pron.setAttribute('data-spell', surface);
      }
      fillPronLine(pron, pronSystem());
    }
    var slot = scope.querySelector('.card-parse');
    if (slot) {
      slot.innerHTML = (surface && thisParses.length > 0)
        ? '<span class="card-parse-surface">' + escHtml(surface) + '</span>'
        : '';
    }
    var heading = scope.querySelector('.card-lemma');
    if (heading) {
      heading.classList.toggle('stanza-confirmed', !!(stanzaLemma && stanzaLemma === lemma));
    }
  }

  // ── navigation stack
  var stack = [];
  var stackPos = -1;

  // Per-step scroll memory (Plans/latin-grammar-note-navigation-plan.md,
  // Phase B). saveScroll() records the outgoing entry's scroll before we leave
  // it; applyScroll() restores it right after content is in the DOM but before
  // paint (no flash). New entries have no saved offset → start at the top.
  function popoverBody() {
    var h = document.getElementById('popover-host');
    return h && h.querySelector('.popover-body');
  }
  // `_shown` marks an entry whose content is in the body: while an async entry
  // (card, ref, toc) is still loading, the body's scroll is the placeholder's,
  // and recording it would wipe the offset a restored #g= step carries.
  function saveScroll() {
    if (stackPos < 0 || !stack[stackPos]._shown) return;
    var body = popoverBody();
    if (body) stack[stackPos].scrollTop = body.scrollTop;
  }
  function applyScroll(entry, body) {
    if (body) body.scrollTop = entry.scrollTop || 0;
    entry._shown = true;
  }

  // ── Reference Grammar entries
  function refLabel(id) {
    var note = referenceNotesCache && referenceNotesCache[id];
    if (!note) return /^\d+$/.test(id) ? '§' + id : id;
    var short = note.label || ('§' + id);
    return note.title && note.title !== short ? short + ' · ' + note.title : short;
  }
  function tocChapters() {
    var out = [];
    (referenceToc || []).forEach(function (p) {
      p.chapters.forEach(function (c) { out.push({ chapter: c, part: p }); });
    });
    return out;
  }
  function findChapter(id) {
    return tocChapters().filter(function (x) { return x.chapter.id === id; })[0] || null;
  }
  function tocLabel(id) {
    if (!id) return referenceTitle;
    var hit = findChapter(id);
    return hit ? hit.chapter.label : id;
  }
  function itemIds(items, out) {
    (items || []).forEach(function (it) {
      if (typeof it === 'string') out.push(it); else itemIds(it.items, out);
    });
    return out;
  }
  function rangeOf(chapter) {
    var nums = itemIds(chapter.items, []).filter(function (id) { return /^\d+$/.test(id); });
    if (!nums.length) return '';
    return nums.length === 1 ? '§ ' + nums[0] : '§§ ' + nums[0] + '–' + nums[nums.length - 1];
  }
  function refLink(id, text, seq) {
    return '<a class="ag-link" data-ag="' + escAttr(id) + '"' + (seq ? ' data-ag-seq' : '') + '>' + escHtml(text) + '</a>';
  }
  function tocLink(id, text) {
    return '<a class="ag-link" data-ag-toc="' + escAttr(id) + '">' + escHtml(text) + '</a>';
  }

  // A section, followed by its place in the document: previous · chapter · next
  // in reading order. Previous/next turn the page — they replace the current
  // section rather than adding a step — so reading on doesn't grow the trail.
  function renderRefBody(id) {
    var note = referenceNotesCache[id];
    var seq = [];
    var prev = note.prev && referenceNotesCache[note.prev];
    var next = note.next && referenceNotesCache[note.next];
    seq.push(prev ? '<span class="ref-seq-prev">' + refLink(note.prev, '‹ ' + (prev.label || note.prev), true) + '</span>' : '<span></span>');
    var hit = note.chapter && findChapter(note.chapter);
    seq.push(hit ? '<span class="ref-seq-chapter">' + tocLink(note.chapter, hit.chapter.label) + '</span>' : '<span></span>');
    seq.push(next ? '<span class="ref-seq-next">' + refLink(note.next, (next.label || note.next) + ' ›', true) + '</span>' : '<span></span>');
    return note.html + '<nav class="ref-seq" aria-label="Reference Grammar">' + seq.join('') + '</nav>';
  }

  // Contents ('' → parts and chapters) or one chapter (its groups and sections).
  function renderTocBody(id) {
    if (!id) {
      return '<h3 class="note-title">' + escHtml(referenceTitle) + '</h3>' +
        referenceToc.map(function (p) {
          return '<h4 class="ref-toc-part">' + escHtml(p.label) + '</h4><ul class="ref-toc">' +
            p.chapters.map(function (c) {
              var r = rangeOf(c);
              return '<li>' + tocLink(c.id, c.label) + (r ? ' <span class="ag-range">' + escHtml(r) + '</span>' : '') + '</li>';
            }).join('') + '</ul>';
        }).join('');
    }
    var hit = findChapter(id);
    if (!hit) return '<p class="card-loading">Chapter unavailable.</p>';
    function items(list) {
      var secs = [], out = [];
      function flush() {
        if (secs.length) out.push('<li class="ref-toc-secs">' + secs.join(' ') + '</li>');
        secs = [];
      }
      list.forEach(function (it) {
        if (typeof it === 'string') {
          var n = referenceNotesCache[it];
          secs.push(refLink(it, /^\d+$/.test(it) ? '§' + it : ((n && n.title) || it)));
        } else {
          flush();
          out.push('<li class="ref-toc-group"><span class="ref-toc-group-label">' + escHtml(it.label) + '</span><ul class="ref-toc">' + items(it.items) + '</ul></li>');
        }
      });
      flush();
      return out.join('');
    }
    return '<h3 class="note-title">' + escHtml(hit.chapter.label) + '</h3>' +
      '<p class="ref-toc-where">' + escHtml(hit.part.label) + ' · ' + tocLink('', 'All chapters') + '</p>' +
      '<ul class="ref-toc">' + items(hit.chapter.items) + '</ul>';
  }

  function renderHost() {
    var host = document.getElementById('popover-host');
    if (!host) return;
    if (stackPos < 0 || !stack.length) {
      try { host.hidePopover(); } catch (_) {}
      return;
    }
    var entry = stack[stackPos];
    var body = host.querySelector('.popover-body');
    entry._shown = false;
    // Open before filling: a closed popover is display:none, and a scrollTop
    // set on it is dropped — so a restored #g= step would reopen at the top.
    if (!host.matches(':popover-open')) {
      try { host.showPopover(); } catch (_) {}
    }

    if (entry.type === 'card') {
      body.className = 'popover-body card-popover';
      if (lexiconCache) {
        renderCardBody(body, entry, lexiconCache);
        applyScroll(entry, body);
      } else {
        body.innerHTML = '<p class="card-loading">Loading…</p>';
        loadLexicon().then(function (lex) {
          if (stackPos >= 0 && stack[stackPos] === entry) {
            renderCardBody(body, entry, lex);
            applyScroll(entry, body);
          }
        });
      }
    } else if (entry.type === 'ref' || entry.type === 'toc') {
      body.className = 'popover-body note-popover ref-popover';
      var ready = referenceNotesCache && (entry.type === 'ref' ? referenceNotesCache[entry.id] : referenceToc);
      if (ready) {
        entry.label = entry.type === 'ref' ? refLabel(entry.id) : tocLabel(entry.id);
        body.innerHTML = entry.type === 'ref' ? renderRefBody(entry.id) : renderTocBody(entry.id);
        applyScroll(entry, body);
      } else if (!entry._loadTriggered) {
        entry._loadTriggered = true;
        body.innerHTML = '<p class="card-loading">Loading…</p>';
        getReferenceNotes().then(function () {
          if (stackPos >= 0 && stack[stackPos] === entry) renderHost();
        });
      } else {
        body.innerHTML = '<p class="card-loading">Section unavailable.</p>';
      }
    } else {
      var source = document.getElementById(entry.sourceId);
      if (!source) { try { host.hidePopover(); } catch (_) {} return; }
      body.className = 'popover-body note-popover';
      body.innerHTML = source.innerHTML;
      applyScroll(entry, body);
    }

    renderChrome(host);
    persistState();   // keep the shareable #g= URL current as the user navigates
  }

  // ── trail navigation (Plans/latin-text-centered-reader-plan.md, D3)
  // The stack is the trail of steps taken from the text. The breadcrumb jumps
  // back to any step (its first step stands in for a Home button); Prev/Next
  // step along it. No redo past a new branch — descending by a link drops the
  // old forward steps.

  // The page the popover sits on, for the breadcrumb's first crumb (closes).
  function pageCrumbLabel() {
    var h1 = document.querySelector('header.piece h1');
    var t = h1 ? h1.textContent.trim() : document.title;
    return t.length > 28 ? t.slice(0, 26).trim() + '…' : t;
  }

  // Title of an entry as shown in the breadcrumb. For a card, the surface form
  // that was tapped (the instance in the text), not the dictionary lemma — the
  // lemma still heads the card body.
  function crumbTitle(entry) {
    if (entry.type === 'card' && entry.surface) return entry.surface;
    return entry.label || '';
  }

  // Crumbs: the page (closes the popover), then each step taken to reach the
  // current entry — e.g. the page › a word › Preposition › §219. A crumb jumps
  // back to that step. When the trail is long the middle collapses to "…".
  // On narrow screens the crumbs share the header row with ‹ › and ×, so only
  // the last two items show (× already closes; an enabled ‹ says there's more).
  function renderCrumbs(host) {
    var nav = host.querySelector('.popover-crumbs');
    if (!nav) return;
    var items = [{ html: '<button type="button" class="popover-crumb" data-crumb-close>' + escHtml(pageCrumbLabel()) + '</button>' }];
    for (var i = 0; i < stackPos; i++) {
      items.push({ html: '<button type="button" class="popover-crumb" data-crumb-pos="' + i + '">' + escHtml(crumbTitle(stack[i])) + '</button>' });
    }
    var cur = stack[stackPos];
    var isForm = cur.type === 'card' && cur.surface;
    items.push({ html: '<span class="popover-crumb-here' + (isForm ? ' is-form' : '') + '" aria-current="location">' + escHtml(crumbTitle(cur)) + '</span>' });
    var narrow = window.matchMedia && window.matchMedia('(max-width: 600px)').matches;
    var gap = { html: '<span class="popover-crumb-gap" aria-hidden="true">…</span>' };
    if (narrow) items = items.slice(-2);
    else if (!narrow && items.length > 5) items = [items[0], gap].concat(items.slice(-3));
    nav.innerHTML = items.map(function (it) { return it.html; }).join('<span class="popover-crumb-sep" aria-hidden="true">›</span>');
    nav.scrollLeft = nav.scrollWidth;   // keep the current step in view
  }

  function renderChrome(host) {
    var prev = host.querySelector('.popover-prev');
    var next = host.querySelector('.popover-next');
    if (prev) prev.disabled = stackPos <= 0;
    if (next) next.disabled = stackPos >= stack.length - 1;
    renderCrumbs(host);
  }

  function pushEntry(entry) {
    var current = stackPos >= 0 ? stack[stackPos] : null;
    var isDupe = current && current.type === entry.type &&
      (entry.type === 'card'
        ? current.lemma === entry.lemma && current.matches === entry.matches
        : entry.type === 'ref' || entry.type === 'toc'
          ? current.id === entry.id
          : current.sourceId === entry.sourceId);
    if (isDupe) {
      var h = document.getElementById('popover-host');
      if (h && !h.matches(':popover-open')) renderHost();
      return;
    }
    saveScroll(); // remember where we were in the entry we're descending from
    stack = stack.slice(0, stackPos + 1);
    stack.push(entry);
    stackPos = stack.length - 1;
    renderHost();
  }

  function navigateTo(pos) {
    if (pos < 0 || pos >= stack.length || pos === stackPos) return;
    saveScroll(); // remember scroll in the entry we're leaving
    stackPos = pos;
    renderHost();
  }

  // ── Shareable reading-state restore (navigation plan, Phases C + D)
  // The popover ReadingState (stack + context + per-step scroll) is encoded in
  // the URL hash (#g=…) so it is shareable/bookmarkable, survives a hard
  // reload, and restores the open popover on Back. The outer document scroll
  // is restored by the browser.

  function serializeState() {
    if (stackPos < 0 || !stack.length) return null;
    saveScroll();
    var clean = stack.map(function (e) {
      return {
        type: e.type, label: e.label,
        scrollTop: e.scrollTop || 0,
        lemma: e.lemma, matches: e.matches, stanzaLemma: e.stanzaLemma,
        selectedLemma: e.selectedLemma, selectedBy: e.selectedBy,
        surface: e.surface, activeLemma: e.activeLemma, formTab: e.formTab,
        id: e.id, sourceId: e.sourceId,
      };
    });
    return { stack: clean, pos: stackPos };
  }

  // UTF-8-safe base64url (labels carry §, macrons, etc.).
  function encodeState(s) {
    try {
      return btoa(unescape(encodeURIComponent(JSON.stringify(s))))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (_) { return ''; }
  }
  function decodeState(str) {
    try {
      var b = str.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(b))));
    } catch (_) { return null; }
  }

  function persistState() {
    try {
      var s = serializeState();
      var base = location.pathname + location.search;
      var enc = s ? encodeState(s) : '';
      var url = enc ? (base + '#g=' + enc) : base;   // strip hash when closed
      history.replaceState(history.state, '', url);
    } catch (_) { /* history unavailable — degrade silently */ }
  }

  function restoreState(s) {
    if (!s || !s.stack || !s.stack.length) return;
    if (stackPos >= 0) return;          // already populated (e.g. bfcache)
    stack = s.stack.slice();
    stackPos = (typeof s.pos === 'number' && s.pos >= 0 && s.pos < stack.length)
      ? s.pos : stack.length - 1;
    renderHost();
  }

  function maybeRestore() {
    if (stackPos >= 0) return;
    var m = (location.hash || '').match(/(?:^#|&)g=([^&]+)/);
    if (m) {
      var s = decodeState(m[1]);
      if (s) restoreState(s);
    }
  }

  // Open a Reference Grammar section (`ref`) or contents (`toc`) in-flow. When
  // the reference notes can't be reached in this context (file:// without the
  // native bridge), fall back to navigating the supplied href.
  function canLoadReference() {
    var hasBridge = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.refnotes;
    return referenceNotesAvailable() || hasBridge || window.location.protocol !== 'file:';
  }
  function openRef(id, fallbackHref) {
    if (!id) return;
    if (!canLoadReference()) { if (fallbackHref) window.location.href = fallbackHref; return; }
    pushEntry({ type: 'ref', id: id, label: refLabel(id) });
  }
  function openToc(id, fallbackHref) {
    if (!canLoadReference()) { if (fallbackHref) window.location.href = fallbackHref; return; }
    pushEntry({ type: 'toc', id: id || '', label: tocLabel(id || '') });
  }
  function openNoteSource(sourceId) {
    var source = document.getElementById(sourceId);
    if (!source || !source.classList.contains('note-popover-source')) return false;
    pushEntry({ type: 'note', sourceId: sourceId, label: source.dataset.label || sourceId });
    return true;
  }

  // The Study button (page header) starts a fresh stack at the hub.
  function openStudy() {
    var host = document.getElementById('popover-host');
    if (!host || !document.getElementById('note-guide-study')) return false;
    stack = []; stackPos = -1;
    return openNoteSource('note-guide-study');
  }
  window.readingRoom = window.readingRoom || {};
  window.readingRoom.openStudy = openStudy;

  // ── click handler
  document.addEventListener('click', function (e) {
    var host = document.getElementById('popover-host');
    if (!host) return;

    if (e.target.closest('.study-button')) { e.preventDefault(); openStudy(); return; }
    var crumb = e.target.closest('#popover-host .popover-crumb');
    if (crumb) {
      e.preventDefault();
      if (crumb.hasAttribute('data-crumb-close')) { try { host.hidePopover(); } catch (_) {} return; }
      navigateTo(Number(crumb.getAttribute('data-crumb-pos')));
      return;
    }
    // Prev/Next step back and forward along the whole trail.
    if (e.target.closest('.popover-prev')) {
      e.preventDefault();
      if (stackPos > 0) navigateTo(stackPos - 1);
      return;
    }
    if (e.target.closest('.popover-next')) {
      e.preventDefault();
      if (stackPos < stack.length - 1) navigateTo(stackPos + 1);
      return;
    }

    // Reference Grammar links — in the popover or in the text — open in-flow.
    var tocEl = e.target.closest('[data-ag-toc]');
    if (tocEl) { e.preventDefault(); openToc(tocEl.getAttribute('data-ag-toc'), tocEl.getAttribute('href')); return; }
    var agEl = e.target.closest('[data-ag]');
    if (agEl && agEl.hasAttribute('data-ag-seq') && stackPos >= 0 && stack[stackPos].type === 'ref') {
      e.preventDefault();
      var id = agEl.getAttribute('data-ag');
      stack[stackPos] = { type: 'ref', id: id, label: refLabel(id) };
      stack = stack.slice(0, stackPos + 1);   // the old forward history pointed at the old page
      renderHost();
      return;
    }
    if (agEl) { e.preventDefault(); openRef(agEl.getAttribute('data-ag'), agEl.getAttribute('href')); return; }

    // A card's pronunciation "guide" button opens the in-page guide entry
    // (Latin books carry it; elsewhere the button isn't rendered).
    var guideEl = e.target.closest('#popover-host [data-guide-note]');
    if (guideEl && document.getElementById(guideEl.getAttribute('data-guide-note'))) {
      e.preventDefault();
      openNoteSource(guideEl.getAttribute('data-guide-note'));
      return;
    }

    // In-entry anchors (e.g. the pronunciation guide's own cross-links) scroll
    // the popover body, not the page.
    var hashEl = e.target.closest('#popover-host .popover-body a[href^="#"]');
    if (hashEl) {
      e.preventDefault();
      var pb = popoverBody();
      var tgt = pb && pb.querySelector('[id="' + cssEscape(hashEl.getAttribute('href').slice(1)) + '"]');
      if (tgt) pb.scrollTop += tgt.getBoundingClientRect().top - pb.getBoundingClientRect().top;
      return;
    }

    var anchor = e.target.closest('#popover-host a[href]');
    if (anchor) { try { host.hidePopover(); } catch (_) {} return; }

    // Reading tabs: a tab click or a ‹ › step switches the reading in place
    // (does not push a new stack entry).
    var stepBtn = e.target.closest('.card-tab-bar button[data-tab-step]');
    var tabBtn = e.target.closest('.card-tab-bar button[data-tab-lemma]');
    if (stepBtn || tabBtn) {
      e.preventDefault();
      var tabs = Array.prototype.slice.call(host.querySelectorAll('.card-tab'));
      var newLemma = tabBtn ? tabBtn.getAttribute('data-tab-lemma') : null;
      if (stepBtn) {
        var cur = tabs.findIndex(function (t) { return t.classList.contains('active'); });
        var next = (cur + Number(stepBtn.getAttribute('data-tab-step')) + tabs.length) % tabs.length;
        newLemma = tabs[next].getAttribute('data-tab-lemma');
      }
      switchReading(newLemma, !!stepBtn);
      return;
    }

    // Verb form tabs (Indicative, Subjunctive, …): switch the panel in place.
    var formTabBtn = e.target.closest('#popover-host .form-tab');
    if (formTabBtn) {
      e.preventDefault();
      chooseFormTab(formTabBtn, false);
      return;
    }

    // Buttons with data-lemma → card
    var btn = e.target.closest('button[data-lemma]');
    if (btn) {
      e.preventDefault();
      var lemma = btn.getAttribute('data-lemma');
      // A card opened by id alone (e.g. a homograph cross-reference) has no
      // token readings: the lemma itself is its one reading.
      var matches = btn.getAttribute('data-matches') || lemma;
      var stanzaLemma = btn.getAttribute('data-stanza') || '';
      var selectedLemma = btn.getAttribute('data-selected-lemma') || '';
      var selectedBy = btn.getAttribute('data-selected-by') || '';
      // Label the stack entry with the reading that will open by default.
      if (lexiconCache) {
        var avail0 = availableReadings({ matches: matches }, lexiconCache);
        if (avail0.length) {
          lemma = chooseInitialTab(avail0, { stanzaLemma: stanzaLemma, selectedLemma: selectedLemma, selectedBy: selectedBy });
        }
      }
      var cardData = lexiconCache && lexiconCache[lemma];
      var label = cardData ? displayHeadword(lemma, cardData) : lemma;
      // Capture the surface form (the Latin token text) so the parse slot
      // can show which exact form was tapped alongside its grammatical analysis.
      var surface = btn.classList.contains('latin-token') ? (btn.textContent || '').trim() : '';
      pushEntry({ type: 'card', lemma: lemma, label: label, matches: matches, stanzaLemma: stanzaLemma,
        selectedLemma: selectedLemma, selectedBy: selectedBy, surface: surface });
      return;
    }

    // Buttons with popovertarget pointing at a note source → note
    var noteBtn2 = e.target.closest('button[popovertarget]');
    if (!noteBtn2) return;
    if (noteBtn2.getAttribute('popovertargetaction') === 'hide') return;
    var targetId = noteBtn2.getAttribute('popovertarget');
    if (!targetId) return;
    var source = document.getElementById(targetId);
    if (!source || !source.classList.contains('note-popover-source')) return;
    e.preventDefault();
    openNoteSource(targetId);
  });

  // ── inline glosses
  // <span class="inline-gloss" data-gloss="…"> (a modernised spelling, an expanded
  // abbreviation) shows its gloss in a CSS bubble — on hover where there is
  // hover, on tap everywhere. One open at a time; any other tap closes it.
  // Independent of #popover-host, so it works on pages with no popovers.
  var openGloss = null;
  document.addEventListener('click', function (e) {
    var g = e.target.closest && e.target.closest('.inline-gloss');
    if (g && g.closest('.note-link, a')) g = null;   // the link wins
    if (openGloss && openGloss !== g) openGloss.classList.remove('inline-gloss-open');
    if (g) g.classList.toggle('inline-gloss-open');
    openGloss = g && g.classList.contains('inline-gloss-open') ? g : null;
  });

  // Reset stack on popover close (× / light dismiss), and clear the stashed
  // reading-state so a later Back doesn't reopen it.
  document.addEventListener('beforetoggle', function (e) {
    if (e.target.id !== 'popover-host') return;
    if (e.newState === 'closed') {
      stack = []; stackPos = -1;
      persistState();   // serializes null → clears stash
    }
  }, true);

  // Restore the popover after a Back navigation returns to this page, from a
  // shared/bookmarked #g= link, or when the hash is pasted in.
  window.addEventListener('pageshow', maybeRestore);
  window.addEventListener('popstate', maybeRestore);
  window.addEventListener('hashchange', maybeRestore);

  // Pre-fetch the lexicon and grammar as soon as the page has Latin tokens,
  // so the first click is instant rather than waiting for a cold network
  // round-trip. Grammar try-apply is cheap and may resolve synchronously when
  // an iOS bundle has injected the data — call it unconditionally.
  tryApplyAmbientGrammar();
  document.addEventListener('DOMContentLoaded', function () {
    if (document.querySelector('button.latin-token, button[popovertarget^="note-"]')) {
      loadGrammar();
      if (document.querySelector('button.latin-token')) loadLexicon();
    }
  });
  // Initial-load restore (covers Back that does a full reload; pageshow also
  // fires, but the restoreState guard makes a double call harmless).
  maybeRestore();

})();

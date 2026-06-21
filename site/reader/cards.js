// Popover controller for Latin lexicon cards and grammar notes.
//
// Card content is loaded lazily from assets/lexicon.json on first popover
// open and rendered into the single persistent `<aside id="popover-host">`.
// Grammar notes are pre-rendered as hidden `<aside class="note-popover-source">`
// elements in the page DOM (see build.js).
//
// Stack model: one per open-cycle, cleared on light-dismiss.
//   Card entry: { type:'card', lemma, label, matches, stanzaLemma }
//   Note entry: { type:'note', sourceId, label }
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
    ind: { label: 'indicative', note: 'indicative' },
    subj: { label: 'subjunctive', note: 'subjunctive' },
    imp: { label: 'imperative', note: 'imperative' },
    act: { label: 'active', note: 'active' },
    pass: { label: 'passive', note: 'passive' },
    inf: { label: 'infinitive', note: 'infinitive' },
    ppp: { label: 'perfect passive participle', note: 'perfect-passive-participle' },
    sup: { label: 'supine', note: 'supine' },
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
  function renderSection(p, sectionGroup, type, soloSection) {
    // PPP cells are stored with a 'ppp.' prefix on the row so their keys match
    // parse codes directly (e.g. ppp.acc.pl.fem).
    var rowPrefix = type === 'ppp' ? 'ppp.' : '';
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

  function renderParadigm(card) {
    var out = '';
    var p = card.paradigm;
    if (p && p.rows && p.cols && p.cells) {
      var type = p.type || card.pos || '';
      var groups = splitColumnsByGroup(p.cols, type);
      var solo = groups.length === 1;
      out += '<div class="card-paradigms">' + groups.map(function (g) {
        return renderSection(p, g, type, solo);
      }).join('\n') + '</div>';
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

  function renderPosChip(pos) {
    if (!pos) return '';
    var note = POS_NOTE[pos];
    if (!note) return '<span class="card-pos">' + escHtml(pos) + '</span>';
    return '<button class="card-pos note-link" type="button" popovertarget="note-' + escAttr(note) + '">' + escHtml(pos) + '</button>';
  }

  // ── tab bar (multi-lemma)
  function chooseInitialTab(available, stanzaLemma, activeLemma) {
    // Restore the tab the user last selected for this stack entry.
    if (activeLemma) {
      for (var i = 0; i < available.length; i++) {
        if (available[i].lemma === activeLemma) return available[i].lemma;
      }
    }
    // Default to stanza-preferred, then first candidate.
    if (stanzaLemma) {
      for (var i = 0; i < available.length; i++) {
        if (available[i].lemma === stanzaLemma) return available[i].lemma;
      }
    }
    return available[0].lemma;
  }

  function renderTabBar(available, activeLemma, stanzaLemma) {
    if (available.length <= 1) return '';
    return '<div class="card-tab-bar">' +
      available.map(function (m) {
        var isActive = m.lemma === activeLemma;
        var isStanza = stanzaLemma && m.lemma === stanzaLemma;
        var displayName = (lexiconCache && lexiconCache[m.lemma] && lexiconCache[m.lemma].lemma) || m.lemma;
        var cls = 'card-tab' + (isActive ? ' active' : '') + (isStanza ? ' stanza-pref' : '');
        var mark = isStanza ? ' <span class="card-tab-check">✓</span>' : '';
        return '<button class="' + cls + '" type="button" data-tab-lemma="' + escAttr(m.lemma) + '">' +
               escHtml(displayName) + mark + '</button>';
      }).join('') +
      '</div>';
  }

  function renderCardBody(body, entry, lex) {
    var allMatches = parseMatches(entry.matches);
    var available = allMatches.filter(function (m) { return lex[m.lemma]; });
    if (!available.length) return;
    var stanza = entry.stanzaLemma || '';
    var activeLemma = chooseInitialTab(available, stanza, entry.activeLemma || '');
    body.innerHTML = renderTabBar(available, activeLemma, stanza) +
      '<div class="card-content">' + renderCardInnerHtml(activeLemma, lex[activeLemma]) + '</div>';
    applyCardState(body.querySelector('.card-content'), activeLemma, available, stanza, entry.surface || '');
  }

  // Returns the innerHTML of the content area for one lemma.
  function renderCardInnerHtml(lemma, card) {
    var label = card.lemma || lemma;
    var head = renderHeadLine(card);
    var pos = renderPosChip(card.pos);
    var paradigm = renderParadigm(card);
    var glosses = Array.isArray(card.glosses) && card.glosses.length
      ? '<p class="card-glosses">' + card.glosses.map(escHtml).join('; ') + '</p>'
      : '';
    var notes = card.notes ? '<p class="card-notes">' + escHtml(card.notes) + '</p>' : '';
    return '<header class="card-head">' +
      '<h3 class="card-lemma">' + escHtml(label) + ' ' + pos + '</h3>' +
      '<div class="card-parse" aria-live="polite"></div>' +
      head +
      '</header>' +
      glosses +
      paradigm + notes;
  }

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

  // ── reference-notes loading (A&G sections, rendered in-flow in the popover)
  // Language-level artifact, shared across texts. On https we fetch it lazily
  // on the first `ag:` tap; on file:// (iOS) the native note layer serves these
  // (Phase 2) — until then openRef() falls back to navigation, so we never
  // fetch here. Cache holds the { id -> note } map (doc.notes).
  var referenceNotesCache = null;
  var referenceNotesLoading = null;

  function getReferenceNotes() {
    if (referenceNotesCache) return Promise.resolve(referenceNotesCache);
    var rd = window.__readingRoomData;
    if (rd && rd.referenceNotes) { referenceNotesCache = rd.referenceNotes; return Promise.resolve(referenceNotesCache); }
    if (window.__readingRoomReferenceNotes) { referenceNotesCache = window.__readingRoomReferenceNotes; return Promise.resolve(referenceNotesCache); }
    if (referenceNotesLoading) return referenceNotesLoading;
    if (window.location.protocol === 'file:') {
      // iOS (WKWebView can't fetch file://). Ask the native layer to read the
      // synced asset and inject window.__readingRoomReferenceNotes on demand,
      // then resolve. No data is loaded until the first ag: tap.
      var mh = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.refnotes;
      if (!mh) return Promise.resolve(null);
      referenceNotesLoading = new Promise(function (resolve) {
        window.__resolveReferenceNotes = function () {
          referenceNotesCache = window.__readingRoomReferenceNotes || null;
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
      .then(function (doc) { referenceNotesCache = doc ? doc.notes : null; referenceNotesLoading = null; return referenceNotesCache; })
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
  function applyCardState(scope, lemma, matches, stanzaLemma, surface) {
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
  function saveScroll() {
    if (stackPos < 0) return;
    var body = popoverBody();
    if (body) stack[stackPos].scrollTop = body.scrollTop;
  }
  function applyScroll(entry, body) {
    if (body) body.scrollTop = entry.scrollTop || 0;
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
    } else if (entry.type === 'ref') {
      body.className = 'popover-body note-popover ref-popover';
      var note = referenceNotesCache && referenceNotesCache[entry.id];
      if (note) {
        if (note.title) entry.label = '§' + entry.id + ' · ' + note.title;
        body.innerHTML = note.html;
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
      if (!source) return;
      body.className = 'popover-body note-popover';
      body.innerHTML = source.innerHTML;
      applyScroll(entry, body);
    }

    renderChrome(host);
    if (!host.matches(':popover-open')) {
      try { host.showPopover(); } catch (_) {}
    }
  }

  // ── context model (Plans/latin-grammar-note-navigation-plan.md, Phase A)
  // The flat stack is grouped into contexts: a contiguous run of same-family
  // entries. Two families today (n-ary by construction): 'local' (card/note,
  // the note context opened from the text) and 'grammar' (A&G ref sections).
  // Prev/Next move within the current context (disabled at its ends); Up jumps
  // to the previous context; Home jumps to the origin. No Down / no redo —
  // descend by following a link.
  function familyOf(entry) { return entry.type === 'ref' ? 'grammar' : 'local'; }

  function ctxLo(pos) {
    var c = stack[pos].ctx, lo = pos;
    while (lo > 0 && stack[lo - 1].ctx === c) lo--;
    return lo;
  }
  function ctxHi(pos) {
    var c = stack[pos].ctx, hi = pos;
    while (hi < stack.length - 1 && stack[hi + 1].ctx === c) hi++;
    return hi;
  }
  function upTargetPos() {
    if (stackPos < 0) return -1;
    var lo = ctxLo(stackPos);
    return lo > 0 ? lo - 1 : -1;        // last entry of the previous context
  }
  function homeTargetPos() { return stackPos > 0 ? 0 : -1; }

  var CONTEXT_LABEL = { grammar: 'Grammar' };

  function renderChrome(host) {
    var entry = stack[stackPos];
    var lo = ctxLo(stackPos), hi = ctxHi(stackPos);

    var prev = host.querySelector('.popover-prev');
    var next = host.querySelector('.popover-next');
    if (prev) prev.disabled = stackPos <= lo;
    if (next) next.disabled = stackPos >= hi;

    var homeBtn = host.querySelector('.popover-home');
    if (homeBtn) homeBtn.hidden = homeTargetPos() < 0;

    var upTarget = upTargetPos();
    var upBtn = host.querySelector('.popover-up');
    var upLabel = host.querySelector('.popover-up-label');
    if (upBtn) upBtn.hidden = upTarget < 0;
    if (upLabel) upLabel.textContent = upTarget >= 0 ? (stack[upTarget].label || '') : '';

    var ctxEl = host.querySelector('.popover-context');
    if (ctxEl) {
      var chipName = CONTEXT_LABEL[entry.family];
      var chip = chipName ? '<span class="popover-ctx-chip">' + escHtml(chipName) + '</span> ' : '';
      ctxEl.innerHTML = chip + '<span class="popover-ctx-title">' + escHtml(entry.label || '') + '</span>';
    }
  }

  function pushEntry(entry) {
    var current = stackPos >= 0 ? stack[stackPos] : null;
    var isDupe = current && current.type === entry.type &&
      (entry.type === 'card'
        ? current.lemma === entry.lemma && current.matches === entry.matches
        : entry.type === 'ref'
          ? current.id === entry.id
          : current.sourceId === entry.sourceId);
    if (isDupe) {
      var h = document.getElementById('popover-host');
      if (h && !h.matches(':popover-open')) renderHost();
      return;
    }
    saveScroll(); // remember where we were in the entry we're descending from
    // Assign the entry's family + context index. A new context begins whenever
    // the family changes from the current top (e.g. local note → grammar).
    entry.family = familyOf(entry);
    entry.ctx = current ? (entry.family !== current.family ? current.ctx + 1 : current.ctx) : 0;
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

  // ── A1-light reading-state restore (navigation plan, Phase C)
  // The "Open full section ↗" excursion is a real page navigation that loses
  // the popover. We stash the popover ReadingState in history.state before
  // leaving, so pressing Back restores the open popover (stack + context +
  // per-step scroll). The outer document scroll is restored by the browser.
  var navigatingAway = false;

  function serializeState() {
    if (stackPos < 0 || !stack.length) return null;
    saveScroll();
    var clean = stack.map(function (e) {
      return {
        type: e.type, label: e.label, ctx: e.ctx, family: e.family,
        scrollTop: e.scrollTop || 0,
        lemma: e.lemma, matches: e.matches, stanzaLemma: e.stanzaLemma,
        surface: e.surface, activeLemma: e.activeLemma,
        id: e.id, sourceId: e.sourceId,
      };
    });
    return { stack: clean, pos: stackPos };
  }

  function persistState() {
    try {
      var hs = history.state || {};
      var next = {};
      for (var k in hs) { if (k !== '__popover') next[k] = hs[k]; }
      var s = serializeState();
      if (s) next.__popover = s;        // omitted entirely when nothing is open
      history.replaceState(next, '');
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
    var s = history.state && history.state.__popover;
    if (s) restoreState(s);
  }

  // Open an A&G section in-flow (push a `ref` entry). When the reference notes
  // aren't reachable in this context (iOS file:// before Phase 2), fall back to
  // navigating the supplied href so the link still works.
  function openRef(id, fallbackHref) {
    if (!id) return;
    // file:// (iOS): only fall back to navigation when there's no way to load
    // the reference notes in-flow (no cache, no injected global, no native
    // bridge). With the bridge present, push the ref entry and let it load.
    var hasBridge = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.refnotes;
    if (!referenceNotesAvailable() && !hasBridge && window.location.protocol === 'file:') {
      if (fallbackHref) window.location.href = fallbackHref;
      return;
    }
    var label = '§' + id;
    var note = referenceNotesCache && referenceNotesCache[id];
    if (note && note.title) label = '§' + id + ' · ' + note.title;
    pushEntry({ type: 'ref', id: id, label: label });
  }

  // ── click handler
  document.addEventListener('click', function (e) {
    var host = document.getElementById('popover-host');
    if (!host) return;

    if (e.target.closest('.popover-home')) { e.preventDefault(); navigateTo(homeTargetPos()); return; }
    if (e.target.closest('.popover-up')) { e.preventDefault(); navigateTo(upTargetPos()); return; }
    // Prev/Next stay within the current context (disabled at its ends).
    if (e.target.closest('.popover-prev')) {
      e.preventDefault();
      if (stackPos > ctxLo(stackPos)) navigateTo(stackPos - 1);
      return;
    }
    if (e.target.closest('.popover-next')) {
      e.preventDefault();
      if (stackPos < ctxHi(stackPos)) navigateTo(stackPos + 1);
      return;
    }

    // In-flow A&G reference: open §N inside the stack instead of navigating.
    var agEl = e.target.closest('#popover-host [data-ag]');
    if (agEl) { e.preventDefault(); openRef(agEl.getAttribute('data-ag'), agEl.getAttribute('href')); return; }

    // "Open full section ↗": the deliberate navigate-away to the standalone
    // reference page. data-full is docroot-relative; prepend the asset prefix.
    var fullEl = e.target.closest('#popover-host [data-full]');
    if (fullEl) {
      e.preventDefault();
      var fm = document.querySelector('meta[name="asset-prefix"]');
      var fp = fm ? fm.content : './';
      // Stash the popover state so Back restores it; navigate WITHOUT closing
      // (closing would clear the state). navigatingAway tells the close handler
      // not to wipe history.state if a close event fires during unload.
      navigatingAway = true;
      persistState();
      window.location.href = fp + fullEl.getAttribute('data-full');
      return;
    }

    var anchor = e.target.closest('#popover-host a[href]');
    if (anchor) { try { host.hidePopover(); } catch (_) {} return; }

    // Tab switch within a multi-lemma card (does not push a new stack entry)
    var tabBtn = e.target.closest('.card-tab-bar button[data-tab-lemma]');
    if (tabBtn) {
      e.preventDefault();
      var newLemma = tabBtn.getAttribute('data-tab-lemma');
      var curEntry = stackPos >= 0 ? stack[stackPos] : null;
      if (!curEntry || curEntry.type !== 'card' || !lexiconCache || !lexiconCache[newLemma]) return;
      curEntry.activeLemma = newLemma;   // persist for back/forward navigation
      host.querySelectorAll('.card-tab').forEach(function (t) {
        t.classList.toggle('active', t.getAttribute('data-tab-lemma') === newLemma);
      });
      var content = host.querySelector('.card-content');
      if (content) {
        content.innerHTML = renderCardInnerHtml(newLemma, lexiconCache[newLemma]);
        var avail = parseMatches(curEntry.matches).filter(function (m) { return lexiconCache[m.lemma]; });
        applyCardState(content, newLemma, avail, curEntry.stanzaLemma || '', curEntry.surface || '');
      }
      return;
    }

    // Buttons with data-lemma → card
    var btn = e.target.closest('button[data-lemma]');
    if (btn) {
      e.preventDefault();
      var lemma = btn.getAttribute('data-lemma');
      var matches = btn.getAttribute('data-matches') || '';
      var stanzaLemma = btn.getAttribute('data-stanza') || '';
      var cardData = lexiconCache && lexiconCache[lemma];
      var label = cardData ? (cardData.lemma || lemma) : lemma;
      // Capture the surface form (the Latin token text) so the parse slot
      // can show which exact form was tapped alongside its grammatical analysis.
      var surface = btn.classList.contains('latin-token') ? (btn.textContent || '').trim() : '';
      pushEntry({ type: 'card', lemma: lemma, label: label, matches: matches, stanzaLemma: stanzaLemma, surface: surface });
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
    pushEntry({ type: 'note', sourceId: targetId, label: source.dataset.label || targetId });
  });

  // Reset stack on popover close. A normal close (× / light dismiss) also
  // clears any stashed reading-state so a later Back doesn't reopen it; the
  // escape-hatch close (navigatingAway) keeps the stash for restore.
  document.addEventListener('beforetoggle', function (e) {
    if (e.target.id !== 'popover-host') return;
    if (e.newState === 'closed') {
      stack = []; stackPos = -1;
      if (!navigatingAway) persistState();   // serializes null → clears stash
    }
  }, true);

  // Restore the popover after a Back navigation returns to this page.
  window.addEventListener('pageshow', maybeRestore);
  window.addEventListener('popstate', maybeRestore);

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

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
  function noteBtn(note, label) {
    return '<button class="note-link" type="button" popovertarget="note-' + escAttr(note) + '">' + escHtml(label) + '</button>';
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
      return p.note ? noteBtn(p.note, p.label) : '<span>' + escHtml(p.label) + '</span>';
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
      return p.note ? noteBtn(p.note, p.label) : '<span>' + escHtml(p.label) + '</span>';
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

  // Render one column-grouping (e.g. "active" voice) as a responsive grid of
  // self-describing column blocks instead of a wide table. Each block is one
  // sub-column (a tense·mood, or a case-set) headed by its parse, listing its
  // forms with a compact person/number (or case) badge per form. The grid wraps
  // to the container width so wide verb paradigms no longer need horizontal
  // scroll. Row identity that used to live in a leftmost header column now lives
  // in the per-cell badge.
  function renderSubTable(p, sectionGroup, type, soloSection) {
    // PPP cells are stored with a 'ppp.' prefix on the row so their keys match
    // parse codes directly (e.g. ppp.acc.pl.fem).
    var rowPrefix = type === 'ppp' ? 'ppp.' : '';
    // Canonical row order is preserved from p.rows (1sg…3pl, nom…abl).
    var rows = p.rows.filter(function (r) {
      return sectionGroup.subCols.some(function (sc) { return p.cells[rowPrefix + r + '.' + sc.orig] != null; });
    });
    if (!rows.length) return '';
    // Section label ("Voice: active") above the grid — dropped when the paradigm
    // renders as a single section (soloSection) or there's no group key.
    var section = sectionGroup.groupKey && !soloSection
      ? '<div class="paradigm-section">'
        + (sectionGroup.category
          ? '<span class="paradigm-section-label">' + escHtml(sectionGroup.category) + ':</span> '
          : '')
        + expandParseLinks(sectionGroup.groupKey)
        + '</div>'
      : '';
    var cols = sectionGroup.subCols.map(function (sc) {
      // Skip a sub-column that has no forms in any row for this section.
      var hasAny = rows.some(function (r) { return p.cells[rowPrefix + r + '.' + sc.orig] != null; });
      if (!hasAny) return '';
      var head = sc.sub
        ? '<div class="paradigm-col-head">' + expandParseLinks(sc.sub) + '</div>'
        : '';
      var cells = rows.map(function (r) {
        var key = rowPrefix + r + '.' + sc.orig;
        var form = p.cells[key];
        // Keep a consistent row shape across every column in the section:
        // a column missing this row (e.g. imperative has no 1sg) renders a
        // placeholder that keeps the row badge but has no form, so rows stay
        // aligned across columns. The nbsp gives the empty form the same
        // height as a populated cell.
        if (form == null) {
          return '<div class="paradigm-cell paradigm-cell--empty">'
            + '<span class="paradigm-badge">' + renderCompactRowHeader(r) + '</span>'
            + '<span class="paradigm-form"> </span>'
            + '</div>';
        }
        return '<div class="paradigm-cell" data-parse="' + escAttr(key) + '">'
          + '<span class="paradigm-badge">' + renderCompactRowHeader(r) + '</span>'
          + '<span class="paradigm-form">' + escHtml(form) + '</span>'
          + '</div>';
      }).join('');
      // Lightweight a11y: name the column by its parse (e.g. "present
      // indicative active"), prefixed by the section value when one exists.
      var ariaParts = [sectionGroup.groupKey, sc.sub].filter(Boolean).map(parseToText);
      var aria = ariaParts.join(' ');
      return '<div class="paradigm-col" role="group"'
        + (aria ? ' aria-label="' + escAttr(aria) + '"' : '')
        + '>' + head + cells + '</div>';
    }).join('');
    var cls = ('card-paradigm ' + (type || '')).trim();
    return '<div class="' + cls + '">' + section + '<div class="paradigm-grid">' + cols + '</div></div>';
  }

  function renderParadigm(card) {
    var out = '';
    var p = card.paradigm;
    if (p && p.rows && p.cols && p.cells) {
      var type = p.type || card.pos || '';
      var groups = splitColumnsByGroup(p.cols, type);
      var solo = groups.length === 1;
      out += '<div class="card-paradigms">' + groups.map(function (g) {
        return renderSubTable(p, g, type, solo);
      }).join('\n') + '</div>';
    }
    var ppp = card.ppp_paradigm;
    if (ppp && ppp.rows && ppp.cols && ppp.cells) {
      var label = ppp.label ? '<p class="card-ppp-label">' + escHtml(ppp.label) + '</p>' : '';
      var groups2 = splitColumnsByGroup(ppp.cols, 'ppp');
      out += '<div class="card-paradigms card-ppp-paradigms">' + label +
        groups2.map(function (g) { return renderSubTable(ppp, g, 'ppp', false); }).join('\n') +
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
      } else {
        body.innerHTML = '<p class="card-loading">Loading…</p>';
        loadLexicon().then(function (lex) {
          if (stackPos >= 0 && stack[stackPos] === entry) {
            renderCardBody(body, entry, lex);
          }
        });
      }
    } else {
      var source = document.getElementById(entry.sourceId);
      if (!source) return;
      body.className = 'popover-body note-popover';
      body.innerHTML = source.innerHTML;
    }

    renderBreadcrumb(host);
    updateNavButtons(host);
    if (!host.matches(':popover-open')) {
      try { host.showPopover(); } catch (_) {}
    }
  }

  function renderBreadcrumb(host) {
    var crumbs = host.querySelector('.popover-breadcrumb');
    if (!crumbs) return;
    crumbs.innerHTML = stack.map(function (entry, i) {
      var cls = i === stackPos ? 'popover-crumb current' : 'popover-crumb';
      return '<li class="' + cls + '"><button type="button" data-stack-pos="' + i + '">' +
             escHtml(entry.label) + '</button></li>';
    }).join('');
  }

  function updateNavButtons(host) {
    var prev = host.querySelector('.popover-prev');
    var next = host.querySelector('.popover-next');
    if (prev) prev.disabled = stackPos <= 0;
    if (next) next.disabled = stackPos >= stack.length - 1;
  }

  function pushEntry(entry) {
    var current = stackPos >= 0 ? stack[stackPos] : null;
    var isDupe = current && current.type === entry.type &&
      (entry.type === 'card'
        ? current.lemma === entry.lemma && current.matches === entry.matches
        : current.sourceId === entry.sourceId);
    if (isDupe) {
      var h = document.getElementById('popover-host');
      if (h && !h.matches(':popover-open')) renderHost();
      return;
    }
    stack = stack.slice(0, stackPos + 1);
    stack.push(entry);
    stackPos = stack.length - 1;
    renderHost();
  }

  function navigateTo(pos) {
    if (pos < 0 || pos >= stack.length || pos === stackPos) return;
    stackPos = pos;
    renderHost();
  }

  // ── click handler
  document.addEventListener('click', function (e) {
    var host = document.getElementById('popover-host');
    if (!host) return;

    var crumbBtn = e.target.closest('.popover-breadcrumb button[data-stack-pos]');
    if (crumbBtn) {
      e.preventDefault();
      navigateTo(parseInt(crumbBtn.dataset.stackPos, 10));
      return;
    }
    if (e.target.closest('.popover-prev')) { e.preventDefault(); navigateTo(stackPos - 1); return; }
    if (e.target.closest('.popover-next')) { e.preventDefault(); navigateTo(stackPos + 1); return; }

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

  // Reset stack on popover close.
  document.addEventListener('beforetoggle', function (e) {
    if (e.target.id !== 'popover-host') return;
    if (e.newState === 'closed') { stack = []; stackPos = -1; }
  }, true);

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

})();

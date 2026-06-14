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

  // ── parse-code vocabulary (mirrors build.js — both derive from the same data)
  var PARSE_TOKEN_MAP = {
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
  var PERSON_MAP = {
    '1': { label: '1st-person', note: '1st-person' },
    '2': { label: '2nd-person', note: '2nd-person' },
    '3': { label: '3rd-person', note: '3rd-person' },
  };
  var POS_NOTE = {
    noun: 'noun', verb: 'verb', adj: 'adjective', pron: 'pronoun',
    prep: 'preposition', conj: 'conjunction', enclitic: 'enclitic',
  };
  var PRINCIPAL_PART_NOTES = [
    'first-principal-part', 'second-principal-part',
    'third-principal-part', 'fourth-principal-part',
  ];

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
    function group(keyIdx) {
      var out = [], seen = Object.create(null);
      cols.forEach(function (c) {
        var parts = c.split('.');
        var key = parts[keyIdx];
        var subCol = parts.filter(function (_, i) { return i !== keyIdx; }).join('.');
        if (!seen[key]) { seen[key] = { groupKey: key, subCols: [] }; out.push(seen[key]); }
        seen[key].subCols.push({ orig: c, sub: subCol });
      });
      return out;
    }
    if (type === 'verb') return group(1);
    if (type === 'adj' || type === 'pron') return group(0);
    return [{ groupKey: null, subCols: cols.map(function (c) { return { orig: c, sub: c }; }) }];
  }

  function renderSubTable(p, sectionGroup, type, soloSection) {
    var rows = p.rows.filter(function (r) {
      return sectionGroup.subCols.some(function (sc) { return p.cells[r + '.' + sc.orig] != null; });
    });
    if (!rows.length) return '';
    var header = '<tr><th></th>' + sectionGroup.subCols.map(function (sc) {
      return '<th class="col-head">' + (sc.sub ? expandParseLinks(sc.sub) : '') + '</th>';
    }).join('') + '</tr>';
    var body = rows.map(function (r) {
      var cells = sectionGroup.subCols.map(function (sc) {
        var form = p.cells[r + '.' + sc.orig];
        if (form == null) return '<td></td>';
        return '<td data-parse="' + escAttr(sc.orig) + '">' + escHtml(form) + '</td>';
      }).join('');
      return '<tr><th class="row-head">' + renderCompactRowHeader(r) + '</th>' + cells + '</tr>';
    }).join('');
    var caption = sectionGroup.groupKey && !soloSection
      ? '<caption class="paradigm-section">' + expandParseLinks(sectionGroup.groupKey) + '</caption>'
      : '';
    var cls = ('card-paradigm ' + (type || '')).trim();
    return '<table class="' + cls + '">' + caption + header + body + '</table>';
  }

  function renderParadigm(card) {
    var p = card.paradigm;
    if (!p || !p.rows || !p.cols || !p.cells) return '';
    var type = p.type || card.pos || '';
    var groups = splitColumnsByGroup(p.cols, type);
    var solo = groups.length === 1;
    return '<div class="card-paradigms">' + groups.map(function (g) {
      return renderSubTable(p, g, type, solo);
    }).join('\n') + '</div>';
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

  // Returns the innerHTML of a card popover (everything inside <aside>).
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
      head +
      '<div class="card-other-lemmas" aria-live="polite"></div>' +
      '</header>' +
      paradigm + glosses + notes +
      '<div class="card-parse" aria-live="polite"></div>';
  }

  // ── lexicon fetch
  var lexiconCache = null;
  var lexiconLoading = null;

  function loadLexicon() {
    if (lexiconCache) return Promise.resolve(lexiconCache);
    if (lexiconLoading) return lexiconLoading;
    var meta = document.querySelector('meta[name="asset-prefix"]');
    var prefix = meta ? meta.content : './';
    lexiconLoading = fetch(prefix + 'assets/lexicon.json')
      .then(function (r) { return r.json(); })
      .then(function (data) { lexiconCache = data; lexiconLoading = null; return data; });
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
  function applyCardState(scope, lemma, matches, stanzaLemma) {
    var thisMatch = matches.filter(function (m) { return m.lemma === lemma; })[0];
    var thisParses = thisMatch ? thisMatch.parses : [];
    scope.querySelectorAll('td.active-form').forEach(function (el) {
      el.classList.remove('active-form');
    });
    thisParses.forEach(function (p) {
      var cell = scope.querySelector('td[data-parse="' + cssEscape(p) + '"]');
      if (cell) cell.classList.add('active-form');
    });
    var slot = scope.querySelector('.card-parse');
    if (slot) {
      slot.innerHTML = thisParses.length > 0
        ? '<ul class="card-parse-list">' + thisParses.map(function (p) {
            return '<li><span class="card-parse-human">' + expandParseLinks(p) +
                   '</span> <span class="card-parse-code">' + escHtml(p) + '</span></li>';
          }).join('') + '</ul>'
        : '';
    }
    var chipsBox = scope.querySelector('.card-other-lemmas');
    if (chipsBox) {
      var others = matches.filter(function (m) { return m.lemma !== lemma; });
      if (others.length > 0) {
        var matchesStr = matches.map(function (m) {
          return m.lemma + ':' + m.parses.join(',');
        }).join(';');
        chipsBox.innerHTML = '<span class="card-other-lemmas-label">readings: </span>' +
          others.map(function (m) {
            var isStanzaPref = stanzaLemma && m.lemma === stanzaLemma;
            var cls = 'latin-token other-lemma-chip' + (isStanzaPref ? ' stanza-preferred' : '');
            var label = m.lemma + (isStanzaPref ? ' ✓' : '');
            return '<button class="' + cls + '" type="button" data-lemma="' + escAttr(m.lemma) +
                   '" data-matches="' + escAttr(matchesStr) + '">' + escHtml(label) + '</button>';
          }).join('');
      } else {
        chipsBox.innerHTML = '';
      }
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
      if (lexiconCache && lexiconCache[entry.lemma]) {
        body.innerHTML = renderCardInnerHtml(entry.lemma, lexiconCache[entry.lemma]);
        applyCardState(body, entry.lemma, parseMatches(entry.matches), entry.stanzaLemma || '');
      } else {
        body.innerHTML = '<p class="card-loading">Loading…</p>';
        loadLexicon().then(function (lex) {
          var card = lex[entry.lemma];
          if (card && stackPos >= 0 && stack[stackPos] === entry) {
            body.innerHTML = renderCardInnerHtml(entry.lemma, card);
            applyCardState(body, entry.lemma, parseMatches(entry.matches), entry.stanzaLemma || '');
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

    // Buttons with data-lemma → card
    var btn = e.target.closest('button[data-lemma]');
    if (btn) {
      e.preventDefault();
      var lemma = btn.getAttribute('data-lemma');
      var matches = btn.getAttribute('data-matches') || '';
      var stanzaLemma = btn.getAttribute('data-stanza') || '';
      var cardData = lexiconCache && lexiconCache[lemma];
      var label = cardData ? (cardData.lemma || lemma) : lemma;
      pushEntry({ type: 'card', lemma: lemma, label: label, matches: matches, stanzaLemma: stanzaLemma });
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

  // Pre-fetch the lexicon as soon as the page has Latin tokens, so the first
  // click is instant rather than waiting for a cold network round-trip.
  document.addEventListener('DOMContentLoaded', function () {
    if (document.querySelector('button.latin-token')) loadLexicon();
  });

})();

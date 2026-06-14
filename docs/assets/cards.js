// Popover controller. One persistent `<aside id="popover-host" popover>`
// is the only popover element on the page; everything else (cards, notes)
// is a hidden `<aside hidden class="*-source">` whose innerHTML is copied
// into the host's `.popover-body` on demand.
//
// The host has persistent chrome:
//   .popover-chrome
//     .popover-nav: prev / next + breadcrumb of visited entries
//     .popover-close
//   .popover-body: scrollable, swapped on each navigation
//
// A per-session stack records every entry the user has visited within the
// current open-cycle. Light-dismiss (escape, outside click) clears the
// stack; next open starts fresh.
(function () {
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
    enclit: { label: 'enclitic', note: 'enclitic' }
  };
  var PERSON_MAP = {
    '1': { label: '1st-person', note: '1st-person' },
    '2': { label: '2nd-person', note: '2nd-person' },
    '3': { label: '3rd-person', note: '3rd-person' }
  };
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
      if (p.note) {
        return '<button class="note-link" type="button" popovertarget="note-' + p.note + '">' + p.label + '</button>';
      }
      return '<span>' + p.label + '</span>';
    }).join(' ');
  }
  function parseMatches(s) {
    if (!s) return [];
    return s.split(';').map(function (chunk) {
      var i = chunk.indexOf(':');
      if (i < 0) return { lemma: chunk.trim(), parses: [] };
      return {
        lemma: chunk.slice(0, i).trim(),
        parses: chunk.slice(i + 1).split(',').map(function (s) { return s.trim(); }).filter(Boolean)
      };
    }).filter(function (m) { return m.lemma; });
  }
  function cssEscape(s) { return (window.CSS && CSS.escape) ? CSS.escape(s) : s; }

  // Per-open-cycle navigation stack. Each entry: { sourceId, label, matches }.
  // matches is a (possibly empty) string in the form the data-matches
  // attribute carries — preserved so back/forward navigation can re-apply
  // the same paradigm-cell highlights.
  var stack = [];
  var stackPos = -1;

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
      if (thisParses.length > 0) {
        slot.innerHTML = '<ul class="card-parse-list">' + thisParses.map(function (p) {
          return '<li><span class="card-parse-human">' + expandParseLinks(p) +
                 '</span> <span class="card-parse-code">' + p + '</span></li>';
        }).join('') + '</ul>';
      } else {
        slot.innerHTML = '';
      }
    }
    var chipsBox = scope.querySelector('.card-other-lemmas');
    if (chipsBox) {
      var others = matches.filter(function (m) { return m.lemma !== lemma; });
      if (others.length > 0) {
        var matchesStr = matches.map(function (m) {
          return m.lemma + ':' + m.parses.join(',');
        }).join(';');
        // Mark the chip that stanza independently prefers (if it's a secondary).
        chipsBox.innerHTML = '<span class="card-other-lemmas-label">readings: </span>' +
          others.map(function (m) {
            var isStanzaPref = stanzaLemma && m.lemma === stanzaLemma;
            var cls = 'latin-token other-lemma-chip' + (isStanzaPref ? ' stanza-preferred' : '');
            var label = m.lemma + (isStanzaPref ? ' ✓' : '');
            return '<button class="' + cls + '" type="button" popovertarget="card-' +
                   m.lemma + '" data-matches="' + matchesStr.replace(/"/g, '&quot;') + '">' +
                   label + '</button>';
          }).join('');
      } else {
        chipsBox.innerHTML = '';
      }
    }
    // Mark the primary heading when stanza independently confirms it.
    var heading = scope.querySelector('.card-lemma');
    if (heading) {
      heading.classList.toggle('stanza-confirmed', !!(stanzaLemma && stanzaLemma === lemma));
    }
  }

  function renderHost() {
    var host = document.getElementById('popover-host');
    if (!host) return;
    if (stackPos < 0 || !stack.length) {
      try { host.hidePopover(); } catch (_) {}
      return;
    }
    var entry = stack[stackPos];
    var source = document.getElementById(entry.sourceId);
    if (!source) return;
    var body = host.querySelector('.popover-body');
    var isCard = source.classList.contains('card-popover-source');
    body.className = 'popover-body ' + (isCard ? 'card-popover' : 'note-popover');
    body.innerHTML = source.innerHTML;
    if (isCard && entry.matches) {
      var lemma = entry.sourceId.replace(/^card-/, '');
      applyCardState(body, lemma, parseMatches(entry.matches), entry.stanzaLemma || '');
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
             escapeText(entry.label) + '</button></li>';
    }).join('');
  }

  function updateNavButtons(host) {
    var prev = host.querySelector('.popover-prev');
    var next = host.querySelector('.popover-next');
    if (prev) prev.disabled = stackPos <= 0;
    if (next) next.disabled = stackPos >= stack.length - 1;
  }

  function escapeText(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function pushAndShow(source, btn) {
    var matches = btn ? (btn.getAttribute('data-matches') || '') : '';
    var stanzaLemma = btn ? (btn.getAttribute('data-stanza') || '') : '';
    var current = stackPos >= 0 ? stack[stackPos] : null;
    // Clicking the same source with the same matches at the top of the
    // stack is a no-op (avoids duplicate breadcrumb entries).
    if (current && current.sourceId === source.id && current.matches === matches) {
      // But if the host happens to be hidden, re-show it.
      var h = document.getElementById('popover-host');
      if (h && !h.matches(':popover-open')) renderHost();
      return;
    }
    // Truncate forward history when branching from a non-top position.
    stack = stack.slice(0, stackPos + 1);
    stack.push({
      sourceId: source.id,
      label: source.dataset.label || source.id,
      matches: matches,
      stanzaLemma: stanzaLemma,
    });
    stackPos = stack.length - 1;
    renderHost();
  }

  function navigateTo(pos) {
    if (pos < 0 || pos >= stack.length || pos === stackPos) return;
    stackPos = pos;
    renderHost();
  }

  document.addEventListener('click', function (e) {
    var host = document.getElementById('popover-host');
    if (!host) return;

    var crumbBtn = e.target.closest('.popover-breadcrumb button[data-stack-pos]');
    if (crumbBtn) {
      e.preventDefault();
      navigateTo(parseInt(crumbBtn.dataset.stackPos, 10));
      return;
    }
    if (e.target.closest('.popover-prev')) {
      e.preventDefault();
      navigateTo(stackPos - 1);
      return;
    }
    if (e.target.closest('.popover-next')) {
      e.preventDefault();
      navigateTo(stackPos + 1);
      return;
    }

    // Regular anchor inside host: close and let navigation proceed.
    var anchor = e.target.closest('#popover-host a[href]');
    if (anchor) {
      try { host.hidePopover(); } catch (_) {}
      return;
    }

    // Buttons that point at source elements: route through the host.
    var btn = e.target.closest('button[popovertarget]');
    if (!btn) return;
    // Don't intercept the close button — its popovertarget=popover-host with
    // popovertargetaction=hide is handled by the browser default.
    if (btn.getAttribute('popovertargetaction') === 'hide') return;
    var targetId = btn.getAttribute('popovertarget');
    if (!targetId) return;
    var source = document.getElementById(targetId);
    if (!source) return;
    if (!source.classList.contains('card-popover-source') &&
        !source.classList.contains('note-popover-source')) return;
    e.preventDefault();
    pushAndShow(source, btn);
  });

  // Reset the stack whenever the host closes (light-dismiss, escape, ×).
  // Next open starts a fresh chain.
  document.addEventListener('beforetoggle', function (e) {
    if (e.target.id !== 'popover-host') return;
    if (e.newState === 'closed') {
      stack = [];
      stackPos = -1;
    }
  }, true);
})();

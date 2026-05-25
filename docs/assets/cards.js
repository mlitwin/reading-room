// Popover controller. One hidden `<aside id="popover-host" popover>` on the
// page hosts every card and note popover. Each `<aside hidden
// id="card-X" class="card-popover-source">` (or note-popover-source) is a
// container of innerHTML that gets copied into the host on click. Because
// there is only ever one popover element, navigating from a card to a note
// to another card never moves the popover — only its contents change.
//
// Click routing:
//   * button[popovertargetaction="hide"]      → hide host
//   * button.latin-token[popovertarget="card-X"]   → swap host to card, apply data-matches highlight
//   * button.other-lemma-chip[popovertarget="card-X"] → swap host to card, apply data-matches from chip
//   * button.note-link[popovertarget="note-X"]   → swap host to note (no state)
//   * a[href] inside host → close host, let navigation proceed
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
  function cssEscape(s) {
    return (window.CSS && CSS.escape) ? CSS.escape(s) : s;
  }

  // Apply data-matches state to a card-popover host: highlight matching
  // cells, fill the parse slot, render "also matches" chips.
  function applyCardState(host, lemma, matches) {
    var thisMatch = matches.filter(function (m) { return m.lemma === lemma; })[0];
    var thisParses = thisMatch ? thisMatch.parses : [];

    host.querySelectorAll('td.active-form').forEach(function (el) {
      el.classList.remove('active-form');
    });
    thisParses.forEach(function (p) {
      var cell = host.querySelector('td[data-parse="' + cssEscape(p) + '"]');
      if (cell) cell.classList.add('active-form');
    });

    var slot = host.querySelector('.card-parse');
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

    var chipsBox = host.querySelector('.card-other-lemmas');
    if (chipsBox) {
      var others = matches.filter(function (m) { return m.lemma !== lemma; });
      if (others.length > 0) {
        var matchesStr = matches.map(function (m) {
          return m.lemma + ':' + m.parses.join(',');
        }).join(';');
        chipsBox.innerHTML = '<span class="card-other-lemmas-label">also: </span>' +
          others.map(function (m) {
            return '<button class="latin-token other-lemma-chip" type="button" popovertarget="card-' +
                   m.lemma + '" data-matches="' + matchesStr.replace(/"/g, '&quot;') + '">' +
                   m.lemma + '</button>';
          }).join('');
      } else {
        chipsBox.innerHTML = '';
      }
    }
  }

  function showInHost(host, source, btn) {
    var sourceId = source.id;
    var isCard = source.classList.contains('card-popover-source');
    host.className = isCard ? 'card-popover' : 'note-popover';
    host.innerHTML = source.innerHTML;
    host.dataset.sourceId = sourceId;
    if (isCard && btn && btn.hasAttribute('data-matches')) {
      var lemma = sourceId.replace(/^card-/, '');
      var matches = parseMatches(btn.getAttribute('data-matches'));
      applyCardState(host, lemma, matches);
    }
    if (!host.matches(':popover-open')) {
      try { host.showPopover(); } catch (_) { /* already open / not supported */ }
    }
  }

  document.addEventListener('click', function (e) {
    var host = document.getElementById('popover-host');
    if (!host) return;

    // Regular anchor inside the host: dismiss and let navigation proceed.
    var anchor = e.target.closest('#popover-host a[href]');
    if (anchor) {
      try { host.hidePopover(); } catch (_) {}
      return;
    }

    // Any button that asks to hide: hide the host.
    var hideBtn = e.target.closest('button[popovertargetaction="hide"]');
    if (hideBtn) {
      e.preventDefault();
      try { host.hidePopover(); } catch (_) {}
      return;
    }

    // Buttons pointing at a card or note source: route through the host.
    var btn = e.target.closest('button[popovertarget]');
    if (!btn) return;
    var targetId = btn.getAttribute('popovertarget');
    if (!targetId) return;
    var source = document.getElementById(targetId);
    if (!source) return;
    if (!source.classList.contains('card-popover-source') &&
        !source.classList.contains('note-popover-source')) {
      return; // not our flow
    }
    e.preventDefault();
    // Click on a button that already targets the showing source → toggle close.
    if (host.matches(':popover-open') && host.dataset.sourceId === targetId) {
      try { host.hidePopover(); } catch (_) {}
      return;
    }
    showInHost(host, source, btn);
  });
})();

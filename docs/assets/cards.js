// Latin-passage card popovers. The triggering button carries `data-matches`
// = "lemma1:parse1,parse2;lemma2:parse3" — every morphological reading of
// the surface form, grouped by lemma. When a popover opens, this script
// looks up the parses for that lemma, paints every matching paradigm cell
// with .active-form, lists the parses (expanded into English) in the slot,
// and renders "also matches: [lemma2]" chips that swap to the next lemma's
// popover when clicked. The card is a study tool, not an answer key — we
// show all matches, not just the one Ovid (or whoever) intended.
(function () {
  // Compact parse-code primitive → {label, note}. Mirrored in
  // site/generator/build.js; keep them in sync.
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

  function applyToCard(card, matches) {
    var thisLemma = card.id.replace(/^card-/, '');
    var thisMatch = matches.filter(function (m) { return m.lemma === thisLemma; })[0];
    var thisParses = thisMatch ? thisMatch.parses : [];

    card.querySelectorAll('td.active-form').forEach(function (el) {
      el.classList.remove('active-form');
    });
    thisParses.forEach(function (p) {
      var cell = card.querySelector('td[data-parse="' + cssEscape(p) + '"]');
      if (cell) cell.classList.add('active-form');
    });

    var slot = card.querySelector('.card-parse');
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

    var chipsBox = card.querySelector('.card-other-lemmas');
    if (chipsBox) {
      var others = matches.filter(function (m) { return m.lemma !== thisLemma; });
      if (others.length > 0) {
        // Each chip is a popover-trigger that re-enters this handler. We
        // smuggle the original data-matches through so the destination card
        // can highlight the right cells.
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

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('button.latin-token[popovertarget]');
    if (!btn) return;
    var card = document.getElementById(btn.getAttribute('popovertarget'));
    if (!card || !card.classList.contains('card-popover')) return;
    var matches = parseMatches(btn.getAttribute('data-matches') || '');
    // Chip-clicks: the chip is inside an already-open popover; the destination
    // popover toggles open via the browser default. Hide the chip's host so
    // the new popover swaps in cleanly.
    var hostingPopover = btn.closest('.card-popover');
    if (hostingPopover && hostingPopover !== card) {
      try { hostingPopover.hidePopover(); } catch (_) { /* not open */ }
    }
    applyToCard(card, matches);
  });
})();

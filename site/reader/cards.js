// Latin-passage card popovers. When a `.latin-token` button is clicked, copy
// its `data-parse` onto the targeted card popover, highlight the matching
// cell of the paradigm table, and write a humanised version of the parse
// into the popover's parse slot. The button's own click already triggers the
// browser's popover-toggle; this handler runs before that and prepares state.
(function () {
  // Compact parse code → English word. Tokens are separated by `.` in
  // data-parse; each token expands independently and the results are joined.
  // Unknown tokens are passed through verbatim.
  var PARSE_WORDS = {
    '1sg': '1st-person singular', '2sg': '2nd-person singular', '3sg': '3rd-person singular',
    '1pl': '1st-person plural', '2pl': '2nd-person plural', '3pl': '3rd-person plural',
    nom: 'nominative', gen: 'genitive', dat: 'dative', acc: 'accusative', abl: 'ablative', voc: 'vocative',
    sg: 'singular', pl: 'plural',
    masc: 'masculine', fem: 'feminine', neut: 'neuter',
    pres: 'present', imperf: 'imperfect', perf: 'perfect', plup: 'pluperfect', fut: 'future',
    ind: 'indicative', subj: 'subjunctive', imp: 'imperative',
    act: 'active', pass: 'passive', dep: 'deponent',
    inf: 'infinitive', ger: 'gerund', sup: 'supine',
    ppp: 'perfect passive participle', pap: 'present active participle', fap: 'future active participle',
    prep: 'preposition', conj: 'conjunction', enclit: 'enclitic'
  };
  function expandParse(parse) {
    if (!parse) return '';
    return parse.split('.').map(function (tok) {
      return PARSE_WORDS[tok] || tok;
    }).join(' ');
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('button.latin-token[popovertarget]');
    if (!btn) return;
    var card = document.getElementById(btn.getAttribute('popovertarget'));
    if (!card || !card.classList.contains('card-popover')) return;
    var parse = btn.getAttribute('data-parse') || '';
    card.setAttribute('data-parse', parse);
    var slot = card.querySelector('.card-parse');
    if (slot) {
      slot.innerHTML = parse
        ? '<span class="card-parse-human">' + expandParse(parse) + '</span> <span class="card-parse-code">' + parse + '</span>'
        : '';
    }
    card.querySelectorAll('td.active-form').forEach(function (el) {
      el.classList.remove('active-form');
    });
    if (parse) {
      var cell = card.querySelector('td[data-parse="' + (window.CSS && CSS.escape ? CSS.escape(parse) : parse) + '"]');
      if (cell) cell.classList.add('active-form');
    }
  });
})();

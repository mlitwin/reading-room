// Latin-passage card popovers. When a `.latin-token` button is clicked, copy
// its `data-parse` onto the targeted card popover and highlight the matching
// cell of the paradigm table. The button's own click already triggers the
// browser's popover-toggle; this handler runs before that and prepares state.
(function () {
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('button.latin-token[popovertarget]');
    if (!btn) return;
    var card = document.getElementById(btn.getAttribute('popovertarget'));
    if (!card || !card.classList.contains('card-popover')) return;
    var parse = btn.getAttribute('data-parse') || '';
    card.setAttribute('data-parse', parse);
    var slot = card.querySelector('.card-parse');
    if (slot) slot.textContent = parse;
    card.querySelectorAll('td.active-form').forEach(function (el) {
      el.classList.remove('active-form');
    });
    if (parse) {
      var cell = card.querySelector('td[data-parse="' + (window.CSS && CSS.escape ? CSS.escape(parse) : parse) + '"]');
      if (cell) cell.classList.add('active-form');
    }
  });
})();

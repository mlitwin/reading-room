// Popover-internal navigation for the web reader. Tapping a `note:` button
// inside an open popover (note OR card) closes the current popover and opens
// the target; tapping a regular link inside an open popover closes it and
// lets the navigation proceed. The handler runs for both `.note-popover` and
// `.card-popover` sources so card → note navigation works the same as the
// existing note → note nav.
(function () {
  document.addEventListener('click', function (e) {
    var link = e.target.closest(
      '.note-popover button.note-link, .note-popover a[href], ' +
      '.card-popover button.note-link, .card-popover a[href]'
    );
    if (!link) return;
    var open = link.closest('.note-popover, .card-popover');
    var popoverTarget = link.getAttribute('popovertarget');
    if (popoverTarget) {
      // popover → another popover. Close current, open target. preventDefault
      // so the browser's own toggle doesn't reopen-then-close the source.
      e.preventDefault();
      try { open && open.hidePopover(); } catch (_) {}
      var target = document.getElementById(popoverTarget);
      try { target && target.showPopover(); } catch (_) {}
    } else {
      // Regular link inside a popover. Close it; let navigation proceed.
      try { open && open.hidePopover(); } catch (_) {}
    }
  });
})();

// Popover-internal navigation for the web reader. Tapping a `note:` button
// inside an open popover closes the current popover and opens the target;
// tapping a regular link inside an open popover closes it and lets the
// navigation proceed.
(function () {
  document.addEventListener('click', function (e) {
    var link = e.target.closest('.note-popover button.note-link, .note-popover a[href]');
    if (!link) return;
    var open = document.querySelector('.note-popover:popover-open');
    var popoverTarget = link.getAttribute('popovertarget');
    if (popoverTarget) {
      // note → note. Close current, open target.
      e.preventDefault();
      try { open && open.hidePopover(); } catch (_) {}
      var target = document.getElementById(popoverTarget);
      try { target && target.showPopover(); } catch (_) {}
    } else {
      // Regular link inside a popover. Close it; let the navigation proceed.
      try { open && open.hidePopover(); } catch (_) {}
    }
  });
})();

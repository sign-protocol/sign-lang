// SIGN site behaviour: sticky header state, mobile menu, copy buttons, step progress.
// Everything here is progressive: the pages read fully without JavaScript.
(function () {
  var header = document.querySelector('header.site');
  if (header) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Mobile menu: closes on item selection, outside click and Escape; returns focus to the trigger.
  var nav = document.querySelector('nav.primary');
  var menuBtn = document.querySelector('.menu-btn');
  if (nav && menuBtn) {
    var setOpen = function (open, restoreFocus) {
      nav.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      if (!open && restoreFocus) menuBtn.focus();
    };
    menuBtn.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
    nav.querySelectorAll('ul a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    document.addEventListener('click', function (e) { if (nav.classList.contains('open') && !nav.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) setOpen(false, true); });
  }

  // Copy buttons copy the text of the code block that follows their header.
  document.querySelectorAll('.copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var pre = btn.closest('.codehead').nextElementSibling;
      var text = pre ? pre.innerText : '';
      var done = function () {
        var label = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = label; }, 1600);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {});
    });
  });

  // Step progress: checkboxes remember what the reader has done, on this device only.
  var key = 'sign-steps:' + location.pathname;
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) { saved = {}; }
  var boxes = document.querySelectorAll('.check input[data-step]');
  var paint = function () {
    boxes.forEach(function (b) {
      var link = document.querySelector('.step-nav a[href="#' + b.dataset.step + '"]');
      if (link) link.parentElement.classList.toggle('done', b.checked);
    });
  };
  boxes.forEach(function (b) {
    b.checked = !!saved[b.dataset.step];
    b.addEventListener('change', function () {
      saved[b.dataset.step] = b.checked;
      try { localStorage.setItem(key, JSON.stringify(saved)); } catch (e) { /* storage blocked */ }
      paint();
    });
  });
  paint();

  // Mark the step in view in the side list.
  var stepLinks = document.querySelectorAll('.step-nav a');
  if (stepLinks.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        stepLinks.forEach(function (l) {
          if (l.getAttribute('href') === '#' + en.target.id) l.setAttribute('aria-current', 'step');
          else l.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    document.querySelectorAll('ol.steps > li[id]').forEach(function (li) { io.observe(li); });
  }
})();

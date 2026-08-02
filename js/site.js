/* ==========================================================================
   Behaviour for the project page. The markup and stylesheet come from the
   original build, so this file only has to supply what React was doing:
   the two carousel types, the nav dropdowns, and the BibTeX copy.
   ========================================================================== */

/* ---- Nav dropdowns -------------------------------------------------------
   The stylesheet already opens these on .dropdown:hover, which covers mouse
   users. This adds tap and keyboard, which hover alone cannot: on iOS a
   :hover panel latches open until you tap elsewhere, and it is unreachable
   from the keyboard entirely.                                             */
(function () {
  var items = [].slice.call(document.querySelectorAll('.nav-item.dropdown'));
  if (!items.length) return;

  function closeAll(except) {
    items.forEach(function (it) {
      if (it !== except) { it.classList.remove('open'); it.setAttribute('aria-expanded', 'false'); }
    });
  }

  items.forEach(function (item) {
    var menu = item.querySelector('.dropdown-menu');
    if (!menu) return;

    function toggle(e) {
      if (e) e.preventDefault();
      var open = item.classList.contains('open');
      closeAll(item);
      item.classList.toggle('open', !open);
      item.setAttribute('aria-expanded', String(!open));
      // The sheet drives visibility from :hover, so the open state has to be
      // written inline to survive the pointer leaving.
      menu.style.display = !open ? 'block' : '';
      menu.style.opacity = !open ? '1' : '';
    }

    item.addEventListener('click', function (e) {
      if (e.target.closest('.dropdown-item')) return;   // let links through
      toggle(e);
    });

    item.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') toggle(e);
      if (e.key === 'Escape') { closeAll(null); item.focus(); }
    });

    menu.querySelectorAll('.dropdown-item').forEach(function (a) {
      a.addEventListener('click', function () { closeAll(null); menu.style.display = ''; menu.style.opacity = ''; });
    });
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav-item')) {
      items.forEach(function (it) {
        var m = it.querySelector('.dropdown-menu');
        if (m) { m.style.display = ''; m.style.opacity = ''; }
      });
      closeAll(null);
    }
  });

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(null); });
})();


/* ---- Interface carousel --------------------------------------------------
   A sliding track of four screenshots. Each slide carries its own caption,
   which the stylesheet reveals on hover over the slide.                   */
(function () {
  [].slice.call(document.querySelectorAll('[data-carousel]')).forEach(function (root) {
    var track = root.querySelector('.carousel-track');
    var slides = [].slice.call(root.querySelectorAll('.carousel-item'));
    var dots = root.querySelector('.carousel-indicators');
    var btns = [].slice.call(root.querySelectorAll('.carousel-btn'));
    if (!track || slides.length < 2) return;

    var index = 0;

    var counter = document.createElement('span');
    counter.className = 'carousel-counter';
    counter.setAttribute('aria-live', 'polite');
    dots.appendChild(counter);

    function go(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (index * -100) + '%)';
      counter.textContent = (index + 1) + ' / ' + slides.length;
      slides.forEach(function (s, n) { s.setAttribute('aria-hidden', String(n !== index)); });
    }

    btns.forEach(function (b) {
      b.addEventListener('click', function () { go(index + Number(b.dataset.dir || 1)); });
    });

    var x0 = null;
    root.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) go(index + (dx < 0 ? 1 : -1));
      x0 = null;
    }, { passive: true });

    go(0);
  });
})();


/* ---- Findings carousels --------------------------------------------------
   These swap a single image rather than sliding a track, and the caption
   sits below the figure. Slides are declared in a JSON block so the caption
   markup (which contains <em>) survives without being smuggled through an
   attribute, where the browser would decode entities before JS saw them. */
(function () {
  [].slice.call(document.querySelectorAll('[data-findings-carousel]')).forEach(function (root) {
    var data = root.querySelector('.carousel-data');
    var img = root.querySelector('.findings-carousel-image-wrap img');
    var cap = root.querySelector('.findings-carousel-caption');
    var dots = root.querySelector('.findings-carousel-indicators');
    var btns = [].slice.call(root.querySelectorAll('.findings-carousel-btn'));
    if (!data || !img) return;

    var slides;
    try { slides = JSON.parse(data.textContent); } catch (err) { return; }
    if (!slides.length) return;

    var index = 0;

    var counter = document.createElement('span');
    counter.className = 'carousel-counter';
    counter.setAttribute('aria-live', 'polite');
    dots.appendChild(counter);

    function go(i) {
      index = (i + slides.length) % slides.length;
      var s = slides[index];
      img.src = s.src;
      img.alt = s.alt || '';
      if (cap) cap.innerHTML = s.caption || '';
      counter.textContent = (index + 1) + ' / ' + slides.length;
    }

    btns.forEach(function (b) {
      b.addEventListener('click', function () { go(index + Number(b.dataset.dir || 1)); });
    });

    var x0 = null;
    root.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) go(index + (dx < 0 ? 1 : -1));
      x0 = null;
    }, { passive: true });

    go(0);
  });
})();


/* ---- BibTeX copy --------------------------------------------------------- */
(function () {
  var btn = document.querySelector('.btn-copy');
  var pre = document.querySelector('.bibtex-pre');
  if (!btn || !pre) return;

  btn.addEventListener('click', function () {
    var text = pre.textContent;

    function done() {
      var was = btn.textContent;
      btn.textContent = 'Copied';
      setTimeout(function () { btn.textContent = was; }, 1800);
    }

    // file:// and plain http have no clipboard API, and this page is often
    // opened straight off disk.
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (err) { /* nothing to offer */ }
      document.body.removeChild(ta);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
  });
})();


/* ---- Section spine -------------------------------------------------------
   Marks whichever section you are reading. Positions are swept in the scroll
   frame rather than watched with an IntersectionObserver: a fast flick can
   leave an observer without a callback for a section it passed through, and
   the marker then sticks on the wrong dot.                                */
(function () {
  var links = [].slice.call(document.querySelectorAll('.spine a'));
  if (!links.length) return;

  var targets = links
    .map(function (a) { return { a: a, el: document.getElementById(a.getAttribute('href').slice(1)) }; })
    .filter(function (t) { return t.el; });
  if (!targets.length) return;

  function update() {
    var line = window.innerHeight * 0.35;
    var current = null;
    targets.forEach(function (t) {
      if (t.el.getBoundingClientRect().top <= line) current = t.a;
    });
    // Before the first section — while the hero fills the screen — nothing
    // is marked, which is honest: you are not in a section yet.
    links.forEach(function (a) { a.classList.toggle('current', a === current); });
    links.forEach(function (a) {
      if (a === current) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  var queued = false;
  window.addEventListener('scroll', function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { update(); queued = false; });
  }, { passive: true });

  window.addEventListener('resize', update);
  update();
})();


/* ---- Nav height ----------------------------------------------------------
   The bar is 63px, not the 53px the stylesheet assumed. That ten-pixel gap
   is why the hero overhung the fold and why clicking "About the Paper" left
   a sliver of artwork showing above the abstract. Measured rather than
   guessed, so it stays right if the bar's padding or type ever changes.  */
(function () {
  var nav = document.querySelector('.top-nav');
  if (!nav) return;

  function sync() {
    var h = Math.round(nav.getBoundingClientRect().height);
    if (h) document.documentElement.style.setProperty('--nav-h', h + 'px');
  }

  sync();
  window.addEventListener('resize', sync);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sync);
})();


/* ---- Motion on scroll ----------------------------------------------------
   Positions are swept in the scroll frame rather than watched with an
   IntersectionObserver: a fast flick can leave an observer without a
   callback for something it passed, which strands a block at opacity 0.
   A sweep cannot strand anything, because it re-tests every candidate on
   every frame it runs.                                                    */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* --- the hero states itself once the fonts have settled --- */
  var hero = document.querySelector('.hero-section');
  if (hero) {
    var ready = function () { hero.classList.add('hero-ready'); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ready);
    else ready();
    setTimeout(ready, 600);   // never leave the hero blank if fonts hang
  }

  /* --- blocks rise as they arrive --- */
  var targets = [].slice.call(document.querySelectorAll(
    '.content-section > .section-heading,' +
    '.content-section > .section-body,' +
    '.section-subsections > .subsection,' +
    '.section-abstract > .abstract-top,' +
    '.section-abstract > .body-text,' +
    '.content-section > .bibtex-wrap'
  ));

  targets.forEach(function (el) { el.classList.add('rise'); });

  function sweep() {
    var line = window.innerHeight * 0.88;
    for (var i = targets.length - 1; i >= 0; i--) {
      if (targets[i].getBoundingClientRect().top < line) {
        targets[i].classList.add('in');
        targets.splice(i, 1);        // done with it; never re-hide
      }
    }
    if (!targets.length) window.removeEventListener('scroll', queue);
  }

  /* --- the artwork drifts behind the page --- */
  var wash = document.querySelector('.hero-wash');

  function drift() {
    if (!wash) return;
    var y = window.scrollY;
    if (y > window.innerHeight) return;         // out of sight, stop working
    wash.style.transform = 'translate3d(0,' + (y * 0.12) + 'px,0)';
  }

  var queued = false;
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { sweep(); drift(); queued = false; });
  }

  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  sweep();
  drift();
})();

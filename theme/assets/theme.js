/**
 * Velvet Night — scripts globaux
 * Menu · header scroll · avant/après · reveals · panier · sticky ATC
 */
(function () {
  'use strict';

  function once(el, key) {
    var attr = 'data-vn-' + key;
    if (el.hasAttribute(attr)) return false;
    el.setAttribute(attr, '');
    return true;
  }

  function initHeader() {
    var header = document.querySelector('[data-site-header]');
    if (!header) return;

    if (once(header, 'scroll')) {
      var onScroll = function () {
        header.classList.toggle('is-scrolled', window.scrollY > 12);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    var toggle = header.querySelector('[data-menu-toggle]');
    var nav = header.querySelector('[data-mobile-nav]');
    if (!toggle || !nav || !once(toggle, 'nav')) return;

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('nf-no-scroll', open);
      document.body.style.overflow = open ? 'hidden' : '';
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.querySelectorAll('[data-mobile-close]').forEach(function (btn) {
      btn.addEventListener('click', function () { setOpen(false); });
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    window.matchMedia('(min-width: 990px)').addEventListener('change', function (mq) {
      if (mq.matches) setOpen(false);
    });
  }

  function initBeforeAfter() {
    document.querySelectorAll('[data-ba-slider]').forEach(function (slider) {
      var range = slider.querySelector('[data-ba-range]');
      if (!range || !once(slider, 'ba')) return;

      var dragging = false;

      function setPos(value) {
        var pos = Math.max(0, Math.min(100, value));
        slider.style.setProperty('--ba-pos', pos + '%');
        range.value = String(pos);
        range.setAttribute('aria-valuenow', String(Math.round(pos)));
        range.setAttribute('aria-valuetext', Math.round(pos) + ' % avant');
      }

      function posFromEvent(event) {
        var rect = slider.getBoundingClientRect();
        var clientX = event.touches && event.touches[0]
          ? event.touches[0].clientX
          : (event.clientX != null ? event.clientX : 0);
        if (!rect.width) return 50;
        return ((clientX - rect.left) / rect.width) * 100;
      }

      function onPointerDown(event) {
        /* Ignore multi-touch so vertical page scroll still works */
        if (event.touches && event.touches.length > 1) return;
        dragging = true;
        slider.classList.add('is-dragging');
        try { slider.setPointerCapture && event.pointerId != null && slider.setPointerCapture(event.pointerId); } catch (e) {}
        if (event.cancelable) event.preventDefault();
        setPos(posFromEvent(event));
      }

      function onPointerMove(event) {
        if (!dragging) return;
        if (event.cancelable) event.preventDefault();
        setPos(posFromEvent(event));
      }

      function onPointerUp() {
        dragging = false;
        slider.classList.remove('is-dragging');
      }

      setPos(parseFloat(range.value) || 50);

      range.addEventListener('input', function () {
        setPos(parseFloat(range.value) || 0);
      });
      range.addEventListener('change', function () {
        setPos(parseFloat(range.value) || 0);
      });

      slider.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove, { passive: false });
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);

      /* Fallback souris / touch si Pointer Events absents */
      if (!window.PointerEvent) {
        slider.addEventListener('mousedown', onPointerDown);
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);
        slider.addEventListener('touchstart', onPointerDown, { passive: false });
        window.addEventListener('touchmove', onPointerMove, { passive: false });
        window.addEventListener('touchend', onPointerUp);
      }

      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
        var played = false;
        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting || played || dragging) return;
            played = true;
            observer.disconnect();
            var start = parseFloat(range.value) || 50;
            var frames = [start, Math.max(12, start - 18), Math.min(88, start + 16), start];
            var i = 0;
            (function step() {
              if (i >= frames.length || dragging) return;
              setPos(frames[i++]);
              setTimeout(step, 220);
            })();
          });
        }, { threshold: 0.45 });
        observer.observe(slider);
      }
    });
  }

  function initReveals() {
    if (!window.themeSettings || window.themeSettings.animations === false) return;
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-animate]').forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    document.querySelectorAll('[data-animate]').forEach(function (el) {
      if (!el.classList.contains('is-visible')) observer.observe(el);
    });
  }

  function initGallery() {
    document.querySelectorAll('[data-gallery]').forEach(function (gallery) {
      var track = gallery.querySelector('[data-gallery-track]');
      var thumbs = gallery.querySelectorAll('[data-gallery-thumb]');
      if (!track || !thumbs.length || !once(gallery, 'gallery')) return;

      function setActive(id) {
        thumbs.forEach(function (thumb) {
          thumb.classList.toggle('is-active', thumb.getAttribute('data-gallery-thumb') === String(id));
          if (thumb.getAttribute('data-gallery-thumb') === String(id)) {
            thumb.setAttribute('aria-current', 'true');
          } else {
            thumb.removeAttribute('aria-current');
          }
        });
      }

      thumbs.forEach(function (thumb) {
        thumb.addEventListener('click', function () {
          var id = thumb.getAttribute('data-gallery-thumb');
          var slide = track.querySelector('[data-media-id="' + id + '"]');
          if (slide) track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: 'smooth' });
          setActive(id);
        });
      });
    });
  }

  function initSort() {
    document.querySelectorAll('[data-sort-select]').forEach(function (select) {
      if (!once(select, 'sort')) return;
      select.addEventListener('change', function () {
        var url = new URL(window.location.href);
        url.searchParams.set('sort_by', select.value);
        url.searchParams.delete('page');
        window.location.href = url.toString();
      });
    });
  }

  function initCartDrawer() {
    if (!window.themeSettings || window.themeSettings.cartDrawer === false) return;
    var drawer = document.getElementById('CartDrawer');
    if (!drawer || !once(drawer, 'drawer')) return;

    function open() {
      drawer.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      drawer.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('[data-cart-open]').forEach(function (btn) {
      btn.addEventListener('click', function (event) {
        if (window.themeSettings.cartDrawer === false) return;
        event.preventDefault();
        open();
      });
    });
    drawer.querySelectorAll('[data-cart-close]').forEach(function (btn) {
      btn.addEventListener('click', close);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && drawer.classList.contains('is-open')) close();
    });

    window.themeCart = window.themeCart || {};
    window.themeCart.open = open;
    window.themeCart.close = close;
  }

  function initStickyAtc() {
    if (!window.themeSettings || window.themeSettings.stickyAtc === false) return;
    var bar = document.querySelector('[data-sticky-atc]');
    var anchor = document.querySelector('[data-sticky-atc-anchor]');
    if (!bar || !anchor || !once(bar, 'sticky')) return;

    document.body.classList.add('has-sticky-atc');

    if (!('IntersectionObserver' in window)) {
      bar.classList.add('is-visible');
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        bar.classList.toggle('is-visible', !entry.isIntersecting);
      });
    }, { threshold: 0 });

    observer.observe(anchor);
  }

  function initProductForms() {
    document.querySelectorAll('form[action*="/cart/add"]').forEach(function (form) {
      if (!once(form, 'ajax')) return;
      form.addEventListener('submit', function (event) {
        if (!window.themeSettings || window.themeSettings.cartDrawer === false) return;
        event.preventDefault();
        var btn = form.querySelector('[type="submit"]');
        if (btn) btn.classList.add('is-loading');

        var data = new FormData(form);
        fetch(window.routes.cartAddUrl || '/cart/add.js', {
          method: 'POST',
          body: data,
          headers: { Accept: 'application/json' }
        })
          .then(function (res) { return res.json(); })
          .then(function () {
            return fetch((window.routes.cartUrl || '/cart') + '.js');
          })
          .then(function (res) { return res.json(); })
          .then(function (cart) {
            document.querySelectorAll('[data-cart-count]').forEach(function (el) {
              el.setAttribute('data-count', String(cart.item_count));
              el.textContent = cart.item_count > 0 ? String(cart.item_count) : '';
            });
            if (window.themeCart && window.themeCart.open) window.themeCart.open();
          })
          .catch(function () {
            form.submit();
          })
          .finally(function () {
            if (btn) btn.classList.remove('is-loading');
          });
      });
    });
  }

  function init() {
    document.documentElement.classList.add('js');
    initHeader();
    initBeforeAfter();
    initReveals();
    initGallery();
    initSort();
    initCartDrawer();
    initStickyAtc();
    initProductForms();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', init);
})();

/**
 * Equipos y Servicios AG — sitio estático
 * Configure WHATSAPP_NUMBER, PORTAL_URL, PJLA_SITIO_URL y ACREDITACION_PDF_URL aquí.
 */
(function () {
  'use strict';

  const WHATSAPP_NUMBER = '528128742959';
  const PJLA_SITIO_URL =
    'https://www.pjview.com/clients/pjl/pjla-accredited-labs.cfm?filterLaboratory=equipos+y+servicios&filterCertStatus=Active&OrderBy=company&OldOrderBy=company&PageNo=1';
  const ACREDITACION_PDF_URL = 'acreditacion-pjla.pdf';

  const WHATSAPP_TOPICS = {
    calibracion:
      'Hola, solicito cotización de calibración acreditada.\nInstrumento o magnitud: ',
    equipos: 'Hola, requiero información sobre venta de equipos de medición y prueba.',
    horario: 'Hola, consulto horarios de atención y cobertura en Monterrey.',
    acreditacion: 'Hola, necesito información sobre acreditación ISO/IEC 17025 y certificados PJLA.',
    general: 'Hola, requiero asistencia del laboratorio de AG.',
  };

  const WHATSAPP_MSG = encodeURIComponent(WHATSAPP_TOPICS.general);
  const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`;

  const PANEL_NAMES = ['servicios', 'equipos', 'contacto', 'acreditacion'];
  const FOCUSABLE =
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

  const body = document.body;
  let lastFocusedBeforePanel = null;

  function whatsappUrl(topic) {
    const text =
      topic && WHATSAPP_TOPICS[topic]
        ? WHATSAPP_TOPICS[topic]
        : WHATSAPP_TOPICS.general;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  }

  function openWhatsApp(topic) {
    window.open(whatsappUrl(topic), '_blank', 'noopener,noreferrer');
  }

  function wireWhatsAppLinks() {
    document.querySelectorAll('[data-whatsapp]').forEach((el) => {
      const topic = el.getAttribute('data-wa-topic') || 'general';
      el.setAttribute('href', whatsappUrl(topic));
      if (el.tagName === 'A') {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  function initWaAssistant() {
    const root = document.getElementById('wa-assistant');
    const openBtn = document.getElementById('wa-assistant-open');
    if (!root || !openBtn) return;

    const panel = root.querySelector('.wa-assistant__panel');
    let lastFocus = null;

    function setOpen(open) {
      root.classList.toggle('wa-assistant--open', open);
      root.setAttribute('aria-hidden', open ? 'false' : 'true');
      openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      body.classList.toggle('wa-assistant-open', open);

      if (open) {
        lastFocus = document.activeElement;
        const closeBtn = root.querySelector('.wa-assistant__close');
        (closeBtn || panel)?.focus();
      } else if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus();
        lastFocus = null;
      }
    }

    openBtn.addEventListener('click', () => setOpen(!root.classList.contains('wa-assistant--open')));

    root.querySelectorAll('[data-wa-close]').forEach((el) => {
      el.addEventListener('click', () => setOpen(false));
    });

    root.querySelectorAll('[data-wa-topic]').forEach((el) => {
      if (el.matches('a[data-whatsapp]')) return;
      el.addEventListener('click', () => {
        openWhatsApp(el.getAttribute('data-wa-topic'));
        setOpen(false);
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && root.classList.contains('wa-assistant--open')) {
        setOpen(false);
      }
    });
  }

  function wireAcreditacionLinks() {
    const pjla = document.getElementById('acreditacion-link-pjla');
    const pdf = document.getElementById('acreditacion-link-pdf');
    if (pjla) pjla.href = PJLA_SITIO_URL;
    if (pdf) {
      pdf.href = ACREDITACION_PDF_URL;
      pdf.setAttribute('title', 'Certificado y alcance de acreditación (PDF)');
    }
  }

  function overlayEl(name) {
    return document.getElementById('overlay-' + name);
  }

  function btnEl(name) {
    return document.getElementById('btn-panel-' + name);
  }

  function sheetEl(name) {
    const overlay = overlayEl(name);
    return overlay ? overlay.querySelector('.nav-panel-sheet') : null;
  }

  function isPanelOpen(name) {
    const o = overlayEl(name);
    return o && o.classList.contains('is-open');
  }

  function anyPanelOpen() {
    return PANEL_NAMES.some((n) => isPanelOpen(n));
  }

  function syncBodyScroll() {
    body.classList.toggle('nav-panel-open', anyPanelOpen());
  }

  function getFocusables(container) {
    if (!container) return [];
    return Array.from(container.querySelectorAll(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement
    );
  }

  function setPanelOpen(name, open) {
    const o = overlayEl(name);
    const b = btnEl(name);
    const sheet = sheetEl(name);

    if (o) {
      o.classList.toggle('is-open', open);
      o.setAttribute('aria-hidden', open ? 'false' : 'true');
    }
    if (sheet) {
      sheet.setAttribute('aria-hidden', open ? 'false' : 'true');
    }
    if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');

    if (open && sheet) {
      const focusables = getFocusables(sheet);
      const closeBtn = sheet.querySelector('[data-close-panel]');
      (closeBtn || focusables[0])?.focus();
    }
  }

  function closeAllPanels() {
    PANEL_NAMES.forEach((n) => setPanelOpen(n, false));
    syncBodyScroll();
    if (lastFocusedBeforePanel && typeof lastFocusedBeforePanel.focus === 'function') {
      lastFocusedBeforePanel.focus();
      lastFocusedBeforePanel = null;
    }
  }

  function openOnly(name) {
    if (!anyPanelOpen()) {
      lastFocusedBeforePanel = document.activeElement;
    }
    PANEL_NAMES.forEach((n) => setPanelOpen(n, n === name));
    syncBodyScroll();
  }

  function togglePanel(name) {
    if (isPanelOpen(name)) closeAllPanels();
    else openOnly(name);
  }

  function trapFocus(e) {
    const openName = PANEL_NAMES.find((n) => isPanelOpen(n));
    if (!openName || e.key !== 'Tab') return;

    const sheet = sheetEl(openName);
    const focusables = getFocusables(sheet);
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function initPanels() {
    PANEL_NAMES.forEach((name) => {
      const btn = btnEl(name);
      if (btn) btn.addEventListener('click', () => togglePanel(name));
    });

    document.querySelectorAll('[data-close-panel]').forEach((el) => {
      el.addEventListener('click', () => {
        const name = el.getAttribute('data-close-panel');
        if (name && PANEL_NAMES.includes(name)) {
          setPanelOpen(name, false);
          syncBodyScroll();
          if (lastFocusedBeforePanel) {
            lastFocusedBeforePanel.focus();
            lastFocusedBeforePanel = null;
          }
        }
      });
    });

    document.querySelectorAll('.panel-section-link').forEach((link) => {
      link.addEventListener('click', () => closeAllPanels());
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAllPanels();
      trapFocus(e);
    });

  }

  function initNavScroll() {
    const header = document.getElementById('site-header');
    if (!header) return;
    const onScroll = () => {
      header.classList.toggle('site-header--scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initFooterLinks() {
    const footerAcr = document.getElementById('footer-acreditacion');
    const acrBtn = document.getElementById('btn-panel-acreditacion');
    if (footerAcr && acrBtn) {
      footerAcr.addEventListener('click', () => acrBtn.click());
    }
  }

  function setHeaderHeight() {
    const header = document.getElementById('site-header');
    if (!header) return;
    document.documentElement.style.setProperty('--site-header-h', header.offsetHeight + 'px');
  }

  const CATALOG_SECTION_IDS = [
    'dimensional',
    'mecanica',
    'acustica',
    'electrica',
    'termodinamica',
    'quimica',
    'masa',
    'tiempo',
  ];

  function isCatalogOpen() {
    return body.classList.contains('view-catalog');
  }

  function getCatalogSectionFromHash() {
    const id = location.hash.replace('#', '');
    return CATALOG_SECTION_IDS.includes(id) ? id : null;
  }

  function scrollToCatalogSection(sectionId) {
    if (!sectionId) return;
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function openCatalog(pushState, scrollToTop) {
    const view = document.getElementById('catalogo-view');
    if (!view) return;
    body.classList.add('view-catalog');
    view.setAttribute('aria-hidden', 'false');
    if (scrollToTop !== false) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (pushState !== false) {
      history.pushState({ view: 'catalog' }, '', '#catalogo');
    }
  }

  function closeCatalog(pushState) {
    const view = document.getElementById('catalogo-view');
    body.classList.remove('view-catalog');
    if (view) {
      view.setAttribute('aria-hidden', 'true');
    }
    if (pushState !== false) {
      const hash = location.hash && location.hash !== '#catalogo' ? location.hash : '#equipos';
      history.pushState({ view: 'home' }, '', hash);
    }
  }

  function initCatalogView() {
    const view = document.getElementById('catalogo-view');
    if (!view) return;

    document.querySelectorAll('[data-open-catalog]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openCatalog();
      });
    });

    document.querySelectorAll('[data-close-catalog]').forEach((el) => {
      el.addEventListener('click', (e) => {
        const href = el.getAttribute('href');
        if (href && href.startsWith('#') && href !== '#catalogo') {
          closeCatalog(false);
          history.pushState({ view: 'home' }, '', href);
          const target = document.querySelector(href);
          if (target) target.scrollIntoView({ behavior: 'smooth' });
          e.preventDefault();
          return;
        }
        e.preventDefault();
        closeCatalog();
      });
    });

    document.querySelectorAll('.site-header a[href^="#"]').forEach((link) => {
      link.addEventListener('click', () => {
        if (isCatalogOpen()) closeCatalog(false);
      });
    });

    document.querySelectorAll('.catalog-view__qcard').forEach((card) => {
      card.addEventListener('click', (e) => {
        const href = card.getAttribute('href');
        if (!href || !href.startsWith('#')) return;
        const sectionId = href.slice(1);
        if (!CATALOG_SECTION_IDS.includes(sectionId)) return;
        e.preventDefault();
        if (!isCatalogOpen()) openCatalog(false, false);
        history.pushState({ view: 'catalog', section: sectionId }, '', href);
        scrollToCatalogSection(sectionId);
      });
    });

    function syncCatalogFromHash() {
      const sectionId = getCatalogSectionFromHash();

      if (location.hash === '#catalogo' || sectionId) {
        openCatalog(false, !sectionId);
        if (sectionId) {
          requestAnimationFrame(() => scrollToCatalogSection(sectionId));
        }
        return;
      }

      if (isCatalogOpen()) closeCatalog(false);
    }

    window.addEventListener('popstate', syncCatalogFromHash);
    window.addEventListener('hashchange', syncCatalogFromHash);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isCatalogOpen()) {
        closeCatalog();
      }
    });

    if (location.hash === '#catalogo') openCatalog(false);
  }

  function initStagger() {
    document.querySelectorAll('.stagger').forEach((container) => {
      Array.from(container.children).forEach((child, index) => {
        child.style.setProperty('--stagger-i', String(index));
      });
    });
  }

  function preloadCarouselSlides(slides) {
    slides.forEach((img) => {
      if (!img || !img.src) return;
      img.loading = 'eager';
      if (!img.complete) {
        const loader = new Image();
        loader.src = img.src;
      }
    });
  }

  function waitForCarouselSlides(slides) {
    preloadCarouselSlides(slides);
    return Promise.all(
      slides.map(
        (img) =>
          new Promise((resolve) => {
            if (!img) {
              resolve(false);
              return;
            }
            if (img.complete) {
              resolve(img.naturalWidth > 0);
              return;
            }
            const timeout = window.setTimeout(() => {
              resolve(img.naturalWidth > 0);
            }, 6000);
            img.addEventListener(
              'load',
              () => {
                window.clearTimeout(timeout);
                resolve(img.naturalWidth > 0);
              },
              { once: true }
            );
            img.addEventListener(
              'error',
              () => {
                window.clearTimeout(timeout);
                resolve(false);
              },
              { once: true }
            );
          })
      )
    );
  }

  function startAutoCarousel(config) {
    const {
      slides,
      dotsRoot,
      interval,
      dotClass,
      onReady,
      onEmpty,
    } = config;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let activeIndex = 0;
    let timer = null;
    const initialSlide =
      slides.find((slide) => slide.classList.contains('is-active')) || slides[0];

    return waitForCarouselSlides(slides).then((results) => {
      const ready = slides.filter((_, i) => results[i]);
      if (!ready.length) {
        if (onEmpty) onEmpty();
        return null;
      }

      if (onReady) onReady(ready);

      slides.forEach((slide) => slide.classList.remove('is-active'));
      activeIndex = Math.max(0, ready.indexOf(initialSlide));
      ready[activeIndex].classList.add('is-active');

      function setActive(index) {
        activeIndex = ((index % ready.length) + ready.length) % ready.length;
        slides.forEach((slide) => slide.classList.remove('is-active'));
        ready[activeIndex].classList.add('is-active');

        if (dotsRoot) {
          dotsRoot.querySelectorAll('.' + dotClass).forEach((dot, i) => {
            dot.classList.toggle('is-active', i === activeIndex);
            dot.setAttribute('aria-selected', i === activeIndex ? 'true' : 'false');
          });
        }
      }

      if (ready.length > 1 && dotsRoot) {
        dotsRoot.innerHTML = '';
        ready.forEach((_, i) => {
          const dot = document.createElement('button');
          dot.type = 'button';
          dot.className = dotClass + (i === activeIndex ? ' is-active' : '');
          dot.setAttribute('role', 'tab');
          dot.setAttribute('aria-label', 'Foto ' + (i + 1));
          dot.setAttribute('aria-selected', i === activeIndex ? 'true' : 'false');
          dot.addEventListener('click', () => {
            setActive(i);
            resetTimer();
          });
          dotsRoot.appendChild(dot);
        });
      }

      function resetTimer() {
        if (timer) window.clearInterval(timer);
        if (!reducedMotion && ready.length > 1 && interval > 0) {
          timer = window.setInterval(() => setActive(activeIndex + 1), interval);
        }
      }

      resetTimer();
      return { setActive, resetTimer };
    });
  }

  function initHeroMedia() {
    const hero = document.querySelector('.hero');
    const carousel = document.querySelector('.hero__carousel');
    const video = document.querySelector('.hero__media-video');
    const dotsRoot = document.querySelector('.hero__carousel-dots');
    if (!hero) return;

    const slides = carousel ? Array.from(carousel.querySelectorAll('.hero__slide')) : [];
    const interval = carousel
      ? parseInt(carousel.getAttribute('data-interval') || '4500', 10)
      : 4500;

    function tryVideo() {
      if (!video) {
        hero.classList.add('hero--no-media');
        return;
      }

      hero.classList.add('hero--has-video');
      hero.classList.remove('hero--has-carousel', 'hero--no-media');

      const playVideo = () => {
        const p = video.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
      };

      playVideo();
      video.addEventListener('canplay', playVideo, { once: true });
      video.addEventListener('loadeddata', playVideo, { once: true });
      video.addEventListener('error', () => {
        hero.classList.remove('hero--has-video');
        hero.classList.add('hero--no-media');
      });
    }

    if (!slides.length) {
      tryVideo();
      return;
    }

    startAutoCarousel({
      slides,
      dotsRoot,
      interval,
      dotClass: 'hero__carousel-dot',
      onReady: () => {
        hero.classList.add('hero--has-carousel');
        hero.classList.remove('hero--has-video', 'hero--no-media');
        if (video) video.pause();
      },
      onEmpty: tryVideo,
    });
  }

  function initEquipCarousel() {
    document.querySelectorAll('[data-carousel="equip"]').forEach((root) => {
      const slides = Array.from(root.querySelectorAll('.equip-carousel__slide'));
      const dotsRoot = root.querySelector('.equip-carousel__dots');
      const fallback = root.querySelector('.equipment-visual');
      const interval = parseInt(root.getAttribute('data-interval') || '4000', 10);
      let carouselControl = null;

      const boot = () => {
        startAutoCarousel({
          slides,
          dotsRoot,
          interval,
          dotClass: 'equip-carousel__dot',
          onReady: () => {
            root.classList.add('is-ready');
            if (fallback) fallback.hidden = true;
          },
          onEmpty: () => {
            root.classList.add('is-empty');
            if (fallback) fallback.hidden = false;
          },
        }).then((control) => {
          carouselControl = control;
        });
      };

      boot();

      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting && carouselControl) {
                carouselControl.resetTimer();
              }
            });
          },
          { threshold: 0.25 }
        );
        io.observe(root);
      }
    });
  }

  function initCounters() {
    const els = document.querySelectorAll('[data-count]');
    if (!els.length || !('IntersectionObserver' in window)) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const run = (el) => {
      const target = parseInt(el.getAttribute('data-count'), 10);
      const suffix = el.getAttribute('data-suffix') || '';
      const prefix = el.getAttribute('data-prefix') || '';
      if (Number.isNaN(target)) return;

      if (reduced) {
        el.textContent = prefix + target + suffix;
        return;
      }

      const duration = 1400;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = prefix + Math.round(target * eased) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            run(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35 }
    );

    els.forEach((el) => io.observe(el));
  }

  function initHeroParallax() {
    const hero = document.querySelector('.hero');
    if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    hero.addEventListener(
      'mousemove',
      (e) => {
        const rect = hero.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        hero.querySelectorAll('.hero__orb').forEach((orb, i) => {
          const factor = (i + 1) * 16;
          orb.style.marginLeft = `${x * factor}px`;
          orb.style.marginTop = `${y * factor}px`;
        });
      },
      { passive: true }
    );

    hero.addEventListener('mouseleave', () => {
      hero.querySelectorAll('.hero__orb').forEach((orb) => {
        orb.style.marginLeft = '';
        orb.style.marginTop = '';
      });
    });
  }

  function initReveal() {
    if (!('IntersectionObserver' in window)) return;
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal--visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => io.observe(el));
  }

  wireWhatsAppLinks();
  wireAcreditacionLinks();
  initWaAssistant();
  setHeaderHeight();
  initCatalogView();
  initPanels();
  initNavScroll();
  initFooterLinks();
  initStagger();
  initHeroMedia();
  initEquipCarousel();
  initHeroParallax();
  initReveal();
  initCounters();
  window.addEventListener('resize', setHeaderHeight, { passive: true });
})();

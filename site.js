(() => {
  'use strict';
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  if (menu && nav) {
    const close = () => { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); menu.textContent = 'Menu'; };
    menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); menu.textContent = open ? 'Close' : 'Menu'; nav.classList.toggle('open', open); });
    nav.addEventListener('click', event => { if (event.target.closest('a')) close(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('open')) { close(); menu.focus(); } });
    document.addEventListener('click', event => { if (!event.target.closest('.site-header')) close(); });
  }
  const clearTranslationCookies = () => {
    const parts = location.hostname.split('.');
    const domains = ['', location.hostname];
    for (let index = 1; index < parts.length - 1; index += 1) domains.push(parts.slice(index).join('.'));
    [...new Set(domains)].forEach(domain => {
      const domainAttribute = domain ? `;domain=.${domain.replace(/^\./, '')}` : '';
      document.cookie = `googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT;Max-Age=0${domainAttribute};SameSite=Lax`;
    });
  };
  const getTranslationLanguage = () => {
    try {
      const saved = localStorage.getItem('portfolio-language');
      if (saved === 'en' || saved === 'fr') return saved;
    } catch (_) {}
    const matches = [...document.cookie.matchAll(/(?:^|;\s*)googtrans=\/en\/(en|fr)(?=;|$)/g)];
    return matches.length ? matches[matches.length - 1][1] : 'en';
  };
  const setTranslationLanguage = language => {
    try { localStorage.setItem('portfolio-language', language); } catch (_) {}
    clearTranslationCookies();
    if (language === 'fr') {
      document.cookie = 'googtrans=/en/fr;path=/;SameSite=Lax';
      document.cookie = `googtrans=/en/fr;path=/;domain=.${location.hostname};SameSite=Lax`;
    }
    location.reload();
  };
  if (nav) {
    document.querySelectorAll('.identity,.monogram,.project-title').forEach(element => {
      element.classList.add('notranslate');
      element.setAttribute('translate', 'no');
    });
    const language = getTranslationLanguage();
    if (language === 'en') clearTranslationCookies();
    const languageSwitch = document.createElement('div');
    languageSwitch.className = 'language-switch notranslate';
    languageSwitch.setAttribute('translate', 'no');
    languageSwitch.setAttribute('role', 'group');
    languageSwitch.setAttribute('aria-label', 'Language / Langue');
    languageSwitch.innerHTML = `<button type="button" data-site-language="en" aria-pressed="${language === 'en'}">EN</button><span aria-hidden="true">/</span><button type="button" data-site-language="fr" aria-pressed="${language === 'fr'}">FR</button>`;
    const primaryButton = nav.querySelector('.button');
    nav.insertBefore(languageSwitch, primaryButton || null);
    languageSwitch.addEventListener('click', event => {
      const button = event.target.closest('[data-site-language]');
      if (!button || button.dataset.siteLanguage === language) return;
      setTranslationLanguage(button.dataset.siteLanguage);
    });
    const translateMount = document.createElement('div');
    translateMount.id = 'google_translate_element';
    translateMount.hidden = true;
    document.body.appendChild(translateMount);
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;
      new window.google.translate.TranslateElement({pageLanguage:'en',includedLanguages:'fr',autoDisplay:false}, 'google_translate_element');
      document.documentElement.lang = language === 'fr' ? 'fr-CA' : 'en';
    };
    if (language === 'fr') {
      const translateScript = document.createElement('script');
      translateScript.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      translateScript.async = true;
      translateScript.referrerPolicy = 'no-referrer-when-downgrade';
      document.head.appendChild(translateScript);
    }
  }
  const header = document.querySelector('.site-header');
  if (header) {
    let scrollAnchor = window.scrollY;
    let scrollFrame = null;
    const revealHeader = () => header.classList.remove('header-hidden');
    const updateHeader = () => {
      const currentY = Math.max(0, window.scrollY);
      const movement = currentY - scrollAnchor;
      const menuOpen = nav && nav.classList.contains('open');
      const headerFocused = header.contains(document.activeElement);
      if (currentY < 80 || menuOpen || headerFocused) {
        revealHeader();
        scrollAnchor = currentY;
      } else if (movement > 10) {
        header.classList.add('header-hidden');
        scrollAnchor = currentY;
      } else if (movement < -8) {
        revealHeader();
        scrollAnchor = currentY;
      }
      scrollFrame = null;
    };
    window.addEventListener('scroll', () => {
      if (scrollFrame === null) scrollFrame = window.requestAnimationFrame(updateHeader);
    }, {passive: true});
    header.addEventListener('focusin', revealHeader);
  }
  const heroPortal = document.querySelector('[data-hero-portal]');
  if (heroPortal && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const portalCards = [...heroPortal.querySelectorAll('[data-portal-depth]')];
    const portalLight = heroPortal.querySelector('.portal-light');
    const resetPortal = () => {
      portalCards.forEach(card => {
        card.style.setProperty('--portal-x', '0px');
        card.style.setProperty('--portal-y', '0px');
      });
      if (portalLight) portalLight.style.transform = 'translate3d(0,0,0)';
    };
    heroPortal.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch') return;
      const rect = heroPortal.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      portalCards.forEach(card => {
        const depth = Number(card.dataset.portalDepth || 1);
        card.style.setProperty('--portal-x', `${(x * 24 * depth).toFixed(2)}px`);
        card.style.setProperty('--portal-y', `${(y * 18 * depth).toFixed(2)}px`);
      });
      if (portalLight) portalLight.style.transform = `translate3d(${(x * 18).toFixed(2)}px,${(y * 14).toFixed(2)}px,0)`;
    });
    heroPortal.addEventListener('pointerleave', resetPortal);
  }
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealTargets = [...document.querySelectorAll('.home-about-copy,.home-about-portrait,.recognition-column,.home-cta>div,.story-section,.about-detail')];
  if (revealTargets.length && 'IntersectionObserver' in window && !reducedMotion) {
    revealTargets.forEach(target => target.classList.add('motion-reveal'));
    document.body.classList.add('motion-ready');
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, {threshold: .01, rootMargin: '0px 0px 12% 0px'});
    revealTargets.forEach(target => revealObserver.observe(target));
  }
  const projectCarousel = document.querySelector('[data-project-carousel]');
  if (projectCarousel) {
    const tabs = [...document.querySelectorAll('[data-project-tab]')];
    const panels = [...projectCarousel.querySelectorAll('[data-project-panel]')];
    let current = 0;
    let wheelReady = true;
    let touchStartX = null;
    let touchStartY = null;
    let touchStartScroll = 0;
    let touchGrid = null;

    const showProjectSection = (requestedIndex, focusTab = false, scrollTab = true) => {
      const nextIndex = Math.max(0, Math.min(panels.length - 1, requestedIndex));
      const direction = nextIndex >= current ? 'right' : 'left';
      current = nextIndex;
      panels.forEach((panel, index) => {
        panel.hidden = index !== current;
        panel.classList.remove('is-from-left', 'is-from-right');
        if (index === current) {
          const grid = panel.querySelector('.project-grid');
          if (grid) grid.scrollLeft = 0;
          void panel.offsetWidth;
          panel.classList.add(direction === 'right' ? 'is-from-right' : 'is-from-left');
        }
      });
      tabs.forEach((tab, index) => {
        const selected = index === current;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        if (selected && scrollTab) tab.scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'center'});
      });
      if (focusTab) tabs[current].focus();
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => showProjectSection(index));
      tab.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        if (event.key === 'Home') showProjectSection(0, true);
        else if (event.key === 'End') showProjectSection(panels.length - 1, true);
        else showProjectSection(current + (event.key === 'ArrowRight' ? 1 : -1), true);
      });
    });
    projectCarousel.addEventListener('keydown', event => {
      if (event.target.closest('a,button') || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      showProjectSection(current + (event.key === 'ArrowRight' ? 1 : -1));
    });
    projectCarousel.addEventListener('wheel', event => {
      if (window.matchMedia('(max-width: 900px)').matches && event.target.closest('.project-grid')) return;
      if (Math.abs(event.deltaX) < 24 || Math.abs(event.deltaX) <= Math.abs(event.deltaY) * 1.15 || !wheelReady) return;
      if ((event.deltaX > 0 && current === panels.length - 1) || (event.deltaX < 0 && current === 0)) return;
      event.preventDefault();
      wheelReady = false;
      showProjectSection(current + (event.deltaX > 0 ? 1 : -1));
      window.setTimeout(() => { wheelReady = true; }, 520);
    }, {passive: false});
    projectCarousel.addEventListener('touchstart', event => {
      touchGrid = event.target.closest('.project-grid');
      if (!touchGrid) return;
      touchStartX = event.changedTouches[0].clientX;
      touchStartY = event.changedTouches[0].clientY;
      touchStartScroll = touchGrid.scrollLeft;
    }, {passive: true});
    projectCarousel.addEventListener('touchend', event => {
      if (!touchGrid || touchStartX === null) return;
      const dx = event.changedTouches[0].clientX - touchStartX;
      const dy = event.changedTouches[0].clientY - touchStartY;
      const maxScroll = Math.max(0, touchGrid.scrollWidth - touchGrid.clientWidth);
      const horizontalSwipe = Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.35;
      if (horizontalSwipe && dx < 0 && touchStartScroll >= maxScroll - 3 && current < panels.length - 1) showProjectSection(current + 1);
      else if (horizontalSwipe && dx > 0 && touchStartScroll <= 3 && current > 0) showProjectSection(current - 1);
      touchGrid = null;
      touchStartX = touchStartY = null;
    }, {passive: true});
    showProjectSection(0, false, false);
  }
  document.querySelectorAll('[data-gallery]').forEach(gallery => {
    const slides = [...gallery.querySelectorAll('.gallery-slide')];
    const dots = [...gallery.querySelectorAll('.gallery-dot')];
    const counter = gallery.querySelector('.gallery-counter');
    const prev = gallery.querySelector('[data-prev]');
    const next = gallery.querySelector('[data-next]');
    let current = 0;
    const show = index => {
      current = Math.max(0, Math.min(slides.length - 1, index));
      slides.forEach((slide, i) => { slide.hidden = i !== current; });
      dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === current)));
      counter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
      prev.disabled = current === 0; next.disabled = current === slides.length - 1;
    };
    prev.addEventListener('click', () => show(current - 1));
    next.addEventListener('click', () => show(current + 1));
    dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));
    gallery.addEventListener('keydown', event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); show(current + (event.key === 'ArrowRight' ? 1 : -1)); } });
    let startX = null, startY = null;
    gallery.addEventListener('touchstart', event => { const screenRow = event.target.closest('.gallery-media.screens'); if (screenRow && screenRow.scrollWidth > screenRow.clientWidth) { startX = null; return; } startX = event.changedTouches[0].screenX; startY = event.changedTouches[0].screenY; }, {passive:true});
    gallery.addEventListener('touchend', event => { if (startX === null) return; const dx = event.changedTouches[0].screenX - startX; const dy = event.changedTouches[0].screenY - startY; if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1)); startX = null; }, {passive:true});
    show(0);
  });
  const sections = document.querySelectorAll('.story-section[id]');
  if (sections.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { document.querySelectorAll('.case-nav a').forEach(link => { const active = link.getAttribute('href') === `#${entry.target.id}`; link.classList.toggle('active', active); if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); }); } }); }, {rootMargin:'-15% 0px -65% 0px'});
    sections.forEach(section => observer.observe(section));
  }
  const video = document.querySelector('video');
  if (video) {
    const status = document.querySelector('.film-status');
    video.addEventListener('play', () => { if (status) status.textContent = 'Playing the 30-second motion study.'; });
    video.addEventListener('pause', () => { if (status) status.textContent = video.ended ? 'The motion study has finished. Use the player controls to replay.' : 'Paused. Use the player controls to continue.'; });
    const showError = () => { if (status) status.textContent = 'The video could not load here. You can watch it using the original portfolio link above.'; };
    video.addEventListener('error', showError);
    video.querySelector('source').addEventListener('error', showError);
  }
})();

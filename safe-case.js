(() => {
  'use strict';
  const nav = document.querySelector('[data-sf-nav]');
  if (!nav) return;
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const sections = links.map(link => document.getElementById(link.hash.slice(1)));
  let frame = 0;
  const update = () => {
    const line = Math.min(190, innerHeight * .28);
    let active = 0;
    sections.forEach((section, index) => { if (section && section.getBoundingClientRect().top <= line) active = index; });
    links.forEach((link, index) => index === active ? link.setAttribute('aria-current', 'location') : link.removeAttribute('aria-current'));
    frame = 0;
  };
  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(update); }, {passive:true});
  addEventListener('resize', update, {passive:true});
  update();
})();

(() => {
  'use strict';
  const demo = document.querySelector('[data-sf-product]');
  if (!demo) return;
  const tabs = [...demo.querySelectorAll('[role="tab"]')];
  const copy = demo.querySelector('.sf-product-copy');
  const phones = [...demo.querySelectorAll('.sf-product-phone img')];
  const reelIndex = demo.querySelector('[data-sf-reel-index]');
  const reelLabel = demo.querySelector('[data-sf-reel-label]');
  const reelProgress = demo.querySelector('[data-sf-reel-progress]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const states = [
    {step:'01 / PREPARE', title:'Put essential information within one reach.', body:'Quick actions, emergency contacts, medical ID, offline maps, and device tools are grouped by the job they support—not by technical ownership.', bullets:['Persistent emergency action','Editable quick access','Offline-aware settings'], frames:[
      ['Home overview','/assets/safe-case-v3/phone-home.webp'],
      ['Medical ID','/assets/safe-case-v3/phone-medical.webp'],
      ['Settings','/assets/safe-case-v3/phone-settings.webp'],
      ['Device tools','/assets/safe-case-v3/phone-tools.webp'],
      ['AI assistant','/assets/safe-case-v3/phone-ai-chat.webp']
    ]},
    {step:'02 / RESPOND', title:'Show what is happening right now.', body:'The emergency state separates calling, alerting contacts, and sharing location so progress is visible instead of hidden behind one generic confirmation.', bullets:['Hold-to-activate protection','Separate service status','Route remains available'], frames:[
      ['Emergency actions','/assets/safe-case-v3/phone-sos.webp'],
      ['SOS active','/assets/safe-case-v3/phone-sos-active.webp'],
      ['Call options','/assets/safe-case-v3/phone-call.webp'],
      ['Offline message','/assets/safe-case-v3/phone-call-message.webp'],
      ['Risk map','/assets/safe-case-v3/phone-map-overview.webp'],
      ['Destination detail','/assets/safe-case-v3/phone-map-destination.webp']
    ]},
    {step:'03 / LEARN', title:'Turn guidance into something usable.', body:'First-aid instructions, visual topics, and short practice scenarios make preparedness part of the same product rather than a disconnected content library.', bullets:['Action-first instructions','Video and text modes','Short scenario practice'], frames:[
      ['Preparedness library','/assets/safe-case-v3/phone-learn-library.webp'],
      ['Guide collection','/assets/safe-case-v3/phone-map-guides.webp'],
      ['Action steps','/assets/safe-case-v3/phone-learn-steps.webp'],
      ['Video mode','/assets/safe-case-v3/phone-learn-video.webp'],
      ['Practice library','/assets/safe-case-v3/phone-game-library.webp'],
      ['Scenario detail','/assets/safe-case-v3/phone-game-detail.webp']
    ]}
  ];
  let active = 0, frameIndex = 0, timer;
  function paintFrame(animate=true) {
    const frames = states[active].frames;
    const current = frames[frameIndex];
    const next = frames[(frameIndex + 1) % frames.length];
    phones[1].src = current[1];
    phones[0].src = next[1];
    reelIndex.textContent = `${String(frameIndex + 1).padStart(2,'0')} / ${String(frames.length).padStart(2,'0')}`;
    reelLabel.textContent = current[0];
    reelProgress.style.width = `${((frameIndex + 1) / frames.length) * 100}%`;
    demo.classList.remove('is-running');
    void demo.offsetWidth;
    if (!reduced) demo.classList.add('is-running');
    if (!reduced && animate) {
      phones[1].parentElement.animate([
        {opacity:.1, transform:'translate3d(18px,26px,0) rotate(8deg) scale(.965)'},
        {opacity:1, transform:'rotate(5deg)'}
      ], {duration:620, easing:'cubic-bezier(.16,1,.3,1)'});
      demo.querySelector('.sf-reel-status').animate([{opacity:.35},{opacity:1}], {duration:420});
    }
  }
  function show(index, manual=false) {
    active = index;
    frameIndex = 0;
    tabs.forEach((tab, i) => tab.setAttribute('aria-selected', String(i === index)));
    const state = states[index];
    if (!reduced) copy.animate([{opacity:.15, transform:'translateY(10px)'},{opacity:1, transform:'none'}], {duration:420, easing:'cubic-bezier(.2,.8,.2,1)'});
    copy.querySelector('.sf-step').textContent = state.step;
    copy.querySelector('h3').textContent = state.title;
    copy.querySelector('p:nth-of-type(2)').textContent = state.body;
    copy.querySelector('ul').innerHTML = state.bullets.map(item => `<li>${item}</li>`).join('');
    paintFrame(false);
    if (manual) restart();
  }
  function restart() {
    clearInterval(timer);
    if (!reduced) timer = setInterval(() => {
      if (frameIndex + 1 < states[active].frames.length) {
        frameIndex += 1;
        paintFrame();
      } else {
        show((active + 1) % states.length);
      }
    }, 3000);
  }
  tabs.forEach((tab, index) => tab.addEventListener('click', () => show(index, true)));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => entries[0].isIntersecting ? restart() : clearInterval(timer), {threshold:.16}).observe(demo);
  } else restart();
  show(0);
})();

(() => {
  'use strict';
  const dialog = document.querySelector('.sf-viewer');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const image = dialog.querySelector('.sf-viewer-image');
  const title = dialog.querySelector('#sf-viewer-title');
  let trigger;
  document.querySelectorAll('.sf-openable').forEach(item => {
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', `Open full image: ${item.dataset.title}`);
    const open = () => {
      trigger = item;
      image.src = item.dataset.sfOpen;
      image.alt = item.dataset.title || '';
      title.textContent = item.dataset.title || 'Project artifact';
      dialog.showModal();
      document.body.classList.add('sf-image-open');
    };
    item.addEventListener('click', open);
    item.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
  });
  dialog.querySelector('.sf-viewer-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { document.body.classList.remove('sf-image-open'); trigger?.focus({preventScroll:true}); });
})();

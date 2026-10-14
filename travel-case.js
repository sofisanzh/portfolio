(() => {
  'use strict';
  const nav = document.querySelector('[data-tr-chapters]');
  if (!nav) return;
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const sections = links.map(link => document.getElementById(link.hash.slice(1)));
  let frame = 0;
  function update(){
    const line = Math.min(190, window.innerHeight * .28);
    let active = 0;
    sections.forEach((section,index) => { if (section && section.getBoundingClientRect().top <= line) active=index; });
    links.forEach((link,index) => index===active ? link.setAttribute('aria-current','location') : link.removeAttribute('aria-current'));
    frame=0;
  }
  window.addEventListener('scroll',()=>{if(!frame) frame=requestAnimationFrame(update)},{passive:true});
  window.addEventListener('resize',update,{passive:true});
  update();
})();
(() => {
  'use strict';
  const demo = document.querySelector('[data-tr-demo]');
  if (!demo) return;
  const tabs=[...demo.querySelectorAll('[role="tab"]')];
  const copy=demo.querySelector('.tr-demo-copy');
  const phones=[...demo.querySelectorAll('.tr-phone img')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const states=[
    {step:'01 / Discover',title:'Filter before the map becomes noise.',body:'Category chips turn a dense city map into a more intentional set of choices. The active filter is reinforced through colour and marker content.',images:['../../assets/travel-case/map-home.webp','../../assets/travel-case/map-filtered.webp']},
    {step:'02 / Understand',title:'Reveal context in layers.',body:'A street marker becomes a compact place card before expanding into detailed information. Orientation is preserved while the user decides whether to go deeper.',images:['../../assets/travel-case/ar-discovery.webp','../../assets/travel-case/ar-place-preview.webp']},
    {step:'03 / Navigate',title:'Choose context or overview.',body:'The same destination can continue into camera guidance or a familiar map route. Distance and place context remain visible across the handoff.',images:['../../assets/travel-case/navigation-choice.webp','../../assets/travel-case/ar-route.webp']}
  ];
  let active=0,timer;
  function show(index,manual=false){
    active=index;
    tabs.forEach((tab,i)=>tab.setAttribute('aria-selected',String(i===index)));
    const state=states[index];
    copy.animate([{opacity:.25,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:360,easing:'ease-out'});
    copy.querySelector('.tr-demo-step').textContent=state.step;
    copy.querySelector('h3').textContent=state.title;
    copy.querySelector('p:last-child').textContent=state.body;
    phones.forEach((phone,i)=>{phone.src=state.images[i]; phone.parentElement.animate([{opacity:.25,transform:`translateY(12px) rotate(${i?-1:-7}deg)`},{opacity:1}],{duration:480,easing:'ease-out'});});
    demo.classList.remove('is-running'); void demo.offsetWidth; if(!reduced) demo.classList.add('is-running');
    if(manual) restart();
  }
  function restart(){clearInterval(timer);if(!reduced)timer=setInterval(()=>show((active+1)%states.length),5000)}
  tabs.forEach((tab,index)=>tab.addEventListener('click',()=>show(index,true)));
  if('IntersectionObserver' in window){new IntersectionObserver(entries=>{if(entries[0].isIntersecting)restart();else clearInterval(timer)},{threshold:.18}).observe(demo)}else restart();
  show(0);
})();


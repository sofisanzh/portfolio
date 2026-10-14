(()=>{
  const links=[...document.querySelectorAll('[data-bk-nav] a')];
  const sections=links.map(link=>document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!visible)return;
      links.forEach(link=>link.classList.toggle('is-active',link.getAttribute('href')==='#'+visible.target.id));
    },{rootMargin:'-18% 0px -58%',threshold:[0,.15,.4]});
    sections.forEach(section=>observer.observe(section));
  }
  const heroShowcase=document.querySelector('[data-bk-hero-showcase]');
  if(heroShowcase){
    const heroSlides=[...heroShowcase.querySelectorAll('[data-bk-hero-slide]')];
    const heroCount=heroShowcase.querySelector('[data-bk-hero-count]');
    let heroIndex=0;
    const showHeroSlide=index=>{
      heroIndex=index%heroSlides.length;
      heroSlides.forEach((slide,slideIndex)=>slide.classList.toggle('is-active',slideIndex===heroIndex));
      if(heroCount)heroCount.textContent=String(heroIndex+1).padStart(2,'0')+' / '+String(heroSlides.length).padStart(2,'0');
    };
    if(heroSlides.length>1&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
      window.setInterval(()=>showHeroSlide(heroIndex+1),3400);
    }
  }
  const shell=document.querySelector('[data-bk-rail]');
  if(!shell)return;
  const rail=shell.querySelector('.bk-rail');
  const cards=[...rail.querySelectorAll('figure')];
  const output=shell.querySelector('output');
  const move=direction=>{
    const gap=parseFloat(getComputedStyle(rail).gap)||0;
    rail.scrollBy({left:direction*(cards[0].getBoundingClientRect().width+gap),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  };
  shell.querySelector('[data-bk-prev]').addEventListener('click',()=>move(-1));
  shell.querySelector('[data-bk-next]').addEventListener('click',()=>move(1));
  const update=()=>{
    const left=rail.getBoundingClientRect().left;
    let closest=0,distance=Infinity;
    cards.forEach((card,index)=>{const d=Math.abs(card.getBoundingClientRect().left-left);if(d<distance){distance=d;closest=index;}});
    output.value=String(closest+1).padStart(2,'0')+' / '+String(cards.length).padStart(2,'0');
  };
  rail.addEventListener('scroll',update,{passive:true});
  update();
})();

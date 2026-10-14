(()=>{
  const hero=document.querySelector('[data-jz-record]');
  if(hero){
    const images=[...hero.querySelectorAll('.jz-record-stack img')];
    const buttons=[...hero.querySelectorAll('[data-jz-side]')];
    const spin=hero.querySelector('[data-jz-spin]');
    let current=0,timer;
    const show=index=>{
      current=index;
      images.forEach((image,i)=>image.classList.toggle('is-active',i===index));
      buttons.forEach((button,i)=>{button.classList.toggle('is-active',i===index);button.setAttribute('aria-pressed',String(i===index));});
    };
    const start=()=>{clearInterval(timer);if(!hero.classList.contains('is-paused')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)timer=setInterval(()=>show((current+1)%images.length),4200);};
    buttons.forEach(button=>button.addEventListener('click',()=>{show(Number(button.dataset.jzSide));start();}));
    spin.addEventListener('click',()=>{
      const paused=hero.classList.toggle('is-paused');
      spin.setAttribute('aria-pressed',String(!paused));
      spin.lastChild.textContent=paused?' Start motion':' Pause motion';
      if(paused)clearInterval(timer);else start();
    });
    start();
  }
  const links=[...document.querySelectorAll('[data-jz-nav] a')];
  const sections=links.map(link=>document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!visible)return;
      links.forEach(link=>link.classList.toggle('is-active',link.getAttribute('href')==='#'+visible.target.id));
    },{rootMargin:'-18% 0px -58%',threshold:[0,.15,.4]});
    sections.forEach(section=>observer.observe(section));
  }
})();

(()=>{
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav=document.querySelector('[data-lp-nav]');
  const links=[...(nav?.querySelectorAll('a')||[])];
  const sections=links.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if(sections.length){
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!visible)return;
      links.forEach(a=>a.classList.toggle('is-active',a.getAttribute('href')==='#'+visible.target.id));
    },{rootMargin:'-24% 0px -58% 0px',threshold:[0,.2,.5]});
    sections.forEach(section=>observer.observe(section));
  }

  const marquee=document.querySelector('[data-lp-marquee]');
  const pause=document.querySelector('[data-lp-pause]');
  pause?.addEventListener('click',()=>{
    const paused=marquee.classList.toggle('is-paused');
    pause.setAttribute('aria-pressed',String(paused));
    pause.querySelector('span').textContent=paused?'Resume movement':'Pause movement';
  });

  const stage=document.querySelector('[data-lp-stage]');
  if(stage){
    const images=[...stage.querySelectorAll('.lp-stage-visual img')];
    const count=stage.querySelector('[data-lp-count]');
    const title=stage.querySelector('[data-lp-title]');
    const titles=['Structure becomes a voice.','The sentence gathers into a pulse.','Many voices form one centre.','The meaning survives inversion.'];
    let index=0,timer;
    const show=next=>{
      index=(next+images.length)%images.length;
      images.forEach((img,i)=>img.classList.toggle('is-active',i===index));
      count.textContent=String(index+1).padStart(2,'0');
      title.textContent=titles[index];
    };
    const restart=()=>{if(!reduce){clearInterval(timer);timer=setInterval(()=>show(index+1),3600)}};
    stage.querySelector('[data-lp-prev]').addEventListener('click',()=>{show(index-1);restart()});
    stage.querySelector('[data-lp-next]').addEventListener('click',()=>{show(index+1);restart()});
    stage.addEventListener('mouseenter',()=>clearInterval(timer));
    stage.addEventListener('mouseleave',restart);
    restart();
  }

  if(!reduce){
    const reveal=[...document.querySelectorAll('.lp-heading,.lp-thesis,.lp-grammar,.lp-stage,.lp-boards,.lp-result')];
    reveal.forEach(el=>el.classList.add('lp-reveal'));
    const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target)}
    }),{threshold:.12});
    reveal.forEach(el=>revealObserver.observe(el));
  }
})();

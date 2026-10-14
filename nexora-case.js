(()=>{
  const links=[...document.querySelectorAll('[data-nx-nav] a')];
  const sections=links.map(link=>document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if(!('IntersectionObserver' in window))return;
  const observer=new IntersectionObserver(entries=>{
    const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(!visible)return;
    links.forEach(link=>link.classList.toggle('is-active',link.getAttribute('href')==='#'+visible.target.id));
  },{rootMargin:'-18% 0px -58%',threshold:[0,.15,.4]});
  sections.forEach(section=>observer.observe(section));
})();

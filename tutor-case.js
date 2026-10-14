(() => {
  'use strict';
  const scene = document.querySelector('[data-tc-hero-scene]');
  const canvas = scene?.querySelector('.tc-product-canvas');
  if (!scene || !canvas) return;
  const gl = canvas.getContext('webgl', {alpha:true, antialias:true, premultipliedAlpha:true});
  if (!gl) return;

  const vertexSource = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec2 aUv;
    uniform mat4 uMvp;
    uniform mat4 uModel;
    varying vec3 vNormal;
    varying vec3 vWorld;
    varying vec2 vUv;
    void main(){
      vec4 world=uModel*vec4(aPosition,1.0);
      vWorld=world.xyz;
      vNormal=mat3(uModel)*aNormal;
      vUv=aUv;
      gl_Position=uMvp*vec4(aPosition,1.0);
    }`;
  const fragmentSource = `
    precision highp float;
    uniform sampler2D uTexture;
    uniform vec3 uColour;
    uniform float uTextured;
    varying vec3 vNormal;
    varying vec3 vWorld;
    varying vec2 vUv;
    void main(){
      if(uTextured>.5){
        vec4 tex=texture2D(uTexture,vUv);
        if(tex.a<.02) discard;
        gl_FragColor=tex;
        return;
      }
      vec3 n=normalize(vNormal);
      vec3 light=normalize(vec3(-.65,.85,1.35));
      float diffuse=max(dot(n,light),0.0);
      float edge=pow(1.0-max(dot(n,normalize(vec3(0.0,0.0,1.0))),0.0),2.2);
      float shine=pow(max(dot(reflect(-light,n),normalize(vec3(0.0,0.0,1.0))),0.0),28.0);
      vec3 colour=uColour*(.24+diffuse*.72)+vec3(.62,.65,.72)*shine*.82+vec3(.16,.02,.035)*edge;
      gl_FragColor=vec4(colour,1.0);
    }`;

  function shader(type, source){
    const item=gl.createShader(type); gl.shaderSource(item,source); gl.compileShader(item);
    if(!gl.getShaderParameter(item,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(item));
    return item;
  }
  let program;
  try{
    program=gl.createProgram();
    gl.attachShader(program,shader(gl.VERTEX_SHADER,vertexSource));
    gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragmentSource));
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  }catch(error){ return; }
  gl.useProgram(program);
  const locations={
    position:gl.getAttribLocation(program,'aPosition'),normal:gl.getAttribLocation(program,'aNormal'),uv:gl.getAttribLocation(program,'aUv'),
    mvp:gl.getUniformLocation(program,'uMvp'),model:gl.getUniformLocation(program,'uModel'),colour:gl.getUniformLocation(program,'uColour'),
    textured:gl.getUniformLocation(program,'uTextured'),texture:gl.getUniformLocation(program,'uTexture')
  };

  const multiply=(a,b)=>{const out=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let v=0;for(let k=0;k<4;k++)v+=a[k*4+r]*b[c*4+k];out[c*4+r]=v;}return out;};
  const identity=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  const translate=(x,y,z)=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,x,y,z,1]);
  const scale=(x,y,z)=>new Float32Array([x,0,0,0,0,y,0,0,0,0,z,0,0,0,0,1]);
  const rotateX=a=>{const c=Math.cos(a),s=Math.sin(a);return new Float32Array([1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]);};
  const rotateY=a=>{const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]);};
  const rotateZ=a=>{const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]);};
  const perspective=(fov,aspect,near,far)=>{const f=1/Math.tan(fov/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);};

  function contour(width,height,radius,steps=7){
    const points=[];
    [[width/2-radius,height/2-radius,0],[ -width/2+radius,height/2-radius,Math.PI/2],[-width/2+radius,-height/2+radius,Math.PI],[width/2-radius,-height/2+radius,Math.PI*1.5]].forEach(([cx,cy,start])=>{
      for(let i=0;i<=steps;i++){const a=start+i*Math.PI/2/steps;points.push([cx+Math.cos(a)*radius,cy+Math.sin(a)*radius]);}
    });
    return points;
  }
  function phoneGeometry(width,height,depth,radius){
    const points=contour(width,height,radius),positions=[],normals=[],uv=[];
    const push=(p,n,t=[0,0])=>{positions.push(...p);normals.push(...n);uv.push(...t);};
    for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length];
      push([0,0,depth/2],[0,0,1]);push([a[0],a[1],depth/2],[0,0,1]);push([b[0],b[1],depth/2],[0,0,1]);
      push([0,0,-depth/2],[0,0,-1]);push([b[0],b[1],-depth/2],[0,0,-1]);push([a[0],a[1],-depth/2],[0,0,-1]);
      const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),n=[dy/length,-dx/length,0];
      push([a[0],a[1],depth/2],n);push([a[0],a[1],-depth/2],n);push([b[0],b[1],-depth/2],n);
      push([a[0],a[1],depth/2],n);push([b[0],b[1],-depth/2],n);push([b[0],b[1],depth/2],n);
    }
    return {positions,normals,uv};
  }
  function screenGeometry(width,height,z,radius){
    const points=contour(width,height,radius),positions=[],normals=[],uv=[];
    const add=(x,y)=>{positions.push(x,y,z);normals.push(0,0,1);uv.push((x+width/2)/width,(y+height/2)/height);};
    for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];add(0,0);add(a[0],a[1]);add(b[0],b[1]);}
    return {positions,normals,uv};
  }
  function mesh(data){
    const result={count:data.positions.length/3};
    [['position',data.positions],['normal',data.normals],['uv',data.uv]].forEach(([name,values])=>{
      const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);result[name]=buffer;
    });
    return result;
  }
  function bind(item){
    [['position',3,locations.position],['normal',3,locations.normal],['uv',2,locations.uv]].forEach(([name,size,location])=>{
      gl.bindBuffer(gl.ARRAY_BUFFER,item[name]);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,0,0);
    });
  }
  const width=1.22,height=2.48,depth=.19,radius=.16;
  const body=mesh(phoneGeometry(width,height,depth,radius));
  const screen=mesh(screenGeometry(width*.965,height*.982,depth/2+.012,radius*.88));
  const whiteTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,whiteTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
  function loadTexture(src){
    return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);resolve(texture);};image.onerror=reject;image.src=src;});
  }
  const assets=['/assets/tutor-17.png','/assets/tutor-07-clean.png','/assets/tutor-20.png'];
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pointerX=0,pointerY=0,targetX=0,targetY=0,visible=true,animation=0,textures=[];
  scene.addEventListener('pointermove',event=>{const rect=scene.getBoundingClientRect();targetX=((event.clientX-rect.left)/rect.width-.5)*.22;targetY=((event.clientY-rect.top)/rect.height-.5)*-.14;},{passive:true});
  scene.addEventListener('pointerleave',()=>{targetX=0;targetY=0;});
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible&&!animation)animation=requestAnimationFrame(render);},{threshold:.02}).observe(scene);

  function resize(){
    const rect=canvas.getBoundingClientRect(),ratio=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,Math.round(rect.width*ratio)),h=Math.max(1,Math.round(rect.height*ratio));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}return w/h;
  }
  function draw(model,texture){
    const aspect=resize(),projection=perspective(Math.PI/4.7,aspect,.1,30),view=translate(0,0,-5.9),mvp=multiply(projection,multiply(view,model));
    gl.uniformMatrix4fv(locations.model,false,model);gl.uniformMatrix4fv(locations.mvp,false,mvp);gl.uniform3f(locations.colour,.075,.078,.09);gl.uniform1f(locations.textured,0);gl.bindTexture(gl.TEXTURE_2D,whiteTexture);bind(body);gl.drawArrays(gl.TRIANGLES,0,body.count);
    gl.uniform1f(locations.textured,1);gl.bindTexture(gl.TEXTURE_2D,texture);bind(screen);gl.drawArrays(gl.TRIANGLES,0,screen.count);
  }
  function render(time=0){
    animation=0;if(!visible)return;
    pointerX+=(targetX-pointerX)*.055;pointerY+=(targetY-pointerY)*.055;
    const aspect=resize(),compact=aspect<.9;
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.uniform1i(locations.texture,0);
    const t=reduced?0:time*.001,group=multiply(rotateX(-.055+pointerY+Math.sin(t*.42)*.025),rotateY(pointerX+Math.sin(t*.31)*.10));
    const phones=[
      {x:compact?-1.02:-1.36,y:-.02+Math.sin(t*.72)*.05,z:-.24,ry:.54,rz:-.08,s:compact?.7:.84},
      {x:0,y:.08+Math.sin(t*.72+2)*.065,z:.48,ry:Math.sin(t*.38)*.08,rz:-.018,s:compact?.9:1},
      {x:compact?1.02:1.36,y:-.05+Math.sin(t*.72+4)*.05,z:-.28,ry:-.54,rz:.08,s:compact?.7:.84}
    ];
    phones.forEach((phone,index)=>{let local=multiply(translate(phone.x,phone.y,phone.z),multiply(rotateY(phone.ry),multiply(rotateZ(phone.rz),scale(phone.s,phone.s,phone.s))));draw(multiply(group,local),textures[index]);});
    if(!reduced)animation=requestAnimationFrame(render);
  }
  Promise.all(assets.map(loadTexture)).then(items=>{textures=items;scene.classList.add('is-webgl');render(0);}).catch(()=>{});
  window.addEventListener('resize',()=>{if(textures.length&&reduced)render(0);},{passive:true});
})();

(() => {
  'use strict';
  const nav = document.querySelector('[data-tc-chapters]');
  if (!nav) return;
  const page = document.querySelector('.tc-page');
  const bar = document.querySelector('.tc-story-nav');
  const header = document.querySelector('.site-header');
  const story = document.querySelector('.tc-story-content');
  const compact = window.matchMedia('(max-width: 1100px)');
  const chapters = [...nav.querySelectorAll('a[href^="#"]')].map(link => ({
    link, section: document.getElementById(link.hash.slice(1))
  })).filter(chapter => chapter.section);
  if (!chapters.length) return;
  let active = -1;
  let activationLine = 100;
  let frame = null;

  function setActive(index) {
    if (active === index) return;
    active = index;
    chapters.forEach(({link}, position) => {
      if (position === index) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    if (compact.matches) {
      const link = chapters[index].link;
      const left = link.offsetLeft;
      const right = left + link.offsetWidth;
      if (left < nav.scrollLeft) nav.scrollLeft = Math.max(0, left - 8);
      else if (right > nav.scrollLeft + nav.clientWidth) nav.scrollLeft = right - nav.clientWidth + 8;
    }
  }

  function updateChapter() {
    let index = 0;
    chapters.forEach(({section}, position) => {
      if (section.getBoundingClientRect().top <= activationLine) index = position;
    });
    setActive(index);
    frame = null;
  }

  function queueUpdate() {
    if (frame === null) frame = window.requestAnimationFrame(updateChapter);
  }

  function measureLayout() {
    const headerHeight = header ? header.offsetHeight : 0;
    activationLine = headerHeight + (compact.matches ? bar.offsetHeight + 24 : 32);
    page.style.setProperty('--tc-header-height', `${headerHeight}px`);
    page.style.setProperty('--tc-chapter-offset', `${activationLine}px`);
    queueUpdate();
  }

  chapters.forEach(({link}, index) => link.addEventListener('click', event => {
    if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) setActive(index);
  }));
  window.addEventListener('scroll', queueUpdate, {passive: true});
  window.addEventListener('resize', measureLayout, {passive: true});
  window.addEventListener('hashchange', queueUpdate);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(measureLayout);
    observer.observe(bar);
    observer.observe(story);
    if (header) observer.observe(header);
  }
  if (document.fonts) document.fonts.ready.then(measureLayout);
  measureLayout();
})();

(() => {
  'use strict';
  const dialog = document.querySelector('.tc-viewer');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const image = dialog.querySelector('.tc-viewer-image');
  const title = dialog.querySelector('#tc-viewer-title');
  const caption = dialog.querySelector('#tc-viewer-caption');
  let trigger;
  document.querySelectorAll('[data-tc-enlarge]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      trigger = link;
      image.src = link.href;
      image.alt = link.querySelector('img').alt;
      title.textContent = link.dataset.title;
      caption.textContent = link.dataset.caption;
      dialog.showModal();
      document.body.classList.add('tc-image-open');
    });
  });
  dialog.querySelector('.tc-viewer-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('tc-image-open');
    if (trigger) trigger.focus({preventScroll: true});
  });
})();

(() => {
  'use strict';
  const root = document.querySelector('[data-tc-prototype-legacy]');
  if (!root) return;

  const screens = [
    {
      src: '/assets/tutor-07-clean.png',
      alt: 'Calendar home screen with Book a Tutor action.',
      title: 'Start with the student’s task.',
      description: 'The calendar keeps the primary action visible: begin a tutor booking.',
      hint: 'Select “Book a Tutor” on the phone.',
      action: 'Book a Tutor',
      box: [10, 65, 80, 6]
    },
    {
      src: '/assets/tutor-11.png',
      alt: 'Campus, subject, and delivery method selection screen.',
      title: 'Set the context first.',
      description: 'Campus, subject, and delivery method establish what the student needs before availability appears.',
      hint: 'Select “Continue” on the phone.',
      action: 'Continue',
      box: [9, 63, 82, 6]
    },
    {
      src: '/assets/tutor-14-clean.png',
      alt: 'Available tutoring times before a session is selected.',
      title: 'Make availability readable.',
      description: 'Available and unavailable times are separated into clear options instead of a compressed weekly table.',
      hint: 'Select “10:00 AM” on the phone.',
      action: '10:00 AM',
      box: [52, 46, 38, 5]
    },
    {
      src: '/assets/tutor-15.png',
      alt: 'Available tutoring times with 10:00 AM selected in red.',
      title: 'Make the choice unmistakable.',
      description: 'The selected time uses a strong state change before the student continues.',
      hint: 'Select “Continue” on the phone.',
      action: 'Continue',
      box: [9, 73, 82, 6]
    },
    {
      src: '/assets/tutor-16.png',
      alt: 'Booking review screen with campus, subject, date, time, and delivery details.',
      title: 'Pause for review.',
      description: 'A dedicated summary lets the student verify every decision before the booking is submitted.',
      hint: 'Select “Continue” on the phone.',
      action: 'Continue',
      box: [9, 64, 82, 6]
    },
    {
      src: '/assets/tutor-17.png',
      alt: 'Booking confirmation screen with a Manage Bookings action.',
      title: 'Close the loop clearly.',
      description: 'Confirmation restates the session details before asking the student what they want to do next.',
      hint: 'Select “Finish” on the phone.',
      action: 'Finish',
      box: [9, 60, 37, 7]
    },
    {
      src: '/assets/tutor-07-clean.png',
      alt: 'Calendar home screen with Manage Bookings available as a next action.',
      title: 'Return without losing the next step.',
      description: 'Finish returns the student to the familiar home screen, where existing appointments remain one clear action away.',
      hint: 'Select “Manage Bookings” on the phone.',
      action: 'Manage Bookings',
      box: [10, 83, 39, 9]
    },
    {
      src: '/assets/tutor-20.png',
      alt: 'Manage Bookings screen with appointment status and actions.',
      title: 'Keep every booking actionable.',
      description: 'Upcoming sessions are organized into cards with status, information, rescheduling, and cancellation controls.',
      hint: 'Walkthrough complete. Restart it or revisit any step.',
      action: null,
      box: null
    }
  ];

  screens.forEach(screen => {
    const preload = new Image();
    preload.src = screen.src;
  });

  const image = root.querySelector('[data-tc-prototype-image]');
  const title = root.querySelector('[data-tc-prototype-title]');
  const description = root.querySelector('[data-tc-prototype-description]');
  const hint = root.querySelector('[data-tc-prototype-hint]');
  const action = root.querySelector('[data-tc-prototype-action]');
  const back = root.querySelector('[data-tc-prototype-back]');
  const restart = root.querySelector('[data-tc-prototype-restart]');
  const status = root.querySelector('[data-tc-prototype-status]');
  const stepButtons = [...root.querySelectorAll('[data-tc-prototype-step]')];
  let current = 0;
  let timer;
  let autoTimer;

  function applyScreen(index) {
    const screen = screens[index];
    window.clearTimeout(autoTimer);
    current = index;
    image.src = screen.src;
    image.alt = screen.alt;
    title.textContent = screen.title;
    description.textContent = screen.description;
    hint.textContent = screen.hint;
    status.textContent = `${index + 1} / ${screens.length}`;
    back.disabled = index === 0;
    stepButtons.forEach((button, position) => {
      if (position === index) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    if (screen.action) {
      const [x, y, width, height] = screen.box;
      action.hidden = false;
      action.style.setProperty('--tc-hotspot-x', `${x}%`);
      action.style.setProperty('--tc-hotspot-y', `${y}%`);
      action.style.setProperty('--tc-hotspot-w', `${width}%`);
      action.style.setProperty('--tc-hotspot-h', `${height}%`);
      action.setAttribute('aria-label', `${screen.action} and continue to the next screen`);
      action.querySelector('span').textContent = screen.action;
    } else {
      action.hidden = true;
    }
    if (screen.autoAdvance) autoTimer = window.setTimeout(() => showScreen(index + 1), screen.autoAdvance);
  }

  function showScreen(index) {
    const next = Math.max(0, Math.min(index, screens.length - 1));
    window.clearTimeout(timer);
    window.clearTimeout(autoTimer);
    image.classList.add('is-changing');
    timer = window.setTimeout(() => {
      applyScreen(next);
      window.requestAnimationFrame(() => image.classList.remove('is-changing'));
    }, 170);
  }

  action.addEventListener('click', () => {
    action.classList.remove('is-pressing');
    void action.offsetWidth;
    action.classList.add('is-pressing');
    window.setTimeout(() => {
      action.classList.remove('is-pressing');
      showScreen(current + 1);
    }, 180);
  });
  back.addEventListener('click', () => showScreen(current - 1));
  restart.addEventListener('click', () => showScreen(0));
  stepButtons.forEach(button => button.addEventListener('click', () => showScreen(Number(button.dataset.tcPrototypeStep))));
  applyScreen(0);
})();

(() => {
const work=document.getElementById('home-work');
const slides=[
{image:'once-corazones-en-cancha.webp',club:'Once Corazones',title:'Los colores salen a la cancha',text:'Un recorrido por los trabajos de ToroTreinta para el club. Fotografías de portfolio.'},
{image:'camiseta-4-julio-real.webp',club:'4 de Julio',title:'Identidad en cada camiseta',text:'Indumentaria personalizada: colores y detalles que representan al equipo.'},
{image:'coleccion-once-corazones.webp',club:'Once Corazones',title:'Una colección con identidad',text:'Prendas y propuestas trabajadas para acompañar al club dentro y fuera de la cancha.'},
{image:'pedidos-taller-4-julio.webp',club:'4 de Julio',title:'Del diseño a la producción',text:'El trabajo detrás de cada prenda también forma parte de nuestra historia.'},
{image:'escudo-tpu-4-julio.webp',club:'4 de Julio',title:'Detalles que nos representan',text:'Aplicaciones y terminaciones de los trabajos de ToroTreinta.'}
];
work.innerHTML=`<div class="section-head"><div><span class="kicker">Trabajos ToroTreinta</span><h2>La identidad se viste.</h2></div><p class="section-sub">Conocé nuestras prendas, sus detalles y los clubes para los que trabajamos.</p></div><div class="portfolio-stage" role="region" aria-roledescription="carrusel" aria-label="Trabajos realizados" tabindex="0">${slides.map((s,i)=>`<figure class="${i===0?'active':''}" aria-label="${i+1} de ${slides.length}"><img src="assets/${s.image}" alt="${s.title} · ${s.club}" loading="lazy"><figcaption><span class="kicker" style="color:#91afff">${s.club}</span><h3>${s.title}</h3><p>${s.text}</p><small>Portfolio · No indica disponibilidad de stock</small></figcaption></figure>`).join('')}</div><div class="portfolio-controls"><button type="button" id="workPrev" aria-label="Trabajo anterior">←</button><button type="button" id="workPause">Pausar</button><button type="button" id="workNext" aria-label="Trabajo siguiente">→</button><span id="workPosition" aria-live="polite">1 / ${slides.length}</span></div>`;
let index=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,timer;
const stage=work.querySelector('.portfolio-stage'),pause=work.querySelector('#workPause');
function show(n){index=(n+slides.length)%slides.length;stage.querySelectorAll('figure').forEach((f,i)=>f.classList.toggle('active',i===index));work.querySelector('#workPosition').textContent=`${index+1} / ${slides.length}`;}
function schedule(){clearInterval(timer);pause.textContent=paused?'Reproducir':'Pausar';if(!paused)timer=setInterval(()=>{if(!document.hidden&&document.getElementById('page-inicio').classList.contains('active')&&!work.matches(':hover')&&!work.contains(document.activeElement))show(index+1)},5500)}
work.querySelector('#workPrev').onclick=()=>show(index-1);work.querySelector('#workNext').onclick=()=>show(index+1);pause.onclick=()=>{paused=!paused;schedule()};stage.onkeydown=e=>{if(e.key==='ArrowRight'){e.preventDefault();show(index+1)}if(e.key==='ArrowLeft'){e.preventDefault();show(index-1)}};let touchX=0;stage.addEventListener('touchstart',e=>touchX=e.changedTouches[0].clientX,{passive:true});stage.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>50)show(index+(dx<0?1:-1))},{passive:true});schedule();
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const clubs=document.createElement('section');clubs.className='section club-ribbon';
const clubItems='<button class="club-logo-item" data-gallery="once"><img src="assets/escudo-once-corazones.png" alt="Escudo oficial de Once Corazones"><span>Once Corazones</span></button><button class="club-logo-item club-name-only" data-work="1"><span>4 de Julio</span></button><div class="club-logo-item club-name-only"><span>Villa Parque<br>Achával</span></div>';
clubs.innerHTML=`<div class="section-head"><div><span class="kicker">Clubes que ya vestimos</span><h2>La confianza se lleva puesta.</h2></div><button class="text-link ribbon-pause" type="button">Pausar movimiento</button></div><div class="club-window"><div class="club-track"><div class="club-group">${clubItems}</div><div class="club-group" aria-hidden="true" inert>${clubItems}</div></div></div><p class="ribbon-note">Cada escudo, una historia. Seguimos sumando los archivos oficiales de nuestros clubes.</p>`;
work.before(clubs);
clubs.querySelectorAll('.club-group:first-child [data-work]').forEach(b=>b.onclick=()=>{paused=true;schedule();show(Number(b.dataset.work));work.scrollIntoView({behavior:reduced.matches?'auto':'smooth'})});
work.classList.add('showcase-section');
work.querySelector('.section-head h2').innerHTML='Trabajos que hablan<br>por nosotros.';
const projects=document.createElement('div');projects.className='project-cases';
projects.innerHTML=`<article class="project-case"><img loading="lazy" src="assets/coleccion-once-corazones.webp" alt="Trabajo de indumentaria de Once Corazones"><div><span class="kicker">Identidad de club</span><h3>Once Corazones<br>× ToroTreinta</h3><p>Los colores del equipo, presentes en cada prenda. Indumentaria personalizada para acompañar al club dentro y fuera de la cancha.</p><div class="project-tags"><span>Personalización</span><span>Salida</span><span>Identidad</span></div><button class="text-link" type="button" data-open-once-gallery>Ver trabajo completo ↗</button></div></article><article class="project-case"><img loading="lazy" src="assets/camiseta-4-julio-real.webp" alt="Remera personalizada de 4 de Julio"><div><span class="kicker">Del diseño a la cancha</span><h3>4 de Julio<br>× ToroTreinta</h3><p>Remeras pre-match y versiones para el cuerpo técnico. Un mismo equipo, una identidad que se reconoce.</p><div class="project-tags"><span>Pre-match</span><span>DT / CT</span><span>Detalles de club</span></div></div></article>`;
work.appendChild(projects);

const onceImages=[
{file:'once-details.jpeg',title:'Los detalles también juegan',alt:'Placa con detalles del trabajo realizado para Once Corazones'},
{file:'once-shirt-front-grass.jpeg',title:'Camiseta de partido',alt:'Camiseta de Once Corazones sobre el césped'},
{file:'once-crest-detail.jpeg',title:'El escudo en primer plano',alt:'Detalle del escudo de Once Corazones aplicado en la prenda'},
{file:'once-shirt-front.jpeg',title:'Frente personalizado',alt:'Camiseta personalizada de Once Corazones'},
{file:'once-shirt-back.jpeg',title:'Espalda de la camiseta',alt:'Parte trasera de la camiseta de Once Corazones'},
{file:'once-shirts-grass.jpeg',title:'La camiseta en equipo',alt:'Dos camisetas de Once Corazones sobre el césped'},
{file:'once-training-set.jpeg',title:'Conjunto de entrenamiento',alt:'Conjunto de camiseta y short de Once Corazones'},
{file:'once-shorts.jpeg',title:'Short de juego',alt:'Short personalizado de Once Corazones'},
{file:'once-salida-line.jpeg',title:'Línea salida',alt:'Prenda de línea salida de Once Corazones'},
{file:'once-training-poster.jpeg',title:'Entrenamiento',alt:'Placa de conjunto de entrenamiento de Once Corazones'}
];
const gallery=document.createElement('section');gallery.className='once-gallery-section';gallery.id='once-gallery';
gallery.innerHTML=`<div class="gallery-intro"><div><span class="kicker">Equipos que vestimos · Once Corazones</span><h2>Once Corazones,<br>prenda por prenda.</h2></div><div><p>Un recorrido por las camisetas, conjuntos, detalles y líneas trabajadas para el club.</p><button class="text-link" type="button" data-open-once-gallery>Ver todas las fotos ↗</button></div></div><div class="once-gallery-grid">${onceImages.map((item,i)=>`<button class="once-gallery-card" type="button" data-gallery-index="${i}" aria-label="Abrir foto: ${item.title}"><img loading="lazy" src="assets/${item.file}" alt="${item.alt}"><span>${item.title}</span></button>`).join('')}</div>`;
work.appendChild(gallery);

const dialog=document.createElement('div');dialog.className='gallery-dialog';dialog.hidden=true;dialog.innerHTML=`<div class="gallery-dialog-backdrop" data-gallery-close></div><div class="gallery-dialog-panel" role="dialog" aria-modal="true" aria-labelledby="galleryDialogTitle"><div class="gallery-dialog-top"><span id="galleryDialogCounter"></span><button type="button" class="gallery-close" data-gallery-close aria-label="Cerrar galería">×</button></div><div class="gallery-dialog-media"><button type="button" class="gallery-nav gallery-prev" aria-label="Foto anterior">←</button><img id="galleryDialogImage" src="" alt=""><button type="button" class="gallery-nav gallery-next" aria-label="Foto siguiente">→</button></div><div class="gallery-dialog-caption"><h3 id="galleryDialogTitle"></h3><p>Once Corazones × ToroTreinta · trabajo realizado</p></div></div>`;
document.body.appendChild(dialog);
const dialogImage=dialog.querySelector('#galleryDialogImage'),dialogTitle=dialog.querySelector('#galleryDialogTitle'),dialogCounter=dialog.querySelector('#galleryDialogCounter');let galleryIndex=0,lastFocus=null;
function renderGallery(){const item=onceImages[galleryIndex];dialogImage.src=`assets/${item.file}`;dialogImage.alt=item.alt;dialogTitle.textContent=item.title;dialogCounter.textContent=`${galleryIndex+1} / ${onceImages.length}`}
function openGallery(n=0){galleryIndex=(n+onceImages.length)%onceImages.length;lastFocus=document.activeElement;renderGallery();dialog.hidden=false;document.body.classList.add('gallery-is-open');dialog.querySelector('.gallery-close').focus()}
function closeGallery(){dialog.hidden=true;document.body.classList.remove('gallery-is-open');lastFocus?.focus()}
function moveGallery(step){galleryIndex=(galleryIndex+step+onceImages.length)%onceImages.length;renderGallery()}
gallery.querySelectorAll('.once-gallery-card').forEach(card=>card.onclick=()=>openGallery(Number(card.dataset.galleryIndex)));
clubs.querySelectorAll('.club-group:first-child [data-gallery="once"]').forEach(b=>b.onclick=()=>openGallery(0));
work.querySelectorAll('[data-open-once-gallery]').forEach(b=>b.onclick=()=>openGallery(0));
dialog.querySelectorAll('[data-gallery-close]').forEach(el=>el.onclick=closeGallery);dialog.querySelector('.gallery-prev').onclick=()=>moveGallery(-1);dialog.querySelector('.gallery-next').onclick=()=>moveGallery(1);
dialog.addEventListener('keydown',e=>{if(dialog.hidden)return;if(e.key==='Escape')closeGallery();if(e.key==='ArrowLeft')moveGallery(-1);if(e.key==='ArrowRight')moveGallery(1)});

const ranking=[['Buzos',180,'ranking-buzos.png'],['Remeras de entrenamiento',145,'camiseta-4-julio-real.webp'],['Camisetas de partido',120,'camiseta-4-julio-presentacion.webp'],['Shorts',95,'coleccion-once-corazones.webp'],['Medias',80,'ranking-medias.png']];
const sales=document.createElement('section');sales.className='section results-section';
sales.innerHTML=`<div class="section-head"><div><span class="kicker">Top 5 · Productos vendidos</span><h2>Los más elegidos.</h2></div><button class="text-link" id="replaySales">↻ Repetir animación</button></div><p class="sales-demo">Vista demostrativa · Cantidades y posiciones de ejemplo. Imágenes de referencia, no asociadas a ventas verificadas.</p><div class="results-grid">${ranking.map(([name,qty,img],i)=>`<article class="result-card"><div class="result-photo"><img src="assets/${img}" alt="Referencia visual de ${name.toLowerCase()}" loading="lazy"><span class="result-rank">0${i+1}</span></div><div class="result-copy"><span class="result-overline">Los favoritos del equipo</span><h3>${name}</h3><div class="result-number" aria-label="${qty} unidades, dato demostrativo"><strong data-count="${qty}" aria-hidden="true">0</strong><span>unidades vendidas<br>ejemplo</span></div></div></article>`).join('')}</div><div class="results-total"><strong data-count="620" aria-label="620 unidades, total demostrativo">0</strong><span>prendas y accesorios<br>entre estos cinco productos · ejemplo</span></div>`;
work.after(sales);
const frames=new Map(),seen=new WeakSet();
function count(el){if(frames.has(el))cancelAnimationFrame(frames.get(el));const target=Number(el.dataset.count),start=performance.now();el.textContent='0';function tick(now){const p=reduced.matches?1:Math.min(1,(now-start)/1900);el.textContent=Math.round(target*(1-Math.pow(1-p,3))).toLocaleString('es-AR');if(p<1)frames.set(el,requestAnimationFrame(tick));else frames.delete(el)}frames.set(el,requestAnimationFrame(tick))}
const countObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting&&!seen.has(e.target)){seen.add(e.target);count(e.target)}}),{threshold:.6});
sales.querySelectorAll('[data-count]').forEach(el=>countObserver.observe(el));
sales.querySelector('#replaySales').onclick=()=>{sales.querySelectorAll('[data-count]').forEach(el=>{seen.delete(el);countObserver.unobserve(el);if(frames.has(el))cancelAnimationFrame(frames.get(el));el.textContent='0';countObserver.observe(el)})};
const revealObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed');revealObserver.unobserve(e.target)}}),{threshold:.08});
document.querySelectorAll('.project-case,.result-card').forEach(el=>{if(!reduced.matches){el.classList.add('reveal-ready');revealObserver.observe(el)}});
})();

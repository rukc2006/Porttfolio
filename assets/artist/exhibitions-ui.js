(function(){
var labels={pers:'Персональные',intl:'Международные',onl:'Онлайн-выставки',auc:'Аукционы',exh:'Выставки',cmp:'Конкурсы',mkt:'Маркеты'};
var views=[{root:'exCards',menu:'exMenu'},{root:'exhibitionCards',menu:'exFilter'},{root:'cvExhibitions',mode:'years'}];
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function tr(v){return typeof window.kcT==='function'?window.kcT(v):v}
function validType(v){return Object.prototype.hasOwnProperty.call(labels,v)?v:'exh'}
function card(x){var type=validType(x.type),place=x.place?(' · '+tr(x.place)):'';return '<article class="ex-card compact ex-t-'+type+' t-'+type+' x-'+type+'" data-k="'+type+'"><div class="ex-meta">'+esc(x.year)+esc(place)+'</div><h3>'+esc(tr(x.title))+'</h3><p>'+esc(tr(x.detail||''))+'</p>'+(x.note?'<p class="ex-note">'+esc(tr(x.note))+'</p>':'')+(x.url?'<a class="button" href="'+esc(x.url)+'" target="_blank" rel="noopener">'+esc(tr('Подробнее →'))+'</a>':'')+'</article>'}
function yearList(items){var years={};items.forEach(function(x){(years[x.year]||(years[x.year]=[])).push(x)});return Object.keys(years).sort(function(a,b){return Number(b)-Number(a)}).map(function(y){return '<section class="cv-ex-y" aria-label="'+esc(y)+'"><h3>'+esc(y)+'</h3><ul>'+years[y].map(function(x){var type=validType(x.type);return '<li class="x-'+type+'"><strong>'+esc(tr(x.title))+'</strong>'+(x.detail?'<span class="ex-w">'+esc(tr(x.detail))+'</span>':'')+(x.url?'<a class="cv-ex-link" href="'+esc(x.url)+'" target="_blank" rel="noopener">'+esc(tr('Открыть материал ↗'))+'</a>':'')+'</li>'}).join('')+'</ul></section>'}).join('')}
fetch('exhibitions.json').then(function(r){if(!r.ok)throw Error('load');return r.json()}).then(function(items){items=items.slice().sort(function(a,b){return Number(b.year)-Number(a.year)});var counts={};items.forEach(function(x){var t=validType(x.type);counts[t]=(counts[t]||0)+1});views.forEach(function(view){var root=document.getElementById(view.root),menu=view.menu&&document.getElementById(view.menu);if(!root)return;root.innerHTML=view.mode==='years'?yearList(items):items.map(card).join('');if(!menu)return;menu.innerHTML='<button type="button" class="ex-all on" data-f="all">'+esc(tr('Все'))+' · '+items.length+'</button>'+Object.keys(labels).filter(function(k){return counts[k]}).map(function(k){return '<button type="button" class="ex-t-'+k+' lg-'+k+' x-'+k+'" data-f="'+k+'">'+esc(tr(labels[k]))+' · '+counts[k]+'</button>'}).join('');menu.addEventListener('click',function(e){var b=e.target.closest('button[data-f]');if(!b)return;var t=b.dataset.f;menu.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x===b)});root.querySelectorAll('.ex-card[data-k]').forEach(function(c){c.style.display=(t==='all'||c.dataset.k===t)?'':'none'})})});document.dispatchEvent(new Event('exhibitions:ready'))}).catch(function(){views.forEach(function(v){var root=document.getElementById(v.root);if(root)root.textContent=window.kcT?window.kcT('Список выставок временно не загрузился.'):'Список выставок временно не загрузился.'});document.dispatchEvent(new Event('exhibitions:ready'))});
})();

// Eye-tracker detail for the exhibition journey section.
(function(){
  var scene=document.querySelector('[data-travel-eyes]');
  if(!scene)return;
  function look(x,y){
    var r=scene.getBoundingClientRect(),dx=(x-(r.left+r.width/2))/(r.width/2),dy=(y-(r.top+r.height/2))/(r.height/2);
    var tx=Math.max(-7,Math.min(7,dx*7)),ty=Math.max(-4,Math.min(4,dy*4));
    scene.querySelectorAll('.travel-eye i').forEach(function(p){p.style.transform='translate(calc(-50% + '+tx+'px),calc(-50% + '+ty+'px))'});
  }
  scene.addEventListener('pointermove',function(e){look(e.clientX,e.clientY)});
  scene.addEventListener('pointerleave',function(){scene.querySelectorAll('.travel-eye i').forEach(function(p){p.style.transform='translate(-50%,-50%)'})});
})();

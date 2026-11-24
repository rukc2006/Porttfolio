(function(){
  'use strict';
  var labels={pers:'Персональные',intl:'Международные',onl:'Онлайн-выставки',auc:'Аукционы',exh:'Выставки',cmp:'Конкурсы',mkt:'Маркеты'};
  var views=[{root:'exCards',menu:'exMenu',timeline:'exYears'},{root:'exhibitionCards',menu:'exFilter',timeline:'exYears'},{root:'cvExhibitions',mode:'years'}];
  var states={},items=[];
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function tr(v){return typeof window.kcT==='function'?window.kcT(v):v}
  function validType(v){return Object.prototype.hasOwnProperty.call(labels,v)?v:'exh'}
  function eventCard(x){
    var type=validType(x.type),place=x.place?(' · '+tr(x.place)):'';
    return '<article class="ex-card compact ex-t-'+type+' t-'+type+' x-'+type+'" data-k="'+type+'" data-y="'+Number(x.year)+'"><div class="ex-meta">'+esc(x.year)+esc(place)+'</div><h3>'+esc(tr(x.title))+'</h3><p>'+esc(tr(x.detail||''))+'</p>'+(x.note?'<p class="ex-note">'+esc(tr(x.note))+'</p>':'')+(x.url?'<a class="button" href="'+esc(x.url)+'" target="_blank" rel="noopener">'+esc(tr('Подробнее →'))+'</a>':'')+'</article>';
  }
  function yearList(list){
    var years={};list.forEach(function(x){(years[x.year]||(years[x.year]=[])).push(x)});
    return Object.keys(years).sort(function(a,b){return Number(b)-Number(a)}).map(function(y){return '<section class="cv-ex-y" aria-label="'+esc(y)+'"><h3>'+esc(y)+'</h3><ul>'+years[y].map(function(x){var type=validType(x.type);return '<li class="x-'+type+'"><strong>'+esc(tr(x.title))+'</strong>'+(x.detail?'<span class="ex-w">'+esc(tr(x.detail))+'</span>':'')+(x.url?'<a class="cv-ex-link" href="'+esc(x.url)+'" target="_blank" rel="noopener">'+esc(tr('Открыть материал ↗'))+'</a>':'')+'</li>'}).join('')+'</ul></section>'}).join('');
  }
  function makeYearButtons(view,root){
    var years={};items.forEach(function(x){years[x.year]=(years[x.year]||0)+1});
    var timeline=document.getElementById(view.timeline);if(!timeline)return;
    timeline.innerHTML='<button type="button" data-y="all" aria-pressed="true">'+esc(tr('Весь путь'))+' · '+items.length+'</button>'+Object.keys(years).sort(function(a,b){return Number(a)-Number(b)}).map(function(y){return '<button type="button" data-y="'+esc(y)+'" aria-pressed="false">'+esc(y)+' · '+years[y]+'</button>'}).join('');
    timeline.onclick=function(e){var b=e.target.closest('button[data-y]');if(!b)return;states[view.root].year=b.dataset.y;timeline.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});applyFilter(view,root)};
  }
  function applyFilter(view,root){
    var state=states[view.root],visible=0;
    root.querySelectorAll('.ex-card[data-k]').forEach(function(c){var show=(state.type==='all'||c.dataset.k===state.type)&&(state.year==='all'||c.dataset.y===state.year);c.hidden=!show;if(show)visible++});
    var output=document.querySelector('.ex-timeline [data-ex-count]');
    if(output&&view.timeline){var year=state.year==='all'?tr('Все годы'):state.year;output.textContent=year+' · '+visible+' '+tr('событий')}
  }
  function render(){
    views.forEach(function(view){
      var root=document.getElementById(view.root),menu=view.menu&&document.getElementById(view.menu);if(!root)return;
      if(!states[view.root])states[view.root]={type:'all',year:'all'};
      root.innerHTML=view.mode==='years'?yearList(items):items.map(eventCard).join('');
      if(view.mode==='years')return;
      if(menu){
        menu.innerHTML='<button type="button" class="ex-all on" data-f="all" aria-pressed="true">'+esc(tr('Все'))+' · '+items.length+'</button>'+Object.keys(labels).filter(function(k){return items.some(function(x){return validType(x.type)===k})}).map(function(k){return '<button type="button" class="ex-t-'+k+' lg-'+k+' x-'+k+'" data-f="'+k+'" aria-pressed="false">'+esc(tr(labels[k]))+' · '+items.filter(function(x){return validType(x.type)===k}).length+'</button>'}).join('');
        menu.onclick=function(e){var b=e.target.closest('button[data-f]');if(!b)return;states[view.root].type=b.dataset.f;menu.querySelectorAll('button[data-f]').forEach(function(x){x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',String(x===b))});applyFilter(view,root)};
      }
      if(view.timeline)makeYearButtons(view,root);
      applyFilter(view,root);
    });
    document.dispatchEvent(new Event('exhibitions:ready'));
  }
  fetch('exhibitions.json').then(function(r){if(!r.ok)throw Error('load');return r.json()}).then(function(data){items=data.slice().sort(function(a,b){return Number(b.year)-Number(a.year)});render()}).catch(function(){views.forEach(function(v){var root=document.getElementById(v.root);if(root)root.textContent=tr('Список выставок временно не загрузился.')});document.dispatchEvent(new Event('exhibitions:ready'))});
  document.addEventListener('kc:language-change',function(){if(items.length)render()});
})();

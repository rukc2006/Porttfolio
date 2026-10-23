/* Мобильное меню общей шапки (как на about.html) */
(function(){
  var btn=document.getElementById('mobileMenuBtn'),menu=document.getElementById('mobileMenu');
  if(!btn||!menu)return;
  var T={m:btn.textContent};
  btn.addEventListener('click',function(){
    var open=menu.classList.toggle('open');
    btn.setAttribute('aria-expanded',String(open));
    btn.textContent=open?(window.kcT?window.kcT('Закрыть'):'Закрыть'):(window.kcT?window.kcT('Меню'):'Меню');
  });
  menu.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){
    menu.classList.remove('open');btn.setAttribute('aria-expanded','false');btn.textContent=window.kcT?window.kcT('Меню'):'Меню';
  });});
})();

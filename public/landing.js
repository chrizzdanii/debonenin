(function(){
var d=document,r=d.documentElement;
try{var t=localStorage.getItem('theme');if(t)r.dataset.theme=t;else if(matchMedia('(prefers-color-scheme: dark)').matches)r.dataset.theme='dark'}catch(e){}
d.addEventListener('DOMContentLoaded',function(){
var b=d.getElementById('theme');if(b)b.onclick=function(){var n=r.dataset.theme==='dark'?'light':'dark';r.dataset.theme=n;try{localStorage.setItem('theme',n)}catch(e){}};
var m=d.getElementById('burger'),menu=d.getElementById('menu');
if(m)m.onclick=function(){var o=menu.classList.toggle('open');m.setAttribute('aria-expanded',o)};
if(menu)menu.addEventListener('click',function(e){if(e.target.tagName==='A'){menu.classList.remove('open');m&&m.setAttribute('aria-expanded','false')}});
var els=d.querySelectorAll('.r');
if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches){els.forEach(function(e){e.classList.add('in')});return}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});
els.forEach(function(e){io.observe(e)});
});
})();

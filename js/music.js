(function(){var a=document.getElementById('bgm'),b=document.getElementById('mbtn'),stopped=false,armed=true,vs=document.getElementById('vol'),v0=.35;try{var sv=parseFloat(localStorage.getItem('efVol'));if(sv>=0&&sv<=1)v0=sv}catch(e){}function setVol(v){window.efVol=v;a.volume=v;vs.value=Math.round(v*100);vs.style.setProperty('--p',Math.round(v*100)+'%');if(window.efApplyVol)window.efApplyVol()}setVol(v0);vs.addEventListener('input',function(){var v=vs.value/100;setVol(v);try{localStorage.setItem('efVol',v)}catch(e){}});
function ui(p){b.classList.toggle('playing',p);b.setAttribute('aria-pressed',p?'true':'false');var t=p?'Stop music':'Play music';b.setAttribute('aria-label',t);b.title=t}
function play(){var r=a.play();if(r&&r.catch)r.catch(function(){})}
a.addEventListener('play',function(){ui(true)});a.addEventListener('pause',function(){ui(false)});
b.addEventListener('click',function(){if(a.paused){stopped=false;play()}else{stopped=true;a.pause()}window.efMuted=stopped});
function first(e){if(!armed||stopped)return;if(e.target&&e.target.closest&&e.target.closest('#mbtn'))return;armed=false;play();['pointerdown','keydown','touchend'].forEach(function(n){document.removeEventListener(n,first,true)})}
['pointerdown','keydown','touchend'].forEach(function(n){document.addEventListener(n,first,true)});
play()})();

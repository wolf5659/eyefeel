(function(){var a=document.getElementById('bgm'),b=document.getElementById('mbtn'),stopped=false,armed=true,vs=document.getElementById('vol'),v0=.35;try{var sv=parseFloat(localStorage.getItem('efVol'));if(sv>=0&&sv<=1)v0=sv}catch(e){}function setVol(v){window.efVol=v;a.volume=v;vs.value=Math.round(v*100);vs.style.setProperty('--p',Math.round(v*100)+'%');if(window.efApplyVol)window.efApplyVol()}setVol(v0);vs.addEventListener('input',function(){var v=vs.value/100;setVol(v);try{localStorage.setItem('efVol',v)}catch(e){}});
function ui(p){b.classList.toggle('playing',p);b.setAttribute('aria-pressed',p?'true':'false');var t=p?'Stop music':'Play music';b.setAttribute('aria-label',t);b.title=t}
function play(){var r=a.play();if(r&&r.catch)r.catch(function(){})}
a.addEventListener('play',function(){ui(true)});a.addEventListener('pause',function(){ui(false)});
b.addEventListener('click',function(){if(a.paused){stopped=false;play()}else{stopped=true;a.pause()}window.efMuted=stopped});
function first(e){if(!armed||stopped)return;if(e.target&&e.target.closest&&e.target.closest('#mbtn'))return;armed=false;play();['pointerdown','keydown','touchend'].forEach(function(n){document.removeEventListener(n,first,true)})}
['pointerdown','keydown','touchend'].forEach(function(n){document.addEventListener(n,first,true)});
play()})();


// Keep audio widget inside the mobile visual viewport (including in-app browsers).
(function(){
  var widget=document.querySelector('.mctl');
  if(!widget)return;
  var mobile=window.matchMedia('(max-width:640px)'),pending=false;
  function reposition(){
    pending=false;
    if(!mobile.matches){
      widget.style.removeProperty('top');
      widget.style.removeProperty('bottom');
      widget.style.removeProperty('right');
      return;
    }
    var view=window.visualViewport;
    var visibleHeight=view&&view.height>0?view.height:window.innerHeight;
    var visibleTop=view?view.offsetTop:0;
    widget.style.top=Math.max(12,Math.floor(visibleTop+visibleHeight-widget.offsetHeight-18))+'px';
    widget.style.bottom='auto';
    var visibleRight=view&&view.width>0?view.offsetLeft+view.width:window.innerWidth;
    widget.style.right=Math.max(14,Math.ceil(window.innerWidth-visibleRight+14))+'px';
  }
  function schedule(){
    if(pending)return;
    pending=true;
    window.requestAnimationFrame(reposition);
  }
  reposition();
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('orientationchange',schedule,{passive:true});
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize',schedule,{passive:true});
    window.visualViewport.addEventListener('scroll',schedule,{passive:true});
  }
  if(mobile.addEventListener)mobile.addEventListener('change',schedule);
})();

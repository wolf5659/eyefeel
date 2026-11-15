(function(){
  var english=document.getElementById('policy-en');
  var arabic=document.getElementById('policy-ar');
  var enButton=document.getElementById('lang-en');
  var arButton=document.getElementById('lang-ar');
  function selectLanguage(lang){
    var isArabic=lang==='ar';
    english.hidden=isArabic;
    arabic.hidden=!isArabic;
    document.querySelector('[data-copy="en"]').hidden=isArabic;
    document.querySelector('[data-copy="ar"]').hidden=!isArabic;
    enButton.setAttribute('aria-pressed',String(!isArabic));
    arButton.setAttribute('aria-pressed',String(isArabic));
    document.documentElement.lang=isArabic?'ar':'en';
  }
  enButton.addEventListener('click',function(){selectLanguage('en')});
  arButton.addEventListener('click',function(){selectLanguage('ar')});
})();

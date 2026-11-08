(function () {
  var header = document.querySelector('header');
  var nav = header && header.querySelector('nav');
  if (!nav) return;

  var mobile = window.matchMedia('(max-width: 640px)');
  var toggle = document.createElement('button');
  nav.id = 'site-navigation';
  nav.classList.add('mobile-nav');
  nav.setAttribute('aria-label', 'Main navigation');
  toggle.type = 'button';
  toggle.className = 'menu-toggle';
  toggle.textContent = 'Menu';
  toggle.setAttribute('aria-label', 'Menu');
  toggle.setAttribute('aria-controls', nav.id);
  toggle.setAttribute('aria-expanded', 'false');
  header.insertBefore(toggle, nav);

  function closeMenu(returnFocus) {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) toggle.focus();
  }

  toggle.addEventListener('click', function () {
    var open = toggle.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', function (event) {
    if (event.target.closest('a')) closeMenu(false);
  });
  document.addEventListener('click', function (event) {
    if (!header.contains(event.target)) closeMenu(false);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      closeMenu(true);
    }
  });
  document.addEventListener('focusin', function (event) {
    if (!header.contains(event.target)) closeMenu(false);
  });
  mobile.addEventListener('change', function () { closeMenu(false); });
})();

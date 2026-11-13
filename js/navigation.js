(function () {
  var header = document.querySelector('header');
  var nav = header && header.querySelector('nav');
  if (!nav) return;

  var feelings = document.createElement('details');
  feelings.className = 'feelings-nav';
  var feelingsToggle = document.createElement('summary');
  feelingsToggle.textContent = 'Feelings';
  feelingsToggle.setAttribute('aria-label', 'Feelings');
  feelingsToggle.setAttribute('aria-controls', 'feelings-links');
  var feelingsLinks = document.createElement('ul');
  feelingsLinks.id = 'feelings-links';
  feelingsLinks.className = 'feelings-links';
  var currentPage = window.location.pathname.split('/').pop();
  ['Angry', 'Cute', 'Funny', 'Happy', 'Loved', 'Nostalgic', 'Sad', 'Scary', 'Special', 'Weird'].forEach(function (name) {
    var item = document.createElement('li');
    var link = document.createElement('a');
    link.href = name.toLowerCase() + '.html';
    link.textContent = name;
    if (link.getAttribute('href') === currentPage) link.setAttribute('aria-current', 'page');
    item.appendChild(link);
    feelingsLinks.appendChild(item);
  });
  feelings.appendChild(feelingsToggle);
  feelings.appendChild(feelingsLinks);
  var aboutButton = nav.querySelector('.about-nav');
  nav.insertBefore(feelings, aboutButton ? aboutButton.nextSibling : nav.firstChild);

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
    feelings.open = false;
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
    if (!feelings.contains(event.target)) feelings.open = false;
    if (!header.contains(event.target)) closeMenu(false);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && feelings.open) {
      event.preventDefault();
      feelings.open = false;
      feelingsToggle.focus();
      return;
    }
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      closeMenu(true);
    }
  });
  document.addEventListener('focusin', function (event) {
    if (!feelings.contains(event.target)) feelings.open = false;
    if (!header.contains(event.target)) closeMenu(false);
  });
  mobile.addEventListener('change', function () { closeMenu(false); });
})();

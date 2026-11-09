// Preserve the original card proportions while fitting its available space.
(() => {
  const item = document.querySelector('.sauce-grid > li:only-child');
  if (!item) return;
  const grid = item.parentElement;
  const card = item.querySelector('.sauce-card');
  let frame;
  const fit = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const scale = Math.min(1, grid.clientWidth / card.offsetWidth, grid.clientHeight / card.offsetHeight);
      item.classList.add('is-fitted');
      item.style.setProperty('--sauce-scale', scale);
      item.style.width = card.offsetWidth * scale + 'px';
      item.style.height = card.offsetHeight * scale + 'px';
    });
  };
  const observer = new ResizeObserver(fit);
  observer.observe(grid);
  observer.observe(card);
  window.addEventListener('resize', fit);
  fit();
})();

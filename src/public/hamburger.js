document.addEventListener('DOMContentLoaded', function () {
  const hamburger = document.querySelector('.hamburger');
  const nav = document.getElementById('main-nav');
  if (!hamburger || !nav) return;
  hamburger.addEventListener('click', function () {
    const expanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', !expanded);
    nav.classList.toggle('open');
    hamburger.classList.toggle('open');
  });
});
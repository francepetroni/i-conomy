// Mobile nav toggle
document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.querySelector('.nav-toggle');
  const nav    = document.querySelector('nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  // Dropdown toggle on mobile tap
  document.querySelectorAll('.dropdown > a').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (window.innerWidth <= 820) {
        e.preventDefault();
        this.closest('.dropdown').classList.toggle('open');
      }
    });
  });

  // Mark active nav link
  const path = window.location.pathname.replace(/\/$/, '') || '/index.html';
  document.querySelectorAll('nav a').forEach(function (a) {
    const href = a.getAttribute('href').replace(/\/$/, '');
    if (path.endsWith(href) && href !== '' && href !== '#') {
      a.classList.add('active');
    }
  });
});

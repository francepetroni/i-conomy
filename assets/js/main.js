// Mobile nav toggle
document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.querySelector('.nav-toggle');
  const nav    = document.querySelector('nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  // Dropdown toggle on mobile tap + keyboard on desktop
  document.querySelectorAll('.dropdown > a').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (window.innerWidth <= 820) {
        e.preventDefault();
        this.closest('.dropdown').classList.toggle('open');
      }
    });
    link.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.closest('.dropdown').classList.toggle('open');
      }
    });
  });

  // Close dropdown on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.dropdown.open').forEach(function (d) {
        d.classList.remove('open');
      });
    }
  });

  // Mailto form: show fallback notice after submit
  document.querySelectorAll('form[action^="mailto:"]').forEach(function (form) {
    form.addEventListener('submit', function () {
      var notice = form.querySelector('.form-sent');
      if (notice) setTimeout(function () { notice.style.display = 'block'; }, 800);
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

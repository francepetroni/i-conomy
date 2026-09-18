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

  // Web3Forms: submit over fetch so the visitor stays on the page.
  // Without JS the form still POSTs normally and lands on thanks.html.
  document.querySelectorAll('form[action*="api.web3forms.com"]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('.form-status');
      var button = form.querySelector('button[type="submit"]');
      var label  = button ? button.textContent : '';

      if (status) { status.className = 'form-status is-pending'; status.textContent = 'Sending…'; }
      if (button) { button.disabled = true; button.textContent = 'Sending…'; }

      fetch(form.action, { method: 'POST', body: new FormData(form) })
        .then(function (r) { return r.json().catch(function () { return { success: r.ok }; }); })
        .then(function (data) {
          if (data.success) {
            form.reset();
            if (status) {
              status.className = 'form-status is-ok';
              status.textContent = 'Thank you — your message has been sent. We will get back to you shortly.';
            }
          } else {
            throw new Error(data.message || 'submit failed');
          }
        })
        .catch(function () {
          if (status) {
            status.className = 'form-status is-error';
            status.innerHTML = 'Sorry, the message could not be sent. Please email us directly at ' +
                               '<a href="mailto:info@i-conomy.com">info@i-conomy.com</a>.';
          }
        })
        .finally(function () {
          if (button) { button.disabled = false; button.textContent = label; }
        });
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

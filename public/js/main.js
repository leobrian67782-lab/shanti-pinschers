document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
  }

  const mainImg = document.querySelector('.detail-gallery-main img');
  document.querySelectorAll('.detail-thumbs img').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      if (mainImg) mainImg.src = thumb.src;
    });
  });

  // Auto-submit filter dropdowns (kept out of inline HTML attributes for CSP compliance)
  document.querySelectorAll('.auto-submit').forEach((el) => {
    el.addEventListener('change', () => el.form.submit());
  });
});

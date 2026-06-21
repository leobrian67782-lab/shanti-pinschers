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

  // Header gains a shadow once the page is scrolled, for a sense of depth
  const header = document.getElementById('site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Scroll-reveal animation for sections and card grids
  const revealTargets = document.querySelectorAll('.reveal, .reveal-group');
  if ('IntersectionObserver' in window && revealTargets.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealTargets.forEach((el) => observer.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  }
});

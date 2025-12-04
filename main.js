const navToggle = document.querySelector('[data-nav-toggle]');
const siteNav = document.querySelector('.site-nav');
const navLinks = document.querySelectorAll('.site-nav a');

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.forEach((link) =>
    link.addEventListener('click', () => {
      if (siteNav.classList.contains('is-open')) {
        siteNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    })
  );
}

const sections = document.querySelectorAll('section[id]');
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const id = entry.target.getAttribute('id');
      const navLink = document.querySelector(`.site-nav a[href="#${id}"]`);
      if (!navLink) return;
      if (entry.isIntersecting) {
        navLinks.forEach((link) => link.classList.remove('active'));
        navLink.classList.add('active');
      }
    });
  },
  {
    rootMargin: '-40% 0px -50% 0px',
  }
);

sections.forEach((section) => observer.observe(section));

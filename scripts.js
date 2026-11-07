const TOP_THRESHOLD_PX = 80;
const BOTTOM_TOLERANCE_PX = 4;
const RIPPLE_DURATION_MS = 600;
const RIPPLE_SIZE_MULTIPLIER = 2;
const BUTTON_SELECTOR = '.btn, .streams a, .links a';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function targetId(link) {
  return link.getAttribute('href').slice(1);
}

function initTabbar() {
  const tabs = [...document.querySelectorAll('.tabbar a')];
  const tabById = new Map(tabs.map((tab) => [targetId(tab), tab]));

  function setActive(id) {
    tabs.forEach((tab) => tab.removeAttribute('aria-current'));
    tabById.get(id)?.setAttribute('aria-current', 'page');
  }

  function isAtBottom() {
    return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - BOTTOM_TOLERANCE_PX;
  }

  function updateFromScroll() {
    if (window.scrollY < TOP_THRESHOLD_PX) setActive('top');
    else if (isAtBottom()) setActive('contact');
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    [...tabById.keys()]
      .filter((id) => id !== 'top')
      .forEach((id) => {
        const section = document.getElementById(id);
        if (section) observer.observe(section);
      });
  }

  window.addEventListener('scroll', updateFromScroll, { passive: true });
  tabs.forEach((tab) => tab.addEventListener('click', () => setActive(targetId(tab))));
  updateFromScroll();
}

function addRipple(el, event) {
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * RIPPLE_SIZE_MULTIPLIER;
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  Object.assign(ripple.style, {
    width: `${size}px`,
    height: `${size}px`,
    left: `${event.clientX - rect.left - size / 2}px`,
    top: `${event.clientY - rect.top - size / 2}px`,
  });
  el.appendChild(ripple);
  setTimeout(() => ripple.remove(), RIPPLE_DURATION_MS);
}

function initRipples() {
  document.querySelectorAll(BUTTON_SELECTOR).forEach((el) => {
    el.addEventListener('pointerdown', (event) => {
      if (!reducedMotion.matches) addRipple(el, event);
    });
  });
}

function initThemeToggle() {
  const root = document.documentElement;
  const button = document.querySelector('.theme-toggle');
  if (!button) return;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  function isDark() {
    const saved = root.getAttribute('data-theme');
    return saved ? saved === 'dark' : systemDark.matches;
  }

  function render() {
    const dark = isDark();
    button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    button.setAttribute('aria-pressed', String(dark));
  }

  button.addEventListener('click', () => {
    const theme = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', theme);
    saveTheme(theme);
    render();
  });

  render();
}

function saveTheme(theme) {
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // Storage can be blocked; the theme then applies to this page view only.
  }
}

function initLightbox() {
  const dialog = document.querySelector('.lightbox');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const image = dialog.querySelector('img');

  document.querySelectorAll('.gallery img, .press-img, .live-photo, .poster img').forEach((el) => {
    el.addEventListener('click', () => {
      image.src = el.currentSrc || el.src;
      image.alt = el.alt;
      dialog.showModal();
    });
  });

  // Any click inside the dialog, including on the image, closes it.
  dialog.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => image.removeAttribute('src'));
}

function init() {
  initTabbar();
  initRipples();
  initThemeToggle();
  initLightbox();
}

document.addEventListener('DOMContentLoaded', init);

/* ============================================
   DARKTHEME.JS — Dark mode toggle & persistence
   Applies [data-theme="dark"] on <html>
   Icons switch via CSS only (no inline style.display)
============================================ */

const THEME_KEY = 'nova_theme';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);

  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.setAttribute('title', theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode');
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next    = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem(THEME_KEY, next); } catch(e) {}

  // Spring-bounce animation on the button
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.classList.remove('theme-pop');
    void btn.offsetWidth; // force reflow to restart animation
    btn.classList.add('theme-pop');
    btn.addEventListener('animationend', () => btn.classList.remove('theme-pop'), { once: true });
  }
}

function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch(e) {}

  // Fall back to OS preference if no stored value
  if (!saved) {
    saved = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark' : 'light';
  }

  applyTheme(saved);

  // Listen for OS preference changes (only when user hasn't manually set one)
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      try {
        if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? 'dark' : 'light');
      } catch(err) {}
    });
  }
}

// Init theme on load — button wiring is handled in index.html inline script
// (Avoids double-listener that would cancel every click)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}
/* ============================================================
   LANG.JS — Translations and language switching
   Pure function definitions only — no top-level execution.
============================================================ */

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.innerHTML = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  document.querySelectorAll('.cat-pill').forEach(btn => {
    btn.textContent = t('cat.' + btn.getAttribute('data-cat'));
  });
  document.querySelectorAll('.cat-nav').forEach(btn => {
    btn.textContent = t('nav.' + btn.getAttribute('data-cat'));
  });
  const heroAccessBtn = document.querySelector('.hero-btns .btn-outline');
  if (heroAccessBtn) heroAccessBtn.textContent = t('cat.Accessories');
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.placeholder = t('search.placeholder');
  document.querySelectorAll('#sort-select option[data-i18n]').forEach(opt => {
    opt.textContent = t(opt.getAttribute('data-i18n'));
  });
  updateAddBtn();
}

function setLang(lang) {
  currentLang = lang;
  saveLang(lang);
  const html = document.documentElement;
  if (lang === 'ar') {
    html.setAttribute('dir', 'rtl'); html.setAttribute('lang', 'ar');
    document.body.setAttribute('dir', 'rtl');
  } else {
    html.setAttribute('dir', 'ltr'); html.setAttribute('lang', 'en');
    document.body.setAttribute('dir', 'ltr');
  }
  document.getElementById('lang-en').classList.toggle('active', lang === 'en');
  document.getElementById('lang-ar').classList.toggle('active', lang === 'ar');
  applyTranslations();
  try { renderTrustBar(); }    catch(e) {}
  try { renderInfoSections(); } catch(e) {}
  try { renderReviews(); }     catch(e) {}
  try { renderWhatsApp(); }    catch(e) {}
  renderProducts();
  updateCartUI();
  updateWishlistUI();
}
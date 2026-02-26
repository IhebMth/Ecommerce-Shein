/* ============================================================
   INFOSECTIONS.JS — Delivery info & Return policy rendering
   Pure function definitions only — no top-level execution.
   Depends on: i18n.js (t function via main script)
============================================================ */

function renderInfoSections() {
  const deliveryEl = document.getElementById('delivery-info');
  const returnsEl  = document.getElementById('returns-info');

  if (deliveryEl) {
    const heading = deliveryEl.querySelector('h3');
    const list    = deliveryEl.querySelector('ul');
    if (heading) heading.innerHTML = `<span class="icon">🚚</span> ${t('info.delivery.title')}`;
    if (list) {
      list.innerHTML = [
        t('info.delivery.1'),
        t('info.delivery.2'),
        t('info.delivery.3'),
        t('info.delivery.4'),
        t('info.delivery.5'),
        t('info.delivery.6')
      ].map(item => `<li>${item}</li>`).join('');
    }
  }

  if (returnsEl) {
    const heading = returnsEl.querySelector('h3');
    const list    = returnsEl.querySelector('ul');
    if (heading) heading.innerHTML = `<span class="icon">↩️</span> ${t('info.returns.title')}`;
    if (list) {
      list.innerHTML = [
        t('info.returns.1'),
        t('info.returns.2'),
        t('info.returns.3'),
        t('info.returns.4'),
        t('info.returns.5'),
        t('info.returns.6')
      ].map(item => `<li>${item}</li>`).join('');
    }
  }
}
/* ============================================================
   TRUSTBAR.JS — Trust bar rendering
   Renders the 5-badge trust strip between hero and shop.
   Pure function definitions only — no top-level execution.
   Depends on: i18n.js (t function via main script)
============================================================ */

function renderTrustBar() {
  const el = document.getElementById('trust-bar');
  if (!el) return;

  const items = [
    {
      icon: `<svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>`,
      title: t('trust.cod.title'),
      sub:   t('trust.cod.sub')
    },
    {
      icon: `<svg viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
      title: t('trust.shipping.title'),
      sub:   t('trust.shipping.sub')
    },
    {
      icon: `<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
      title: t('trust.returns.title'),
      sub:   t('trust.returns.sub')
    },
    {
      icon: `<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
      title: t('trust.secure.title'),
      sub:   t('trust.secure.sub')
    },
    {
      icon: `<svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.17 8.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012.08 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>`,
      title: t('trust.support.title'),
      sub:   t('trust.support.sub')
    }
  ];

  el.innerHTML = items.map(item => `
    <div class="trust-item" role="listitem">
      ${item.icon}
      <div><strong>${item.title}</strong><span>${item.sub}</span></div>
    </div>
  `).join('');
}

function renderWhatsApp() {
  const el = document.getElementById('whatsapp-float');
  if (!el) return;
  el.setAttribute('title', t('trust.whatsapp.tooltip'));
  el.setAttribute('aria-label', t('trust.whatsapp.tooltip'));
  const tooltip = el.querySelector('.whatsapp-tooltip');
  if (tooltip) tooltip.textContent = t('trust.whatsapp.tooltip');
}
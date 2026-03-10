/* ============================================================
   ENGAGEMENT.JS — Section 4: Engagement & Retention
   ─────────────────────────────────────────────────────────
   Features:
     10. Dismissible promo banner (localStorage)
     11. Newsletter popup after 30s (shows once)
     12. Recently viewed products (localStorage, max 6)
     13. Sale countdown timer (configurable end date)

   ══════════════════════════════════════════════════════════
   HOW TO CONFIGURE — READ THIS BEFORE EDITING
   ══════════════════════════════════════════════════════════

   ── PROMO BANNER (#10) ──────────────────────────────────
   Find: PROMO_CONFIG below
   Change `text` to your offer message (supports both EN + AR).
   Set `active: false` to hide the banner entirely.

   ── NEWSLETTER POPUP (#11) ──────────────────────────────
   Find: NEWSLETTER_CONFIG below
   Change `delayMs` (default 30000 = 30 seconds).
   Change `heading` / `body` text in both languages.
   The popup shows once per browser session (localStorage key:
   'nova_newsletter_shown').

   ── RECENTLY VIEWED (#12) ───────────────────────────────
   No config needed — auto-tracks the last 6 products opened.
   The section renders below the product grid automatically.
   It refreshes every time a modal is opened or closed.

   ── COUNTDOWN TIMER (#13) ───────────────────────────────
   Find: SALE_CONFIG below — the ONLY thing you need to change.
   Set `endDate` to your sale deadline (ISO string, local time).
   Set `label` to your sale name.
   Set `active: false` to hide it.
   When the timer reaches 0 it shows "Sale Ended".

   ══════════════════════════════════════════════════════════
   WHERE TO ADD THIS SCRIPT IN Index.html
   ══════════════════════════════════════════════════════════
   Add BEFORE the closing </body> tag, after all other scripts:
     <script src="Engagement.js"></script>
   It must load AFTER products.js, i18n.js, and the main
   inline script (so `products`, `t()`, `currentLang` exist).

============================================================ */

/* ══════════════════════════════════════════════════════════
   ① CONFIGURATION — edit these objects only
══════════════════════════════════════════════════════════ */

const PROMO_CONFIG = {
  active: true,

  /* ✏️ Change this text to your current offer */
  text: {
    en: '🔥 Summer Sale — Up to 40% off selected styles. Limited time only!', /* overridden by API: promo_banner_text_en */
    ar: '🔥 تخفيضات الصيف — حتى 40% على تشكيلات مختارة. عرض محدود!'        /* overridden by API: promo_banner_text_ar */
  },

  /* ✏️ Optional CTA button — set label to '' to hide */
  cta: {
    label: { en: 'Shop Sale', ar: 'تسوق الآن' },
    action: () => filterProducts('All')   /* e.g. filterProducts('Leggings') */
  },

  storageKey: 'nova_promo_dismissed'
};

const NEWSLETTER_CONFIG = {
  active: true,         /* overridden by API: newsletter_popup_active */
  discountActive: true, /* overridden by API: newsletter_discount_active */
  discountPct: 10,      /* overridden by API: newsletter_discount_pct */

  delayMs: 10000,
  repeatMs: 1 * 60 * 1000,

  heading: {
    en: 'Join the NOVA Family 💌',
    ar: 'انضم إلى عائلة NOVA 💌'
  },
  body: {
    en: 'Get {pct}% off your first order + early access to new arrivals.',
    ar: 'احصل على {pct}% خصم على طلبك الأول + وصول مبكر للوصول الجديد.'
  },
  placeholder: {
    en: 'Your email address',
    ar: 'بريدك الإلكتروني'
  },
  btnLabel: {
    en: 'Claim My Discount',
    ar: 'احصل على الخصم'
  },

  storageKey: 'nova_newsletter_shown'
};

/* —— Returning subscriber popup —— */
const RETURN_CONFIG = {
  repeatMs: 5 * 60 * 1000,
};

const SALE_CONFIG = {
  active: true,

  /* ✏️ SET YOUR SALE END DATE HERE (ISO format: 'YYYY-MM-DDTHH:MM:SS') */
  endDate: '2026-03-20T23:59:59',

  /* ✏️ Sale name shown above the timer */
  label: {
    en: '⚡ Summer Sale Ends In',
    ar: '⚡ تنتهي تخفيضات الصيف خلال'
  },

  /* Timer labels */
  units: {
    en: { days: 'Days', hours: 'Hrs', mins: 'Min', secs: 'Sec' },
    ar:  { days: 'يوم', hours: 'ساعة', mins: 'دقيقة', secs: 'ثانية' }
  }
};

/* ══════════════════════════════════════════════════════════
   RECENTLY VIEWED CONFIG — no edit needed
══════════════════════════════════════════════════════════ */
const RV_MAX     = 6;     /* max products to remember */
const RV_KEY     = 'nova_recently_viewed';

/* ══════════════════════════════════════════════════════════
   INTERNAL STATE
══════════════════════════════════════════════════════════ */
let _saleInterval = null;

/* ══════════════════════════════════════════════════════════
   HELPER: get current language safely
══════════════════════════════════════════════════════════ */
function _lang() {
  return (typeof currentLang !== 'undefined' ? currentLang : 'en');
}
function _t(obj) {
  if (!obj || typeof obj === 'string') return obj || '';
  return obj[_lang()] || obj.en || '';
}

/* ══════════════════════════════════════════════════════════
   #10 PROMO BANNER
══════════════════════════════════════════════════════════ */
function initPromoBanner() {
  if (!PROMO_CONFIG.active) return;
  try {
    if (localStorage.getItem(PROMO_CONFIG.storageKey)) return; /* dismissed */
  } catch(e) {}

  const banner = document.createElement('div');
  banner.id = 'promo-banner';
  banner.className = 'promo-banner';
  banner.innerHTML = `
    <div class="promo-inner">
      <span class="promo-text" id="promo-text"></span>
      ${PROMO_CONFIG.cta.label.en
        ? `<button class="promo-cta" id="promo-cta"></button>`
        : ''}
    </div>
    <button class="promo-close" id="promo-close" aria-label="Dismiss">✕</button>
  `;

  /* Insert before the first element in body (above header) */
  document.body.insertBefore(banner, document.body.firstChild);

  /* Inject CSS if not already in page */
  _injectStyle('promo-styles', `
    .promo-banner {
      position: relative;
      background: var(--accent);
      color: #fff;
      display: flex; align-items: center; justify-content: center;
      padding: 0.6rem 3rem 0.6rem 1rem;
      font-size: 0.82rem;
      font-weight: 500;
      z-index: 600;
      min-height: 40px;
      animation: promoDrop 0.4s cubic-bezier(0.34,1.3,0.64,1);
    }
    @keyframes promoDrop {
      from { transform: translateY(-100%); opacity: 0; }
      to   { transform: translateY(0);     opacity: 1; }
    }
    .promo-inner {
      display: flex; align-items: center; gap: 0.9rem;
      flex-wrap: wrap; justify-content: center;
      text-align: center;
    }
    .promo-text { line-height: 1.4; }
    .promo-cta {
      background: rgba(0,0,0,0.25); color: #fff;
      border: 1px solid rgba(255,255,255,0.5);
      padding: 0.28rem 0.9rem; font-size: 0.75rem;
      font-family: inherit; cursor: pointer;
      letter-spacing: 0.06em; text-transform: uppercase;
      transition: background 0.18s;
    }
    .promo-cta:hover { background: rgba(0,0,0,0.4); }
    .promo-close {
      position: absolute; right: 0.75rem; top: 50%;
      transform: translateY(-50%);
      background: none; border: none; color: rgba(255,255,255,0.8);
      font-size: 1rem; cursor: pointer; padding: 0.25rem 0.3rem;
      line-height: 1; transition: color 0.15s;
    }
    .promo-close:hover { color: #fff; }
    [dir="rtl"] .promo-close { right: auto; left: 0.75rem; }
    [dir="rtl"] .promo-banner { padding: 0.6rem 1rem 0.6rem 3rem; }
  `);

  _updatePromoBanner();

  document.getElementById('promo-close').addEventListener('click', () => {
    banner.style.transition = 'opacity 0.25s, max-height 0.35s, padding 0.35s';
    banner.style.opacity    = '0';
    banner.style.maxHeight  = '0';
    banner.style.padding    = '0';
    banner.style.overflow   = 'hidden';
    setTimeout(() => banner.remove(), 380);
    try { localStorage.setItem(PROMO_CONFIG.storageKey, '1'); } catch(e) {}
  });

  const ctaBtn = document.getElementById('promo-cta');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      PROMO_CONFIG.cta.action();
      document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
    });
  }
}

function _updatePromoBanner() {
  const textEl = document.getElementById('promo-text');
  const ctaEl  = document.getElementById('promo-cta');
  if (textEl) textEl.textContent = _t(PROMO_CONFIG.text);
  if (ctaEl)  ctaEl.textContent  = _t(PROMO_CONFIG.cta.label);
}

/* ══════════════════════════════════════════════════════════
   #11 NEWSLETTER POPUP
══════════════════════════════════════════════════════════ */
function initNewsletterPopup() {
  if (!NEWSLETTER_CONFIG.active) return;
  /* Always build the overlay — guard only blocks the show timer */

  _injectStyle('newsletter-styles', `
    #nl-overlay {
      display: none; position: fixed; inset: 0;
      z-index: 3000;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      align-items: center; justify-content: center;
      padding: 1rem;
      animation: nlFadeIn 0.3s ease;
    }
    #nl-overlay.open { display: flex; }
    @keyframes nlFadeIn { from { opacity:0; } to { opacity:1; } }
    .nl-box {
      background: var(--bg-panel);
      border: 1px solid var(--border);
      max-width: 440px; width: 100%;
      position: relative;
      box-shadow: 0 24px 60px rgba(0,0,0,0.25);
      animation: nlSlideUp 0.35s cubic-bezier(0.34,1.2,0.64,1);
      overflow: hidden;
    }
    @keyframes nlSlideUp {
      from { opacity:0; transform: translateY(30px) scale(0.97); }
      to   { opacity:1; transform: translateY(0) scale(1); }
    }
    .nl-hero {
      height: 160px; background: linear-gradient(135deg,var(--bg-hero-start),var(--bg-hero-end));
      display: flex; align-items: center; justify-content: center;
      font-size: 3rem;
    }
    .nl-body { padding: 1.8rem 2rem 2rem; }
    .nl-heading {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.6rem; font-weight: 300;
      color: var(--text-primary); margin-bottom: 0.5rem; line-height: 1.25;
    }
    .nl-body-text { font-size: 0.88rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 1.4rem; }
    .nl-form { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .nl-input {
      flex: 1; min-width: 180px;
      padding: 0.72rem 1rem;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text-primary);
      font-family: inherit; font-size: 0.85rem;
    }
    .nl-input:focus { outline: none; border-color: var(--accent); }
    .nl-input::placeholder { color: var(--text-muted); }
    .nl-btn {
      padding: 0.72rem 1.2rem;
      background: var(--accent); color: #fff;
      font-family: inherit; font-size: 0.78rem;
      font-weight: 600; letter-spacing: 0.08em;
      text-transform: uppercase; cursor: pointer;
      border: none; white-space: nowrap;
      transition: background 0.18s;
    }
    .nl-btn:hover { background: var(--accent-dark); }
    .nl-skip {
      display: block; text-align: center;
      font-size: 0.72rem; color: var(--text-muted);
      margin-top: 1rem; cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .nl-skip:hover { color: var(--text-primary); }
    .nl-success {
      display: none; text-align: center;
      padding: 1rem 0 0.5rem;
      font-size: 0.9rem; color: var(--text-primary);
      font-weight: 500; line-height: 1.5;
    }
    .nl-close-btn {
      position: absolute; top: 0.75rem; right: 0.75rem;
      background: rgba(0,0,0,0.3); color: #fff;
      border: none; width: 28px; height: 28px;
      border-radius: 50%; cursor: pointer;
      font-size: 0.9rem; display: flex; align-items: center; justify-content: center;
      transition: background 0.18s;
    }
    .nl-close-btn:hover { background: rgba(0,0,0,0.55); }
    [dir="rtl"] .nl-close-btn { right: auto; left: 0.75rem; }
    [dir="rtl"] .nl-heading { font-family: 'Noto Kufi Arabic', sans-serif; }
  `);

  const overlay = document.createElement('div');
  overlay.id        = 'nl-overlay';
  overlay.innerHTML = `
    <div class="nl-box" role="dialog" aria-modal="true" aria-labelledby="nl-heading">
      <div class="nl-hero">💌</div>
      <button class="nl-close-btn" id="nl-close" aria-label="Close">✕</button>
      <div class="nl-body">
        <h2 class="nl-heading" id="nl-heading"></h2>
        <p class="nl-body-text" id="nl-body-text"></p>
        <div class="nl-form" id="nl-form">
          <input class="nl-input" id="nl-email" type="email" autocomplete="email">
          <button class="nl-btn" id="nl-submit"></button>
        </div>
        <div class="nl-success" id="nl-success"></div>
        <span class="nl-skip" id="nl-skip" role="button" tabindex="0">No thanks</span>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  function _fillNl() {
    const L   = _lang();
    const cfg = NEWSLETTER_CONFIG;
    const discOn = cfg.discountActive !== false;

    document.getElementById('nl-heading').textContent = _t(cfg.heading);

    /* Body text + button swap when discount is OFF */
    const bodyText = discOn
      ? _t(cfg.body).replace('{pct}', cfg.discountPct || 10)
      : (L === 'ar'
          ? 'كوني أول من يعلم بالوصولات الجديدة والعروض الحصرية.'
          : 'Be first to know about new arrivals & exclusive offers.');

    const btnText = discOn
      ? _t(cfg.btnLabel)
      : (L === 'ar' ? 'اشتركي الآن' : 'Subscribe');

    document.getElementById('nl-body-text').textContent = bodyText;
    document.getElementById('nl-submit').textContent    = btnText;
    document.getElementById('nl-email').placeholder     = _t(cfg.placeholder);
    document.getElementById('nl-success').textContent   = _t(cfg.successMsg);
    const skip = document.getElementById('nl-skip');
    if (skip) skip.textContent = L === 'ar' ? 'لا شكراً' : 'No thanks';
  }
  _fillNl();

  function _closeNl() {
    overlay.classList.remove('open');
  }

  document.getElementById('nl-close').addEventListener('click', _closeNl);
  document.getElementById('nl-skip').addEventListener('click',  _closeNl);
  overlay.addEventListener('click', e => { if (e.target === overlay) _closeNl(); });

  /* Show after initial delay, then keep repeating every repeatMs until subscribed */
  function _tryShow() {
    try {
      if (!localStorage.getItem(NEWSLETTER_CONFIG.storageKey)) {
        overlay.classList.add('open');
        _fillNl();
      }
    } catch(e) {
      overlay.classList.add('open');
      _fillNl();
    }
  }

  setTimeout(() => {
    _tryShow();
    /* After first show, repeat every repeatMs */
    setInterval(_tryShow, NEWSLETTER_CONFIG.repeatMs);
  }, NEWSLETTER_CONFIG.delayMs);

  document.getElementById('nl-submit').addEventListener('click', async () => {
    const email = document.getElementById('nl-email').value.trim();
    if (!email || !email.includes('@')) {
      document.getElementById('nl-email').focus();
      return;
    }

    const submitBtn = document.getElementById('nl-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = _lang() === 'ar' ? 'جارٍ...' : 'Sending…';

    /* Generate code ONLY when discount is ON */
    const _discOn = NEWSLETTER_CONFIG.discountActive === true || NEWSLETTER_CONFIG.discountActive === 'true';
    const _pct0   = _discOn ? (parseInt(NEWSLETTER_CONFIG.discountPct, 10) || 10) : 0;
    const _generatedCode = _discOn
      ? ('NOVA' + _pct0 + '-' + Math.random().toString(36).substring(2, 7).toUpperCase())
      : null;

    /* Subscribe via backend API */
    try {
      const backendUrl = (typeof BACKEND_URL !== 'undefined') ? BACKEND_URL : '';
      const apiRes = await fetch(backendUrl + '/api/newsletter', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, lang: _lang(), discount_code: _discOn ? _generatedCode : null }),
      });
      const apiData = await apiRes.json();

      /* Rate limited — close silently, no message */
      if (apiRes.status === 429 || apiData.error === 'already_limited') {
        submitBtn.disabled = false;
        submitBtn.textContent = _t(NEWSLETTER_CONFIG.btnLabel);
        overlay.classList.remove('open');
        try { localStorage.setItem(NEWSLETTER_CONFIG.storageKey, '1'); } catch(e) {}
        return;
      }

      /* Email already in DB — close new popup, hand off to returning popup */
      if (apiData.already === true) {
        submitBtn.disabled = false;
        submitBtn.textContent = _t(NEWSLETTER_CONFIG.btnLabel);
        /* Mark as subscribed so returning popup shows next time */
        try { localStorage.setItem(NEWSLETTER_CONFIG.storageKey, '1'); } catch(e) {}
        /* Close new-subscriber popup */
        overlay.classList.remove('open');
        /* Open returning popup after short pause, pre-filled with their code */
        setTimeout(() => {
          if (typeof _openReturningPopup === 'function') {
            _openReturningPopup(email, apiData.code || null);
          }
        }, 350);
        return;
      }

      /* API error — throw so catch block runs, then falls through to show discount */
      if (!apiRes.ok) throw new Error(apiData.error || 'Subscribe failed');

      /* New subscriber (success:true, already:undefined) — fall through to discount code below */
    } catch(err) {
      /* Non-fatal — show success anyway (UX) but log it */
      console.warn('[NOVA] Newsletter API error:', err.message);
    }

    /* _discOn and _generatedCode already set above, just use them here */
    const discountIsOn = _discOn;
    const pct  = _pct0;
    const code = _generatedCode;

    /* Hide form + hero, show success */
    document.getElementById('nl-form').style.display    = 'none';
    document.getElementById('nl-skip').style.display    = 'none';
    document.querySelector('.nl-hero').style.display    = 'none';
    document.querySelector('.nl-heading') && (document.querySelector('.nl-heading').style.display = 'none');
    document.querySelector('.nl-body-text') && (document.querySelector('.nl-body-text').style.display = 'none');
    const successEl = document.getElementById('nl-success');
    const isAr = _lang() === 'ar';
    const showDiscount = discountIsOn && pct > 0 && code;

    /* All text built outside template literals — no Arabic inside attrs */
    const _welcome    = isAr ? '\u0645\u0631\u062d\u0628\u0627\u064b \u0628\u0643 \u0641\u064a \u0639\u0627\u0626\u0644\u0629 NOVA!' : "You're in the NOVA Family!";
    const _noDiscMsg  = isAr
      ? '\u0633\u062a\u0643\u0648\u0646\u064a\u0646 \u0623\u0648\u0644 \u0645\u0646 \u064a\u0639\u0644\u0645 \u0628\u0623\u062d\u062f\u062b \u0627\u0644\u0648\u0635\u0648\u0644\u0627\u062a \u0648\u0627\u0644\u0639\u0631\u0648\u0636 \u0627\u0644\u062d\u0635\u0631\u064a\u0629.'
      : "You'll be first to know about new arrivals & exclusive offers.";

    let _innerHTML = '<div style="text-align:center;padding:1.2rem 0">';
    _innerHTML += '<div style="font-size:2.8rem;margin-bottom:0.8rem">' + (showDiscount ? '\uD83C\uDF89' : '\uD83D\uDC8C') + '</div>';
    _innerHTML += '<p style="font-size:1.05rem;font-weight:600;color:var(--text-primary);margin-bottom:0.5rem">' + _welcome + '</p>';

    if (showDiscount) {
      const _codeLabel  = isAr
        ? ('\u0643\u0648\u062f \u0627\u0644\u062e\u0635\u0645 ' + pct + '% \u0627\u0644\u062e\u0627\u0635 \u0628\u0643:')
        : ('Your exclusive ' + pct + '% discount code:');
      const _copyHint   = isAr
        ? '\u0627\u0646\u0642\u0631 \u0639\u0644\u0649 \u0627\u0644\u0643\u0648\u062f \u0644\u0646\u0633\u062e\u0647 \u2014 \u0627\u0633\u062a\u062e\u062f\u0645\u0647 \u0639\u0646\u062f \u0627\u0644\u062f\u0641\u0639'
        : 'Click the code to copy it \u2014 use it at checkout';
      const _onclick = 'var el=this;navigator.clipboard&&navigator.clipboard.writeText(el.dataset.code);' +
        "el.style.background='var(--accent)';el.style.color='#fff';" +
        "setTimeout(function(){el.style.background='';el.style.color='';},1200)";
      _innerHTML += '<p style="font-size:0.84rem;color:var(--text-muted);margin-bottom:1rem">' + _codeLabel + '</p>';
      _innerHTML += '<div data-code="' + code + '" onclick="' + _onclick + '" style="' +
        'background:var(--bg-secondary);border:2px dashed var(--accent);padding:0.8rem 1.5rem;' +
        "font-family:'Courier New',monospace;font-size:1.3rem;font-weight:700;" +
        'letter-spacing:0.12em;color:var(--accent);margin-bottom:0.8rem;user-select:all;cursor:pointer;">' +
        code + '</div>';
      _innerHTML += '<p style="font-size:0.72rem;color:var(--text-muted)">' + _copyHint + '</p>';
    } else {
      /* Discount OFF — just show warm welcome, nothing else */
      _innerHTML += '<p style="font-size:0.87rem;color:var(--text-muted);line-height:1.5">' + _noDiscMsg + '</p>';
    }

    _innerHTML += '</div>';
    successEl.innerHTML = _innerHTML;

        successEl.style.display = 'block';
    try { localStorage.setItem(NEWSLETTER_CONFIG.storageKey, '1'); } catch(e) {}
    /* Don't auto-close — let them copy the code first */
    submitBtn.disabled = false;
    submitBtn.textContent = _t(NEWSLETTER_CONFIG.btnLabel);
  });

  /* (first show + repeat handled above) */
}

/* ══════════════════════════════════════════════════════════
   #12 RECENTLY VIEWED
══════════════════════════════════════════════════════════ */
function trackRecentlyViewed(productId) {
  try {
    let rv = JSON.parse(localStorage.getItem(RV_KEY) || '[]');
    rv = rv.filter(id => id !== productId);
    rv.unshift(productId);
    if (rv.length > RV_MAX) rv = rv.slice(0, RV_MAX);
    localStorage.setItem(RV_KEY, JSON.stringify(rv));
  } catch(e) {}
}

function renderRecentlyViewed() {
  let section = document.getElementById('recently-viewed-section');
  if (!section) {
    section = document.createElement('section');
    section.id        = 'recently-viewed-section';
    section.className = 'rv-section';
    /* Insert before the reviews section */
    const reviews = document.getElementById('reviews-section');
    if (reviews) reviews.parentNode.insertBefore(section, reviews);
    else document.getElementById('shop')?.after(section);
  }

  let ids = [];
  try { ids = JSON.parse(localStorage.getItem(RV_KEY) || '[]'); } catch(e) {}

  /* Filter to products that still exist */
  const rvProducts = ids
    .map(id => (typeof products !== 'undefined' ? products.find(p => p.id === id) : null))
    .filter(Boolean);

  if (rvProducts.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = '';
  const L = _lang();

  section.innerHTML = `
    <h2 class="rv-title">${L === 'ar' ? 'شاهدتها مؤخراً' : 'Recently Viewed'}</h2>
    <div class="rv-grid">
      ${rvProducts.map(p => {
        const img = (typeof getCurrentImage === 'function') ? getCurrentImage(p, 0) : (p.colors?.[0]?.images?.[0] || '');
        const name = typeof getName === 'function' ? getName(p) : (p.name[L] || p.name.en);
        const price = typeof fmt === 'function' ? fmt(p.price) : `$${p.price}`;
        const disc = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
        return `
          <div class="rv-card" onclick="openProduct('${p.id}')">
            <div class="rv-img-wrap">
              <img src="${img}" alt="${name}" loading="lazy">
              ${disc > 0 ? `<span class="rv-badge">-${disc}%</span>` : ''}
            </div>
            <div class="rv-info">
              <p class="rv-name">${name}</p>
              <div class="rv-price">
                <span class="rv-price-now">${price}</span>
                ${p.oldPrice ? `<span class="rv-price-old">${fmt(p.oldPrice)}</span>` : ''}
              </div>
            </div>
          </div>`;
      }).join('')}
    </div>
  `;
}

_injectStyle('rv-styles', `
  .rv-section {
    max-width: 1200px; margin: 0 auto;
    padding: 2rem 2rem 0;
  }
  .rv-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.6rem; font-weight: 300;
    color: var(--text-primary);
    margin-bottom: 1.2rem;
  }
  body[dir="rtl"] .rv-title { font-family: 'Noto Kufi Arabic', sans-serif; }
  .rv-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }
  .rv-card {
    cursor: pointer;
    transition: transform 0.2s;
  }
  .rv-card:hover { transform: translateY(-3px); }
  .rv-img-wrap {
    position: relative;
    aspect-ratio: 3/4; overflow: hidden;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
  }
  .rv-img-wrap img { width:100%; height:100%; object-fit:cover; }
  .rv-badge {
    position: absolute; top:0.4rem; left:0.4rem;
    background: var(--accent); color:#fff;
    font-size:0.6rem; font-weight:700;
    padding:0.15rem 0.4rem; letter-spacing:0.04em;
  }
  body[dir="rtl"] .rv-badge { left:auto; right:0.4rem; }
  .rv-info { padding: 0.5rem 0 0; }
  .rv-name {
    font-size: 0.8rem; font-weight: 500;
    color: var(--text-primary); line-height: 1.3;
    margin-bottom: 0.25rem;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
  }
  .rv-price { display:flex; gap:0.4rem; align-items:center; flex-wrap:wrap; }
  .rv-price-now { font-size:0.82rem; font-weight:600; color:var(--accent); }
  .rv-price-old { font-size:0.72rem; text-decoration:line-through; color:var(--text-muted); }
`);

/* ── Hook into openProduct to track view ── */
(function _patchOpenProduct() {
  const orig = window.openProduct;
  if (!orig) { /* retry once DOM scripts settle */
    setTimeout(_patchOpenProduct, 200); return;
  }
  window.openProduct = function(id) {
    orig(id);
    trackRecentlyViewed(id);
    /* Small delay so modal renders first */
    setTimeout(renderRecentlyViewed, 100);
  };
})();

/* ══════════════════════════════════════════════════════════
   #13 SALE COUNTDOWN TIMER
══════════════════════════════════════════════════════════ */
function initCountdown() {
  if (!SALE_CONFIG.active) return;

  const endTime = new Date(SALE_CONFIG.endDate).getTime();
  if (isNaN(endTime)) {
    console.warn('[NOVA] SALE_CONFIG.endDate is not a valid date.');
    return;
  }

  /* Build the timer banner HTML */
  const bar = document.createElement('div');
  bar.id        = 'sale-countdown';
  bar.className = 'sale-countdown';
  bar.innerHTML = `
    <span class="sc-label" id="sc-label"></span>
    <div class="sc-units">
      <div class="sc-unit"><span class="sc-num" id="sc-days">00</span><span class="sc-name" id="sc-d-name"></span></div>
      <span class="sc-colon">:</span>
      <div class="sc-unit"><span class="sc-num" id="sc-hrs">00</span><span class="sc-name" id="sc-h-name"></span></div>
      <span class="sc-colon">:</span>
      <div class="sc-unit"><span class="sc-num" id="sc-min">00</span><span class="sc-name" id="sc-m-name"></span></div>
      <span class="sc-colon">:</span>
      <div class="sc-unit"><span class="sc-num" id="sc-sec">00</span><span class="sc-name" id="sc-s-name"></span></div>
    </div>
  `;

  _injectStyle('countdown-styles', `
    .sale-countdown {
      background: linear-gradient(135deg, #1a1208, #2d1e0a);
      color: #fff;
      display: flex; align-items: center; justify-content: center;
      gap: 1.2rem; flex-wrap: wrap;
      padding: 0.75rem 1.5rem;
      font-size: 0.82rem;
      border-bottom: 1px solid rgba(201,169,110,0.3);
    }
    [data-theme="light"] .sale-countdown {
      background: linear-gradient(135deg, #0a0a0a, #1a1310);
    }
    .sc-label {
      color: var(--accent);
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      font-size: 0.76rem;
    }
    body[dir="rtl"] .sc-label { letter-spacing: 0; }
    .sc-units {
      display: flex; align-items: center; gap: 0.3rem;
    }
    .sc-unit {
      display: flex; flex-direction: column; align-items: center;
      min-width: 48px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(201,169,110,0.25);
      padding: 0.35rem 0.5rem;
    }
    .sc-num {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.5rem; font-weight: 600;
      color: #fff; line-height: 1;
      min-width: 2ch; text-align: center;
      transition: color 0.2s;
    }
    .sc-num.tick { color: var(--accent); }
    .sc-name {
      font-size: 0.52rem; text-transform: uppercase;
      letter-spacing: 0.08em; color: rgba(255,255,255,0.5);
      margin-top: 0.15rem;
    }
    body[dir="rtl"] .sc-name { letter-spacing: 0; }
    .sc-colon {
      font-size: 1.3rem; color: rgba(255,255,255,0.4);
      margin-bottom: 0.8rem; font-weight: 300;
    }
    .sc-ended {
      color: rgba(255,255,255,0.5);
      font-size: 0.85rem;
      padding: 0.2rem 0;
    }
    @media (max-width: 480px) {
      .sale-countdown { gap: 0.8rem; padding: 0.65rem 1rem; }
      .sc-unit { min-width: 40px; padding: 0.3rem 0.4rem; }
      .sc-num { font-size: 1.2rem; }
    }
  `);

  /* Insert after promo banner (or at top of body) */
  const promo = document.getElementById('promo-banner');
  const header = document.querySelector('header');
  if (promo)  promo.after(bar);
  else if (header) document.body.insertBefore(bar, header);
  else document.body.insertBefore(bar, document.body.firstChild);

  function _updateLabels() {
    const u = SALE_CONFIG.units[_lang()] || SALE_CONFIG.units.en;
    document.getElementById('sc-label').textContent  = _t(SALE_CONFIG.label);
    document.getElementById('sc-d-name').textContent = u.days;
    document.getElementById('sc-h-name').textContent = u.hours;
    document.getElementById('sc-m-name').textContent = u.mins;
    document.getElementById('sc-s-name').textContent = u.secs;
  }

  function _pad(n) { return String(n).padStart(2, '0'); }

  function _tick() {
    const now  = Date.now();
    const diff = endTime - now;

    if (diff <= 0) {
      clearInterval(_saleInterval);
      const endedText = _lang() === 'ar' ? '\u0627\u0646\u062a\u0647\u0649 \u0627\u0644\u0639\u0631\u0636' : 'Sale Ended';
      bar.innerHTML = '<span class="sc-ended">' + endedText + '</span>';
      return;
    }

    const days  = Math.floor(diff / 86400000);
    const hrs   = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000) / 60000);
    const secs  = Math.floor((diff % 60000) / 1000);

    const secEl = document.getElementById('sc-sec');
    if (secEl) {
      secEl.textContent = _pad(secs);
      secEl.classList.add('tick');
      setTimeout(() => secEl?.classList.remove('tick'), 300);
    }
    const dEl = document.getElementById('sc-days');
    const hEl = document.getElementById('sc-hrs');
    const mEl = document.getElementById('sc-min');
    if (dEl) dEl.textContent = _pad(days);
    if (hEl) hEl.textContent = _pad(hrs);
    if (mEl) mEl.textContent = _pad(mins);
  }

  _updateLabels();
  _tick();
  _saleInterval = setInterval(_tick, 1000);

  /* Re-apply labels when language changes */
  const origSetLang = window.setLang;
  if (origSetLang) {
    window.setLang = function(lang) {
      origSetLang(lang);
      _updateLabels();
      _updatePromoBanner();
      /* Update newsletter popup text if it's open */
      if (document.getElementById('nl-overlay')?.classList.contains('open')) {
        try { _fillNl(); } catch(e) {}
      }
    };
  }
}

/* ══════════════════════════════════════════════════════════
   UTILITY: inject a <style> block once
══════════════════════════════════════════════════════════ */
function _injectStyle(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id; s.textContent = css;
  document.head.appendChild(s);
}

/* ══════════════════════════════════════════════════════════
   INIT — runs after DOM is ready
══════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════
   RETURNING SUBSCRIBER POPUP
   _buildReturningPopup() — builds DOM once (singleton)
   _openReturningPopup(email, code) — called from new popup handoff, goes straight to Screen 2
   initReturningPopup() — timer-based, shows Screen 1
══════════════════════════════════════════════════════════ */
let _retOverlay = null;

function _buildReturningPopup() {
  if (_retOverlay) return;

  _injectStyle('nl-ret-styles', `
    #nl-ret-overlay {
      display:none; position:fixed; inset:0; z-index:3001;
      background:rgba(0,0,0,0.65); backdrop-filter:blur(5px);
      align-items:center; justify-content:center; padding:1rem;
      animation:nlFadeIn 0.3s ease;
    }
    #nl-ret-overlay.open { display:flex; }
    .nl-ret-box {
      background:var(--bg-panel); border:1px solid var(--border);
      max-width:420px; width:100%; position:relative;
      box-shadow:0 24px 60px rgba(0,0,0,0.35);
      animation:nlSlideUp 0.35s cubic-bezier(0.34,1.2,0.64,1); overflow:hidden;
    }
    .nl-ret-hero {
      height:120px;
      background:linear-gradient(135deg,rgba(201,169,110,0.18),rgba(201,169,110,0.04));
      display:flex; align-items:center; justify-content:center;
      font-size:3rem; border-bottom:1px solid var(--border);
    }
    .nl-ret-body { padding:1.8rem 2rem 2rem; }
    .nl-ret-heading {
      font-family:'Cormorant Garamond',serif; font-size:1.5rem;
      font-weight:300; color:var(--text-primary); margin-bottom:0.4rem; line-height:1.25;
    }
    [dir='rtl'] .nl-ret-heading { font-family:'Noto Kufi Arabic',sans-serif; }
    .nl-ret-sub { font-size:0.86rem; color:var(--text-muted); line-height:1.6; margin-bottom:1.4rem; }
    .nl-ret-form { display:flex; gap:0.5rem; flex-wrap:wrap; }
    .nl-ret-input {
      flex:1; min-width:180px; padding:0.72rem 1rem;
      border:1px solid var(--border); background:var(--surface);
      color:var(--text-primary); font-family:inherit; font-size:0.85rem;
    }
    .nl-ret-input:focus { outline:none; border-color:var(--accent); }
    .nl-ret-input::placeholder { color:var(--text-muted); }
    .nl-ret-btn {
      padding:0.72rem 1.2rem; background:var(--accent); color:#fff;
      font-family:inherit; font-size:0.78rem; font-weight:600;
      letter-spacing:0.08em; text-transform:uppercase; cursor:pointer;
      border:none; white-space:nowrap; transition:background 0.18s;
    }
    .nl-ret-btn:hover { background:var(--accent-dark); }
    .nl-ret-skip {
      display:block; text-align:center; font-size:0.72rem; color:var(--text-muted);
      margin-top:1rem; cursor:pointer; text-decoration:underline; text-underline-offset:2px;
    }
    .nl-ret-skip:hover { color:var(--text-primary); }
    .nl-ret-close {
      position:absolute; top:0.75rem; right:0.75rem;
      background:rgba(0,0,0,0.3); color:#fff; border:none;
      width:28px; height:28px; border-radius:50%; cursor:pointer;
      font-size:0.9rem; display:flex; align-items:center; justify-content:center;
      transition:background 0.18s;
    }
    .nl-ret-close:hover { background:rgba(0,0,0,0.55); }
    [dir='rtl'] .nl-ret-close { right:auto; left:0.75rem; }
    #nl-ret-s2.hidden { display:none; }
  `);

  _retOverlay = document.createElement('div');
  _retOverlay.id = 'nl-ret-overlay';
  _retOverlay.innerHTML = `
    <div class="nl-ret-box" role="dialog" aria-modal="true">
      <div class="nl-ret-hero" id="nl-ret-hero">&#x1F381;</div>
      <button class="nl-ret-close" id="nl-ret-close" aria-label="Close">&#x2715;</button>
      <div class="nl-ret-body">
        <div id="nl-ret-s1">
          <h2 class="nl-ret-heading" id="nl-ret-heading"></h2>
          <p  class="nl-ret-sub"     id="nl-ret-sub"></p>
          <div class="nl-ret-form">
            <input  class="nl-ret-input" id="nl-ret-email" type="email" autocomplete="email" />
            <button class="nl-ret-btn"   id="nl-ret-btn"></button>
          </div>
          <span class="nl-ret-skip" id="nl-ret-skip"></span>
        </div>
        <div id="nl-ret-s2" class="hidden">
          <div id="nl-ret-result"></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(_retOverlay);

  function _closeRet() { _retOverlay.classList.remove('open'); }
  document.getElementById('nl-ret-close').addEventListener('click', _closeRet);
  document.getElementById('nl-ret-skip').addEventListener('click',  _closeRet);
  _retOverlay.addEventListener('click', e => { if (e.target === _retOverlay) _closeRet(); });

  document.getElementById('nl-ret-btn').addEventListener('click', async () => {
    const email = document.getElementById('nl-ret-email').value.trim();
    if (!email || !email.includes('@')) { document.getElementById('nl-ret-email').focus(); return; }
    const btn = document.getElementById('nl-ret-btn');
    btn.disabled = true;
    btn.textContent = _lang() === 'ar' ? '\u062c\u0627\u0631\u064d...' : 'Loading\u2026';
    const _dOn  = NEWSLETTER_CONFIG.discountActive === true || NEWSLETTER_CONFIG.discountActive === 'true';
    const _pct  = parseInt(NEWSLETTER_CONFIG.discountPct, 10) || 10;
    const _nc   = _dOn ? ('NOVA' + _pct + '-' + Math.random().toString(36).substring(2,7).toUpperCase()) : null;
    try {
      const bu  = (typeof BACKEND_URL !== 'undefined') ? BACKEND_URL : '';
      const res = await fetch(bu + '/api/newsletter', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email, lang: _lang(), discount_code: _nc }),
      });
      const data = await res.json();
      _showRetS2(data.code || null); /* always use what DB has, ignore locally generated if disc OFF */
    } catch(_) { _showRetS2(null); }
  });
}

function _showRetS2(code) {
  const L    = _lang();
  const _dOn = NEWSLETTER_CONFIG.discountActive === true || NEWSLETTER_CONFIG.discountActive === 'true';
  const _pct = parseInt(NEWSLETTER_CONFIG.discountPct, 10) || 10;
  document.getElementById('nl-ret-s1').style.display   = 'none';
  document.getElementById('nl-ret-hero').style.display = 'none';
  document.getElementById('nl-ret-s2').classList.remove('hidden');
  const el = document.getElementById('nl-ret-result');

  if (code) { /* show code if it exists — discountActive only blocks new code generation */
    const _oc  = 'var el=this;navigator.clipboard&&navigator.clipboard.writeText(el.dataset.code);'
      + "el.style.background='var(--accent)';el.style.color='#fff';"
      + "setTimeout(function(){el.style.background='';el.style.color='';},1200)";
    const _lbl = L === 'ar'
      ? ('\u0643\u0648\u062f \u062e\u0635\u0645\u0643 \u0627\u0644\u062d\u0635\u0631\u064a ' + _pct + '%:')
      : ('Your exclusive ' + _pct + '% discount code:');
    el.innerHTML =
      '<div style="text-align:center;padding:1.2rem 0">'
      + '<div style="font-size:2.4rem;margin-bottom:0.6rem">\ud83c\udf89</div>'
      + '<p style="font-size:1rem;font-weight:600;color:var(--text-primary);margin-bottom:0.3rem">'
      + (L === 'ar' ? '\u0645\u0631\u062d\u0628\u0627\u064b \u0628\u0643 \u0645\u062c\u062f\u062f\u0627\u064b \u0641\u064a NOVA!' : 'Welcome back to NOVA!')
      + '</p><p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:1rem">' + _lbl + '</p>'
      + '<div data-code="' + code + '" onclick="' + _oc + '" style="'
      + 'background:var(--bg-secondary);border:2px dashed var(--accent);padding:0.7rem 1.4rem;'
      + "font-family:'Courier New',monospace;font-size:1.2rem;font-weight:700;"
      + 'letter-spacing:0.12em;color:var(--accent);margin-bottom:0.6rem;user-select:all;cursor:pointer;">'
      + code + '</div>'
      + '<p style="font-size:0.7rem;color:var(--text-muted)">'
      + (L === 'ar' ? '\u0627\u0646\u0642\u0631 \u0644\u0646\u0633\u062e\u0647 \u2014 \u0627\u0633\u062a\u062e\u062f\u0645\u0647 \u0639\u0646\u062f \u0627\u0644\u062f\u0641\u0639' : 'Click to copy \u2014 use at checkout')
      + '</p></div>';
  } else {
    el.innerHTML =
      '<div style="text-align:center;padding:1.5rem 0">'
      + '<div style="font-size:2rem;margin-bottom:0.6rem">\ud83d\udc8c</div>'
      + '<p style="font-weight:600;margin-bottom:0.3rem">'
      + (L === 'ar' ? '\u0623\u0646\u062a \u0645\u0634\u062a\u0631\u0643 \u0628\u0627\u0644\u0641\u0639\u0644!' : "You're on our list!")
      + '</p><p style="font-size:0.82rem;color:var(--text-muted)">'
      + (L === 'ar' ? '\u0633\u062a\u0643\u0648\u0646 \u0623\u0648\u0644 \u0645\u0646 \u064a\u0639\u0644\u0645 \u0628\u0627\u0644\u0648\u0635\u0648\u0644\u0627\u062a \u0648\u0627\u0644\u0639\u0631\u0648\u0636 \u0627\u0644\u062c\u062f\u064a\u062f\u0629.' : "You'll be first to know about new arrivals & offers.")
      + '</p></div>';
    setTimeout(() => _retOverlay.classList.remove('open'), 2500);
  }
}

function _fillRetS1() {
  const L    = _lang();
  const dOn  = NEWSLETTER_CONFIG.discountActive === true || NEWSLETTER_CONFIG.discountActive === 'true';
  const pct  = parseInt(NEWSLETTER_CONFIG.discountPct, 10) || 10;
  document.getElementById('nl-ret-heading').textContent =
    L === 'ar' ? '\u0645\u0631\u062d\u0628\u0627\u064b \u0628\u0639\u0648\u062f\u062a\u0643 \ud83d\udc4b' : 'Welcome Back \ud83d\udc4b';
  document.getElementById('nl-ret-sub').textContent = dOn
    ? (L === 'ar'
        ? ('\u0623\u0646\u062a \u0645\u0634\u062a\u0631\u0643 \u0628\u0627\u0644\u0641\u0639\u0644! \u0623\u062f\u062e\u0644 \u0628\u0631\u064a\u062f\u0643 \u0644\u0644\u062d\u0635\u0648\u0644 \u0639\u0644\u0649 \u062e\u0635\u0645 ' + pct + '% \u0639\u0644\u0649 \u0637\u0644\u0628\u0643 \u0627\u0644\u0642\u0627\u062f\u0645.')
        : ('You\u2019re subscribed! Enter your email to get your ' + pct + '% off your next purchase.'))
    : (L === 'ar'
        ? '\u0623\u0646\u062a \u0645\u0634\u062a\u0631\u0643 \u2014 \u0633\u062a\u0643\u0648\u0646 \u0623\u0648\u0644 \u0645\u0646 \u064a\u0639\u0644\u0645 \u0628\u0627\u0644\u0648\u0635\u0648\u0644\u0627\u062a \u0648\u0627\u0644\u0639\u0631\u0648\u0636 \u0627\u0644\u062c\u062f\u064a\u062f\u0629.'
        : 'You\u2019re subscribed \u2014 you\u2019ll be first to know about new arrivals & offers.');
  document.getElementById('nl-ret-btn').textContent   = L === 'ar' ? '\u062c\u0644\u0628 \u0643\u0648\u062f\u064a' : 'Get My Code';
  document.getElementById('nl-ret-email').placeholder = L === 'ar' ? '\u0628\u0631\u064a\u062f\u0643 \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a' : 'Your email address';
  document.getElementById('nl-ret-skip').textContent  = L === 'ar' ? '\u0644\u0627 \u0634\u0643\u0631\u0627\u064b' : 'No thanks';
}

/* Called from new-subscriber popup when already:true — skips Screen 1, shows code directly */
function _openReturningPopup(email, code) {
  _buildReturningPopup();
  /* Reset */
  document.getElementById('nl-ret-s1').style.display   = '';
  document.getElementById('nl-ret-hero').style.display  = '';
  document.getElementById('nl-ret-s2').classList.add('hidden');
  _fillRetS1();
  _retOverlay.classList.add('open');
  /* Go straight to code */
  _showRetS2(code);
}

/* Timer-based — shows Screen 1 for known subscribers */
function initReturningPopup() {
  if (!NEWSLETTER_CONFIG.active) return;
  _buildReturningPopup();

  function _tryShowRet() {
    try { if (!localStorage.getItem(NEWSLETTER_CONFIG.storageKey)) return; } catch(e) {}
    /* Reset to Screen 1 */
    document.getElementById('nl-ret-s1').style.display   = '';
    document.getElementById('nl-ret-hero').style.display  = '';
    document.getElementById('nl-ret-s2').classList.add('hidden');
    const emailEl = document.getElementById('nl-ret-email');
    const btnEl   = document.getElementById('nl-ret-btn');
    if (emailEl) emailEl.value = '';
    if (btnEl)   btnEl.disabled = false;
    _fillRetS1();
    _retOverlay.classList.add('open');
  }

  setTimeout(() => {
    _tryShowRet();
    setInterval(_tryShowRet, RETURN_CONFIG.repeatMs);
  }, NEWSLETTER_CONFIG.delayMs + 2000);
}


async function initEngagement() {
  /* ── Fetch settings from API and apply to configs ── */
  try {
    const backendUrl = (typeof BACKEND_URL !== 'undefined') ? BACKEND_URL : '';
    const res  = await fetch(backendUrl + '/api/settings');
    if (res.ok) {
      const s = await res.json();

      /* Newsletter */
      if (s.newsletter_popup_active    !== undefined) NEWSLETTER_CONFIG.active        = s.newsletter_popup_active    === 'true';
      if (s.newsletter_discount_active !== undefined) NEWSLETTER_CONFIG.discountActive = s.newsletter_discount_active === 'true';
      else NEWSLETTER_CONFIG.discountActive = true; /* key missing → default ON */
      if (s.newsletter_discount_pct    !== undefined) NEWSLETTER_CONFIG.discountPct    = parseInt(s.newsletter_discount_pct, 10) || 10;
      console.log('[NOVA] discount settings:', { active: NEWSLETTER_CONFIG.discountActive, pct: NEWSLETTER_CONFIG.discountPct });

      /* Promo banner */
      if (s.promo_banner_active   !== undefined) PROMO_CONFIG.active     = s.promo_banner_active === 'true';
      if (s.promo_banner_text_en  !== undefined) PROMO_CONFIG.text.en    = s.promo_banner_text_en;
      if (s.promo_banner_text_ar  !== undefined) PROMO_CONFIG.text.ar    = s.promo_banner_text_ar;

      /* Sale timer */
      if (s.sale_timer_active     !== undefined) SALE_CONFIG.active      = s.sale_timer_active === 'true';
      if (s.sale_timer_end_date   !== undefined) SALE_CONFIG.endDate     = s.sale_timer_end_date;
      if (s.sale_timer_label_en   !== undefined) SALE_CONFIG.label.en    = s.sale_timer_label_en;
      if (s.sale_timer_label_ar   !== undefined) SALE_CONFIG.label.ar    = s.sale_timer_label_ar;
    }
  } catch (_) { /* silent — use hardcoded defaults */ }

  initPromoBanner();
  initCountdown();
  /* Route: returning subscriber sees their own popup, new sees the standard one */
  try {
    if (localStorage.getItem(NEWSLETTER_CONFIG.storageKey)) {
      initReturningPopup();
    } else {
      initNewsletterPopup();
    }
  } catch(e) { initNewsletterPopup(); }
  renderRecentlyViewed();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEngagement);
} else {
  /* Already loaded — run on next tick so main init() finishes first */
  setTimeout(initEngagement, 0);
}
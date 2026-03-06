/* ============================================================
   REVIEWS.JS — Customer reviews section rendering
   Pure function definitions only — no top-level execution.
   Depends on: i18n.js (t function via main script)
   BACKEND_URL is declared in index.html inline script — do NOT redeclare here
============================================================ */

const REVIEWS_DATA = [
  {
    product: { en: 'High-Waist Power Leggings', ar: 'لغنز ضاغط بخصر عالٍ' },
    stars: 5,
    text: {
      en: "These leggings are absolutely amazing — squat-proof, super comfortable, and they don't roll down during workouts. Already ordered two more pairs!",
      ar: 'هذا اللغنز رائع جداً — مقاوم لتمارين السكوات، مريح للغاية، ولا ينزل أثناء التمرين. لقد طلبت زوجين إضافيين بالفعل!'
    },
    name: 'Sarah M.', avatar: 'https://i.pravatar.cc/150?img=47',
    date: { en: 'January 2025', ar: 'يناير 2025' }
  },
  {
    product: { en: 'Classic White Sneakers', ar: 'حذاء رياضي أبيض كلاسيكي' },
    stars: 5,
    text: {
      en: 'The quality is outstanding for the price. Wore them every day for a month and they still look brand new. True to size!',
      ar: 'الجودة رائعة مقارنة بالسعر. ارتديتها كل يوم لمدة شهر ولا تزال تبدو جديدة. المقاس صحيح!'
    },
    name: 'Lina K.', avatar: 'https://i.pravatar.cc/150?img=32',
    date: { en: 'February 2025', ar: 'فبراير 2025' }
  },
  {
    product: { en: 'Golden Chain Necklace', ar: 'قلادة سلسلة ذهبية' },
    stars: 5,
    text: {
      en: "Got so many compliments on this necklace. The gold doesn't fade at all and it layers beautifully with my other jewelry.",
      ar: 'تلقيت الكثير من الإطراء على هذه القلادة. الذهب لا يتلاشى أبداً وتتناسق بشكل جميل مع مجوهراتي الأخرى.'
    },
    name: 'Nour A.', avatar: 'https://i.pravatar.cc/150?img=25',
    date: { en: 'January 2025', ar: 'يناير 2025' }
  },
  {
    product: { en: 'Essential Crop Tee', ar: 'تيشيرت كروب أساسي' },
    stars: 4,
    text: {
      en: 'Super soft fabric and the fit is perfect. Washes really well too — no shrinking after multiple washes. Will definitely buy more colors.',
      ar: 'قماش ناعم جداً والمقاس مثالي. يغسل بشكل ممتاز أيضاً — لا انكماش بعد غسلات متعددة. سأشتري ألواناً أخرى بالتأكيد.'
    },
    name: 'Maya R.', avatar: 'https://i.pravatar.cc/150?img=44',
    date: { en: 'March 2025', ar: 'مارس 2025' }
  },
  {
    product: { en: 'UV Protection Arm Sleeves', ar: 'كمام واقية من الأشعة فوق البنفسجية' },
    stars: 5,
    text: {
      en: 'Perfect for outdoor cycling. Stay in place the whole ride and keep the sun off completely. Great value for the quality.',
      ar: 'مثالية لركوب الدراجات في الهواء الطلق. تبقى في مكانها طوال الرحلة وتحمي من الشمس بالكامل. قيمة رائعة مقابل الجودة.'
    },
    name: 'Fatima H.', avatar: 'https://i.pravatar.cc/150?img=56',
    date: { en: 'February 2025', ar: 'فبراير 2025' }
  },
  {
    product: { en: 'Flare Lounge Pants', ar: 'بنطال فضفاض مضيء' },
    stars: 5,
    text: {
      en: 'I live in these pants. So buttery soft and the flare is so elegant. Perfect from yoga to brunch!',
      ar: 'أعيش في هذا البنطال. ناعم جداً والقصة الواسعة أنيقة جداً. مثالي من اليوغا إلى الإفطار!'
    },
    name: 'Rima S.', avatar: 'https://i.pravatar.cc/150?img=38',
    date: { en: 'March 2025', ar: 'مارس 2025' }
  }
];

/* ── unchanged ── */
function renderStars(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

/* ══════════════════════════════════════════════════════════
   RENDER REVIEWS — async
   1. Updates heading/subtitle from i18n
   2. Tries to fetch approved reviews from API
   3. Falls back to REVIEWS_DATA silently if API fails
   4. Renders review cards
   5. Injects the write-a-review form below the grid
══════════════════════════════════════════════════════════ */
async function renderReviews() {
  const heading = document.getElementById('reviews-heading');
  const subEl   = document.querySelector('#reviews-section p.sub');
  const basedOn = document.querySelector('#reviews-section .rating-details small');
  const grid    = document.querySelector('#reviews-section .reviews-grid');

  if (heading) heading.textContent = t('reviews.title');
  if (subEl)   subEl.textContent   = t('reviews.sub');
  if (basedOn) basedOn.textContent = t('reviews.basedOn');
  if (!grid)   return;

  let data = REVIEWS_DATA;

  try {
    const res = await fetch(BACKEND_URL + '/api/reviews');
    if (res.ok) {
      const fetched = await res.json();
      const rows = fetched.reviews ?? fetched;
      if (Array.isArray(rows) && rows.length > 0) data = rows;
    }
  } catch (_) { /* silent fallback to REVIEWS_DATA */ }

  grid.innerHTML = data.map(r => {
    const isApi   = r.text_en !== undefined;
    const product = isApi
      ? (currentLang === 'ar' ? (r.product_name_ar || r.product_name_en || '') : (r.product_name_en || ''))
      : (r.product[currentLang] || r.product.en);
    const text = isApi
      ? (currentLang === 'ar' ? (r.text_ar || r.text_en) : r.text_en)
      : (r.text[currentLang] || r.text.en);
    const author = isApi ? r.author : r.name;
    const avatar = isApi
      ? 'https://i.pravatar.cc/150?u=' + encodeURIComponent(r.author)
      : r.avatar;
    const date = isApi
      ? new Date(r.created_at).toLocaleDateString(
          currentLang === 'ar' ? 'ar-TN' : 'en-GB',
          { year: 'numeric', month: 'long' })
      : (r.date[currentLang] || r.date.en);

    return `
      <article class="review-card">
        <span class="review-product-tag">${product}</span>
        <div class="review-stars">${renderStars(r.stars)}</div>
        <p class="review-text">"${text}"</p>
        <div class="review-author">
          <img class="review-avatar" src="${avatar}" alt="${author}" loading="lazy">
          <div>
            <p class="review-name">${author}</p>
            <p class="review-date">${date}</p>
          </div>
        </div>
        <p class="review-verified">✓ ${t('reviews.verified')}</p>
      </article>`;
  }).join('');

  renderReviewForm();
}

/* ══════════════════════════════════════════════════════════
   REVIEW FORM — bilingual, beautiful, gold editorial style
   Injected once below #reviews-section
══════════════════════════════════════════════════════════ */
function renderReviewForm() {
  if (document.getElementById('nova-review-form-wrap')) return;

  const section = document.getElementById('reviews-section');
  if (!section) return;

  const isAr = typeof currentLang !== 'undefined' && currentLang === 'ar';
  const dir  = isAr ? 'rtl' : 'ltr';

  const L = {
    heading:   isAr ? 'شاركينا تجربتك'    : 'Share Your Experience',
    sub:       isAr ? 'رأيك يهمنا — ساعدي العملاء الأخريات في الاختيار'
                    : 'Your opinion matters — help other customers choose with confidence',
    namePH:    isAr ? 'اسمك'              : 'Your name',
    productPH: isAr ? 'اسم المنتج'        : 'Product name',
    textPH:    isAr ? 'شاركينا تجربتك مع المنتج...' : 'Tell us about your experience...',
    starLabel: isAr ? 'تقييمك'            : 'Your rating',
    submit:    isAr ? 'إرسال التقييم'     : 'Submit Review',
    sending:   isAr ? 'جاري الإرسال...'  : 'Sending...',
    ok:        isAr ? '✓ شكراً! سيتم مراجعة تقييمك قبل نشره.'
                    : '✓ Thank you! Your review will be published after moderation.',
    errEmpty:  isAr ? 'يرجى ملء اسمك ونص التقييم.' : 'Please fill in your name and review.',
    errStars:  isAr ? 'يرجى اختيار تقييم بالنجوم.' : 'Please select a star rating.',
    errFail:   isAr ? 'حدث خطأ، يرجى المحاولة مجدداً.' : 'Something went wrong. Please try again.',
  };

  const wrap = document.createElement('div');
  wrap.id  = 'nova-review-form-wrap';
  wrap.dir = dir;

  wrap.innerHTML = `
  <style>
    #nova-review-form-wrap {
      max-width: 660px;
      margin: 56px auto 0;
      padding: 0 20px 72px;
    }
    .nrf-box {
      position: relative;
      background: linear-gradient(145deg,rgba(255,255,255,.03),rgba(212,170,106,.05));
      border: 1px solid rgba(212,170,106,.2);
      border-radius: 18px;
      padding: 42px 44px;
      overflow: hidden;
    }
    .nrf-box::before {
      content:'';position:absolute;top:0;left:20%;right:20%;height:1px;
      background:linear-gradient(90deg,transparent,rgba(212,170,106,.7),transparent);
    }
    .nrf-deco {
      position:absolute;bottom:-16px;
      ${isAr ? 'left:20px' : 'right:20px'};
      font-size:110px;line-height:1;
      color:rgba(212,170,106,.05);
      font-family:Georgia,serif;pointer-events:none;user-select:none;
    }
    .nrf-h {
      font-family:'Cormorant Garamond',Georgia,serif;
      font-size:clamp(20px,4vw,28px);font-weight:700;
      color:#C9A96E;text-align:center;margin:0 0 8px;letter-spacing:.5px;
    }
    .nrf-sub {
      font-size:12px;color:rgba(255,255,255,.38);
      text-align:center;margin:0 0 32px;line-height:1.6;
    }
    .nrf-star-label {
      display:block;text-align:center;
      font-size:10px;letter-spacing:2px;text-transform:uppercase;
      color:rgba(255,255,255,.3);margin-bottom:10px;
    }
    .nrf-stars {
      display:flex;justify-content:center;gap:6px;margin-bottom:28px;
    }
    .nrf-stars span {
      font-size:34px;color:rgba(255,255,255,.1);
      cursor:pointer;transition:color .12s,transform .12s;line-height:1;
      user-select:none;
    }
    .nrf-stars span.on  { color:#C9A96E; }
    .nrf-stars span:hover { transform:scale(1.15); }
    .nrf-row {
      display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;
    }
    @media(max-width:480px){ .nrf-row{grid-template-columns:1fr;} }
    .nrf-input,.nrf-ta {
      width:100%;box-sizing:border-box;
      background:rgba(255,255,255,.04);
      border:1px solid rgba(212,170,106,.18);
      border-radius:10px;
      color:rgba(255,255,255,.85);
      font-family:inherit;font-size:13.5px;
      padding:12px 15px;outline:none;
      transition:border-color .2s,box-shadow .2s;
    }
    .nrf-input::placeholder,.nrf-ta::placeholder{ color:rgba(255,255,255,.18); }
    .nrf-input:focus,.nrf-ta:focus {
      border-color:rgba(212,170,106,.55);
      box-shadow:0 0 0 3px rgba(212,170,106,.07);
      background:rgba(255,255,255,.06);
    }
    .nrf-ta { resize:vertical;min-height:100px;line-height:1.6;margin-bottom:12px; }
    .nrf-btn {
      width:100%;padding:14px;
      background:linear-gradient(135deg,#C9A96E,#8a6030);
      color:#0a0a0f;font-family:inherit;font-size:12px;
      font-weight:700;letter-spacing:2px;text-transform:uppercase;
      border:none;border-radius:10px;cursor:pointer;
      transition:opacity .2s,transform .15s,box-shadow .2s;
      box-shadow:0 4px 18px rgba(201,169,110,.22);
    }
    .nrf-btn:hover:not(:disabled){ opacity:.9;transform:translateY(-1px);box-shadow:0 7px 24px rgba(201,169,110,.32); }
    .nrf-btn:disabled{ opacity:.5;cursor:not-allowed;transform:none; }
    .nrf-msg {
      display:none;margin-top:14px;padding:12px 16px;
      border-radius:9px;font-size:13px;text-align:center;line-height:1.5;
    }
    .nrf-msg.ok  { display:block;background:rgba(66,200,130,.1);border:1px solid rgba(66,200,130,.25);color:#42C882; }
    .nrf-msg.err { display:block;background:rgba(224,96,96,.1);border:1px solid rgba(224,96,96,.25);color:#E06060; }
  </style>

  <div class="nrf-box">
    <div class="nrf-deco">"</div>
    <h2 class="nrf-h">${L.heading}</h2>
    <p class="nrf-sub">${L.sub}</p>

    <span class="nrf-star-label">${L.starLabel}</span>
    <div class="nrf-stars" id="nrfStars">
      <span data-v="1">★</span>
      <span data-v="2">★</span>
      <span data-v="3">★</span>
      <span data-v="4">★</span>
      <span data-v="5">★</span>
    </div>

    <div class="nrf-row">
      <input class="nrf-input" id="nrfName"    type="text" placeholder="${L.namePH}"    maxlength="80" />
      <input class="nrf-input" id="nrfProduct" type="text" placeholder="${L.productPH}" maxlength="120" />
    </div>
    <textarea class="nrf-ta" id="nrfText" placeholder="${L.textPH}" maxlength="1000"></textarea>

    <button class="nrf-btn" id="nrfBtn">${L.submit}</button>
    <div class="nrf-msg" id="nrfMsg"></div>
  </div>`;

  section.appendChild(wrap);

  /* ── Star clicks ── */
  let picked = 0;
  const stars = wrap.querySelectorAll('#nrfStars span');

  function paintStars(n) {
    stars.forEach((s, i) => s.classList.toggle('on', i < n));
  }

  stars.forEach((s, idx) => {
    s.addEventListener('mouseenter', () => paintStars(idx + 1));
    s.addEventListener('mouseleave', () => paintStars(picked));
    s.addEventListener('click',      () => { picked = idx + 1; paintStars(picked); });
  });

  /* ── Submit ── */
  const btn = wrap.querySelector('#nrfBtn');
  const msg = wrap.querySelector('#nrfMsg');

  btn.addEventListener('click', async () => {
    const author  = wrap.querySelector('#nrfName').value.trim();
    const text_en = wrap.querySelector('#nrfText').value.trim();

    msg.className = 'nrf-msg';

    if (!picked)           { msg.className = 'nrf-msg err'; msg.textContent = L.errStars;  return; }
    if (!author || !text_en) { msg.className = 'nrf-msg err'; msg.textContent = L.errEmpty; return; }

    btn.disabled    = true;
    btn.textContent = L.sending;

    try {
      const res = await fetch(BACKEND_URL + '/api/reviews', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: 1,
          stars:      picked,
          text_en,
          text_ar:    null,
          author,
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        msg.className = 'nrf-msg ok';
        msg.textContent = L.ok;
        wrap.querySelector('#nrfName').value    = '';
        wrap.querySelector('#nrfProduct').value = '';
        wrap.querySelector('#nrfText').value    = '';
        picked = 0;
        paintStars(0);
      } else {
        throw new Error(json.error || 'error');
      }
    } catch (e) {
      msg.className   = 'nrf-msg err';
      msg.textContent = e.message === 'error' ? L.errFail : e.message;
    }

    btn.disabled    = false;
    btn.textContent = L.submit;
  });
}
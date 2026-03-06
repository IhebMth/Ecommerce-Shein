/* ============================================================
   REVIEWS.JS — Customer reviews section rendering
   Pure function definitions only — no top-level execution.
   Depends on: i18n.js (t function via main script)

   Updated Phase 4:
   - renderReviews() now fetches from API, falls back to REVIEWS_DATA
   - renderReviewForm() renders a beautiful submit-a-review form
   - Both EN and AR bilingual throughout
============================================================ */

const BACKEND_URL = 'https://nova-backend-one.vercel.app';

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
   RENDER REVIEWS — async, fetches API, falls back to static
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

  let data = REVIEWS_DATA; /* default fallback */

  try {
    const res = await fetch(BACKEND_URL + '/api/reviews');
    if (res.ok) {
      const fetched = await res.json();
      const rows = fetched.reviews ?? fetched;
      if (Array.isArray(rows) && rows.length > 0) data = rows;
    }
  } catch (_) { /* silent — use REVIEWS_DATA fallback */ }

  grid.innerHTML = data.map(r => {
    const isApi   = r.text_en !== undefined;
    const product = isApi
      ? (currentLang === 'ar' ? (r.product_name_ar || r.product_name_en) : r.product_name_en)
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
        <span class="review-product-tag">${product || ''}</span>
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

  /* Render the write-a-review form below the grid */
  renderReviewForm();
}

/* ══════════════════════════════════════════════════════════
   REVIEW FORM — beautiful bilingual write-a-review section
   Injected right after #reviews-section .reviews-grid
══════════════════════════════════════════════════════════ */
function renderReviewForm() {
  /* Don't inject twice */
  if (document.getElementById('nova-review-form-wrap')) return;

  const section = document.getElementById('reviews-section');
  if (!section) return;

  const isAr = typeof currentLang !== 'undefined' && currentLang === 'ar';
  const dir  = isAr ? 'rtl' : 'ltr';

  const labels = {
    heading:     isAr ? 'شاركينا تجربتك' : 'Share Your Experience',
    sub:         isAr ? 'رأيك يهمنا — ساعدي العملاء الأخريات في اختيار أفضل'
                      : 'Your opinion matters — help other customers choose with confidence',
    namePH:      isAr ? 'اسمك' : 'Your name',
    productPH:   isAr ? 'اسم المنتج' : 'Product name',
    textPH:      isAr ? 'شاركينا تجربتك مع المنتج...' : 'Tell us about your experience with the product...',
    ratingLabel: isAr ? 'تقييمك' : 'Your rating',
    submit:      isAr ? 'إرسال التقييم' : 'Submit Review',
    sending:     isAr ? 'جاري الإرسال...' : 'Sending...',
    successMsg:  isAr ? '✓ شكراً! سيتم مراجعة تقييمك قبل نشره.'
                      : '✓ Thank you! Your review will be published after moderation.',
    errorMsg:    isAr ? 'حدث خطأ، يرجى المحاولة مجدداً.' : 'Something went wrong. Please try again.',
    rateFirst:   isAr ? 'يرجى اختيار تقييم.' : 'Please select a star rating.',
  };

  const wrap = document.createElement('div');
  wrap.id = 'nova-review-form-wrap';
  wrap.dir = dir;
  wrap.innerHTML = `
    <style>
      #nova-review-form-wrap {
        margin: 64px auto 0;
        max-width: 680px;
        padding: 0 20px 80px;
        font-family: inherit;
      }

      .nrf-inner {
        background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(212,170,106,0.04) 100%);
        border: 1px solid rgba(212,170,106,0.18);
        border-radius: 20px;
        padding: 44px 48px;
        position: relative;
        overflow: hidden;
      }

      .nrf-inner::before {
        content: '';
        position: absolute;
        top: 0; left: 15%; right: 15%;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(212,170,106,0.6), transparent);
      }

      .nrf-heading {
        font-family: 'Cormorant Garamond', 'Georgia', serif;
        font-size: clamp(22px, 4vw, 30px);
        font-weight: 700;
        letter-spacing: 1px;
        color: #C9A96E;
        margin: 0 0 8px;
        text-align: center;
      }

      .nrf-sub {
        font-size: 13px;
        color: rgba(255,255,255,0.45);
        text-align: center;
        margin: 0 0 36px;
        line-height: 1.6;
      }

      /* Star rating */
      .nrf-stars-label {
        font-size: 11px;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: rgba(255,255,255,0.35);
        margin-bottom: 10px;
        display: block;
        text-align: center;
      }

      .nrf-stars {
        display: flex;
        justify-content: center;
        gap: 6px;
        margin-bottom: 30px;
        flex-direction: ${isAr ? 'row-reverse' : 'row'};
      }

      .nrf-stars input[type="radio"] { display: none; }

      .nrf-stars label {
        font-size: 36px;
        color: rgba(255,255,255,0.12);
        cursor: pointer;
        transition: color 0.15s, transform 0.15s;
        line-height: 1;
        user-select: none;
      }

      .nrf-stars label:hover,
      .nrf-stars label:hover ~ label,
      .nrf-stars input[type="radio"]:checked ~ label {
        color: rgba(255,255,255,0.12);
      }

      /* Gold fill: hovered star + all before it */
      .nrf-stars:has(label:nth-child(${isAr ? 'n' : '2'}):hover) label:nth-child(n+2):nth-child(-n+2),
      .nrf-star-wrap:hover .nrf-star,
      .nrf-stars input[type="radio"]:checked + label {
        color: #C9A96E;
      }

      /* Simpler approach: JS handles active class */
      .nrf-stars label.active { color: #C9A96E; transform: scale(1.1); }
      .nrf-stars label:hover  { color: #E8C880; transform: scale(1.12); }

      /* Inputs */
      .nrf-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
        margin-bottom: 14px;
      }
      @media (max-width: 500px) { .nrf-row { grid-template-columns: 1fr; } }

      .nrf-field { margin-bottom: 14px; }

      .nrf-input, .nrf-textarea {
        width: 100%;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(212,170,106,0.2);
        border-radius: 10px;
        color: rgba(255,255,255,0.88);
        font-family: inherit;
        font-size: 14px;
        padding: 13px 16px;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        box-sizing: border-box;
      }

      .nrf-input::placeholder, .nrf-textarea::placeholder {
        color: rgba(255,255,255,0.2);
      }

      .nrf-input:focus, .nrf-textarea:focus {
        border-color: rgba(212,170,106,0.6);
        background: rgba(255,255,255,0.06);
        box-shadow: 0 0 0 3px rgba(212,170,106,0.08);
      }

      .nrf-textarea {
        resize: vertical;
        min-height: 110px;
        line-height: 1.65;
      }

      /* Submit button */
      .nrf-btn {
        width: 100%;
        padding: 15px 24px;
        background: linear-gradient(135deg, #C9A96E 0%, #a07840 100%);
        color: #0a0a0f;
        font-family: inherit;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 2px;
        text-transform: uppercase;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
        margin-top: 6px;
        box-shadow: 0 4px 20px rgba(201,169,110,0.25);
      }

      .nrf-btn:hover:not(:disabled) {
        opacity: 0.92;
        transform: translateY(-1px);
        box-shadow: 0 8px 28px rgba(201,169,110,0.35);
      }

      .nrf-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
        transform: none;
      }

      /* Status message */
      .nrf-status {
        display: none;
        margin-top: 16px;
        padding: 13px 18px;
        border-radius: 10px;
        font-size: 13px;
        text-align: center;
        line-height: 1.5;
      }

      .nrf-status.success {
        display: block;
        background: rgba(66,200,130,0.1);
        border: 1px solid rgba(66,200,130,0.25);
        color: #42C882;
      }

      .nrf-status.error {
        display: block;
        background: rgba(224,96,96,0.1);
        border: 1px solid rgba(224,96,96,0.25);
        color: #E06060;
      }

      /* Decorative quote mark */
      .nrf-quote-deco {
        position: absolute;
        bottom: -10px; ${isAr ? 'left: 24px' : 'right: 24px'};
        font-size: 120px;
        color: rgba(212,170,106,0.04);
        font-family: Georgia, serif;
        line-height: 1;
        pointer-events: none;
        user-select: none;
      }
    </style>

    <div class="nrf-inner">
      <div class="nrf-quote-deco">"</div>

      <h2 class="nrf-heading">${labels.heading}</h2>
      <p class="nrf-sub">${labels.sub}</p>

      <!-- Star rating -->
      <span class="nrf-stars-label">${labels.ratingLabel}</span>
      <div class="nrf-stars" id="nrfStars">
        <label data-val="1">★</label>
        <label data-val="2">★</label>
        <label data-val="3">★</label>
        <label data-val="4">★</label>
        <label data-val="5">★</label>
      </div>

      <!-- Name + Product row -->
      <div class="nrf-row">
        <input class="nrf-input" id="nrfName"    type="text" placeholder="${labels.namePH}"    maxlength="80" />
        <input class="nrf-input" id="nrfProduct" type="text" placeholder="${labels.productPH}" maxlength="120" />
      </div>

      <!-- Review text -->
      <div class="nrf-field">
        <textarea class="nrf-textarea" id="nrfText" placeholder="${labels.textPH}" maxlength="1000"></textarea>
      </div>

      <!-- Submit -->
      <button class="nrf-btn" id="nrfSubmit">${labels.submit}</button>

      <!-- Status -->
      <div class="nrf-status" id="nrfStatus"></div>
    </div>
  `;

  section.appendChild(wrap);

  /* ── Star interaction ── */
  let selectedStars = 0;
  const starLabels = wrap.querySelectorAll('#nrfStars label');

  starLabels.forEach((lbl, idx) => {
    lbl.addEventListener('mouseenter', () => {
      starLabels.forEach((s, i) => s.classList.toggle('active', i <= idx));
    });
    lbl.addEventListener('mouseleave', () => {
      starLabels.forEach((s, i) => s.classList.toggle('active', i < selectedStars));
    });
    lbl.addEventListener('click', () => {
      selectedStars = idx + 1;
      starLabels.forEach((s, i) => s.classList.toggle('active', i < selectedStars));
    });
  });

  /* ── Submit ── */
  const btn    = wrap.querySelector('#nrfSubmit');
  const status = wrap.querySelector('#nrfStatus');

  btn.addEventListener('click', async () => {
    const author   = wrap.querySelector('#nrfName').value.trim();
    const product  = wrap.querySelector('#nrfProduct').value.trim();
    const text_en  = wrap.querySelector('#nrfText').value.trim();

    /* Basic validation */
    if (!selectedStars) {
      status.className = 'nrf-status error';
      status.textContent = labels.rateFirst;
      return;
    }
    if (!author || !text_en) {
      status.className = 'nrf-status error';
      status.textContent = isAr
        ? 'يرجى ملء اسمك ونص التقييم.'
        : 'Please fill in your name and review text.';
      return;
    }

    btn.disabled    = true;
    btn.textContent = labels.sending;
    status.className = 'nrf-status';

    try {
      const res = await fetch(BACKEND_URL + '/api/reviews', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: 1,      /* generic — no product page context here */
          stars:      selectedStars,
          text_en,
          text_ar:    null,   /* no AR input — admin can add from admin panel */
          author,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        status.className   = 'nrf-status success';
        status.textContent = labels.successMsg;
        /* Reset form */
        wrap.querySelector('#nrfName').value    = '';
        wrap.querySelector('#nrfProduct').value = '';
        wrap.querySelector('#nrfText').value    = '';
        selectedStars = 0;
        starLabels.forEach(s => s.classList.remove('active'));
        btn.textContent = labels.submit;
        btn.disabled    = false;
      } else {
        throw new Error(data.error || 'error');
      }
    } catch (err) {
      status.className   = 'nrf-status error';
      status.textContent = err.message === 'error' ? labels.errorMsg : err.message;
      btn.textContent    = labels.submit;
      btn.disabled       = false;
    }
  });
}
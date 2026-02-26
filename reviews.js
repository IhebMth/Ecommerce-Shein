/* ============================================================
   REVIEWS.JS — Customer reviews section rendering
   Pure function definitions only — no top-level execution.
   Depends on: i18n.js (t function via main script)
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

function renderStars(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function renderReviews() {
  const heading = document.getElementById('reviews-heading');
  const subEl   = document.querySelector('#reviews-section p.sub');
  const basedOn = document.querySelector('#reviews-section .rating-details small');
  const grid    = document.querySelector('#reviews-section .reviews-grid');

  if (heading) heading.textContent = t('reviews.title');
  if (subEl)   subEl.textContent   = t('reviews.sub');
  if (basedOn) basedOn.textContent = t('reviews.basedOn');
  if (!grid)   return;

  grid.innerHTML = REVIEWS_DATA.map(r => `
    <article class="review-card">
      <span class="review-product-tag">${r.product[currentLang] || r.product.en}</span>
      <div class="review-stars">${renderStars(r.stars)}</div>
      <p class="review-text">"${r.text[currentLang] || r.text.en}"</p>
      <div class="review-author">
        <img class="review-avatar" src="${r.avatar}" alt="${r.name}" loading="lazy">
        <div>
          <p class="review-name">${r.name}</p>
          <p class="review-date">${r.date[currentLang] || r.date.en}</p>
        </div>
      </div>
      <p class="review-verified">✓ ${t('reviews.verified')}</p>
    </article>`).join('');
}
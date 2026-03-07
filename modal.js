/* ============================================================
   MODAL.JS — Product detail modal
   Section 2: zoom (④), size guide (⑤), you might also like (⑥)
============================================================ */

/* ─── ZOOM state: named handlers so we can removeEventListener ─── */
let _onZoomMove  = null;
let _onZoomEnter = null;
let _onZoomLeave = null;
let _onZoomClick = null;

/* ══════════════════════════════════════════════
   OPEN / CLOSE
══════════════════════════════════════════════ */

function openProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  currentProduct   = p;
  selectedSize     = null;
  selectedColorIdx = cardColorState[p.id] !== undefined ? cardColorState[p.id] : 0;
  setURLParam('product', id);
  /* #18 — also store current category so share link is complete */
  if (typeof currentFilter !== 'undefined' && currentFilter !== 'All') {
    setURLParam('category', currentFilter);
  }

  /* Update share button label */
  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.lastChild.textContent = navigator.share ? ' Share' : ' Copy Link';
  }

  document.getElementById('modal-cat').textContent       = t('cat.' + p.category);
  document.getElementById('modal-name').textContent      = getName(p);
  document.getElementById('modal-price-now').textContent = fmt(p.price);
  document.getElementById('modal-desc').textContent      = getDesc(p);

  const disc   = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const oldEl  = document.getElementById('modal-price-old');
  const discEl = document.getElementById('modal-discount');
  if (p.oldPrice) { oldEl.textContent = fmt(p.oldPrice); discEl.textContent = `-${disc}%`; }
  else            { oldEl.textContent = ''; discEl.textContent = ''; }

  const stockInfo = getStockStatus(p, null);
  const stockEl   = document.getElementById('modal-stock');
  stockEl.textContent = stockInfo.label;
  stockEl.className   = `modal-stock ${stockInfo.cls}`;

  // Colors
  const colorSection = document.getElementById('modal-color-section');
  const colorsDiv    = document.getElementById('modal-colors');
  if (p.colors && p.colors.length > 1) {
    colorSection.style.display = 'block';
    colorsDiv.innerHTML = p.colors.map((c, i) => {
      const style = c.multi
        ? `background:conic-gradient(#f9a8d4 0 25%,#93c5fd 25% 50%,#6ee7b7 50% 75%,#fde68a 75%);`
        : `background:${c.hex};`;
      return `<span class="color-swatch${i === selectedColorIdx ? ' active' : ''}" style="${style}"
        data-cidx="${i}" title="${getColorName(c)}"
        onclick="selectModalColor(${i})"></span>`;
    }).join('');
    const nameEl = document.getElementById('selected-color-name');
    if (nameEl) nameEl.textContent = getColorName(p.colors[selectedColorIdx]);
  } else {
    colorSection.style.display = 'none';
  }

  renderModalImages(p, selectedColorIdx);

  // Sizes
  const sizesDiv = document.getElementById('modal-sizes');
  sizesDiv.innerHTML = p.sizes.map(s => {
    const noStock = p.sizeStock && p.sizeStock[s] === 0;
    return `<button class="size-btn${noStock ? ' no-stock' : ''}" data-size="${s}" ${noStock ? 'disabled' : ''}>${s}</button>`;
  }).join('');

  sizesDiv.querySelectorAll('.size-btn:not(.no-stock)').forEach(btn => {
    btn.addEventListener('click', () => {
      sizesDiv.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedSize = btn.dataset.size;
      const st = getStockStatus(p, selectedSize);
      stockEl.textContent = st.label;
      stockEl.className   = `modal-stock ${st.cls}`;
      updateAddBtn();
    });
  });

  if (p.sizes.length === 1) {
    selectedSize = p.sizes[0];
    sizesDiv.querySelector('.size-btn').classList.add('selected');
  }

  // ⑤ size guide
  const sgBtn = document.getElementById('size-guide-btn');
  if (sgBtn) {
    sgBtn.style.display = SIZE_CHARTS[p.category] ? 'inline-flex' : 'none';
    sgBtn.textContent   = t('modal.sizeGuide');
  }

  document.querySelector('.size-label').textContent = t('modal.selectSize');
  updateAddBtn();

  // ⑥ related
  renderRelated(p);

  document.getElementById('product-overlay').classList.add('open');

  // ⑦ product reviews
  renderModalReviews(p);
}

function closeProduct() {
  document.getElementById('product-overlay').classList.remove('open');
  setURLParam('product', null);
  zoomOff();
  closeLightbox();
}

/* ══════════════════════════════════════════════
   IMAGES + THUMBNAILS
══════════════════════════════════════════════ */

function renderModalImages(product, colorIdx) {
  const images = (product.colors && product.colors[colorIdx])
    ? product.colors[colorIdx].images
    : (product.image ? [product.image] : []);

  const mainImg   = document.getElementById('modal-img');
  mainImg.src     = images[0] || '';

  const thumbsDiv = document.getElementById('modal-thumbnails');
  if (images.length <= 1) {
    thumbsDiv.style.display = 'none';
  } else {
    thumbsDiv.style.display = 'flex';
    thumbsDiv.innerHTML = images.map((src, i) =>
      `<div class="modal-thumb${i === 0 ? ' active' : ''}" onclick="selectModalImage('${src}',this)">
        <img src="${src}" alt="">
      </div>`
    ).join('');
  }

  // Reinit zoom after image swap
  zoomOff();
  setTimeout(zoomOn, 80);
}

function selectModalImage(src, thumbEl) {
  const mainImg = document.getElementById('modal-img');
  mainImg.classList.add('fade');
  zoomOff();
  setTimeout(() => {
    mainImg.src = src;
    mainImg.classList.remove('fade');
    setTimeout(zoomOn, 80);
  }, 200);
  document.querySelectorAll('.modal-thumb').forEach(t => t.classList.remove('active'));
  thumbEl.classList.add('active');
}

function selectModalColor(colorIdx) {
  if (!currentProduct) return;
  selectedColorIdx = colorIdx;
  cardColorState[currentProduct.id] = colorIdx;
  document.querySelectorAll('.color-swatch').forEach((sw, i) => sw.classList.toggle('active', i === colorIdx));
  const nameEl = document.getElementById('selected-color-name');
  if (nameEl) nameEl.textContent = getColorName(currentProduct.colors[colorIdx]);
  renderModalImages(currentProduct, colorIdx);
  const cardImg = document.getElementById(`card-img-${currentProduct.id}`);
  if (cardImg) {
    cardImg.src = getCurrentImage(currentProduct, colorIdx);
    document.querySelectorAll(`.card-color-dot[data-pid="${currentProduct.id}"]`).forEach((dot, i) => {
      dot.classList.toggle('active', i === colorIdx);
    });
  }
}

function updateAddBtn() {
  const btn = document.getElementById('add-to-cart-btn');
  if (!btn || !currentProduct) return;
  if (currentProduct.stock === 0)                                               { btn.textContent = t('modal.soldOut');     btn.disabled = true;  return; }
  if (!selectedSize)                                                             { btn.textContent = t('modal.selectFirst'); btn.disabled = true;  return; }
  if (currentProduct.sizeStock && currentProduct.sizeStock[selectedSize] === 0) { btn.textContent = t('modal.unavailable'); btn.disabled = true;  return; }
  btn.textContent = t('modal.addToCart'); btn.disabled = false;
}

/* ══════════════════════════════════════════════
   ④ IMAGE ZOOM
   On desktop wide screens (>1200px): a lens box follows
   the cursor and a fixed result panel floats next to the modal.
   On all screens: click opens a full-screen lightbox.
══════════════════════════════════════════════ */

function zoomOn() {
  const wrap   = document.getElementById('modal-img-main');
  const img    = document.getElementById('modal-img');
  const lens   = document.getElementById('zoom-lens');
  const result = document.getElementById('zoom-result');
  if (!wrap || !img || !lens || !result) return;

  const isWide = window.innerWidth > 1200;

  // Click always opens lightbox
  _onZoomClick = () => openLightbox();
  wrap.addEventListener('click', _onZoomClick);

  if (isWide) {
    _onZoomEnter = () => {
      lens.style.display   = 'block';
      result.style.display = 'block';
    };
    _onZoomLeave = () => {
      lens.style.display   = 'none';
      result.style.display = 'none';
    };
    _onZoomMove = (e) => {
      const rect  = wrap.getBoundingClientRect();
      const lW    = 80, lH = 80; // fixed lens size (matches CSS)

      let lx = e.clientX - rect.left  - lW / 2;
      let ly = e.clientY - rect.top   - lH / 2;
      lx = Math.max(0, Math.min(lx, rect.width  - lW));
      ly = Math.max(0, Math.min(ly, rect.height - lH));

      lens.style.left = lx + 'px';
      lens.style.top  = ly + 'px';

      // Result panel: fixed, centred vertically, placed beside the modal
      const rW = 300, rH = 360;
      const modal = document.querySelector('.modal');
      const mRect = modal ? modal.getBoundingClientRect() : rect;

      let rx = mRect.right + 12;
      if (rx + rW > window.innerWidth - 8) rx = mRect.left - rW - 12;

      result.style.position = 'fixed';
      result.style.left     = rx + 'px';
      result.style.top      = Math.max(8, (window.innerHeight - rH) / 2) + 'px';
      result.style.width    = rW + 'px';
      result.style.height   = rH + 'px';
      result.style.transform = 'none';

      // Background zoom math (3× magnification)
      const scX = rW / lW;
      const scY = rH / lH;
      result.style.backgroundImage    = `url('${img.src}')`;
      result.style.backgroundSize     = `${rect.width * scX}px ${rect.height * scY}px`;
      result.style.backgroundPosition = `-${lx * scX}px -${ly * scY}px`;
    };

    wrap.addEventListener('mouseenter', _onZoomEnter);
    wrap.addEventListener('mouseleave', _onZoomLeave);
    wrap.addEventListener('mousemove',  _onZoomMove);
  }
}

function zoomOff() {
  const wrap   = document.getElementById('modal-img-main');
  const lens   = document.getElementById('zoom-lens');
  const result = document.getElementById('zoom-result');
  if (lens)   { lens.style.display   = 'none'; }
  if (result) { result.style.display = 'none'; }
  if (!wrap)  return;
  if (_onZoomClick) wrap.removeEventListener('click',      _onZoomClick);
  if (_onZoomEnter) wrap.removeEventListener('mouseenter', _onZoomEnter);
  if (_onZoomLeave) wrap.removeEventListener('mouseleave', _onZoomLeave);
  if (_onZoomMove)  wrap.removeEventListener('mousemove',  _onZoomMove);
  _onZoomClick = _onZoomEnter = _onZoomLeave = _onZoomMove = null;
}

function openLightbox() {
  const img   = document.getElementById('modal-img');
  const lb    = document.getElementById('zoom-lightbox');
  const lbImg = document.getElementById('zoom-lightbox-img');
  if (!img || !lb || !lbImg) return;
  lbImg.src = img.src;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('zoom-lightbox');
  if (lb) lb.classList.remove('open');
  document.body.style.overflow = '';
}

/* ══════════════════════════════════════════════
   ⑤ SIZE GUIDE
══════════════════════════════════════════════ */

const SIZE_CHARTS = {
  'Leggings': {
    headers: { en: ['Size','Waist (cm)','Hips (cm)','Length (cm)'], ar: ['المقاس','الخصر (سم)','الأرداف (سم)','الطول (سم)'] },
    rows: [
      ['XS','60–65','85–90','95'],['S','65–70','90–95','96'],
      ['M','70–76','95–101','97'],['L','76–82','101–107','98'],
      ['XL','82–88','107–113','99'],['XXL','88–95','113–120','100']
    ]
  },
  'T-Shirts': {
    headers: { en: ['Size','Chest (cm)','Length (cm)','Shoulder (cm)'], ar: ['المقاس','الصدر (سم)','الطول (سم)','الكتف (سم)'] },
    rows: [
      ['XS','80–85','55','36'],['S','85–90','57','38'],['M','90–96','59','40'],
      ['L','96–102','61','42'],['XL','102–108','63','44'],['XXL','108–116','65','46']
    ]
  },
  'Shoes': {
    headers: { en: ['EU','UK','US','Foot (cm)'], ar: ['أوروبي','بريطاني','أمريكي','القدم (سم)'] },
    rows: [
      ['36','3','5','22.5'],['37','4','6','23.5'],['38','5','7','24.0'],
      ['39','6','8','24.5'],['40','6.5','8.5','25.0'],['41','7','9','25.5'],['42','8','10','26.5']
    ]
  },
  'Arm Sleeves': {
    headers: { en: ['Size','Arm Circ. (cm)','Length (cm)'], ar: ['المقاس','محيط الذراع (سم)','الطول (سم)'] },
    rows: [['S/M','22–28','38'],['M/L','28–34','40'],['L/XL','34–40','42']]
  },
  'Accessories': {
    headers: { en: ['Size','Note'], ar: ['المقاس','ملاحظة'] },
    rows: [['One Size','Fully adjustable — fits all']]
  }
};

function openSizeGuide() {
  if (!currentProduct) return;
  const chart = SIZE_CHARTS[currentProduct.category];
  if (!chart) return;
  const overlay = document.getElementById('size-guide-overlay');
  const titleEl = document.getElementById('size-guide-title');
  const tableEl = document.getElementById('size-guide-table');
  const tipEl   = document.getElementById('size-guide-tip');
  if (!overlay) return;
  titleEl.textContent = t('modal.sizeGuide') + ' — ' + t('cat.' + currentProduct.category);
  const headers = chart.headers[currentLang] || chart.headers.en;
  tableEl.innerHTML = `
    <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${chart.rows.map((row, i) => `
      <tr class="${i % 2 === 0 ? 'sg-row-alt' : ''}">
        ${row.map((cell, ci) => `<td${ci === 0 ? ' class="sg-size-cell"' : ''}>${cell}</td>`).join('')}
      </tr>`).join('')}
    </tbody>`;
  tipEl.textContent = t('modal.sizeGuideTip');
  overlay.classList.add('open');
}

function closeSizeGuide() {
  const overlay = document.getElementById('size-guide-overlay');
  if (overlay) overlay.classList.remove('open');
}

/* ══════════════════════════════════════════════
   ⑥ YOU MIGHT ALSO LIKE
══════════════════════════════════════════════ */

function renderRelated(currentP) {
  const section = document.getElementById('modal-related');
  const titleEl = document.getElementById('modal-related-title');
  const gridEl  = document.getElementById('modal-related-grid');
  if (!section || !gridEl) return;

  const related = products
    .filter(p => p.category === currentP.category && p.id !== currentP.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);

  if (related.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  titleEl.textContent   = t('modal.youMightLike');

  gridEl.innerHTML = related.map(p => {
    const disc   = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    const imgSrc = getCurrentImage(p, 0);
    return `
      <div class="related-card" onclick="openProduct('${p.id}')">
        <div class="related-img-wrap">
          <img src="${imgSrc}" alt="${getName(p)}" loading="lazy">
          ${disc > 0  ? `<span class="related-badge">-${disc}%</span>` : ''}
          ${p.stock === 0 ? `<span class="related-badge related-badge--out">${t('badge.soldOut')}</span>` : ''}
        </div>
        <div class="related-info">
          <p class="related-name">${getName(p)}</p>
          <div class="related-price-row">
            <span class="related-price-now">${fmt(p.price)}</span>
            ${p.oldPrice ? `<span class="related-price-old">${fmt(p.oldPrice)}</span>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');
}
/* ══════════════════════════════════════════════
   ⑦ PRODUCT REVIEWS — inside modal
   Fetches approved reviews for this product,
   renders them + a compact submit form.
══════════════════════════════════════════════ */

async function renderModalReviews(product) {
  /* Remove previous instance */
  const old = document.getElementById('modal-reviews-wrap');
  if (old) old.remove();

  const modalInfo = document.querySelector('.modal-info');
  if (!modalInfo) return;

  const isAr = typeof currentLang !== 'undefined' && currentLang === 'ar';

  const L = {
    title:      t('modalReview.title'),
    noReviews:  t('modalReview.noReviews'),
    writeTitle: t('modalReview.writeTitle'),
    namePH:     t('modalReview.namePH'),
    textPH:     t('modalReview.textPH'),
    submit:     t('reviewform.submit'),
    sending:    t('reviewform.sending'),
    ok:         t('reviewform.ok'),
    errStars:   t('reviewform.errStars'),
    errEmpty:   t('reviewform.errEmpty'),
    errFail:    t('reviewform.errFail'),
    verified:   t('reviews.verified'),
  };

  /* ── Build wrapper ── */
  const wrap = document.createElement('div');
  wrap.id  = 'modal-reviews-wrap';
  wrap.dir = isAr ? 'rtl' : 'ltr';
  wrap.innerHTML = `
<style>
  #modal-reviews-wrap {
    margin-top: 28px;
    border-top: 1px solid rgba(212,170,106,.15);
    padding-top: 22px;
  }
  .mrw-title {
    font-family:'Cormorant Garamond',Georgia,serif;
    font-size:15px;font-weight:700;
    color:#C9A96E;letter-spacing:.5px;
    margin:0 0 14px;
  }
  .mrw-list { display:flex;flex-direction:column;gap:10px;margin-bottom:18px; }
  .mrw-card {
    background:rgba(255,255,255,.03);
    border:1px solid rgba(212,170,106,.12);
    border-radius:10px;padding:12px 14px;
  }
  .mrw-card-top { display:flex;align-items:center;justify-content:space-between;margin-bottom:5px; }
  .mrw-author { font-size:12px;font-weight:600;color:rgba(255,255,255,.75); }
  .mrw-stars  { font-size:13px;color:#C9A96E;letter-spacing:1px; }
  .mrw-text   { font-size:12px;color:rgba(255,255,255,.5);line-height:1.55;margin:0; }
  .mrw-verified { font-size:10px;color:#42C882;margin-top:5px; }
  .mrw-none   { font-size:12px;color:rgba(255,255,255,.25);text-align:center;padding:10px 0; }

  /* mini form */
  .mrw-form-title {
    font-size:12px;letter-spacing:1.5px;text-transform:uppercase;
    color:rgba(255,255,255,.3);margin:0 0 10px;
  }
  .mrw-stars-pick { display:flex;gap:4px;margin-bottom:10px; }
  .mrw-stars-pick span {
    font-size:22px;color:rgba(255,255,255,.12);
    cursor:pointer;transition:color .12s,transform .1s;user-select:none;
  }
  .mrw-stars-pick span.on { color:#C9A96E; }
  .mrw-stars-pick span:hover { transform:scale(1.15); }
  .mrw-input, .mrw-ta {
    width:100%;box-sizing:border-box;
    background:rgba(255,255,255,.04);
    border:1px solid rgba(212,170,106,.15);
    border-radius:8px;color:rgba(255,255,255,.8);
    font-family:inherit;font-size:12.5px;
    padding:10px 12px;outline:none;margin-bottom:8px;
    transition:border-color .2s;
  }
  .mrw-input::placeholder,.mrw-ta::placeholder{color:rgba(255,255,255,.18);}
  .mrw-input:focus,.mrw-ta:focus{border-color:rgba(212,170,106,.45);}
  .mrw-ta{resize:vertical;min-height:72px;line-height:1.5;}
  .mrw-btn {
    width:100%;padding:11px;
    background:linear-gradient(135deg,#C9A96E,#8a6030);
    color:#0a0a0f;font-family:inherit;font-size:11px;
    font-weight:700;letter-spacing:1.8px;text-transform:uppercase;
    border:none;border-radius:8px;cursor:pointer;
    transition:opacity .2s,transform .12s;
  }
  .mrw-btn:hover:not(:disabled){opacity:.88;transform:translateY(-1px);}
  .mrw-btn:disabled{opacity:.45;cursor:not-allowed;}
  .mrw-msg {
    display:none;margin-top:8px;padding:9px 12px;
    border-radius:7px;font-size:12px;text-align:center;
  }
  .mrw-msg.ok  {display:block;background:rgba(66,200,130,.1);border:1px solid rgba(66,200,130,.22);color:#42C882;}
  .mrw-msg.err {display:block;background:rgba(224,96,96,.1);border:1px solid rgba(224,96,96,.22);color:#E06060;}
</style>

<p class="mrw-title">${L.title}</p>
<div class="mrw-list" id="mrwList"><p class="mrw-none">…</p></div>

<p class="mrw-form-title">${L.writeTitle}</p>
<div class="mrw-stars-pick" id="mrwStars">
  <span data-v="1">★</span><span data-v="2">★</span>
  <span data-v="3">★</span><span data-v="4">★</span><span data-v="5">★</span>
</div>
<input  class="mrw-input" id="mrwName" type="text"  placeholder="${L.namePH}" maxlength="80" />
<textarea class="mrw-ta"  id="mrwText" placeholder="${L.textPH}" maxlength="600"></textarea>
<button class="mrw-btn"   id="mrwBtn">${L.submit}</button>
<div class="mrw-msg" id="mrwMsg"></div>`;

  modalInfo.appendChild(wrap);

  /* ── Fetch reviews ── */
  const listEl = wrap.querySelector('#mrwList');
  try {
    const res  = await fetch(BACKEND_URL + '/api/reviews?product_id=' + product.id);
    const json = await res.json();
    const rows = json.reviews ?? [];
    if (rows.length === 0) {
      listEl.innerHTML = `<p class="mrw-none">${L.noReviews}</p>`;
    } else {
      listEl.innerHTML = rows.map(r => {
        const text = (isAr && r.text_ar) ? r.text_ar : r.text_en;
        return `
        <div class="mrw-card">
          <div class="mrw-card-top">
            <span class="mrw-author">${r.author}</span>
            <span class="mrw-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</span>
          </div>
          <p class="mrw-text">${text}</p>
          <p class="mrw-verified">✓ ${L.verified}</p>
        </div>`;
      }).join('');
    }
  } catch (_) {
    listEl.innerHTML = `<p class="mrw-none">${L.noReviews}</p>`;
  }

  /* ── Star picker ── */
  let picked = 0;
  const starEls = wrap.querySelectorAll('#mrwStars span');
  function paintMrwStars(n) { starEls.forEach((s, i) => s.classList.toggle('on', i < n)); }
  starEls.forEach((s, idx) => {
    s.addEventListener('mouseenter', () => paintMrwStars(idx + 1));
    s.addEventListener('mouseleave', () => paintMrwStars(picked));
    s.addEventListener('click',      () => { picked = idx + 1; paintMrwStars(picked); });
  });

  /* ── Submit ── */
  const btn = wrap.querySelector('#mrwBtn');
  const msg = wrap.querySelector('#mrwMsg');

  btn.addEventListener('click', async () => {
    const author  = wrap.querySelector('#mrwName').value.trim();
    const text_en = wrap.querySelector('#mrwText').value.trim();
    msg.className = 'mrw-msg';

    if (!picked)             { msg.className = 'mrw-msg err'; msg.textContent = L.errStars; return; }
    if (!author || !text_en) { msg.className = 'mrw-msg err'; msg.textContent = L.errEmpty; return; }

    btn.disabled = true;
    btn.textContent = L.sending;

    try {
      const res = await fetch(BACKEND_URL + '/api/reviews', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          stars:      picked,
          text_en,
          text_ar:    null,
          author,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        msg.className   = 'mrw-msg ok';
        msg.textContent = L.ok;
        wrap.querySelector('#mrwName').value = '';
        wrap.querySelector('#mrwText').value = '';
        picked = 0;
        paintMrwStars(0);
      } else {
        throw new Error(json.error || 'error');
      }
    } catch (e) {
      msg.className   = 'mrw-msg err';
      msg.textContent = e.message === 'error' ? L.errFail : e.message;
    }

    btn.disabled    = false;
    btn.textContent = L.submit;
  });
}
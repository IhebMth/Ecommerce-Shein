/* ============================================================
   SHOP.JS — Product grid rendering, filter, search, sort
   Section 1 upgrades:
   1. Second image on card hover
   2. Quick-add size selector on hover (no modal needed)
   3. Stock urgency badge visible on card
============================================================ */

function renderProducts() {
  const grid    = document.getElementById('product-grid');
  const countEl = document.getElementById('result-count');

  let list = currentFilter === 'All' ? [...products] : products.filter(p => p.category === currentFilter);

  if (currentSearch.trim()) {
    const q = currentSearch.trim().toLowerCase();
    list = list.filter(p =>
      getName(p).toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (getDesc(p) || '').toLowerCase().includes(q)
    );
  }

  if (currentSort === 'price-asc')  list.sort((a, b) => a.price - b.price);
  if (currentSort === 'price-desc') list.sort((a, b) => b.price - a.price);
  if (currentSort === 'discount')   list.sort((a, b) => {
    const da = a.oldPrice ? (1 - a.price / a.oldPrice) : 0;
    const db = b.oldPrice ? (1 - b.price / b.oldPrice) : 0;
    return db - da;
  });

  countEl.textContent = list.length > 0
    ? `${list.length} ${list.length === 1 ? 'product' : 'products'}` : '';

  if (list.length === 0) {
    grid.innerHTML = `<div class="no-results"><span>🔍</span>${t('search.noResults')}</div>`;
    return;
  }

  grid.innerHTML = list.map(p => {
    const disc     = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    const colorIdx = cardColorState[p.id] !== undefined ? cardColorState[p.id] : 0;
    const img1     = getCurrentImage(p, colorIdx);
    // ① Second image for hover effect
    const img2     = getSecondImage(p, colorIdx);
    const isWished = wishlist.includes(p.id);

    // ③ Stock urgency — visible on card, not just in modal
    let badge = '';
    if (p.stock === 0)     badge = `<span class="badge sold-out">${t('badge.soldOut')}</span>`;
    else if (disc > 0)     badge = `<span class="badge">-${disc}%</span>`;
    else if (p.stock <= 3) badge = `<span class="badge low">${t('badge.left', { n: p.stock })}</span>`;

    // Stock urgency strip below image (feature ③)
    let urgencyBar = '';
    if (p.stock > 0 && p.stock <= 5) {
      const pct = Math.round((p.stock / 10) * 100);
      urgencyBar = `
        <div class="card-urgency">
          <div class="urgency-bar"><div class="urgency-fill" style="width:${pct}%"></div></div>
          <span class="urgency-text">${t('badge.left', { n: p.stock })}</span>
        </div>`;
    }

    let colorDots = '';
    if (p.colors && p.colors.length > 1) {
      colorDots = `<div class="card-colors">` + p.colors.map((c, i) => {
        const style = c.multi
          ? `background:conic-gradient(#f9a8d4 0 25%,#93c5fd 25% 50%,#6ee7b7 50% 75%,#fde68a 75%);`
          : `background:${c.hex};`;
        return `<span class="card-color-dot${i === colorIdx ? ' active' : ''}" style="${style}"
          data-pid="${p.id}" data-cidx="${i}"
          onclick="event.stopPropagation();setCardColor('${p.id}',${i})"
          title="${getColorName(c)}"></span>`;
      }).join('') + `</div>`;
    }

    // ② Quick-add: size buttons that appear on hover
    const isSoldOut = p.stock === 0;
    let quickAdd = '';
    if (!isSoldOut) {
      const sizeBtns = p.sizes.map(s => {
        const noStock = p.sizeStock && p.sizeStock[s] === 0;
        return `<button
          class="qa-size${noStock ? ' qa-size--out' : ''}"
          onclick="event.stopPropagation();quickAddToCart('${p.id}','${s}')"
          ${noStock ? 'disabled title="Out of stock"' : ''}>${s}</button>`;
      }).join('');
      quickAdd = `
        <div class="quick-add" onclick="event.stopPropagation()">
          <p class="qa-label">${t('modal.selectSize')}</p>
          <div class="qa-sizes">${sizeBtns}</div>
        </div>`;
    }

    return `<div class="product-card" id="card-${p.id}" onclick="openProduct('${p.id}')">
      <div class="card-img">
        <img class="card-img-primary"   id="card-img-${p.id}"  src="${img1}" alt="${getName(p)}" loading="lazy">
        ${img2 ? `<img class="card-img-secondary" src="${img2}" alt="${getName(p)}" loading="lazy">` : ''}
        ${badge}
        <button class="wish-btn${isWished ? ' wished' : ''}" id="wish-${p.id}"
          onclick="event.stopPropagation();toggleWishlist('${p.id}')" title="Wishlist">
          <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        ${quickAdd}
      </div>
      ${urgencyBar}
      <div class="card-info">
        <p class="card-cat">${t('cat.' + p.category)}</p>
        <p class="card-name">${getName(p)}</p>
        <div class="card-price">
          <span class="price-now">${fmt(p.price)}</span>
          ${p.oldPrice ? `<span class="price-old">${fmt(p.oldPrice)}</span><span class="discount">-${disc}%</span>` : ''}
        </div>
        ${colorDots}
      </div>
    </div>`;
  }).join('');

  /* #16 Blur-up placeholder — wire up after DOM insert */
  if (typeof blurUpObserve === 'function') blurUpObserve();
}

/* ── HELPER: get second image for hover effect ── */
function getSecondImage(product, colorIdx) {
  const images = product.colors?.[colorIdx]?.images;
  if (images && images.length > 1) return images[1];
  return null;
}

/* ── QUICK ADD TO CART (no modal needed) ── */
function quickAddToCart(pid, size) {
  const p = products.find(x => x.id === pid);
  if (!p) return;

  // Check size stock
  if (p.sizeStock && p.sizeStock[size] === 0) return;

  const colorIdx  = cardColorState[pid] !== undefined ? cardColorState[pid] : 0;
  const color     = p.colors ? p.colors[colorIdx] : null;
  const colorName = color ? getColorName(color) : null;
  const cartKey   = `${p.id}_${size}_${colorIdx}`;
  const existing  = cart.find(i => i.cartKey === cartKey);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      cartKey,
      id:         p.id,
      name:       getName(p),
      price:      p.price,
      image:      getCurrentImage(p, colorIdx),
      size,
      color:      colorName,
      colorIdx,
      qty:        1,
      productRef: p
    });
  }

  saveCart();
  updateCartUI();
  showToast(`🛍 ${getName(p)} (${size}) ${t('modal.addToCart').toLowerCase()}`, 'green');

  // Animate the card briefly
  const card = document.getElementById(`card-${pid}`);
  if (card) {
    card.classList.add('card-added');
    setTimeout(() => card.classList.remove('card-added'), 600);
  }
}

/* ── SET CARD COLOR (unchanged) ── */
function setCardColor(pid, colorIdx) {
  cardColorState[pid] = colorIdx;
  const p = products.find(x => x.id === pid);
  if (!p) return;

  const primary = document.getElementById(`card-img-${pid}`);
  if (primary) {
    primary.style.opacity = '0';
    setTimeout(() => {
      primary.src = getCurrentImage(p, colorIdx);
      primary.style.opacity = '1';
      // Also update secondary hover image
      const card      = document.getElementById(`card-${pid}`);
      const secondary = card?.querySelector('.card-img-secondary');
      if (secondary) {
        const img2 = getSecondImage(p, colorIdx);
        secondary.src = img2 || primary.src;
      }
    }, 200);
  }

  document.querySelectorAll(`.card-color-dot[data-pid="${pid}"]`).forEach((dot, i) => {
    dot.classList.toggle('active', i === colorIdx);
  });
}

/* ── FILTER (unchanged) ── */
function filterProducts(cat) {
  currentFilter = cat;
  document.querySelectorAll('.cat-pill, .cat-nav').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === cat);
  });
  renderProducts();
  document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
}
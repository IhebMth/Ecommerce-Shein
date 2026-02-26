/* ============================================================
   CART.JS — Cart & Wishlist logic and UI
   Pure function definitions only — no top-level execution.
============================================================ */

/* ── CART ── */

function addToCart() {
  if (!currentProduct || !selectedSize) return;
  const color     = currentProduct.colors ? currentProduct.colors[selectedColorIdx] : null;
  const colorName = color ? getColorName(color) : null;
  const cartKey   = `${currentProduct.id}_${selectedSize}_${selectedColorIdx}`;
  const existing  = cart.find(i => i.cartKey === cartKey);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      cartKey,
      id:         currentProduct.id,
      name:       getName(currentProduct),
      price:      currentProduct.price,
      image:      getCurrentImage(currentProduct, selectedColorIdx),
      size:       selectedSize,
      color:      colorName,
      colorIdx:   selectedColorIdx,
      qty:        1,
      productRef: currentProduct
    });
  }
  saveCart();
  updateCartUI();
  closeProduct();
  openCart();
  showToast(`🛍 ${getName(currentProduct)} added to cart`, 'green');
}

function removeFromCart(cartKey) {
  cart = cart.filter(i => i.cartKey !== cartKey);
  saveCart();
  updateCartUI();
}

function updateCartUI() {
  const total   = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count   = cart.reduce((s, i) => s + i.qty, 0);
  const countEl = document.getElementById('cart-count');
  countEl.textContent   = count;
  countEl.style.display = count > 0 ? 'flex' : 'none';

  const body     = document.getElementById('cart-body');
  const foot     = document.getElementById('cart-foot');
  const totalEl  = document.getElementById('cart-total-price');
  const totalLbl = document.querySelector('[data-i18n="cart.total"]');
  const chkBtn   = document.getElementById('checkout-btn');
  if (totalEl)  totalEl.textContent  = fmt(total);
  if (totalLbl) totalLbl.textContent = t('cart.total');
  if (chkBtn)   chkBtn.textContent   = t('cart.checkout');

  if (cart.length === 0) {
    body.innerHTML     = `<div class="cart-empty"><div class="empty-icon">🛍</div><p>${t('cart.empty')}</p></div>`;
    foot.style.display = 'none';
  } else {
    foot.style.display = 'block';   /* flex child — footer always visible */
    body.innerHTML = cart.map(item => {
      const displayName = item.productRef ? getName(item.productRef) : item.name;
      const colorLine   = item.color ? `· ${t('cart.color')}: ${item.color}` : '';
      return `<div class="cart-item">
        <img class="cart-item-img" src="${item.image}" alt="${displayName}">
        <div class="cart-item-info">
          <p class="cart-item-name">${displayName}</p>
          <p class="cart-item-meta">${t('cart.size')}: ${item.size} ${colorLine} &nbsp;·&nbsp; ${t('cart.qty')}: ${item.qty}</p>
          <span class="cart-item-remove" onclick="removeFromCart('${item.cartKey}')">${t('cart.remove')}</span>
        </div>
        <span class="cart-item-price">${fmt(item.price * item.qty)}</span>
      </div>`;
    }).join('');
  }
}

function openCart()  {
  document.getElementById('cart-panel').classList.add('open');
  document.getElementById('cart-overlay-bg').classList.add('open');
}
function closeCart() {
  document.getElementById('cart-panel').classList.remove('open');
  document.getElementById('cart-overlay-bg').classList.remove('open');
}

/* ── WISHLIST ── */

function toggleWishlist(pid) {
  const p = products.find(x => x.id === pid);
  if (!p) return;
  if (wishlist.includes(pid)) {
    wishlist = wishlist.filter(id => id !== pid);
    showToast(`💔 ${getName(p)} removed from wishlist`, 'red');
  } else {
    wishlist.push(pid);
    showToast(`❤️ ${getName(p)} added to wishlist`, 'green');
  }
  saveWishlist();
  const btn = document.getElementById(`wish-${pid}`);
  if (btn) btn.classList.toggle('wished', wishlist.includes(pid));
  updateWishlistUI();
}

function updateWishlistUI() {
  const count     = wishlist.length;
  const countEl   = document.getElementById('wish-count');
  const headerBtn = document.getElementById('open-wishlist');
  countEl.textContent   = count;
  countEl.style.display = count > 0 ? 'flex' : 'none';
  if (headerBtn) headerBtn.classList.toggle('has-items', count > 0);

  const body = document.getElementById('wish-body');
  if (!body) return;
  if (count === 0) {
    body.innerHTML = `<div class="wish-empty"><div class="empty-icon">🤍</div><p>${t('wish.empty')}</p></div>`;
    return;
  }
  body.innerHTML = wishlist.map(pid => {
    const p = products.find(x => x.id === pid);
    if (!p) return '';
    return `<div class="wish-item" onclick="openProduct('${p.id}');closeWishlist()">
      <img class="wish-item-img" src="${getCurrentImage(p, 0)}" alt="${getName(p)}">
      <div class="wish-item-info">
        <p class="wish-item-name">${getName(p)}</p>
        <p class="wish-item-price">${fmt(p.price)}</p>
      </div>
      <button class="wish-item-remove" onclick="event.stopPropagation();toggleWishlist('${p.id}')" title="Remove">✕</button>
    </div>`;
  }).join('');
}

function openWishlist()  {
  document.getElementById('wish-panel').classList.add('open');
  document.getElementById('wish-overlay-bg').classList.add('open');
}
function closeWishlist() {
  document.getElementById('wish-panel').classList.remove('open');
  document.getElementById('wish-overlay-bg').classList.remove('open');
}
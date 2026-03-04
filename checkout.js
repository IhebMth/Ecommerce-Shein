/* ============================================================
   CHECKOUT.JS — Checkout modal and order submission
   Pure function definitions only — no top-level execution.
============================================================ */

function openCheckout() {
  // Close cart first, wait for animation to finish before opening checkout
  const cartPanel  = document.getElementById('cart-panel');
  const cartBg     = document.getElementById('cart-overlay-bg');
  const wishPanel  = document.getElementById('wish-panel');
  const wishBg     = document.getElementById('wish-overlay-bg');

  // Force-close cart and wishlist panels immediately
  if (cartPanel)  cartPanel.classList.remove('open');
  if (cartBg)     cartBg.classList.remove('open');
  if (wishPanel)  wishPanel.classList.remove('open');
  if (wishBg)     wishBg.classList.remove('open');

  // Build order summary
  const total   = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const summary = document.getElementById('checkout-summary');
  summary.innerHTML = `<h3>${t('checkout.summary')}</h3>`
    + cart.map(i => {
        const displayName = i.productRef ? getName(i.productRef) : i.name;
        const colorPart   = i.color ? ` / ${i.color}` : '';
        return `<div class="order-summary-item">
          <span>${displayName} (${i.size}${colorPart}) ×${i.qty}</span>
          <span>${fmt(i.price * i.qty)}</span>
        </div>`;
      }).join('')
    + `<div class="order-summary-total">
        <span>${t('checkout.orderTotal')}</span>
        <span>${fmt(total)}</span>
      </div>`;

  document.getElementById('checkout-form-area').style.display = 'block';
  document.getElementById('checkout-success').style.display   = 'none';

  // Small delay to let cart panel slide out first
  setTimeout(() => {
    document.getElementById('checkout-overlay').classList.add('open');
  }, 50);
}

function closeCheckout() {
  document.getElementById('checkout-overlay').classList.remove('open');
}

async function placeOrder() {
  const BACKEND_URL = "https://nova-backend-one.vercel.app";

  const name    = document.getElementById('c-name').value.trim();
  const address = document.getElementById('c-address').value.trim();
  const phone   = document.getElementById('c-phone').value.trim();
  if (!name || !address || !phone) {
    alert(currentLang === 'ar' ? 'يرجى ملء جميع الحقول.' : 'Please fill in all fields.');
    return;
  }

  const btn = document.getElementById('place-order-btn');
  btn.disabled = true; btn.textContent = t('checkout.sending');

  try {
    const res = await fetch(BACKEND_URL + "/api/orders", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        name,
        address,
        phone,
        lang: currentLang,
        cart: cart.map(item => ({
          id:    item.id,
          name:  item.productRef ? getName(item.productRef) : item.name,
          price: item.price,
          qty:   item.qty,
          size:  item.size,
          color: item.color
        }))
      })
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Order failed");

    cart = []; saveCart(); updateCartUI();
    document.getElementById('checkout-form-area').style.display = 'none';
    document.getElementById('checkout-success').style.display   = 'block';
    applyTranslations();
  } catch(err) {
    alert(currentLang === 'ar'
      ? 'فشل إرسال الطلب. يرجى المحاولة مرة أخرى.'
      : 'Failed to send order. Please try again.');
    console.error(err);
  } finally {
    btn.disabled = false; btn.textContent = t('checkout.placeOrder');
  }
}
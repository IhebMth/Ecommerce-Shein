/* ============================================================
   CHECKOUT.JS — Checkout modal and order submission
   Pure function definitions only — no top-level execution.
============================================================ */

function openCheckout() {
  closeCart();
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
  document.getElementById('checkout-overlay').classList.add('open');
}

function closeCheckout() {
  document.getElementById('checkout-overlay').classList.remove('open');
}

async function placeOrder() {
  const name    = document.getElementById('c-name').value.trim();
  const address = document.getElementById('c-address').value.trim();
  const phone   = document.getElementById('c-phone').value.trim();
  if (!name || !address || !phone) {
    alert(currentLang === 'ar' ? 'يرجى ملء جميع الحقول.' : 'Please fill in all fields.');
    return;
  }

  const btn = document.getElementById('place-order-btn');
  btn.disabled = true; btn.textContent = t('checkout.sending');

  const total        = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const orderDetails = cart.map(i => {
    const displayName = i.productRef ? getName(i.productRef) : i.name;
    const colorPart   = i.color ? ` | Color: ${i.color}` : '';
    return `• ${displayName} | Size: ${i.size}${colorPart} | Qty: ${i.qty} | ${fmt(i.price * i.qty)}`;
  }).join('\n');
  const orderID = 'NOVA-' + Math.floor(100000 + Math.random() * 900000);

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      order_id:         orderID,
      customer_name:    name,
      customer_address: address,
      customer_phone:   phone,
      order_details:    orderDetails,
      order_total:      fmt(total),
      order_date:       new Date().toLocaleString()
    });
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
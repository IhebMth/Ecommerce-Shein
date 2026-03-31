/* ════════════════════════════════════════════════════════════
   checkout.js — UPDATED v3
   - Bilingual (EN/AR) with i18n
   - City/Governorate dropdown only (no separate region)
   - Product images in order summary
   - User autofill
   - Backward compatible
════════════════════════════════════════════════════════════ */

let _appliedCode  = null;
let _codeChecking = false;

function openCheckout() {
  const cartPanel = document.getElementById('cart-panel');
  const cartBg    = document.getElementById('cart-overlay-bg');
  const wishPanel = document.getElementById('wish-panel');
  const wishBg    = document.getElementById('wish-overlay-bg');

  if (cartPanel) cartPanel.classList.remove('open');
  if (cartBg)    cartBg.classList.remove('open');
  if (wishPanel) wishPanel.classList.remove('open');
  if (wishBg)    wishBg.classList.remove('open');

  _appliedCode  = null;
  _codeChecking = false;

  document.getElementById('checkout-form-area').style.display = 'block';
  document.getElementById('checkout-success').style.display   = 'none';

  _buildSummary();

  // Inject discount code field if not exists
  if (!document.getElementById('c-code')) {
    const summary = document.getElementById('checkout-summary');
    if (summary) {
      summary.insertAdjacentHTML('afterend', `
        <div class="form-group" id="coupon-field-wrap" style="margin-top:12px">
          <label style="font-size:12px;color:var(--text-muted,#888);display:inline-flex;align-items:center;gap:6px">
            🏷 ${currentLang === 'ar' ? 'لديك كود خصم؟' : 'Have a discount code?'}
          </label>
          <div style="display:flex;gap:8px;margin-top:6px;align-items:stretch">
            <input
              type="text"
              id="c-code"
              placeholder="${currentLang === 'ar' ? 'مثال: NOVA10-AB3KF' : 'e.g. NOVA10-AB3KF'}"
              style="flex:1;text-transform:uppercase;font-family:monospace;letter-spacing:.04em;font-size:13px"
              oninput="this.value=this.value.toUpperCase()"
              onkeydown="if(event.key==='Enter'){event.preventDefault();applyCode()}"
            >
            <button
              id="c-code-btn"
              type="button"
              onclick="applyCode()"
              class="btn-primary"
              style="padding:0 18px;font-size:13px;font-weight:600;white-space:nowrap;background:var(--accent,#C9A96E);color:#0a0a0f;border:none;cursor:pointer;transition:filter .15s"
            >${currentLang === 'ar' ? 'تطبيق' : 'Apply'}</button>
          </div>
          <div id="c-code-msg" style="font-size:12px;margin-top:4px;min-height:16px"></div>
        </div>`);
    }
  } else {
    const codeInput = document.getElementById('c-code');
    const codeMsg   = document.getElementById('c-code-msg');
    const codeBtn   = document.getElementById('c-code-btn');
    if (codeInput) { codeInput.value = ''; codeInput.disabled = false; }
    if (codeMsg)   codeMsg.textContent = '';
    if (codeBtn)   { codeBtn.disabled = false; codeBtn.textContent = currentLang === 'ar' ? 'تطبيق' : 'Apply'; codeBtn.style.background = ''; }
  }

  // AUTO-FILL if user logged in
  const userData = window.getCurrentUser?.();
  if (userData) {
    const nameEl = document.getElementById('c-name');
    const phoneEl = document.getElementById('c-phone');
    const cityEl = document.getElementById('c-city');
    
    if (nameEl && !nameEl.value) {
      nameEl.value = (userData.first_name || '') + ' ' + (userData.last_name || '');
    }
    if (phoneEl && !phoneEl.value) {
      phoneEl.value = userData.phone || '';
    }
    if (cityEl && !cityEl.value && userData.city) {
      cityEl.value = userData.city;
    }
  }

  setTimeout(() => {
    document.getElementById('checkout-overlay').classList.add('open');
  }, 50);
}

function _buildSummary() {
  const rawTotal   = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const pct        = _appliedCode ? _appliedCode.pct : 0;
  const savings    = pct > 0 ? +(rawTotal * pct / 100).toFixed(2) : 0;
  const finalTotal = +(rawTotal - savings).toFixed(2);

  const summary = document.getElementById('checkout-summary');
  if (!summary) return;

  const itemsHtml = cart.map(i => {
    const displayName = i.productRef ? getName(i.productRef) : i.name;
    const itemTotal   = (i.price * i.qty).toFixed(2);
    
    return `<div class="order-summary-item" style="display:flex;gap:8px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--border,rgba(255,255,255,.1))">
      ${i.image ? `<img src="${escapeAttr(i.image)}" alt="${displayName}" style="width:40px;height:40px;border-radius:4px;object-fit:cover;background:var(--border);flex-shrink:0" onerror="this.src='/product-placeholder.png'">` : '<div style="width:40px;height:40px;border-radius:4px;background:var(--border);display:flex;align-items:center;justify-content:center;color:var(--text-muted);flex-shrink:0">📦</div>'}
      <div style="flex:1;font-size:12px">
        <div style="font-weight:600;color:var(--text)">${displayName}</div>
        <div style="color:var(--text-muted);font-size:11px">${i.size ? 'Size: ' + i.size + ' • ' : ''}${i.color ? 'Color: ' + i.color : ''}</div>
        <div style="color:var(--gold);font-weight:600;margin-top:2px">${i.price} TND × ${i.qty} = <span>${itemTotal} TND</span></div>
      </div>
    </div>`;
  }).join('');

  const discountLine = _appliedCode ? `
    <div class="order-summary-item" style="color:var(--accent,#C9A96E);display:flex;justify-content:space-between;padding:8px 0">
      <span>🏷 ${currentLang === 'ar' ? 'خصم' : 'Discount'} (${pct}% — ${_appliedCode.code})</span>
      <span>−${fmt(savings)}</span>
    </div>` : '';

  const originalLine = _appliedCode ? `
    <div class="order-summary-item" style="color:var(--text-muted,#888);font-size:12px;display:flex;justify-content:space-between;padding:4px 0;border:none">
      <span>${currentLang === 'ar' ? 'السعر الأصلي' : 'Original price'}</span>
      <span style="text-decoration:line-through">${fmt(rawTotal)}</span>
    </div>` : '';

  summary.innerHTML = `
    <h3>${t('checkout.summary')}</h3>
    ${itemsHtml}
    <div style="height:1px;background:var(--border,rgba(255,255,255,.1));margin:8px 0"></div>
    ${discountLine}
    ${originalLine}
    <div class="order-summary-total">
      <span>${t('checkout.orderTotal')}</span>
      <span>${fmt(finalTotal)}</span>
    </div>`;
}

async function applyCode() {
  const BACKEND_URL = "https://stridetnbackend.vercel.app";
  if (_codeChecking) return;

  const input = document.getElementById('c-code');
  const msgEl = document.getElementById('c-code-msg');
  const btn   = document.getElementById('c-code-btn');
  const code  = (input?.value || '').trim().toUpperCase();

  if (!code) {
    _showCodeMsg(msgEl, currentLang === 'ar' ? 'أدخل الكود أولاً' : 'Enter a code first', 'error');
    return;
  }
  if (_appliedCode) {
    _showCodeMsg(msgEl, currentLang === 'ar' ? 'تم تطبيق كود بالفعل' : 'A code is already applied', 'error');
    return;
  }

  _codeChecking = true;
  if (btn) { btn.disabled = true; btn.textContent = '…'; }

  try {
    const res  = await fetch(`${BACKEND_URL}/api/newsletter?action=validate_code`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ code }),
    });
    const data = await res.json();

    if (!res.ok || !data.valid) {
      _showCodeMsg(msgEl, currentLang === 'ar'
        ? (data.reason === 'used' ? 'هذا الكود مستخدم بالفعل' : 'كود غير صالح أو منتهي الصلاحية')
        : (data.reason === 'used' ? 'This code has already been used' : 'Invalid or expired code'),
        'error');
      return;
    }

    const pct = data.pct ?? _extractPct(code);
    if (!pct || pct <= 0) {
      _showCodeMsg(msgEl, currentLang === 'ar' ? 'كود غير صالح' : 'Invalid code', 'error');
      return;
    }

    _appliedCode = { code, pct };
    if (input) input.disabled = true;
    if (btn)   { btn.disabled = true; btn.textContent = '✓'; btn.style.background = '#16a34a'; }
    _showCodeMsg(msgEl, currentLang === 'ar' ? `✓ تم تطبيق خصم ${pct}%!` : `✓ ${pct}% discount applied!`, 'success');
    _buildSummary();

  } catch (err) {
    _showCodeMsg(msgEl, currentLang === 'ar' ? 'فشل التحقق من الكود' : 'Could not verify code', 'error');
    console.error('[applyCode]', err);
  } finally {
    _codeChecking = false;
    if (btn && !_appliedCode) {
      btn.disabled    = false;
      btn.textContent = currentLang === 'ar' ? 'تطبيق' : 'Apply';
    }
  }
}

function removeCode() {
  _appliedCode = null;
  const input = document.getElementById('c-code');
  const msgEl = document.getElementById('c-code-msg');
  const btn   = document.getElementById('c-code-btn');
  if (input) { input.value = ''; input.disabled = false; }
  if (btn)   { btn.disabled = false; btn.textContent = currentLang === 'ar' ? 'تطبيق' : 'Apply'; btn.style.background = ''; }
  if (msgEl) msgEl.textContent = '';
  _buildSummary();
}

function _extractPct(code) {
  const m = code.match(/^NOVA(\d+)-/i);
  return m ? parseInt(m[1], 10) : 0;
}

function _showCodeMsg(el, msg, type) {
  if (!el) return;
  el.textContent     = msg;
  el.style.color     = type === 'success' ? '#4ade80' : '#f87171';
  el.style.fontSize  = '12px';
  el.style.marginTop = '4px';
}

function closeCheckout() {
  document.getElementById('checkout-overlay').classList.remove('open');
}

async function placeOrder() {
  const BACKEND_URL = "https://stridetnbackend.vercel.app";

  const name    = document.getElementById('c-name')?.value.trim() || '';
  const phone   = document.getElementById('c-phone')?.value.trim() || '';
  const street  = document.getElementById('c-street')?.value.trim() || '';
  const city    = document.getElementById('c-city')?.value.trim() || '';
  const postal  = document.getElementById('c-postal')?.value.trim() || '';

  if (!name || !phone || !street || !city || !postal) {
    alert(currentLang === 'ar' 
      ? 'يرجى ملء جميع الحقول المطلوبة.' 
      : 'Please fill in all required fields.');
    return;
  }

  // Build final address string
  const finalAddress = `${street}, ${city}, ${postal}`;

  const btn = document.getElementById('place-order-btn');
  if (btn) { btn.disabled = true; btn.textContent = t('checkout.sending'); }

  const rawTotal   = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const pct        = _appliedCode ? _appliedCode.pct : 0;
  const savings    = pct > 0 ? +(rawTotal * pct / 100).toFixed(2) : 0;
  const finalTotal = +(rawTotal - savings).toFixed(2);

  try {
    // Get user ID if logged in
    const userData = window.getCurrentUser?.();
    const userId = userData?.id || null;

    const orderBody = {
      name, 
      phone,
      address: finalAddress, // Fallback
      // Structured address (NEW)
      address_street: street,
      address_city: city,
      address_postal: postal,
      address_country: 'Tunisia',
      user_id: userId, // NEW: user integration
      lang: currentLang,
      cart: cart.map(item => ({
        id:    item.id,
        name:  item.productRef ? getName(item.productRef) : item.name,
        price: item.price,
        qty:   item.qty,
        size:  item.size || null,
        color: item.color || null,
        image: item.image || null, // NEW: product images
      })),
      ..._appliedCode && {
        discount_code:    _appliedCode.code,
        discount_pct:     _appliedCode.pct,
        discounted_total: finalTotal,
        original_total:   rawTotal,
      },
    };

    const res  = await fetch(BACKEND_URL + "/api/orders", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(orderBody),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Order failed");

    if (_appliedCode) {
      fetch(`${BACKEND_URL}/api/newsletter?action=mark_used`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code: _appliedCode.code }),
      }).catch(e => console.warn('[mark_used]', e));
    }

    _appliedCode = null;
    cart = []; saveCart(); updateCartUI();
    document.getElementById('checkout-form-area').style.display = 'none';
    document.getElementById('checkout-success').style.display   = 'block';
    applyTranslations();

  } catch (err) {
    alert(currentLang === 'ar'
      ? 'فشل إرسال الطلب. يرجى المحاولة مرة أخرى.'
      : 'Failed to send order. Please try again.');
    console.error(err);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = t('checkout.placeOrder'); }
  }
}

function escapeAttr(text) {
  if (!text) return '';
  return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
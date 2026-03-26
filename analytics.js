/* ============================================================
   ANALYTICS.JS — Google Analytics 4 + Plausible integration
   ─────────────────────────────────────────────────────────
   Tracks: page_view, add_to_cart, remove_from_cart,
           begin_checkout, purchase, view_item, search,
           wishlist_add, wishlist_remove, filter_apply

   SETUP: see the CONFIG section below — fill in your IDs.
   Both GA4 and Plausible work independently. Use one or both.
============================================================ */

/* ══════════════════════════════════════════════════════════
   ① CONFIGURATION — ONLY EDIT THIS SECTION
══════════════════════════════════════════════════════════ */

const ANALYTICS_CONFIG = {

  /* ── GOOGLE ANALYTICS 4 ──────────────────────────────
     1. Go to https://analytics.google.com
     2. Admin → Create Property → Web
     3. Copy your "Measurement ID" (looks like G-XXXXXXXXXX)
     4. Paste it below. Set enabled: true.
  ─────────────────────────────────────────────────────── */
  ga4: {
    enabled: true,               /* ← set true after adding your ID */
    measurementId: 'G-Q9ZK4QYW16' /* ← paste your GA4 Measurement ID */
  },

  /* ── PLAUSIBLE ANALYTICS ─────────────────────────────
     Plausible is privacy-friendly, GDPR compliant, no cookies.
     1. Go to https://plausible.io  (free trial, then ~$9/mo)
     2. Add your site — enter your domain (e.g. novafashion.store)
     3. Copy your domain exactly as you registered it
     4. Paste it below. Set enabled: true.
  ─────────────────────────────────────────────────────── */
  plausible: {
    enabled: false,                  /* ← set true after adding your domain */
    domain:  'https://enova-store.vercel.app/'     /* ← paste your exact site domain */
  },

  /* ── DEBUG MODE ──────────────────────────────────────
     Set true during development — events print to console
     instead of being sent to analytics servers.
     ALWAYS set false before going live.
  ─────────────────────────────────────────────────────── */
  debug: false
};

/* ══════════════════════════════════════════════════════════
   ② LOADER — injects tracking scripts into <head>
══════════════════════════════════════════════════════════ */

(function _loadAnalyticsScripts() {

  /* ── Load GA4 ── */
  if (ANALYTICS_CONFIG.ga4.enabled) {
    const id = ANALYTICS_CONFIG.ga4.measurementId;

    /* GA4 loader script */
    const loaderScript = document.createElement('script');
    loaderScript.async = true;
    loaderScript.src   = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(loaderScript);

    /* gtag initializer */
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { window.dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', id, {
      /* Recommended GA4 settings */
      send_page_view:     true,
      anonymize_ip:       true,   /* GDPR friendly */
      cookie_flags:       'SameSite=None;Secure'
    });

    _analyticsLog('GA4 loaded:', id);
  }

  /* ── Load Plausible ── */
  if (ANALYTICS_CONFIG.plausible.enabled) {
    const script = document.createElement('script');
    script.defer        = true;
    script.setAttribute('data-domain', ANALYTICS_CONFIG.plausible.domain);
    /* 'outbound-links' extension auto-tracks external link clicks */
    script.src = 'https://plausible.io/js/script.outbound-links.js';
    document.head.appendChild(script);

    /* Plausible custom event function */
    window.plausible = window.plausible ||
      function() { (window.plausible.q = window.plausible.q || []).push(arguments); };

    _analyticsLog('Plausible loaded for domain:', ANALYTICS_CONFIG.plausible.domain);
  }

})();

/* ══════════════════════════════════════════════════════════
   ③ CORE EVENT SENDER
   One function → sends to both GA4 and Plausible if enabled
══════════════════════════════════════════════════════════ */

function _sendEvent(eventName, params) {
  _analyticsLog(`EVENT: ${eventName}`, params);

  /* Send to GA4 */
  if (ANALYTICS_CONFIG.ga4.enabled && typeof gtag === 'function') {
    gtag('event', eventName, params);
  }

  /* Send to Plausible (only supports custom event name + optional props) */
  if (ANALYTICS_CONFIG.plausible.enabled && typeof plausible === 'function') {
    /* Plausible only accepts string props — flatten the params object */
    const props = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) props[k] = String(v);
      });
    }
    plausible(eventName, { props });
  }
}

function _analyticsLog(msg, data) {
  if (ANALYTICS_CONFIG.debug) {
    console.log('%c[NOVA Analytics]', 'color:#C9A96E;font-weight:bold', msg, data || '');
  }
}

/* ══════════════════════════════════════════════════════════
   ④ EVENT HOOKS — patch existing NOVA functions
   We wrap each global function so events fire automatically
   without touching Cart.js, Modal.js, etc.
══════════════════════════════════════════════════════════ */

function _patchNovFunctions() {

  /* ── view_item — fires when a product modal opens ── */
  const _origOpenProduct = window.openProduct;
  if (_origOpenProduct) {
    window.openProduct = function(id) {
      _origOpenProduct(id);
      const p = (typeof products !== 'undefined') ? products.find(x => x.id === id) : null;
      if (p) {
        _sendEvent('view_item', {
          item_id:       p.id,
          item_name:     typeof getName === 'function' ? getName(p) : p.name?.en || p.id,
          item_category: p.category,
          price:         p.price,
          currency:      'USD'
        });
      }
    };
  }

  /* ── add_to_cart — fires on both modal add and quick-add ── */
  const _origAddToCart = window.addToCart;
  if (_origAddToCart) {
    window.addToCart = function() {
      _origAddToCart();
      if (typeof currentProduct !== 'undefined' && currentProduct) {
        _sendEvent('add_to_cart', {
          item_id:       currentProduct.id,
          item_name:     typeof getName === 'function' ? getName(currentProduct) : currentProduct.id,
          item_category: currentProduct.category,
          price:         currentProduct.price,
          size:          typeof selectedSize !== 'undefined' ? selectedSize : '',
          currency:      'USD'
        });
      }
    };
  }

  const _origQuickAdd = window.quickAddToCart;
  if (_origQuickAdd) {
    window.quickAddToCart = function(pid, size) {
      _origQuickAdd(pid, size);
      const p = (typeof products !== 'undefined') ? products.find(x => x.id === pid) : null;
      if (p) {
        _sendEvent('add_to_cart', {
          item_id:       p.id,
          item_name:     typeof getName === 'function' ? getName(p) : p.id,
          item_category: p.category,
          price:         p.price,
          size:          size,
          method:        'quick_add',
          currency:      'USD'
        });
      }
    };
  }

  /* ── remove_from_cart ── */
  const _origRemove = window.removeFromCart;
  if (_origRemove) {
    window.removeFromCart = function(cartKey) {
      /* Capture item before removal */
      const item = (typeof cart !== 'undefined') ? cart.find(i => i.cartKey === cartKey) : null;
      _origRemove(cartKey);
      if (item) {
        _sendEvent('remove_from_cart', {
          item_id:   item.id,
          item_name: item.name,
          price:     item.price,
          size:      item.size,
          qty:       item.qty,
          currency:  'USD'
        });
      }
    };
  }

  /* ── begin_checkout ── */
  const _origOpenCheckout = window.openCheckout;
  if (_origOpenCheckout) {
    window.openCheckout = function() {
      _origOpenCheckout();
      const total = (typeof cart !== 'undefined') ? cart.reduce((s, i) => s + i.price * i.qty, 0) : 0;
      const items = (typeof cart !== 'undefined') ? cart.map(i => ({
        item_id:   i.id,
        item_name: i.name,
        price:     i.price,
        quantity:  i.qty,
        size:      i.size
      })) : [];
      _sendEvent('begin_checkout', {
        value:    parseFloat(total.toFixed(2)),
        currency: 'USD',
        items:    JSON.stringify(items)
      });
    };
  }

  /* ── purchase — fires on successful order ── */
  const _origPlaceOrder = window.placeOrder;
  if (_origPlaceOrder) {
    window.placeOrder = async function() {
      /* Snapshot before order clears the cart */
      const snapCart  = (typeof cart !== 'undefined') ? [...cart] : [];
      const snapTotal = snapCart.reduce((s, i) => s + i.price * i.qty, 0);
      const orderId   = 'NOVA-' + Math.floor(100000 + Math.random() * 900000);

      await _origPlaceOrder();

      /* Only fire if checkout success screen is visible (order went through) */
      const successEl = document.getElementById('checkout-success');
      if (successEl && successEl.style.display !== 'none') {
        _sendEvent('purchase', {
          transaction_id: orderId,
          value:          parseFloat(snapTotal.toFixed(2)),
          currency:       'USD',
          items:          JSON.stringify(snapCart.map(i => ({
            item_id:   i.id,
            item_name: i.name,
            price:     i.price,
            quantity:  i.qty
          })))
        });
      }
    };
  }

  /* ── wishlist_add / wishlist_remove ── */
  const _origToggleWishlist = window.toggleWishlist;
  if (_origToggleWishlist) {
    window.toggleWishlist = function(pid) {
      const wasWished = (typeof wishlist !== 'undefined') && wishlist.includes(pid);
      _origToggleWishlist(pid);
      const p = (typeof products !== 'undefined') ? products.find(x => x.id === pid) : null;
      if (p) {
        _sendEvent(wasWished ? 'wishlist_remove' : 'wishlist_add', {
          item_id:       p.id,
          item_name:     typeof getName === 'function' ? getName(p) : p.id,
          item_category: p.category,
          price:         p.price,
          currency:      'USD'
        });
      }
    };
  }

  /* ── search ── */
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    let _searchTimer = null;
    searchInput.addEventListener('input', () => {
      clearTimeout(_searchTimer);
      _searchTimer = setTimeout(() => {
        const q = searchInput.value.trim();
        if (q.length >= 2) {
          _sendEvent('search', { search_term: q });
        }
      }, 800); /* debounce — only fires after user stops typing */
    });
  }

  /* ── filter_apply ── */
  const _origFilter = window.filterProducts;
  if (_origFilter) {
    window.filterProducts = function(cat) {
      _origFilter(cat);
      _sendEvent('filter_apply', { category: cat });
    };
  }

  _analyticsLog('All event hooks attached ✓');
}

/* ══════════════════════════════════════════════════════════
   ⑤ INIT — patch after all other scripts have run
══════════════════════════════════════════════════════════ */

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(_patchNovFunctions, 100));
} else {
  setTimeout(_patchNovFunctions, 100);
}
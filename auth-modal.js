/* ============================================================
   auth-modal.js — NOVA Store · User Authentication System
   ─────────────────────────────────────────────────────────
   Self-contained — add ONE script tag to index.html:
     <script src="auth-modal.js"></script>
   (after analytics.js, before the closing </body>)

   Features:
   ✓ Sign In / Sign Up / Forgot Password / Set New Password
   ✓ Header avatar chip with dropdown (My Profile · Sign Out)
   ✓ Profile modal: edit info · upload/remove photo · change password
   ✓ EN / AR bilingual — follows the store's setLang()
   ✓ Session restored on page load via /api/users?action=me
   ✓ Checkout autofill (name, phone, city) for logged-in users
   ✓ Uses --accent, --bg-card, --border, --surface-alt CSS vars
   ✓ Light & dark theme compatible
============================================================ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────
     CONFIG
  ───────────────────────────────────────── */
  const API = 'https://nova-backend-one.vercel.app/api/users';

  /* ─────────────────────────────────────────
     STATE
  ───────────────────────────────────────── */
  let _user       = null;
  let _token      = null;  // JWT — stored in memory + sessionStorage backup
  let _screen     = 'login';
  let _resetIdent = '';
  let _pendingB64 = null; // base64 of new avatar, or 'REMOVE'

  /* ─────────────────────────────────────────
     TOKEN HELPERS
  ───────────────────────────────────────── */
  const _TOK_KEY = '_nva_tok';

  function _saveToken(t) {
    _token = t;
    try { sessionStorage.setItem(_TOK_KEY, t); } catch(_e) {}
  }

  function _loadToken() {
    if (_token) return _token;
    try { _token = sessionStorage.getItem(_TOK_KEY); } catch(_e) {}
    return _token;
  }

  function _clearToken() {
    _token = null;
    try { sessionStorage.removeItem(_TOK_KEY); } catch(_e) {}
  }

  /* Central fetch — always injects Authorization: Bearer <token> */
  function _apiFetch(url, opts) {
    const tok = _loadToken();
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts && opts.headers || {});
    if (tok) headers['Authorization'] = 'Bearer ' + tok;
    return fetch(url, Object.assign({ credentials: 'include' }, opts, { headers }));
  }

  /* ─────────────────────────────────────────
     TRANSLATIONS
  ───────────────────────────────────────── */
  const TX = {
    en: {
      signIn:'Sign In', signUp:'Create Account', signOut:'Sign Out',
      myProfile:'My Profile', forgotPw:'Forgot password?',
      noAccount:'New here?', hasAccount:'Already have an account?',
      firstName:'First Name', lastName:'Last Name',
      phone:'Phone Number', email:'Email (optional)',
      city:'City (optional)', dob:'Date of Birth (optional)',
      gender:'Gender', male:'Male', female:'Female', other:'Other',
      password:'Password', confirmPw:'Confirm Password',
      newPw:'New Password', confirmNewPw:'Confirm New Password',
      currentPw:'Current Password',
      forgotTitle:'Reset Password',
      forgotSub:'Verify your identity to reset your password',
      forgotIdent:'Phone or Email', forgotCity:'City on your account', forgotDob:'Date of birth on your account',
      verify:'Verify Identity', setPw:'Set New Password',
      backToLogin:'← Back to Sign In',
      infoTab:'Account Info', pwTab:'Change Password',
      saveChanges:'Save Changes',
      uploadPhoto:'Choose Photo', removePhoto:'Remove Photo',
      photoHint:'JPG, PNG or WEBP · max 5 MB',
      saving:'Saving…', sending:'Please wait…',
      success:'Changes saved!',
      loginSuccess:'Welcome back,', signupSuccess:'Account created! Welcome,',
      pwMismatch:'Passwords do not match.',
      pwShort:'Password must be at least 8 characters.',
      fillAll:'Please fill in all required fields.',
      identityVerified:'Identity verified! Set your new password below.',
      verifyFail:'Could not verify identity.',
      resetDone:'Password updated! Please sign in.',
      currentPwWrong:'Current password is incorrect.',
    },
    ar: {
      signIn:'تسجيل الدخول', signUp:'إنشاء حساب', signOut:'تسجيل الخروج',
      myProfile:'ملفي الشخصي', forgotPw:'نسيت كلمة المرور؟',
      noAccount:'مستخدم جديد؟', hasAccount:'هل لديك حساب؟',
      firstName:'الاسم الأول', lastName:'اسم العائلة',
      phone:'رقم الهاتف', email:'البريد الإلكتروني (اختياري)',
      city:'المدينة (اختياري)', dob:'تاريخ الميلاد (اختياري)',
      gender:'الجنس', male:'ذكر', female:'أنثى', other:'آخر',
      password:'كلمة المرور', confirmPw:'تأكيد كلمة المرور',
      newPw:'كلمة مرور جديدة', confirmNewPw:'تأكيد كلمة المرور الجديدة',
      currentPw:'كلمة المرور الحالية',
      forgotTitle:'إعادة تعيين كلمة المرور',
      forgotSub:'تحقق من هويتك لإعادة تعيين كلمة المرور',
      forgotIdent:'الهاتف أو البريد الإلكتروني', forgotCity:'المدينة في حسابك', forgotDob:'تاريخ الميلاد في حسابك',
      verify:'التحقق من الهوية', setPw:'تعيين كلمة مرور جديدة',
      backToLogin:'→ العودة إلى تسجيل الدخول',
      infoTab:'معلومات الحساب', pwTab:'تغيير كلمة المرور',
      saveChanges:'حفظ التغييرات',
      uploadPhoto:'اختيار صورة', removePhoto:'حذف الصورة',
      photoHint:'JPG أو PNG أو WEBP · بحد أقصى 5 ميغابايت',
      saving:'جارٍ الحفظ…', sending:'يرجى الانتظار…',
      success:'تم حفظ التغييرات!',
      loginSuccess:'مرحباً بعودتك،', signupSuccess:'تم إنشاء الحساب! أهلاً،',
      pwMismatch:'كلمتا المرور غير متطابقتين.',
      pwShort:'يجب أن تكون كلمة المرور 8 أحرف على الأقل.',
      fillAll:'يرجى ملء جميع الحقول المطلوبة.',
      identityVerified:'تم التحقق! عيّن كلمة مرور جديدة أدناه.',
      verifyFail:'تعذّر التحقق من الهوية.',
      resetDone:'تم تحديث كلمة المرور! يرجى تسجيل الدخول.',
      currentPwWrong:'كلمة المرور الحالية غير صحيحة.',
    }
  };

  function L(k) {
    const lang = (typeof currentLang !== 'undefined' ? currentLang : null)
               || document.documentElement.getAttribute('lang') || 'en';
    return (TX[lang] || TX.en)[k] || k;
  }

  /* ─────────────────────────────────────────
     CSS
  ───────────────────────────────────────── */
  function injectCSS() {
    if (document.getElementById('_nva_css')) return;
    const s = document.createElement('style');
    s.id = '_nva_css';
    s.textContent = `
/* ── Header chip ── */
#_nva-chip { display:flex; align-items:center; position:relative; }

.nva-open-btn {
  display:flex; align-items:center; gap:7px;
  padding:6px 14px 6px 10px;
  background:transparent;
  border:1.5px solid var(--border);
  border-radius:99px;
  color:var(--text-muted);
  font-family:inherit; font-size:11px; font-weight:600;
  letter-spacing:.08em; text-transform:uppercase;
  cursor:pointer;
  transition:border-color .2s, color .2s, background .2s;
  white-space:nowrap;
}
.nva-open-btn:hover { border-color:var(--accent); color:var(--accent); background:var(--accent-glow); }
.nva-open-btn svg { width:15px; height:15px; stroke:currentColor; fill:none; stroke-width:2; flex-shrink:0; }

.nva-avatar-btn {
  width:36px; height:36px; border-radius:50%;
  background:linear-gradient(135deg, var(--accent), var(--accent-dark));
  border:2px solid var(--border);
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; overflow:hidden; flex-shrink:0;
  font-family:'Cormorant Garamond',Georgia,serif;
  font-size:14px; font-weight:700; color:var(--bg);
  transition:border-color .2s, transform .15s, box-shadow .2s;
}
.nva-avatar-btn:hover { border-color:var(--accent); transform:scale(1.06); box-shadow:0 0 0 4px var(--accent-glow); }
.nva-avatar-btn img { width:100%; height:100%; object-fit:cover; }

/* ── Dropdown ── */
.nva-dropdown {
  position:absolute; top:calc(100% + 10px); right:0;
  min-width:220px;
  background:var(--bg-panel, var(--bg-card));
  border:1px solid var(--border);
  border-radius:16px;
  box-shadow:var(--shadow-lg, 0 20px 60px rgba(0,0,0,.15));
  padding:6px; z-index:8999;
  opacity:0; pointer-events:none;
  transform:translateY(-8px) scale(.97);
  transition:opacity .18s, transform .18s;
}
.nva-dropdown.open { opacity:1; pointer-events:all; transform:none; }
[dir="rtl"] .nva-dropdown { right:auto; left:0; }

.nva-dd-head { padding:10px 12px 9px; border-bottom:1px solid var(--border); margin-bottom:4px; }
.nva-dd-name { font-size:13.5px; font-weight:700; color:var(--text-primary); }
.nva-dd-sub  { font-size:11px; color:var(--text-muted); margin-top:2px; }

.nva-dd-item {
  display:flex; align-items:center; gap:10px;
  width:100%; padding:9px 12px;
  background:none; border:none; border-radius:10px;
  cursor:pointer; font-family:inherit; font-size:13px;
  color:var(--text-secondary); text-align:left;
  transition:background .15s, color .15s;
}
[dir="rtl"] .nva-dd-item { text-align:right; }
.nva-dd-item:hover { background:var(--surface-alt); color:var(--text-primary); }
.nva-dd-item svg { width:15px; height:15px; flex-shrink:0; opacity:.55; transition:opacity .15s; }
.nva-dd-item:hover svg { opacity:.9; }
.nva-dd-item.danger { color:var(--red, #c0392b); }
.nva-dd-item.danger:hover { background:rgba(192,57,43,.08); }

/* ══ Auth overlay ══ */
#_nva-overlay {
  position:fixed; inset:0; z-index:9000;
  display:flex; align-items:center; justify-content:center;
  background:var(--modal-overlay, rgba(0,0,0,.55));
  backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);
  opacity:0; pointer-events:none; transition:opacity .22s;
}
#_nva-overlay.open { opacity:1; pointer-events:all; }

.nva-modal {
  position:relative; width:min(420px, 94vw);
  max-height:90vh; overflow-y:auto;
  background:var(--bg-card);
  border:1px solid var(--border);
  border-radius:20px; padding:44px 36px 36px;
  box-shadow:var(--shadow-lg, 0 30px 80px rgba(0,0,0,.12));
  scrollbar-width:none;
  animation:_nva_in .22s ease;
}
.nva-modal::-webkit-scrollbar { display:none; }
@keyframes _nva_in { from { opacity:0; transform:translateY(10px); } }

.nva-modal::before {
  content:''; position:absolute; top:0; left:50%; transform:translateX(-50%);
  width:40%; height:2px;
  background:linear-gradient(90deg,transparent,var(--accent),transparent);
  border-radius:0 0 2px 2px;
}

.nva-x {
  position:absolute; top:14px; right:16px;
  background:none; border:none; cursor:pointer;
  width:32px; height:32px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  color:var(--text-muted); font-size:18px;
  transition:background .15s, color .15s;
}
[dir="rtl"] .nva-x { right:auto; left:16px; }
.nva-x:hover { background:var(--surface-alt); color:var(--text-primary); }

.nva-logo {
  font-family:'Cormorant Garamond',Georgia,serif;
  font-size:22px; font-weight:700; letter-spacing:.4em;
  color:var(--accent); text-align:center; margin-bottom:4px;
}
.nva-subtitle {
  font-size:11px; letter-spacing:.2em; text-transform:uppercase;
  color:var(--text-muted); text-align:center; margin-bottom:26px;
}

/* ── Form fields ── */
.nva-f  { margin-bottom:13px; }
.nva-f label {
  display:block; font-size:10px; letter-spacing:.15em; text-transform:uppercase;
  color:var(--text-muted); margin-bottom:5px;
}
.nva-i {
  width:100%; box-sizing:border-box;
  background:var(--surface-alt); border:1px solid var(--border);
  border-radius:10px; color:var(--text-primary);
  font-family:inherit; font-size:13.5px; padding:11px 14px;
  outline:none; transition:border-color .18s, box-shadow .18s;
}
.nva-i:focus { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-glow); }
.nva-i::placeholder { color:var(--text-muted); opacity:.6; }
.nva-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
@media (max-width:380px) { .nva-row { grid-template-columns:1fr; } }

/* ── Buttons ── */
.nva-btn {
  width:100%; padding:13px; margin-top:4px;
  background:var(--text-primary); color:var(--bg);
  font-family:inherit; font-size:11px; font-weight:700;
  letter-spacing:.15em; text-transform:uppercase;
  border:none; border-radius:10px; cursor:pointer;
  transition:background .18s, transform .12s, opacity .18s;
}
.nva-btn:hover:not(:disabled) { background:var(--accent); transform:translateY(-1px); }
.nva-btn:active { transform:none; }
.nva-btn:disabled { opacity:.45; cursor:not-allowed; transform:none; }

.nva-btn-ghost {
  width:100%; padding:11px; margin-top:8px;
  background:transparent; border:1.5px solid var(--border);
  color:var(--text-muted);
  font-family:inherit; font-size:11px; font-weight:600;
  letter-spacing:.12em; text-transform:uppercase;
  border-radius:10px; cursor:pointer;
  transition:border-color .18s, color .18s;
}
.nva-btn-ghost:hover { border-color:var(--text-primary); color:var(--text-primary); }

.nva-divider { height:1px; background:var(--border); margin:18px 0; }
.nva-link {
  display:block; width:100%; background:none; border:none;
  color:var(--text-muted); font-family:inherit; font-size:11px;
  cursor:pointer; text-align:center; margin-top:10px; padding:4px;
  transition:color .15s;
}
.nva-link:hover { color:var(--accent); }

.nva-msg {
  display:none; padding:10px 14px; border-radius:9px;
  font-size:12.5px; line-height:1.5; text-align:center; margin-bottom:14px;
}
.nva-msg.err { display:block; background:rgba(192,57,43,.1); border:1px solid rgba(192,57,43,.25); color:var(--red, #c0392b); }
.nva-msg.ok  { display:block; background:rgba(39,174,96,.09); border:1px solid rgba(39,174,96,.22); color:var(--green,#27ae60); }

/* ══ Profile overlay ══ */
#_nva-profile-ov {
  position:fixed; inset:0; z-index:9100;
  display:flex; align-items:center; justify-content:center;
  background:var(--modal-overlay,rgba(0,0,0,.55));
  backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);
  opacity:0; pointer-events:none; transition:opacity .22s;
}
#_nva-profile-ov.open { opacity:1; pointer-events:all; }

.nva-pm {
  position:relative; width:min(520px,96vw);
  max-height:92vh; overflow-y:auto;
  background:var(--bg-card); border:1px solid var(--border);
  border-radius:22px;
  box-shadow:var(--shadow-lg, 0 30px 80px rgba(0,0,0,.12));
  scrollbar-width:none; animation:_nva_in .22s ease;
}
.nva-pm::-webkit-scrollbar { display:none; }

/* Profile hero */
.nva-ph {
  display:flex; align-items:center; gap:18px;
  padding:30px 32px 24px;
  background:var(--surface-alt); border-bottom:1px solid var(--border);
}
[dir="rtl"] .nva-ph { flex-direction:row-reverse; }
.nva-pm-x {
  position:absolute; top:14px; right:16px;
  background:none; border:none; cursor:pointer;
  width:32px; height:32px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  color:var(--text-muted); font-size:18px;
  transition:background .15s, color .15s;
}
[dir="rtl"] .nva-pm-x { right:auto; left:16px; }
.nva-pm-x:hover { background:var(--border); color:var(--text-primary); }

.nva-av-wrap { position:relative; flex-shrink:0; cursor:pointer; }
.nva-av {
  width:76px; height:76px; border-radius:50%;
  background:linear-gradient(135deg,var(--accent),var(--accent-dark));
  border:3px solid var(--border);
  display:flex; align-items:center; justify-content:center;
  overflow:hidden;
  font-family:'Cormorant Garamond',Georgia,serif;
  font-size:26px; font-weight:700; color:var(--bg);
  transition:border-color .2s;
}
.nva-av-wrap:hover .nva-av { border-color:var(--accent); }
.nva-av img { width:100%; height:100%; object-fit:cover; }
.nva-av-badge {
  position:absolute; bottom:1px; right:1px;
  width:24px; height:24px; border-radius:50%;
  background:var(--accent); border:2px solid var(--bg-card);
  display:flex; align-items:center; justify-content:center;
  pointer-events:none;
}
[dir="rtl"] .nva-av-badge { right:auto; left:1px; }
.nva-av-badge svg { width:11px; height:11px; stroke:var(--bg); fill:none; stroke-width:2.5; }

.nva-ph-info { flex:1; min-width:0; }
.nva-ph-name {
  font-family:'Cormorant Garamond',Georgia,serif;
  font-size:22px; font-weight:700; color:var(--text-primary);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.nva-ph-phone { font-size:12px; color:var(--text-muted); margin-top:3px; }
.nva-ph-role {
  display:inline-block; margin-top:7px; padding:2px 10px;
  border-radius:99px; font-size:10px; font-weight:600;
  letter-spacing:.1em; text-transform:uppercase;
  background:var(--accent-glow); color:var(--accent);
  border:1px solid rgba(201,169,110,.25);
}

/* Profile tabs */
.nva-tabs { display:flex; border-bottom:1px solid var(--border); padding:0 32px; }
[dir="rtl"] .nva-tabs { flex-direction:row-reverse; }
.nva-tab {
  padding:13px 0; margin-right:24px;
  background:none; border:none; border-bottom:2px solid transparent;
  font-family:inherit; font-size:11px; font-weight:600;
  letter-spacing:.12em; text-transform:uppercase;
  color:var(--text-muted); cursor:pointer;
  transition:color .18s, border-color .18s;
}
[dir="rtl"] .nva-tab { margin-right:0; margin-left:24px; }
.nva-tab.active { color:var(--accent); border-bottom-color:var(--accent); }

.nva-pb { padding:26px 32px 34px; }

/* Avatar upload zone */
.nva-upzone {
  border:2px dashed var(--border); border-radius:14px;
  padding:22px 20px; text-align:center; margin-bottom:20px;
  cursor:pointer; transition:border-color .18s, background .18s;
}
.nva-upzone:hover { border-color:var(--accent); background:var(--accent-glow); }
.nva-upprev {
  width:60px; height:60px; border-radius:50%; margin:0 auto 12px;
  background:linear-gradient(135deg,var(--accent),var(--accent-dark));
  display:flex; align-items:center; justify-content:center; overflow:hidden;
  font-family:'Cormorant Garamond',Georgia,serif;
  font-size:20px; font-weight:700; color:var(--bg);
  border:2px solid var(--border);
}
.nva-upprev img { width:100%; height:100%; object-fit:cover; }
.nva-uphint { font-size:11px; color:var(--text-muted); line-height:1.6; }
.nva-uphint strong { display:block; color:var(--text-secondary); font-size:12px; margin-bottom:2px; }
.nva-upbtns { display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin-top:12px; }
.nva-pick {
  padding:7px 16px; font-size:11px; font-weight:600; letter-spacing:.08em;
  background:var(--surface-alt); border:1px solid var(--border);
  color:var(--text-secondary); border-radius:8px;
  cursor:pointer; font-family:inherit; transition:border-color .15s, color .15s;
}
.nva-pick:hover { border-color:var(--accent); color:var(--accent); }
.nva-rm {
  padding:7px 16px; font-size:11px; font-weight:600;
  background:rgba(192,57,43,.06); border:1px solid rgba(192,57,43,.2);
  color:var(--red,#c0392b); border-radius:8px;
  cursor:pointer; font-family:inherit; transition:background .15s;
}
.nva-rm:hover { background:rgba(192,57,43,.12); }

.nva-pmsg {
  display:none; padding:10px 14px; border-radius:9px;
  font-size:12.5px; line-height:1.5; text-align:center; margin-bottom:16px;
}
.nva-pmsg.err { display:block; background:rgba(192,57,43,.1); border:1px solid rgba(192,57,43,.25); color:var(--red,#c0392b); }
.nva-pmsg.ok  { display:block; background:rgba(39,174,96,.09); border:1px solid rgba(39,174,96,.22); color:var(--green,#27ae60); }

/* Reuse nva-f / nva-i / nva-row / nva-btn inside profile */
.nva-pm .nva-f  { margin-bottom:13px; }
.nva-pm .nva-i  { width:100%; box-sizing:border-box; }
.nva-pm .nva-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
@media (max-width:380px) { .nva-pm .nva-row { grid-template-columns:1fr; } }

/* ══ Toast ══ */
#_nva-toast {
  position:fixed; bottom:26px; left:50%;
  transform:translateX(-50%) translateY(12px);
  z-index:9999;
  background:var(--bg-panel,var(--bg-card));
  border:1px solid var(--border); border-radius:12px;
  padding:11px 22px; font-size:13px; color:var(--text-primary);
  box-shadow:var(--shadow-md, 0 10px 36px rgba(0,0,0,.1));
  opacity:0; pointer-events:none;
  transition:opacity .2s, transform .2s;
  white-space:nowrap;
}
#_nva-toast.show { opacity:1; transform:translateX(-50%) translateY(0); }
#_nva-toast.accent { border-color:var(--accent); color:var(--accent); }
    `;
    document.head.appendChild(s);
  }

  /* ─────────────────────────────────────────
     TOAST
  ───────────────────────────────────────── */
  let _toastTID = null;
  function toast(msg, accent) {
    let el = document.getElementById('_nva-toast');
    if (!el) { el = document.createElement('div'); el.id = '_nva-toast'; document.body.appendChild(el); }
    el.textContent = msg;
    el.className = 'show' + (accent ? ' accent' : '');
    clearTimeout(_toastTID);
    _toastTID = setTimeout(() => { el.className = ''; }, 3200);
  }

  /* ─────────────────────────────────────────
     BUILD AUTH MODAL
  ───────────────────────────────────────── */
  function buildAuthModal() {
    if (document.getElementById('_nva-overlay')) return;
    const ov = document.createElement('div');
    ov.id = '_nva-overlay';
    ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true');
    ov.innerHTML = `
<div class="nva-modal">
  <button class="nva-x" id="_nva-x">✕</button>
  <div class="nva-logo">NO<span style="opacity:.4">VA</span></div>
  <div class="nva-subtitle" id="_nva-title"></div>
  <div class="nva-msg" id="_nva-msg"></div>

  <!-- LOGIN -->
  <div id="_nva-s-login">
    <div class="nva-f"><label id="_nva-l-id"></label><input class="nva-i" id="_nva-i-id" type="text" autocomplete="username"></div>
    <div class="nva-f"><label id="_nva-l-pw"></label><input class="nva-i" id="_nva-i-pw" type="password" autocomplete="current-password"></div>
    <button class="nva-btn" id="_nva-b-login"></button>
    <button class="nva-link" id="_nva-b-forgot"></button>
    <div class="nva-divider"></div>
    <button class="nva-btn-ghost" id="_nva-b-tosignup"></button>
  </div>

  <!-- SIGNUP -->
  <div id="_nva-s-signup" style="display:none">
    <div class="nva-row">
      <div class="nva-f"><label id="_nva-l-fn"></label><input class="nva-i" id="_nva-i-fn" type="text" autocomplete="given-name"></div>
      <div class="nva-f"><label id="_nva-l-ln"></label><input class="nva-i" id="_nva-i-ln" type="text" autocomplete="family-name"></div>
    </div>
    <div class="nva-f"><label id="_nva-l-ph"></label><input class="nva-i" id="_nva-i-ph" type="tel" autocomplete="tel" placeholder="+216XXXXXXXX"></div>
    <div class="nva-f"><label id="_nva-l-em"></label><input class="nva-i" id="_nva-i-em" type="email" autocomplete="email"></div>
    <div class="nva-row">
      <div class="nva-f"><label id="_nva-l-ci"></label><input class="nva-i" id="_nva-i-ci" type="text"></div>
      <div class="nva-f"><label id="_nva-l-dob"></label><input class="nva-i" id="_nva-i-dob" type="date"></div>
    </div>
    <div class="nva-f">
      <label id="_nva-l-gd"></label>
      <select class="nva-i" id="_nva-i-gd">
        <option value="">—</option>
        <option value="female" id="_nva-o-f"></option>
        <option value="male"   id="_nva-o-m"></option>
        <option value="other"  id="_nva-o-o"></option>
      </select>
    </div>
    <div class="nva-row">
      <div class="nva-f"><label id="_nva-l-spw"></label><input class="nva-i" id="_nva-i-spw" type="password" autocomplete="new-password"></div>
      <div class="nva-f"><label id="_nva-l-cpw"></label><input class="nva-i" id="_nva-i-cpw" type="password" autocomplete="new-password"></div>
    </div>
    <button class="nva-btn" id="_nva-b-signup"></button>
    <div class="nva-divider"></div>
    <button class="nva-btn-ghost" id="_nva-b-tologin"></button>
  </div>

  <!-- FORGOT -->
  <div id="_nva-s-forgot" style="display:none">
    <p style="font-size:12px;color:var(--text-muted);text-align:center;margin:0 0 22px;line-height:1.7" id="_nva-forgot-sub"></p>
    <div class="nva-f"><label id="_nva-l-fi"></label><input class="nva-i" id="_nva-i-fi" type="text"></div>
    <div class="nva-f"><label id="_nva-l-fc"></label><input class="nva-i" id="_nva-i-fc" type="text"></div>
    <div class="nva-f"><label id="_nva-l-fd"></label><input class="nva-i" id="_nva-i-fd" type="date"></div>
    <button class="nva-btn" id="_nva-b-verify"></button>
    <button class="nva-link" id="_nva-b-back"></button>
  </div>

  <!-- RESET -->
  <div id="_nva-s-reset" style="display:none">
    <div class="nva-f"><label id="_nva-l-np"></label><input class="nva-i" id="_nva-i-np" type="password" autocomplete="new-password"></div>
    <div class="nva-f"><label id="_nva-l-cnp"></label><input class="nva-i" id="_nva-i-cnp" type="password" autocomplete="new-password"></div>
    <button class="nva-btn" id="_nva-b-reset"></button>
  </div>
</div>`;
    document.body.appendChild(ov);

    ov.addEventListener('click', e => { if (e.target === ov) closeAuth(); });
    $('_nva-x').addEventListener('click', closeAuth);
    $('_nva-b-tosignup').addEventListener('click', () => showScreen('signup'));
    $('_nva-b-tologin').addEventListener('click',  () => showScreen('login'));
    $('_nva-b-forgot').addEventListener('click',   () => showScreen('forgot'));
    $('_nva-b-back').addEventListener('click',     () => showScreen('login'));
    $('_nva-b-login').addEventListener('click',    doLogin);
    $('_nva-b-signup').addEventListener('click',   doSignup);
    $('_nva-b-verify').addEventListener('click',   doForgot);
    $('_nva-b-reset').addEventListener('click',    doReset);

    // Enter key shortcuts
    [['_nva-i-pw',  doLogin],
     ['_nva-i-cpw', doSignup],
     ['_nva-i-fd',  doForgot],
     ['_nva-i-cnp', doReset]].forEach(([id, fn]) => {
      $(id)?.addEventListener('keydown', e => { if (e.key === 'Enter') fn(); });
    });
  }

  /* ─────────────────────────────────────────
     BUILD PROFILE MODAL
  ───────────────────────────────────────── */
  function buildProfileModal() {
    if (document.getElementById('_nva-profile-ov')) return;
    const ov = document.createElement('div');
    ov.id = '_nva-profile-ov';
    ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true');
    ov.innerHTML = `
<div class="nva-pm">
  <button class="nva-pm-x" id="_nva-pm-x">✕</button>

  <div class="nva-ph">
    <div class="nva-av-wrap" id="_nva-av-wrap">
      <div class="nva-av" id="_nva-av-hero"></div>
      <div class="nva-av-badge">
        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </div>
    </div>
    <div class="nva-ph-info">
      <div class="nva-ph-name"  id="_nva-ph-name">—</div>
      <div class="nva-ph-phone" id="_nva-ph-phone">—</div>
      <span class="nva-ph-role" id="_nva-ph-role">Member</span>
    </div>
  </div>

  <div class="nva-tabs">
    <button class="nva-tab active" data-tab="info" id="_nva-tab-info"></button>
    <button class="nva-tab"        data-tab="pw"   id="_nva-tab-pw"></button>
  </div>

  <div class="nva-pb">
    <div class="nva-pmsg" id="_nva-pmsg"></div>

    <!-- INFO TAB -->
    <div id="_nva-tab-info-body">
      <div class="nva-upzone" id="_nva-upzone">
        <div class="nva-upprev" id="_nva-upprev"></div>
        <div class="nva-uphint">
          <strong id="_nva-up-title"></strong>
          <span id="_nva-up-hint"></span>
        </div>
        <div class="nva-upbtns">
          <button class="nva-pick" id="_nva-pick"></button>
          <button class="nva-rm"   id="_nva-rm" style="display:none"></button>
        </div>
        <input type="file" id="_nva-file" accept="image/*" style="display:none">
      </div>

      <div class="nva-row">
        <div class="nva-f"><label id="_nva-pl-fn"></label><input class="nva-i" id="_nva-p-fn" type="text"></div>
        <div class="nva-f"><label id="_nva-pl-ln"></label><input class="nva-i" id="_nva-p-ln" type="text"></div>
      </div>
      <div class="nva-f"><label id="_nva-pl-ph"></label><input class="nva-i" id="_nva-p-ph" type="tel"></div>
      <div class="nva-f"><label id="_nva-pl-em"></label><input class="nva-i" id="_nva-p-em" type="email"></div>
      <div class="nva-row">
        <div class="nva-f"><label id="_nva-pl-ci"></label><input class="nva-i" id="_nva-p-ci" type="text"></div>
        <div class="nva-f"><label id="_nva-pl-db"></label><input class="nva-i" id="_nva-p-db" type="date"></div>
      </div>
      <div class="nva-f">
        <label id="_nva-pl-gd"></label>
        <select class="nva-i" id="_nva-p-gd">
          <option value="">—</option>
          <option value="female" id="_nva-po-f"></option>
          <option value="male"   id="_nva-po-m"></option>
          <option value="other"  id="_nva-po-o"></option>
        </select>
      </div>
      <button class="nva-btn" id="_nva-save-info" style="margin-top:8px"></button>
    </div>

    <!-- PW TAB -->
    <div id="_nva-tab-pw-body" style="display:none">
      <div class="nva-f"><label id="_nva-pl-cur"></label><input class="nva-i" id="_nva-p-cur" type="password" autocomplete="current-password"></div>
      <div class="nva-f"><label id="_nva-pl-npw"></label><input class="nva-i" id="_nva-p-npw" type="password" autocomplete="new-password"></div>
      <div class="nva-f"><label id="_nva-pl-cpw"></label><input class="nva-i" id="_nva-p-cpw" type="password" autocomplete="new-password"></div>
      <button class="nva-btn" id="_nva-save-pw" style="margin-top:8px"></button>
    </div>
  </div>
</div>`;
    document.body.appendChild(ov);

    ov.addEventListener('click', e => { if (e.target === ov) closeProfile(); });
    $('_nva-pm-x').addEventListener('click', closeProfile);

    document.querySelectorAll('.nva-tab').forEach(b =>
      b.addEventListener('click', () => switchTab(b.dataset.tab))
    );

    const fi = $('_nva-file');
    ['_nva-av-wrap','_nva-upzone','_nva-pick'].forEach(id => $(id)?.addEventListener('click', () => fi.click()));
    fi.addEventListener('change', onFileChange);
    $('_nva-rm').addEventListener('click', onRemoveAvatar);
    $('_nva-save-info').addEventListener('click', doSaveInfo);
    $('_nva-save-pw').addEventListener('click',   doSavePw);
  }

  /* ─────────────────────────────────────────
     BUILD HEADER CHIP
  ───────────────────────────────────────── */
  function buildChip() {
    if (document.getElementById('_nva-chip')) return;
    const hr = document.querySelector('.header-right');
    if (!hr) return;

    const chip = document.createElement('div');
    chip.id = '_nva-chip';
    chip.innerHTML = `
      <button class="nva-open-btn" id="_nva-open-btn">
        <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span id="_nva-open-lbl"></span>
      </button>
      <div id="_nva-user-chip" style="display:none;position:relative">
        <button class="nva-avatar-btn" id="_nva-avbtn" aria-label="Account"></button>
        <div class="nva-dropdown" id="_nva-dd">
          <div class="nva-dd-head">
            <div class="nva-dd-name" id="_nva-dd-name">—</div>
            <div class="nva-dd-sub"  id="_nva-dd-sub">—</div>
          </div>
          <button class="nva-dd-item" id="_nva-dd-profile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span id="_nva-dd-profile-lbl"></span>
          </button>
          <button class="nva-dd-item danger" id="_nva-dd-out">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span id="_nva-dd-out-lbl"></span>
          </button>
        </div>
      </div>
    `;

    const cartBtn = hr.querySelector('.cart-btn');
    if (cartBtn) hr.insertBefore(chip, cartBtn);
    else hr.appendChild(chip);

    $('_nva-open-btn').addEventListener('click', openAuth);
    $('_nva-avbtn').addEventListener('click', e => {
      e.stopPropagation();
      $('_nva-dd').classList.toggle('open');
    });
    document.addEventListener('click', () => $('_nva-dd')?.classList.remove('open'));
    $('_nva-dd-profile').addEventListener('click', () => {
      $('_nva-dd').classList.remove('open');
      openProfile();
    });
    $('_nva-dd-out').addEventListener('click', doSignOut);
  }

  /* ─────────────────────────────────────────
     SCREEN SWITCHER
  ───────────────────────────────────────── */
  function showScreen(s) {
    _screen = s;
    ['login','signup','forgot','reset'].forEach(n => {
      const el = $('_nva-s-' + n);
      if (el) el.style.display = n === s ? '' : 'none';
    });
    clearMsg();

    txt('_nva-title', {login:L('signIn'), signup:L('signUp'), forgot:L('forgotTitle'), reset:L('setPw')}[s] || '');

    // Login labels
    txt('_nva-l-id', L('phone') + ' / Email');
    txt('_nva-l-pw', L('password'));
    txt('_nva-b-login', L('signIn'));
    txt('_nva-b-forgot', L('forgotPw'));
    txt('_nva-b-tosignup', L('signUp'));

    // Signup labels
    txt('_nva-l-fn', L('firstName')); txt('_nva-l-ln', L('lastName'));
    txt('_nva-l-ph', L('phone'));     txt('_nva-l-em', L('email'));
    txt('_nva-l-ci', L('city'));      txt('_nva-l-dob', L('dob'));
    txt('_nva-l-gd', L('gender'));
    txt('_nva-o-f', L('female')); txt('_nva-o-m', L('male')); txt('_nva-o-o', L('other'));
    txt('_nva-l-spw', L('password')); txt('_nva-l-cpw', L('confirmPw'));
    txt('_nva-b-signup', L('signUp'));
    txt('_nva-b-tologin', L('signIn'));

    // Forgot labels
    txt('_nva-forgot-sub', L('forgotSub'));
    txt('_nva-l-fi', L('forgotIdent')); txt('_nva-l-fc', L('forgotCity')); txt('_nva-l-fd', L('forgotDob'));
    txt('_nva-b-verify', L('verify'));
    txt('_nva-b-back', L('backToLogin'));

    // Reset labels
    txt('_nva-l-np', L('newPw')); txt('_nva-l-cnp', L('confirmNewPw'));
    txt('_nva-b-reset', L('setPw'));

    setTimeout(() => {
      const first = document.querySelector(`#_nva-s-${s} input, #_nva-s-${s} select`);
      if (first) first.focus();
    }, 60);
  }

  /* ─────────────────────────────────────────
     OPEN / CLOSE AUTH MODAL
  ───────────────────────────────────────── */
  function openAuth(screenArg) {
    buildAuthModal();
    $('_nva-overlay')?.classList.add('open');
    showScreen(typeof screenArg === 'string' ? screenArg : 'login');
  }

  function closeAuth() {
    $('_nva-overlay')?.classList.remove('open');
    clearMsg();
  }

  /* ─────────────────────────────────────────
     OPEN / CLOSE PROFILE
  ───────────────────────────────────────── */
  function openProfile() {
    if (!_user) return;
    buildProfileModal();
    populateProfile();
    applyProfileLabels();
    $('_nva-profile-ov')?.classList.add('open');
  }

  function closeProfile() {
    $('_nva-profile-ov')?.classList.remove('open');
    _pendingB64 = null;
  }

  function switchTab(tab) {
    document.querySelectorAll('.nva-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    $('_nva-tab-info-body').style.display = tab === 'info' ? '' : 'none';
    $('_nva-tab-pw-body').style.display   = tab === 'pw'   ? '' : 'none';
    clearProfileMsg();
  }

  function populateProfile() {
    if (!_user) return;
    txt('_nva-ph-name',  `${_user.first_name} ${_user.last_name}`);
    txt('_nva-ph-phone', _user.phone || _user.email || '');
    const role = (_user.role || 'member');
    txt('_nva-ph-role', role.charAt(0).toUpperCase() + role.slice(1));
    val('_nva-p-fn',  _user.first_name    || '');
    val('_nva-p-ln',  _user.last_name     || '');
    val('_nva-p-ph',  _user.phone         || '');
    val('_nva-p-em',  _user.email         || '');
    val('_nva-p-ci',  _user.city          || '');
    val('_nva-p-db',  _user.date_of_birth || '');
    val('_nva-p-gd',  _user.gender        || '');
    val('_nva-p-cur',''); val('_nva-p-npw',''); val('_nva-p-cpw','');
    _pendingB64 = null;
    refreshAvatarUI();
    switchTab('info');
  }

  function applyProfileLabels() {
    txt('_nva-tab-info', L('infoTab')); txt('_nva-tab-pw', L('pwTab'));
    txt('_nva-pl-fn', L('firstName')); txt('_nva-pl-ln', L('lastName'));
    txt('_nva-pl-ph', L('phone'));     txt('_nva-pl-em', L('email'));
    txt('_nva-pl-ci', L('city'));      txt('_nva-pl-db', L('dob'));
    txt('_nva-pl-gd', L('gender'));
    txt('_nva-po-f', L('female')); txt('_nva-po-m', L('male')); txt('_nva-po-o', L('other'));
    txt('_nva-pl-cur', L('currentPw'));
    txt('_nva-pl-npw', L('newPw')); txt('_nva-pl-cpw', L('confirmNewPw'));
    txt('_nva-save-info', L('saveChanges')); txt('_nva-save-pw', L('saveChanges'));
    txt('_nva-up-title', L('uploadPhoto')); txt('_nva-up-hint', L('photoHint'));
    txt('_nva-pick', L('uploadPhoto')); txt('_nva-rm', L('removePhoto'));
  }

  /* ─────────────────────────────────────────
     AVATAR UI
  ───────────────────────────────────────── */
  function refreshAvatarUI() {
    const initials = ((_user?.first_name?.[0]||'') + (_user?.last_name?.[0]||'')).toUpperCase() || '?';
    const src = _pendingB64 === 'REMOVE' ? null
              : (_pendingB64 || _user?.avatar_url || null);

    // Header chip
    const av = $('_nva-avbtn');
    if (av) av.innerHTML = src ? `<img src="${src}" alt="avatar">` : initials;

    // Profile hero avatar
    const hero = $('_nva-av-hero');
    if (hero) hero.innerHTML = src ? `<img src="${src}" alt="">` : initials;

    // Upload zone preview
    const prev = $('_nva-upprev');
    if (prev) prev.innerHTML = src ? `<img src="${src}" alt="">` : initials;

    // Remove button
    const rm = $('_nva-rm');
    if (rm) rm.style.display = src ? '' : 'none';
  }

  function onFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showProfileMsg('Image must be under 5 MB.', true); return; }
    const reader = new FileReader();
    reader.onload = ev => { _pendingB64 = ev.target.result; refreshAvatarUI(); };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function onRemoveAvatar() { _pendingB64 = 'REMOVE'; refreshAvatarUI(); }

  /* ─────────────────────────────────────────
     API CALLS
  ───────────────────────────────────────── */
  async function doLogin() {
    const identifier = $('_nva-i-id').value.trim();
    const password   = $('_nva-i-pw').value;
    if (!identifier || !password) { showMsg(L('fillAll'), true); return; }
    setLoading('_nva-b-login', true); clearMsg();
    try {
      const r = await _apiFetch(API + '?action=login', {
        method:'POST',
        body: JSON.stringify({ identifier, password })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Login failed');
      if (d.token) _saveToken(d.token);
      onLoggedIn(d.user);
      closeAuth();
      toast(`${L('loginSuccess')} ${d.user.first_name}! ✨`, true);
    } catch(e) { showMsg(e.message, true); }
    finally     { setLoading('_nva-b-login', false); }
  }

  async function doSignup() {
    const fn  = $('_nva-i-fn').value.trim();
    const ln  = $('_nva-i-ln').value.trim();
    const ph  = $('_nva-i-ph').value.trim();
    const em  = $('_nva-i-em').value.trim() || null;
    const ci  = $('_nva-i-ci').value.trim() || null;
    const dob = $('_nva-i-dob').value       || null;
    const gd  = $('_nva-i-gd').value        || null;
    const pw  = $('_nva-i-spw').value;
    const cpw = $('_nva-i-cpw').value;
    if (!fn||!ln||!ph||!pw) { showMsg(L('fillAll'), true); return; }
    if (pw.length < 8)      { showMsg(L('pwShort'), true); return; }
    if (pw !== cpw)          { showMsg(L('pwMismatch'), true); return; }
    setLoading('_nva-b-signup', true); clearMsg();
    try {
      const r = await _apiFetch(API + '?action=signup', {
        method:'POST',
        body: JSON.stringify({ first_name:fn, last_name:ln, phone:ph, email:em, password:pw, city:ci, date_of_birth:dob, gender:gd })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Signup failed');
      // Auto-login
      const lr = await _apiFetch(API + '?action=login', {
        method:'POST',
        body: JSON.stringify({ identifier:ph, password:pw })
      });
      const ld = await lr.json();
      if (lr.ok && ld.user) { if (ld.token) _saveToken(ld.token); onLoggedIn(ld.user); }
      closeAuth();
      toast(`${L('signupSuccess')} ${fn}! 🎉`, true);
    } catch(e) { showMsg(e.message, true); }
    finally     { setLoading('_nva-b-signup', false); }
  }

  async function doForgot() {
    const identifier    = $('_nva-i-fi').value.trim();
    const city          = $('_nva-i-fc').value.trim();
    const date_of_birth = $('_nva-i-fd').value;
    if (!identifier||!city||!date_of_birth) { showMsg(L('fillAll'), true); return; }
    setLoading('_nva-b-verify', true); clearMsg();
    try {
      const r = await _apiFetch(API + '?action=forgot', {
        method:'POST',
        body: JSON.stringify({ identifier, city, date_of_birth })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || L('verifyFail'));
      _resetIdent = identifier;
      showScreen('reset');
      showMsg(L('identityVerified'), false);
    } catch(e) { showMsg(e.message, true); }
    finally     { setLoading('_nva-b-verify', false); }
  }

  async function doReset() {
    const np = $('_nva-i-np').value;
    const cp = $('_nva-i-cnp').value;
    if (!np)           { showMsg(L('fillAll'), true); return; }
    if (np.length < 8) { showMsg(L('pwShort'), true); return; }
    if (np !== cp)      { showMsg(L('pwMismatch'), true); return; }
    setLoading('_nva-b-reset', true); clearMsg();
    try {
      const r = await _apiFetch(API + '?action=reset_password', {
        method:'PATCH',
        body: JSON.stringify({ identifier:_resetIdent, new_password:np })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Reset failed');
      closeAuth(); toast(L('resetDone'), true);
      setTimeout(() => openAuth('login'), 400);
    } catch(e) { showMsg(e.message, true); }
    finally     { setLoading('_nva-b-reset', false); }
  }

  async function doSignOut() {
    try { await _apiFetch(API + '?action=logout', { method:'POST' }); } catch(_){}
    _clearToken();
    onLoggedOut(); toast(L('signOut') + ' ✓');
  }

  async function doSaveInfo() {
    if (!_user) return;
    const body = {
      first_name:    $('_nva-p-fn').value.trim(),
      last_name:     $('_nva-p-ln').value.trim(),
      phone:         $('_nva-p-ph').value.trim(),
      email:         $('_nva-p-em').value.trim() || null,
      city:          $('_nva-p-ci').value.trim() || null,
      date_of_birth: $('_nva-p-db').value        || null,
      gender:        $('_nva-p-gd').value        || null,
    };
    if (!body.first_name||!body.last_name||!body.phone) { showProfileMsg(L('fillAll'), true); return; }
    if (_pendingB64 === 'REMOVE')              body.avatar_url = null;
    else if (_pendingB64?.startsWith('data:')) body.avatar_url = _pendingB64;
    setLoading('_nva-save-info', true); clearProfileMsg();
    try {
      const r = await _apiFetch(`${API}/${_user.id}`, {
        method:'PATCH',
        body: JSON.stringify(body)
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Save failed');
      _user = { ..._user, ...d.user };
      if (_pendingB64 && _pendingB64 !== 'REMOVE') _user.avatar_url = _pendingB64;
      if (_pendingB64 === 'REMOVE') _user.avatar_url = null;
      _pendingB64 = null;
      updateChip(); populateProfile();
      showProfileMsg(L('success'), false); toast(L('success'), true);
    } catch(e) { showProfileMsg(e.message, true); }
    finally     { setLoading('_nva-save-info', false); }
  }

  async function doSavePw() {
    if (!_user) return;
    const cur = $('_nva-p-cur').value;
    const np  = $('_nva-p-npw').value;
    const cp  = $('_nva-p-cpw').value;
    if (!cur||!np) { showProfileMsg(L('fillAll'), true); return; }
    if (np.length < 8) { showProfileMsg(L('pwShort'), true); return; }
    if (np !== cp)      { showProfileMsg(L('pwMismatch'), true); return; }
    setLoading('_nva-save-pw', true); clearProfileMsg();
    try {
      // Verify current password first
      const vr = await _apiFetch(API + '?action=login', {
        method:'POST',
        body: JSON.stringify({ identifier: _user.phone || _user.email, password: cur })
      });
      if (!vr.ok) throw new Error(L('currentPwWrong'));
      const r = await _apiFetch(`${API}/${_user.id}`, {
        method:'PATCH',
        body: JSON.stringify({ password: np })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      val('_nva-p-cur',''); val('_nva-p-npw',''); val('_nva-p-cpw','');
      showProfileMsg(L('success'), false); toast('Password changed ✓', true);
    } catch(e) { showProfileMsg(e.message, true); }
    finally     { setLoading('_nva-save-pw', false); }
  }

  /* ─────────────────────────────────────────
     SESSION RESTORE
  ───────────────────────────────────────── */
  async function restoreSession() {
    if (!_loadToken()) return; // no token = no session to restore
    try {
      const r = await _apiFetch(API + '?action=me');
      if (!r.ok) { _clearToken(); return; }
      const u = await r.json();
      if (u?.id) onLoggedIn(u);
    } catch(_) {}
  }

  /* ─────────────────────────────────────────
     STATE
  ───────────────────────────────────────── */
  function onLoggedIn(user) {
    _user = user;
    updateChip();
    patchCheckout();
  }

  function onLoggedOut() {
    _user = null;
    updateChip();
  }

  function updateChip() {
    const openBtn  = $('_nva-open-btn');
    const userChip = $('_nva-user-chip');
    if (!openBtn || !userChip) return;
    txt('_nva-open-lbl', L('signIn'));
    if (_user) {
      openBtn.style.display  = 'none';
      userChip.style.display = '';
      txt('_nva-dd-name', `${_user.first_name} ${_user.last_name}`);
      txt('_nva-dd-sub',  _user.phone || _user.email || '');
      txt('_nva-dd-profile-lbl', L('myProfile'));
      txt('_nva-dd-out-lbl',     L('signOut'));
      refreshAvatarUI();
    } else {
      openBtn.style.display  = '';
      userChip.style.display = 'none';
    }
  }

  /* ─────────────────────────────────────────
     CHECKOUT AUTOFILL
  ───────────────────────────────────────── */
  function patchCheckout() {
    if (window._nvaCheckoutPatched) return;
    window._nvaCheckoutPatched = true;
    const orig = window.openCheckout;
    if (!orig) return;
    window.openCheckout = function() {
      orig.apply(this, arguments);
      if (!_user) return;
      setTimeout(() => {
        const n = document.getElementById('c-name');
        const p = document.getElementById('c-phone');
        const a = document.getElementById('c-address');
        if (n && !n.value) n.value = `${_user.first_name} ${_user.last_name}`;
        if (p && !p.value) p.value = _user.phone || '';
        if (a && !a.value && _user.city) a.value = _user.city;
      }, 80);
    };
  }

  /* ─────────────────────────────────────────
     HOOK setLang
  ───────────────────────────────────────── */
  function hookLang() {
    if (window._nvaLangHooked) return;
    window._nvaLangHooked = true;
    const orig = window.setLang;
    if (!orig) return;
    window.setLang = function(lang) {
      orig(lang);
      txt('_nva-open-lbl', L('signIn'));
      txt('_nva-dd-profile-lbl', L('myProfile'));
      txt('_nva-dd-out-lbl', L('signOut'));
      if ($('_nva-overlay')?.classList.contains('open')) showScreen(_screen);
    };
  }

  /* ─────────────────────────────────────────
     HELPERS
  ───────────────────────────────────────── */
  function $(id)       { return document.getElementById(id); }
  function txt(id, v)  { const e=$(id); if(e) e.textContent=v; }
  function val(id, v)  { const e=$(id); if(e) e.value=v; }

  function showMsg(m, err)      { const e=$('_nva-msg'); if(e){e.textContent=m; e.className='nva-msg '+(err?'err':'ok');} }
  function clearMsg()           { const e=$('_nva-msg'); if(e){e.textContent=''; e.className='nva-msg';} }
  function showProfileMsg(m,err){ const e=$('_nva-pmsg'); if(e){e.textContent=m; e.className='nva-pmsg '+(err?'err':'ok');} }
  function clearProfileMsg()    { const e=$('_nva-pmsg'); if(e){e.textContent=''; e.className='nva-pmsg';} }

  function setLoading(id, on) {
    const b=$(id); if(!b) return;
    b.disabled=on;
    if(on) { b.dataset._t=b.textContent; b.textContent=L('saving'); }
    else   { b.textContent=b.dataset._t||b.textContent; }
  }

  /* ─────────────────────────────────────────
     BOOT
  ───────────────────────────────────────── */
  function boot() {
    injectCSS();
    buildChip();
    txt('_nva-open-lbl', L('signIn'));
    hookLang();
    restoreSession();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Public API
  window._novaAuth = { openAuth, openProfile, closeAuth };

})();
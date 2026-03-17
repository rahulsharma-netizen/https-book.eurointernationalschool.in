// =========================
// HERO MOBILE INTERACTION (Tap to reveal)
// =========================
(function initHeroMobile() {
  const hero = document.querySelector('.hero');
  const reveal = document.getElementById('heroReveal');
  const tapHint = document.getElementById('tapHint');

  if (!hero || !reveal) return;

  let isRevealing = false;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  if (isTouch) {
    hero.addEventListener('touchstart', (e) => {
      if (e.target.closest('form') || e.target.closest('a') || e.target.closest('button')) return;

      isRevealing = !isRevealing;
      if (isRevealing) {
        hero.classList.add('is-tapped');
        if (tapHint) tapHint.style.opacity = '0';
      } else {
        hero.classList.remove('is-tapped');
      }
    }, { passive: true });

    hero.addEventListener('touchmove', (e) => {
      if (!isRevealing) return;
      const touch = e.touches[0];
      const rect = hero.getBoundingClientRect();
      const x = ((touch.clientX - rect.left) / rect.width) * 100;
      const y = ((touch.clientY - rect.top) / rect.height) * 100;

      reveal.style.setProperty('--mx', x + 'vw');
      reveal.style.setProperty('--my', y + 'vh');
    }, { passive: true });

    // Auto-hide hint after 3 seconds
    if (tapHint) {
      setTimeout(() => {
        tapHint.style.transition = 'opacity 0.5s';
        tapHint.style.opacity = '0';
        setTimeout(() => tapHint.remove(), 500);
      }, 3000);
    }
  }
})();


// =========================
// LENIS SMOOTH SCROLL
// (also exposes window.lenis so your other code can use it)
// =========================
(function initSmoothScroll() {
  if (!window.Lenis) return;

  const lenis = new Lenis({
    duration: 1.15,
    smoothWheel: true,
    smoothTouch: false,
  });

  // expose globally (your BookSeat code checks window.lenis)
  window.lenis = lenis;

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  const goAbsoluteTop = () => {
    lenis.stop();
    lenis.scrollTo(0, { immediate: true });
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    lenis.start();
  };

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (href === "#" || href === "#top") {
        e.preventDefault();
        goAbsoluteTop();
        return;
      }
      const el = document.querySelector(href);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: 0 });
    });
  });
})();


// =========================
// SCROLL DIRECTION MOTION TRIGGERS (Up/Down)
// Adds body classes: scrolling-up / scrolling-down
// =========================
(function initScrollDirectionFx() {
  let lastY = window.scrollY;
  let ticking = false;

  function kick(isDown) {
    document.body.classList.remove("scrolling-down", "scrolling-up");
    void document.body.offsetWidth; // reflow to retrigger
    document.body.classList.add(isDown ? "scrolling-down" : "scrolling-up");
    clearTimeout(window.__kickT);
    window.__kickT = setTimeout(() => {
      document.body.classList.remove("scrolling-down", "scrolling-up");
    }, 220);
  }

  function update() {
    ticking = false;
    const y = window.scrollY;
    const d = y - lastY;
    if (Math.abs(d) > 4) kick(d > 0);
    lastY = y;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
})();


// =========================
// SCROLL TRIGGERED ANIMATIONS (Intersection Observer)
// Elements with class 'scroll-animate' will animate in/out on scroll
// =========================
(function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('.scroll-animate');

  if (!animatedElements.length) return;

  // Check if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    animatedElements.forEach(el => {
      el.classList.add('animate-in');
    });
    return;
  }

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -80px 0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      } else {
        if (!entry.target.hasAttribute('data-animate-once')) {
          entry.target.classList.remove('animate-in');
        }
      }
    });
  }, observerOptions);

  animatedElements.forEach(el => {
    observer.observe(el);
  });

  window.addScrollAnimation = function (element) {
    if (element && element.classList.contains('scroll-animate')) {
      observer.observe(element);
    }
  };
})();


// =========================
// CUSTOM POPUP (Replaces alert)
// =========================
(function initPopup() {
  function injectPopupIfMissing() {
    if (document.getElementById("uiPopup")) return;

    if (!document.getElementById("uiPopupStyles")) {
      const style = document.createElement("style");
      style.id = "uiPopupStyles";
      style.textContent = `
        .hidden{ display:none !important; }
        body.popup-open{ overflow:hidden; }
        .uiPopup{ position:fixed; inset:0; z-index:99999; display:grid; place-items:center; padding:18px; }
        .uiPopup__backdrop{ position:absolute; inset:0; background:rgba(0,0,0,.55); backdrop-filter:blur(6px); }
        .uiPopup__card{ position:relative; width:min(420px,92vw); background:#fff; border-radius:18px; padding:16px 16px 14px;
          box-shadow:0 30px 80px rgba(0,0,0,.35); text-align:center; }
        .uiPopup__x{ position:absolute; top:10px; right:10px; width:40px; height:40px; border-radius:999px; border:none;
          background:rgba(11,44,97,.08); cursor:pointer; font-size:18px; }
        .uiPopup__icon{ width:54px; height:54px; border-radius:999px; display:grid; place-items:center; margin:6px auto 10px;
          background:rgba(255,122,26,.12); font-size:22px; }
        .uiPopup[data-type="error"] .uiPopup__icon{ background:rgba(185,28,28,.10); }
        .uiPopup__title{ margin:0; font-weight:900; color:#0b2c61; }
        .uiPopup[data-type="error"] .uiPopup__title{ color:#7f1d1d; }
        .uiPopup__msg{ margin:10px 0 14px; color:rgba(15,23,42,.85); font-weight:600; }
        .uiPopup__btn{ height:46px; padding:0 22px; border-radius:12px; border:none; background:#ff7a1a; color:#fff; font-weight:900; cursor:pointer; }
      `;
      document.head.appendChild(style);
    }

    const wrap = document.createElement("div");
    wrap.id = "uiPopup";
    wrap.className = "uiPopup hidden";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = `
      <div class="uiPopup__backdrop" data-popup-close></div>
      <div class="uiPopup__card" role="document">
        <button class="uiPopup__x" type="button" aria-label="Close" data-popup-close>✕</button>
        <div class="uiPopup__icon" aria-hidden="true">
          <span id="uiPopupIconSuccess">✅</span>
          <span id="uiPopupIconError" class="hidden">⚠️</span>
        </div>
        <h3 class="uiPopup__title" id="uiPopupTitle">Done</h3>
        <p class="uiPopup__msg" id="uiPopupMsg">Message</p>
        <button class="uiPopup__btn" type="button" data-popup-close>OK</button>
      </div>
    `;
    document.body.appendChild(wrap);
  }

  injectPopupIfMissing();

  const uiPopup = document.getElementById("uiPopup");
  const uiPopupTitle = document.getElementById("uiPopupTitle");
  const uiPopupMsg = document.getElementById("uiPopupMsg");
  const uiIconSuccess = document.getElementById("uiPopupIconSuccess");
  const uiIconError = document.getElementById("uiPopupIconError");

  window.showPopup = function ({ type = "success", title = "Done", message = "", autoClose = 2200 } = {}) {
    if (!uiPopup) return;
    uiPopup.dataset.type = type;
    uiPopupTitle.textContent = title;
    uiPopupMsg.textContent = message;

    if (type === "error") {
      uiIconSuccess?.classList.add("hidden");
      uiIconError?.classList.remove("hidden");
    } else {
      uiIconError?.classList.add("hidden");
      uiIconSuccess?.classList.remove("hidden");
    }

    uiPopup.classList.remove("hidden");
    uiPopup.setAttribute("aria-hidden", "false");
    document.body.classList.add("popup-open");

    if (autoClose && autoClose > 0) {
      clearTimeout(window.__popupT);
      window.__popupT = setTimeout(window.hidePopup, autoClose);
    }
  };

  window.hidePopup = function () {
    if (!uiPopup) return;
    uiPopup.classList.add("hidden");
    uiPopup.setAttribute("aria-hidden", "true");
    document.body.classList.remove("popup-open");
    clearTimeout(window.__popupT);
  };

  uiPopup?.querySelectorAll("[data-popup-close]").forEach(el => {
    el.addEventListener("click", window.hidePopup);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") window.hidePopup?.();
  });
})();


// =========================
// CUSTOM DROPDOWNS (Fix mobile overflow + open-up + z-index lift)
// =========================
(function initCustomSelects() {
  const hero = document.querySelector(".hero");

  function updateHeroDropdownState() {
    const anyOpen = !!document.querySelector(".custom-select-container.open");
    if (anyOpen) {
      hero?.classList.add("dropdown-open");
      if (hero) hero.style.zIndex = "999";
    } else {
      hero?.classList.remove("dropdown-open");
      if (hero) hero.style.zIndex = "";
    }
  }

  function closeContainer(container) {
    container.classList.remove("open", "open-up");
    const menu = container.querySelector(".options-menu");
    if (menu) menu.style.maxHeight = "";
    const trigger = container.querySelector(".select-trigger");
    trigger?.setAttribute("aria-expanded", "false");
    updateHeroDropdownState();
  }

  function closeAll(except = null) {
    document.querySelectorAll(".custom-select-container.open").forEach(el => {
      if (el !== except) closeContainer(el);
    });
  }

  function adjustPlacement(container) {
    const trigger = container.querySelector(".select-trigger");
    const menu = container.querySelector(".options-menu");
    if (!trigger || !menu) return;

    container.classList.remove("open-up");

    const rect = trigger.getBoundingClientRect();
    const padding = 12;
    const spaceBelow = window.innerHeight - rect.bottom - padding;
    const spaceAbove = rect.top - padding;

    const shouldOpenUp = spaceBelow < 220 && spaceAbove > spaceBelow;
    if (shouldOpenUp) container.classList.add("open-up");

    const available = shouldOpenUp ? spaceAbove : spaceBelow;
    const maxH = Math.max(140, Math.min(260, available - 12));
    menu.style.maxHeight = maxH + "px";
  }

  function openContainer(container) {
    closeAll(container);
    container.classList.add("open");
    const trigger = container.querySelector(".select-trigger");
    trigger?.setAttribute("aria-expanded", "true");
    updateHeroDropdownState();
    requestAnimationFrame(() => adjustPlacement(container));
  }

  function setupCustomSelect(container) {
    const trigger = container.querySelector(".select-trigger");
    const triggerText = container.querySelector(".triggerText");
    const options = container.querySelectorAll(".option");
    const hiddenInput = container.querySelector('input[type="hidden"]');

    if (!trigger || !triggerText || !hiddenInput) return;

    if (!triggerText.dataset.placeholder) {
      triggerText.dataset.placeholder = triggerText.textContent.trim();
    }

    trigger.addEventListener("click", () => {
      container.classList.contains("open") ? closeContainer(container) : openContainer(container);
    });

    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        container.classList.contains("open") ? closeContainer(container) : openContainer(container);
      }
      if (e.key === "Escape") {
        e.preventDefault();
        closeContainer(container);
      }
    });

    options.forEach(option => {
      option.addEventListener("click", function () {
        options.forEach(opt => opt.classList.remove("selected"));
        this.classList.add("selected");
        triggerText.textContent = this.textContent;
        triggerText.classList.remove("is-placeholder");
        hiddenInput.value = this.getAttribute("data-value") || this.textContent;
        closeContainer(container);
      });
    });

    window.addEventListener("resize", () => {
      if (container.classList.contains("open")) adjustPlacement(container);
    });
    window.addEventListener("scroll", () => {
      if (container.classList.contains("open")) adjustPlacement(container);
    }, { passive: true });
  }

  document.querySelectorAll(".custom-select-container").forEach(setupCustomSelect);

  document.addEventListener("click", (e) => {
    const openEl = e.target.closest?.(".custom-select-container.open");
    if (openEl) return;
    if (!e.target.closest?.(".custom-select-container")) closeAll(null);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll(null);
  });
})();


// =========================
// BOOK SEAT SCROLL
// =========================
(() => {
  const btn = document.getElementById("bookSeatBtn");
  const form = document.getElementById("enquiryForm");
  if (!btn || !form) return;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const focusFirst = () => {
      const first = form.querySelector("input, select, textarea, button");
      if (first && typeof first.focus === "function") {
        first.focus({ preventScroll: true });
      }
    };

    if (window.lenis && typeof window.lenis.scrollTo === "function") {
      window.lenis.scrollTo(form, {
        offset: -24,
        duration: 1.2,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      });
      setTimeout(focusFirst, 900);
    } else {
      form.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(focusFirst, 900);
    }
  });
})();


// =========================
// FORM VALIDATION (no alert)
// =========================
document.querySelectorAll('form').forEach(form => {
  form.addEventListener('submit', (e) => {
    const phone = form.querySelector('input[type="tel"]');
    if (phone) {
      const v = (phone.value || "").trim();
      const ok = /^[0-9]{10}$/.test(v);
      if (!ok) {
        e.preventDefault();
        phone.focus();
        if (navigator.vibrate) navigator.vibrate(200);
        window.showPopup?.({
          type: "error",
          title: "Invalid Phone",
          message: "Please enter a valid 10-digit phone number.",
          autoClose: 0
        });
      }
    }
  });
});


// =========================
// AWARDS CAROUSEL
// =========================
function initAwardsCarousel() {
  const shell = document.querySelector(".awardsShell");
  if (!shell) return;

  const viewport = shell.querySelector(".awardsViewport");
  const track = shell.querySelector(".awardsTrack");
  const prevBtn = shell.querySelector(".awardsArrow--prev");
  const nextBtn = shell.querySelector(".awardsArrow--next");

  if (!viewport || !track) return;

  let slides = Array.from(track.children);
  const realCount = slides.length;
  if (realCount < 2) return;

  const firstClone = slides[0].cloneNode(true);
  const lastClone = slides[realCount - 1].cloneNode(true);
  firstClone.classList.add("is-clone");
  lastClone.classList.add("is-clone");

  track.insertBefore(lastClone, slides[0]);
  track.appendChild(firstClone);

  slides = Array.from(track.children);

  let index = 1;
  let slideW = viewport.getBoundingClientRect().width;
  let isAnimating = false;
  let isDragging = false;
  let startX = 0, startY = 0;
  let startTranslate = 0;
  let lastTranslate = 0;
  let dragIntentLocked = false;
  let isHorizontalDrag = false;
  let autoTimer = null;
  const AUTO_MS = 3500;
  let normalizeTimer = null;

  function setTransition(on) {
    track.style.transition = on
      ? "transform 650ms cubic-bezier(.2,.8,.2,1)"
      : "none";
  }

  function applyTranslate(px) {
    track.style.transform = `translate3d(${px}px,0,0)`;
  }

  function normalizeIfOnClone() {
    if (index === realCount + 1) {
      setTransition(false);
      index = 1;
      const x = -index * slideW;
      applyTranslate(x);
      lastTranslate = x;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransition(true);
        });
      });
    }
    if (index === 0) {
      setTransition(false);
      index = realCount;
      const x = -index * slideW;
      applyTranslate(x);
      lastTranslate = x;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransition(true);
        });
      });
    }
  }

  function scheduleNormalizeFallback() {
    clearTimeout(normalizeTimer);
    normalizeTimer = setTimeout(() => {
      isAnimating = false;
      normalizeIfOnClone();
    }, 750);
  }

  function goTo(newIndex, animate = true) {
    newIndex = Math.max(0, Math.min(realCount + 1, newIndex));
    isAnimating = animate;
    setTransition(animate);
    index = newIndex;
    const x = -index * slideW;
    applyTranslate(x);
    lastTranslate = x;
    if (animate) scheduleNormalizeFallback();
  }

  setTransition(false);
  goTo(index, false);

  function next() {
    if (isDragging) return;
    goTo(index + 1, true);
  }
  function prev() {
    if (isDragging) return;
    goTo(index - 1, true);
  }

  track.addEventListener("transitionend", () => {
    isAnimating = false;
    clearTimeout(normalizeTimer);
    normalizeIfOnClone();
  });

  function stopAuto() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
  }
  function startAuto() {
    stopAuto();
    autoTimer = setInterval(() => {
      if (!isDragging) next();
    }, AUTO_MS);
  }

  shell.addEventListener("mouseenter", stopAuto);
  shell.addEventListener("mouseleave", startAuto);
  shell.addEventListener("focusin", stopAuto);
  shell.addEventListener("focusout", startAuto);

  prevBtn?.addEventListener("click", () => { stopAuto(); prev(); startAuto(); });
  nextBtn?.addEventListener("click", () => { stopAuto(); next(); startAuto(); });

  function onPointerDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    stopAuto();
    if (isAnimating) {
      setTransition(false);
      isAnimating = false;
      normalizeIfOnClone();
    }
    isDragging = true;
    dragIntentLocked = false;
    isHorizontalDrag = false;
    startX = e.clientX;
    startY = e.clientY;
    setTransition(false);
    startTranslate = -index * slideW;
    applyTranslate(startTranslate);
    lastTranslate = startTranslate;
    viewport.classList.add("is-dragging");
    viewport.setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!dragIntentLocked) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        dragIntentLocked = true;
        isHorizontalDrag = Math.abs(dx) > Math.abs(dy);
      }
    }

    if (!isHorizontalDrag) return;
    e.preventDefault?.();
    const x = startTranslate + dx;
    applyTranslate(x);
    lastTranslate = x;
  }

  function onPointerUp() {
    if (!isDragging) return;
    isDragging = false;
    viewport.classList.remove("is-dragging");
    if (!isHorizontalDrag) {
      startAuto();
      return;
    }
    const dx = lastTranslate - startTranslate;
    const moved = Math.abs(dx);
    const threshold = Math.max(60, slideW * 0.18);

    setTransition(true);

    if (moved > threshold) {
      if (dx < 0) goTo(index + 1, true);
      else goTo(index - 1, true);
    } else {
      goTo(index, true);
    }
    startAuto();
  }

  viewport.addEventListener("pointerdown", onPointerDown, { passive: true });
  viewport.addEventListener("pointermove", onPointerMove, { passive: false });
  viewport.addEventListener("pointerup", onPointerUp, { passive: true });
  viewport.addEventListener("pointercancel", onPointerUp, { passive: true });

  window.addEventListener("resize", () => {
    slideW = viewport.getBoundingClientRect().width;
    setTransition(false);
    const x = -index * slideW;
    applyTranslate(x);
    lastTranslate = x;
    requestAnimationFrame(() => setTransition(true));
  });

  startAuto();
}

document.addEventListener("DOMContentLoaded", initAwardsCarousel);


// =========================
// GOOGLE SHEETS + LEADSQUARED INTEGRATION
// =========================
const CONFIG = {
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/AKfycby4Wh4rt8bhovda5-I6Rh2Jp-ERHIH4aqwrN3-409O_g7wZDnbvmhfPIJmJxbBjMDhC_g/exec"
};

function getUTMParameters() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source:   params.get('utm_source')   || '',
    utm_medium:   params.get('utm_medium')   || '',

    // ✅ Support both utm_campaign and utm_campaign_id (Google auto-tagging)
    utm_campaign: params.get('utm_campaign') || params.get('utm_campaign_id') || '',
    utm_adgroup:  params.get('utm_adgroup')  || params.get('utm_adgroup_id')  || params.get('utm_content') || '',
    utm_ad:       params.get('utm_ad')       || params.get('utm_ad_id')       || '',

    utm_term:     params.get('utm_term')     || '',
    utm_content:  params.get('utm_content')  || '',
    gclid:        params.get('gclid')        || '',
    page_url:     window.location.href
  };
}

// ✅ Always prefer fresh UTMs from URL over cached session data
const freshParams = getUTMParameters();
const hasFreshUTMs = freshParams.utm_source || freshParams.utm_campaign || freshParams.gclid;

let utmData = {};
if (hasFreshUTMs) {
  // Fresh UTMs in URL — always use and overwrite cache
  utmData = freshParams;
  sessionStorage.setItem('utm_data', JSON.stringify(utmData));
} else if (sessionStorage.getItem('utm_data')) {
  // No UTMs in URL — use cached (user navigated to another page)
  utmData = JSON.parse(sessionStorage.getItem('utm_data'));
} else {
  // No UTMs anywhere
  utmData = freshParams;
  sessionStorage.setItem('utm_data', JSON.stringify(utmData));
}

async function submitToGoogleSheets(formData) {
  const payload = { ...formData, ...utmData };
  const url = (CONFIG.GOOGLE_SCRIPT_URL || "").trim();

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log('Form submitted successfully');
    return true;
  } catch (error) {
    console.error('Submission error:', error);
    return false;
  }
}

function resetCustomSelects(form) {
  form.querySelectorAll(".custom-select-container").forEach(container => {
    container.classList.remove("open", "open-up");
    const menu = container.querySelector(".options-menu");
    if (menu) menu.style.maxHeight = "";

    const triggerText = container.querySelector(".triggerText");
    if (triggerText) {
      const ph = triggerText.dataset.placeholder || triggerText.textContent;
      triggerText.textContent = ph;
      triggerText.classList.add("is-placeholder");
    }

    container.querySelectorAll(".option").forEach(opt => opt.classList.remove("selected"));
    const hidden = container.querySelector('input[type="hidden"]');
    if (hidden) hidden.value = "";
  });

  const hero = document.querySelector(".hero");
  hero?.classList.remove("dropdown-open");
  if (hero) hero.style.zIndex = "";
}

// Setup form handlers
document.addEventListener('DOMContentLoaded', function () {

  // HERO FORM
  const heroForm = document.getElementById('enquiryForm');
  if (heroForm) {
    heroForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const submitBtn = this.querySelector('.submitLike');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Submitting...';
      submitBtn.disabled = true;

      const formData = {
        parentName:     (this.querySelector('input[type="text"]')?.value || "").trim(),
        phone:          (this.querySelector('input[type="tel"]')?.value  || "").trim(),
        admissionClass: (this.querySelector('input[name="admission_class"]')?.value || "").trim(),
        city:           (this.querySelector('input[name="city"]')?.value || "").trim()
      };

      if (!formData.admissionClass || !formData.city) {
        window.showPopup?.({
          type: "error",
          title: "Incomplete Form",
          message: "Please select Admission Class and City.",
          autoClose: 0
        });
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }

      const success = await submitToGoogleSheets(formData);

      if (success) {
        // Fire Google Ads conversion on successful submission
        if (typeof gtag_report_conversion === 'function') gtag_report_conversion();
        // Fire Meta Pixel Lead conversion
        if (typeof fbq === 'function') fbq('track', 'Lead');
        window.showPopup?.({
          type: "success",
          title: "Thank you!",
          message: "Your enquiry has been submitted successfully."
        });
        this.reset();
        resetCustomSelects(this);
      } else {
        window.showPopup?.({
          type: "error",
          title: "Something went wrong",
          message: "Please try again or call us directly.",
          autoClose: 0
        });
      }

      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    });
  }

  // LIMITED SEATS FORMS
  const limitedForms = document.querySelectorAll('.limitedForm');
  limitedForms.forEach(form => {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const submitBtn = this.querySelector('.submitLike');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Submitting...';
      submitBtn.disabled = true;

      const formData = {
        parentName:     (this.querySelector('input[type="text"]')?.value || "").trim(),
        phone:          (this.querySelector('input[type="tel"]')?.value  || "").trim(),
        admissionClass: (this.querySelector('input[name="admission_class"]')?.value || "").trim(),
        city:           (this.querySelector('input[name="city"]')?.value || "").trim()
      };

      if (!formData.admissionClass || !formData.city) {
        window.showPopup?.({
          type: "error",
          title: "Incomplete Form",
          message: "Please select Admission Class and City.",
          autoClose: 0
        });
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }

      const success = await submitToGoogleSheets(formData);

      if (success) {
        // Fire Google Ads conversion on successful submission
        if (typeof gtag_report_conversion === 'function') gtag_report_conversion();
        // Fire Meta Pixel Lead conversion
        if (typeof fbq === 'function') fbq('track', 'Lead');
        window.showPopup?.({
          type: "success",
          title: "Thank you!",
          message: "Your enquiry has been submitted successfully."
        });
        this.reset();
        resetCustomSelects(this);
      } else {
        window.showPopup?.({
          type: "error",
          title: "Something went wrong",
          message: "Please try again or call us directly.",
          autoClose: 0
        });
      }

      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    });
  });
});


// =========================
// SCROLL DIRECTION MOTION GRAPHICS
// =========================
(function initScrollDirectionGraphics() {
  const scrollUpIndicator = document.querySelector('.scroll-up');
  const scrollDownIndicator = document.querySelector('.scroll-down');
  const scrollProgress = document.querySelector('.scroll-progress');
  const scrollProgressBar = document.querySelector('.scroll-progress-bar');

  let lastScrollY = window.scrollY;
  let ticking = false;
  let scrollDirection = '';
  let lastScrollTime = Date.now();
  let showIndicatorsTimeout = null;
  let hideIndicatorsTimeout = null;

  function getScrollPercentage() {
    const winHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const trackLength = docHeight - winHeight;
    return trackLength ? Math.floor((scrollTop / trackLength) * 100) : 0;
  }

  function updateProgressBar() {
    const percentage = getScrollPercentage();
    scrollProgressBar.style.width = `${percentage}%`;

    if (percentage > 2 && percentage < 98) {
      scrollProgress.classList.add('showing');
    } else {
      scrollProgress.classList.remove('showing');
    }

    if (percentage <= 2) {
      document.body.classList.add('at-top');
      document.body.classList.remove('at-bottom');
    } else if (percentage >= 98) {
      document.body.classList.add('at-bottom');
      document.body.classList.remove('at-top');
    } else {
      document.body.classList.remove('at-top', 'at-bottom');
    }
  }

  function showScrollIndicator(direction) {
    clearTimeout(hideIndicatorsTimeout);
    scrollUpIndicator.classList.remove('showing');
    scrollDownIndicator.classList.remove('showing');

    if (direction === 'up') {
      scrollUpIndicator.classList.add('showing');
      scrollDirection = 'up';
    } else {
      scrollDownIndicator.classList.add('showing');
      scrollDirection = 'down';
    }

    clearTimeout(showIndicatorsTimeout);
    showIndicatorsTimeout = setTimeout(() => {
      hideScrollIndicators();
    }, 1500);
  }

  function hideScrollIndicators() {
    scrollUpIndicator.classList.remove('showing');
    scrollDownIndicator.classList.remove('showing');
  }

  function handleScroll() {
    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - lastScrollY;
    const currentTime = Date.now();
    const timeDelta = currentTime - lastScrollTime;

    if (Math.abs(scrollDelta) > 30 && timeDelta > 300) {
      const direction = scrollDelta > 0 ? 'down' : 'up';
      showScrollIndicator(direction);
      lastScrollTime = currentTime;
    }

    lastScrollY = currentScrollY;
    updateProgressBar();
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(handleScroll);
    }
  }

  scrollUpIndicator.addEventListener('click', () => {
    if (window.lenis) {
      window.lenis.scrollTo(0, {
        duration: 1.2,
        easing: (t) => 1 - Math.pow(1 - t, 3)
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    scrollUpIndicator.classList.add('showing');
    setTimeout(() => scrollUpIndicator.classList.remove('showing'), 1000);
  });

  scrollDownIndicator.addEventListener('click', () => {
    const bottom = document.documentElement.scrollHeight - window.innerHeight;
    if (window.lenis) {
      window.lenis.scrollTo(bottom, {
        duration: 1.2,
        easing: (t) => 1 - Math.pow(1 - t, 3)
      });
    } else {
      window.scrollTo({ top: bottom, behavior: 'smooth' });
    }
    scrollDownIndicator.classList.add('showing');
    setTimeout(() => scrollDownIndicator.classList.remove('showing'), 1000);
  });

  updateProgressBar();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('load', () => {
    setTimeout(hideScrollIndicators, 2000);
    updateProgressBar();
  });
  window.addEventListener('resize', updateProgressBar);

  window.scrollGraphics = {
    showUpIndicator: () => showScrollIndicator('up'),
    showDownIndicator: () => showScrollIndicator('down'),
    hideIndicators: hideScrollIndicators,
    updateProgress: updateProgressBar
  };
})();


// =========================
// CARD MOTION GRAPHICS SYSTEM
// =========================
(function initCardMotionGraphics() {
  const config = {
    tiltIntensity: 15,
    floatIntensity: 20,
    glowIntensity: 0.5,
    scrollSensitivity: 0.5,
    mouseSensitivity: 0.5,
    enableParallax: true,
    enableMouseEffects: true,
    enableScrollEffects: true
  };

  let mouseX = 0;
  let mouseY = 0;
  let scrollY = 0;
  let isScrolling = false;
  let scrollTimeout = null;
  let cards = [];
  let mouseFollower = null;

  function init() {
    createMouseFollower();
    setupCards();
    setupEventListeners();
    startAnimationLoop();
  }

  function createMouseFollower() {
    if (!config.enableMouseEffects) return;
    mouseFollower = document.createElement('div');
    mouseFollower.className = 'card-mouse-follower';
    document.body.appendChild(mouseFollower);
  }

  function setupCards() {
    const featureCards = document.querySelectorAll('.featureCard');
    featureCards.forEach((card, index) => {
      cards.push({
        element: card,
        type: 'feature',
        index: index,
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        glow: 0,
        isHovered: false
      });
      card.addEventListener('mouseenter', () => onCardHover(card, true));
      card.addEventListener('mouseleave', () => onCardHover(card, false));
      card.addEventListener('touchstart', () => onCardHover(card, true), { passive: true });
      card.addEventListener('touchend', () => onCardHover(card, false), { passive: true });
    });

    const infraCards = document.querySelectorAll('.infraCard');
    infraCards.forEach((card, index) => {
      cards.push({
        element: card,
        type: 'infra',
        index: index,
        floatY: 0,
        scale: 1,
        brightness: 1,
        blur: 0,
        isHovered: false
      });
      card.addEventListener('mouseenter', () => onCardHover(card, true));
      card.addEventListener('mouseleave', () => onCardHover(card, false));
      card.addEventListener('touchstart', () => onCardHover(card, true), { passive: true });
      card.addEventListener('touchend', () => onCardHover(card, false), { passive: true });
    });
  }

  function setupEventListeners() {
    if (config.enableMouseEffects) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('touchmove', onTouchMove, { passive: true });
      document.querySelectorAll('.scroll-motion-section').forEach(section => {
        section.addEventListener('mousemove', onSectionMouseMove);
      });
    }
    if (config.enableScrollEffects) {
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    window.addEventListener('resize', updateCardPositions);
  }

  function onMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (mouseFollower) {
      mouseFollower.style.left = `${mouseX}px`;
      mouseFollower.style.top = `${mouseY}px`;
    }
  }

  function onTouchMove(e) {
    if (e.touches.length > 0) {
      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
      if (mouseFollower) {
        mouseFollower.style.left = `${mouseX}px`;
        mouseFollower.style.top = `${mouseY}px`;
      }
    }
  }

  function onSectionMouseMove(e) {
    const section = e.currentTarget;
    const rect = section.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    section.style.setProperty('--mouse-x', `${x}%`);
    section.style.setProperty('--mouse-y', `${y}%`);
  }

  function onScroll() {
    scrollY = window.scrollY;
    isScrolling = true;
    if (mouseFollower) mouseFollower.style.opacity = '0.3';
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
      if (mouseFollower) mouseFollower.style.opacity = '0';
    }, 150);
  }

  function onCardHover(card, isHovered) {
    const cardData = cards.find(c => c.element === card);
    if (cardData) {
      cardData.isHovered = isHovered;
      if (mouseFollower) {
        mouseFollower.style.opacity = isHovered ? '0.5' : '0.3';
      }
    }
  }

  function updateCardPositions() {
    cards.forEach(cardData => {
      const card = cardData.element;
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distanceX = mouseX - centerX;
      const distanceY = mouseY - centerY;
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
      const scrollOffset = scrollY * config.scrollSensitivity;

      if (cardData.type === 'feature') {
        let rotationX = 0, rotationY = 0, scale = 1, glow = 0, shadowY = 0;

        if (config.enableMouseEffects && distance < 300) {
          const intensity = 1 - (distance / 300);
          rotationX = (distanceY / rect.height) * config.tiltIntensity * intensity;
          rotationY = (distanceX / rect.width) * -config.tiltIntensity * intensity;
        }
        if (cardData.isHovered) {
          scale = 1.05;
          glow = config.glowIntensity;
          shadowY = -10;
          rotationX *= 1.5;
          rotationY *= 1.5;
        }
        if (config.enableScrollEffects && isScrolling) {
          rotationX += (scrollOffset / 1000) * 5;
        }

        card.style.setProperty('--card-tilt-x', `${rotationX}deg`);
        card.style.setProperty('--card-tilt-y', `${rotationY}deg`);
        card.style.setProperty('--card-scale', scale);
        card.style.setProperty('--card-glow', glow);
        card.style.setProperty('--card-shadow-y', `${shadowY}px`);

        cardData.rotationX = rotationX;
        cardData.rotationY = rotationY;
        cardData.scale = scale;
        cardData.glow = glow;

      } else if (cardData.type === 'infra') {
        let floatY = 0, scale = 1, brightness = 1, blur = 0;

        if (config.enableMouseEffects && distance < 200) {
          const intensity = 1 - (distance / 200);
          floatY = (distanceY / rect.height) * config.floatIntensity * intensity;
        }
        if (cardData.isHovered) {
          scale = 1.05;
          brightness = 1.2;
          floatY *= 1.5;
        }
        if (config.enableScrollEffects && isScrolling) {
          floatY += (scrollOffset / 1000) * 10;
        }

        card.style.setProperty('--card-float-y', `${floatY}px`);
        card.style.setProperty('--card-scale', scale);
        card.style.setProperty('--card-brightness', brightness);
        card.style.setProperty('--card-blur', `${blur}px`);

        cardData.floatY = floatY;
        cardData.scale = scale;
        cardData.brightness = brightness;
        cardData.blur = blur;
      }
    });
  }

  function startAnimationLoop() {
    function animate() {
      updateCardPositions();
      requestAnimationFrame(animate);
    }
    animate();
  }

  document.addEventListener('DOMContentLoaded', init);

  window.cardMotion = {
    updateConfig: (newConfig) => { Object.assign(config, newConfig); },
    enableEffects: (enable) => {
      config.enableMouseEffects = enable;
      config.enableScrollEffects = enable;
      if (mouseFollower) mouseFollower.style.display = enable ? 'block' : 'none';
    },
    getCardState: (cardElement) => cards.find(c => c.element === cardElement)
  };
})();


// =========================
// SCROLL TRIGGER FOR CARD ANIMATIONS
// =========================
(function initCardScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const grid = entry.target;
        grid.classList.add('animate-in');

        const cards = grid.querySelectorAll('.featureCard, .infraCard');
        cards.forEach((card, index) => {
          card.style.animationDelay = `${index * 0.1}s`;
          card.style.animationPlayState = 'running';
        });

        const textElements = grid.parentElement.querySelectorAll('.scroll-text-reveal');
        textElements.forEach((text, index) => {
          setTimeout(() => {
            text.classList.add('animate-in');
          }, index * 200);
        });
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  });

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.scroll-cards-grid').forEach(grid => {
      observer.observe(grid);
    });
  });
})();

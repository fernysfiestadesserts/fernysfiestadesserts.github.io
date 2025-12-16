  // === HERO CAROUSEL CONFIG ===
  // Add your ~23 images here (use any from images/cake_gallery, cookie_gallery, other_gallery)
  
  const HERO_IMAGES = [
    "images/carousel/carousel1.jpeg",
    "images/carousel/carousel2.jpeg",
    "images/carousel/carousel3.jpeg",
    "images/carousel/carousel4.jpeg",
    "images/carousel/carousel5.jpeg",
    "images/carousel/carousel6.jpeg",
    "images/carousel/carousel7.jpeg",
    "images/carousel/carousel8.jpeg",
    "images/carousel/carousel9.jpeg",
    "images/carousel/carousel10.jpeg",
    "images/carousel/carousel11.jpeg",
    "images/carousel/carousel12.jpeg",
    "images/carousel/carousel13.jpeg",
    "images/carousel/carousel14.jpeg",
    "images/carousel/carousel15.jpeg",
    "images/carousel/carousel16.jpeg",
    "images/carousel/carousel17.jpeg",
    "images/carousel/carousel18.jpeg",
    "images/carousel/carousel19.jpeg",
    "images/carousel/carousel20.jpeg",
    "images/carousel/carousel21.jpeg",
    "images/carousel/carousel22.jpeg",
    "images/carousel/carousel23.jpeg",
    "images/carousel/carousel1.jpeg" // repeat first if you want a seamless loop
  ];
  const HERO_INTERVAL_MS = 3000; // 3 seconds

(async () => {
  const urls = HERO_IMAGES.map(p => new URL(p, location.href).href);

  const load = src => new Promise(res => {
    const img = new Image();
    img.onload = () => res({
      src,
      ok: true,
      w: img.naturalWidth,
      h: img.naturalHeight
    });
    img.onerror = () => res({ src, ok: false, w: 0, h: 0 });
    img.src = src;
  });

  const results = await Promise.all(urls.map(load));

  // 1) Log raw results (like before)
  console.table(results);

  const bad = results.filter(r => !r.ok);
  if (bad.length) {
    console.warn("Missing/bad images:", bad.map(b => b.src));
  } else {
    console.log("All hero images load OK.");
  }

  // 2) For the good ones, compute aspect ratio + area
  const good = results.filter(r => r.ok && r.w > 0 && r.h > 0)
    .map(r => ({
      ...r,
      ratio: r.w / r.h,           // >1 = landscape, <1 = portrait
      area: r.w * r.h
    }));

  if (!good.length) return;

  // 3) Compute median aspect ratio + median area
  const byRatio = [...good].sort((a, b) => a.ratio - b.ratio);
  const byArea  = [...good].sort((a, b) => a.area  - b.area);

  const median = arr => {
    const mid = Math.floor(arr.length / 2);
    if (arr.length % 2 === 0) {
      return (arr[mid - 1] + arr[mid]) / 2;
    }
    return arr[mid];
  };

  const medianRatio = median(byRatio.map(x => x.ratio));
  const medianArea  = median(byArea.map(x => x.area));

  // 4) Measure how far each image is from the "typical" one
  good.forEach(g => {
    g.ratioDiff = Math.abs(g.ratio - medianRatio);
    g.areaRatio = g.area / medianArea; // < 1 = smaller than typical
  });

  console.log("=== Hero image metrics (with diffs) ===");
  console.table(good.map(g => ({
    src: g.src,
    w: g.w,
    h: g.h,
    ratio: g.ratio.toFixed(3),
    ratioDiff: g.ratioDiff.toFixed(3),
    areaRatio: g.areaRatio.toFixed(2)
  })));

  // 5) Heuristic: mark "most dissimilar" images
  //    - very different aspect ratio (portrait/square)
  //    - OR much smaller area than the rest
  const CANDIDATES = good
    .filter(g =>
      g.ratioDiff > 0.35  // fairly different shape
      || g.areaRatio < 0.5 // less than half the typical size
    )
    .sort((a, b) => (b.ratioDiff + (1 - b.areaRatio)) - (a.ratioDiff + (1 - a.areaRatio)));

  console.log("=== CANDIDATES TO DELETE (most dissimilar) ===");
  console.table(CANDIDATES.map(c => ({
    src: c.src,
    w: c.w,
    h: c.h,
    ratio: c.ratio.toFixed(3),
    ratioDiff: c.ratioDiff.toFixed(3),
    areaRatio: c.areaRatio.toFixed(2)
  })));

  console.log(
    "Suggested next step: remove these candidate images from HERO_IMAGES if they look odd in the carousel."
  );
})();

document.addEventListener('DOMContentLoaded', () => {
  initMenuToggle();
  initTabs();
  initLightbox();  // uses ff- names to avoid collisions

  initHeroCarousel();

  // Tab -> show the matching section (.cake-menu / .cookies-menu / .other-menu)
    document.querySelectorAll('.menu-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // update tab visual/aria state
        document.querySelectorAll('.menu-tabs .tab-btn').forEach(b => {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
        });

        // hide all sections
        ['.cake-menu', '.cookies-menu', '.other-menu'].forEach(sel => {
        const el = document.querySelector(sel);
        if (el) el.classList.remove('active');
        });

        // show the target section
        const targetSel = btn.dataset.target;
        const target = targetSel ? document.querySelector(targetSel) : null;
        if (target) target.classList.add('active');
    });
    });

});

/* ===== Mobile menu toggle ===== */
function initMenuToggle() {
  const menuToggle = document.querySelector('.menu-icon'); // <a class="menu-icon"><i class='bx bx-menu'></i></a>
  const miniNav = document.querySelector('.nav-list');
  if (!menuToggle || !miniNav) return;

  menuToggle.setAttribute('role', 'button');
  menuToggle.setAttribute('aria-expanded', 'false');

  menuToggle.addEventListener('click', (e) => {
    e.preventDefault(); // prevent "#" jump
    const open = miniNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
}

/* ===== Tabs (Cakes / Cookies / Other) ===== */
function initTabs() {
  const tabs = document.querySelectorAll('.menu-tabs .tab-btn');
  if (!tabs.length) return;

  function activateTab(tab) {
    tabs.forEach(t => {
      const selected = t === tab;
      t.classList.toggle('is-active', selected);
      t.setAttribute('aria-selected', String(selected));
      const id = t.getAttribute('aria-controls');
      const panel = id ? document.getElementById(id) : null;
      if (panel) {
        panel.hidden = !selected;
        panel.classList.toggle('is-active', selected);
      }
    });
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        const next = tabs[(i + dir + tabs.length) % tabs.length];
        next.focus();
        activateTab(next);
      }
    });
  });

  activateTab(document.getElementById('tab-cakes') || tabs[0]);
}

/* ===== Lightbox (namespaced: ff-) ===== */
function initLightbox() {
  // auto-inject markup if missing
  if (!document.querySelector('.ff-lightbox')) {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="ff-lightbox" hidden>
        <div class="ff-backdrop"></div>
        <div class="ff-modal" role="dialog" aria-modal="true" aria-label="Image preview">
          <button class="ff-close" aria-label="Close preview">×</button>
          <img id="ff-lightbox-img" alt="Expanded dessert image">
        </div>
      </div>`;
    document.body.appendChild(wrap.firstElementChild);
  }

  const overlay  = document.querySelector('.ff-lightbox');
  const backdrop = document.querySelector('.ff-backdrop');
  const modalImg = document.getElementById('ff-lightbox-img');
  const closeBtn = document.querySelector('.ff-close');

  const open = (src) => { if (src) { modalImg.src = src; overlay.hidden = false; } };
  const close = () => { overlay.hidden = true; modalImg.src = ''; };

  document.addEventListener('click', (e) => {
    const card = e.target.closest('.menu-card');
    if (!card) return;
    if (card.tagName === 'A') e.preventDefault(); // stop "#" jump
    const src = card.dataset.full || card.querySelector('img')?.src;
    open(src);
  });

  backdrop.addEventListener('click', close);
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

// === Smart-fit helpers: keep subjects visible and avoid tiny images
function computeBoostScale(nw, nh, heroW, heroH, targetCoverage = 0.9, maxScale = 1.6) {
  // Scale so the image covers at least targetCoverage of the hero in BOTH dimensions
  const needW = (heroW * targetCoverage) / nw;
  const needH = (heroH * targetCoverage) / nh;
  const scale = Math.max(1, Math.min(maxScale, Math.max(needW, needH)));
  return scale;
}

function applySmartFit(slide, img, hero) {
  const heroW = hero.clientWidth || 1200;
  const heroH = hero.clientHeight || 600;

  // Decide if aspect ratio is "extreme" (portrait/square or extra-wide)
  const ratio = img.naturalWidth / img.naturalHeight; // >1 = landscape
  const isExtreme = (ratio < 0.9 || ratio > 1.6);
  slide.classList.toggle('alt-fit', isExtreme); // your CSS uses alt-fit => contain + blurred bg

  // Compute a tasteful scale-up for physically small originals (cap at 1.6x)
  const scale = computeBoostScale(img.naturalWidth, img.naturalHeight, heroW, heroH, 0.9, 1.6);
  img.style.transform = scale > 1.01 ? `scale(${scale})` : 'none';
  img.style.transformOrigin = 'center center';
}

function initHeroCarousel() {
  const container = document.querySelector(".hero-carousel");
  const hero = document.querySelector(".hero");
  if (!container || !hero || !Array.isArray(HERO_IMAGES) || HERO_IMAGES.length === 0) return;

  // 1) Build slides as background DIVs (no <img> tags = no height:auto conflicts)
  container.innerHTML = "";
  const slides = HERO_IMAGES.map((src, i) => {
    const slide = document.createElement("div");
    slide.className = "hero-slide" + (i === 0 ? " is-active" : "");
    slide.style.backgroundImage = `url("${src}")`;
    // a subtle brand fallback so you never see pure white while decoding
    slide.style.backgroundColor = "#903716";
    container.appendChild(slide);
    return slide;
  });

  // If nothing got added (bad paths), bail safely
  if (!slides.length) return;

  // 2) A11y labels
  hero.setAttribute("tabindex", "0");
  hero.setAttribute("aria-roledescription", "carousel");
  hero.setAttribute("aria-label", "Featured desserts");
  container.setAttribute("aria-live", "polite");

  // 3) Arrows (no HTML change needed)
  const leftBtn = document.createElement("button");
  leftBtn.className = "hero-arrow hero-arrow--left";
  leftBtn.type = "button";
  leftBtn.setAttribute("aria-label", "Previous slide");
  leftBtn.innerHTML = "&#10094;"; // ‹

  const rightBtn = document.createElement("button");
  rightBtn.className = "hero-arrow hero-arrow--right";
  rightBtn.type = "button";
  rightBtn.setAttribute("aria-label", "Next slide");
  rightBtn.innerHTML = "&#10095;"; // ›

  hero.appendChild(leftBtn);
  hero.appendChild(rightBtn);

  // 4) Carousel state
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let index = 0;
  let timer = null;

  const show = (i) => {
    slides[index].classList.remove("is-active");
    index = (i + slides.length) % slides.length;
    slides[index].classList.add("is-active");
  };

  const next = () => show(index + 1);
  const prev = () => show(index - 1);

  const stop = () => { if (timer) clearInterval(timer); timer = null; };
  const start = () => {
    if (prefersReduced) return;
    stop();
    timer = setInterval(next, HERO_INTERVAL_MS);
  };

  // 5) Controls
  leftBtn.addEventListener("click", () => { prev(); start(); });
  rightBtn.addEventListener("click", () => { next(); start(); });

  hero.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); prev(); start(); }
    if (e.key === "ArrowRight") { e.preventDefault(); next(); start(); }
  });

  hero.addEventListener("mouseenter", stop);
  hero.addEventListener("mouseleave", start);

  // Touch swipe
  let touchX = 0, touchY = 0, swiping = false;
  hero.addEventListener("touchstart", (e) => {
    if (!e.touches || !e.touches.length) return;
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
    swiping = true;
    stop();
  }, { passive: true });

  hero.addEventListener("touchend", (e) => {
    if (!swiping) return;
    const endX = (e.changedTouches && e.changedTouches[0].clientX) || touchX;
    const endY = (e.changedTouches && e.changedTouches[0].clientY) || touchY;
    const dx = endX - touchX, dy = endY - touchY;
    const H_THRESHOLD = 50;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > H_THRESHOLD) {
      if (dx < 0) next(); else prev();
    }
    swiping = false;
    start();
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop(); else start();
  });

  // 6) Go!
  start();
}

// 

const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImage');
const closeBtn = document.querySelector('.modal-close');

document.querySelectorAll('.clickable-image').forEach(img => {
  img.addEventListener('click', () => {
    modalImg.src = img.src;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
});

closeBtn.addEventListener('click', () => {
  modal.classList.remove('active');
  document.body.style.overflow = '';
});

modal.addEventListener('click', e => {
  if (e.target === modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
});

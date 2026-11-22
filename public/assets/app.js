/* ==========================================================================
   Ananya Digital Studio — Production Multi-Page Web Application
   Live-wired to same-origin hidden Cloudflare Worker + D1 API (/api/v1/*).
   Routes: #/ (Home), #/gallery, #/about, #/plans, #/booking, #/admin, * (404)
   ========================================================================== */

import { mountApertureStage3D } from './scene3d.js?v=3';

const FALLBACK_DATA = {
  studio: {
    name: 'Ananya Digital Studio',
    city: 'Awas Vikas Colony, Farrukhabad, UP',
    whatsapp: '917266838737',
    phone: '+91 72668 38737',
    hours: 'Daily · 10:00 AM to 8:30 PM',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Ananya+Digital+studio+Awas+Vikas+Colony+Farrukhabad'
  },
  offer: {
    active: true,
    title: 'Wedding Season Offer',
    percent: 15,
    note: 'Flat 15% off on Full Wedding & Pre-Wedding packages booked this month',
    validTill: '31 Dec 2026'
  },
  trendingPlanId: 'wedding-signature',
  plans: [
    {
      id: 'pre-wedding-editorial',
      name: 'Portrait & Pre-Wedding Shoot',
      tagline: 'One full outdoor day for couples who want natural, unhurried portraits and a short film.',
      price: 14999,
      duration: '1 Full Day (6–8 Hours)',
      team: '1 Candid Photographer + 1 Cinematographer',
      deliverables: [
        '60 color-graded high-resolution photographs',
        '2 to 3 minute cinematic pre-wedding film',
        '2 vertical reels edited for WhatsApp & Instagram',
        'Private online cloud gallery delivered in 10 days'
      ],
      views: 0,
      bookings: 0
    },
    {
      id: 'haldi-sangeet-pack',
      name: 'Haldi, Mehendi & Sangeet',
      tagline: 'Bright daytime documentary work paired with clean low-light coverage for your evening dance floor.',
      price: 24999,
      duration: '2 Functions (Day + Evening)',
      team: '2 Photographers + 1 Video Camera',
      deliverables: [
        '250+ edited candid and family photographs',
        'Full HD event video + 3-minute Sangeet highlight',
        'Natural daylight & low-light lens kit included',
        'Online gallery + pendrive delivery within 14 days'
      ],
      views: 0,
      bookings: 0
    },
    {
      id: 'wedding-signature',
      name: 'Complete Wedding Signature',
      tagline: 'Our complete two-day wedding and reception package built for Farrukhabad families.',
      price: 49999,
      duration: '2 Days (Wedding + Reception)',
      team: '4-Member Crew (Candid, Traditional, Cinema + Drone)',
      deliverables: [
        'Unlimited photos with 500+ hand-edited signature frames',
        '40-sheet archival matte linen album (12x36 lay-flat)',
        '4-minute cinematic wedding teaser + full traditional film',
        '4K drone aerial coverage for Baraat and venue',
        'Private family cloud link + wooden keepsake USB'
      ],
      views: 0,
      bookings: 0
    },
    {
      id: 'royal-multi-day',
      name: 'Royal Multi-Day Collection',
      tagline: 'End-to-end documentation across Pre-Wedding, Haldi, Sangeet, Wedding, and Reception.',
      price: 79999,
      duration: '3 Days + Outdoor Pre-Wedding Day',
      team: '6-Member Senior Crew (Dual Candid + Dual Cinema + Drone)',
      deliverables: [
        'Complete pre-wedding shoot plus all wedding ceremonies',
        'Two 50-sheet archival linen albums (Bride & Groom sets)',
        'Same-day highlight edit ready to screen at Reception',
        'Drone aerial shots + multi-angle audio for vows & speeches',
        'Priority 18-day turnaround with full RAW backup archive'
      ],
      views: 0,
      bookings: 0
    }
  ],
  media: [
    { id: 'hero-1', slot: 'home_hero', category: 'Wedding', title: 'Twilight Mandap Ceremony', location: 'Wedding · 35mm Prime', src: '/assets/photos/01-hero-mandap.webp', wide: true },
    { id: 'hero-2', slot: 'home_hero', category: 'Pre-Wedding', title: 'Heritage Haveli Walk', location: 'Pre-Wedding · Golden Hour', src: '/assets/photos/04-prewed-arches.webp', wide: true },
    { id: 'hero-3', slot: 'home_hero', category: 'Portraits', title: 'Bridal Window Portrait', location: 'Portraits · 85mm Prime', src: '/assets/photos/08-portrait-bridal.webp', wide: false },
    { id: 'hero-4', slot: 'home_hero', category: 'Events', title: 'Candlelit Reception', location: 'Events · Evening Cinema', src: '/assets/photos/09-event-reception.webp', wide: true },
    { id: 'home-portrait-main', slot: 'home_portrait', category: 'Portraits', title: 'Quiet Window Bridal Study', location: 'Editorial Bridal Portrait · 85mm', src: '/assets/photos/08-portrait-bridal.webp', wide: false },
    { id: 'about-craft-main', slot: 'about_craft', category: 'Studio', title: 'Ananya Studio Darkroom & Gear', location: 'Awas Vikas Colony, Farrukhabad', src: '/assets/photos/10-studio-craft.webp', wide: true },
    { id: 'gal-1', slot: 'gallery', category: 'Wedding', title: 'Twilight Courtyard Varmala', location: 'Heritage Courtyard · Dusk', src: '/assets/photos/01-hero-mandap.webp', wide: true },
    { id: 'gal-2', slot: 'gallery', category: 'Wedding', title: 'Around the Sacred Fire', location: 'Mandap Ceremony · 50mm Prime', src: '/assets/photos/02-wedding-pheras.webp', wide: false },
    { id: 'gal-3', slot: 'gallery', category: 'Wedding', title: 'Under the Jasmine Chadar', location: 'Bridal Procession · Natural Light', src: '/assets/photos/03-wedding-entry.webp', wide: true },
    { id: 'gal-4', slot: 'gallery', category: 'Pre-Wedding', title: 'Golden Hour Colonnade', location: 'Sandstone Haveli · Sunset', src: '/assets/photos/04-prewed-arches.webp', wide: true },
    { id: 'gal-5', slot: 'gallery', category: 'Pre-Wedding', title: 'Quiet Steps by the River', location: 'River Ghat · Dusk Portraits', src: '/assets/photos/05-prewed-ghat.webp', wide: false },
    { id: 'gal-6', slot: 'gallery', category: 'Candid', title: 'Marigold Morning Haldi', location: 'Family Courtyard · Daylight', src: '/assets/photos/06-candid-haldi.webp', wide: false },
    { id: 'gal-7', slot: 'gallery', category: 'Candid', title: 'First Dance Under Warm Lights', location: 'Sangeet Evening · Low-Light Cinema', src: '/assets/photos/07-candid-sangeet.webp', wide: false },
    { id: 'gal-8', slot: 'gallery', category: 'Portraits', title: 'Quiet Window Bridal Study', location: 'Bridal Getting Ready · 85mm Prime', src: '/assets/photos/08-portrait-bridal.webp', wide: false },
    { id: 'gal-9', slot: 'gallery', category: 'Events', title: 'Candlelit Reception Courtyard', location: 'Evening Reception · Architectural Wide', src: '/assets/photos/09-event-reception.webp', wide: true }
  ]
};

const SHIFTS = [
  { id: 'Morning', label: 'Morning', range: '7:00 AM – 1:00 PM', defaultTime: '09:30' },
  { id: 'Afternoon', label: 'Afternoon', range: '1:00 PM – 6:00 PM', defaultTime: '14:00' },
  { id: 'Evening / Night', label: 'Evening / Night', range: '6:00 PM – 12:00 AM', defaultTime: '19:00' },
  { id: 'Full Day', label: 'Full Day', range: 'All Day Functions', defaultTime: '10:00' }
];

const PAGE_ORDER = ['/', '/gallery', '/about', '/plans', '/booking', '/admin'];

let siteData = structuredClone ? structuredClone(FALLBACK_DATA) : JSON.parse(JSON.stringify(FALLBACK_DATA));

/* ---------- Live Server Bootstrap & Analytics Hooks ---------- */
async function syncFromServer() {
  try {
    const res = await fetch('/api/v1/bootstrap', { credentials: 'same-origin', cache: 'no-store' });
    if (!res.ok) return false;
    const data = await res.json();
    if (data && Array.isArray(data.plans) && data.plans.length) {
      siteData = {
        studio: { ...FALLBACK_DATA.studio, ...(data.studio || {}) },
        offer: { ...FALLBACK_DATA.offer, ...(data.offer || {}) },
        plans: data.plans,
        media: Array.isArray(data.media) && data.media.length ? data.media : FALLBACK_DATA.media,
        trendingPlanId: data.trendingPlanId || data.plans[0].id
      };
      updateOfferIndicator();
      return true;
    }
  } catch (_) {}
  return false;
}

function updateOfferIndicator() {
  const dot = document.getElementById('nav-offer-dot');
  const label = document.getElementById('nav-plans-label');
  if (dot) dot.style.display = siteData.offer && siteData.offer.active ? '' : 'none';
  if (label) label.textContent = siteData.offer && siteData.offer.active ? `Plans · ${siteData.offer.percent}% Off` : 'Studio Plans';
}

function trackPlanPulse(planId) {
  if (!planId) return;
  const key = 'ananya_pulse_' + planId;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1');
  fetch('/api/v1/pulse', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId }),
    keepalive: true
  }).catch(() => {});
}

function sendBookingRecord(payload) {
  fetch('/api/v1/book', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true
  }).catch(() => {});
}

/* ---------- Media Slot Selectors (Always Non-Empty) ---------- */
function getHeroFrames() {
  const list = siteData.media.filter((m) => m.slot === 'home_hero');
  return list.length ? list : FALLBACK_DATA.media.filter((m) => m.slot === 'home_hero');
}

function getGalleryItems() {
  const list = siteData.media.filter((m) => m.slot === 'gallery');
  return list.length ? list : FALLBACK_DATA.media.filter((m) => m.slot === 'gallery');
}

function getSlotPhoto(slotName, fallbackSrc) {
  const found = siteData.media.find((m) => m.slot === slotName);
  return found || { src: fallbackSrc, title: 'Ananya Digital Studio', location: 'Farrukhabad' };
}

/* ---------- Formatting Helpers ---------- */
function formatINR(amount) {
  return '₹' + Math.round(Number(amount || 0)).toLocaleString('en-IN');
}

function getPlanPricing(plan) {
  const base = Number(plan.price || 0);
  const off = siteData.offer;
  if (off && off.active && Number(off.percent) > 0) {
    const finalPrice = Math.round((base * (100 - Number(off.percent))) / 100);
    return { base, finalPrice, savings: base - finalPrice, hasOffer: true, percent: Number(off.percent) };
  }
  return { base, finalPrice: base, savings: 0, hasOffer: false, percent: 0 };
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function splitWordsMarkup(text) {
  return text
    .split(' ')
    .map((w, i) => `<span class="at-word" aria-hidden="true"><span style="--wd:${i * 42}ms">${escapeHtml(w)}</span></span>`)
    .join('');
}

function formatDateNice(iso) {
  if (!iso) return 'Not selected yet';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime12h(hhmm) {
  if (!hhmm || !hhmm.includes(':')) return 'Flexible';
  const [hStr, mStr] = hhmm.split(':');
  let h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return hhmm;
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mStr} ${suffix}`;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ---------- Fullscreen Lightbox ---------- */
const lightboxEl = document.getElementById('lightbox');
const lbImg = document.getElementById('lb-img');
const lbTitle = document.getElementById('lb-title');
const lbMeta = document.getElementById('lb-meta');
const lbCounter = document.getElementById('lb-counter');
const lbClose = document.getElementById('lb-close');
const lbPrev = document.getElementById('lb-prev');
const lbNext = document.getElementById('lb-next');
const lbBook = document.getElementById('lb-book');

let lbItems = [];
let lbIndex = 0;
let lbTouchX = 0;

function renderLightboxFrame() {
  const item = lbItems[lbIndex];
  if (!item) return;
  lbImg.src = item.src;
  lbImg.alt = item.title;
  lbTitle.textContent = item.title;
  lbMeta.textContent = item.location || item.category || '';
  lbCounter.textContent = `${String(lbIndex + 1).padStart(2, '0')} / ${String(lbItems.length).padStart(2, '0')}`;
}

function openLightbox(items, startIdx = 0) {
  if (!items || !items.length) return;
  lbItems = items;
  lbIndex = Math.max(0, Math.min(startIdx, items.length - 1));
  renderLightboxFrame();
  lightboxEl.classList.add('is-open');
  lightboxEl.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  lbClose.focus();
}

function closeLightbox() {
  lightboxEl.classList.remove('is-open');
  lightboxEl.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function stepLightbox(delta) {
  if (!lbItems.length) return;
  lbIndex = (lbIndex + delta + lbItems.length) % lbItems.length;
  renderLightboxFrame();
}

lbClose.addEventListener('click', closeLightbox);
lbPrev.addEventListener('click', () => stepLightbox(-1));
lbNext.addEventListener('click', () => stepLightbox(1));
lbBook.addEventListener('click', () => {
  closeLightbox();
  navigate('/booking');
});
lightboxEl.addEventListener('click', (e) => {
  if (e.target === lightboxEl) closeLightbox();
});
lightboxEl.addEventListener('touchstart', (e) => {
  if (e.touches && e.touches[0]) lbTouchX = e.touches[0].clientX;
}, { passive: true });
lightboxEl.addEventListener('touchend', (e) => {
  if (!e.changedTouches || !e.changedTouches[0]) return;
  const dx = e.changedTouches[0].clientX - lbTouchX;
  if (Math.abs(dx) > 48) stepLightbox(dx < 0 ? 1 : -1);
}, { passive: true });
window.addEventListener('keydown', (e) => {
  if (!lightboxEl.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeLightbox();
  else if (e.key === 'ArrowRight') stepLightbox(1);
  else if (e.key === 'ArrowLeft') stepLightbox(-1);
});

/* ---------- Mobile Drawer ---------- */
const drawer = document.getElementById('mobile-drawer');
const drawerBackdrop = document.getElementById('drawer-backdrop');
const menuToggle = document.getElementById('menu-toggle');
const drawerClose = document.getElementById('drawer-close');

function setDrawer(open) {
  drawer.classList.toggle('is-open', open);
  drawerBackdrop.classList.toggle('is-open', open);
  drawer.setAttribute('aria-hidden', String(!open));
  menuToggle.setAttribute('aria-expanded', String(open));
}

menuToggle.addEventListener('click', () => setDrawer(!drawer.classList.contains('is-open')));
drawerClose.addEventListener('click', () => setDrawer(false));
drawerBackdrop.addEventListener('click', () => setDrawer(false));

/* ---------- Dual Reveal Safety Net + Scroll-Scrubbed Copy ---------- */
function setupMotion(rootEl) {
  const reveals = Array.from(rootEl.querySelectorAll('.reveal'));
  const scrubs = Array.from(rootEl.querySelectorAll('.at-scrub'));

  const updateScrollMotion = () => {
    const vh = window.innerHeight || 800;
    for (const el of reveals) {
      if (el.classList.contains('is-in')) continue;
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.96 && r.bottom > 0) el.classList.add('is-in');
    }
    for (const el of scrubs) {
      const r = el.getBoundingClientRect();
      const prog = Math.max(0, Math.min(1, (vh * 0.92 - r.top) / (vh * 0.42)));
      el.style.setProperty('--scrub', prog.toFixed(3));
    }
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.02 }
  );
  for (const el of reveals) io.observe(el);
  requestAnimationFrame(updateScrollMotion);

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      updateScrollMotion();
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  return () => {
    io.disconnect();
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
}

/* ==========================================================================
   PAGE 1: HOME (#/)
   ========================================================================== */
function renderHomePage() {
  const { studio, offer, plans, trendingPlanId } = siteData;
  const heroFrames = getHeroFrames();
  const gallery = getGalleryItems();
  const homePortrait = getSlotPhoto('home_portrait', '/assets/photos/08-portrait-bridal.webp');
  const cfItems = gallery.slice(0, Math.min(6, gallery.length));

  const offerRibbon = offer.active
    ? `<div class="offer-ribbon">
         <div class="offer-ribbon-inner">
           <div class="offer-ribbon-main">
             <span class="offer-pill-tag">${escapeHtml(offer.title)} · ${offer.percent}% Off</span>
             <span>${escapeHtml(offer.note)}</span>
           </div>
           <a class="offer-ribbon-link" href="#/plans">See Offer Prices</a>
         </div>
       </div>`
    : '';

  const coverflowSlides = cfItems
    .map(
      (item, idx) => `
      <article class="cf-slide" data-cf-idx="${idx}">
        <div class="cf-card">
          <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.title)}" loading="${idx < 2 ? 'eager' : 'lazy'}" />
          <div class="cf-overlay">
            <div class="cf-meta">
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.category)} · ${escapeHtml(item.location)}</p>
            </div>
            <button type="button" class="cf-expand" data-expand-idx="${idx}" aria-label="Open ${escapeHtml(item.title)} fullscreen">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
            </button>
          </div>
        </div>
      </article>`
    )
    .join('');

  const cfDots = cfItems
    .map(
      (_, idx) => `
      <button type="button" class="cf-dot ${idx === 0 ? 'is-active' : ''}" data-cf-dot="${idx}" aria-label="Go to slide ${idx + 1}">
        <span class="cf-dot-fill"></span>
      </button>`
    )
    .join('');

  const planTeasers = plans
    .map((plan) => {
      const { base, finalPrice, savings, hasOffer } = getPlanPricing(plan);
      const isTrend = plan.id === trendingPlanId;
      return `
        <article class="plan-card reveal ${isTrend ? 'is-trending' : ''}">
          <div>
            <div class="plan-badges">
              ${isTrend ? '<span class="badge-trending">Most Trending Plan</span>' : `<span class="badge-views">${escapeHtml(plan.duration)}</span>`}
              <span class="badge-views">${escapeHtml(plan.team.split('(')[0].trim())}</span>
            </div>
            <h3>${escapeHtml(plan.name)}</h3>
            <p class="plan-desc">${escapeHtml(plan.tagline)}</p>
            <div class="plan-price-row">
              <span class="price-final">${formatINR(finalPrice)}</span>
              ${hasOffer ? `<span class="price-old">${formatINR(base)}</span><span class="price-save">Save ${formatINR(savings)}</span>` : ''}
            </div>
            <ul class="plan-features">
              ${plan.deliverables.slice(0, 3).map((d) => `<li>${escapeHtml(d)}</li>`).join('')}
            </ul>
          </div>
          <div class="plan-card-actions">
            <a class="btn btn-brass" href="#/booking?plan=${encodeURIComponent(plan.id)}">Book This Plan</a>
            <a class="btn btn-ghost-dark" href="#/plans">Full Details</a>
          </div>
        </article>`;
    })
    .join('');

  return `
    ${offerRibbon}
    <section class="hero-darkroom">
      <div class="hero-backdrop-wash" aria-hidden="true"></div>
      <div class="container hero-grid">
        <div class="hero-copy">
          <div class="hero-location">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>${escapeHtml(studio.city)}</span>
          </div>
          <h1 class="display-xl" aria-label="Weddings photographed with quiet honesty.">
            ${splitWordsMarkup('Weddings photographed with quiet honesty.')}
          </h1>
          <p class="lead-copy">
            ${escapeHtml(studio.name)} documents weddings, pre-weddings, and family celebrations across Farrukhabad and Uttar Pradesh—with true skin tones, steady cinema framing, and archival matte albums built to last decades.
          </p>
          <div class="hero-cta-row">
            <a class="btn btn-brass" href="#/booking">Book Your Date</a>
            <a class="btn btn-ghost-dark" href="#/plans">Compare Plans</a>
            <a class="btn btn-ghost-dark" href="#/gallery">View Gallery</a>
          </div>
          <div class="hero-facts">
            <div class="hero-fact">
              <strong>320+</strong>
              <span>Weddings covered</span>
            </div>
            <div class="hero-fact">
              <strong>15 Days</strong>
              <span>First gallery delivery</span>
            </div>
            <div class="hero-fact">
              <strong>4K Cinema</strong>
              <span>Prime lenses &amp; drone</span>
            </div>
          </div>
        </div>

        <div class="stage-card" id="hero-stage-card">
          <img id="hero-fallback-img" class="stage-photo-fallback" src="${escapeHtml(heroFrames[0].src)}" alt="${escapeHtml(heroFrames[0].title)}" />
          <div id="hero-3d-host" class="stage-canvas-host" aria-label="Interactive 3D camera aperture and gallery frame — drag horizontally to tilt"></div>
          <div class="stage-vignette" aria-hidden="true"></div>

          <div class="stage-top-bar">
            <div class="glass-segment" role="group" aria-label="Display mode">
              <button type="button" class="glass-seg-btn is-active" id="mode-3d-btn">3D Lens</button>
              <button type="button" class="glass-seg-btn" id="mode-photo-btn">Photo</button>
            </div>
            <button type="button" class="stage-icon-btn" id="stage-pause-btn">Pause</button>
          </div>

          <div class="stage-bottom-bar">
            <div class="stage-caption">
              <strong id="stage-frame-title">${escapeHtml(heroFrames[0].title)}</strong>
              <span id="stage-frame-meta">${escapeHtml(heroFrames[0].location)} · Drag to tilt</span>
            </div>
            <div class="stage-frame-dots" aria-label="Switch studio frame">
              ${heroFrames
                .slice(0, 5)
                .map(
                  (f, i) => `<button type="button" class="stage-dot ${i === 0 ? 'is-active' : ''}" data-hero-frame="${i}" aria-label="Show ${escapeHtml(f.title)}"><img src="${escapeHtml(f.src)}" alt="" /></button>`
                )
                .join('')}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="lifted-sheet">
      <div class="container">
        <div class="chapter-rail">
          <span>Selected Wedding Stories</span>
          <span>Swipe or drag the reel · Tap expand for fullscreen</span>
        </div>
        <div class="chapter-head reveal">
          <div>
            <h2 class="display-lg">Frames from recent celebrations</h2>
            <p class="at-scrub">From twilight courtyard varmalas to sunlit Haldi mornings, every gallery balances unposed family warmth with clean portraits.</p>
          </div>
          <a class="btn btn-ghost-light" href="#/gallery">Open Full Gallery</a>
        </div>

        <div class="coverflow-wrap">
          <div class="coverflow-track" id="cf-track">${coverflowSlides}</div>
          <div class="cf-controls">
            <div class="cf-dots" id="cf-dots">${cfDots}</div>
            <div class="cf-nav-btns">
              <button type="button" class="icon-circle-btn" id="cf-play-btn" aria-label="Pause slideshow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              </button>
              <button type="button" class="icon-circle-btn" id="cf-prev-btn" aria-label="Previous slide">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button type="button" class="icon-circle-btn" id="cf-next-btn" aria-label="Next slide">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="stone-chapter">
      <div class="container editorial-split">
        <div class="portrait-frame reveal">
          <img src="${escapeHtml(homePortrait.src)}" alt="${escapeHtml(homePortrait.title)}" loading="lazy" />
        </div>
        <div class="reveal">
          <h2 class="display-lg">Why Farrukhabad families keep our albums on the center table</h2>
          <p class="lead-copy at-scrub" style="color:var(--muted);margin-top:16px;">
            We never ask you to freeze a smile for ten minutes or flood your mandap with harsh white spotlights. Our crew blends into the family, reads natural light, and delivers clean edits that stay timeless decades from now.
          </p>
          <div class="story-points">
            <div class="story-point">
              <span class="story-num">01</span>
              <div>
                <h3>True-to-life color grading</h3>
                <p>Skin tones, velvet zari embroidery, and marigold warmth stay natural—never over-filtered or harsh.</p>
              </div>
            </div>
            <div class="story-point">
              <span class="story-num">02</span>
              <div>
                <h3>Dual-card backup on every camera</h3>
                <p>Every ceremony frame records to two memory cards simultaneously and backs up to studio drives the same night.</p>
              </div>
            </div>
            <div class="story-point">
              <span class="story-num">03</span>
              <div>
                <h3>Clear pricing before you lock your date</h3>
                <p>Every package states crew size, album sheets, film length, and delivery timeline upfront with zero hidden charges.</p>
              </div>
            </div>
          </div>
          <div class="hero-cta-row">
            <a class="btn btn-primary" href="#/about">Meet Our Studio</a>
            <a class="btn btn-ghost-light" href="#/plans">See All Plans</a>
          </div>
        </div>
      </div>
    </section>

    <section class="dark-chapter">
      <div class="container">
        <div class="chapter-rail">
          <span>Transparent Packages</span>
          <span>${offer.active ? `${offer.percent}% ${escapeHtml(offer.title)} active` : 'Direct studio rates'}</span>
        </div>
        <div class="chapter-head reveal">
          <div>
            <h2 class="display-lg">Packages built around your functions</h2>
            <p>Pick the coverage that fits your schedule—then lock your date directly on WhatsApp in under a minute.</p>
          </div>
          <a class="btn btn-brass" href="#/booking">Reserve a Date</a>
        </div>
        <div class="plans-grid">${planTeasers}</div>
      </div>
    </section>

    <section class="paper-chapter">
      <div class="container">
        <div class="location-grid reveal">
          <div class="info-card">
            <h3>Visit Our Studio</h3>
            <p>${escapeHtml(studio.city)}. Drop in to flip through physical linen wedding albums before you decide.</p>
          </div>
          <div class="info-card">
            <h3>Direct Booking Line</h3>
            <p>${escapeHtml(studio.phone)} · ${escapeHtml(studio.hours)}. Fast WhatsApp date confirmation.</p>
          </div>
          <div class="info-card">
            <h3>Outstation Coverage</h3>
            <p>Available across Farrukhabad, Fatehgarh, Kanpur, Kannauj, Etawah, Agra, and Lucknow.</p>
          </div>
        </div>

        <div class="next-page-bar reveal">
          <div>
            <span style="font-size:0.84rem;color:var(--muted);">Next Page</span>
            <h3 class="display-md">Browse the Full Photo Gallery</h3>
          </div>
          <a class="btn btn-primary" href="#/gallery">Explore Gallery</a>
        </div>
      </div>
    </section>
  `;
}

function hydrateHomePage(rootEl) {
  const cleanups = [];
  const heroFrames = getHeroFrames().slice(0, 5);
  const gallery = getGalleryItems();
  const cfItems = gallery.slice(0, Math.min(6, gallery.length));

  const stageCard = rootEl.querySelector('#hero-stage-card');
  const stageHost = rootEl.querySelector('#hero-3d-host');
  const fallbackImg = rootEl.querySelector('#hero-fallback-img');
  const titleEl = rootEl.querySelector('#stage-frame-title');
  const metaEl = rootEl.querySelector('#stage-frame-meta');
  const btn3d = rootEl.querySelector('#mode-3d-btn');
  const btnPhoto = rootEl.querySelector('#mode-photo-btn');
  const btnPause = rootEl.querySelector('#stage-pause-btn');
  const frameDots = Array.from(rootEl.querySelectorAll('[data-hero-frame]'));

  let stageController = null;
  let is3dMode = true;
  let isPaused = false;
  let unmounted = false;

  const init3D = async () => {
    const ctrl = await mountApertureStage3D(stageHost, heroFrames[0].src, {
      onReady() {
        if (!unmounted && is3dMode) stageCard.classList.add('is-3d-live');
      }
    });
    if (unmounted) {
      ctrl.dispose();
      return;
    }
    stageController = ctrl;
    if (!ctrl.supported) {
      is3dMode = false;
      stageCard.classList.remove('is-3d-live');
      btn3d.classList.remove('is-active');
      btnPhoto.classList.add('is-active');
      btn3d.disabled = true;
      btnPause.style.display = 'none';
    }
  };

  const idleTimer = setTimeout(init3D, 120);
  cleanups.push(() => {
    unmounted = true;
    clearTimeout(idleTimer);
    if (stageController) stageController.dispose();
  });

  const onMode3d = () => {
    if (!stageController || !stageController.supported) return;
    is3dMode = true;
    stageCard.classList.add('is-3d-live');
    stageHost.style.opacity = '1';
    stageHost.style.pointerEvents = 'auto';
    stageController.setPaused(isPaused);
    btn3d.classList.add('is-active');
    btnPhoto.classList.remove('is-active');
    btnPause.style.display = '';
  };

  const onModePhoto = () => {
    is3dMode = false;
    stageCard.classList.remove('is-3d-live');
    stageHost.style.opacity = '0';
    stageHost.style.pointerEvents = 'none';
    if (stageController) stageController.setPaused(true);
    btnPhoto.classList.add('is-active');
    btn3d.classList.remove('is-active');
    btnPause.style.display = 'none';
  };

  const onPauseToggle = () => {
    isPaused = !isPaused;
    btnPause.textContent = isPaused ? 'Play' : 'Pause';
    if (stageController && is3dMode) stageController.setPaused(isPaused);
  };

  btn3d.addEventListener('click', onMode3d);
  btnPhoto.addEventListener('click', onModePhoto);
  btnPause.addEventListener('click', onPauseToggle);
  cleanups.push(() => {
    btn3d.removeEventListener('click', onMode3d);
    btnPhoto.removeEventListener('click', onModePhoto);
    btnPause.removeEventListener('click', onPauseToggle);
  });

  frameDots.forEach((dot, idx) => {
    const handler = () => {
      const f = heroFrames[idx];
      if (!f) return;
      frameDots.forEach((d, j) => d.classList.toggle('is-active', j === idx));
      fallbackImg.src = f.src;
      fallbackImg.alt = f.title;
      titleEl.textContent = f.title;
      metaEl.textContent = `${f.location} · Drag to tilt`;
      if (stageController && stageController.supported) stageController.setPhoto(f.src);
    };
    dot.addEventListener('click', handler);
    cleanups.push(() => dot.removeEventListener('click', handler));
  });

  // 3D Coverflow Carousel
  const track = rootEl.querySelector('#cf-track');
  const slides = Array.from(track.querySelectorAll('.cf-slide'));
  const dots = Array.from(rootEl.querySelectorAll('.cf-dot'));
  const prevBtn = rootEl.querySelector('#cf-prev-btn');
  const nextBtn = rootEl.querySelector('#cf-next-btn');
  const playBtn = rootEl.querySelector('#cf-play-btn');

  let activeIdx = 0;
  let scrollLockUntil = 0;
  let autoPlay = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  let hovering = false;
  let touching = false;
  let inView = true;
  let slideStart = performance.now();
  const SLIDE_MS = 5200;
  let cfRaf = 0;

  function updateCoverflowTransforms() {
    const trackRect = track.getBoundingClientRect();
    const center = trackRect.left + trackRect.width / 2;
    let closest = 0;
    let closestDist = Infinity;

    for (let i = 0; i < slides.length; i++) {
      const r = slides[i].getBoundingClientRect();
      const slideCenter = r.left + r.width / 2;
      const shift = Math.max(-1, Math.min(1, (slideCenter - center) / Math.max(r.width, 1)));
      const absShift = Math.abs(shift);
      slides[i].style.setProperty('--hl-shift', shift.toFixed(4));
      slides[i].style.setProperty('--hl-abs', absShift.toFixed(4));
      if (absShift < closestDist) {
        closestDist = absShift;
        closest = i;
      }
    }
    if (performance.now() > scrollLockUntil && closest !== activeIdx) setActiveDot(closest);
  }

  function setActiveDot(idx) {
    activeIdx = idx;
    slideStart = performance.now();
    dots.forEach((d, i) => {
      d.classList.toggle('is-active', i === idx);
      const fill = d.querySelector('.cf-dot-fill');
      if (fill) fill.style.transform = 'scaleX(0)';
    });
  }

  function goToSlide(idx, smooth = true) {
    if (!slides.length) return;
    const target = (idx + slides.length) % slides.length;
    setActiveDot(target);
    scrollLockUntil = performance.now() + 560;
    const s = slides[target];
    if (s) {
      const left = s.offsetLeft - (track.clientWidth - s.clientWidth) / 2;
      track.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' });
    }
  }

  let dragging = false;
  let dragStartX = 0;
  let dragStartScroll = 0;
  let dragLastX = 0;
  let dragLastTime = 0;
  let dragVelocity = 0;

  const onTrackDown = (e) => {
    if (e.pointerType !== 'mouse' || e.target.closest('button')) return;
    dragging = true;
    track.classList.add('is-dragging');
    dragStartX = e.clientX;
    dragLastX = e.clientX;
    dragLastTime = performance.now();
    dragStartScroll = track.scrollLeft;
    dragVelocity = 0;
  };
  const onTrackMove = (e) => {
    if (!dragging) return;
    const now = performance.now();
    const dt = Math.max(1, now - dragLastTime);
    dragVelocity = (e.clientX - dragLastX) / dt;
    dragLastX = e.clientX;
    dragLastTime = now;
    track.scrollLeft = dragStartScroll - (e.clientX - dragStartX);
  };
  const onTrackUp = () => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('is-dragging');
    if (Math.abs(dragVelocity) > 0.45) goToSlide(activeIdx + (dragVelocity < 0 ? 1 : -1));
  };

  const onTrackScroll = () => updateCoverflowTransforms();
  const onTrackEnter = () => { hovering = true; };
  const onTrackLeave = () => { hovering = false; slideStart = performance.now(); };
  const onTrackTouchStart = () => { touching = true; };
  const onTrackTouchEnd = () => { touching = false; slideStart = performance.now(); };

  track.addEventListener('scroll', onTrackScroll, { passive: true });
  track.addEventListener('pointerdown', onTrackDown);
  window.addEventListener('pointermove', onTrackMove, { passive: true });
  window.addEventListener('pointerup', onTrackUp, { passive: true });
  track.addEventListener('mouseenter', onTrackEnter);
  track.addEventListener('mouseleave', onTrackLeave);
  track.addEventListener('touchstart', onTrackTouchStart, { passive: true });
  track.addEventListener('touchend', onTrackTouchEnd, { passive: true });
  window.addEventListener('resize', updateCoverflowTransforms, { passive: true });

  const onPrev = () => goToSlide(activeIdx - 1);
  const onNext = () => goToSlide(activeIdx + 1);
  const onTogglePlay = () => {
    autoPlay = !autoPlay;
    slideStart = performance.now();
    playBtn.setAttribute('aria-label', autoPlay ? 'Pause slideshow' : 'Play slideshow');
    playBtn.innerHTML = autoPlay
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>';
  };

  prevBtn.addEventListener('click', onPrev);
  nextBtn.addEventListener('click', onNext);
  playBtn.addEventListener('click', onTogglePlay);

  dots.forEach((d, idx) => {
    const h = () => goToSlide(idx);
    d.addEventListener('click', h);
    cleanups.push(() => d.removeEventListener('click', h));
  });

  const expandBtns = Array.from(rootEl.querySelectorAll('[data-expand-idx]'));
  expandBtns.forEach((btn) => {
    const h = () => openLightbox(cfItems, Number(btn.dataset.expandIdx));
    btn.addEventListener('click', h);
    cleanups.push(() => btn.removeEventListener('click', h));
  });

  const cfIo = new IntersectionObserver((entries) => {
    inView = !!(entries[0] && entries[0].isIntersecting);
    if (inView) slideStart = performance.now();
  }, { threshold: 0.15 });
  cfIo.observe(track);

  function cfLoop(now) {
    cfRaf = requestAnimationFrame(cfLoop);
    const activeFill = dots[activeIdx] && dots[activeIdx].querySelector('.cf-dot-fill');
    if (autoPlay && !hovering && !touching && !dragging && inView && !document.hidden) {
      const progress = Math.min(1, (now - slideStart) / SLIDE_MS);
      if (activeFill) activeFill.style.transform = `scaleX(${progress.toFixed(4)})`;
      if (progress >= 1) goToSlide(activeIdx + 1);
    } else {
      slideStart = now;
    }
  }
  cfRaf = requestAnimationFrame(cfLoop);
  requestAnimationFrame(updateCoverflowTransforms);

  cleanups.push(() => {
    cancelAnimationFrame(cfRaf);
    cfIo.disconnect();
    track.removeEventListener('scroll', onTrackScroll);
    track.removeEventListener('pointerdown', onTrackDown);
    window.removeEventListener('pointermove', onTrackMove);
    window.removeEventListener('pointerup', onTrackUp);
    track.removeEventListener('mouseenter', onTrackEnter);
    track.removeEventListener('mouseleave', onTrackLeave);
    track.removeEventListener('touchstart', onTrackTouchStart);
    track.removeEventListener('touchend', onTrackTouchEnd);
    window.removeEventListener('resize', updateCoverflowTransforms);
    prevBtn.removeEventListener('click', onPrev);
    nextBtn.removeEventListener('click', onNext);
    playBtn.removeEventListener('click', onTogglePlay);
  });

  return () => cleanups.forEach((fn) => fn());
}

/* ==========================================================================
   PAGE 2: PHOTO GALLERY (#/gallery)
   ========================================================================== */
function renderGalleryPage() {
  const gallery = getGalleryItems();
  const presentCats = Array.from(new Set(gallery.map((g) => g.category)));
  const categories = ['All', ...presentCats];
  const headerPhoto = gallery[2] || gallery[0];

  return `
    <section class="sub-hero">
      <img class="sub-hero-bg" src="${escapeHtml(headerPhoto.src)}" alt="" />
      <div class="sub-hero-scrim" aria-hidden="true"></div>
      <div class="container sub-hero-inner">
        <h1 class="display-xl" aria-label="Studio Photo Gallery">${splitWordsMarkup('Studio Photo Gallery')}</h1>
        <p class="lead-copy">
          Weddings, pre-wedding walks, sunlit Haldi mornings, Sangeet nights, and quiet bridal portraits captured by Ananya Digital Studio.
        </p>
      </div>
    </section>

    <section class="lifted-sheet">
      <div class="container">
        <div class="filter-rail-wrap">
          <div class="segmented-control" id="gallery-filter" role="tablist" aria-label="Filter gallery by category">
            <span class="seg-indicator" id="seg-indicator" aria-hidden="true"></span>
            ${categories
              .map(
                (cat, idx) => `<button type="button" role="tab" aria-selected="${idx === 0}" class="seg-btn ${idx === 0 ? 'is-active' : ''}" data-cat="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`
              )
              .join('')}
          </div>
          <span id="gallery-count" style="font-size:0.88rem;color:var(--muted);">Showing ${gallery.length} frames</span>
        </div>

        <div class="spotlight-box reveal" id="spotlight-box">
          <div class="spotlight-stage" id="spotlight-stage">
            <img class="spotlight-img" id="spotlight-img" src="${escapeHtml(gallery[0].src)}" alt="${escapeHtml(gallery[0].title)}" />
          </div>
          <div class="spotlight-bar">
            <div>
              <strong id="spotlight-title" style="font-family:var(--font-display);font-size:1.5rem;font-weight:500;">${escapeHtml(gallery[0].title)}</strong>
              <div id="spotlight-meta" style="font-size:0.86rem;color:var(--silver);">${escapeHtml(gallery[0].category)} · ${escapeHtml(gallery[0].location)}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <button type="button" class="stage-icon-btn" id="spot-prev">Prev</button>
              <button type="button" class="stage-icon-btn" id="spot-next">Next</button>
              <button type="button" class="btn btn-brass" style="min-height:40px;padding:0 16px;font-size:0.84rem;" id="spot-expand">Fullscreen</button>
            </div>
          </div>
          <div class="thumb-strip" id="thumb-strip"></div>
        </div>

        <div class="gallery-grid" id="gallery-grid"></div>

        <div class="next-page-bar reveal">
          <div>
            <span style="font-size:0.84rem;color:var(--muted);">Next Page</span>
            <h3 class="display-md">Learn About Our Crew &amp; Camera Craft</h3>
          </div>
          <a class="btn btn-primary" href="#/about">About Ananya Studio</a>
        </div>
      </div>
    </section>
  `;
}

function hydrateGalleryPage(rootEl) {
  const gallery = getGalleryItems();
  const filterWrap = rootEl.querySelector('#gallery-filter');
  const segBtns = Array.from(filterWrap.querySelectorAll('.seg-btn'));
  const indicator = rootEl.querySelector('#seg-indicator');
  const countEl = rootEl.querySelector('#gallery-count');
  const gridEl = rootEl.querySelector('#gallery-grid');

  const spotStage = rootEl.querySelector('#spotlight-stage');
  const spotTitle = rootEl.querySelector('#spotlight-title');
  const spotMeta = rootEl.querySelector('#spotlight-meta');
  const spotPrev = rootEl.querySelector('#spot-prev');
  const spotNext = rootEl.querySelector('#spot-next');
  const spotExpand = rootEl.querySelector('#spot-expand');
  const thumbStrip = rootEl.querySelector('#thumb-strip');

  let activeCat = 'All';
  let filtered = [...gallery];
  let spotIdx = 0;
  let touchStartX = 0;

  function positionIndicator() {
    const active = filterWrap.querySelector('.seg-btn.is-active');
    if (!active) return;
    indicator.style.width = `${active.offsetWidth}px`;
    indicator.style.transform = `translateX(${active.offsetLeft}px)`;
  }

  function renderSpotlight(dir = '') {
    const item = filtered[spotIdx] || filtered[0];
    if (!item) return;
    const wipeClass = dir === 'next' ? 'wipe-next' : dir === 'prev' ? 'wipe-prev' : '';
    spotStage.innerHTML = `<img class="spotlight-img ${wipeClass}" src="${escapeHtml(item.src)}" alt="${escapeHtml(item.title)}" />`;
    spotTitle.textContent = item.title;
    spotMeta.textContent = `${item.category} · ${item.location}`;
    Array.from(thumbStrip.querySelectorAll('.thumb-btn')).forEach((b, i) => {
      b.classList.toggle('is-active', i === spotIdx);
    });
  }

  function renderFiltered() {
    filtered = activeCat === 'All' ? [...gallery] : gallery.filter((g) => g.category === activeCat);
    spotIdx = 0;
    countEl.textContent = `Showing ${filtered.length} ${filtered.length === 1 ? 'frame' : 'frames'}`;

    thumbStrip.innerHTML = filtered
      .map(
        (item, idx) => `<button type="button" class="thumb-btn ${idx === 0 ? 'is-active' : ''}" data-thumb="${idx}" aria-label="Show ${escapeHtml(item.title)}"><img src="${escapeHtml(item.src)}" alt="" /></button>`
      )
      .join('');

    gridEl.innerHTML = filtered
      .map(
        (item, idx) => `
        <button type="button" class="gallery-tile ${item.wide && activeCat === 'All' ? 'is-wide' : ''}" data-tile-idx="${idx}">
          <div class="gallery-tile-media">
            <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.title)}" loading="lazy" />
          </div>
          <div class="gallery-tile-cap">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.category)} · ${escapeHtml(item.location)}</span>
          </div>
        </button>`
      )
      .join('');

    renderSpotlight('');
  }

  const onFilterClick = (e) => {
    const btn = e.target.closest('.seg-btn');
    if (!btn) return;
    activeCat = btn.dataset.cat;
    segBtns.forEach((b) => {
      const on = b === btn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', String(on));
    });
    positionIndicator();
    renderFiltered();
  };

  const onThumbClick = (e) => {
    const btn = e.target.closest('.thumb-btn');
    if (!btn) return;
    const nextIdx = Number(btn.dataset.thumb);
    const dir = nextIdx >= spotIdx ? 'next' : 'prev';
    spotIdx = nextIdx;
    renderSpotlight(dir);
  };

  const onGridClick = (e) => {
    const tile = e.target.closest('.gallery-tile');
    if (!tile) return;
    openLightbox(filtered, Number(tile.dataset.tileIdx));
  };

  const onPrev = () => {
    spotIdx = (spotIdx - 1 + filtered.length) % filtered.length;
    renderSpotlight('prev');
  };
  const onNext = () => {
    spotIdx = (spotIdx + 1) % filtered.length;
    renderSpotlight('next');
  };
  const onExpand = () => openLightbox(filtered, spotIdx);

  const onTouchStart = (e) => { if (e.touches && e.touches[0]) touchStartX = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (!e.changedTouches || !e.changedTouches[0]) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 42) (dx < 0 ? onNext : onPrev)();
  };

  filterWrap.addEventListener('click', onFilterClick);
  thumbStrip.addEventListener('click', onThumbClick);
  gridEl.addEventListener('click', onGridClick);
  spotPrev.addEventListener('click', onPrev);
  spotNext.addEventListener('click', onNext);
  spotExpand.addEventListener('click', onExpand);
  spotStage.addEventListener('touchstart', onTouchStart, { passive: true });
  spotStage.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('resize', positionIndicator, { passive: true });

  renderFiltered();
  requestAnimationFrame(positionIndicator);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(positionIndicator);

  return () => {
    filterWrap.removeEventListener('click', onFilterClick);
    thumbStrip.removeEventListener('click', onThumbClick);
    gridEl.removeEventListener('click', onGridClick);
    spotPrev.removeEventListener('click', onPrev);
    spotNext.removeEventListener('click', onNext);
    spotExpand.removeEventListener('click', onExpand);
    spotStage.removeEventListener('touchstart', onTouchStart);
    spotStage.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('resize', positionIndicator);
  };
}

/* ==========================================================================
   PAGE 3: ABOUT US (#/about)
   ========================================================================== */
function getWalkthroughSteps() {
  const craftPhoto = getSlotPhoto('about_craft', '/assets/photos/10-studio-craft.webp');
  const heroFrames = getHeroFrames();
  const gallery = getGalleryItems();
  const portraitPhoto = getSlotPhoto('home_portrait', '/assets/photos/08-portrait-bridal.webp');
  const haldiPhoto = gallery.find((g) => g.category === 'Candid') || gallery[0];

  return [
    {
      step: 'Step 01 · Consultation',
      title: 'Meet at our studio or on WhatsApp',
      copy: 'Share your wedding dates, venues, and function list. We map out lighting windows for Haldi, Varmala, and Pheras so nothing feels rushed.',
      img: craftPhoto.src,
      alt: craftPhoto.title
    },
    {
      step: 'Step 02 · Coverage Day',
      title: 'Calm, unobtrusive crew on the floor',
      copy: 'Our candid and traditional photographers work together with quiet prime lenses and steady gimbals—letting elders and couples enjoy every ritual naturally.',
      img: heroFrames[0].src,
      alt: heroFrames[0].title
    },
    {
      step: 'Step 03 · Color & Film Edit',
      title: 'Hand-graded color and story-first cinema',
      copy: 'Every selected frame is balanced individually for warm skin tones and rich textile detail. Teaser films are scored cleanly without noisy effects.',
      img: haldiPhoto.src,
      alt: haldiPhoto.title
    },
    {
      step: 'Step 04 · Heirloom Delivery',
      title: 'Archival matte linen albums & cloud link',
      copy: 'You approve the album layout page-by-page before printing. Final delivery arrives as lay-flat thick archival sheets plus a private phone-ready gallery link.',
      img: portraitPhoto.src,
      alt: portraitPhoto.title
    }
  ];
}

function renderAboutPage() {
  const { studio } = siteData;
  const craftPhoto = getSlotPhoto('about_craft', '/assets/photos/10-studio-craft.webp');
  const steps = getWalkthroughSteps();

  return `
    <section class="sub-hero">
      <img class="sub-hero-bg" src="${escapeHtml(craftPhoto.src)}" alt="" />
      <div class="sub-hero-scrim" aria-hidden="true"></div>
      <div class="container sub-hero-inner">
        <h1 class="display-xl" aria-label="Built in Farrukhabad for stories worth keeping.">${splitWordsMarkup('Built in Farrukhabad for stories worth keeping.')}</h1>
        <p class="lead-copy">
          ${escapeHtml(studio.name)} is an Awas Vikas Colony photography and wedding cinema house focused on honest moments, reliable crew discipline, and physical prints that age gracefully.
        </p>
      </div>
    </section>

    <section class="lifted-sheet">
      <div class="container editorial-split">
        <div class="reveal">
          <div style="border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-card);">
            <img src="${escapeHtml(craftPhoto.src)}" alt="${escapeHtml(craftPhoto.title)}" />
          </div>
        </div>
        <div class="reveal">
          <h2 class="display-lg">Full-frame optics, patient eyes, zero shortcut edits</h2>
          <p class="at-scrub" style="color:var(--muted);margin-top:16px;">
            Too many wedding teams show up late, rush family portraits, and drown every photograph in artificial filters. We run our studio like a dedicated darkroom—arriving before the first ritual, shooting on full-frame mirrorless bodies and fast prime lenses, and checking every print spread ourselves.
          </p>
          <div class="story-points">
            <div class="story-point">
              <span class="story-num">A</span>
              <div>
                <h3>Full-Frame Mirrorless &amp; Prime Lens Kit</h3>
                <p>35mm, 50mm, and 85mm f/1.4 lenses built specifically for candlelit mandaps and evening receptions.</p>
              </div>
            </div>
            <div class="story-point">
              <span class="story-num">B</span>
              <div>
                <h3>In-House Editing &amp; Album Design</h3>
                <p>Your memories never get outsourced to random third-party labs. Every cut and spread is reviewed at our Awas Vikas studio.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="stone-chapter">
      <div class="container">
        <div class="chapter-rail">
          <span>How We Work</span>
          <span>From first WhatsApp hello to your printed linen album</span>
        </div>
        <div class="chapter-head reveal">
          <div>
            <h2 class="display-lg">Four calm steps from booking to delivery</h2>
            <p>Tap or scroll through each stage to see how your celebration is planned, shot, edited, and delivered.</p>
          </div>
        </div>

        <div class="sticky-walkthrough">
          <div class="sticky-visual-col reveal">
            <div class="sticky-frame" id="about-sticky-frame">
              <div class="sticky-frame-inner" id="about-sticky-inner">
                <img src="${escapeHtml(steps[0].img)}" alt="${escapeHtml(steps[0].alt)}" />
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;">
              <span id="about-step-counter" style="font-size:0.86rem;color:var(--muted);">Step 01 of 04</span>
              <div style="display:flex;gap:8px;">
                <button type="button" class="icon-circle-btn" id="step-prev-btn" aria-label="Previous process step">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button type="button" class="icon-circle-btn" id="step-next-btn" aria-label="Next process step">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          </div>

          <div class="step-cards" id="about-step-cards">
            ${steps
              .map(
                (s, i) => `
              <article class="step-card ${i === 0 ? 'is-active' : ''}" data-step-idx="${i}" tabindex="0">
                <div class="step-tag">${escapeHtml(s.step)}</div>
                <h3>${escapeHtml(s.title)}</h3>
                <p>${escapeHtml(s.copy)}</p>
              </article>`
              )
              .join('')}
          </div>
        </div>
      </div>
    </section>

    <section class="paper-chapter">
      <div class="container">
        <div class="location-grid reveal">
          <div class="info-card">
            <h3>Studio Address</h3>
            <p>${escapeHtml(studio.city)}</p>
            <a class="btn btn-ghost-light" style="margin-top:14px;min-height:42px;padding:0 16px;font-size:0.86rem;" href="${escapeHtml(studio.mapsUrl)}" target="_blank" rel="noopener noreferrer">Open on Google Maps</a>
          </div>
          <div class="info-card">
            <h3>Studio Hours</h3>
            <p>${escapeHtml(studio.hours)}. Evening appointments available for outstation families.</p>
          </div>
          <div class="info-card">
            <h3>Speak Directly</h3>
            <p>Call or message ${escapeHtml(studio.phone)} to check crew availability for your wedding dates.</p>
            <a class="btn btn-primary" style="margin-top:14px;min-height:42px;padding:0 16px;font-size:0.86rem;" href="#/booking">Book a Shoot</a>
          </div>
        </div>

        <div class="next-page-bar reveal">
          <div>
            <span style="font-size:0.84rem;color:var(--muted);">Next Page</span>
            <h3 class="display-md">Compare Plans &amp; Live Offer Details</h3>
          </div>
          <a class="btn btn-primary" href="#/plans">View Plans &amp; Details</a>
        </div>
      </div>
    </section>
  `;
}

function hydrateAboutPage(rootEl) {
  const steps = getWalkthroughSteps();
  const frameWrap = rootEl.querySelector('#about-sticky-frame');
  const counterEl = rootEl.querySelector('#about-step-counter');
  const cards = Array.from(rootEl.querySelectorAll('.step-card'));
  const prevBtn = rootEl.querySelector('#step-prev-btn');
  const nextBtn = rootEl.querySelector('#step-next-btn');

  let cur = 0;

  function setStep(idx) {
    const next = (idx + steps.length) % steps.length;
    if (next === cur && frameWrap.querySelector('img')) return;
    cur = next;
    const s = steps[cur];
    cards.forEach((c, i) => c.classList.toggle('is-active', i === cur));
    frameWrap.innerHTML = `<div class="sticky-frame-inner"><img src="${escapeHtml(s.img)}" alt="${escapeHtml(s.alt)}" /></div>`;
    counterEl.textContent = `Step 0${cur + 1} of 0${steps.length}`;
  }

  const cardHandlers = cards.map((card, i) => {
    const h = () => setStep(i);
    const kh = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setStep(i);
      }
    };
    card.addEventListener('click', h);
    card.addEventListener('keydown', kh);
    return { card, h, kh };
  });

  const onPrev = () => setStep(cur - 1);
  const onNext = () => setStep(cur + 1);
  prevBtn.addEventListener('click', onPrev);
  nextBtn.addEventListener('click', onNext);

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const idx = Number(entry.target.dataset.stepIdx);
          if (!Number.isNaN(idx)) setStep(idx);
        }
      }
    },
    { rootMargin: '-36% 0px -44% 0px', threshold: 0.1 }
  );
  cards.forEach((c) => io.observe(c));

  return () => {
    io.disconnect();
    prevBtn.removeEventListener('click', onPrev);
    nextBtn.removeEventListener('click', onNext);
    cardHandlers.forEach(({ card, h, kh }) => {
      card.removeEventListener('click', h);
      card.removeEventListener('keydown', kh);
    });
  };
}

/* ==========================================================================
   PAGE 4: BOOKING DETAILS & PLANS (#/plans)
   ========================================================================== */
const BOOKING_FAQS = [
  {
    q: 'How much advance is required to lock our event date?',
    a: 'A 25% booking advance locks your exact dates and crew exclusively on our studio calendar. 50% is settled on the event day, and the final 25% is payable when your edited photos and album layout are ready.'
  },
  {
    q: 'When do we receive our edited photos and wedding film?',
    a: 'You receive 25–30 edited photographs within 48 hours of your wedding for WhatsApp and family sharing. Complete edited galleries are delivered in 15 days, and full cinematic films plus printed linen albums within 25–30 days.'
  },
  {
    q: 'Can we customize a plan for a single function or custom days?',
    a: 'Yes. Select the closest plan on our Booking Page, enter your exact date and timing, and mention your custom requirements in the Venue/Notes box—we will confirm a tailored quote on WhatsApp right away.'
  },
  {
    q: 'Do you travel outside Farrukhabad for weddings and pre-weddings?',
    a: 'Yes, our team travels across Uttar Pradesh and neighboring cities. Local Farrukhabad & Fatehgarh travel is included; outstation bookings only cover actual travel and crew stay.'
  }
];

function renderPlansPage() {
  const { offer, plans, trendingPlanId } = siteData;
  const gallery = getGalleryItems();
  const headerPhoto = gallery.find((g) => g.category === 'Events') || gallery[0];

  const offerCard = offer.active
    ? `
      <div class="live-offer-card reveal">
        <div>
          <span class="offer-pill-tag">Live Studio Offer${offer.validTill ? ` · Valid till ${escapeHtml(offer.validTill)}` : ''}</span>
          <h3>${escapeHtml(offer.title)} — ${offer.percent}% Off Automatically Applied</h3>
          <p>${escapeHtml(offer.note)}. Prices below already include your discount.</p>
        </div>
        <a class="btn btn-brass" href="#/booking">Claim Offer on Booking</a>
      </div>`
    : '';

  const cardsHtml = plans
    .map((plan) => {
      const { base, finalPrice, savings, hasOffer } = getPlanPricing(plan);
      const isTrend = plan.id === trendingPlanId;
      return `
        <article class="plan-card reveal ${isTrend ? 'is-trending' : ''}" data-plan-card="${escapeHtml(plan.id)}">
          <div>
            <div class="plan-badges">
              ${isTrend ? '<span class="badge-trending">Most Trending Plan</span>' : `<span class="badge-views">${escapeHtml(plan.duration)}</span>`}
              <span class="badge-views">${escapeHtml(plan.team.split('(')[0].trim())}</span>
            </div>
            <h3>${escapeHtml(plan.name)}</h3>
            <p class="plan-desc">${escapeHtml(plan.tagline)}</p>
            <div class="plan-price-row">
              <span class="price-final">${formatINR(finalPrice)}</span>
              ${hasOffer ? `<span class="price-old">${formatINR(base)}</span><span class="price-save">Save ${formatINR(savings)}</span>` : ''}
            </div>
            <p style="font-size:0.86rem;color:var(--muted);margin:0 0 14px;">
              <strong>Crew:</strong> ${escapeHtml(plan.team)} · <strong>Duration:</strong> ${escapeHtml(plan.duration)}
            </p>
            <ul class="plan-features">
              ${plan.deliverables.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}
            </ul>
          </div>
          <div class="plan-card-actions">
            <a class="btn btn-primary" href="#/booking?plan=${encodeURIComponent(plan.id)}">Book This Plan</a>
          </div>
        </article>`;
    })
    .join('');

  return `
    <section class="sub-hero">
      <img class="sub-hero-bg" src="${escapeHtml(headerPhoto.src)}" alt="" />
      <div class="sub-hero-scrim" aria-hidden="true"></div>
      <div class="container sub-hero-inner">
        <h1 class="display-xl" aria-label="Booking Details & Studio Plans">${splitWordsMarkup('Booking Details & Studio Plans')}</h1>
        <p class="lead-copy">
          Clear deliverables, real crew sizes, and upfront pricing with zero hidden fees. Choose any package to jump straight to date and time booking.
        </p>
      </div>
    </section>

    <section class="lifted-sheet">
      <div class="container">
        ${offerCard}
        <div class="plans-grid">${cardsHtml}</div>
      </div>
    </section>

    <section class="stone-chapter">
      <div class="container-narrow">
        <div class="chapter-rail">
          <span>Booking Policies &amp; Timeline</span>
          <span>Everything to know before locking your date</span>
        </div>
        <h2 class="display-lg reveal" style="margin-bottom:26px;">How bookings, payments, and delivery work</h2>
        <div class="accordion-list" id="plans-accordion">
          ${BOOKING_FAQS.map(
            (item, idx) => `
            <div class="acc-item ${idx === 0 ? 'is-open' : ''}">
              <button type="button" class="acc-trigger" aria-expanded="${idx === 0}">
                <span>${escapeHtml(item.q)}</span>
                <svg class="acc-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <div class="acc-body">
                <div class="acc-body-inner"><p>${escapeHtml(item.a)}</p></div>
              </div>
            </div>`
          ).join('')}
        </div>

        <div class="next-page-bar reveal">
          <div>
            <span style="font-size:0.84rem;color:var(--muted);">Ready to reserve?</span>
            <h3 class="display-md">Select Your Event Date &amp; Time</h3>
          </div>
          <a class="btn btn-primary" href="#/booking">Go to Booking Page</a>
        </div>
      </div>
    </section>
  `;
}

function hydratePlansPage(rootEl) {
  const cards = Array.from(rootEl.querySelectorAll('[data-plan-card]'));
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          trackPlanPulse(entry.target.dataset.planCard);
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.35 }
  );
  cards.forEach((c) => io.observe(c));

  const acc = rootEl.querySelector('#plans-accordion');
  const onAccClick = (e) => {
    const trig = e.target.closest('.acc-trigger');
    if (!trig) return;
    const item = trig.parentElement;
    const willOpen = !item.classList.contains('is-open');
    item.classList.toggle('is-open', willOpen);
    trig.setAttribute('aria-expanded', String(willOpen));
  };
  acc.addEventListener('click', onAccClick);

  return () => {
    io.disconnect();
    acc.removeEventListener('click', onAccClick);
  };
}

/* ==========================================================================
   PAGE 5: BOOKING PAGE (#/booking) — Plan, Name, Date, Time -> D1 + WhatsApp
   ========================================================================== */
function renderBookingPage(query) {
  const { studio, plans, trendingPlanId } = siteData;
  const gallery = getGalleryItems();
  const headerPhoto = gallery.find((g) => g.category === 'Pre-Wedding') || gallery[0];
  const prePlanId = query.get('plan') || trendingPlanId || plans[0].id;
  const validPlan = plans.find((p) => p.id === prePlanId) ? prePlanId : plans[0].id;
  const minDate = todayISO();

  return `
    <section class="sub-hero">
      <img class="sub-hero-bg" src="${escapeHtml(headerPhoto.src)}" alt="" />
      <div class="sub-hero-scrim" aria-hidden="true"></div>
      <div class="container sub-hero-inner">
        <h1 class="display-xl" aria-label="Book Your Shoot Date">${splitWordsMarkup('Book Your Shoot Date')}</h1>
        <p class="lead-copy">
          Pick your package, enter your name, and choose your event date and timing. Pressing Book Order opens WhatsApp with your full summary ready to send directly to ${escapeHtml(studio.name)}.
        </p>
      </div>
    </section>

    <section class="lifted-sheet">
      <div class="container booking-layout">
        <form class="booking-form-card" id="booking-form" novalidate>
          <div class="form-block">
            <label class="form-label">1. Select Package Plan</label>
            <div class="plan-picker-grid" id="plan-picker">
              ${plans
                .map((p) => {
                  const { finalPrice } = getPlanPricing(p);
                  const sel = p.id === validPlan;
                  return `
                    <button type="button" class="plan-pick-btn ${sel ? 'is-selected' : ''}" data-pick-plan="${escapeHtml(p.id)}" aria-pressed="${sel}">
                      <strong>${escapeHtml(p.name)}</strong>
                      <span>${formatINR(finalPrice)} · ${escapeHtml(p.duration.split('(')[0].trim())}</span>
                    </button>`;
                })
                .join('')}
            </div>
          </div>

          <div class="form-block field-row-2">
            <div>
              <label class="form-label" for="bk-name">
                2. Your Full Name *
                <span class="form-hint">Shown on your booking message</span>
              </label>
              <input class="text-input" id="bk-name" name="name" type="text" placeholder="e.g. Rohan &amp; Priya Sharma" autocomplete="name" required />
            </div>
            <div>
              <label class="form-label" for="bk-phone">
                Mobile Number (Optional)
                <span class="form-hint">For quick callback confirmation</span>
              </label>
              <input class="text-input" id="bk-phone" name="phone" type="tel" placeholder="e.g. 98765 43210" autocomplete="tel" />
            </div>
          </div>

          <div class="form-block field-row-2">
            <div>
              <label class="form-label" for="bk-date">
                3. Event Date *
                <span class="form-hint">Main wedding or shoot date</span>
              </label>
              <input class="text-input" id="bk-date" name="date" type="date" min="${minDate}" required />
            </div>
            <div>
              <label class="form-label" for="bk-time">
                4. Preferred Start Time *
                <span class="form-hint">When should the crew arrive?</span>
              </label>
              <input class="text-input" id="bk-time" name="time" type="time" value="19:00" required />
            </div>
          </div>

          <div class="form-block">
            <label class="form-label">Event Shift / Slot</label>
            <div class="shift-grid" id="shift-picker">
              ${SHIFTS.map(
                (s, i) => `
                <button type="button" class="shift-btn ${i === 2 ? 'is-selected' : ''}" data-shift="${escapeHtml(s.id)}" data-default-time="${s.defaultTime}" aria-pressed="${i === 2}">
                  <strong>${escapeHtml(s.label)}</strong>
                  <span>${escapeHtml(s.range)}</span>
                </button>`
              ).join('')}
            </div>
          </div>

          <div class="form-block" style="margin-bottom:0;">
            <label class="form-label" for="bk-notes">
              Venue / Function Notes (Optional)
              <span class="form-hint">Lawn name, colony, or extra ceremonies</span>
            </label>
            <textarea class="text-area" id="bk-notes" name="notes" placeholder="e.g. Awas Vikas Colony guest house — Haldi morning + Evening wedding"></textarea>
          </div>

          <div id="bk-error" class="field-error" role="alert" aria-live="polite"></div>
        </form>

        <aside class="booking-slip" aria-label="Live Booking Summary">
          <div class="slip-head">
            <h3>Booking Summary</h3>
            <p>Sends directly to ${escapeHtml(studio.name)} (${escapeHtml(studio.phone)})</p>
          </div>

          <div class="slip-rows">
            <div class="slip-row"><span>Customer</span><strong id="slip-name">Enter your name</strong></div>
            <div class="slip-row"><span>Selected Plan</span><strong id="slip-plan">—</strong></div>
            <div class="slip-row"><span>Event Date</span><strong id="slip-date">Choose a date</strong></div>
            <div class="slip-row"><span>Timing &amp; Shift</span><strong id="slip-time">Evening / Night · 7:00 PM</strong></div>
            <div class="slip-row" id="slip-offer-row"><span>Live Offer</span><strong style="color:var(--brass);" id="slip-offer">—</strong></div>
          </div>

          <div class="slip-total">
            <span style="color:var(--silver);font-size:0.9rem;">Estimated Package</span>
            <strong id="slip-total">₹0</strong>
          </div>

          <div style="font-size:0.78rem;color:var(--silver);margin-bottom:8px;">WhatsApp Message Preview</div>
          <div class="slip-preview-msg" id="slip-msg-preview"></div>

          <div class="slip-actions">
            <a id="bk-whatsapp-btn" class="btn btn-forest" href="#" target="_blank" rel="noopener noreferrer">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              <span>Book Order on WhatsApp</span>
            </a>
            <button type="button" id="bk-copy-btn" class="btn btn-ghost-dark">Copy Booking Message</button>
          </div>

          <div id="bk-toast" class="booking-toast" hidden></div>
        </aside>
      </div>
    </section>
  `;
}

function hydrateBookingPage(rootEl, query) {
  const { studio, plans, offer, trendingPlanId } = siteData;
  const prePlanId = query.get('plan') || trendingPlanId || plans[0].id;
  let selectedPlanId = plans.find((p) => p.id === prePlanId) ? prePlanId : plans[0].id;
  let selectedShift = 'Evening / Night';

  trackPlanPulse(selectedPlanId);

  const planPicker = rootEl.querySelector('#plan-picker');
  const shiftPicker = rootEl.querySelector('#shift-picker');
  const nameInput = rootEl.querySelector('#bk-name');
  const phoneInput = rootEl.querySelector('#bk-phone');
  const dateInput = rootEl.querySelector('#bk-date');
  const timeInput = rootEl.querySelector('#bk-time');
  const notesInput = rootEl.querySelector('#bk-notes');
  const errEl = rootEl.querySelector('#bk-error');

  const slipName = rootEl.querySelector('#slip-name');
  const slipPlan = rootEl.querySelector('#slip-plan');
  const slipDate = rootEl.querySelector('#slip-date');
  const slipTime = rootEl.querySelector('#slip-time');
  const slipOffer = rootEl.querySelector('#slip-offer');
  const slipOfferRow = rootEl.querySelector('#slip-offer-row');
  const slipTotal = rootEl.querySelector('#slip-total');
  const slipPreview = rootEl.querySelector('#slip-msg-preview');
  const waBtn = rootEl.querySelector('#bk-whatsapp-btn');
  const copyBtn = rootEl.querySelector('#bk-copy-btn');
  const toastEl = rootEl.querySelector('#bk-toast');

  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 14);
  dateInput.value = `${defaultDate.getFullYear()}-${String(defaultDate.getMonth() + 1).padStart(2, '0')}-${String(defaultDate.getDate()).padStart(2, '0')}`;

  function buildMessage() {
    const plan = plans.find((p) => p.id === selectedPlanId) || plans[0];
    const { base, finalPrice, savings, hasOffer } = getPlanPricing(plan);
    const custName = nameInput.value.trim() || '[Your Name]';
    const custPhone = phoneInput.value.trim();
    const niceDate = formatDateNice(dateInput.value);
    const niceTime = formatTime12h(timeInput.value);
    const notes = notesInput.value.trim();

    return [
      `Namaste ${studio.name}!`,
      `I would like to book a shoot with the following details:`,
      ``,
      `Name: ${custName}`,
      ...(custPhone ? [`Phone: ${custPhone}`] : []),
      `Plan: ${plan.name}`,
      hasOffer
        ? `Price: ${formatINR(finalPrice)} (${offer.percent}% ${offer.title} applied — saved ${formatINR(savings)} off ${formatINR(base)})`
        : `Price: ${formatINR(finalPrice)}`,
      `Event Date: ${niceDate}`,
      `Shift & Time: ${selectedShift} (Start around ${niceTime})`,
      ...(notes ? [`Venue / Notes: ${notes}`] : []),
      ``,
      `Please confirm availability for this date.`
    ].join('\n');
  }

  function syncSummary() {
    const plan = plans.find((p) => p.id === selectedPlanId) || plans[0];
    const { finalPrice, savings, hasOffer } = getPlanPricing(plan);
    const custName = nameInput.value.trim();

    slipName.textContent = custName || 'Enter your name';
    slipPlan.textContent = plan.name;
    slipDate.textContent = formatDateNice(dateInput.value);
    slipTime.textContent = `${selectedShift} · ${formatTime12h(timeInput.value)}`;
    slipTotal.textContent = formatINR(finalPrice);

    if (hasOffer) {
      slipOfferRow.style.display = '';
      slipOffer.textContent = `-${formatINR(savings)} (${offer.percent}% Off)`;
    } else {
      slipOfferRow.style.display = 'none';
    }

    const msg = buildMessage();
    slipPreview.textContent = msg;
    waBtn.href = `https://wa.me/${studio.whatsapp}?text=${encodeURIComponent(msg)}`;
  }

  const onPlanPick = (e) => {
    const btn = e.target.closest('[data-pick-plan]');
    if (!btn) return;
    selectedPlanId = btn.dataset.pickPlan;
    trackPlanPulse(selectedPlanId);
    Array.from(planPicker.querySelectorAll('.plan-pick-btn')).forEach((b) => {
      const sel = b === btn;
      b.classList.toggle('is-selected', sel);
      b.setAttribute('aria-pressed', String(sel));
    });
    syncSummary();
  };

  const onShiftPick = (e) => {
    const btn = e.target.closest('[data-shift]');
    if (!btn) return;
    selectedShift = btn.dataset.shift;
    if (btn.dataset.defaultTime) timeInput.value = btn.dataset.defaultTime;
    Array.from(shiftPicker.querySelectorAll('.shift-btn')).forEach((b) => {
      const sel = b === btn;
      b.classList.toggle('is-selected', sel);
      b.setAttribute('aria-pressed', String(sel));
    });
    syncSummary();
  };

  const onWaClick = (e) => {
    const custName = nameInput.value.trim();
    if (custName.length < 2) {
      e.preventDefault();
      errEl.textContent = 'Please enter your full name before opening WhatsApp.';
      nameInput.focus();
      return;
    }
    if (!dateInput.value) {
      e.preventDefault();
      errEl.textContent = 'Please pick your event date.';
      dateInput.focus();
      return;
    }
    if (!timeInput.value) {
      e.preventDefault();
      errEl.textContent = 'Please select your preferred start time.';
      timeInput.focus();
      return;
    }
    errEl.textContent = '';
    syncSummary();
    sendBookingRecord({
      planId: selectedPlanId,
      customerName: custName,
      customerPhone: phoneInput.value.trim(),
      eventDate: dateInput.value,
      eventShift: selectedShift,
      eventTime: timeInput.value,
      notes: notesInput.value.trim()
    });
    toastEl.hidden = false;
    toastEl.textContent = `Booking logged. Opening WhatsApp for ${studio.name}...`;
  };

  const onCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(buildMessage());
      toastEl.hidden = false;
      toastEl.textContent = 'Booking message copied. You can paste it directly into WhatsApp.';
    } catch (_) {
      toastEl.hidden = false;
      toastEl.textContent = 'Copy blocked by browser—tap Book Order on WhatsApp above.';
    }
  };

  planPicker.addEventListener('click', onPlanPick);
  shiftPicker.addEventListener('click', onShiftPick);
  nameInput.addEventListener('input', syncSummary);
  phoneInput.addEventListener('input', syncSummary);
  dateInput.addEventListener('change', syncSummary);
  timeInput.addEventListener('change', syncSummary);
  notesInput.addEventListener('input', syncSummary);
  waBtn.addEventListener('click', onWaClick);
  copyBtn.addEventListener('click', onCopyClick);

  syncSummary();

  return () => {
    planPicker.removeEventListener('click', onPlanPick);
    shiftPicker.removeEventListener('click', onShiftPick);
    nameInput.removeEventListener('input', syncSummary);
    phoneInput.removeEventListener('input', syncSummary);
    dateInput.removeEventListener('change', syncSummary);
    timeInput.removeEventListener('change', syncSummary);
    notesInput.removeEventListener('input', syncSummary);
    waBtn.removeEventListener('click', onWaClick);
    copyBtn.removeEventListener('click', onCopyClick);
  };
}

/* ==========================================================================
   CUSTOM DARKROOM 404 PAGE (* unknown hash routes)
   ========================================================================== */
function renderNotFoundPage(badPath) {
  return `
    <section class="page-404">
      <div class="viewfinder-box">
        <span class="vf-corner vf-tl" aria-hidden="true"></span>
        <span class="vf-corner vf-tr" aria-hidden="true"></span>
        <span class="vf-corner vf-bl" aria-hidden="true"></span>
        <span class="vf-corner vf-br" aria-hidden="true"></span>
        <div class="vf-ring" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D2AF70" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94"/></svg>
        </div>
        <p class="code-404">404</p>
        <h1>This frame was never exposed.</h1>
        <p>
          We could not find <strong>${escapeHtml(badPath || '/unknown')}</strong> in the Ananya Digital Studio archive. Return to the gallery or book your celebration date below.
        </p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <a class="btn btn-brass" href="#/">Return Home</a>
          <a class="btn btn-ghost-dark" href="#/gallery">Photo Gallery</a>
          <a class="btn btn-ghost-dark" href="#/booking">Book a Shoot</a>
        </div>
      </div>
    </section>
  `;
}

/* ==========================================================================
   TWO-STAGE DIRECTIONAL HASH ROUTER
   ========================================================================== */
const viewRoot = document.getElementById('view-root');
const routeBar = document.getElementById('route-bar');

let currentPath = null;
let currentCleanup = null;
let navTimer = 0;
let idleTimer = 0;
let renderSeq = 0;

function parseHash() {
  const raw = window.location.hash || '#/';
  const cleaned = raw.startsWith('#') ? raw.slice(1) : raw;
  const [pathPart, queryPart] = cleaned.split('?');
  const path = pathPart ? (pathPart.startsWith('/') ? pathPart : '/' + pathPart) : '/';
  return { path: path === '' ? '/' : path, query: new URLSearchParams(queryPart || '') };
}

function updateActiveNav(path) {
  document.querySelectorAll('[data-route]').forEach((el) => {
    el.classList.toggle('is-active', el.dataset.route === path);
  });
}

function triggerRouteBar() {
  routeBar.classList.remove('is-sweeping');
  void routeBar.offsetWidth;
  routeBar.classList.add('is-sweeping');
}

function mountRoute(path, query, animate = true) {
  const seq = ++renderSeq;
  const prevIdx = PAGE_ORDER.indexOf(currentPath);
  const nextIdx = PAGE_ORDER.indexOf(path);
  const dir = prevIdx !== -1 && nextIdx !== -1 && nextIdx < prevIdx ? 'bwd' : 'fwd';

  clearTimeout(navTimer);
  clearTimeout(idleTimer);
  setDrawer(false);

  const performSwap = async () => {
    if (seq !== renderSeq) return;
    if (currentCleanup) {
      currentCleanup();
      currentCleanup = null;
    }

    currentPath = path;
    updateActiveNav(path);
    window.scrollTo({ top: 0, behavior: 'auto' });

    if (path === '/admin') {
      document.title = 'Studio Admin — Ananya Digital Studio';
      viewRoot.innerHTML = `<section class="admin-login-wrap"><p style="color:var(--silver);">Loading Studio Command Center...</p></section>`;
      viewRoot.className = 'view-shell is-idle';
      try {
        const mod = await import('./admin.js?v=3');
        if (seq !== renderSeq) return;
        const admCleanup = await mod.mountAdminApp(viewRoot, {
          onDataChanged: () => { syncFromServer(); }
        });
        if (seq !== renderSeq) {
          if (admCleanup) admCleanup();
          return;
        }
        currentCleanup = admCleanup;
      } catch (_) {
        viewRoot.innerHTML = renderNotFoundPage('/admin');
      }
      return;
    }

    let html = '';
    let hydrate = null;

    if (path === '/' || path === '/home') {
      html = renderHomePage();
      hydrate = hydrateHomePage;
      document.title = 'Ananya Digital Studio — Wedding Photography & Cinema, Farrukhabad';
    } else if (path === '/gallery') {
      html = renderGalleryPage();
      hydrate = hydrateGalleryPage;
      document.title = 'Photo Gallery — Ananya Digital Studio';
    } else if (path === '/about') {
      html = renderAboutPage();
      hydrate = hydrateAboutPage;
      document.title = 'About Us — Ananya Digital Studio';
    } else if (path === '/plans') {
      html = renderPlansPage();
      hydrate = hydratePlansPage;
      document.title = 'Booking Details & Plans — Ananya Digital Studio';
    } else if (path === '/booking') {
      html = renderBookingPage(query);
      hydrate = hydrateBookingPage;
      document.title = 'Book Your Date — Ananya Digital Studio';
    } else {
      html = renderNotFoundPage(path);
      document.title = '404 Frame Not Found — Ananya Digital Studio';
    }

    viewRoot.innerHTML = html;
    const motionCleanup = setupMotion(viewRoot);
    const pageCleanup = hydrate ? hydrate(viewRoot, query) : null;
    currentCleanup = () => {
      motionCleanup();
      if (pageCleanup) pageCleanup();
    };

    if (animate) {
      viewRoot.className = `view-shell enter-${dir}`;
      idleTimer = setTimeout(() => {
        viewRoot.className = 'view-shell is-idle';
      }, 450);
    } else {
      viewRoot.className = 'view-shell is-idle';
    }
  };

  if (!animate || currentPath === null) {
    performSwap();
  } else {
    triggerRouteBar();
    viewRoot.className = `view-shell exit-${dir}`;
    navTimer = setTimeout(performSwap, 140);
  }
}

export function navigate(targetHash) {
  window.location.hash = targetHash.startsWith('#') ? targetHash : '#' + targetHash;
}

window.addEventListener('hashchange', () => {
  const { path, query } = parseHash();
  mountRoute(path, query, true);
});

// Boot: load live D1 data first, then mount initial route cleanly
(async function boot() {
  await syncFromServer();
  updateOfferIndicator();
  const initial = parseHash();
  mountRoute(initial.path, initial.query, false);
})();

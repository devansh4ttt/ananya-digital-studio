/* ==========================================================================
   Ananya Digital Studio — Hardened Cloudflare Worker + D1 Backend
   Same-origin hidden API, HMAC-SHA256 HttpOnly sessions, timingSafeEqual,
   per-IP + global brute-force lockouts, CSRF Origin/Sec-Fetch-Site checks,
   server-side pricing, atomic D1 counters, and edge-cached /m/:id media.
   ========================================================================== */

const APP_VERSION = '1.0.0';
const COOKIE_NAME = '__Host-ananya_adm';
const DEV_COOKIE_NAME = 'ananya_adm';
const SESSION_TTL_SEC = 60 * 60 * 12; // 12 hours
const MAX_JSON_BYTES = 32 * 1024;
const MAX_UPLOAD_JSON_BYTES = 440 * 1024;
const MAX_DECODED_IMAGE_BYTES = 280 * 1024;

const ALLOWED_SLOTS = new Set(['home_hero', 'home_portrait', 'about_craft', 'gallery']);
const ALLOWED_CATEGORIES = new Set(['Wedding', 'Pre-Wedding', 'Candid', 'Portraits', 'Events', 'Studio']);
const ALLOWED_SHIFTS = new Set(['Morning', 'Afternoon', 'Evening / Night', 'Full Day']);

const DEFAULT_STUDIO = {
  name: 'Ananya Digital Studio',
  city: 'Awas Vikas Colony, Farrukhabad, UP',
  whatsapp: '917266838737',
  phone: '+91 72668 38737',
  hours: 'Daily · 10:00 AM to 8:30 PM',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Ananya+Digital+studio+Awas+Vikas+Colony+Farrukhabad'
};

const DEFAULT_OFFER = {
  active: true,
  title: 'Wedding Season Offer',
  percent: 15,
  note: 'Flat 15% off on Full Wedding & Pre-Wedding packages booked this month',
  validTill: '31 Dec 2026'
};

const SEED_PLANS = [
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
    sort_order: 1,
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
    sort_order: 2,
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
    sort_order: 3,
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
    sort_order: 4,
    views: 0,
    bookings: 0
  }
];

const SEED_MEDIA = [
  { id: 'hero-1', slot: 'home_hero', category: 'Wedding', title: 'Twilight Mandap Ceremony', location: 'Wedding · 35mm Prime', src: '/assets/photos/01-hero-mandap.webp', wide: 1, sort_order: 1 },
  { id: 'hero-2', slot: 'home_hero', category: 'Pre-Wedding', title: 'Heritage Haveli Walk', location: 'Pre-Wedding · Golden Hour', src: '/assets/photos/04-prewed-arches.webp', wide: 1, sort_order: 2 },
  { id: 'hero-3', slot: 'home_hero', category: 'Portraits', title: 'Bridal Window Portrait', location: 'Portraits · 85mm Prime', src: '/assets/photos/08-portrait-bridal.webp', wide: 0, sort_order: 3 },
  { id: 'hero-4', slot: 'home_hero', category: 'Events', title: 'Candlelit Reception', location: 'Events · Evening Cinema', src: '/assets/photos/09-event-reception.webp', wide: 1, sort_order: 4 },
  { id: 'home-portrait-main', slot: 'home_portrait', category: 'Portraits', title: 'Quiet Window Bridal Study', location: 'Editorial Bridal Portrait · 85mm', src: '/assets/photos/08-portrait-bridal.webp', wide: 0, sort_order: 1 },
  { id: 'about-craft-main', slot: 'about_craft', category: 'Studio', title: 'Ananya Studio Darkroom & Gear', location: 'Awas Vikas Colony, Farrukhabad', src: '/assets/photos/10-studio-craft.webp', wide: 1, sort_order: 1 },
  { id: 'gal-1', slot: 'gallery', category: 'Wedding', title: 'Twilight Courtyard Varmala', location: 'Heritage Courtyard · Dusk', src: '/assets/photos/01-hero-mandap.webp', wide: 1, sort_order: 1 },
  { id: 'gal-2', slot: 'gallery', category: 'Wedding', title: 'Around the Sacred Fire', location: 'Mandap Ceremony · 50mm Prime', src: '/assets/photos/02-wedding-pheras.webp', wide: 0, sort_order: 2 },
  { id: 'gal-3', slot: 'gallery', category: 'Wedding', title: 'Under the Jasmine Chadar', location: 'Bridal Procession · Natural Light', src: '/assets/photos/03-wedding-entry.webp', wide: 1, sort_order: 3 },
  { id: 'gal-4', slot: 'gallery', category: 'Pre-Wedding', title: 'Golden Hour Colonnade', location: 'Sandstone Haveli · Sunset', src: '/assets/photos/04-prewed-arches.webp', wide: 1, sort_order: 4 },
  { id: 'gal-5', slot: 'gallery', category: 'Pre-Wedding', title: 'Quiet Steps by the River', location: 'River Ghat · Dusk Portraits', src: '/assets/photos/05-prewed-ghat.webp', wide: 0, sort_order: 5 },
  { id: 'gal-6', slot: 'gallery', category: 'Candid', title: 'Marigold Morning Haldi', location: 'Family Courtyard · Daylight', src: '/assets/photos/06-candid-haldi.webp', wide: 0, sort_order: 6 },
  { id: 'gal-7', slot: 'gallery', category: 'Candid', title: 'First Dance Under Warm Lights', location: 'Sangeet Evening · Low-Light Cinema', src: '/assets/photos/07-candid-sangeet.webp', wide: 0, sort_order: 7 },
  { id: 'gal-8', slot: 'gallery', category: 'Portraits', title: 'Quiet Window Bridal Study', location: 'Bridal Getting Ready · 85mm Prime', src: '/assets/photos/08-portrait-bridal.webp', wide: 0, sort_order: 8 },
  { id: 'gal-9', slot: 'gallery', category: 'Events', title: 'Candlelit Reception Courtyard', location: 'Evening Reception · Architectural Wide', src: '/assets/photos/09-event-reception.webp', wide: 1, sort_order: 9 }
];

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    price INTEGER NOT NULL,
    duration TEXT NOT NULL,
    team TEXT NOT NULL,
    deliverables TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 1,
    active INTEGER NOT NULL DEFAULT 1,
    views INTEGER NOT NULL DEFAULT 0,
    bookings INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    slot TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    location TEXT NOT NULL,
    src TEXT NOT NULL,
    wide INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS media_blobs (
    id TEXT PRIMARY KEY,
    mime TEXT NOT NULL,
    data_b64 TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    k TEXT PRIMARY KEY,
    v TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL DEFAULT '',
    event_date TEXT NOT NULL,
    event_shift TEXT NOT NULL,
    event_time TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    quoted_price INTEGER NOT NULL,
    offer_applied TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS ratelimits (
    k TEXT PRIMARY KEY,
    cnt INTEGER NOT NULL,
    ws INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS fails (
    ip TEXT PRIMARY KEY,
    cnt INTEGER NOT NULL,
    until INTEGER NOT NULL
  )`
];

let schemaReady = false;
let lastPruneMs = 0;

/* ---------- Security Headers & Response Helpers ---------- */
function buildSecurityHeaders(extra = {}) {
  return {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Content-Security-Policy':
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://esm.sh; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: blob:; " +
      "connect-src 'self' https://esm.sh; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self';",
    ...extra
  };
}

function jsonRes(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: buildSecurityHeaders({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      ...extraHeaders
    })
  });
}

/* ---------- Input Sanitization & Crypto Utilities ---------- */
function T(v, max = 160) {
  if (typeof v !== 'string') return '';
  return v.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function slugifyId(text, prefix = 'plan') {
  const base = T(text, 60)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36);
  const rand = crypto.randomUUID().slice(0, 6);
  return base ? `${base}-${rand}` : `${prefix}-${rand}`;
}

function getClientIp(request) {
  return T(request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '0.0.0.0', 64);
}

function isHttps(request) {
  try {
    return new URL(request.url).protocol === 'https:';
  } catch (_) {
    return true;
  }
}

function activeCookieName(request) {
  return isHttps(request) ? COOKIE_NAME : DEV_COOKIE_NAME;
}

function parseCookies(request) {
  const header = request.headers.get('Cookie') || '';
  const map = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    map[k] = v;
  }
  return map;
}

function bytesToHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function b64urlDecode(str) {
  const norm = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = norm.length % 4 ? '='.repeat(4 - (norm.length % 4)) : '';
  const bin = atob(norm + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function sha256Bytes(text) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}

function timingSafeEqualBytes(a, b) {
  if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array) || a.length !== b.length) return false;
  if (typeof crypto.subtle.timingSafeEqual === 'function') {
    return crypto.subtle.timingSafeEqual(a, b);
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function hmacSign(secret, payload) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return bytesToHex(sig);
}

/* ---------- CSRF, Content-Type & Body Size Guard ---------- */
function checkCsrf(request) {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD') return null;

  const sfs = (request.headers.get('Sec-Fetch-Site') || '').toLowerCase();
  if (sfs && sfs !== 'same-origin' && sfs !== 'none') {
    return jsonRes({ error: 'Cross-site request blocked.' }, 403);
  }

  const origin = request.headers.get('Origin');
  if (origin) {
    const reqOrigin = new URL(request.url).origin;
    if (origin !== reqOrigin) {
      return jsonRes({ error: 'Origin mismatch.' }, 403);
    }
  }
  return null;
}

async function readJsonBody(request, maxBytes = MAX_JSON_BYTES) {
  const ct = (request.headers.get('Content-Type') || '').toLowerCase();
  if (!ct.includes('application/json')) {
    return { error: jsonRes({ error: 'Expected application/json.' }, 415) };
  }
  const lenHeader = Number(request.headers.get('Content-Length') || 0);
  if (lenHeader > maxBytes) {
    return { error: jsonRes({ error: 'Payload too large.' }, 413) };
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > maxBytes) {
    return { error: jsonRes({ error: 'Payload too large.' }, 413) };
  }
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { error: jsonRes({ error: 'Invalid JSON object.' }, 400) };
    }
    return { data };
  } catch (_) {
    return { error: jsonRes({ error: 'Malformed JSON body.' }, 400) };
  }
}

/* ---------- D1 Schema, Auto-Seed, Settings & Rate Limits ---------- */
async function ensureSchema(env) {
  if (schemaReady) return;
  if (!env.DB) throw new Error('D1 database binding DB is missing.');

  await env.DB.batch(SCHEMA_STATEMENTS.map((sql) => env.DB.prepare(sql)));

  const now = Date.now();
  const planCount = await env.DB.prepare('SELECT COUNT(*) AS c FROM plans').first();
  if (!planCount || Number(planCount.c) === 0) {
    await env.DB.batch(
      SEED_PLANS.map((p) =>
        env.DB.prepare(
          'INSERT OR IGNORE INTO plans(id,name,tagline,price,duration,team,deliverables,sort_order,active,views,bookings,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,1,?,?,?,?)'
        ).bind(
          p.id,
          p.name,
          p.tagline,
          p.price,
          p.duration,
          p.team,
          JSON.stringify(p.deliverables),
          p.sort_order,
          p.views,
          p.bookings,
          now,
          now
        )
      )
    );
  }

  const mediaCount = await env.DB.prepare('SELECT COUNT(*) AS c FROM media').first();
  if (!mediaCount || Number(mediaCount.c) === 0) {
    await env.DB.batch(
      SEED_MEDIA.map((m) =>
        env.DB.prepare(
          'INSERT OR IGNORE INTO media(id,slot,category,title,location,src,wide,sort_order,created_at) VALUES(?,?,?,?,?,?,?,?,?)'
        ).bind(m.id, m.slot, m.category, m.title, m.location, m.src, m.wide, m.sort_order, now)
      )
    );
  }

  const pepperRow = await env.DB.prepare("SELECT v FROM settings WHERE k='secret_pepper'").first();
  if (!pepperRow) {
    const rand = new Uint8Array(32);
    crypto.getRandomValues(rand);
    await env.DB.batch([
      env.DB.prepare("INSERT OR IGNORE INTO settings(k,v) VALUES('secret_pepper', ?)").bind(bytesToHex(rand)),
      env.DB.prepare("INSERT OR IGNORE INTO settings(k,v) VALUES('admin_ver', '1')"),
      env.DB.prepare("INSERT OR IGNORE INTO settings(k,v) VALUES('offer', ?)").bind(JSON.stringify(DEFAULT_OFFER)),
      env.DB.prepare("INSERT OR IGNORE INTO settings(k,v) VALUES('studio', ?)").bind(JSON.stringify(DEFAULT_STUDIO))
    ]);
  }

  schemaReady = true;
}

async function maybePrune(env) {
  const now = Date.now();
  if (now - lastPruneMs < 1000 * 60 * 15) return;
  lastPruneMs = now;
  const oldRl = now - 1000 * 60 * 60 * 24;
  try {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM ratelimits WHERE ws < ?').bind(oldRl),
      env.DB.prepare('DELETE FROM fails WHERE until > 0 AND until < ?').bind(now)
    ]);
  } catch (_) {}
}

async function getSettingJson(env, key, fallback) {
  const row = await env.DB.prepare('SELECT v FROM settings WHERE k=?').bind(key).first();
  if (!row || !row.v) return fallback;
  try {
    return { ...fallback, ...JSON.parse(row.v) };
  } catch (_) {
    return fallback;
  }
}

async function getPepper(env) {
  if (env.SESSION_SECRET && String(env.SESSION_SECRET).length >= 16) {
    return String(env.SESSION_SECRET);
  }
  const row = await env.DB.prepare("SELECT v FROM settings WHERE k='secret_pepper'").first();
  return (row && row.v) || 'ananya-fallback-pepper';
}

async function getAdminVer(env) {
  const row = await env.DB.prepare("SELECT v FROM settings WHERE k='admin_ver'").first();
  return String((row && row.v) || '1');
}

async function checkRateLimit(env, key, limit, windowMs) {
  const now = Date.now();
  const row = await env.DB.prepare('SELECT cnt, ws FROM ratelimits WHERE k=?').bind(key).first();
  if (!row || now - Number(row.ws) >= windowMs) {
    await env.DB.prepare('INSERT OR REPLACE INTO ratelimits(k,cnt,ws) VALUES(?,1,?)').bind(key, now).run();
    return { allowed: true, count: 1 };
  }
  const next = Number(row.cnt) + 1;
  if (next > limit) {
    return { allowed: false, count: next };
  }
  await env.DB.prepare('UPDATE ratelimits SET cnt=? WHERE k=?').bind(next, key).run();
  return { allowed: true, count: next };
}

/* ---------- Admin Session Auth ---------- */
async function createAdminCookie(request, env) {
  const pepper = await getPepper(env);
  const ver = await getAdminVer(env);
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC;
  const payload = b64urlEncode(JSON.stringify({ r: 'admin', v: ver, e: exp }));
  const sig = await hmacSign(pepper + ':admin-sess', payload);
  const token = `${payload}.${sig}`;
  const securePart = isHttps(request) ? 'Secure; ' : '';
  return `${activeCookieName(request)}=${token}; HttpOnly; ${securePart}SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_SEC}`;
}

function clearAdminCookie(request) {
  const securePart = isHttps(request) ? 'Secure; ' : '';
  return `${activeCookieName(request)}=; HttpOnly; ${securePart}SameSite=Strict; Path=/; Max-Age=0`;
}

async function verifyAdminSession(request, env) {
  const cookies = parseCookies(request);
  const token = cookies[activeCookieName(request)];
  if (!token || !token.includes('.')) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig || sig.length !== 64) return false;

  const pepper = await getPepper(env);
  const expectedSig = await hmacSign(pepper + ':admin-sess', payload);
  const sigOk = timingSafeEqualBytes(
    new TextEncoder().encode(sig),
    new TextEncoder().encode(expectedSig)
  );
  if (!sigOk) return false;

  try {
    const parsed = JSON.parse(b64urlDecode(payload));
    if (parsed.r !== 'admin') return false;
    if (!parsed.e || Number(parsed.e) < Math.floor(Date.now() / 1000)) return false;
    const currentVer = await getAdminVer(env);
    if (String(parsed.v) !== currentVer) return false;
    return true;
  } catch (_) {
    return false;
  }
}

/* ---------- Domain Helpers ---------- */
function parsePlanRow(row) {
  let deliverables = [];
  try {
    const parsed = JSON.parse(row.deliverables || '[]');
    if (Array.isArray(parsed)) deliverables = parsed.map((d) => T(String(d), 180)).filter(Boolean);
  } catch (_) {}
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    price: Number(row.price),
    duration: row.duration,
    team: row.team,
    deliverables,
    sort_order: Number(row.sort_order || 1),
    views: Number(row.views || 0),
    bookings: Number(row.bookings || 0)
  };
}

function computeTrendingPlanId(plans) {
  if (!plans.length) return '';
  let best = plans[0];
  let bestScore = -1;
  for (const p of plans) {
    const score = p.bookings * 6 + p.views;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  // If brand-new zero traffic, highlight Complete Wedding Signature if present
  if (bestScore === 0) {
    const sig = plans.find((p) => p.id === 'wedding-signature');
    if (sig) return sig.id;
  }
  return best.id;
}

function computeDiscountedPrice(basePrice, offer) {
  const pct = offer && offer.active ? Math.max(0, Math.min(75, Number(offer.percent || 0))) : 0;
  if (pct <= 0) return { finalPrice: basePrice, savings: 0, offerLabel: '' };
  const finalPrice = Math.round((basePrice * (100 - pct)) / 100);
  return {
    finalPrice,
    savings: basePrice - finalPrice,
    offerLabel: `${pct}% ${T(offer.title || 'Studio Offer', 60)}`
  };
}

async function fetchPublicPayload(env) {
  const [plansRes, mediaRes, offer, studio] = await Promise.all([
    env.DB.prepare('SELECT * FROM plans WHERE active=1 ORDER BY sort_order ASC, created_at ASC').all(),
    env.DB.prepare('SELECT * FROM media ORDER BY sort_order ASC, created_at ASC').all(),
    getSettingJson(env, 'offer', DEFAULT_OFFER),
    getSettingJson(env, 'studio', DEFAULT_STUDIO)
  ]);

  const plans = (plansRes.results || []).map(parsePlanRow);
  const media = (mediaRes.results || []).map((m) => ({
    id: m.id,
    slot: m.slot,
    category: m.category,
    title: m.title,
    location: m.location,
    src: m.src,
    wide: Boolean(m.wide),
    sort_order: Number(m.sort_order || 1)
  }));
  const trendingPlanId = computeTrendingPlanId(plans);

  return { studio, offer, plans, media, trendingPlanId, version: APP_VERSION };
}

/* ---------- Main Worker Fetch Handler ---------- */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    // Block path traversal attempts early
    if (path.includes('..') || path.includes('\\')) {
      return jsonRes({ error: 'Invalid path.' }, 400);
    }

    // 1. Edge-cached uploaded studio photos (/m/:id)
    if (method === 'GET' && path.startsWith('/m/')) {
      const id = path.slice(3).trim();
      if (!/^[a-zA-Z0-9_-]{6,64}$/.test(id)) {
        return new Response('Not found', { status: 404, headers: buildSecurityHeaders() });
      }
      try {
        await ensureSchema(env);
        const blob = await env.DB.prepare('SELECT mime, data_b64 FROM media_blobs WHERE id=?').bind(id).first();
        if (!blob) {
          return new Response('Not found', { status: 404, headers: buildSecurityHeaders() });
        }
        const binStr = atob(blob.data_b64);
        const bytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
        return new Response(bytes, {
          status: 200,
          headers: buildSecurityHeaders({
            'Content-Type': blob.mime,
            'Cache-Control': 'public, max-age=31536000, immutable'
          })
        });
      } catch (_) {
        return new Response('Media unavailable', { status: 500, headers: buildSecurityHeaders() });
      }
    }

    // 2. Hidden Same-Origin API Namespace (/api/v1/*)
    if (path.startsWith('/api/v1/')) {
      const csrfErr = checkCsrf(request);
      if (csrfErr) return csrfErr;

      try {
        await ensureSchema(env);
        ctx.waitUntil(maybePrune(env));
      } catch (err) {
        return jsonRes({ error: 'Database unavailable.' }, 503);
      }

      // Health check
      if (method === 'GET' && path === '/api/v1/health') {
        return jsonRes({
          ok: true,
          version: APP_VERSION,
          db: Boolean(env.DB),
          admin: Boolean(env.ADMIN_PASSWORD)
        });
      }

      // Public bootstrap data
      if (method === 'GET' && path === '/api/v1/bootstrap') {
        const data = await fetchPublicPayload(env);
        return jsonRes(data);
      }

      // Atomic debounced plan visit counter
      if (method === 'POST' && path === '/api/v1/pulse') {
        const parsed = await readJsonBody(request, 2048);
        if (parsed.error) return parsed.error;
        const planId = T(parsed.data.planId, 64);
        if (!/^[a-zA-Z0-9_-]{2,64}$/.test(planId)) {
          return jsonRes({ error: 'Invalid plan.' }, 400);
        }
        const ip = getClientIp(request);
        // Prevent spam: max 20 pulses/min per IP + 1 counted view per IP+plan per hour
        const burst = await checkRateLimit(env, `pb:${ip}`, 20, 60 * 1000);
        if (!burst.allowed) return jsonRes({ ok: true, counted: false });
        const dedupe = await checkRateLimit(env, `pv:${ip}:${planId}`, 1, 60 * 60 * 1000);
        if (!dedupe.allowed) return jsonRes({ ok: true, counted: false });

        await env.DB.prepare('UPDATE plans SET views = views + 1 WHERE id=? AND active=1').bind(planId).run();
        return jsonRes({ ok: true, counted: true });
      }

      // Public booking submission (logs inquiry + increments plan booking count before WhatsApp)
      if (method === 'POST' && path === '/api/v1/book') {
        const ip = getClientIp(request);
        const rl = await checkRateLimit(env, `bk:${ip}`, 10, 10 * 60 * 1000);
        if (!rl.allowed) {
          return jsonRes({ error: 'Too many booking requests. Please wait a few minutes.' }, 429);
        }

        const parsed = await readJsonBody(request, 8192);
        if (parsed.error) return parsed.error;
        const b = parsed.data;

        const planId = T(b.planId, 64);
        const customerName = T(b.customerName, 80);
        const customerPhone = T(b.customerPhone || '', 24).replace(/[^0-9+\-\s]/g, '');
        const eventDate = T(b.eventDate, 16);
        const eventShift = T(b.eventShift, 32);
        const eventTime = T(b.eventTime, 12);
        const notes = T(b.notes || '', 400);

        if (customerName.length < 2) {
          return jsonRes({ error: 'Please enter your full name.' }, 400);
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
          return jsonRes({ error: 'Please select a valid event date.' }, 400);
        }
        if (!ALLOWED_SHIFTS.has(eventShift)) {
          return jsonRes({ error: 'Please select a valid shift.' }, 400);
        }
        if (!/^\d{2}:\d{2}$/.test(eventTime)) {
          return jsonRes({ error: 'Please select a valid time.' }, 400);
        }

        const planRow = await env.DB.prepare('SELECT * FROM plans WHERE id=? AND active=1').bind(planId).first();
        if (!planRow) {
          return jsonRes({ error: 'Selected plan was not found.' }, 404);
        }

        const offer = await getSettingJson(env, 'offer', DEFAULT_OFFER);
        const { finalPrice, offerLabel } = computeDiscountedPrice(Number(planRow.price), offer);
        const now = Date.now();

        await env.DB.batch([
          env.DB.prepare('UPDATE plans SET bookings = bookings + 1 WHERE id=?').bind(planId),
          env.DB.prepare(
            'INSERT INTO bookings(plan_id,plan_name,customer_name,customer_phone,event_date,event_shift,event_time,notes,quoted_price,offer_applied,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)'
          ).bind(
            planId,
            planRow.name,
            customerName,
            customerPhone,
            eventDate,
            eventShift,
            eventTime,
            notes,
            finalPrice,
            offerLabel,
            now
          )
        ]);

        return jsonRes({ ok: true, quotedPrice: finalPrice, offerApplied: offerLabel });
      }

      // Admin session status
      if (method === 'GET' && path === '/api/v1/studio-auth/session') {
        const authed = await verifyAdminSession(request, env);
        return jsonRes({ authenticated: authed, adminConfigured: Boolean(env.ADMIN_PASSWORD) });
      }

      // Admin login (timingSafeEqual + per-IP & global lockouts)
      if (method === 'POST' && path === '/api/v1/studio-auth/login') {
        if (!env.ADMIN_PASSWORD) {
          return jsonRes({ error: 'Admin password secret is not configured on Cloudflare yet.' }, 503);
        }
        const ip = getClientIp(request);
        const now = Date.now();

        const [ipFail, globalFail] = await Promise.all([
          env.DB.prepare('SELECT cnt, until FROM fails WHERE ip=?').bind(ip).first(),
          env.DB.prepare("SELECT cnt, until FROM fails WHERE ip='__global__'").first()
        ]);
        if ((ipFail && Number(ipFail.until) > now) || (globalFail && Number(globalFail.until) > now)) {
          return jsonRes({ error: 'Access temporarily locked. Try again later.' }, 429);
        }

        const parsed = await readJsonBody(request, 2048);
        if (parsed.error) return parsed.error;
        const pass = typeof parsed.data.password === 'string' ? parsed.data.password : '';

        const pepper = await getPepper(env);
        const [givenHash, targetHash] = await Promise.all([
          sha256Bytes(`${pepper}:adm:${pass}`),
          sha256Bytes(`${pepper}:adm:${String(env.ADMIN_PASSWORD)}`)
        ]);

        if (!timingSafeEqualBytes(givenHash, targetHash)) {
          const nextIpCnt = (ipFail ? Number(ipFail.cnt) : 0) + 1;
          const nextIpUntil = nextIpCnt >= 5 ? now + 15 * 60 * 1000 : 0;
          const nextGlobalCnt = (globalFail ? Number(globalFail.cnt) : 0) + 1;
          const nextGlobalUntil = nextGlobalCnt >= 25 ? now + 10 * 60 * 1000 : 0;

          await env.DB.batch([
            env.DB.prepare('INSERT OR REPLACE INTO fails(ip,cnt,until) VALUES(?,?,?)').bind(ip, nextIpCnt, nextIpUntil),
            env.DB.prepare("INSERT OR REPLACE INTO fails(ip,cnt,until) VALUES('__global__',?,?)").bind(
              nextGlobalCnt,
              nextGlobalUntil
            )
          ]);
          return jsonRes({ error: 'Invalid credentials.' }, 401);
        }

        await env.DB.prepare('DELETE FROM fails WHERE ip=?').bind(ip).run();
        const setCookie = await createAdminCookie(request, env);
        return jsonRes({ ok: true }, 200, { 'Set-Cookie': setCookie });
      }

      // Admin logout (revokes all sessions via admin_ver epoch bump)
      if (method === 'POST' && path === '/api/v1/studio-auth/logout') {
        const authed = await verifyAdminSession(request, env);
        if (authed) {
          const nextVer = String(Date.now());
          await env.DB.prepare("INSERT OR REPLACE INTO settings(k,v) VALUES('admin_ver', ?)").bind(nextVer).run();
        }
        return jsonRes({ ok: true }, 200, { 'Set-Cookie': clearAdminCookie(request) });
      }

      // ---- Protected CMS Endpoints (/api/v1/studio-cms/*) ----
      if (path.startsWith('/api/v1/studio-cms/')) {
        const authed = await verifyAdminSession(request, env);
        if (!authed) {
          return jsonRes({ error: 'Unauthorized.' }, 401);
        }

        // Overview + Analytics + Bookings
        if (method === 'GET' && path === '/api/v1/studio-cms/overview') {
          const [pub, bookingsRes] = await Promise.all([
            fetchPublicPayload(env),
            env.DB.prepare('SELECT * FROM bookings ORDER BY created_at DESC LIMIT 40').all()
          ]);
          let totalViews = 0;
          let totalBookings = 0;
          for (const p of pub.plans) {
            totalViews += p.views;
            totalBookings += p.bookings;
          }
          const conversionRate = totalViews > 0 ? Number(((totalBookings / totalViews) * 100).toFixed(1)) : 0;
          return jsonRes({
            ...pub,
            analytics: {
              totalViews,
              totalBookings,
              conversionRate,
              trendingPlanId: pub.trendingPlanId
            },
            recentBookings: bookingsRes.results || []
          });
        }

        // Create or Update Plan
        if (method === 'POST' && path === '/api/v1/studio-cms/plans') {
          const parsed = await readJsonBody(request, MAX_JSON_BYTES);
          if (parsed.error) return parsed.error;
          const p = parsed.data;

          const name = T(p.name, 90);
          const tagline = T(p.tagline, 260);
          const price = Math.round(Number(p.price));
          const duration = T(p.duration, 80);
          const team = T(p.team, 120);
          const sortOrder = Math.max(1, Math.min(99, Math.round(Number(p.sort_order || 5))));
          const rawDeliv = Array.isArray(p.deliverables) ? p.deliverables : [];
          const deliverables = rawDeliv.map((d) => T(String(d), 180)).filter(Boolean).slice(0, 12);

          if (name.length < 3 || tagline.length < 6) {
            return jsonRes({ error: 'Plan name and description are required.' }, 400);
          }
          if (!Number.isFinite(price) || price < 500 || price > 2500000) {
            return jsonRes({ error: 'Price must be between ₹500 and ₹25,00,000.' }, 400);
          }
          if (deliverables.length === 0) {
            return jsonRes({ error: 'Add at least one deliverable line.' }, 400);
          }

          const now = Date.now();
          const existingId = T(p.id || '', 64);

          if (existingId && /^[a-zA-Z0-9_-]{2,64}$/.test(existingId)) {
            const found = await env.DB.prepare('SELECT id FROM plans WHERE id=?').bind(existingId).first();
            if (found) {
              await env.DB.prepare(
                'UPDATE plans SET name=?, tagline=?, price=?, duration=?, team=?, deliverables=?, sort_order=?, updated_at=? WHERE id=?'
              )
                .bind(name, tagline, price, duration || '1 Day', team || 'Studio Crew', JSON.stringify(deliverables), sortOrder, now, existingId)
                .run();
              return jsonRes({ ok: true, id: existingId });
            }
          }

          const newId = slugifyId(name, 'plan');
          await env.DB.prepare(
            'INSERT INTO plans(id,name,tagline,price,duration,team,deliverables,sort_order,active,views,bookings,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,1,0,0,?,?)'
          )
            .bind(newId, name, tagline, price, duration || '1 Day', team || 'Studio Crew', JSON.stringify(deliverables), sortOrder, now, now)
            .run();
          return jsonRes({ ok: true, id: newId });
        }

        // Delete Plan
        if (method === 'DELETE' && path.startsWith('/api/v1/studio-cms/plans/')) {
          const id = T(path.slice('/api/v1/studio-cms/plans/'.length), 64);
          if (!/^[a-zA-Z0-9_-]{2,64}$/.test(id)) return jsonRes({ error: 'Invalid plan ID.' }, 400);
          const countRow = await env.DB.prepare('SELECT COUNT(*) AS c FROM plans WHERE active=1').first();
          if (countRow && Number(countRow.c) <= 1) {
            return jsonRes({ error: 'Keep at least one active plan on the website.' }, 400);
          }
          await env.DB.prepare('DELETE FROM plans WHERE id=?').bind(id).run();
          return jsonRes({ ok: true });
        }

        // Update Live Offer
        if (method === 'PUT' && path === '/api/v1/studio-cms/offer') {
          const parsed = await readJsonBody(request, MAX_JSON_BYTES);
          if (parsed.error) return parsed.error;
          const o = parsed.data;
          const percent = Math.max(0, Math.min(75, Math.round(Number(o.percent || 0))));
          const nextOffer = {
            active: Boolean(o.active) && percent > 0,
            title: T(o.title || 'Studio Offer', 70) || 'Studio Offer',
            percent,
            note: T(o.note || '', 220),
            validTill: T(o.validTill || '', 40)
          };
          await env.DB.prepare("INSERT OR REPLACE INTO settings(k,v) VALUES('offer', ?)")
            .bind(JSON.stringify(nextOffer))
            .run();
          return jsonRes({ ok: true, offer: nextOffer });
        }

        // Upload / Replace / Edit Media Image
        if (method === 'POST' && path === '/api/v1/studio-cms/media') {
          const parsed = await readJsonBody(request, MAX_UPLOAD_JSON_BYTES);
          if (parsed.error) return parsed.error;
          const m = parsed.data;

          const slot = T(m.slot || 'gallery', 24);
          const category = T(m.category || 'Wedding', 24);
          const title = T(m.title || '', 90);
          const location = T(m.location || '', 90);
          const wide = m.wide ? 1 : 0;
          const sortOrder = Math.max(1, Math.min(99, Math.round(Number(m.sort_order || 10))));
          const existingId = T(m.id || '', 64);

          if (!ALLOWED_SLOTS.has(slot)) return jsonRes({ error: 'Invalid page slot.' }, 400);
          if (!ALLOWED_CATEGORIES.has(category)) return jsonRes({ error: 'Invalid category.' }, 400);
          if (title.length < 2) return jsonRes({ error: 'Please provide an image title.' }, 400);

          const now = Date.now();
          let newSrc = null;
          let blobId = null;

          if (typeof m.imageData === 'string' && m.imageData.length > 0) {
            const match = /^data:(image\/(?:webp|jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(m.imageData.trim());
            if (!match) {
              return jsonRes({ error: 'Only WebP, JPEG, or PNG images are accepted.' }, 400);
            }
            const mime = match[1];
            const b64 = match[2];
            const approxBytes = Math.floor((b64.length * 3) / 4);
            if (approxBytes > MAX_DECODED_IMAGE_BYTES || approxBytes < 64) {
              return jsonRes({ error: 'Image must be under 280 KB after compression.' }, 400);
            }
            const hashHex = bytesToHex(await sha256Bytes(b64 + ':' + now)).slice(0, 16);
            blobId = `img_${hashHex}`;
            await env.DB.prepare(
              'INSERT OR REPLACE INTO media_blobs(id,mime,data_b64,size_bytes,created_at) VALUES(?,?,?,?,?)'
            )
              .bind(blobId, mime, b64, approxBytes, now)
              .run();
            newSrc = `/m/${blobId}`;
          }

          // Single-slot targets (home_portrait, about_craft) replace their dedicated row
          const targetId =
            slot === 'home_portrait'
              ? 'home-portrait-main'
              : slot === 'about_craft'
                ? 'about-craft-main'
                : existingId;

          if (targetId && /^[a-zA-Z0-9_-]{2,64}$/.test(targetId)) {
            const prev = await env.DB.prepare('SELECT id, src FROM media WHERE id=?').bind(targetId).first();
            if (prev) {
              const finalSrc = newSrc || prev.src;
              await env.DB.prepare(
                'UPDATE media SET slot=?, category=?, title=?, location=?, src=?, wide=?, sort_order=? WHERE id=?'
              )
                .bind(slot, category, title, location || 'Ananya Digital Studio', finalSrc, wide, sortOrder, targetId)
                .run();
              // Clean up previous blob if replaced
              if (newSrc && prev.src && prev.src.startsWith('/m/')) {
                const oldBlobId = prev.src.slice(3);
                if (oldBlobId !== blobId) {
                  await env.DB.prepare('DELETE FROM media_blobs WHERE id=?').bind(oldBlobId).run();
                }
              }
              return jsonRes({ ok: true, id: targetId, src: finalSrc });
            }
          }

          if (!newSrc) {
            return jsonRes({ error: 'Please select an image file to upload.' }, 400);
          }

          const mediaId = slugifyId(title, 'img');
          await env.DB.prepare(
            'INSERT INTO media(id,slot,category,title,location,src,wide,sort_order,created_at) VALUES(?,?,?,?,?,?,?,?,?)'
          )
            .bind(mediaId, slot, category, title, location || 'Ananya Digital Studio', newSrc, wide, sortOrder, now)
            .run();
          return jsonRes({ ok: true, id: mediaId, src: newSrc });
        }

        // Delete Media Item
        if (method === 'DELETE' && path.startsWith('/api/v1/studio-cms/media/')) {
          const id = T(path.slice('/api/v1/studio-cms/media/'.length), 64);
          if (!/^[a-zA-Z0-9_-]{2,64}$/.test(id)) return jsonRes({ error: 'Invalid media ID.' }, 400);
          const item = await env.DB.prepare('SELECT * FROM media WHERE id=?').bind(id).first();
          if (!item) return jsonRes({ error: 'Image not found.' }, 404);

          if (item.slot === 'home_portrait' || item.slot === 'about_craft') {
            return jsonRes({ error: 'Replace this primary slot image instead of deleting it so the page stays complete.' }, 400);
          }
          const sameSlotCount = await env.DB.prepare('SELECT COUNT(*) AS c FROM media WHERE slot=?').bind(item.slot).first();
          if (sameSlotCount && Number(sameSlotCount.c) <= 1) {
            return jsonRes({ error: 'Keep at least one image in this section.' }, 400);
          }

          await env.DB.prepare('DELETE FROM media WHERE id=?').bind(id).run();
          if (item.src && item.src.startsWith('/m/')) {
            await env.DB.prepare('DELETE FROM media_blobs WHERE id=?').bind(item.src.slice(3)).run();
          }
          return jsonRes({ ok: true });
        }

        // Delete handled booking inquiry
        if (method === 'DELETE' && path.startsWith('/api/v1/studio-cms/bookings/')) {
          const id = Number(path.slice('/api/v1/studio-cms/bookings/'.length));
          if (!Number.isInteger(id) || id <= 0) return jsonRes({ error: 'Invalid booking ID.' }, 400);
          await env.DB.prepare('DELETE FROM bookings WHERE id=?').bind(id).run();
          return jsonRes({ ok: true });
        }

        return jsonRes({ error: 'Endpoint not found.' }, 404);
      }

      return jsonRes({ error: 'Endpoint not found.' }, 404);
    }

    // 3. Static Assets Serving + No-Store HTML + Custom 404
    if (!env.ASSETS) {
      return new Response('Assets binding missing.', { status: 500, headers: buildSecurityHeaders() });
    }

    const assetRes = await env.ASSETS.fetch(request);
    if (assetRes.status === 404) {
      const nfUrl = new URL('/404.html', request.url);
      const nfRes = await env.ASSETS.fetch(new Request(nfUrl, { method: 'GET' }));
      const nfHeaders = new Headers(nfRes.headers);
      for (const [k, v] of Object.entries(buildSecurityHeaders({ 'Cache-Control': 'no-store, no-cache, must-revalidate' }))) {
        nfHeaders.set(k, v);
      }
      return new Response(nfRes.body, { status: 404, headers: nfHeaders });
    }

    const headers = new Headers(assetRes.headers);
    const isHtml =
      path === '/' ||
      path.endsWith('.html') ||
      (headers.get('Content-Type') || '').includes('text/html');

    for (const [k, v] of Object.entries(buildSecurityHeaders())) {
      headers.set(k, v);
    }
    if (isHtml) {
      headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    } else if (path.startsWith('/assets/photos/')) {
      headers.set('Cache-Control', 'public, max-age=604800');
    }

    return new Response(assetRes.body, {
      status: assetRes.status,
      statusText: assetRes.statusText,
      headers
    });
  }
};

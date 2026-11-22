/* ==========================================================================
   Ananya Digital Studio — Production Admin Command Center (Lazy-Loaded)
   Controls: Analytics & Trending Plan, Plans CRUD, Live Offer Switch,
   and Studio Photo Manager (Home, About Us, Photo Gallery) with WebP upload.
   ========================================================================== */

import { mountAdminSphere3D } from './scene3d.js';

const SLOT_LABELS = {
  home_hero: 'Home Hero & 3D Frame',
  home_portrait: 'Home Editorial Portrait',
  about_craft: 'About Us Studio Photo',
  gallery: 'Photo Gallery'
};

function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatINR(n) {
  return '₹' + Math.round(Number(n || 0)).toLocaleString('en-IN');
}

function formatTs(ms) {
  if (!ms) return '—';
  const d = new Date(Number(ms));
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

async function apiFetch(url, options = {}) {
  const opts = {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  };
  const res = await fetch(url, opts);
  let data = {};
  try {
    data = await res.json();
  } catch (_) {}
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

/* Client-side WebP/JPEG compressor keeping every upload <= 220 KB for free-tier D1 */
async function compressImageFile(file) {
  const bitmapUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not read the selected image file.'));
      el.src = bitmapUrl;
    });

    const maxEdge = 1200;
    let w = img.naturalWidth || img.width;
    let h = img.naturalHeight || img.height;
    if (w > maxEdge || h > maxEdge) {
      if (w >= h) {
        h = Math.round((h * maxEdge) / w);
        w = maxEdge;
      } else {
        w = Math.round((w * maxEdge) / h);
        h = maxEdge;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);

    // Prefer WebP, fall back to JPEG if browser lacks WebP encoder
    let mime = 'image/webp';
    let dataUrl = canvas.toDataURL(mime, 0.8);
    if (!dataUrl.startsWith('data:image/webp')) {
      mime = 'image/jpeg';
      dataUrl = canvas.toDataURL(mime, 0.8);
    }

    let quality = 0.72;
    while (dataUrl.length > 320000 && quality >= 0.42) {
      dataUrl = canvas.toDataURL(mime, quality);
      quality -= 0.1;
    }

    if (dataUrl.length > 360000) {
      // Scale down one more step if still dense
      canvas.width = Math.round(w * 0.75);
      canvas.height = Math.round(h * 0.75);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      dataUrl = canvas.toDataURL(mime, 0.72);
    }

    const kb = Math.round((dataUrl.length * 3) / 4 / 1024);
    return { dataUrl, kb, width: canvas.width, height: canvas.height };
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

function showAdminToast(message) {
  let el = document.getElementById('ananya-admin-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'ananya-admin-toast';
    el.className = 'admin-toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.hidden = false;
  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.hidden = true;
  }, 3400);
}

export async function mountAdminApp(rootEl, { onDataChanged } = {}) {
  const cleanups = [];
  let sphereCtrl = null;
  let state = null;
  let activeTab = 'analytics';
  let editingPlanId = null;
  let editingMediaId = null;
  let pendingImageData = '';
  let mediaSlotFilter = 'all';

  function disposeSphere() {
    if (sphereCtrl) {
      sphereCtrl.dispose();
      sphereCtrl = null;
    }
  }
  cleanups.push(disposeSphere);

  /* ---------- Login View ---------- */
  function renderLoginView(errMsg = '', adminConfigured = true) {
    disposeSphere();
    rootEl.innerHTML = `
      <section class="admin-login-wrap">
        <div class="admin-login-card">
          <span class="live-status-pill" style="margin-bottom:10px;">
            <span class="live-pulse-dot" aria-hidden="true"></span>
            <span>Ananya Studio Control</span>
          </span>
          <h1>Studio Admin Sign In</h1>
          <p>Sign in with your studio password to manage plans, live offers, website photos, and booking analytics.</p>
          ${
            !adminConfigured
              ? `<div class="field-error" style="color:#F5B8C4;margin-bottom:16px;">Set the <strong>ADMIN_PASSWORD</strong> secret in Cloudflare Worker Settings to enable sign-in.</div>`
              : ''
          }
          <form id="adm-login-form" novalidate>
            <div class="form-block" style="margin-bottom:16px;">
              <label class="form-label" for="adm-pass" style="color:var(--paper-text);">Admin Password</label>
              <input class="dark-input" id="adm-pass" type="password" autocomplete="current-password" placeholder="Enter studio password" required />
            </div>
            <div id="adm-login-err" class="field-error" style="color:#F5B8C4;margin-bottom:14px;">${esc(errMsg)}</div>
            <button type="submit" class="btn btn-brass" style="width:100%;" id="adm-login-btn">Sign In to Admin Panel</button>
          </form>
          <div style="margin-top:16px;text-align:center;">
            <a href="#/" style="font-size:0.86rem;color:var(--silver);text-decoration:underline;">Return to Public Website</a>
          </div>
        </div>
      </section>
    `;

    const form = rootEl.querySelector('#adm-login-form');
    const passInput = rootEl.querySelector('#adm-pass');
    const errEl = rootEl.querySelector('#adm-login-err');
    const btn = rootEl.querySelector('#adm-login-btn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pw = passInput.value;
      if (!pw) {
        errEl.textContent = 'Please enter your admin password.';
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Verifying...';
      errEl.textContent = '';
      try {
        await apiFetch('/api/v1/studio-auth/login', {
          method: 'POST',
          body: JSON.stringify({ password: pw })
        });
        await loadAndRenderDashboard();
      } catch (err) {
        errEl.textContent = err.message || 'Sign in failed.';
        btn.disabled = false;
        btn.textContent = 'Sign In to Admin Panel';
        passInput.value = '';
        passInput.focus();
      }
    });
  }

  /* ---------- Dashboard View ---------- */
  async function loadAndRenderDashboard() {
    try {
      state = await apiFetch('/api/v1/studio-cms/overview');
    } catch (err) {
      if (String(err.message).toLowerCase().includes('unauthorized')) {
        renderLoginView('Your session ended. Please sign in again.');
        return;
      }
      showAdminToast(err.message);
      return;
    }

    if (typeof onDataChanged === 'function') onDataChanged();
    renderDashboardShell();
  }

  function renderDashboardShell() {
    const { analytics, plans, offer, media, recentBookings } = state;
    const trendingPlan = plans.find((p) => p.id === analytics.trendingPlanId) || plans[0];

    const tabs = [
      { id: 'analytics', label: 'Analytics & Bookings' },
      { id: 'plans', label: `Plans (${plans.length})` },
      { id: 'offer', label: offer.active ? `Live Offer (${offer.percent}%)` : 'Live Offer (Off)' },
      { id: 'media', label: `Photos (${media.length})` }
    ];

    rootEl.innerHTML = `
      <section class="admin-hero">
        <div class="container admin-hero-grid">
          <div>
            <div class="live-status-pill">
              <span class="live-pulse-dot" aria-hidden="true"></span>
              <span>Live Studio Connected · Secure Session</span>
            </div>
            <h1 class="display-lg">Ananya Studio Command Center</h1>
            <p style="color:var(--silver);margin:10px 0 20px;max-width:52ch;">
              Update photography plans, launch live seasonal offers, replace website photos, and track which packages get the most visits and bookings.
            </p>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              <a class="btn btn-brass btn-sm" href="#/" target="_blank" rel="noopener noreferrer">Open Live Site</a>
              <button type="button" class="btn btn-ghost-dark btn-sm" id="adm-refresh-btn">Refresh Data</button>
              <button type="button" class="btn btn-ghost-dark btn-sm" id="adm-logout-btn">Sign Out All Devices</button>
            </div>
          </div>

          <div class="sphere-stage" id="admin-sphere-stage">
            <div class="sphere-fallback-rings" aria-hidden="true">
              <div class="sphere-fallback-inner"></div>
            </div>
            <div class="sphere-canvas-host" id="admin-sphere-host" aria-label="Interactive 3D studio activity sphere — drag to spin"></div>
            <div class="sphere-caption">
              <span>Studio Activity Sphere</span>
              <span>Drag to spin · Double-tap boost</span>
            </div>
          </div>
        </div>
      </section>

      <section class="admin-shell">
        <div class="container">
          <div class="admin-toolbar">
            <div class="segmented-control" id="admin-tabs" role="tablist" aria-label="Admin sections">
              <span class="seg-indicator" id="admin-tab-ind" aria-hidden="true"></span>
              ${tabs
                .map(
                  (t) =>
                    `<button type="button" role="tab" aria-selected="${t.id === activeTab}" class="seg-btn ${t.id === activeTab ? 'is-active' : ''}" data-adm-tab="${t.id}">${esc(t.label)}</button>`
                )
                .join('')}
            </div>
            <div style="font-size:0.86rem;color:var(--muted);">
              Trending now: <strong style="color:var(--burgundy);">${esc(trendingPlan ? trendingPlan.name : '—')}</strong>
            </div>
          </div>

          <div id="admin-tab-body"></div>
        </div>
      </section>
    `;

    // Mount 3D Studio Activity Sphere
    const sphereHost = rootEl.querySelector('#admin-sphere-host');
    const activityScore = analytics.totalBookings * 3 + Math.min(20, analytics.totalViews * 0.2);
    disposeSphere();
    mountAdminSphere3D(sphereHost, activityScore).then((ctrl) => {
      if (!document.body.contains(sphereHost)) {
        ctrl.dispose();
        return;
      }
      sphereCtrl = ctrl;
      if (ctrl.supported) {
        const fallback = rootEl.querySelector('.sphere-fallback-rings');
        if (fallback) fallback.style.display = 'none';
      }
    });

    // Tab switching + sliding indicator
    const tabWrap = rootEl.querySelector('#admin-tabs');
    const tabInd = rootEl.querySelector('#admin-tab-ind');
    const posTabInd = () => {
      const act = tabWrap.querySelector('.seg-btn.is-active');
      if (!act) return;
      tabInd.style.width = `${act.offsetWidth}px`;
      tabInd.style.transform = `translateX(${act.offsetLeft}px)`;
    };
    requestAnimationFrame(posTabInd);

    tabWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-adm-tab]');
      if (!btn) return;
      activeTab = btn.dataset.admTab;
      Array.from(tabWrap.querySelectorAll('.seg-btn')).forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', String(on));
      });
      posTabInd();
      renderActiveTab();
    });

    rootEl.querySelector('#adm-refresh-btn').addEventListener('click', async () => {
      showAdminToast('Refreshing live studio data...');
      await loadAndRenderDashboard();
    });

    rootEl.querySelector('#adm-logout-btn').addEventListener('click', async () => {
      try {
        await apiFetch('/api/v1/studio-auth/logout', { method: 'POST', body: '{}' });
      } catch (_) {}
      showAdminToast('Signed out from all devices.');
      renderLoginView('');
    });

    renderActiveTab();
  }

  function renderActiveTab() {
    const body = rootEl.querySelector('#admin-tab-body');
    if (!body) return;
    if (activeTab === 'analytics') renderAnalyticsTab(body);
    else if (activeTab === 'plans') renderPlansTab(body);
    else if (activeTab === 'offer') renderOfferTab(body);
    else if (activeTab === 'media') renderMediaTab(body);
  }

  /* ---------- TAB 1: ANALYTICS & RECENT BOOKINGS ---------- */
  function renderAnalyticsTab(container) {
    const { analytics, plans, offer, recentBookings } = state;
    const trendingPlan = plans.find((p) => p.id === analytics.trendingPlanId) || plans[0];
    const maxViews = Math.max(1, ...plans.map((p) => p.views));

    const barsHtml = plans
      .map((p) => {
        const isTrend = p.id === analytics.trendingPlanId;
        const rate = p.views > 0 ? Math.round((p.bookings / p.views) * 100) : 0;
        const viewPct = Math.max(4, Math.round((p.views / maxViews) * 100));
        const bookPct = Math.min(viewPct, Math.round((p.bookings / maxViews) * 100));
        return `
          <div class="bar-row">
            <div class="bar-row-top">
              <strong>
                ${esc(p.name)}
                ${isTrend ? ' <span class="badge-trending" style="margin-left:6px;padding:2px 9px;font-size:0.72rem;">Most Trending</span>' : ''}
              </strong>
              <span style="color:var(--muted);">
                <strong>${p.views}</strong> visits · <strong style="color:var(--burgundy);">${p.bookings}</strong> booked (${rate}% conv.)
              </span>
            </div>
            <div class="bar-track" aria-hidden="true">
              <div class="bar-fill-book" style="width:${bookPct}%;"></div>
              <div class="bar-fill-views" style="width:${Math.max(0, viewPct - bookPct)}%;"></div>
            </div>
          </div>`;
      })
      .join('');

    const bookingsHtml = recentBookings.length
      ? `
        <div class="table-scroll">
          <table class="bookings-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Plan &amp; Price</th>
                <th>Event Date &amp; Time</th>
                <th>Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${recentBookings
                .map((b) => {
                  const cleanPhone = String(b.customer_phone || '').replace(/[^0-9]/g, '');
                  const replyLink = cleanPhone.length >= 10
                    ? `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(`Namaste ${b.customer_name}, we received your booking request for ${b.plan_name} on ${b.event_date} at Ananya Digital Studio.`)}`
                    : '';
                  return `
                    <tr>
                      <td>
                        <strong>${esc(b.customer_name)}</strong>
                        ${b.customer_phone ? `<div style="font-size:0.8rem;color:var(--muted);">${esc(b.customer_phone)}</div>` : ''}
                        <div style="font-size:0.75rem;color:var(--muted);">${formatTs(b.created_at)}</div>
                      </td>
                      <td>
                        <strong>${esc(b.plan_name)}</strong>
                        <div style="font-size:0.84rem;color:var(--burgundy);font-weight:600;">${formatINR(b.quoted_price)}</div>
                        ${b.offer_applied ? `<div style="font-size:0.76rem;color:var(--forest);">${esc(b.offer_applied)}</div>` : ''}
                      </td>
                      <td>
                        <strong>${esc(b.event_date)}</strong>
                        <div style="font-size:0.82rem;color:var(--muted);">${esc(b.event_shift)} · ${esc(b.event_time)}</div>
                      </td>
                      <td style="max-width:220px;color:var(--muted);font-size:0.84rem;">${esc(b.notes || '—')}</td>
                      <td>
                        <div style="display:flex;gap:6px;flex-wrap:wrap;">
                          ${replyLink ? `<a class="btn btn-forest btn-sm" href="${replyLink}" target="_blank" rel="noopener noreferrer">Reply</a>` : ''}
                          <button type="button" class="btn btn-danger btn-sm" data-del-booking="${b.id}">Done</button>
                        </div>
                      </td>
                    </tr>`;
                })
                .join('')}
            </tbody>
          </table>
        </div>`
      : `<p style="color:var(--muted);margin:0;">No customer bookings logged yet. As soon as a couple submits the Booking page, their name, date, shift, and selected plan appear here automatically.</p>`;

    container.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Total Plan Visits</div>
          <div class="kpi-value">${analytics.totalViews.toLocaleString('en-IN')}</div>
          <div class="kpi-sub">Unique visitor views across plans</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Total Bookings Sent</div>
          <div class="kpi-value">${analytics.totalBookings.toLocaleString('en-IN')}</div>
          <div class="kpi-sub">WhatsApp orders initiated</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Booking Conversion</div>
          <div class="kpi-value">${analytics.conversionRate}%</div>
          <div class="kpi-sub">${offer.active ? `${offer.percent}% live offer running` : 'Standard pricing active'}</div>
        </div>
        <div class="kpi-card is-highlight">
          <div class="kpi-label">Most Trending Plan</div>
          <div class="kpi-value" style="font-size:1.38rem;">${esc(trendingPlan ? trendingPlan.name : '—')}</div>
          <div class="kpi-sub">${trendingPlan ? `${trendingPlan.views} visits · ${trendingPlan.bookings} booked` : ''}</div>
        </div>
      </div>

      <div class="admin-panel-card">
        <div class="admin-panel-head">
          <h2>Plan Performance Breakdown</h2>
          <span style="font-size:0.82rem;color:var(--muted);">Burgundy = Booked · Charcoal = Visits</span>
        </div>
        <div class="bar-list">${barsHtml}</div>
      </div>

      <div class="admin-panel-card">
        <div class="admin-panel-head">
          <h2>Recent Customer Booking Requests</h2>
          <span style="font-size:0.84rem;color:var(--muted);">${recentBookings.length} recorded</span>
        </div>
        ${bookingsHtml}
      </div>
    `;

    container.addEventListener('click', async (e) => {
      const delBtn = e.target.closest('[data-del-booking]');
      if (!delBtn) return;
      const id = delBtn.dataset.delBooking;
      delBtn.disabled = true;
      try {
        await apiFetch(`/api/v1/studio-cms/bookings/${id}`, { method: 'DELETE' });
        showAdminToast('Booking archived.');
        await loadAndRenderDashboard();
      } catch (err) {
        showAdminToast(err.message);
        delBtn.disabled = false;
      }
    });
  }

  /* ---------- TAB 2: PLANS & PRICING CRUD MANAGER ---------- */
  function renderPlansTab(container) {
    const { plans } = state;
    const editing = editingPlanId ? plans.find((p) => p.id === editingPlanId) : null;

    container.innerHTML = `
      <div class="admin-split">
        <div class="admin-panel-card">
          <div class="admin-panel-head">
            <h2>${editing ? 'Edit Plan' : 'Add New Photography Plan'}</h2>
            ${editing ? '<button type="button" class="btn btn-ghost-light btn-sm" id="plan-cancel-edit">Add New Instead</button>' : ''}
          </div>
          <form id="adm-plan-form">
            <div class="form-block" style="margin-bottom:14px;">
              <label class="form-label" for="pf-name">Plan Name *</label>
              <input class="text-input" id="pf-name" required value="${esc(editing ? editing.name : '')}" placeholder="e.g. Ring Ceremony &amp; Engagement" />
            </div>
            <div class="form-block field-row-2" style="margin-bottom:14px;">
              <div>
                <label class="form-label" for="pf-price">Base Price (₹) *</label>
                <input class="text-input" id="pf-price" type="number" min="500" max="2500000" required value="${esc(editing ? editing.price : '')}" placeholder="e.g. 19999" />
              </div>
              <div>
                <label class="form-label" for="pf-order">Display Order</label>
                <input class="text-input" id="pf-order" type="number" min="1" max="99" value="${esc(editing ? editing.sort_order : plans.length + 1)}" />
              </div>
            </div>
            <div class="form-block field-row-2" style="margin-bottom:14px;">
              <div>
                <label class="form-label" for="pf-dur">Duration *</label>
                <input class="text-input" id="pf-dur" required value="${esc(editing ? editing.duration : '')}" placeholder="e.g. 1 Day (6 Hours)" />
              </div>
              <div>
                <label class="form-label" for="pf-team">Crew / Team *</label>
                <input class="text-input" id="pf-team" required value="${esc(editing ? editing.team : '')}" placeholder="e.g. 2 Photographers + Video" />
              </div>
            </div>
            <div class="form-block" style="margin-bottom:14px;">
              <label class="form-label" for="pf-desc">Short Description *</label>
              <textarea class="text-area" id="pf-desc" required placeholder="Explain who this package is built for...">${esc(editing ? editing.tagline : '')}</textarea>
            </div>
            <div class="form-block" style="margin-bottom:18px;">
              <label class="form-label" for="pf-deliv">What's Included (One item per line) *</label>
              <textarea class="text-area" id="pf-deliv" style="min-height:120px;" required placeholder="200+ edited photographs&#10;3-minute highlight reel&#10;Online gallery link">${esc(editing ? editing.deliverables.join('\n') : '')}</textarea>
            </div>
            <button type="submit" class="btn btn-primary" id="pf-submit">${editing ? 'Save Plan Changes' : 'Publish New Plan'}</button>
          </form>
        </div>

        <div class="admin-panel-card">
          <div class="admin-panel-head">
            <h2>Active Website Plans</h2>
            <span style="font-size:0.84rem;color:var(--muted);">Changes appear live immediately</span>
          </div>
          <div class="cms-list">
            ${plans
              .map(
                (p) => `
                <div class="cms-item">
                  <div>
                    <strong style="font-size:1rem;">${esc(p.name)}</strong>
                    <div style="font-size:0.86rem;color:var(--burgundy);font-weight:600;margin-top:2px;">${formatINR(p.price)} · ${esc(p.duration)}</div>
                    <div style="font-size:0.82rem;color:var(--muted);margin-top:4px;">${p.views} visits · ${p.bookings} booked · ${p.deliverables.length} deliverables</div>
                  </div>
                  <div class="cms-item-actions">
                    <button type="button" class="btn btn-ghost-light btn-sm" data-edit-plan="${esc(p.id)}">Edit</button>
                    <button type="button" class="btn btn-danger btn-sm" data-del-plan="${esc(p.id)}">Delete</button>
                  </div>
                </div>`
              )
              .join('')}
          </div>
        </div>
      </div>
    `;

    const cancelBtn = container.querySelector('#plan-cancel-edit');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        editingPlanId = null;
        renderPlansTab(container);
      });
    }

    container.querySelector('#adm-plan-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = container.querySelector('#pf-submit');
      const deliverables = container
        .querySelector('#pf-deliv')
        .value.split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        id: editing ? editing.id : undefined,
        name: container.querySelector('#pf-name').value.trim(),
        price: Number(container.querySelector('#pf-price').value),
        sort_order: Number(container.querySelector('#pf-order').value || 1),
        duration: container.querySelector('#pf-dur').value.trim(),
        team: container.querySelector('#pf-team').value.trim(),
        tagline: container.querySelector('#pf-desc').value.trim(),
        deliverables
      };

      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';
      try {
        await apiFetch('/api/v1/studio-cms/plans', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        editingPlanId = null;
        showAdminToast('Plan saved live to website.');
        await loadAndRenderDashboard();
      } catch (err) {
        showAdminToast(err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = editing ? 'Save Plan Changes' : 'Publish New Plan';
      }
    });

    container.addEventListener('click', async (e) => {
      const ed = e.target.closest('[data-edit-plan]');
      if (ed) {
        editingPlanId = ed.dataset.editPlan;
        renderPlansTab(container);
        return;
      }
      const del = e.target.closest('[data-del-plan]');
      if (del) {
        const pid = del.dataset.delPlan;
        if (!window.confirm('Delete this plan from the live website?')) return;
        del.disabled = true;
        try {
          await apiFetch(`/api/v1/studio-cms/plans/${encodeURIComponent(pid)}`, { method: 'DELETE' });
          if (editingPlanId === pid) editingPlanId = null;
          showAdminToast('Plan deleted.');
          await loadAndRenderDashboard();
        } catch (err) {
          showAdminToast(err.message);
          del.disabled = false;
        }
      }
    });
  }

  /* ---------- TAB 3: LIVE OFFER CONTROLLER ---------- */
  function renderOfferTab(container) {
    const { offer, plans } = state;
    let liveActive = Boolean(offer.active);

    container.innerHTML = `
      <div class="admin-split">
        <div class="admin-panel-card">
          <div class="admin-panel-head">
            <h2>Live Studio Offer Control</h2>
          </div>
          <div class="switch-row">
            <div>
              <strong>Offer Banner &amp; Automatic Discount</strong>
              <div style="font-size:0.84rem;color:var(--muted);">Turns the seasonal offer ON or OFF across Home, Plans, and WhatsApp Booking</div>
            </div>
            <button type="button" id="offer-toggle" class="toggle-switch ${liveActive ? 'is-on' : ''}" role="switch" aria-checked="${liveActive}" aria-label="Toggle live offer"></button>
          </div>
          <form id="adm-offer-form">
            <div class="form-block field-row-2" style="margin-bottom:14px;">
              <div>
                <label class="form-label" for="of-title">Offer Title</label>
                <input class="text-input" id="of-title" value="${esc(offer.title)}" placeholder="e.g. Wedding Season Offer" required />
              </div>
              <div>
                <label class="form-label" for="of-pct">Discount Percent (%)</label>
                <input class="text-input" id="of-pct" type="number" min="0" max="75" value="${esc(offer.percent)}" required />
              </div>
            </div>
            <div class="form-block" style="margin-bottom:14px;">
              <label class="form-label" for="of-note">Offer Banner Message</label>
              <input class="text-input" id="of-note" value="${esc(offer.note)}" placeholder="e.g. Flat 15% off on all wedding packages booked this week" />
            </div>
            <div class="form-block" style="margin-bottom:18px;">
              <label class="form-label" for="of-valid">Valid Till Text</label>
              <input class="text-input" id="of-valid" value="${esc(offer.validTill)}" placeholder="e.g. 31 Dec 2026" />
            </div>
            <button type="submit" class="btn btn-forest" id="of-save-btn">Update Live Offer</button>
          </form>
        </div>

        <div class="admin-panel-card">
          <div class="admin-panel-head">
            <h2>Live Price Preview</h2>
            <span style="font-size:0.82rem;color:var(--muted);">What customers see right now</span>
          </div>
          <div class="cms-list" id="offer-price-preview"></div>
        </div>
      </div>
    `;

    const toggleBtn = container.querySelector('#offer-toggle');
    const pctInput = container.querySelector('#of-pct');
    const previewList = container.querySelector('#offer-price-preview');

    function syncPreview() {
      const pct = liveActive ? Math.max(0, Math.min(75, Number(pctInput.value || 0))) : 0;
      previewList.innerHTML = plans
        .map((p) => {
          const finalP = pct > 0 ? Math.round((p.price * (100 - pct)) / 100) : p.price;
          return `
            <div class="cms-item">
              <div>
                <strong>${esc(p.name)}</strong>
                <div style="font-size:0.82rem;color:var(--muted);">Base: ${formatINR(p.price)}</div>
              </div>
              <div style="text-align:right;">
                <strong style="color:var(--burgundy);font-size:1.05rem;">${formatINR(finalP)}</strong>
                <div style="font-size:0.78rem;color:var(--forest);">${pct > 0 ? `-${pct}% applied` : 'Regular price'}</div>
              </div>
            </div>`;
        })
        .join('');
    }

    toggleBtn.addEventListener('click', () => {
      liveActive = !liveActive;
      toggleBtn.classList.toggle('is-on', liveActive);
      toggleBtn.setAttribute('aria-checked', String(liveActive));
      syncPreview();
    });
    pctInput.addEventListener('input', syncPreview);
    syncPreview();

    container.querySelector('#adm-offer-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = container.querySelector('#of-save-btn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
      try {
        await apiFetch('/api/v1/studio-cms/offer', {
          method: 'PUT',
          body: JSON.stringify({
            active: liveActive,
            title: container.querySelector('#of-title').value.trim(),
            percent: Number(pctInput.value || 0),
            note: container.querySelector('#of-note').value.trim(),
            validTill: container.querySelector('#of-valid').value.trim()
          })
        });
        showAdminToast(liveActive ? 'Live offer published across website!' : 'Offer switched off.');
        await loadAndRenderDashboard();
      } catch (err) {
        showAdminToast(err.message);
        saveBtn.disabled = false;
        saveBtn.textContent = 'Update Live Offer';
      }
    });
  }

  /* ---------- TAB 4: STUDIO MEDIA & PHOTO MANAGER (HOME, ABOUT, GALLERY) ---------- */
  function renderMediaTab(container) {
    const { media } = state;
    const editing = editingMediaId ? media.find((m) => m.id === editingMediaId) : null;
    const filteredMedia = mediaSlotFilter === 'all' ? media : media.filter((m) => m.slot === mediaSlotFilter);

    container.innerHTML = `
      <div class="admin-panel-card">
        <div class="admin-panel-head">
          <h2>${editing ? 'Edit / Replace Website Photo' : 'Upload Photo to Home, About Us, or Gallery'}</h2>
          ${editing ? '<button type="button" class="btn btn-ghost-light btn-sm" id="media-cancel-edit">Upload New Photo Instead</button>' : ''}
        </div>
        <form id="adm-media-form">
          <div class="field-row-2" style="margin-bottom:14px;">
            <div>
              <label class="form-label" for="mf-slot">Where Should This Photo Appear? *</label>
              <select class="text-input" id="mf-slot">
                <option value="gallery" ${(!editing || editing.slot === 'gallery') ? 'selected' : ''}>Photo Gallery Page</option>
                <option value="home_hero" ${(editing && editing.slot === 'home_hero') ? 'selected' : ''}>Home Page · 3D Hero &amp; Preview</option>
                <option value="home_portrait" ${(editing && editing.slot === 'home_portrait') ? 'selected' : ''}>Home Page · Main Editorial Portrait (Replaces current)</option>
                <option value="about_craft" ${(editing && editing.slot === 'about_craft') ? 'selected' : ''}>About Us Page · Main Studio Photo (Replaces current)</option>
              </select>
            </div>
            <div>
              <label class="form-label" for="mf-cat">Gallery Category *</label>
              <select class="text-input" id="mf-cat">
                ${['Wedding', 'Pre-Wedding', 'Candid', 'Portraits', 'Events', 'Studio']
                  .map((c) => `<option value="${c}" ${(editing && editing.category === c) ? 'selected' : ''}>${c}</option>`)
                  .join('')}
              </select>
            </div>
          </div>

          <div class="field-row-2" style="margin-bottom:14px;">
            <div>
              <label class="form-label" for="mf-title">Photo Title *</label>
              <input class="text-input" id="mf-title" required value="${esc(editing ? editing.title : '')}" placeholder="e.g. Royal Varmala at Fatehgarh" />
            </div>
            <div>
              <label class="form-label" for="mf-loc">Caption / Venue / Lens</label>
              <input class="text-input" id="mf-loc" value="${esc(editing ? editing.location : '')}" placeholder="e.g. Farrukhabad · 85mm Prime" />
            </div>
          </div>

          <div class="form-block" style="margin-bottom:16px;">
            <label class="form-label" for="mf-file">${editing ? 'Replace Image File (Optional — leave empty to keep current photo)' : 'Choose Photo From Phone or PC *'}</label>
            <label class="upload-drop" for="mf-file" style="display:block;">
              <input id="mf-file" type="file" accept="image/*" style="display:none;" />
              <strong id="mf-file-status">Tap to choose a photo (auto-compressed to fast WebP under 220 KB)</strong>
              <img id="mf-preview" class="upload-preview-img" src="${editing ? esc(editing.src) : ''}" ${editing ? '' : 'hidden'} alt="Selected preview" />
            </label>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">
            <label style="display:inline-flex;align-items:center;gap:8px;font-size:0.9rem;cursor:pointer;">
              <input type="checkbox" id="mf-wide" ${editing && editing.wide ? 'checked' : ''} />
              <span>Span wide (2 columns) inside Photo Gallery</span>
            </label>
            <button type="submit" class="btn btn-primary" id="mf-save-btn">${editing ? 'Save Photo Update' : 'Upload & Publish Photo'}</button>
          </div>
        </form>
      </div>

      <div class="admin-panel-card">
        <div class="admin-panel-head">
          <h2>Current Live Photos (${filteredMedia.length})</h2>
          <div style="display:flex;gap:6px;flex-wrap:wrap;" id="media-slot-filters">
            ${[
              ['all', 'All'],
              ['home_hero', 'Home Hero'],
              ['home_portrait', 'Home Portrait'],
              ['about_craft', 'About Us'],
              ['gallery', 'Gallery']
            ]
              .map(
                ([k, lbl]) =>
                  `<button type="button" class="btn btn-sm ${mediaSlotFilter === k ? 'btn-primary' : 'btn-ghost-light'}" data-mslot="${k}">${lbl}</button>`
              )
              .join('')}
          </div>
        </div>

        <div class="media-admin-grid">
          ${filteredMedia
            .map(
              (m) => `
              <article class="media-admin-card">
                <div class="media-admin-thumb">
                  <img src="${esc(m.src)}" alt="${esc(m.title)}" loading="lazy" />
                  <span class="media-slot-badge">${esc(SLOT_LABELS[m.slot] || m.slot)}</span>
                </div>
                <div class="media-admin-body">
                  <div>
                    <strong style="font-size:0.95rem;">${esc(m.title)}</strong>
                    <div style="font-size:0.8rem;color:var(--muted);">${esc(m.category)} · ${esc(m.location)}</div>
                  </div>
                  <div class="cms-item-actions" style="margin-top:6px;">
                    <button type="button" class="btn btn-ghost-light btn-sm" data-edit-media="${esc(m.id)}">Edit / Replace</button>
                    ${
                      m.slot === 'gallery' || m.slot === 'home_hero'
                        ? `<button type="button" class="btn btn-danger btn-sm" data-del-media="${esc(m.id)}">Remove</button>`
                        : ''
                    }
                  </div>
                </div>
              </article>`
            )
            .join('')}
        </div>
      </div>
    `;

    const cancelEdit = container.querySelector('#media-cancel-edit');
    if (cancelEdit) {
      cancelEdit.addEventListener('click', () => {
        editingMediaId = null;
        pendingImageData = '';
        renderMediaTab(container);
      });
    }

    const fileInput = container.querySelector('#mf-file');
    const fileStatus = container.querySelector('#mf-file-status');
    const previewImg = container.querySelector('#mf-preview');

    fileInput.addEventListener('change', async () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return;
      fileStatus.textContent = 'Optimizing photo to WebP...';
      try {
        const res = await compressImageFile(f);
        pendingImageData = res.dataUrl;
        previewImg.src = res.dataUrl;
        previewImg.hidden = false;
        fileStatus.textContent = `Ready: ${res.width}×${res.height}px (${res.kb} KB optimized)`;
      } catch (err) {
        pendingImageData = '';
        fileStatus.textContent = err.message;
      }
    });

    container.querySelector('#adm-media-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = container.querySelector('#mf-save-btn');
      if (!editing && !pendingImageData) {
        showAdminToast('Please choose an image file first.');
        return;
      }
      saveBtn.disabled = true;
      saveBtn.textContent = 'Publishing...';
      try {
        await apiFetch('/api/v1/studio-cms/media', {
          method: 'POST',
          body: JSON.stringify({
            id: editing ? editing.id : undefined,
            slot: container.querySelector('#mf-slot').value,
            category: container.querySelector('#mf-cat').value,
            title: container.querySelector('#mf-title').value.trim(),
            location: container.querySelector('#mf-loc').value.trim(),
            wide: container.querySelector('#mf-wide').checked,
            imageData: pendingImageData || ''
          })
        });
        editingMediaId = null;
        pendingImageData = '';
        showAdminToast('Website photo updated live!');
        await loadAndRenderDashboard();
      } catch (err) {
        showAdminToast(err.message);
        saveBtn.disabled = false;
        saveBtn.textContent = editing ? 'Save Photo Update' : 'Upload & Publish Photo';
      }
    });

    container.addEventListener('click', async (e) => {
      const mf = e.target.closest('[data-mslot]');
      if (mf) {
        mediaSlotFilter = mf.dataset.mslot;
        renderMediaTab(container);
        return;
      }
      const ed = e.target.closest('[data-edit-media]');
      if (ed) {
        editingMediaId = ed.dataset.editMedia;
        pendingImageData = '';
        renderMediaTab(container);
        window.scrollTo({ top: 180, behavior: 'smooth' });
        return;
      }
      const del = e.target.closest('[data-del-media]');
      if (del) {
        if (!window.confirm('Remove this photo from the website?')) return;
        del.disabled = true;
        try {
          await apiFetch(`/api/v1/studio-cms/media/${encodeURIComponent(del.dataset.delMedia)}`, { method: 'DELETE' });
          showAdminToast('Photo removed.');
          await loadAndRenderDashboard();
        } catch (err) {
          showAdminToast(err.message);
          del.disabled = false;
        }
      }
    });
  }

  /* ---------- Bootstrap Admin Session Check ---------- */
  rootEl.innerHTML = `<section class="admin-login-wrap"><p style="color:var(--silver);">Checking studio session...</p></section>`;
  try {
    const sess = await apiFetch('/api/v1/studio-auth/session');
    if (sess.authenticated) {
      await loadAndRenderDashboard();
    } else {
      renderLoginView('', sess.adminConfigured !== false);
    }
  } catch (_) {
    renderLoginView('Could not connect to studio server. Deploy on Cloudflare Workers with D1 attached.', true);
  }

  return () => cleanups.forEach((fn) => fn());
}

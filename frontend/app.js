/**
 * RideShare Studio — app.js
 *
 * • Loads Leaflet + OpenStreetMap tiles (no API key needed)
 * • Geocoding via Nominatim on pickup/dropoff blur
 * • Routing via OSRM: draws route polyline + shows distance/ETA/fare
 * • Pickup/dropoff trip markers + animated driver pins (simulated)
 * • Booking form POSTs to /api/bookings
 * • Bottom-sheet open/close
 * • API connectivity status (pulse dot only — no data panels)
 */

/* ── Config ─────────────────────────────────────────────────── */
const cfg = window.RIDE_SHARE_CONFIG || {};
const API = cfg.apiBaseUrl || 'http://localhost:3000/api';
const TOKEN = cfg.devAuthToken || 'ride-share-dev-token';

/* ── State ──────────────────────────────────────────────────── */
const state = {
  map: null,
  routeLayer: null,
  driverMarkers: [],
  pickupMarker: null,
  dropoffMarker: null,
  sheetOpen: false,
  pickupCoords: null,
  dropoffCoords: null,
};

/* ── DOM refs ────────────────────────────────────────────────── */
const el = {};

/* ── Helpers ─────────────────────────────────────────────────── */
function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ── API fetch ───────────────────────────────────────────────── */
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = typeof body === 'object' ? (body.error || body.message || 'Request failed') : body;
    throw new Error(msg);
  }
  return body;
}

/* ── API health ping ─────────────────────────────────────────── */
async function pingApi() {
  try {
    await apiFetch('/status');
    el.apiDot.className = 'pulse-dot online';
    el.apiStatusText.textContent = 'API Online';
  } catch {
    el.apiDot.className = 'pulse-dot offline';
    el.apiStatusText.textContent = 'API Offline';
  }
}

function startApiHealthCheck() {
  const check = () => {
    startApiHealthCheck();
  };

  check();
  setInterval(check, 10000);
}

/* ── Booking form ────────────────────────────────────────────── */
async function handleBooking(evt) {
  evt.preventDefault();
  const fd = new FormData(evt.currentTarget);
  const pickup = fd.get('pickup')?.trim() || el.peekPickup.value.trim() || 'Koramangala';
  const dropoff = fd.get('dropoff')?.trim() || el.peekDropoff.value.trim() || 'Indiranagar';
  const fare = Number(fd.get('fare')) || 450;

  setResult('Submitting booking…', '');
  el.btnBook.disabled = true;

  try {
    const result = await apiFetch('/bookings', {
      method: 'POST',
      body: JSON.stringify({
        userId: cfg.demoUserId || 5,
        pickupLocation: { address: pickup },
        dropoffLocation: { address: dropoff },
        estimatedFare: fare,
      }),
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const id = result._id || result.id || '–';
    setResult(`✅ Booking created: ${esc(id)}`, 'success');
  } catch (err) {
    setResult(`❌ ${esc(err.message)}`, 'error');
  } finally {
    el.btnBook.disabled = false;
  }
}

function setResult(text, cls) {
  el.bookingResult.innerHTML = text;
  el.bookingResult.className = 'booking-result ' + cls;
}

/* ── Sheet toggle ────────────────────────────────────────────── */
function openSheet() { state.sheetOpen = true; el.sheet.classList.add('open'); el.sheetHandleZone.setAttribute('aria-expanded', 'true'); }
function closeSheet() { state.sheetOpen = false; el.sheet.classList.remove('open'); el.sheetHandleZone.setAttribute('aria-expanded', 'false'); }
function toggleSheet() { state.sheetOpen ? closeSheet() : openSheet(); }

/* Build an SVG data-URI marker */
function markerSvg(color = '#00e5a0', size = 36, emoji = '🚗') {
  const s = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${color}" fill-opacity="0.22"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 4}" fill="${color}" fill-opacity="0.88"/>
    <text x="${size / 2}" y="${size / 2 + 5}" font-size="${size * 0.38}" text-anchor="middle" fill="#04180e">${emoji}</text>
  </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(s);
}

function carIcon() {
  return window.L.icon({
    iconUrl: markerSvg('#00e5a0', 34, '🚗'),
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

/* Place simulated driver dots around the map centre */
function spawnDriverPins(count = 8) {
  if (!state.map || !window.L) return;
  state.driverMarkers.forEach(m => state.map.removeLayer(m));
  state.driverMarkers = [];

  const centre = cfg.defaultCenter || { lat: 12.9716, lng: 77.5946 };
  const spread = 0.045;

  for (let i = 0; i < count; i++) {
    const lat = centre.lat + (Math.random() - 0.5) * spread * 2;
    const lng = centre.lng + (Math.random() - 0.5) * spread * 2;

    const marker = window.L.marker([lat, lng], {
      icon: carIcon(),
      title: `Driver ${i + 1}`,
    }).addTo(state.map);

    driftMarker(marker, lat, lng);
    state.driverMarkers.push(marker);
  }
}

/* Gently drift a marker to simulate live movement */
function driftMarker(marker, baseLat, baseLng) {
  let angle = Math.random() * Math.PI * 2;
  const speed = 0.0010;
  function step() {
    angle += (Math.random() - 0.5) * 0.5;
    marker.setLatLng([
      baseLat + Math.sin(angle) * speed,
      baseLng + Math.cos(angle) * speed,
    ]);
    setTimeout(step, 1800 + Math.random() * 2200);
  }
  setTimeout(step, Math.random() * 3000);
}

/* Add/refresh pickup + dropoff pins on the map */
function updateTripMarkers() {
  if (!state.map) return;
  if (state.pickupMarker) { state.map.removeLayer(state.pickupMarker); state.pickupMarker = null; }
  if (state.dropoffMarker) { state.map.removeLayer(state.dropoffMarker); state.dropoffMarker = null; }

  if (state.pickupCoords) {
    state.pickupMarker = window.L.marker(
      [state.pickupCoords.lat, state.pickupCoords.lng],
      { icon: window.L.icon({ iconUrl: markerSvg('#00e5a0', 30, '🟢'), iconSize: [30, 30], iconAnchor: [15, 15] }) }
    ).addTo(state.map);
  }
  if (state.dropoffCoords) {
    state.dropoffMarker = window.L.marker(
      [state.dropoffCoords.lat, state.dropoffCoords.lng],
      { icon: window.L.icon({ iconUrl: markerSvg('#ff4d8a', 30, '🔴'), iconSize: [30, 30], iconAnchor: [15, 15] }) }
    ).addTo(state.map);
  }
}

/* ── Load Leaflet library (CSS + JS from CDN, no key needed) ──── */
function loadLeafletAssets() {
  return new Promise((resolve, reject) => {
    if (window.L) { resolve(); return; }

    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Leaflet failed to load.'));
    document.head.appendChild(script);
  });
}

/* ── Init map ────────────────────────────────────────────────── */
async function loadMap() {
  await loadLeafletAssets();

  // Hide placeholder
  const ph = document.getElementById('mapPlaceholder');
  if (ph) ph.style.display = 'none';

  const centre = cfg.defaultCenter || { lat: 12.9716, lng: 77.5946 };
  state.map = window.L.map('map', {
    center: [centre.lat, centre.lng],
    zoom: cfg.defaultZoom || 13,
    zoomControl: false,
  });

  window.L.tileLayer(cfg.osmTileUrl || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(state.map);

  // Wire geocoding on pickup/dropoff
  setupGeocoding();

  // Spawn simulated driver pins
  spawnDriverPins(8);

  el.mapStatusText.textContent = 'Map: Live ✓';
}

/* ── Geocoding via Nominatim (Google Places Autocomplete replacement) */
async function geocode(query) {
  if (!query) return null;
  const base = cfg.nominatimBaseUrl || 'https://nominatim.openstreetmap.org';
  const url = `${base}/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

function setupGeocoding() {
  // Pair: [booking-form input, peek-row mirror, state key]
  const pairs = [
    [el.inputPickup, el.peekPickup, 'pickupCoords'],
    [el.inputDropoff, el.peekDropoff, 'dropoffCoords'],
  ];

  pairs.forEach(([primary, mirror, coordKey]) => {
    const onResolve = async () => {
      const addr = primary.value.trim();
      if (mirror) mirror.value = addr;
      state[coordKey] = await geocode(addr);
      tryDrawRoute();
    };
    primary.addEventListener('change', onResolve);
    if (mirror) {
      mirror.addEventListener('input', () => { primary.value = mirror.value; });
      mirror.addEventListener('change', onResolve);
    }
  });

  // Keep peek mirrors synced when user types directly in the form
  el.inputPickup.addEventListener('input', () => { el.peekPickup.value = el.inputPickup.value; });
  el.inputDropoff.addEventListener('input', () => { el.peekDropoff.value = el.inputDropoff.value; });
}

/* ── Routing via OSRM ────────────────────────────────────────── */
async function tryDrawRoute() {
  if (!state.map) return;
  if (!state.pickupCoords || !state.dropoffCoords) return;

  updateTripMarkers();

  const base = cfg.osrmBaseUrl || 'https://router.project-osrm.org';
  const { lat: lat1, lng: lng1 } = state.pickupCoords;
  const { lat: lat2, lng: lng2 } = state.dropoffCoords;
  const url = `${base}/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) throw new Error('No route found');

    if (state.routeLayer) state.map.removeLayer(state.routeLayer);
    state.routeLayer = window.L.geoJSON(route.geometry, {
      style: { color: '#00e5a0', weight: 5, opacity: 0.9 },
    }).addTo(state.map);
    state.map.fitBounds(state.routeLayer.getBounds(), { padding: [40, 40] });

    const km = route.distance / 1000;
    const mins = Math.round(route.duration / 60);
    const fare = Math.round(50 + km * 15); // ₹50 base + ₹15/km

    el.routeDistance.textContent = `${km.toFixed(1)} km`;
    el.routeEta.textContent = `${mins} min`;
    el.routeFareEstimate.textContent = `₹${fare}`;
    el.inputFare.value = fare;
    el.routeInfo.classList.remove('hidden');
  } catch (err) {
    console.warn('OSRM routing:', err.message);
    el.routeInfo.classList.add('hidden');
  }
}

/* ── Wire events ─────────────────────────────────────────────── */
function wireEvents() {
  // Sheet handle
  el.sheetHandleZone.addEventListener('click', toggleSheet);
  el.sheetHandleZone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSheet(); }
  });

  // Tapping the peek inputs opens the sheet
  el.peekPickup.addEventListener('focus', openSheet);
  el.peekDropoff.addEventListener('focus', openSheet);

  // Tapping the map closes the sheet
  document.getElementById('map').addEventListener('click', closeSheet);

  // Form submission
  el.bookingForm.addEventListener('submit', handleBooking);
}

/* ── Boot ────────────────────────────────────────────────────── */
async function boot() {
  // Collect DOM refs
  el.sheet = document.getElementById('sheet');
  el.sheetHandleZone = document.getElementById('sheetHandleZone');
  el.sheetBody = document.getElementById('sheetBody');
  el.peekPickup = document.getElementById('peekPickup');
  el.peekDropoff = document.getElementById('peekDropoff');
  el.inputPickup = document.getElementById('inputPickup');
  el.inputDropoff = document.getElementById('inputDropoff');
  el.inputFare = document.getElementById('inputFare');
  el.routeInfo = document.getElementById('routeInfo');
  el.routeDistance = document.getElementById('routeDistance');
  el.routeEta = document.getElementById('routeEta');
  el.routeFareEstimate = document.getElementById('routeFareEstimate');
  el.bookingForm = document.getElementById('bookingForm');
  el.bookingResult = document.getElementById('bookingResult');
  el.btnBook = document.getElementById('btnBook');
  el.apiDot = document.getElementById('apiDot');
  el.apiStatusText = document.getElementById('apiStatusText');
  el.mapStatusText = document.getElementById('mapStatusText');

  wireEvents();

  // Ping API (status dot only — no data panels)
  startApiHealthCheck();

  // Load map (Leaflet + OpenStreetMap — no key, no signup)
  try {
    el.mapStatusText.textContent = 'Map: Loading…';
    await loadMap();
  } catch (err) {
    console.error('Map error:', err);
    el.mapStatusText.textContent = 'Map: Error';
  }
}

window.addEventListener('DOMContentLoaded', boot);

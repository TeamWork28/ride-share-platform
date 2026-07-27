/**
 * RideShare Studio — app.js
 *
 * • Loads Google Maps (dark theme) automatically from config
 * • Places Autocomplete on pickup + dropoff
 * • Directions API: draws route polyline + shows distance/ETA/fare
 * • Animated driver pins (simulated live positions)
 * • Booking form POSTs to /api/bookings
 * • Bottom-sheet open/close
 * • API connectivity status (pulse dot only — no data panels)
 */

/* ── Config ─────────────────────────────────────────────────── */
const cfg   = window.RIDE_SHARE_CONFIG || {};
const API   = cfg.apiBaseUrl   || 'http://localhost:3000/api';
const TOKEN = cfg.devAuthToken || 'ride-share-dev-token';

/* ── State ──────────────────────────────────────────────────── */
const state = {
  googleMap:           null,
  directionsRenderer:  null,
  driverMarkers:       [],
  sheetOpen:           false,
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
  const res  = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body   = isJson ? await res.json() : await res.text();
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
    el.apiDot.className      = 'pulse-dot online';
    el.apiStatusText.textContent = 'API Online';
  } catch {
    el.apiDot.className      = 'pulse-dot offline';
    el.apiStatusText.textContent = 'API Offline';
  }
}

/* ── Booking form ────────────────────────────────────────────── */
async function handleBooking(evt) {
  evt.preventDefault();
  const fd      = new FormData(evt.currentTarget);
  const pickup  = fd.get('pickup')?.trim()  || el.peekPickup.value.trim()  || 'Koramangala';
  const dropoff = fd.get('dropoff')?.trim() || el.peekDropoff.value.trim() || 'Indiranagar';
  const fare    = Number(fd.get('fare'))   || 450;

  setResult('Submitting booking…', '');
  el.btnBook.disabled = true;

  try {
    const result = await apiFetch('/bookings', {
      method: 'POST',
      body: JSON.stringify({
        userId:          cfg.demoUserId || 5,
        pickupLocation:  { address: pickup },
        dropoffLocation: { address: dropoff },
        estimatedFare:   fare,
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
  el.bookingResult.innerHTML  = text;
  el.bookingResult.className  = 'booking-result ' + cls;
}

/* ── Sheet toggle ────────────────────────────────────────────── */
function openSheet()   { state.sheetOpen = true;  el.sheet.classList.add('open');    el.sheetHandleZone.setAttribute('aria-expanded','true');  }
function closeSheet()  { state.sheetOpen = false; el.sheet.classList.remove('open'); el.sheetHandleZone.setAttribute('aria-expanded','false'); }
function toggleSheet() { state.sheetOpen ? closeSheet() : openSheet(); }

/* ── Google Maps dark theme ──────────────────────────────────── */
const DARK_STYLE = [
  { elementType: 'geometry',                         stylers: [{ color: '#060d1a' }] },
  { elementType: 'labels.text.stroke',               stylers: [{ color: '#060d1a' }] },
  { elementType: 'labels.text.fill',                 stylers: [{ color: '#5a7a9e' }] },
  { featureType: 'road',      elementType: 'geometry',        stylers: [{ color: '#0d1f38' }] },
  { featureType: 'road',      elementType: 'geometry.stroke', stylers: [{ color: '#081526' }] },
  { featureType: 'road',      elementType: 'labels.text.fill',stylers: [{ color: '#415e82' }] },
  { featureType: 'road.highway', elementType: 'geometry',     stylers: [{ color: '#132e50' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#0a1e36' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#6690b8' }] },
  { featureType: 'water',     elementType: 'geometry',        stylers: [{ color: '#04090f' }] },
  { featureType: 'water',     elementType: 'labels.text.fill',stylers: [{ color: '#1f3a5a' }] },
  { featureType: 'poi',       elementType: 'geometry',        stylers: [{ color: '#080f1f' }] },
  { featureType: 'poi',       elementType: 'labels.text.fill',stylers: [{ color: '#2e4a68' }] },
  { featureType: 'poi.park',  elementType: 'geometry',        stylers: [{ color: '#050e18' }] },
  { featureType: 'transit',   elementType: 'geometry',        stylers: [{ color: '#0a1628' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#0f2040' }] },
];

/* Build an SVG data-URI marker */
function markerSvg(color = '#00e5a0', size = 36) {
  const s = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${color}" fill-opacity="0.22"/>
    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 4}" fill="${color}" fill-opacity="0.88"/>
    <text x="${size/2}" y="${size/2 + 5}" font-size="${size * 0.38}" text-anchor="middle" fill="#04180e">🚗</text>
  </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(s);
}

/* Place simulated driver dots around the map centre */
function spawnDriverPins(count = 8) {
  if (!state.googleMap || !window.google) return;
  state.driverMarkers.forEach(m => m.setMap(null));
  state.driverMarkers = [];

  const centre = cfg.defaultCenter || { lat: 12.9716, lng: 77.5946 };
  const spread = 0.045;

  for (let i = 0; i < count; i++) {
    const lat = centre.lat + (Math.random() - 0.5) * spread * 2;
    const lng = centre.lng + (Math.random() - 0.5) * spread * 2;

    const marker = new window.google.maps.Marker({
      map: state.googleMap,
      position: { lat, lng },
      title: `Driver ${i + 1}`,
      icon: {
        url: markerSvg('#00e5a0', 34),
        scaledSize: new window.google.maps.Size(34, 34),
        anchor:     new window.google.maps.Point(17, 17),
      },
      optimized: false,
    });

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
    marker.setPosition({
      lat: baseLat + Math.sin(angle) * speed,
      lng: baseLng + Math.cos(angle) * speed,
    });
    setTimeout(step, 1800 + Math.random() * 2200);
  }
  setTimeout(step, Math.random() * 3000);
}

/* ── Load Google Maps ────────────────────────────────────────── */
async function loadGoogleMap() {
  const key = cfg.googleMapsApiKey || '';

  if (!key) {
    el.mapStatusText.textContent = 'Map: Add API key';
    return; // placeholder stays visible
  }

  // Inject Maps JS API if not already present
  if (!window.google?.maps) {
    await new Promise((resolve, reject) => {
      window.__rideShareMapReady = resolve;
      const tag = document.createElement('script');
      tag.async  = true;
      tag.defer  = true;
      tag.src    = [
        'https://maps.googleapis.com/maps/api/js',
        `?key=${encodeURIComponent(key)}`,
        `&libraries=${(cfg.googleMapsLibraries || ['places']).join(',')}`,
        '&callback=__rideShareMapReady',
        '&loading=async',
      ].join('');
      tag.onerror = () => reject(new Error('Google Maps failed to load — check your API key.'));
      document.head.appendChild(tag);
    });
  }

  // Hide placeholder
  const ph = document.getElementById('mapPlaceholder');
  if (ph) ph.style.display = 'none';

  // Init map
  const centre = cfg.defaultCenter || { lat: 12.9716, lng: 77.5946 };
  state.googleMap = new window.google.maps.Map(document.getElementById('map'), {
    center:           centre,
    zoom:             cfg.defaultZoom || 13,
    disableDefaultUI: true,
    styles:           DARK_STYLE,
    gestureHandling:  'greedy',
  });

  // Directions renderer (renders the route polyline)
  state.directionsRenderer = new window.google.maps.DirectionsRenderer({
    suppressMarkers: false,
    polylineOptions: {
      strokeColor:   '#00e5a0',
      strokeOpacity: 0.9,
      strokeWeight:  5,
    },
  });
  state.directionsRenderer.setMap(state.googleMap);

  // Wire autocomplete
  setupAutocomplete();

  // Spawn simulated driver pins
  spawnDriverPins(8);

  el.mapStatusText.textContent = 'Map: Live ✓';
}

/* ── Places Autocomplete ─────────────────────────────────────── */
function setupAutocomplete() {
  if (!window.google?.maps?.places) return;

  const opts = {
    componentRestrictions: { country: 'in' },
    fields: ['formatted_address', 'geometry', 'name'],
  };

  // Pair: [booking-form input, peek-row mirror]
  const pairs = [
    [el.inputPickup,  el.peekPickup],
    [el.inputDropoff, el.peekDropoff],
  ];

  pairs.forEach(([primary, mirror]) => {
    const ac = new window.google.maps.places.Autocomplete(primary, opts);
    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      const addr  = place.formatted_address || place.name || primary.value;
      primary.value = addr;
      if (mirror) mirror.value = addr;
      tryDrawRoute();
    });

    // Keep mirror in sync when user types
    if (mirror) {
      mirror.addEventListener('input',  () => { primary.value = mirror.value; });
      mirror.addEventListener('change', tryDrawRoute);
    }
  });

  // Keep peek mirrors synced when user types directly in the form
  el.inputPickup.addEventListener('input',  () => { el.peekPickup.value  = el.inputPickup.value; });
  el.inputDropoff.addEventListener('input', () => { el.peekDropoff.value = el.inputDropoff.value; });
}

/* ── Directions API ──────────────────────────────────────────── */
async function tryDrawRoute() {
  if (!state.googleMap || !state.directionsRenderer) return;

  const origin      = el.inputPickup.value.trim()  || el.peekPickup.value.trim();
  const destination = el.inputDropoff.value.trim() || el.peekDropoff.value.trim();
  if (!origin || !destination) return;

  const svc = new window.google.maps.DirectionsService();
  try {
    const result = await svc.route({
      origin,
      destination,
      travelMode: window.google.maps.TravelMode.DRIVING,
    });
    state.directionsRenderer.setDirections(result);

    const leg = result.routes[0]?.legs[0];
    if (leg) {
      const km   = (leg.distance?.value || 0) / 1000;
      const fare = Math.round(50 + km * 15); // ₹50 base + ₹15/km

      el.routeDistance.textContent     = leg.distance?.text || '–';
      el.routeEta.textContent          = leg.duration?.text  || '–';
      el.routeFareEstimate.textContent = `₹${fare}`;
      el.inputFare.value               = fare;
      el.routeInfo.classList.remove('hidden');
    }
  } catch (err) {
    console.warn('Directions API:', err.message);
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
  el.peekPickup.addEventListener('focus',  openSheet);
  el.peekDropoff.addEventListener('focus', openSheet);

  // Tapping the map closes the sheet
  document.getElementById('map').addEventListener('click', closeSheet);

  // Form submission
  el.bookingForm.addEventListener('submit', handleBooking);

  // Keep peek ↔ form inputs synced on blur
  el.peekPickup.addEventListener('change',  () => { el.inputPickup.value  = el.peekPickup.value; });
  el.peekDropoff.addEventListener('change', () => { el.inputDropoff.value = el.peekDropoff.value; });

  // Draw route when user finishes typing without autocomplete
  el.inputPickup.addEventListener('change',  tryDrawRoute);
  el.inputDropoff.addEventListener('change', tryDrawRoute);
}

/* ── Boot ────────────────────────────────────────────────────── */
async function boot() {
  // Collect DOM refs
  el.sheet            = document.getElementById('sheet');
  el.sheetHandleZone  = document.getElementById('sheetHandleZone');
  el.sheetBody        = document.getElementById('sheetBody');
  el.peekPickup       = document.getElementById('peekPickup');
  el.peekDropoff      = document.getElementById('peekDropoff');
  el.inputPickup      = document.getElementById('inputPickup');
  el.inputDropoff     = document.getElementById('inputDropoff');
  el.inputFare        = document.getElementById('inputFare');
  el.routeInfo        = document.getElementById('routeInfo');
  el.routeDistance    = document.getElementById('routeDistance');
  el.routeEta         = document.getElementById('routeEta');
  el.routeFareEstimate= document.getElementById('routeFareEstimate');
  el.bookingForm      = document.getElementById('bookingForm');
  el.bookingResult    = document.getElementById('bookingResult');
  el.btnBook          = document.getElementById('btnBook');
  el.apiDot           = document.getElementById('apiDot');
  el.apiStatusText    = document.getElementById('apiStatusText');
  el.mapStatusText    = document.getElementById('mapStatusText');

  wireEvents();

  // Ping API (status dot only — no data panels)
  pingApi();

  // Load map (provider set in config.js — no UI toggle)
  try {
    el.mapStatusText.textContent = 'Map: Loading…';
    await loadGoogleMap();
  } catch (err) {
    console.error('Map error:', err);
    el.mapStatusText.textContent = 'Map: Error';
  }
}

window.addEventListener('DOMContentLoaded', boot);

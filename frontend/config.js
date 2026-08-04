/**
 * Ride Share Studio — Frontend Configuration
 *
 * Map stack: Leaflet + OpenStreetMap (free, no API key required)
 *  - Tiles:    OpenStreetMap public tile servers
 *  - Routing:  OSRM public demo server (router.project-osrm.org)
 *  - Geocoding: Nominatim public API (nominatim.openstreetmap.org)
 *
 * None of these require signup, billing, or an API key.
 */
window.RIDE_SHARE_CONFIG = {
  // ── Backend ────────────────────────────────────────────────────
  apiBaseUrl: window.location.origin + '/api',

  // Dev auth token — matches the gateway's DEV_AUTH_TOKEN default.
  // Sent automatically on POST /bookings and POST /payments.
  devAuthToken: 'ride-share-dev-token',

  // Demo user ID used when fetching payments.
  demoUserId: 5,

  // ── Map ────────────────────────────────────────────────────────
  osmTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  osrmBaseUrl: 'https://router.project-osrm.org',
  nominatimBaseUrl: 'https://nominatim.openstreetmap.org',

  // Default map centre (Bengaluru, India)
  defaultCenter: { lat: 12.9716, lng: 77.5946 },
  defaultZoom: 13,

  // ── Brand ──────────────────────────────────────────────────────
  brandName: 'RideShare',
};


/**
 * Ride Share Studio — Frontend Configuration
 *
 * HOW TO ENABLE THE LIVE MAP:
 *  1. Go to https://console.cloud.google.com
 *  2. Create / open a project
 *  3. Enable: Maps JavaScript API, Places API, Directions API
 *  4. Create an API key and paste it below as googleMapsApiKey
 *
 * The UI works without a key — it shows a styled placeholder.
 */
window.RIDE_SHARE_CONFIG = {
  // ── Backend ────────────────────────────────────────────────────
  apiBaseUrl: 'http://localhost:3000/api',

  // Dev auth token — matches the gateway's DEV_AUTH_TOKEN default.
  // Sent automatically on POST /bookings and POST /payments.
  devAuthToken: 'ride-share-dev-token',

  // Demo user ID used when fetching payments.
  demoUserId: 5,

  // ── Map ────────────────────────────────────────────────────────
  mapProvider: 'google',

  // Paste your Google Maps API key here:
  googleMapsApiKey: '',

  // Apple MapKit (alternative — set mapProvider to 'apple')
  appleMapsToken: '',

  // Libraries to load with the Maps JS API
  googleMapsLibraries: ['places'],

  // Default map centre (Bengaluru, India)
  defaultCenter: { lat: 12.9716, lng: 77.5946 },
  defaultZoom: 13,

  // ── Brand ──────────────────────────────────────────────────────
  brandName: 'RideShare',
};

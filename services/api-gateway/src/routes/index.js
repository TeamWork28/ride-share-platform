const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const DEV_AUTH_TOKEN = process.env.DEV_AUTH_TOKEN || 'ride-share-dev-token';

const router = express.Router();

async function forward(req, res, method, targetUrl, body, extraConfig = {}) {
  try {
    const response = await axios.request({
      method,
      url: targetUrl,
      data: body,
      params: req.query,
      headers: {
        ...extraConfig.headers,
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {})
      }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const data = error.response?.data || { error: 'Internal Server Error' };
    console.error(`Error forwarding ${method.toUpperCase()} ${targetUrl}:`, error.message);
    res.status(status).json(data);
  }
}

// ============ USER SERVICE ROUTES ============
// All user-related requests go to user-service

// GET /api/users - Get all users
router.get('/users', async (req, res) => {
  return forward(req, res, 'get', `${process.env.USER_SERVICE_URL}/users`);
});

// POST /api/users - Register new user
router.post('/users', async (req, res) => {
  return forward(req, res, 'post', `${process.env.USER_SERVICE_URL}/users/register`, req.body);
});

// GET /api/users/:id - Get a specific user
router.get('/users/:id', async (req, res) => {
  return forward(req, res, 'get', `${process.env.USER_SERVICE_URL}/users/${req.params.id}`);
});

// POST /api/users/login - Login user
router.post('/users/login', async (req, res) => {
  return forward(req, res, 'post', `${process.env.USER_SERVICE_URL}/users/login`, req.body);
});

// PUT /api/users/:id - Update user
router.put('/users/:id', async (req, res) => {
  return forward(req, res, 'put', `${process.env.USER_SERVICE_URL}/users/${req.params.id}`, req.body);
});

// DELETE /api/users/:id - Delete user
router.delete('/users/:id', async (req, res) => {
  return forward(req, res, 'delete', `${process.env.USER_SERVICE_URL}/users/${req.params.id}`);
});

// ============ DRIVER SERVICE ROUTES ============
// All driver-related requests go to driver-service

// GET /api/drivers - Get all drivers
router.get('/drivers', async (req, res) => {
  return forward(req, res, 'get', `${process.env.DRIVER_SERVICE_URL}/drivers`);
});

// POST /api/drivers - Register new driver
router.post('/drivers', async (req, res) => {
  return forward(req, res, 'post', `${process.env.DRIVER_SERVICE_URL}/drivers/register`, req.body);
});

// GET /api/drivers/:id - Get a specific driver
router.get('/drivers/:id', async (req, res) => {
  return forward(req, res, 'get', `${process.env.DRIVER_SERVICE_URL}/drivers/${req.params.id}`);
});

// PUT /api/drivers/:id/status - Update driver status
router.put('/drivers/:id/status', async (req, res) => {
  return forward(req, res, 'put', `${process.env.DRIVER_SERVICE_URL}/drivers/${req.params.id}/status`, req.body);
});

// PUT /api/drivers/:id - Update driver profile
router.put('/drivers/:id', async (req, res) => {
  return forward(req, res, 'put', `${process.env.DRIVER_SERVICE_URL}/drivers/${req.params.id}`, req.body);
});

// POST /api/drivers/:id/rate - Rate driver
router.post('/drivers/:id/rate', async (req, res) => {
  return forward(req, res, 'post', `${process.env.DRIVER_SERVICE_URL}/drivers/${req.params.id}/rate`, req.body);
});

// PUT /api/drivers/:id/verify - Verify driver
router.put('/drivers/:id/verify', async (req, res) => {
  return forward(req, res, 'put', `${process.env.DRIVER_SERVICE_URL}/drivers/${req.params.id}/verify`);
});

// ============ BOOKING SERVICE ROUTES ============
// All booking-related requests go to booking-service

// GET /api/bookings - List bookings
router.get('/bookings', async (req, res) => {
  return forward(req, res, 'get', `${process.env.BOOKING_SERVICE_URL}/bookings`);
});

// POST /api/bookings - Create new booking (requires auth)
router.post('/bookings', authMiddleware, async (req, res) => {
  return forward(req, res, 'post', `${process.env.BOOKING_SERVICE_URL}/bookings`, req.body, {
    headers: { Authorization: req.headers.authorization }
  });
});

// GET /api/bookings/:id - Get booking details
router.get('/bookings/:id', async (req, res) => {
  return forward(req, res, 'get', `${process.env.BOOKING_SERVICE_URL}/bookings/${req.params.id}`);
});

// PUT /api/bookings/:id/status - Update booking status
router.put('/bookings/:id/status', async (req, res) => {
  return forward(req, res, 'put', `${process.env.BOOKING_SERVICE_URL}/bookings/${req.params.id}/status`, req.body);
});

// PUT /api/bookings/:id/assign-driver - Assign a driver
router.put('/bookings/:id/assign-driver', async (req, res) => {
  return forward(req, res, 'put', `${process.env.BOOKING_SERVICE_URL}/bookings/${req.params.id}/assign-driver`, req.body);
});

// PUT /api/bookings/:id/complete - Complete booking
router.put('/bookings/:id/complete', async (req, res) => {
  return forward(req, res, 'put', `${process.env.BOOKING_SERVICE_URL}/bookings/${req.params.id}/complete`, req.body);
});

// DELETE /api/bookings/:id - Cancel booking
router.delete('/bookings/:id', async (req, res) => {
  return forward(req, res, 'delete', `${process.env.BOOKING_SERVICE_URL}/bookings/${req.params.id}`);
});

// ============ PAYMENT SERVICE ROUTES ============
// All payment-related requests go to payment-service

// GET /api/payments/:id - Get payment details
router.get('/payments/:id', async (req, res) => {
  return forward(req, res, 'get', `${process.env.PAYMENT_SERVICE_URL}/payments/${req.params.id}`);
});

// GET /api/payments/user/:userId - Payments by user
router.get('/payments/user/:userId', async (req, res) => {
  return forward(req, res, 'get', `${process.env.PAYMENT_SERVICE_URL}/payments/user/${req.params.userId}`);
});

// GET /api/payments/driver/:driverId - Payments by driver
router.get('/payments/driver/:driverId', async (req, res) => {
  return forward(req, res, 'get', `${process.env.PAYMENT_SERVICE_URL}/payments/driver/${req.params.driverId}`);
});

// POST /api/payments - Process payment (requires auth)
router.post('/payments', authMiddleware, async (req, res) => {
  return forward(req, res, 'post', `${process.env.PAYMENT_SERVICE_URL}/payments`, req.body, {
    headers: { Authorization: req.headers.authorization }
  });
});

// POST /api/payments/:id/process - Process payment
router.post('/payments/:id/process', authMiddleware, async (req, res) => {
  return forward(req, res, 'post', `${process.env.PAYMENT_SERVICE_URL}/payments/${req.params.id}/process`, req.body, {
    headers: { Authorization: req.headers.authorization }
  });
});

// POST /api/payments/:id/refund - Refund payment
router.post('/payments/:id/refund', authMiddleware, async (req, res) => {
  return forward(req, res, 'post', `${process.env.PAYMENT_SERVICE_URL}/payments/${req.params.id}/refund`, req.body, {
    headers: { Authorization: req.headers.authorization }
  });
});

// POST /api/payments/:id/payout - Process driver payout
router.post('/payments/:id/payout', authMiddleware, async (req, res) => {
  return forward(req, res, 'post', `${process.env.PAYMENT_SERVICE_URL}/payments/${req.params.id}/payout`, req.body, {
    headers: { Authorization: req.headers.authorization }
  });
});

// ============ NOTIFICATION SERVICE ROUTES ============
// All notification-related requests go to notification-service

// GET /api/notifications - Notification routes
router.get('/notifications', (req, res) => {
  res.json({
    message: 'Notification routes available',
    routes: [
      'POST /api/notifications',
      'POST /api/notifications/booking-confirmation',
      'POST /api/notifications/payment-receipt'
    ]
  });
});

// POST /api/notifications - Send email notification
router.post('/notifications', async (req, res) => {
  return forward(req, res, 'post', `${process.env.NOTIFICATION_SERVICE_URL}/email/send`, req.body);
});

// POST /api/notifications/booking-confirmation
router.post('/notifications/booking-confirmation', async (req, res) => {
  return forward(req, res, 'post', `${process.env.NOTIFICATION_SERVICE_URL}/email/booking-confirmation`, req.body);
});

// POST /api/notifications/payment-receipt
router.post('/notifications/payment-receipt', async (req, res) => {
  return forward(req, res, 'post', `${process.env.NOTIFICATION_SERVICE_URL}/email/payment-receipt`, req.body);
});

// ============ HEALTH CHECK ============
router.get('/', (req, res) => {
  res.json({
    message: 'API Gateway running',
    routes: [
      '/api/',
      '/api/users',
      '/api/users/:id',
      '/api/users/login',
      '/api/drivers',
      '/api/drivers/:id',
      '/api/drivers/:id/status',
      '/api/drivers/:id/rate',
      '/api/drivers/:id/verify',
      '/api/bookings',
      '/api/bookings/:id',
      '/api/bookings/:id/status',
      '/api/bookings/:id/assign-driver',
      '/api/bookings/:id/complete',
      '/api/payments',
      '/api/payments/:id',
      '/api/payments/user/:userId',
      '/api/payments/driver/:driverId',
      '/api/payments/:id/process',
      '/api/payments/:id/refund',
      '/api/payments/:id/payout',
      '/api/notifications',
      '/api/notifications/booking-confirmation',
      '/api/notifications/payment-receipt',
      '/api/status'
    ]
  });
});

router.get('/docs', (req, res) => {
  res.type('html').send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Ride-Share API Gateway Docs</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.5; margin: 32px; color: #1f2937; }
      h1, h2 { margin-bottom: 0.4rem; }
      code, pre { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
      pre { padding: 12px; overflow-x: auto; }
      .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin: 16px 0; }
      .muted { color: #6b7280; }
    </style>
  </head>
  <body>
    <h1>Ride-Share API Gateway</h1>
    <p class="muted">Use this page to see the routes, required auth, and example request bodies.</p>

    <div class="card">
      <h2>Base URLs</h2>
      <p><code>http://localhost:3000/api</code></p>
      <p>Direct services:</p>
      <ul>
        <li><code>http://localhost:5000</code> user-service</li>
        <li><code>http://localhost:5001</code> driver-service</li>
        <li><code>http://localhost:5002</code> notification-service</li>
      </ul>
    </div>

    <div class="card">
      <h2>Authentication</h2>
      <p class="muted">Booking and payment endpoints are open in local development. If you want to send a bearer token, use the stable dev token below.</p>
      <pre>Authorization: Bearer ${DEV_AUTH_TOKEN}</pre>
      <p class="muted">This dev token does not expire in the current setup.</p>
    </div>

    <div class="card">
      <h2>User Examples</h2>
      <p><code>POST /api/users</code></p>
      <pre>{
  "name": "Vyshnavi",
  "email": "vyshnavi@xyz.com",
  "password": "password123",
  "phone": "132454654"
}</pre>
      <p><code>POST /api/users/login</code></p>
      <pre>{
  "email": "vyshnavi@xyz.com",
  "password": "password123"
}</pre>
    </div>

    <div class="card">
      <h2>Driver Examples</h2>
      <p><code>POST /api/drivers</code></p>
      <pre>{
  "name": "tesla",
  "email": "tesla@ride-share.com",
  "phone": "8746418324",
  "license_number": "ASH456871XC",
  "vehicle_type": "SUV",
  "vehicle_number": "KA28NK2606"
}</pre>
      <p><code>PUT /api/drivers/:id/status</code></p>
      <pre>{
  "status": "active"
}</pre>
      <p><code>POST /api/drivers/:id/rate</code></p>
      <pre>{
  "rating": 4.5
}</pre>
    </div>

    <div class="card">
      <h2>Notifications</h2>
      <p><code>POST /api/notifications</code></p>
      <pre>{
  "to_email": "test@example.com",
  "subject": "Welcome",
  "body": "Hello from Ride-Share",
  "is_html": false
}</pre>
    </div>

    <div class="card">
      <h2>Bookings</h2>
      <p><code>POST /api/bookings</code></p>
      <pre>{
  "userId": 1,
  "pickupLocation": { "address": "Airport" },
  "dropoffLocation": { "address": "Hotel" },
  "estimatedFare": 120
}</pre>
      <p><code>PUT /api/bookings/:id/status</code></p>
      <pre>{ "status": "confirmed" }</pre>
      <p><code>PUT /api/bookings/:id/assign-driver</code></p>
      <pre>{ "driverId": 1 }</pre>
      <p><code>PUT /api/bookings/:id/complete</code></p>
      <pre>{ "actualFare": 135 }</pre>
    </div>

    <div class="card">
      <h2>Payments</h2>
      <p><code>POST /api/payments</code></p>
      <pre>{
  "bookingId": "booking_object_id",
  "userId": 1,
  "driverId": 1,
  "fareAmount": 135,
  "paymentMethod": "card"
}</pre>
      <p class="muted">In local development, payment processing is simulated so the route works without Stripe.</p>
    </div>
  </body>
</html>`);
});

router.get('/status', (req, res) => {
  res.json({ status: 'API Gateway running' });
});

module.exports = router;

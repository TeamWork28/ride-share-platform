const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');

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

// ============ PAYMENT SERVICE ROUTES ============
// All payment-related requests go to payment-service

// POST /api/payments - Process payment (requires auth)
router.post('/payments', authMiddleware, async (req, res) => {
  return forward(req, res, 'post', `${process.env.PAYMENT_SERVICE_URL}/payments`, req.body, {
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
      '/api/payments',
      '/api/notifications',
      '/api/notifications/booking-confirmation',
      '/api/notifications/payment-receipt',
      '/api/status'
    ]
  });
});

router.get('/status', (req, res) => {
  res.json({ status: 'API Gateway running' });
});

module.exports = router;

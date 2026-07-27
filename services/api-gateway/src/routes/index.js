const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ============ USER SERVICE ROUTES ============
// All user-related requests go to user-service

// GET /api/users - Get all users
router.get('/users', async (req, res) => {
  try {
    const response = await axios.get(
      `${process.env.USER_SERVICE_URL}/users`
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users - Register new user
router.post('/users', async (req, res) => {
  try {
    const response = await axios.post(
      `${process.env.USER_SERVICE_URL}/users/register`,
      req.body
    );
    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error creating user:', error.message);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// ============ DRIVER SERVICE ROUTES ============
// All driver-related requests go to driver-service

// GET /api/drivers - Get all drivers
router.get('/drivers', async (req, res) => {
  try {
    const response = await axios.get(
      `${process.env.DRIVER_SERVICE_URL}/drivers`
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching drivers:', error.message);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// POST /api/drivers - Register new driver
router.post('/drivers', async (req, res) => {
  try {
    const response = await axios.post(
      `${process.env.DRIVER_SERVICE_URL}/drivers/register`,
      req.body
    );
    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error creating driver:', error.message);
    res.status(500).json({ error: 'Failed to create driver' });
  }
});

// ============ BOOKING SERVICE ROUTES ============
// All booking-related requests go to booking-service

// POST /api/bookings - Create new booking (requires auth)
router.post('/bookings', authMiddleware, async (req, res) => {
  try {
    const response = await axios.post(
      `${process.env.BOOKING_SERVICE_URL}/bookings`,
      req.body,
      { headers: { 'Authorization': req.headers.authorization } }
    );
    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error creating booking:', error.message);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// GET /api/bookings/:id - Get booking details
router.get('/bookings/:id', async (req, res) => {
  try {
    const response = await axios.get(
      `${process.env.BOOKING_SERVICE_URL}/bookings/${req.params.id}`
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching booking:', error.message);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// ============ PAYMENT SERVICE ROUTES ============
// All payment-related requests go to payment-service

// POST /api/payments - Process payment (requires auth)
router.post('/payments', authMiddleware, async (req, res) => {
  try {
    const response = await axios.post(
      `${process.env.PAYMENT_SERVICE_URL}/payments`,
      req.body,
      { headers: { 'Authorization': req.headers.authorization } }
    );
    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error processing payment:', error.message);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// ============ NOTIFICATION SERVICE ROUTES ============
// All notification-related requests go to notification-service

// POST /api/notifications - Send notification
router.post('/notifications', async (req, res) => {
  try {
    const response = await axios.post(
      `${process.env.NOTIFICATION_SERVICE_URL}/notifications`,
      req.body
    );
    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error sending notification:', error.message);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// ============ HEALTH CHECK ============
router.get('/status', (req, res) => {
  res.json({ status: 'API Gateway running' });
});

module.exports = router;

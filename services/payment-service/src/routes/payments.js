// Payment routes - API endpoints
const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const isDevMode = !process.env.STRIPE_SECRET_KEY || process.env.NODE_ENV !== 'production';
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

// ============ CREATE PAYMENT ============
router.post('/', async (req, res) => {
  /**
   * Create a new payment for a completed booking
   * Expects: bookingId, userId, driverId, fareAmount, paymentMethod
   */
  try {
    const { bookingId, userId, driverId, fareAmount, paymentMethod } = req.body;
    
    // Validate required fields
    if (!bookingId || !userId || !driverId || !fareAmount || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Calculate commission and tax
    const commissionPercent = parseFloat(process.env.PLATFORM_COMMISSION_PERCENTAGE) || 15;
    const taxPercent = parseFloat(process.env.TAX_PERCENTAGE) || 5;
    
    const platformCommission = (fareAmount * commissionPercent) / 100;
    const tax = (fareAmount * taxPercent) / 100;
    const totalAmount = fareAmount + platformCommission + tax;
    
    // Create payment record
    const payment = new Payment({
      bookingId,
      userId,
      driverId,
      fareAmount,
      platformCommission,
      tax,
      totalAmount,
      paymentMethod,
      status: 'pending',
    });
    
    // Save to MongoDB
    const savedPayment = await payment.save();
    
    res.status(201).json({
      message: 'Payment initiated',
      payment: savedPayment,
    });
    
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// ============ PROCESS PAYMENT ============
router.post('/:id/process', async (req, res) => {
  /**
   * Process payment via Stripe or other gateway
   * Expects: token (payment token from frontend)
   */
  try {
    const { token } = req.body;

    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    if (payment.status !== 'pending') {
      return res.status(400).json({ error: 'Payment already processed' });
    }

    if (isDevMode) {
      payment.status = 'completed';
      payment.transactionId = `dev_tx_${Date.now()}`;
      payment.completedAt = new Date();
      payment.payoutStatus = 'pending';

      const updatedPayment = await payment.save();

      return res.json({
        message: 'Payment processed successfully (dev mode)',
        payment: updatedPayment,
      });
    }

    try {
      // Process payment with Stripe
      const charge = await stripe.charges.create({
        amount: Math.round(payment.totalAmount * 100), // Convert to cents
        currency: 'usd',
        source: token,
        description: `Booking ${payment.bookingId} - Ride-Share Platform`,
      });

      // Update payment status
      payment.status = 'completed';
      payment.transactionId = charge.id;
      payment.completedAt = new Date();
      payment.payoutStatus = 'pending';

      const updatedPayment = await payment.save();

      res.json({
        message: 'Payment processed successfully',
        payment: updatedPayment,
      });

    } catch (stripeError) {
      console.error('Stripe error:', stripeError);

      payment.status = 'failed';
      payment.failedAt = new Date();
      await payment.save();

      res.status(400).json({
        error: 'Payment processing failed',
        details: stripeError.message,
      });
    }
    
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// ============ GET PAYMENT BY ID ============
router.get('/:id', async (req, res) => {
  /**
   * Get payment details
   */
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json(payment);
    
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// ============ GET PAYMENTS BY USER ============
router.get('/user/:userId', async (req, res) => {
  /**
   * Get all payments made by a user
   */
  try {
    const payments = await Payment.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    
    res.json(payments);
    
  } catch (error) {
    console.error('Error fetching user payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// ============ GET PAYMENTS BY DRIVER ============
router.get('/driver/:driverId', async (req, res) => {
  /**
   * Get all payments for a driver (earnings)
   */
  try {
    const payments = await Payment.find({ 
      driverId: req.params.driverId,
      status: 'completed'
    }).sort({ createdAt: -1 });
    
    // Calculate total earnings
    const totalEarnings = payments.reduce((sum, p) => {
      const driverShare = p.fareAmount - p.platformCommission;
      return sum + driverShare;
    }, 0);
    
    res.json({
      payments,
      totalEarnings: totalEarnings.toFixed(2),
    });
    
  } catch (error) {
    console.error('Error fetching driver payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// ============ REFUND PAYMENT ============
router.post('/:id/refund', async (req, res) => {
  /**
   * Refund a payment
   * Expects: reason
   */
  try {
    const { reason } = req.body;
    
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    if (payment.status !== 'completed') {
      return res.status(400).json({ error: 'Only completed payments can be refunded' });
    }

    if (isDevMode) {
      payment.status = 'refunded';
      payment.refundAmount = payment.totalAmount;
      payment.refundReason = reason || 'dev refund';
      payment.refundedAt = new Date();

      const updatedPayment = await payment.save();

      return res.json({
        message: 'Payment refunded successfully (dev mode)',
        payment: updatedPayment,
      });
    }

    try {
      // Refund via Stripe
      await stripe.refunds.create({
        charge: payment.transactionId,
      });

      // Update payment
      payment.status = 'refunded';
      payment.refundAmount = payment.totalAmount;
      payment.refundReason = reason;
      payment.refundedAt = new Date();

      const updatedPayment = await payment.save();

      res.json({
        message: 'Payment refunded successfully',
        payment: updatedPayment,
      });

    } catch (stripeError) {
      console.error('Stripe refund error:', stripeError);
      res.status(400).json({
        error: 'Refund processing failed',
        details: stripeError.message,
      });
    }
    
  } catch (error) {
    console.error('Error refunding payment:', error);
    res.status(500).json({ error: 'Failed to refund payment' });
  }
});

// ============ PROCESS DRIVER PAYOUT ============
router.post('/:id/payout', async (req, res) => {
  /**
   * Process payout to driver (admin endpoint)
   * Transfers driver's share to their bank account
   */
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    if (payment.status !== 'completed') {
      return res.status(400).json({ error: 'Only completed payments can be paid out' });
    }
    
    if (payment.payoutStatus === 'processed') {
      return res.status(400).json({ error: 'Payout already processed' });
    }
    
    // Calculate driver's share (fare - commission)
    const driverShare = payment.fareAmount - payment.platformCommission;
    
    // In production: Transfer to driver's bank account via Stripe Connect or other service
    // For now: Just update status
    
    payment.payoutStatus = 'processed';
    const updatedPayment = await payment.save();
    
    res.json({
      message: 'Payout processed successfully',
      driverShare: driverShare.toFixed(2),
      payment: updatedPayment,
    });
    
  } catch (error) {
    console.error('Error processing payout:', error);
    res.status(500).json({ error: 'Failed to process payout' });
  }
});

module.exports = router;

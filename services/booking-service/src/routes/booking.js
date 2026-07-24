// Booking routes - API endpoints
const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// ============ CREATE BOOKING ============
router.post('/', async (req, res) => {
  /**
   * Create a new booking
   * Expects: userId, pickupLocation, dropoffLocation, estimatedFare
   * Returns: Created booking document
   */
  try {
    const { userId, pickupLocation, dropoffLocation, estimatedFare } = req.body;
    
    // Validate required fields
    if (!userId || !pickupLocation || !dropoffLocation || !estimatedFare) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create new booking
    const booking = new Booking({
      userId,
      pickupLocation,
      dropoffLocation,
      estimatedFare,
      status: 'pending',
    });
    
    // Save to MongoDB
    const savedBooking = await booking.save();
    res.status(201).json(savedBooking);
    
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// ============ GET ALL BOOKINGS ============
router.get('/', async (req, res) => {
  /**
   * Get all bookings (or filter by status/userId)
   * Query params: status, userId
   */
  try {
    const { status, userId } = req.query;
    const filter = {};
    
    // Build filter based on query params
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    
    const bookings = await Booking.find(filter).sort({ requestedAt: -1 });
    res.json(bookings);
    
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ============ GET BOOKING BY ID ============
router.get('/:id', async (req, res) => {
  /**
   * Get a specific booking by ID
   */
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(booking);
    
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// ============ UPDATE BOOKING STATUS ============
router.put('/:id/status', async (req, res) => {
  /**
   * Update booking status
   * Expects: status (pending, confirmed, in_progress, completed, cancelled)
   */
  try {
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Update booking
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true } // Return updated document
    );
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(booking);
    
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// ============ ASSIGN DRIVER ============
router.put('/:id/assign-driver', async (req, res) => {
  /**
   * Assign a driver to a booking
   * Expects: driverId
   */
  try {
    const { driverId } = req.body;
    
    if (!driverId) {
      return res.status(400).json({ error: 'driverId is required' });
    }
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { driverId, status: 'confirmed', acceptedAt: new Date() },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(booking);
    
  } catch (error) {
    console.error('Error assigning driver:', error);
    res.status(500).json({ error: 'Failed to assign driver' });
  }
});

// ============ COMPLETE BOOKING ============
router.put('/:id/complete', async (req, res) => {
  /**
   * Mark booking as completed and set actual fare
   * Expects: actualFare
   */
  try {
    const { actualFare } = req.body;
    
    if (!actualFare) {
      return res.status(400).json({ error: 'actualFare is required' });
    }
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'completed', 
        actualFare, 
        completedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(booking);
    
  } catch (error) {
    console.error('Error completing booking:', error);
    res.status(500).json({ error: 'Failed to complete booking' });
  }
});

// ============ CANCEL BOOKING ============
router.delete('/:id', async (req, res) => {
  /**
   * Cancel a booking (soft delete - update status)
   */
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled', updatedAt: new Date() },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({ message: 'Booking cancelled', booking });
    
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

module.exports = router;

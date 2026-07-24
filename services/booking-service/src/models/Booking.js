// Booking data model and schema
const mongoose = require('mongoose');

// Define Booking schema
const bookingSchema = new mongoose.Schema(
  {
    // User who made the booking
    userId: {
      type: Number,
      required: true,
    },
    
    // Driver assigned to the booking
    driverId: {
      type: Number,
      default: null,
    },
    
    // Pickup location
    pickupLocation: {
      address: String,
      latitude: Number,
      longitude: Number,
    },
    
    // Dropoff location
    dropoffLocation: {
      address: String,
      latitude: Number,
      longitude: Number,
    },
    
    // Booking status
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    
    // Estimated fare
    estimatedFare: {
      type: Number,
      required: true,
    },
    
    // Actual fare (after completion)
    actualFare: Number,
    
    // Distance in kilometers
    distance: Number,
    
    // Booking timestamps
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    
    acceptedAt: Date,
    completedAt: Date,
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);

// Create and export Booking model
const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;

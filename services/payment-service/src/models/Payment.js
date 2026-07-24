// Payment data model and schema
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    // Booking reference
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    
    // User who paid
    userId: {
      type: Number,
      required: true,
    },
    
    // Driver receiving payment
    driverId: {
      type: Number,
      required: true,
    },
    
    // Amount details
    fareAmount: {
      type: Number,
      required: true,
    },
    
    platformCommission: {
      type: Number,
      required: true,
    },
    
    tax: {
      type: Number,
      required: true,
    },
    
    totalAmount: {
      type: Number,
      required: true,
    },
    
    // Payment method
    paymentMethod: {
      type: String,
      enum: ['card', 'wallet', 'upi', 'net_banking'],
      required: true,
    },
    
    // Transaction ID from payment gateway
    transactionId: String,
    
    // Payment status
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    
    // Payout status to driver
    payoutStatus: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending',
    },
    
    // Refund details (if applicable)
    refundAmount: Number,
    refundReason: String,
    refundedAt: Date,
    
    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    
    completedAt: Date,
    failedAt: Date,
  },
  { timestamps: true }
);

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;

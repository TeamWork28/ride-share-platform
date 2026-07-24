// Main entry point for Booking Service
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { connectDB } = require('./database');
const bookingRoutes = require('./routes/bookings');

const app = express();

// ============ MIDDLEWARE ============
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// ============ ROUTES ============
app.use('/bookings', bookingRoutes);

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'Booking Service is healthy',
    timestamp: new Date().toISOString()
  });
});

// ============ ROOT ENDPOINT ============
app.get('/', (req, res) => {
  res.json({ 
    service: 'Booking Service',
    version: '1.0.0'
  });
});

// ============ 404 HANDLER ============
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============ ERROR HANDLER ============
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ============ START SERVER ============
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Connect to MongoDB first
    const connected = await connectDB();
    
    if (!connected) {
      console.error('Failed to connect to MongoDB. Exiting...');
      process.exit(1);
    }
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`✅ Booking Service running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

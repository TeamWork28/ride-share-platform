// Import dependencies
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const routes = require('./routes');

// Initialize Express app
const app = express();

// ============ MIDDLEWARE SETUP ============

// 1. CORS - Allow cross-origin requests
app.use(cors());

// 2. Logging - Log all HTTP requests
app.use(morgan('combined'));

// 3. JSON Parser - Parse incoming JSON requests
app.use(express.json());

// 4. Rate Limiting - Prevent abuse
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// ============ ROUTES ============
// All API routes handled here
app.use('/api', routes);

// ============ HEALTH CHECK ENDPOINT ============
// Used by load balancers and monitoring tools
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'API Gateway is healthy',
    timestamp: new Date().toISOString()
  });
});

// ============ 404 - NOT FOUND ============
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path 
  });
});

// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

// ============ START SERVER ============
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ API Gateway running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
});

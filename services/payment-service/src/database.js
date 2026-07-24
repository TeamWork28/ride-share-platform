// MongoDB connection module
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ride_share_db';

async function connectDB() {
  /**
   * Connects to MongoDB using Mongoose
   */
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    return false;
  }
}

async function disconnectDB() {
  /**
   * Cleanly disconnect from MongoDB
   */
  try {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB Disconnection Error:', error.message);
    return false;
  }
}

module.exports = { connectDB, disconnectDB };

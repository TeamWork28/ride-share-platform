// MongoDB connection module
const mongoose = require('mongoose');
require('dotenv').config();

const DEFAULT_DB_NAME = process.env.MONGO_DB_NAME || 'ride_share_db';
const MONGO_URI =
  process.env.MONGO_URI ||
  (() => {
    const host = process.env.MONGO_HOST || 'localhost';
    const port = process.env.MONGO_PORT || '27017';
    const user = process.env.MONGO_USER;
    const password = process.env.MONGO_PASSWORD;
    const authSource = process.env.MONGO_AUTH_SOURCE || 'admin';

    if (user && password) {
      return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${DEFAULT_DB_NAME}?authSource=${authSource}`;
    }

    return `mongodb://${host}:${port}/${DEFAULT_DB_NAME}`;
  })();

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

require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/pdf-resource-hub',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-here',
  CLOUD_STORAGE_BUCKET: process.env.CLOUD_STORAGE_BUCKET,
  CLOUD_STORAGE_KEY: process.env.CLOUD_STORAGE_KEY,
};

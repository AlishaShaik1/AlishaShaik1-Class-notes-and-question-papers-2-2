const express = require('express');
const router = express.Router();
const {
  authUploader,
  registerUploader,
  getUploaders,
} = require('../controllers/uploaderController');

const { protect, admin } = require('../middleware/auth');

router.post('/login', authUploader);
router.route('/').post(protect, admin, registerUploader).get(protect, admin, getUploaders);

module.exports = router;

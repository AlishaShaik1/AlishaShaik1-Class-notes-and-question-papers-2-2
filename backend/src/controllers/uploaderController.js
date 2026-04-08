const Uploader = require('../models/Uploader');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// @desc    Authenticate uploader & get token
// @route   POST /api/uploaders/login
// @access  Public
const authUploader = async (req, res) => {
  const { email, password } = req.body;

  const uploader = await Uploader.findOne({ email });

  if (uploader && (await bcrypt.compare(password, uploader.password))) {
    res.json({
      _id: uploader._id,
      name: uploader.name,
      email: uploader.email,
      token: generateToken(uploader._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

// @desc    Register a new uploader
// @route   POST /api/uploaders
// @access  Private (Admin only)
const registerUploader = async (req, res) => {
  const { name, email, password } = req.body;

  const uploaderExists = await Uploader.findOne({ email });

  if (uploaderExists) {
    res.status(400).json({ message: 'Uploader already exists' });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const uploader = await Uploader.create({
    name,
    email,
    password: hashedPassword,
  });

  if (uploader) {
    res.status(201).json({
      _id: uploader._id,
      name: uploader.name,
      email: uploader.email,
      token: generateToken(uploader._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid uploader data' });
  }
};

// @desc    Get all uploaders
// @route   GET /api/uploaders
// @access  Private (Admin only)
const getUploaders = async (req, res) => {
  const uploaders = await Uploader.find({});
  res.json(uploaders);
};

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = {
  authUploader,
  registerUploader,
  getUploaders,
};

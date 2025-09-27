require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// CORS configuration - allow all origins for development
app.use(cors({
  origin: "https://upal.rizzmo.site",  // not "*"
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization"
}));

app.use(express.json());

// Logging middleware - should be at the top level
app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.url, req.body);
  next();
});

// Add more detailed logging
app.use((req, res, next) => {
  console.log('=== Request Details ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('======================');
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true }, // Hashed
  walletAddress: { type: String },
  ensDomain: { type: String },
  ensName: { type: String }, // ENS subdomain like "1234567890.upal.eth"
  pyusdBalance: { type: Number, default: 0 },
  encryptedKeystore: { type: String }, // Encrypted wallet keystore JSON
  hasWallet: { type: Boolean, default: false },
  activity: [{ // Array of activities/transactions
    type: { type: String, enum: ['send', 'receive', 'reward'] },
    amount: Number,
    recipient: String,
    timestamp: { type: Date, default: Date.now }
  }]
});

const User = mongoose.model('User', userSchema);

// Store OTPs temporarily (in production, use Redis or similar)
const otpStore = new Map();

// JWT Secret - use environment variable in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes
// Send OTP for signup
app.post('/api/send-otp', async (req, res) => {
  const { phone, name, password } = req.body;
  
  if (!phone || !name || !password) {
    return res.status(400).json({ error: 'Phone, name, and password are required' });
  }
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this phone number already exists' });
    }
    
    // Generate and store OTP
    const otp = generateOTP();
    otpStore.set(phone, {
      otp,
      userData: { phone, name, password },
      timestamp: Date.now(),
      expires: Date.now() + 5 * 60 * 1000 // 5 minutes
    });
    
    console.log(`OTP for ${phone}: ${otp}`); // In production, send via SMS
    
    res.json({ 
      message: 'OTP sent successfully',
      otp: otp // Remove this in production
    });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify OTP and create user
app.post('/api/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP are required' });
  }
  
  try {
    const storedData = otpStore.get(phone);
    
    if (!storedData) {
      return res.status(400).json({ error: 'OTP not found or expired' });
    }
    
    if (Date.now() > storedData.expires) {
      otpStore.delete(phone);
      return res.status(400).json({ error: 'OTP expired' });
    }
    
    if (storedData.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    
    // Create user
    const { name, password } = storedData.userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ phone, name, password: hashedPassword });
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        phone: user.phone 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Clean up OTP
    otpStore.delete(phone);
    
    res.status(201).json({ 
      message: 'User created successfully',
      token: token,
      user: {
        phone: user.phone,
        name: user.name,
        walletAddress: user.walletAddress,
        ensDomain: user.ensDomain,
        pyusdBalance: user.pyusdBalance,
        hasWallet: user.hasWallet
      }
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add this route
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Login
app.post('/api/login', async (req, res) => {
  const { phone, password } = req.body;
  
  if (!phone || !password) {
    return res.status(400).json({ error: 'Phone and password are required' });
  }
  
  try {
    const user = await User.findOne({ phone });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        phone: user.phone 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      message: 'Logged in successfully',
      token: token,
      user: {
        phone: user.phone,
        name: user.name,
        walletAddress: user.walletAddress,
        ensDomain: user.ensDomain,
        pyusdBalance: user.pyusdBalance,
        hasWallet: user.hasWallet
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Profile
app.get('/api/profile/:phone', async (req, res) => {
  try {
    const user = await User.findOne({ phone: req.params.phone });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({
      phone: user.phone,
      name: user.name,
      walletAddress: user.walletAddress,
      ensDomain: user.ensDomain,
      ensName: user.ensName,
      pyusdBalance: user.pyusdBalance,
      activity: user.activity
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update Profile (e.g., add wallet/ENS)
app.put('/api/profile/:phone', async (req, res) => {
  const { walletAddress, ensDomain } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      { phone: req.params.phone },
      { walletAddress, ensDomain },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({
      phone: user.phone,
      name: user.name,
      walletAddress: user.walletAddress,
      ensDomain: user.ensDomain,
      pyusdBalance: user.pyusdBalance
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add Activity
app.post('/api/activity/:phone', async (req, res) => {
  const { type, amount, recipient } = req.body;
  try {
    const user = await User.findOne({ phone: req.params.phone });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.activity.push({ type, amount, recipient });
    await user.save();
    res.json(user.activity);
  } catch (err) {
    console.error('Activity error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Store encrypted keystore
app.post('/api/keystore', authenticateToken, async (req, res) => {
  const { encryptedKeystore, walletAddress } = req.body;
  
  if (!encryptedKeystore || !walletAddress) {
    return res.status(400).json({ error: 'Encrypted keystore and wallet address are required' });
  }
  
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.encryptedKeystore = encryptedKeystore;
    user.walletAddress = walletAddress;
    user.hasWallet = true;
    
    // Try to create ENS subname (non-blocking)
    let ensName = null;
    try {
      const { createUserSubname } = require('./utils/ensService');
      ensName = await createUserSubname(user.phone, walletAddress, user.name);
      user.ensName = ensName; // Store ENS name in user record
      console.log(`ENS subname created: ${ensName} for user ${user.phone}`);
    } catch (ensError) {
      console.warn('ENS subname creation failed (non-critical):', ensError.message);
      // Continue without ENS - don't fail the wallet creation
    }
    
    await user.save();
    
    res.json({ 
      message: 'Keystore stored successfully',
      walletAddress: user.walletAddress,
      ensName: ensName || null
    });
  } catch (err) {
    console.error('Store keystore error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get encrypted keystore
app.get('/api/keystore', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.encryptedKeystore) {
      return res.status(404).json({ error: 'No keystore found' });
    }
    
    res.json({ 
      encryptedKeystore: user.encryptedKeystore,
      walletAddress: user.walletAddress,
      hasWallet: user.hasWallet
    });
  } catch (err) {
    console.error('Get keystore error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ENS Routes
try {
  const ensRoutes = require('./routes/ens');
  app.use('/api/ens', ensRoutes);
  console.log('ENS routes loaded successfully');
} catch (error) {
  console.warn('ENS routes not available:', error.message);
}

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Start Server
const PORT = process.env.PORT || 5000;

// Add this before app.listen()
app.use((req, res) => {
  console.log('Unmatched route:', req.method, req.originalUrl);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    url: req.originalUrl,
    availableRoutes: [
      'POST /api/send-otp',
      'POST /api/verify-otp', 
      'POST /api/login',
      'GET /api/health',
      'GET /api/profile/:phone',
      'PUT /api/profile/:phone',
      'POST /api/activity/:phone',
      'POST /api/keystore',
      'GET /api/keystore'
    ]
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
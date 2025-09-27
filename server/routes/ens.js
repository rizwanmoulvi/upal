const express = require('express');
const { 
  createUserSubname, 
  isSubnameAvailable, 
  getUserSubname, 
  getUserSubnameByAddress,
  updateUserSubname,
  resolveENSName 
} = require('../utils/ensService.js');

// Middleware to authenticate JWT tokens
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const router = express.Router();

// Check if ENS subname is available
router.get('/availability/:phoneNumber', authenticateToken, async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    if (!phoneNumber || phoneNumber.length < 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid phone number is required' 
      });
    }

    const isAvailable = await isSubnameAvailable(phoneNumber);
    
    res.json({
      success: true,
      phoneNumber,
      ensName: `${phoneNumber}.upal.eth`,
      isAvailable
    });
  } catch (error) {
    console.error('ENS availability check error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to check ENS availability' 
    });
  }
});

// Create ENS subname for user
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { phoneNumber, walletAddress, userName } = req.body;
    
    if (!phoneNumber || !walletAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number and wallet address are required' 
      });
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid wallet address format' 
      });
    }

    const ensName = await createUserSubname(phoneNumber, walletAddress, userName);
    
    res.json({
      success: true,
      ensName,
      phoneNumber,
      walletAddress,
      message: `ENS subname ${ensName} created successfully`
    });
  } catch (error) {
    console.error('ENS creation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create ENS subname' 
    });
  }
});

// Get user's ENS subname by phone number
router.get('/user/:phoneNumber', authenticateToken, async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    const subname = await getUserSubname(phoneNumber);
    
    if (!subname) {
      return res.status(404).json({ 
        success: false, 
        error: 'ENS subname not found for this phone number' 
      });
    }

    res.json({
      success: true,
      ensName: subname.fullName,
      subname: subname
    });
  } catch (error) {
    console.error('ENS lookup error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get ENS subname' 
    });
  }
});

// Get user's ENS subname by wallet address
router.get('/address/:walletAddress', authenticateToken, async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid wallet address format' 
      });
    }

    const subname = await getUserSubnameByAddress(walletAddress);
    
    if (!subname) {
      return res.status(404).json({ 
        success: false, 
        error: 'ENS subname not found for this wallet address' 
      });
    }

    res.json({
      success: true,
      ensName: subname.fullName,
      subname: subname
    });
  } catch (error) {
    console.error('ENS lookup by address error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get ENS subname' 
    });
  }
});

// Update ENS text records
router.put('/update/:phoneNumber', authenticateToken, async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const { textRecords } = req.body;
    
    if (!textRecords || typeof textRecords !== 'object') {
      return res.status(400).json({ 
        success: false, 
        error: 'Text records object is required' 
      });
    }

    await updateUserSubname(phoneNumber, textRecords);
    
    res.json({
      success: true,
      ensName: `${phoneNumber}.upal.eth`,
      message: 'ENS text records updated successfully'
    });
  } catch (error) {
    console.error('ENS update error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update ENS subname' 
    });
  }
});

// Resolve ENS name
router.get('/resolve/:ensName', async (req, res) => {
  try {
    const { ensName } = req.params;
    
    if (!ensName.endsWith('.upal.eth')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Only UPAL ENS names are supported' 
      });
    }

    const resolved = await resolveENSName(ensName);
    
    if (!resolved) {
      return res.status(404).json({ 
        success: false, 
        error: 'ENS name not found' 
      });
    }

    res.json({
      success: true,
      ensName,
      resolved
    });
  } catch (error) {
    console.error('ENS resolve error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to resolve ENS name' 
    });
  }
});

module.exports = router;
// Utility functions for user management

// Add or update user in the global users list
export const addUserToGlobalList = (userData) => {
  try {
    const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
    
    // Check if user already exists
    const existingUserIndex = allUsers.findIndex(u => 
      u.phone === userData.phone || 
      u.walletAddress === userData.walletAddress ||
      (userData.ensName && u.ensName === userData.ensName)
    );
    
    const userEntry = {
      id: userData.phone || userData.walletAddress,
      phone: userData.phone,
      ensName: userData.ensName,
      walletAddress: userData.walletAddress,
      upiId: userData.upiId || null,
      lastUpdated: new Date().toISOString()
    };
    
    if (existingUserIndex >= 0) {
      // Update existing user
      allUsers[existingUserIndex] = { ...allUsers[existingUserIndex], ...userEntry };
    } else {
      // Add new user
      allUsers.push(userEntry);
    }
    
    localStorage.setItem('allUsers', JSON.stringify(allUsers));
    return true;
  } catch (error) {
    console.error('Error updating global users list:', error);
    return false;
  }
};

// Find user by any identifier
export const findUserByIdentifier = (identifier) => {
  try {
    const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
    return allUsers.find(u => 
      u.phone === identifier || 
      u.ensName === identifier || 
      u.walletAddress === identifier ||
      u.upiId === identifier
    );
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
};

// Get all users for contact suggestions
export const getAllUsers = () => {
  try {
    return JSON.parse(localStorage.getItem('allUsers') || '[]');
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
};

// Generate bill number
export const generateBillNumber = (category = 'BILL') => {
  const timestamp = Date.now().toString().slice(-6);
  const year = new Date().getFullYear();
  return `${category.toUpperCase()}-${timestamp}-${year}`;
};

// Validate recipient format
export const validateRecipient = (recipient, type) => {
  switch (type) {
    case 'phone':
      return /^\+?[\d\s-()]{10,}$/.test(recipient);
    case 'ens':
      return /^[a-zA-Z0-9.-]+\.eth$/.test(recipient);
    case 'wallet':
      return /^0x[a-fA-F0-9]{40}$/.test(recipient);
    case 'upi':
      return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(recipient);
    default:
      return false;
  }
};
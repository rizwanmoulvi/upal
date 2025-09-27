const { createOffchainClient, ChainName } = require('@thenamespace/offchain-manager');

// Initialize the Namespace Ninja client
const API_KEY = process.env.NAMESPACE_API_KEY;
if (!API_KEY) {
  console.warn('NAMESPACE_API_KEY not found in environment variables. ENS features will be disabled.');
}

let client = null;
if (API_KEY) {
  try {
    client = createOffchainClient({ 
      mode: 'sepolia', // Use 'sepolia' for testing, 'mainnet' for production
      timeout: 10000,
      defaultApiKey: API_KEY,
    });
    console.log('ENS Offchain client initialized successfully (sepolia mode)');
  } catch (error) {
    console.error('Failed to initialize ENS client:', error);
  }
}

const PARENT_NAME = 'upal.eth'; // Your main ENS domain

/**
 * Check if an ENS subname is available
 * @param {string} phoneNumber - User's phone number (without country code)
 * @returns {Promise<boolean>} - Whether the subname is available
 */
const isSubnameAvailable = async (phoneNumber) => {
  if (!client) {
    throw new Error('ENS client not initialized. Please check NAMESPACE_API_KEY.');
  }

  try {
    const subname = `${phoneNumber}.${PARENT_NAME}`;
    const { isAvailable } = await client.isSubnameAvailable(subname);
    return isAvailable;
  } catch (error) {
    console.error('Error checking subname availability:', error);
    throw new Error(`Failed to check ENS availability: ${error.message}`);
  }
};

/**
 * Create an ENS subname for a user
 * @param {string} phoneNumber - User's phone number (without country code)
 * @param {string} walletAddress - User's wallet address
 * @param {string} userName - User's display name (optional)
 * @returns {Promise<string>} - The created ENS subname
 */
const createUserSubname = async (phoneNumber, walletAddress, userName = null) => {
  if (!client) {
    throw new Error('ENS client not initialized. Please check NAMESPACE_API_KEY.');
  }

  try {
    const subLabel = phoneNumber;
    const fullSubname = `${subLabel}.${PARENT_NAME}`;

    // First check if it's available
    const available = await isSubnameAvailable(phoneNumber);
    if (!available) {
      throw new Error(`ENS subname ${fullSubname} is already taken`);
    }

    // Create the subname with user data
    const subnameData = {
      label: subLabel,
      parentName: PARENT_NAME,
      texts: [
        { key: 'name', value: userName || `User ${phoneNumber}` },
        { key: 'description', value: 'UPAL Wallet User' },
        { key: 'url', value: 'https://upal.eth' },
        { key: 'avatar', value: '🙂' },
        { key: 'phone', value: phoneNumber },
      ],
      addresses: [
        { chain: ChainName.Ethereum, value: walletAddress }, // Main Ethereum address
      ],
      owner: walletAddress,
      metadata: [
        { key: 'creator', value: 'upal-app' },
        { key: 'createdAt', value: new Date().toISOString() },
        { key: 'phone', value: phoneNumber },
        { key: 'walletAddress', value: walletAddress },
      ],
    };
    
    console.log('Creating ENS subname with data:', JSON.stringify(subnameData, null, 2));
    await client.createSubname(subnameData);

    console.log(`Created ENS subname: ${fullSubname} for wallet: ${walletAddress}`);
    return fullSubname;
  } catch (error) {
    console.error('Error creating ENS subname:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    throw new Error(`Failed to create ENS subname: ${error.message}`);
  }
};

/**
 * Get user's ENS subname by phone number
 * @param {string} phoneNumber - User's phone number
 * @returns {Promise<object|null>} - ENS subname data or null if not found
 */
const getUserSubname = async (phoneNumber) => {
  if (!client) {
    return null;
  }

  try {
    const page = await client.getFilteredSubnames({
      parentName: PARENT_NAME,
      labelSearch: phoneNumber,
      page: 1,
      size: 1,
    });

    const subname = page.items.find(item => item.label === phoneNumber);
    return subname || null;
  } catch (error) {
    console.error('Error getting user subname:', error);
    return null;
  }
};

/**
 * Get user's ENS subname by wallet address
 * @param {string} walletAddress - User's wallet address
 * @returns {Promise<object|null>} - ENS subname data or null if not found
 */
const getUserSubnameByAddress = async (walletAddress) => {
  if (!client) {
    return null;
  }

  try {
    const page = await client.getFilteredSubnames({
      parentName: PARENT_NAME,
      owner: walletAddress,
      page: 1,
      size: 1,
    });

    return page.items.length > 0 ? page.items[0] : null;
  } catch (error) {
    console.error('Error getting user subname by address:', error);
    return null;
  }
};

/**
 * Update user's ENS subname text records
 * @param {string} phoneNumber - User's phone number
 * @param {object} textRecords - Key-value pairs of text records to update
 * @returns {Promise<boolean>} - Success status
 */
const updateUserSubname = async (phoneNumber, textRecords) => {
  if (!client) {
    throw new Error('ENS client not initialized. Please check NAMESPACE_API_KEY.');
  }

  try {
    const subname = `${phoneNumber}.${PARENT_NAME}`;
    
    // Convert textRecords object to array format
    const texts = Object.entries(textRecords).map(([key, value]) => ({ key, value }));
    
    await client.updateSubname({
      subname: subname,
      texts: texts,
    });

    console.log(`Updated ENS subname: ${subname}`);
    return true;
  } catch (error) {
    console.error('Error updating ENS subname:', error);
    throw new Error(`Failed to update ENS subname: ${error.message}`);
  }
};

/**
 * Resolve ENS name to get text records and addresses
 * @param {string} ensName - ENS name to resolve (e.g., "1234567890.upal.eth")
 * @returns {Promise<object|null>} - Resolved ENS data or null if not found
 */
const resolveENSName = async (ensName) => {
  if (!client) {
    return null;
  }

  try {
    // Get the subname data
    const parts = ensName.split('.');
    if (parts.length < 3 || parts[1] !== 'upal' || parts[2] !== 'eth') {
      throw new Error('Invalid UPAL ENS name format');
    }

    const phoneNumber = parts[0];
    const subname = await getUserSubname(phoneNumber);
    
    if (!subname) {
      return null;
    }

    // Get text records
    const textRecords = await client.getTextRecords(ensName);

    return {
      name: ensName,
      owner: subname.owner,
      addresses: subname.addresses,
      texts: textRecords,
      metadata: subname.metadata,
    };
  } catch (error) {
    console.error('Error resolving ENS name:', error);
    return null;
  }
};

module.exports = {
  isSubnameAvailable,
  createUserSubname,
  getUserSubname,
  getUserSubnameByAddress,
  updateUserSubname,
  resolveENSName,
};
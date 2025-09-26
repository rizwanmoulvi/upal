// Utility functions for QR code processing

/**
 * Detects if a string is a UPI ID
 * UPI format: username@bank or phone@paytm, etc.
 */
export const isUPIId = (text) => {
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9.\-_]{2,64}$/;
  return upiRegex.test(text);
};

/**
 * Detects if a string is an Ethereum wallet address (including ENS)
 * Ethereum address: 0x followed by 40 hex characters
 * ENS: ends with .eth
 */
export const isEthereumAddress = (text) => {
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  const ensRegex = /^[a-zA-Z0-9.-]+\.eth$/;
  return ethAddressRegex.test(text) || ensRegex.test(text);
};

/**
 * Detects if a string is a Flow wallet address
 * Flow addresses are typically 16 characters without 0x prefix
 */
export const isFlowAddress = (text) => {
  const flowAddressRegex = /^[a-fA-F0-9]{16}$/;
  return flowAddressRegex.test(text);
};

/**
 * Detects if a string is a generic wallet address (could be Flow or Ethereum)
 */
export const isWalletAddress = (text) => {
  return isEthereumAddress(text) || isFlowAddress(text);
};

/**
 * Extracts UPI ID from various UPI QR code formats
 * UPI QR codes can be in different formats:
 * - Direct UPI ID: user@bank
 * - UPI URL: upi://pay?pa=user@bank&...
 * - Payment URL with UPI parameters
 */
export const extractUPIId = (text) => {
  // Direct UPI ID
  if (isUPIId(text)) {
    return text;
  }
  
  // UPI URL format
  const upiUrlMatch = text.match(/upi:\/\/pay\?.*pa=([^&]+)/i);
  if (upiUrlMatch) {
    return decodeURIComponent(upiUrlMatch[1]);
  }
  
  // Other URL formats with UPI parameter
  const urlMatch = text.match(/[?&]pa=([^&]+)/i);
  if (urlMatch) {
    const extracted = decodeURIComponent(urlMatch[1]);
    if (isUPIId(extracted)) {
      return extracted;
    }
  }
  
  return null;
};

/**
 * Extracts Ethereum address and chain info from various wallet QR formats
 * Returns: { address: string, chainId?: number } or null
 */
export const extractEthereumInfo = (text) => {
  console.log('=== EXTRACTING ETHEREUM INFO ===');
  console.log('Input text:', text);
  
  // Ethereum URI format with chain ID: ethereum:0x...@0x... (MetaMask format)
  console.log('Testing MetaMask pattern: /ethereum:(0x[a-fA-F0-9]{40})@0x([a-fA-F0-9]+)/i');
  const ethUriWithChainMatch = text.match(/ethereum:(0x[a-fA-F0-9]{40})@0x([a-fA-F0-9]+)/i);
  console.log('MetaMask pattern match result:', ethUriWithChainMatch);
  
  if (ethUriWithChainMatch) {
    const address = ethUriWithChainMatch[1];
    const chainId = parseInt(ethUriWithChainMatch[2], 16);
    console.log('Detected MetaMask format - Address:', address, 'Chain ID:', chainId);
    return { address, chainId };
  }
  
  // Simple Ethereum URI format: ethereum:0x...
  const ethUriMatch = text.match(/ethereum:(0x[a-fA-F0-9]{40})/i);
  if (ethUriMatch) {
    return { address: ethUriMatch[1] };
  }
  
  // Direct Ethereum address
  if (isEthereumAddress(text)) {
    return { address: text };
  }
  
  // Try to parse as JSON (some wallets use this)
  try {
    const parsed = JSON.parse(text);
    if (parsed.address && isEthereumAddress(parsed.address)) {
      return { 
        address: parsed.address, 
        chainId: parsed.chainId || parsed.chain_id 
      };
    }
    if (parsed.account && isEthereumAddress(parsed.account)) {
      return { 
        address: parsed.account, 
        chainId: parsed.chainId || parsed.chain_id 
      };
    }
    if (parsed.wallet && isEthereumAddress(parsed.wallet)) {
      return { 
        address: parsed.wallet, 
        chainId: parsed.chainId || parsed.chain_id 
      };
    }
  } catch {
    // Not JSON, continue with other checks
  }
  
  // Look for any Ethereum address pattern in the text
  const addressMatch = text.match(/0x[a-fA-F0-9]{40}/);
  if (addressMatch && isEthereumAddress(addressMatch[0])) {
    return { address: addressMatch[0] };
  }
  
  // ENS domain
  const ensMatch = text.match(/[a-zA-Z0-9.-]+\.eth/);
  if (ensMatch) {
    return { address: ensMatch[0] };
  }
  
  console.log('=== NO ETHEREUM INFO FOUND ===');
  return null;
};

/**
 * Extracts Ethereum address from various wallet QR formats (backward compatibility)
 */
export const extractEthereumAddress = (text) => {
  const info = extractEthereumInfo(text);
  return info ? info.address : null;
};

/**
 * Test function to verify QR analysis
 */
export const testQRAnalysis = () => {
  console.log('=== TESTING QR ANALYSIS ===');
  
  const testCases = [
    'upi://pay?pa=rauneet234-1@oksbi&pn=Rauneet%20Raj&aid=uGICAgMC0uvOLGQ',
    'ethereum:0x6D5EE220E17C9cF3c48b9eaDefC17Bc5449365D9@0x1e'
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`\n--- Test Case ${index + 1} ---`);
    console.log('Input:', testCase);
    const result = analyzeQRCode(testCase);
    console.log('Result:', result);
  });
  
  console.log('=== END TESTING ===');
};

/**
 * Determines the payment mode based on QR code content
 * Returns: { mode: 'upi' | 'crypto' | 'wallet-connect', address: string, network?: 'flow' | 'ethereum' }
 */
export const analyzeQRCode = (text) => {
  console.log('=== ANALYZING QR CODE ===');
  console.log('Input text:', text);
  console.log('Text type:', typeof text);
  console.log('Text length:', text?.length);
  
  // Try to extract UPI ID first
  const upiId = extractUPIId(text);
  if (upiId) {
    return {
      mode: 'upi',
      address: upiId,
      bank: upiId.split('@')[1] // Extract bank/provider
    };
  }
  
  // Try to extract Ethereum address and chain info (handles MetaMask and other wallet formats)
  console.log('Trying to extract Ethereum info...');
  const ethInfo = extractEthereumInfo(text);
  console.log('Ethereum extraction result:', ethInfo);
  
  if (ethInfo) {
    const result = {
      mode: 'crypto',
      address: ethInfo.address,
      network: 'ethereum'
    };
    
    // Add chain information if available
    if (ethInfo.chainId) {
      result.chainId = ethInfo.chainId;
      // Map common chain IDs to readable names
      const chainNames = {
        1: 'Ethereum Mainnet',
        11155111: 'Ethereum Sepolia',
        5: 'Ethereum Goerli',
        137: 'Polygon Mainnet',
        80001: 'Polygon Mumbai'
      };
      result.chainName = chainNames[ethInfo.chainId] || `Chain ID ${ethInfo.chainId}`;
      
      // Warn if not Sepolia (since that's what we support for PYUSD)
      if (ethInfo.chainId !== 11155111) {
        result.warning = `This address is for ${result.chainName}, but we only support Ethereum Sepolia for PYUSD payments.`;
      }
    }
    
    return result;
  }
  
  // Check for Flow address
  if (isFlowAddress(text)) {
    return {
      mode: 'crypto',
      address: text,
      network: 'flow'
    };
  }
  
  // Check for WalletConnect or other connection protocols
  if (text.includes('wc:') || text.includes('walletconnect')) {
    return {
      mode: 'wallet-connect',
      address: text,
      protocol: 'walletconnect',
      message: 'This appears to be a wallet connection QR code, not a payment address'
    };
  }
  
  // Check if it might be a Bitcoin or other crypto address
  if (text.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/) || text.match(/^bc1[a-z0-9]{39,59}$/)) {
    return {
      mode: 'crypto',
      address: text,
      network: 'bitcoin',
      message: 'Bitcoin addresses are not supported yet'
    };
  }
  
  // Unknown format - log for debugging
  console.log('Unknown QR format, raw content:', text);
  return {
    mode: 'unknown',
    address: text,
    message: 'QR code format not recognized. Please ensure it contains a valid payment address.'
  };
};

/**
 * Validates and formats addresses for different networks
 */
export const formatAddress = (address, network) => {
  if (network === 'ethereum') {
    // Ensure Ethereum address has proper checksum (basic validation)
    if (address.startsWith('0x') && address.length === 42) {
      return address.toLowerCase();
    }
    // ENS domains are returned as-is
    if (address.endsWith('.eth')) {
      return address.toLowerCase();
    }
  }
  
  if (network === 'flow') {
    // Flow addresses should be 16 hex characters
    if (address.length === 16) {
      return address.toLowerCase();
    }
  }
  
  return address;
};
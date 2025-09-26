import axios from 'axios';
import { ethers } from 'ethers';
import { DEFAULT_NETWORK } from '../config/networks.js';

const API_BASE_URL = 'http://localhost:3001/api';

// Get auth headers for API calls
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Store encrypted keystore on server
export const storeKeystore = async (encryptedKeystore, walletAddress) => {
  const response = await axios.post(`${API_BASE_URL}/keystore`, {
    encryptedKeystore,
    walletAddress
  }, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Fetch encrypted keystore from server
export const fetchKeystore = async () => {
  const response = await axios.get(`${API_BASE_URL}/keystore`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Decrypt wallet from keystore with PIN
export const decryptWallet = async (encryptedKeystore, pin) => {
  try {
    const wallet = await ethers.Wallet.fromEncryptedJson(encryptedKeystore, pin);
    return wallet;
  } catch {
    throw new Error('Invalid PIN or corrupted wallet data');
  }
};

// Generate new wallet with mnemonic
export const generateWallet = () => {
  try {
    const wallet = ethers.Wallet.createRandom();
    return {
      wallet,
      mnemonic: wallet.mnemonic.phrase,
      address: wallet.address,
      privateKey: wallet.privateKey
    };
  } catch {
    throw new Error('Failed to generate wallet');
  }
};

// Encrypt wallet with PIN
export const encryptWallet = async (wallet, pin) => {
  try {
    const encryptedKeystore = await wallet.encrypt(pin);
    return encryptedKeystore;
  } catch {
    throw new Error('Failed to encrypt wallet');
  }
};

// Validate mnemonic phrase
export const validateMnemonic = (mnemonic) => {
  try {
    ethers.Mnemonic.fromPhrase(mnemonic);
    return true;
  } catch {
    return false;
  }
};

// Create wallet from mnemonic
export const createWalletFromMnemonic = (mnemonic) => {
  try {
    const wallet = ethers.Wallet.fromPhrase(mnemonic);
    return wallet;
  } catch {
    throw new Error('Invalid mnemonic phrase');
  }
};

// Get Flow provider instance
export const getFlowProvider = () => {
  try {
    const provider = new ethers.JsonRpcProvider(DEFAULT_NETWORK.rpcUrl);
    return provider;
  } catch {
    throw new Error('Failed to connect to Flow network');
  }
};

// Get Flow token balance for an address
export const getFlowBalance = async (address) => {
  try {
    const provider = getFlowProvider();
    const balance = await provider.getBalance(address);
    // Convert from Wei to FLOW (18 decimals)
    const flowBalance = ethers.formatEther(balance);
    return flowBalance;
  } catch {
    throw new Error('Failed to fetch Flow balance');
  }
};

// Connect wallet to Flow network
export const connectWalletToFlow = (wallet) => {
  try {
    const provider = getFlowProvider();
    const connectedWallet = wallet.connect(provider);
    return connectedWallet;
  } catch {
    throw new Error('Failed to connect wallet to Flow network');
  }
};

// Get network info
export const getNetworkInfo = () => {
  return DEFAULT_NETWORK;
};

// Resolve ENS name to address
export const resolveENS = async (ensName) => {
  try {
    const provider = getFlowProvider();
    const address = await provider.resolveName(ensName);
    return address;
  } catch {
    throw new Error('Failed to resolve ENS name');
  }
};

// Send native FLOW tokens
export const sendFlowTokens = async (wallet, toAddress, amount) => {
  try {
    const provider = getFlowProvider();
    const connectedWallet = wallet.connect(provider);
    
    const transaction = {
      to: toAddress,
      value: ethers.parseEther(amount.toString()),
      gasLimit: 21000,
    };
    
    const tx = await connectedWallet.sendTransaction(transaction);
    return tx;
  } catch (error) {
    throw new Error(`Failed to send FLOW tokens: ${error.message}`);
  }
};

// Send ERC-20 tokens (like PYUSD)
export const sendERC20Tokens = async (wallet, tokenAddress, toAddress, amount, decimals = 18) => {
  try {
    const provider = getFlowProvider();
    const connectedWallet = wallet.connect(provider);
    
    // ERC-20 contract ABI for transfer function
    const erc20ABI = [
      "function transfer(address to, uint256 amount) returns (bool)",
      "function balanceOf(address owner) view returns (uint256)",
      "function decimals() view returns (uint8)"
    ];
    
    const contract = new ethers.Contract(tokenAddress, erc20ABI, connectedWallet);
    const parsedAmount = ethers.parseUnits(amount.toString(), decimals);
    
    const tx = await contract.transfer(toAddress, parsedAmount);
    return tx;
  } catch (error) {
    throw new Error(`Failed to send ERC-20 tokens: ${error.message}`);
  }
};

// Get token balance (ERC-20)
export const getTokenBalance = async (walletAddress, tokenAddress, decimals = 18) => {
  try {
    const provider = getFlowProvider();
    
    const erc20ABI = [
      "function balanceOf(address owner) view returns (uint256)",
      "function decimals() view returns (uint8)"
    ];
    
    const contract = new ethers.Contract(tokenAddress, erc20ABI, provider);
    const balance = await contract.balanceOf(walletAddress);
    
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    throw new Error(`Failed to get token balance: ${error.message}`);
  }
};

// Get current gas price
export const getGasPrice = async () => {
  try {
    const provider = getFlowProvider();
    const gasPrice = await provider.getFeeData();
    return gasPrice;
  } catch (error) {
    throw new Error(`Failed to get gas price: ${error.message}`);
  }
};
import axios from 'axios';
import { ethers } from 'ethers';
import { DEFAULT_NETWORK, CURRENCY_NETWORKS, TOKENS } from '../config/networks.js';

const API_BASE_URL = 'https://api.upal.rizzmo.site/api';

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

// Get provider instance for a specific network
export const getProvider = (network) => {
  try {
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);
    return provider;
  } catch {
    throw new Error(`Failed to connect to ${network.name}`);
  }
};

// Get Flow provider instance (legacy - kept for backward compatibility)
export const getFlowProvider = () => {
  return getProvider(DEFAULT_NETWORK);
};

// Get token contract address for a specific network
export const getTokenAddress = (tokenSymbol, network) => {
  const token = TOKENS[tokenSymbol.toUpperCase()];
  if (!token) {
    throw new Error(`Token ${tokenSymbol} not supported`);
  }

  // Map network to contract address
  if (network.chainId === 11155111) { // Ethereum Sepolia
    return token.contracts.sepolia;
  } else if (network.chainId === 1) { // Ethereum Mainnet
    return token.contracts.mainnet;
  } else if (network.chainId === 545) { // Flow Testnet
    return token.contracts.flowTestnet;
  }
  
  throw new Error(`Token ${tokenSymbol} not available on ${network.name}`);
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
// Send native tokens on any network
export const sendNativeTokens = async (wallet, toAddress, amount, network) => {
  try {
    const provider = getProvider(network);
    const connectedWallet = wallet.connect(provider);
    
    const transaction = {
      to: toAddress,
      value: ethers.parseEther(amount.toString()),
      gasLimit: 21000,
    };
    
    const tx = await connectedWallet.sendTransaction(transaction);
    return tx;
  } catch (error) {
    throw new Error(`Failed to send ${network.nativeCurrency.symbol} tokens: ${error.message}`);
  }
};

// Legacy function for Flow tokens (kept for backward compatibility)
export const sendFlowTokens = async (wallet, toAddress, amount) => {
  return sendNativeTokens(wallet, toAddress, amount, CURRENCY_NETWORKS.flow);
};

// Send PYUSD tokens on Sepolia network
export const sendPYUSDTokens = async (wallet, toAddress, amount) => {
  try {
    const network = CURRENCY_NETWORKS.pyusd;
    const tokenAddress = getTokenAddress('PYUSD', network);
    const decimals = TOKENS.PYUSD.decimals;
    
    return await sendERC20Tokens(wallet, tokenAddress, toAddress, amount, decimals, network);
  } catch (error) {
    throw new Error(`Failed to send PYUSD tokens: ${error.message}`);
  }
};

// Send ERC-20 tokens (like PYUSD)
export const sendERC20Tokens = async (wallet, tokenAddress, toAddress, amount, decimals = 18, network = null) => {
  try {
    // Use provided network or default to Flow testnet for backward compatibility
    const targetNetwork = network || CURRENCY_NETWORKS.flow;
    const provider = getProvider(targetNetwork);
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
export const getTokenBalance = async (walletAddress, tokenAddress, decimals = 18, network = null) => {
  try {
    // Use provided network or default to Flow testnet for backward compatibility
    const targetNetwork = network || CURRENCY_NETWORKS.flow;
    const provider = getProvider(targetNetwork);
    
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

// Get PYUSD balance on Sepolia network
export const getPYUSDBalance = async (walletAddress) => {
  try {
    const network = CURRENCY_NETWORKS.pyusd;
    const tokenAddress = getTokenAddress('PYUSD', network);
    const decimals = TOKENS.PYUSD.decimals;
    
    return await getTokenBalance(walletAddress, tokenAddress, decimals, network);
  } catch (error) {
    throw new Error(`Failed to get PYUSD balance: ${error.message}`);
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
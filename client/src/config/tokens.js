// Token configurations for Flow Testnet

export const TOKENS = {
  FLOW: {
    symbol: 'FLOW',
    name: 'Flow Token',
    address: 'native', // Native token doesn't have a contract address
    decimals: 18,
    isNative: true,
    network: 'Flow Testnet'
  },
  PYUSD: {
    symbol: 'PYUSD',
    name: 'PayPal USD',
    address: '0x1234567890123456789012345678901234567890', // Placeholder - replace with actual PYUSD contract address on Flow
    decimals: 6,
    isNative: false,
    network: 'Flow Testnet'
  }
};

export const getTokenConfig = (symbol) => {
  return TOKENS[symbol] || null;
};

export const getAllTokens = () => {
  return Object.values(TOKENS);
};
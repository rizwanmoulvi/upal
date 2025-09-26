// Network configurations for supported blockchains
export const NETWORKS = {
  FLOW_TESTNET: {
    name: 'Flow Testnet',
    rpcUrl: 'https://testnet.evm.nodes.onflow.org',
    chainId: 545, // 0x221 in decimal
    chainIdHex: '0x221',
    nativeCurrency: {
      name: 'Flow',
      symbol: 'FLOW',
      decimals: 18
    },
    blockExplorer: 'https://evm-testnet.flowscan.org'
  },
  // Can add more networks later
  ETHEREUM_MAINNET: {
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    chainId: 1,
    chainIdHex: '0x1',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorer: 'https://etherscan.io'
  }
};

// Token configurations
export const TOKENS = {
  PYUSD: {
    name: 'PayPal USD',
    symbol: 'PYUSD',
    decimals: 6,
    // Note: This is a placeholder address - replace with actual PYUSD contract on Flow testnet
    address: '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8', // Ethereum mainnet address for reference
    flowTestnetAddress: '0x...' // TODO: Add actual Flow testnet PYUSD address when available
  }
};

// Default network for the app
export const DEFAULT_NETWORK = NETWORKS.FLOW_TESTNET;
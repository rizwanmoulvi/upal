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
  ETHEREUM_SEPOLIA: {
    name: 'Ethereum Sepolia',
    rpcUrl: 'https://api.zan.top/eth-sepolia',
    chainId: 11155111, // 0xaa36a7 in decimal
    chainIdHex: '0xaa36a7',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'SepoliaETH',
      decimals: 18
    },
    blockExplorer: 'https://sepolia.etherscan.io'
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
    contracts: {
      mainnet: '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8', // Ethereum mainnet
      sepolia: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9', // Ethereum Sepolia testnet
      flowTestnet: null // TODO: Add when available
    }
  }
};

// Network mapping for different currencies
export const CURRENCY_NETWORKS = {
  flow: NETWORKS.FLOW_TESTNET,
  pyusd: NETWORKS.ETHEREUM_SEPOLIA,
  upi: null, // UPI doesn't use blockchain
  inr: null  // INR doesn't use blockchain
};

// Default network for the app
export const DEFAULT_NETWORK = NETWORKS.FLOW_TESTNET;
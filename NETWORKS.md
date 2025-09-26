# Network Configuration

## Supported Networks

### 1. Flow Testnet (for FLOW tokens)
- **Network**: Flow EVM Testnet
- **Chain ID**: 545 (0x221)
- **RPC URL**: https://testnet.evm.nodes.onflow.org
- **Currency**: FLOW (native token)
- **Explorer**: https://evm-testnet.flowscan.org

### 2. Ethereum Sepolia (for PYUSD tokens)
- **Network**: Ethereum Sepolia Testnet  
- **Chain ID**: 11155111 (0xaa36a7)
- **RPC URL**: https://api.zan.top/eth-sepolia
- **Currency**: SepoliaETH (native), PYUSD (ERC-20)
- **PYUSD Contract**: `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9`
- **Explorer**: https://sepolia.etherscan.io

## Token Contracts

### PYUSD (PayPal USD)
- **Symbol**: PYUSD
- **Decimals**: 6
- **Sepolia Contract**: `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9`

## Usage

- **FLOW transactions**: Use Flow Testnet
- **PYUSD transactions**: Use Ethereum Sepolia
- **UPI/INR transactions**: Off-chain (traditional banking)

## Setup Notes

### Current RPC Configuration:
- **Ethereum Sepolia**: Using ZAN public endpoint (https://api.zan.top/eth-sepolia)
- **Flow Testnet**: Using official Flow testnet endpoint

### Alternative RPC Endpoints:
For production or if you need higher rate limits:
- Alchemy: https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
- Infura: https://sepolia.infura.io/v3/YOUR_PROJECT_ID
- QuickNode: Your custom Sepolia endpoint
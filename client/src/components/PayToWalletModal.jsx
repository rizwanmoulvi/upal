import { useState, useRef, useEffect } from 'react';
import { X, QrCode, Scan, Send, AlertCircle } from 'lucide-react';
import { ethers } from 'ethers';
import { 
  resolveENS, 
  sendFlowTokens, 
  sendERC20Tokens, 
  fetchKeystore, 
  decryptWallet 
} from '../utils/walletService';
import { getTokenConfig } from '../config/tokens';

function PayToWalletModal({ isOpen, onClose, initialAmount }) {
  const [step, setStep] = useState(1); // 1: Enter address, 2: Select token & amount, 3: Enter PIN, 4: Confirm
  const [walletAddress, setWalletAddress] = useState('');
  const [ensName, setEnsName] = useState('');
  const [selectedToken, setSelectedToken] = useState('FLOW'); // Default to FLOW
  const [amount, setAmount] = useState(initialAmount || '');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isValidAddress, setIsValidAddress] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const fileInputRef = useRef(null);

  const tokens = [
    { symbol: 'FLOW', name: 'Flow Token', network: 'Flow Testnet', decimals: 18, isNative: true },
    { symbol: 'PYUSD', name: 'PayPal USD', network: 'Flow Testnet', decimals: 6, isNative: false }
  ];

  // Update amount when modal opens with initial amount
  useEffect(() => {
    if (isOpen && initialAmount) {
      setAmount(initialAmount);
    }
  }, [isOpen, initialAmount]);

  const validateAddress = async (address) => {
    try {
      if (address.endsWith('.eth')) {
        // ENS name validation - try to resolve it
        setEnsName(address);
        try {
          const resolvedAddress = await resolveENS(address);
          if (resolvedAddress) {
            setWalletAddress(resolvedAddress);
            setIsValidAddress(true);
            return true;
          }
        } catch {
          setError('Could not resolve ENS name');
          setIsValidAddress(false);
          return false;
        }
      } else if (ethers.isAddress(address)) {
        // Ethereum address validation
        setWalletAddress(address);
        setEnsName('');
        setIsValidAddress(true);
        return true;
      } else {
        setIsValidAddress(false);
        return false;
      }
    } catch {
      setIsValidAddress(false);
      return false;
    }
  };

  const handleAddressChange = async (value) => {
    setWalletAddress(value);
    setError('');
    
    if (value.length > 0) {
      await validateAddress(value);
    } else {
      setIsValidAddress(false);
      setEnsName('');
    }
  };

  const handleQRUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // In a real implementation, you would use a QR code reader library
      // For now, we'll just show a placeholder
      setError('QR code scanning not implemented yet. Please enter address manually.');
    }
  };

  const handleNext = () => {
    if (step === 1 && isValidAddress) {
      setStep(2);
    } else if (step === 2 && amount && selectedToken) {
      setStep(3);
    } else if (step === 3 && pin.length >= 6) {
      setStep(4);
    }
  };

  const handleSend = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Get user's encrypted keystore
      const keystoreData = await fetchKeystore();
      
      // Decrypt the wallet with user's PIN
      const wallet = await decryptWallet(keystoreData.encryptedKeystore, pin);
      
      let transaction;
      const targetAddress = walletAddress;
      const tokenConfig = getTokenConfig(selectedToken);
      
      if (tokenConfig.isNative) {
        // Send native FLOW tokens
        transaction = await sendFlowTokens(wallet, targetAddress, amount);
      } else {
        // Send ERC-20 tokens (like PYUSD)
        transaction = await sendERC20Tokens(
          wallet, 
          tokenConfig.address, 
          targetAddress, 
          amount, 
          tokenConfig.decimals
        );
      }
      
      console.log('Transaction sent:', transaction.hash);
      
      // Close modal on success
      onClose();
      alert(`Transaction sent! Hash: ${transaction.hash}\nSent ${amount} ${selectedToken} to ${ensName || walletAddress}`);
      resetModal();
      
    } catch (error) {
      console.error('Transaction error:', error);
      setError(error.message || 'Failed to send transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setWalletAddress('');
    setEnsName('');
    setSelectedToken('FLOW');
    setAmount('');
    setPin('');
    setError('');
    setIsValidAddress(false);
    setShowQRScanner(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-black">
            {step === 1 ? 'Pay to Wallet' : 
             step === 2 ? 'Select Token & Amount' : 
             step === 3 ? 'Enter PIN' : 
             'Confirm Transaction'}
          </h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Step 1: Enter Wallet Address */}
        {step === 1 && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Address or ENS Name
              </label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => handleAddressChange(e.target.value)}
                placeholder="0x... or name.eth"
                className="w-full p-3 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {isValidAddress && (
                <div className="flex items-center mt-2 text-green-600 text-sm">
                  <AlertCircle size={16} className="mr-1" />
                  Valid address detected
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowQRScanner(!showQRScanner)}
                className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
              >
                <QrCode size={20} />
                <span className="text-gray-700">Scan QR Code</span>
              </button>
            </div>

            {showQRScanner && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleQRUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <Scan size={16} />
                  Upload QR Code Image
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Camera scanning coming soon. For now, upload a QR code image.
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleNext}
              disabled={!isValidAddress}
              className={`w-full p-3 rounded-lg font-medium ${
                isValidAddress
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Select Token & Amount */}
        {step === 2 && (
          <div className="p-4 space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Sending to:</p>
              <p className="font-mono text-sm text-black break-all">
                {ensName || walletAddress}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Token
              </label>
              <div className="space-y-2">
                {tokens.map((token) => (
                  <button
                    key={token.symbol}
                    onClick={() => setSelectedToken(token.symbol)}
                    className={`w-full p-3 rounded-lg border text-left ${
                      selectedToken === token.symbol
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-black">{token.symbol}</p>
                        <p className="text-sm text-gray-600">{token.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{token.network}</p>
                        {token.symbol === 'FLOW' && (
                          <p className="text-xs text-green-600">Used for gas</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.000001"
                className="w-full p-3 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Network: Flow Testnet • Gas paid in FLOW tokens
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 p-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!amount || !selectedToken}
                className={`flex-1 p-3 rounded-lg font-medium ${
                  amount && selectedToken
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Review
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Enter PIN */}
        {step === 3 && (
          <div className="p-4 space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Security Check:</strong> Enter your wallet PIN to authorize this transaction.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wallet PIN
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter your PIN"
                className="w-full p-3 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={6}
              />
            </div>

            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <p className="text-gray-600 mb-1">Transaction Summary:</p>
              <p><strong>To:</strong> {ensName || walletAddress}</p>
              <p><strong>Amount:</strong> {amount} {selectedToken}</p>
              <p><strong>Network:</strong> Flow Testnet</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 p-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={pin.length < 6}
                className={`flex-1 p-3 rounded-lg font-medium ${
                  pin.length >= 6
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm Transaction */}
        {step === 4 && (
          <div className="p-4 space-y-4">
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">To:</p>
                <p className="font-mono text-sm text-black break-all">
                  {ensName || walletAddress}
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Amount:</p>
                <p className="text-lg font-semibold text-black">
                  {amount} {selectedToken}
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Network:</p>
                <p className="text-sm text-black">Flow Testnet</p>
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Gas fees will be paid in FLOW tokens from your wallet.
                  Make sure you have sufficient FLOW balance for transaction fees.
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setStep(3)}
                disabled={isLoading}
                className="flex-1 p-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleSend}
                disabled={isLoading}
                className={`flex-1 p-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600'
                } text-white`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Transaction
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PayToWalletModal;
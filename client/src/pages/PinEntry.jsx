import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { 
  fetchKeystore, 
  decryptWallet, 
  sendPYUSDTokens, 
  sendFlowTokens 
} from '../utils/walletService.js';

function PinEntry() {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const paymentData = location.state?.paymentData;

  const handleNumberClick = (num) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleSubmit = async () => {
    if (pin.length !== 6) {
      setError('Please enter a 6-digit PIN');
      return;
    }

    if (!paymentData) {
      setError('Payment data not found');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Fetch encrypted keystore from server
      const keystoreData = await fetchKeystore();
      
      // Decrypt wallet using the entered PIN
      const wallet = await decryptWallet(keystoreData.encryptedKeystore, pin);
      
      let transaction;
      
      // Execute actual blockchain transaction based on payment mode
      if (paymentData.mode === 'pyusd') {
        // Send PYUSD tokens on Ethereum Sepolia
        transaction = await sendPYUSDTokens(
          wallet, 
          paymentData.recipientAddress, 
          paymentData.amount
        );
        
        // Wait for transaction to be mined
        const receipt = await transaction.wait();
        
        // Navigate to confirmation/success page with real transaction data
        navigate('/payment-success', {
          state: {
            paymentData: paymentData,
            transactionId: transaction.hash,
            transactionReceipt: receipt,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
          }
        });
      } else if (paymentData.mode === 'flow') {
        // Send FLOW tokens on Flow Testnet
        transaction = await sendFlowTokens(
          wallet, 
          paymentData.recipientAddress, 
          paymentData.amount
        );
        
        // Wait for transaction to be mined
        const receipt = await transaction.wait();
        
        // Navigate to confirmation/success page with real transaction data
        navigate('/payment-success', {
          state: {
            paymentData: paymentData,
            transactionId: transaction.hash,
            transactionReceipt: receipt,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
          }
        });
      } else if (paymentData.mode === 'upi' || paymentData.mode === 'inr') {
        // Handle UPI/INR payments - simulate the transaction locally
        const mockTransactionId = `upi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Navigate to payment success page with simulated transaction data
        navigate('/payment-success', {
          state: {
            paymentData: paymentData,
            transactionId: mockTransactionId,
            blockNumber: null,
            gasUsed: null
          }
        });
      } else {
        throw new Error('Payment mode not supported');
      }
    } catch (error) {
      console.error('Payment failed:', error);
      
      // Handle specific error types
      if (error.message.includes('Invalid PIN')) {
        setError('Invalid PIN. Please try again.');
      } else if (error.message.includes('insufficient funds')) {
        setError('Insufficient balance for this transaction.');
      } else if (error.message.includes('user rejected')) {
        setError('Transaction was cancelled.');
      } else {
        setError('Payment failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-[360px] h-[700px] bg-white rounded-3xl shadow-xl flex flex-col items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Payment Data</h2>
            <p className="text-gray-600 mb-4">Payment information not found</p>
            <button
              onClick={() => navigate('/services')}
              className="px-6 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-600 transition-colors"
            >
              Go Back to Services
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-[360px] h-[700px] bg-fuchsia-600 rounded-3xl shadow-xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <button
            onClick={goBack}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="text-white text-lg font-semibold">Enter PIN</h1>
          <div className="w-9 h-9"></div>
        </div>

        
          <div className="px-6 pb-6">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-center">
                <h2 className="text-white text-3xl font-bold mb-2">
            {paymentData.mode === 'upi' ? '₹' : 
             paymentData.mode === 'pyusd' ? ' ' : 
             ' '}{paymentData.amount}
                </h2>
                <p className="text-white/70 text-sm">
            {paymentData.mode === 'upi' ? 'UPI Payment' : 
             paymentData.mode === 'pyusd' ? 'PYUSD Payment' : 'FLOW Payment'}
                </p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex justify-between text-sm text-white/80 mb-2">
            <span>To:</span>
            <span className="font-medium">
              {paymentData.mode === 'upi' 
                ? paymentData.scannedData?.address
                : `${paymentData.recipientAddress?.slice(0, 8)}...${paymentData.recipientAddress?.slice(-6)}`
              }
            </span>
                </div>
                {paymentData.mode !== 'upi' && (
            <div className="flex justify-between text-sm text-white/80">
              <span>Network:</span>
              <span>{paymentData.mode === 'pyusd' ? 'Ethereum Sepolia' : 'Flow Testnet'}</span>
            </div>
                )}
              </div>
            </div>
          </div>

          {/* PIN Input */}
        <div className="flex-1 flex flex-col justify-center pl-6 pr-6 pb-6">
          <div className="text-center mb-2">
            <h3 className="text-white text-xl font-semibold mb-2">Enter your PIN</h3>
            <p className="text-white/70 text-sm">Confirm this payment with your 6-digit PIN</p>
          </div>

          {/* PIN Display */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full border-2 border-white/50 flex items-center justify-center"
                >
                  {pin[i] && (
                    <div className={`w-2 h-2 rounded-full bg-white ${showPin ? 'opacity-100' : 'opacity-100'}`}>
                      {showPin && <span className="text-xs text-white">{pin[i]}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>

          {/* Error Message */}
          {error && (
            <div className="text-center mb-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((num, index) => (
              <button
                key={index}
                onClick={() => {
                  if (num === '⌫') {
                    handleBackspace();
                  } else if (num !== '') {
                    handleNumberClick(num.toString());
                  }
                }}
                disabled={num === '' || isLoading}
                className={`h-12 rounded-lg text-white text-xl font-semibold transition-colors ${
                  num === ''
                    ? 'cursor-default'
                    : 'bg-white/20 hover:bg-white/30 active:bg-white/40'
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={pin.length !== 6 || isLoading}
            className={`w-full py-4 mt-4 rounded-full font-semibold transition-colors ${
              pin.length === 6 && !isLoading
                ? 'bg-white text-fuchsia-600 hover:bg-gray-100'
                : 'bg-white/30 text-white/50 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
                Processing...
              </div>
            ) : (
              'Confirm Payment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PinEntry;
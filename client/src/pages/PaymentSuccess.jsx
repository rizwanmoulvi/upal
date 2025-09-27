import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Home, Receipt, ArrowRight } from 'lucide-react';

function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAnimation, setShowAnimation] = useState(false);
  
  const paymentData = location.state?.paymentData;
  const transactionId = location.state?.transactionId;
  const blockNumber = location.state?.blockNumber;
  const gasUsed = location.state?.gasUsed;

  useEffect(() => {
    // Start animation after component mounts
    setTimeout(() => setShowAnimation(true), 100);

    // Save transaction to activity history
    const saveTransaction = async () => {
      if (!paymentData) return;

      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        const transaction = {
          id: transactionId || `tx_${paymentData.amount}_${paymentData.mode}_${Date.now()}`,
          userId: userData.phone,
          type: 'sent',
          amount: paymentData.amount,
          currency: paymentData.mode === 'upi' ? 'INR' : paymentData.mode.toUpperCase(),
          from: userData.phone || 'You',
          to: paymentData.recipientAddress,
          recipientName: paymentData.mode === 'upi' 
            ? paymentData.scannedData?.address 
            : paymentData.recipientAddress?.slice(0, 8) + '...',
          timestamp: new Date().toISOString(),
          status: 'completed',
          txHash: transactionId,
          blockNumber: blockNumber,
          gasUsed: gasUsed,
          network: paymentData.mode === 'pyusd' ? 'Ethereum Sepolia' : 
                   paymentData.mode === 'flow' ? 'Flow Testnet' : 'UPI'
        };

        // Get existing transactions from localStorage
        const existingTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        
        // Check if this transaction already exists
        const existingTransaction = existingTransactions.find(tx => 
          tx.id === transaction.id
        );

        if (!existingTransaction) {
          existingTransactions.unshift(transaction);
          localStorage.setItem('transactions', JSON.stringify(existingTransactions));
          console.log('Transaction saved to activity:', transaction);
        }
      } catch (error) {
        console.error('Failed to save transaction:', error);
      }
    };

    saveTransaction();
  }, [paymentData, transactionId, blockNumber, gasUsed]);

  const handleGoHome = () => {
    navigate('/services');
  };

  const handleViewActivity = () => {
    navigate('/activity');
  };

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-[360px] h-[700px] bg-white rounded-3xl shadow-xl flex flex-col items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Payment Data Not Found</h2>
            <p className="text-gray-600 mb-4">Unable to display payment details</p>
            <button
              onClick={() => navigate('/services')}
              className="px-6 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-600 transition-colors"
            >
              Go to Services
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-[360px] h-[700px] bg-gradient-to-br from-green-500 to-green-600 rounded-3xl shadow-xl flex flex-col">
        
        {/* Success Animation */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className={`transition-all duration-1000 ${showAnimation ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
            <div className="relative">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg">
                <CheckCircle className="h-14 w-14 text-green-500" />
              </div>
              
              {/* Ripple effect */}
              <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-white opacity-30 animate-ping"></div>
            </div>
          </div>

          <div className="text-center text-white mb-8">
            <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-white/80 text-sm">
              Your {paymentData.mode === 'upi' ? 'UPI' : paymentData.mode.toUpperCase()} payment has been completed
            </p>
          </div>

          {/* Payment Details */}
          <div className="w-full bg-white/10 rounded-2xl p-6 mb-6">
            <div className="text-center mb-4">
              <h2 className="text-white text-3xl font-bold">
                {paymentData.mode === 'upi' ? '₹' : 
             paymentData.mode === 'pyusd' ? ' ' : 
             ' '}{paymentData.amount}
              </h2>
              <p className="text-white/70 text-sm">
                {paymentData.mode === 'upi' ? 'UPI Payment' : 
                 paymentData.mode === 'pyusd' ? 'PYUSD Payment' : 'FLOW Payment'}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">To</span>
                <span className="text-white text-sm font-medium">
                  {paymentData.mode === 'upi' 
                    ? paymentData.scannedData?.address?.split('@')[0]
                    : `${paymentData.recipientAddress?.slice(0, 8)}...${paymentData.recipientAddress?.slice(-6)}`
                  }
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Network</span>
                <span className="text-white text-sm">
                  {paymentData.mode === 'upi' ? 'UPI' :
                   paymentData.mode === 'pyusd' ? 'Ethereum Sepolia' : 'Flow Testnet'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Transaction Hash</span>
                <span className="text-white text-xs font-mono">
                  {transactionId ? `${transactionId.slice(0, 8)}...${transactionId.slice(-6)}` : 'Generated'}
                </span>
              </div>
              
              {blockNumber && (
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Block Number</span>
                  <span className="text-white text-sm">
                    {blockNumber}
                  </span>
                </div>
              )}
              
              {gasUsed && (
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Gas Used</span>
                  <span className="text-white text-sm">
                    {parseInt(gasUsed).toLocaleString()}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Time</span>
                <span className="text-white text-sm">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-3">
            <button
              onClick={handleViewActivity}
              className="w-full bg-white text-green-600 py-4 rounded-2xl font-semibold shadow-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
            >
              <Receipt className="h-5 w-5" />
              <span>View in Activity</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleGoHome}
              className="w-full bg-white/20 border border-white/30 text-white py-4 rounded-2xl font-semibold hover:bg-white/30 transition-colors flex items-center justify-center space-x-2"
            >
              <Home className="h-5 w-5" />
              <span>Back to Services</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;
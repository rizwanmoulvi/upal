import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

function TransactionSuccess({ transactionData, onComplete }) {
  const navigate = useNavigate();
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    // Start animation after component mounts
    setTimeout(() => setShowAnimation(true), 100);

    // Save transaction to activity/database
    const saveTransaction = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        const transactionId = `tx_${transactionData.amount}_${transactionData.currency}_${Date.now()}`;
        
        const transaction = {
          id: transactionId,
          userId: userData.phone,
          type: 'sent',
          amount: transactionData.amount,
          currency: transactionData.currency,
          from: transactionData.from,
          to: transactionData.to,
          recipientName: transactionData.recipientName,
          timestamp: new Date().toISOString(),
          status: 'completed',
          txHash: transactionData.txHash || null
        };

        // Get existing transactions from localStorage (simulating database)
        const existingTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        
        // Check if this transaction already exists to prevent duplicates
        const existingTransaction = existingTransactions.find(tx => 
          tx.id === transactionId || 
          (tx.amount === transaction.amount && 
           tx.currency === transaction.currency && 
           tx.to === transaction.to && 
           Math.abs(new Date(tx.timestamp) - new Date(transaction.timestamp)) < 10000) // Within 10 seconds
        );

        if (!existingTransaction) {
          existingTransactions.unshift(transaction); // Add to beginning of array
          localStorage.setItem('transactions', JSON.stringify(existingTransactions));
          console.log('Transaction saved:', transaction);
        } else {
          console.log('Transaction already exists, skipping save');
        }

        // In a real app, this would be an API call:
        // await fetch('/api/transactions', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(transaction)
        // });

      } catch (error) {
        console.error('Error saving transaction:', error);
      }
    };

    saveTransaction();

    // Auto-navigate after 5 seconds
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      } else {
        navigate('/services');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [transactionData, navigate, onComplete]);

  const formatCurrency = (amount, currency) => {
    if (currency === 'upi' || currency === 'inr') {
      return `₹${amount} INR`;
    }
    return `${amount} ${currency.toUpperCase()}`;
  };

  const getPaymentMode = (currency) => {
    if (currency === 'upi' || currency === 'inr') {
      return 'UPI';
    }
    return 'Wallet'; // For flow and pyusd
  };

  const formatTime = () => {
    return new Date().toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-[360px] h-[700px] bg-fuchsia-600 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center">
          <h1 className="text-xl font-semibold text-white">Transaction Successful</h1>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-6">
          {/* Animated Check Mark */}
          <div className={`transition-all duration-1000 ${showAnimation ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}`}>
            <div className="relative">
              <CheckCircle 
                size={120} 
                className="text-white drop-shadow-lg"
              />
              <div className={`absolute inset-0 rounded-full border-4 border-white/30 ${showAnimation ? 'animate-ping' : ''}`}></div>
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Payment Sent!</h2>
            <p className="text-white/80">Your transaction was completed successfully</p>
          </div>

          {/* Transaction Details */}
          <div className="w-full bg-white/10 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/70 text-sm">Amount</span>
              <span className="text-white font-semibold text-lg">
                {formatCurrency(transactionData.amount, transactionData.currency)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/70 text-sm">Payment Mode</span>
              <span className="text-white font-medium">
                {getPaymentMode(transactionData.currency)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/70 text-sm">Sent To</span>
              <span className="text-white font-medium text-right">
                {transactionData.recipientName || transactionData.to}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/70 text-sm">Time</span>
              <span className="text-white font-medium">
                {formatTime()}
              </span>
            </div>

            {transactionData.txHash && (transactionData.currency === 'flow' || transactionData.currency === 'pyusd') && (
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Transaction ID</span>
                <span className="text-white font-mono text-xs">
                  {transactionData.txHash.slice(0, 8)}...{transactionData.txHash.slice(-6)}
                </span>
              </div>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="text-center">
            <p className="text-white/60 text-xs">Returning to home in a moment...</p>
            <div className="w-32 h-1 bg-white/20 rounded-full mt-2 mx-auto overflow-hidden">
              <div className={`h-full bg-white rounded-full transition-all duration-5000 ease-linear ${showAnimation ? 'w-full' : 'w-0'}`}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransactionSuccess;
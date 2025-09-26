import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

function Activity() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    // Load transactions from localStorage (simulating database)
    const savedTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    
    // Remove any potential duplicates based on timestamp and amount
    const uniqueTransactions = savedTransactions.filter((transaction, index, array) => {
      return index === array.findIndex(t => 
        t.amount === transaction.amount && 
        t.currency === transaction.currency && 
        t.to === transaction.to &&
        Math.abs(new Date(t.timestamp) - new Date(transaction.timestamp)) < 10000 // Within 10 seconds
      );
    });
    
    // Update localStorage if duplicates were found
    if (uniqueTransactions.length !== savedTransactions.length) {
      localStorage.setItem('transactions', JSON.stringify(uniqueTransactions));
    }
    
    setTransactions(uniqueTransactions);
  }, []);

  const formatCurrency = (amount, currency) => {
    if (currency === 'upi' || currency === 'inr') {
      return `₹${amount}`;
    }
    return `${amount} ${currency.toUpperCase()}`;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-fuchsia-600 bg-fuchsia-50';
      case 'pending': return 'text-fuchsia-600 bg-fuchsia-50';
      case 'failed': return 'text-fuchsia-600 bg-fuchsia-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const truncateAddress = (address) => {
    if (!address) return '';
    // Check if it's a wallet address (starts with 0x and is long)
    if (address.startsWith('0x') && address.length > 20) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    // For other long strings, truncate after 20 characters
    if (address.length > 20) {
      return `${address.slice(0, 17)}...`;
    }
    return address;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-[360px] h-[700px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 flex items-center bg-fuchsia-600">
          <button
            onClick={() => navigate('/services')}
            className="mr-3 p-2 hover:bg-fuchsia-500 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="text-xl font-semibold text-white">Activity</h1>
        </div>

        {/* Transaction List */}
        <div className="flex-1 overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowUpRight className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
                <p className="text-gray-500 text-sm">Your transaction history will appear here</p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${transaction.type === 'sent' ? 'bg-red-50' : 'bg-green-50'}`}>
                        {transaction.type === 'sent' ? (
                          <ArrowUpRight className="w-4 h-4 text-red-600" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.type === 'sent' ? 'Sent' : 'Received'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {transaction.type === 'sent' ? 'To' : 'From'}: {truncateAddress(transaction.recipientName || transaction.to)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${transaction.type === 'sent' ? 'text-red-600' : 'text-green-600'}`}>
                        {transaction.type === 'sent' ? '-' : '+'}
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(transaction.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-1 rounded-full font-medium ${getStatusColor(transaction.status)}`}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </span>
                    <span className="text-gray-500">
                      {(transaction.currency === 'upi' || transaction.currency === 'inr') ? 'UPI' : transaction.currency.toUpperCase()}
                    </span>
                  </div>
                  
                  {transaction.txHash && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        ID: {transaction.txHash.slice(0, 10)}...{transaction.txHash.slice(-8)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Activity;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, UserPlus } from 'lucide-react';

function Activity() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showAddToAddressBook, setShowAddToAddressBook] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    address: '',
    category: 'wallet'
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-fuchsia-600 bg-fuchsia-50';
      case 'pending': return 'text-fuchsia-600 bg-fuchsia-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatCurrency = (amount, currency) => {
    if (currency === 'upi' || currency === 'inr') {
      return `₹${amount}`;
    }
    return `${amount} ${currency.toUpperCase()}`;
  };

  const getContactCategory = (address) => {
    if (address.includes('@')) {
      return 'upi';
    }
    if (address.match(/^\+?\d{10,}$/)) {
      return 'phone';
    }
    if (address.endsWith('.eth')) {
      return 'ens';
    }
    return 'wallet';
  };



  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  useEffect(() => {
    // Get current user data
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const currentUserPhone = userData.phone;
    
    if (!currentUserPhone) {
      // If no user is logged in, show empty transactions
      setTransactions([]);
      return;
    }
    
    // Load transactions from localStorage (simulating database)
    const savedTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    
    // Filter transactions for current user only
    const userTransactions = savedTransactions.filter(transaction => 
      transaction.userId === currentUserPhone
    );
    
    // Remove any potential duplicates based on timestamp and amount
    const uniqueTransactions = userTransactions.filter((transaction, index, array) => {
      return index === array.findIndex(t => 
        t.amount === transaction.amount && 
        t.currency === transaction.currency && 
        t.to === transaction.to &&
        Math.abs(new Date(t.timestamp) - new Date(transaction.timestamp)) < 10000 // Within 10 seconds
      );
    });
    
    // Update localStorage if duplicates were found (for all transactions, not just current user)
    if (uniqueTransactions.length !== userTransactions.length) {
      // Filter out old duplicates for current user and keep other users' data
      const otherUsersTransactions = savedTransactions.filter(transaction => 
        transaction.userId !== currentUserPhone
      );
      const allTransactions = [...otherUsersTransactions, ...uniqueTransactions];
      localStorage.setItem('transactions', JSON.stringify(allTransactions));
    }
    
    setTransactions(uniqueTransactions);
  }, []);

  const handleAddToAddressBook = (transaction) => {
    setSelectedTransaction(transaction);
    const address = transaction.type === 'sent' ? transaction.to : transaction.from;
    const category = getContactCategory(address);
    setContactForm({
      name: '',
      address: address,
      category: category
    });
    setShowAddToAddressBook(true);
  };

  const saveToAddressBook = () => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const currentUserPhone = userData.phone;
    
    if (!currentUserPhone) {
      alert('Please login to add contacts');
      return;
    }
    
    const storageKey = `addressBook_${currentUserPhone}`;
    const savedData = localStorage.getItem(storageKey);
    
    // Initialize contacts structure
    let existingContacts = {
      upi: [],
      phone: [],
      ens: [],
      wallet: []
    };
    
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      // Check if it's already in the correct format
      if (parsedData && typeof parsedData === 'object' && parsedData.upi !== undefined) {
        existingContacts = parsedData;
      } else if (Array.isArray(parsedData)) {
        // Convert old flat array format to categorized format
        parsedData.forEach(contact => {
          const category = contact.category || 'wallet';
          if (existingContacts[category]) {
            existingContacts[category].push(contact);
          }
        });
      }
    }
    
    const newContact = {
      id: Date.now().toString(),
      name: contactForm.name,
      address: contactForm.address,
      category: contactForm.category,
      userId: currentUserPhone,
      dateAdded: new Date().toISOString()
    };
    
    // Add to the appropriate category
    const category = contactForm.category || 'wallet';
    existingContacts[category].push(newContact);
    
    localStorage.setItem(storageKey, JSON.stringify(existingContacts));
    setShowAddToAddressBook(false);
    setSelectedTransaction(null);
    setContactForm({ name: '', address: '', category: 'wallet' });
    alert('Contact added to address book successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-[360px] h-[700px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 flex items-center bg-fuchsia-600">
          <button
            onClick={() => navigate('/services')}
            className="mr-3 p-2 hover:bg-fuchsia-600 rounded-lg transition-colors"
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
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className={`font-semibold ${transaction.type === 'sent' ? 'text-red-600' : 'text-green-600'}`}>
                          {transaction.type === 'sent' ? '-' : '+'}
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(transaction.timestamp)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAddToAddressBook(transaction)}
                        className="p-1 text-gray-400 hover:text-fuchsia-600 hover:bg-fuchsia-50 rounded-full transition-colors"
                        title="Add to Address Book"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
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

      {/* Add to Address Book Modal */}
      {showAddToAddressBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add to Address Book</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                  placeholder="Enter contact name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={contactForm.address}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={contactForm.category}
                  onChange={(e) => setContactForm({...contactForm, category: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-600 focus:border-transparent"
                >
                  <option value="upi">UPI ID</option>
                  <option value="phone">Phone Number</option>
                  <option value="ens">ENS Wallet</option>
                  <option value="wallet">Wallet Address</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddToAddressBook(false)}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveToAddressBook}
                disabled={!contactForm.name}
                className="flex-1 py-3 px-4 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Save Contact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Activity;

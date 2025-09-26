import { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { QrCode, FileText, Users, ArrowLeftRight, Compass, CheckCircle, ChevronDown } from "lucide-react";


function Domestic() {
  const [amount, setAmount] = useState('0');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedMode, setSelectedMode] = useState('upi'); // 'upi', 'pyusd', 'flow'
  const [showDropdown, setShowDropdown] = useState(false);
  const [walletBalances, setWalletBalances] = useState({
    pyusd: '125.50',
    flow: '0.75'
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    console.log('Home: Checking authentication, token:', !!token, 'userData:', userData);
    
    if (!token || !userData) {
      console.log('Home: No token or userData found, redirecting to auth');
      navigate('/auth');
      return;
    }
    
    try {
      const parsedData = JSON.parse(userData);
      console.log('Home: Parsed user data:', parsedData);
      if (!parsedData.phone) {
        console.log('Home: No phone found, redirecting to auth');
        navigate('/auth');
      } else if (!parsedData.hasWallet) {
        console.log('Home: No wallet found, redirecting to wallet setup');
        navigate('/wallet-setup');
      } else {
        console.log('Home: User authenticated successfully');
      }
    } catch {
      console.log('Home: Error parsing userData, redirecting to auth');
      navigate('/auth');
    }

    // Check for success message from transfer
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      // Clear the location state
      window.history.replaceState({}, document.title);
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [navigate, location.state]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleKeypadClick = (value) => {
    if (value === '<') {
      // Backspace - remove last character
      setAmount(prev => {
        if (prev.length <= 1) return '0';
        return prev.slice(0, -1);
      });
    } else if (value === '.') {
      // Decimal point - only add if not already present
      if (!amount.includes('.')) {
        setAmount(prev => prev === '0' ? '0.' : prev + '.');
      }
    } else {
      // Number - add to amount
      setAmount(prev => {
        if (prev === '0') return value;
        // Limit to 2 decimal places
        if (prev.includes('.') && prev.split('.')[1].length >= 2) {
          return prev;
        }
        // Limit total length to prevent very large numbers
        if (prev.length >= 10) return prev;
        return prev + value;
      });
    }
  };

  const handleTransfer = () => {
    if (amount && amount !== '0') {
      navigate('/transfer', { state: { amount, currency: selectedMode } });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Success Message */}

      <div className="w-[360px] h-[700px] bg-fuchsia-600 rounded-3xl shadow-xl flex flex-col  justify-between">
        {/* Header */}
        <div className="p-4 flex justify-between items-center">
          <div className="relative dropdown-container">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="bg-fuchsia-500 text-white px-4 py-2 rounded-full text-sm shadow flex items-center gap-1"
            >
              {selectedMode.toUpperCase()}
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute left-0 mt-1 w-28 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setSelectedMode('upi');
                    setShowDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded-t-lg ${selectedMode === 'upi' ? 'bg-fuchsia-50 text-fuchsia-600' : 'text-gray-700'}`}
                >
                  UPI
                </button>
                <button
                  onClick={() => {
                    setSelectedMode('pyusd');
                    setShowDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${selectedMode === 'pyusd' ? 'bg-fuchsia-50 text-fuchsia-600' : 'text-gray-700'}`}
                >
                  PYUSD
                </button>
                <button
                  onClick={() => {
                    setSelectedMode('flow');
                    setShowDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded-b-lg ${selectedMode === 'flow' ? 'bg-fuchsia-50 text-fuchsia-600' : 'text-gray-700'}`}
                >
                  FLOW
                </button>
              </div>
            )}
          </div>
         
          <button 
            onClick={handleProfileClick}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black font-bold"
          >
            🙂
          </button>
        </div>

        {/* Balance Section */}
        <div className="flex flex-col items-center space-y-2">
          <div className={`text-center transition-all duration-200 ${
            amount !== '0' ? 'scale-105' : ''
          }`}>
            <div className="text-x font-bold text-white/80 mb-1 flex items-center justify-center gap-2">
              <span>
                {selectedMode === 'upi' ? '₹ (Rupee)' : selectedMode === 'pyusd' ? 'PYUSD' : 'FLOW'}
              </span>
              {(selectedMode === 'pyusd' || selectedMode === 'flow') && (
                <span className="text-xs text-white/60">
                  Bal: {walletBalances[selectedMode]}
                </span>
              )}
            </div>
            <h1 className="text-6xl font-bold text-white">
              {amount}
            </h1>
          </div>
          {amount !== '0' && (
            <p className="text-white/70 text-xs animate-pulse">
              Tap Transfer to continue
            </p>
          )}
        </div>

        {/* Keypad */}
        <div className="px-6">
          <div className="grid grid-cols-3 gap-6 text-white text-2xl font-medium">
            {["1","2","3","4","5","6","7","8","9",".","0","<"].map((num, idx) => (
              <button
                key={idx}
                onClick={() => handleKeypadClick(num)}
                className="py-3 flex items-center justify-center hover:bg-fuchsia-500 rounded-full transition-colors active:bg-fuchsia-400"
              >
                {num === '<' ? '⌫' : num}
              </button>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex justify-between mt-6 mb-4 space-x-4">
            <button className="flex-1 py-3 bg-fuchsia-500 text-white rounded-full font-semibold shadow hover:bg-fuchsia-400 transition-colors">
              Request
            </button>
            <button 
              onClick={handleTransfer}
              className={`flex-1 py-3 text-white rounded-full font-semibold shadow transition-colors ${
                amount && amount !== '0' 
                  ? 'bg-fuchsia-500 hover:bg-fuchsia-400' 
                  : 'bg-fuchsia-400/50 cursor-not-allowed'
              }`}
              disabled={!amount || amount === '0'}
            >
              Transfer
            </button>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-around bg-fuchsia-600 py-4  px-4 rounded-b-3xl">
          <div 
            onClick={() => navigate('/activity')}
            className="flex flex-col items-center text-white text-xs hover:text-white/60 transition-colors"
          >
            <ArrowLeftRight className="h-6 w-6 mb-1" />
            Activity
          </div>
          <div className="flex flex-col items-center text-white text-xs">
            <Compass className="h-6 w-6 mb-1" />
            Explore
          </div>
          <div className="flex flex-col items-center text-white">
            <div className="bg-white rounded-full p-4 shadow-lg -mt-8">
              <QrCode className="h-8 w-8 text-fuchsia-600" />
            </div>
          </div>
          <div className="flex flex-col items-center text-white text-xs">
            <FileText className="h-6 w-6 mb-1" />
            Bills
          </div>
          <div className="flex flex-col items-center text-white text-xs">
            <Users className="h-6 w-6 mb-1" />
            People
          </div>
        </div>
      </div>
    </div>
  );
}

export default Domestic;

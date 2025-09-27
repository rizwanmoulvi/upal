import { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { QrCode, FileText, Users, ArrowLeftRight, Compass, CheckCircle, ChevronDown, RefreshCw, Send, X, Search } from "lucide-react";
import { getFlowBalance, getPYUSDBalance, fetchKeystore, decryptWallet } from '../utils/walletService';
import QRScanner from '../components/QRScanner';
import { analyzeQRCode, testQRAnalysis } from '../utils/qrUtils';
import QRCodeGenerator from 'qrcode';




function Domestic() {
  const [amount, setAmount] = useState('0');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedMode, setSelectedMode] = useState('upi'); // 'upi', 'pyusd', 'flow'
  const [showDropdown, setShowDropdown] = useState(false);
  const [walletBalances, setWalletBalances] = useState({
    pyusd: '125.50',
    flow: '0.75'
  });
  const [isRefreshing, setIsRefreshing] = useState({
    pyusd: false,
    flow: false
  });
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [showNetworkSelection, setShowNetworkSelection] = useState(false);
  const [showMyQRCode, setShowMyQRCode] = useState(false);
  const [myQRType, setMyQRType] = useState('upi'); // 'upi' or 'wallet'
  const [myQRCodeData, setMyQRCodeData] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [availableContacts, setAvailableContacts] = useState({
    phone: [],
    ens: [],
    wallet: [],
    upi: []
  });
  const [user, setUser] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Refresh PYUSD balance
  const refreshPYUSDBalance = async () => {
    try {
      setIsRefreshing(prev => ({ ...prev, pyusd: true }));
      
      // Get user's wallet address
      const keystoreData = await fetchKeystore();
      if (!keystoreData || !keystoreData.walletAddress) {
        throw new Error('Wallet not found');
      }
      
      const balance = await getPYUSDBalance(keystoreData.walletAddress);
      setWalletBalances(prev => ({ ...prev, pyusd: parseFloat(balance).toFixed(2) }));
    } catch (error) {
      console.error('Failed to refresh PYUSD balance:', error);
      // Keep existing balance on error
    } finally {
      setIsRefreshing(prev => ({ ...prev, pyusd: false }));
    }
  };

  // Refresh FLOW balance
  const refreshFLOWBalance = async () => {
    try {
      setIsRefreshing(prev => ({ ...prev, flow: true }));
      
      // Get user's wallet address
      const keystoreData = await fetchKeystore();
      if (!keystoreData || !keystoreData.walletAddress) {
        throw new Error('Wallet not found');
      }
      
      const balance = await getFlowBalance(keystoreData.walletAddress);
      setWalletBalances(prev => ({ ...prev, flow: parseFloat(balance).toFixed(4) }));
    } catch (error) {
      console.error('Failed to refresh FLOW balance:', error);
      // Keep existing balance on error
    } finally {
      setIsRefreshing(prev => ({ ...prev, flow: false }));
    }
  };

  // Fetch initial balances on component load
  const fetchInitialBalances = async () => {
    try {
      // Get user's wallet address
      const keystoreData = await fetchKeystore();
      if (!keystoreData || !keystoreData.walletAddress) {
        console.log('No wallet found, skipping balance fetch');
        return;
      }

      // Fetch both balances in parallel
      const [pyusdBalance, flowBalance] = await Promise.allSettled([
        getPYUSDBalance(keystoreData.walletAddress),
        getFlowBalance(keystoreData.walletAddress)
      ]);

      // Update PYUSD balance
      if (pyusdBalance.status === 'fulfilled') {
        setWalletBalances(prev => ({ 
          ...prev, 
          pyusd: parseFloat(pyusdBalance.value).toFixed(2) 
        }));
      } else {
        console.error('Failed to fetch PYUSD balance:', pyusdBalance.reason);
      }

      // Update FLOW balance
      if (flowBalance.status === 'fulfilled') {
        setWalletBalances(prev => ({ 
          ...prev, 
          flow: parseFloat(flowBalance.value).toFixed(4) 
        }));
      } else {
        console.error('Failed to fetch FLOW balance:', flowBalance.reason);
      }

    } catch (error) {
      console.error('Failed to fetch initial balances:', error);
    }
  };

  // Handle QR code scanning
  const handleQRScan = (qrData) => {
    console.log('=== QR SCAN RECEIVED ===');
    console.log('Raw QR Data:', qrData);
    
    const analysis = analyzeQRCode(qrData);
    console.log('QR Code Analysis:', analysis);
    
    setScannedData(analysis);
    
    if (analysis.mode === 'upi') {
      // Switch to UPI mode and set bank account display
      setSelectedMode('upi');
      setRecipientAddress(analysis.address);
    } else if (analysis.mode === 'crypto') {
      // For wallet addresses, show network selection
      setRecipientAddress(analysis.address);
      
      if (analysis.network === 'ethereum') {
        setSelectedMode('pyusd');
        
        // Show chain warning if not Sepolia
        if (analysis.warning) {
          alert(`⚠️ ${analysis.warning}\n\nThe payment will be processed on Ethereum Sepolia testnet regardless.`);
        }
      } else if (analysis.network === 'flow') {
        setSelectedMode('flow');
      } else if (analysis.network === 'bitcoin') {
        alert('Bitcoin payments are not supported yet. Please use Ethereum or Flow addresses.');
        setScannedData(null);
        return;
      } else {
        // Unknown network, show selection modal
        setShowNetworkSelection(true);
      }
    } else if (analysis.mode === 'wallet-connect') {
      alert(analysis.message || 'This QR code is for wallet connection, not payments. Please scan a payment address QR code.');
      setScannedData(null);
      return;
    } else if (analysis.mode === 'unknown') {
      alert(analysis.message || 'QR code format not recognized. Please ensure it contains a valid UPI ID or wallet address.');
      setScannedData(null);
      return;
    }
  };

  // Handle network selection for wallet addresses
  const handleNetworkSelection = (network) => {
    setSelectedMode(network);
    setShowNetworkSelection(false);
  };

  // Handle send button click (for QR scanned payments)
  const handleSendPayment = () => {
    if (!scannedData || !recipientAddress) {
      return;
    }

    // Navigate to pin entry with payment data
    navigate('/pin-entry', {
      state: {
        paymentData: {
          amount: amount,
          recipientAddress: recipientAddress,
          mode: selectedMode,
          isQRPayment: true,
          scannedData: scannedData
        }
      }
    });
  };

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
        // Fetch initial balances if user has wallet
        if (parsedData.hasWallet) {
          fetchInitialBalances();
        }
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

  // Load user data and contacts
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    setUser(userData);
    
    if (userData.phone) {
      loadContactsFromAddressBook(userData);
    }
  }, []);

  const loadContactsFromAddressBook = (userData) => {
    if (!userData.phone) return;
    
    try {
      const addressBook = JSON.parse(localStorage.getItem(`addressBook_${userData.phone}`) || '{}');
      console.log('Loading contacts for user:', userData.phone);
      console.log('Address book data:', addressBook);
      setAvailableContacts({
        phone: addressBook.phone || [],
        ens: addressBook.ens || [],
        wallet: addressBook.wallet || [],
        upi: addressBook.upi || []
      });
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const handleRequestClick = () => {
    if (!amount || amount === '0') {
      alert('Please enter an amount first');
      return;
    }
    setSearchQuery(''); // Clear search when opening modal
    setShowRequestModal(true);
  };

  const handleSendRequest = (contact, contactType) => {
    const newRequest = {
      id: Date.now().toString(),
      type: 'sent',
      description: `Payment request for ${amount} ${selectedMode === 'upi' ? 'INR' : selectedMode.toUpperCase()}`,
      amount: parseFloat(amount),
      currency: selectedMode === 'upi' ? 'INR' : selectedMode.toUpperCase(),
      from: user.ensName || user.phone || user.walletAddress,
      fromType: user.ensName ? 'ens' : user.phone ? 'phone' : 'wallet',
      to: getContactIdentifier(contact, contactType),
      toType: contactType,
      status: 'pending',
      createdAt: new Date().toISOString(),
      requestNumber: `REQ${Date.now().toString().slice(-8)}`
    };

    // Save to current user's requests
    const userId = user.phone || user.walletAddress;
    const currentRequests = JSON.parse(localStorage.getItem(`requests_${userId}`) || '[]');
    const updatedRequests = [newRequest, ...currentRequests];
    localStorage.setItem(`requests_${userId}`, JSON.stringify(updatedRequests));

    // Try to find recipient and add to their requests
    const recipientIdentifier = getContactIdentifier(contact, contactType);
    const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
    const recipientUser = allUsers.find(u => 
      u.phone === recipientIdentifier || 
      u.walletAddress === recipientIdentifier || 
      u.ensName === recipientIdentifier
    );

    if (recipientUser) {
      const recipientId = recipientUser.phone || recipientUser.walletAddress;
      const recipientRequests = JSON.parse(localStorage.getItem(`requests_${recipientId}`) || '[]');
      const recipientRequest = {
        ...newRequest,
        type: 'received'
      };
      recipientRequests.unshift(recipientRequest);
      localStorage.setItem(`requests_${recipientId}`, JSON.stringify(recipientRequests));
    }

    setShowRequestModal(false);
    setAmount('0');
    alert('Payment request sent successfully!');
  };

  const getContactIdentifier = (contact, type) => {
    switch (type) {
      case 'phone': return contact.address; // In AddressBook, phone numbers are stored in 'address' field
      case 'ens': return contact.address;   // ENS names are stored in 'address' field
      case 'wallet': return contact.address; // Wallet addresses are stored in 'address' field
      case 'upi': return contact.address;   // UPI IDs are stored in 'address' field
      default: return contact.address;      // All contact types use 'address' field in AddressBook
    }
  };

  const getRelevantContacts = () => {
    console.log('Getting relevant contacts for mode:', selectedMode);
    console.log('Available contacts:', availableContacts);
    
    let relevantContacts = [];
    
    if (selectedMode === 'upi') {
      // For INR/UPI mode, show phone and UPI contacts
      relevantContacts = [
        ...availableContacts.phone.map(c => ({ ...c, type: 'phone' })),
        ...availableContacts.upi.map(c => ({ ...c, type: 'upi' }))
      ];
    } else {
      // For PYUSD/Flow mode, show ENS and wallet contacts
      relevantContacts = [
        ...availableContacts.ens.map(c => ({ ...c, type: 'ens' })),
        ...availableContacts.wallet.map(c => ({ ...c, type: 'wallet' }))
      ];
    }
    
    // Filter contacts based on search query
    if (searchQuery.trim()) {
      relevantContacts = relevantContacts.filter(contact => {
        const name = contact.name?.toLowerCase() || '';
        const address = contact.address?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        
        return name.includes(query) || address.includes(query);
      });
    }
    
    console.log('Filtered relevant contacts:', relevantContacts);
    return relevantContacts;
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  // Handle showing my QR code
  const handleShowMyQR = async () => {
    try {
      // Get user data and wallet address
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const keystoreData = await fetchKeystore();
      
      if (keystoreData?.walletAddress) {
        setWalletAddress(keystoreData.walletAddress);
      }
      
      // Generate initial QR code (UPI by default)
      await generateMyQRCode('upi', userData.phone, keystoreData?.walletAddress, userData.ensName);
      setShowMyQRCode(true);
    } catch (error) {
      console.error('Failed to show QR code:', error);
      alert('Failed to load QR code. Please try again.');
    }
  };

  // Generate QR code based on type
  const generateMyQRCode = async (type, phoneNumber, address, ensName = null) => {
    try {
      let qrData = '';
      
      if (type === 'upi') {
        // Generate UPI QR code
        qrData = `${phoneNumber}@oksbi`;
      } else if (type === 'wallet') {
        // Use ENS name if available, otherwise use wallet address
        const displayAddress = ensName || address || '';
        
        // Generate wallet QR code (MetaMask format for current network)
        if (selectedMode === 'pyusd') {
          // Ethereum Sepolia format - use ENS name if available
          qrData = `ethereum:${displayAddress}@0xaa36a7`;
        } else if (selectedMode === 'flow') {
          // Flow testnet format - still use address as ENS is Ethereum-specific
          qrData = `flow:${address}@0x221`;
        } else {
          // Default to ENS name or wallet address
          qrData = displayAddress;
        }
      }
      
      // Generate QR code image
      // Generate QR code image
      if (qrData) {
        const qrCodeDataURL = await QRCodeGenerator.toDataURL(qrData, {
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setMyQRCodeData(qrCodeDataURL);
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      setMyQRCodeData('');
    }
  };

  // Handle QR type change
  const handleQRTypeChange = async (type) => {
    setMyQRType(type);
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    await generateMyQRCode(type, userData.phone, walletAddress, userData.ensName);
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
              className="bg-fuchsia-600 text-white px-4 py-2 rounded-full text-sm shadow flex items-center gap-1"
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
                  <div>
                    <div className="font-medium">PYUSD</div>
                    
                  </div>
                </button>
                <button
                  onClick={() => {
                    setSelectedMode('flow');
                    setShowDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded-b-lg ${selectedMode === 'flow' ? 'bg-fuchsia-50 text-fuchsia-600' : 'text-gray-700'}`}
                >
                  <div>
                    <div className="font-medium">FLOW</div>
                    
                  </div>
                </button>
              </div>
            )}
          </div>
         
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleShowMyQR}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-fuchsia-600 hover:bg-gray-50 transition-colors"
              title="Show My QR Code"
            ><div>
              <QrCode className="h-5 w-5" />
              </div>
            </button>
            
            <button 
              onClick={handleProfileClick}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black font-bold"
            >
              🙂
            </button>
          </div>
        </div>

        {/* Balance Section */}
        <div className="flex flex-col items-center space-y-2">
          <div className={`text-center transition-all duration-200 ${
            amount !== '0' ? 'scale-105' : ''
          }`}>
            <div className="text-center">
              <div className="text-x font-bold text-white/80 mb-1 flex items-center justify-center gap-2">
                <span>
                  {selectedMode === 'upi' ? '₹ (Rupee)' : selectedMode === 'pyusd' ? 'PYUSD' : 'FLOW'}
                </span>
                {(selectedMode === 'pyusd' || selectedMode === 'flow') && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-white/60">
                      Bal: {walletBalances[selectedMode]}
                    </span>
                    <button
                      onClick={selectedMode === 'pyusd' ? refreshPYUSDBalance : refreshFLOWBalance}
                      disabled={isRefreshing[selectedMode]}
                      className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                      title={`Refresh ${selectedMode.toUpperCase()} balance`}
                    >
                      <RefreshCw 
                        size={12} 
                        className={`text-white/60 ${isRefreshing[selectedMode] ? 'animate-spin' : ''}`} 
                      />
                    </button>
                  </div>
                )}
              </div>
              {selectedMode === 'pyusd' && (
                <div className="text-xs text-white/50">on Ethereum Sepolia</div>
              )}
              {selectedMode === 'flow' && (
                <div className="text-xs text-white/50">on Flow Testnet</div>
              )}
            </div>
            <h1 className="text-6xl font-bold text-white">
              {amount}
            </h1>
          </div>
          {amount !== '0' && !scannedData && (
            <p className="text-white/70 text-xs animate-pulse">
              Tap Transfer to continue
            </p>
          )}
          {scannedData && (
            <div className="mt-2 p-3 bg-white/10 rounded-lg">
              <p className="text-white/70 text-xs mb-1">Paying to:</p>
              <p className="text-white text-sm font-medium">
                {scannedData.mode === 'upi' ? (
                  <span>
                    {scannedData.address.split('@')[0]}
                    <span className="text-white/70">@{scannedData.bank}</span>
                  </span>
                ) : (
                  <span className="font-mono">
                    {recipientAddress.length > 20 
                      ? `${recipientAddress.slice(0, 8)}...${recipientAddress.slice(-8)}`
                      : recipientAddress
                    }
                  </span>
                )}
              </p>
              {scannedData.mode === 'crypto' && (
                <div className="text-white/50 text-xs mt-1">
                  <p>
                    {selectedMode === 'pyusd' ? 'PYUSD on Ethereum Sepolia' : 'FLOW on Flow Network'}
                  </p>
                  {scannedData.chainName && (
                    <p className="text-white/40">
                      Detected: {scannedData.chainName}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Keypad */}
        <div className="px-6">
          <div className="grid grid-cols-3 gap-1 text-white text-2xl font-medium">
            {["1","2","3","4","5","6","7","8","9",".","0","<"].map((num, idx) => (
              <button
                key={idx}
                onClick={() => handleKeypadClick(num)}
                className="py-3 flex items-center justify-center hover:bg-fuchsia-600 rounded-full transition-colors active:bg-fuchsia-400"
              >
                {num === '<' ? '⌫' : num}
              </button>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex justify-between mt-6 mb-4 space-x-4">
            <button 
              onClick={handleRequestClick}
              className="flex-1 py-3 bg-fuchsia-600 text-white rounded-full font-semibold shadow hover:bg-fuchsia-400 transition-colors"
            >
              Request
            </button>
            
            {scannedData ? (
              <button 
                onClick={handleSendPayment}
                className={`flex-1 py-3 text-white rounded-full font-semibold shadow transition-colors flex items-center justify-center space-x-2 ${
                  amount && amount !== '0' 
                    ? 'bg-green-500 hover:bg-green-400' 
                    : 'bg-green-400/50 cursor-not-allowed'
                }`}
                disabled={!amount || amount === '0'}
              >
                <Send className="h-4 w-4" />
                <span>Send</span>
              </button>
            ) : (
              <button 
                onClick={handleTransfer}
                className={`flex-1 py-3 text-white rounded-full font-semibold shadow transition-colors ${
                  amount && amount !== '0' 
                    ? 'bg-fuchsia-600 hover:bg-fuchsia-400' 
                    : 'bg-fuchsia-400/50 cursor-not-allowed'
                }`}
                disabled={!amount || amount === '0'}
              >
                Transfer
              </button>
            )}
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
            <button
              onClick={() => {
                console.log('QR button clicked, opening scanner...');
                setShowQRScanner(true);
              }}
              className="bg-white rounded-full p-4 shadow-lg -mt-8 hover:bg-gray-50 transition-colors"
            >
              <QrCode className="h-8 w-8 text-fuchsia-600" />
            </button>
          </div>
          <div
            onClick={() => navigate('/request')}
            className="flex flex-col items-center text-white text-xs hover:text-white/80 transition-colors cursor-pointer"
          >
            <FileText className="h-6 w-6 mb-1" />
            Requests
          </div>
          <div
            onClick={() => navigate('/address-book')}
            className="flex flex-col items-center text-white text-xs hover:text-white/80 transition-colors"
          >
            <Users className="h-6 w-6 mb-1" />
            People
          </div>
        </div>
      </div>

      {/* QR Scanner */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
      />

      {/* Network Selection Modal */}
      {showNetworkSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 m-4 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Select Network</h3>
            <p className="text-gray-600 mb-4">
              Choose which network to use for this wallet address:
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleNetworkSelection('flow')}
                className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Flow Network
              </button>
              <button
                onClick={() => handleNetworkSelection('pyusd')}
                className="w-full p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                PYUSD (Ethereum)
              </button>
            </div>
            <button
              onClick={() => setShowNetworkSelection(false)}
              className="w-full mt-3 p-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* My QR Code Modal */}
      {showMyQRCode && (
        <div className="fixed inset-0 bg-gray-100 flex items-center justify-center p-4 z-50">
          <div className="w-[360px] h-[700px] bg-fuchsia-600 rounded-3xl shadow-xl flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4">
              <h1 className="text-white text-lg font-semibold">My QR Code</h1>
              <button
                onClick={() => setShowMyQRCode(false)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* QR Type Selector */}
            <div className="px-6 pb-4">
              <div className="flex bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => handleQRTypeChange('upi')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    myQRType === 'upi'
                      ? 'bg-white text-fuchsia-600'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  UPI
                </button>
                <button
                  onClick={() => handleQRTypeChange('wallet')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    myQRType === 'wallet'
                      ? 'bg-white text-fuchsia-600'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Wallet
                </button>
              </div>
            </div>

            {/* QR Code Display */}
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                {myQRCodeData ? (
                  <img 
                    src={myQRCodeData} 
                    alt="My QR Code" 
                    className="w-48 h-48"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <QrCode className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>

              {/* QR Code Info */}
              <div className="mt-6 text-center">
                <h3 className="text-white text-xl font-semibold mb-2">
                  {myQRType === 'upi' ? 'UPI Payment' : 'Wallet Address'}
                </h3>
                <p className="text-white/70 text-sm mb-4">
                  {myQRType === 'upi' 
                    ? 'Scan this QR code to send money via UPI'
                    : `Scan to send ${selectedMode === 'pyusd' ? 'PYUSD' : 'FLOW'} tokens`
                  }
                </p>
                
                {/* Address/UPI ID Display */}
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-white/60 text-xs mb-1">
                    {myQRType === 'upi' ? 'UPI ID' : JSON.parse(localStorage.getItem('userData') || '{}').ensName ? 'ENS Name' : 'Wallet Address'}
                  </p>
                  <p className="text-white text-sm font-mono break-all">
                    {myQRType === 'upi' 
                      ? `${JSON.parse(localStorage.getItem('userData') || '{}').phone}@oksbi`
                      : JSON.parse(localStorage.getItem('userData') || '{}').ensName || walletAddress
                    }
                  </p>
                  {myQRType === 'wallet' && (
                    <p className="text-white/50 text-xs mt-2">
                      Network: {selectedMode === 'pyusd' ? 'Ethereum Sepolia' : 'Flow Testnet'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="p-6">
              <button
                onClick={() => setShowMyQRCode(false)}
                className="w-full bg-white text-fuchsia-600 py-4 rounded-2xl font-semibold shadow-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-[360px] h-[700px] bg-fuchsia-600 rounded-3xl shadow-xl flex flex-col overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-white">
                Request {amount} {selectedMode === 'upi' ? 'INR' : selectedMode.toUpperCase()}
              </h2>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-2 text-white hover:bg-fuchsia-500 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="mb-4">
                <p className="text-white/80 text-sm mb-4">
                  Select who to request payment from:
                </p>
                
                {/* Search Bar */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={selectedMode === 'upi' ? 'Search by name, phone or UPI ID...' : 'Search by name, ENS or wallet address...'}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/50"
                  />
                </div>
                
                {getRelevantContacts().length === 0 ? (
                  <div className="text-center py-16 text-white/60">
                    <Users className="w-12 h-12 mx-auto mb-4 text-white/40" />
                    <p className="text-white">
                      {searchQuery.trim() ? 'No matching contacts found' : 'No contacts found'}
                    </p>
                    <p className="text-sm text-white/60 mt-1">
                      {searchQuery.trim() ? (
                        'Try a different search term'
                      ) : (
                        selectedMode === 'upi' 
                          ? 'Add phone numbers or UPI IDs from Address Book'
                          : 'Add ENS names or wallet addresses from Address Book'
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getRelevantContacts().map((contact, index) => (
                      <button
                        key={`${contact.type}-${contact.id || index}`}
                        onClick={() => handleSendRequest(contact, contact.type)}
                        className="w-full p-3 text-left bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white">{contact.name}</div>
                            <div className="text-sm text-white/70">
                              {getContactIdentifier(contact, contact.type)}
                            </div>
                          </div>
                          <div className="text-xs text-white/50 uppercase">
                            {contact.type}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Domestic;

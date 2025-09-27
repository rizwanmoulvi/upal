import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, RefreshCw, CircleUserRound } from 'lucide-react';
import axios from 'axios';
import { getFlowBalance, getPYUSDBalance, getNetworkInfo } from '../utils/walletService';

function Profile() {
  const [userData, setUserData] = useState({});
  const [flowBalance, setFlowBalance] = useState('0');
  const [pyusdBalance, setPyusdBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isLoadingPyusdBalance, setIsLoadingPyusdBalance] = useState(false);
  const [error, setError] = useState('');
  const [showBackupModal, setShowBackupModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Get user data from localStorage first
        const localUserData = JSON.parse(localStorage.getItem('userData') || '{}');
        console.log('Profile: Initial localStorage userData:', localUserData);
        const phone = localUserData.phone;
        
        if (!phone) {
          // If no phone found, redirect to auth
          navigate('/auth');
          return;
        }
        
        // Fetch updated profile from backend with JWT token
        const token = localStorage.getItem('authToken');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await axios.get(`https://api.upal.rizzmo.site/api/profile/${phone}`, { headers });
        
        // Combine backend data with local user data (preserving needsBackupReminder)
        const combinedUserData = {
          ...res.data,
          hasWallet: !!res.data.walletAddress,
          needsBackupReminder: localUserData.needsBackupReminder
        };
        
        setUserData(combinedUserData);
        console.log('Profile: Local user data needsBackupReminder:', localUserData.needsBackupReminder);
        console.log('Profile: Combined user data:', combinedUserData);
        
        // Update localStorage with latest data
        localStorage.setItem('userData', JSON.stringify({
          phone: res.data.phone,
          name: res.data.name,
          walletAddress: res.data.walletAddress,
          ensDomain: res.data.ensDomain,
          ensName: res.data.ensName, // Add the new ensName field
          balance: res.data.pyusdBalance,
          hasWallet: !!res.data.walletAddress, // Set hasWallet based on wallet address
          needsBackupReminder: localUserData.needsBackupReminder
        }));
        
        // Fetch Flow balance if wallet address exists
        if (res.data.walletAddress) {
          try {
            const balance = await getFlowBalance(res.data.walletAddress);
            setFlowBalance(balance);
          } catch (balanceErr) {
            console.error('Flow balance fetch error:', balanceErr);
            setFlowBalance('0.00');
          }

          // Fetch PYUSD balance
          try {
            const pyusdBal = await getPYUSDBalance(res.data.walletAddress);
            setPyusdBalance(pyusdBal);
          } catch (balanceErr) {
            console.error('PYUSD balance fetch error:', balanceErr);
            setPyusdBalance('0.00');
          }
        }
        
      } catch (err) {
        console.error('Profile fetch error:', err);
        
        if (err.response && err.response.status === 404) {
          // User not found, redirect to auth
          setError('User not found. Please sign up again.');
          localStorage.removeItem('userData');
          setTimeout(() => navigate('/auth'), 2000);
        } else {
          // Network or other error, fallback to localStorage data
          const localData = JSON.parse(localStorage.getItem('userData') || '{}');
          if (localData.phone) {
            setUserData(localData);
            setError('Using offline data. Please check your connection.');
          } else {
            setError('Unable to load profile data.');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [navigate]);

  const refreshFlowBalance = async () => {
    if (!userData.walletAddress) return;
    
    setIsLoadingBalance(true);
    try {
      const balance = await getFlowBalance(userData.walletAddress);
      setFlowBalance(balance);
    } catch (err) {
      console.error('Balance refresh error:', err);
      setError('Failed to refresh Flow balance');
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const refreshPyusdBalance = async () => {
    if (!userData.walletAddress) return;
    
    setIsLoadingPyusdBalance(true);
    try {
      const balance = await getPYUSDBalance(userData.walletAddress);
      setPyusdBalance(balance);
    } catch (err) {
      console.error('PYUSD balance refresh error:', err);
      setError('Failed to refresh PYUSD balance');
    } finally {
      setIsLoadingPyusdBalance(false);
    }
  };

  const dismissBackupReminder = () => {
    const updatedUserData = { 
      ...userData, 
      needsBackupReminder: false,
      hasWallet: !!userData.walletAddress // Preserve hasWallet flag
    };
    setUserData(updatedUserData);
    localStorage.setItem('userData', JSON.stringify(updatedUserData));
  };

  const handleBackupNow = () => {
    setShowBackupModal(true);
  };

  const handleBackupComplete = () => {
    setShowBackupModal(false);
    const updatedUserData = { 
      ...userData, 
      needsBackupReminder: false,
      hasWallet: !!userData.walletAddress // Preserve hasWallet flag
    };
    setUserData(updatedUserData);
    localStorage.setItem('userData', JSON.stringify(updatedUserData));
  };

  const handleSignOut = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('authToken');
    navigate('/auth');
  };



  const handleBackToHome = () => {
    console.log('Profile: Navigating back to home with userData:', userData);
    navigate('/');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
     
          
          {/* Loading Content */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-600 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-fuchsia-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              Loading profile...
            </div>
          </div>
        </div>
    );
  }

  // 

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-[360px] h-[700px] bg-fuchsia-600 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* <button
          onClick={handleBackToHome}
          className="mr-3 mt-5 mb-5 p-2"
          aria-label="Back to Home"
          style={{ width: 30, height: 30, minWidth: 30, minHeight: 30 }}
        >
          <X size={24} />
        </button> */}
        <div className=" p-4 flex items-center">
          <button
            onClick={handleBackToHome}
            className="mr-3 p-2  rounded-lg transition-colors-"
          >
            <X size={24} className="text-white" />
          </button>
        </div>
       
       <div className="flex items-center justify-center mb-2">
          <CircleUserRound size={100} className="text-white" />
        </div>
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-white">{userData.name || 'User'}</h2>
          <p className="text-sm text-white">{userData.phone || 'No phone number'}</p>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
              {error}
            </div>
          )}
          
         
          {/* User Info Card */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Name:</span>
                <span className="ml-2 text-gray-900">{userData.name || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone:</span>
                <span className="ml-2 text-gray-900">{userData.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Wallet:</span>
                <span className="ml-2 text-gray-900 text-xs break-all">
                  {userData.walletAddress || 'Not generated yet'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">ENS:</span>
                <span className="ml-2 text-gray-900">{userData.ensName || userData.ensDomain || 'Not assigned'}</span>
              </div>
            </div>
          </div>

          {/* Balance Cards */}
          <div className="space-y-3 mb-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">PYUSD Balance</p>
                  <p className="text-xs text-green-600 mb-1">Ethereum Sepolia</p>
                  <p className="text-lg font-bold text-green-900">{parseFloat(pyusdBalance).toFixed(2)} PYUSD</p>
                </div>
                <button
                  onClick={refreshPyusdBalance}
                  disabled={isLoadingPyusdBalance || !userData.walletAddress}
                  className={`p-2 rounded-lg ${
                    isLoadingPyusdBalance || !userData.walletAddress
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-green-200 hover:bg-green-300 text-green-800'
                  } transition-colors`}
                  title="Refresh PYUSD balance"
                >
                  <RefreshCw 
                    size={16} 
                    className={isLoadingPyusdBalance ? 'animate-spin' : ''} 
                  />
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Flow Network</p>
                  <p className="text-xs text-blue-600 mb-1">{getNetworkInfo().name}</p>
                  <p className="text-lg font-bold text-blue-900">{parseFloat(flowBalance).toFixed(3)} FLOW</p>
                </div>
                <button
                  onClick={refreshFlowBalance}
                  disabled={isLoadingBalance || !userData.walletAddress}
                  className={`p-2 rounded-lg ${
                    isLoadingBalance 
                      ? 'bg-gray-200 cursor-not-allowed' 
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                  } transition-colors`}
                  title="Refresh Flow Balance"
                >
                  <RefreshCw 
                    size={16} 
                    className={isLoadingBalance ? 'animate-spin' : ''} 
                  />
                </button>
              </div>
            </div>
          </div>
          
         
          
          {/* Sign Out Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSignOut}
              className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Backup Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-[320px] p-6">
            <h2 className="text-xl font-bold mb-4 text-center text-gray-900">
              Wallet Backup Important
            </h2>
            
            <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800 mb-2 font-semibold">
                ⚠️ Recovery Phrase Not Available
              </p>
              <p className="text-sm text-orange-700">
                Your recovery phrase was only shown during wallet creation for security reasons. 
                It cannot be retrieved again.
              </p>
            </div>

            <div className="mb-6 space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-semibold mb-1">💡 If you saved your phrase:</p>
                <p className="text-sm text-blue-700">
                  Store it securely offline (paper, hardware wallet, etc.). Test recovery on a separate device.
                </p>
              </div>
              
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-semibold mb-1">⚠️ If you didn't save it:</p>
                <p className="text-sm text-red-700">
                  Keep this wallet active and secure. Consider creating a new wallet and transferring funds 
                  if you need recovery phrase backup.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowBackupModal(false)}
                className="bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleBackupComplete}
                className="bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
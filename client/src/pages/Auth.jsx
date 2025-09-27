import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, User, Lock } from 'lucide-react';
import axios from 'axios';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const navigate = useNavigate();

  const API_BASE_URL = 'https://api.upal.rizzmo.site/api';

  const handleLogin = async () => {
    if (!phone || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        phone: phone,
        password: password
      });

      // Store JWT token and user data
      const userData = {
        phone: response.data.user.phone,
        name: response.data.user.name,
        walletAddress: response.data.user.walletAddress,
        ensDomain: response.data.user.ensDomain,
        ensName: response.data.user.ensName, // Add ensName field
        balance: response.data.user.pyusdBalance,
        hasWallet: response.data.user.hasWallet
      };
      
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userData', JSON.stringify(userData));

      // Add user to global list for bill sharing
      const { addUserToGlobalList } = await import('../utils/userUtils');
      addUserToGlobalList(userData);

      // Navigate based on wallet status
      if (response.data.user.hasWallet) {
        navigate('/');
      } else {
        navigate('/wallet-setup');
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data.error || 'Login failed');
      } else {
        setError('Network error. Please check if the server is running.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone || !name || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/send-otp`, {
        phone: phone,
        name: name,
        password: password
      });

      setGeneratedOtp(response.data.otp); // Remove this in production
      setIsOtpStep(true);
    } catch (err) {
      if (err.response) {
        setError(err.response.data.error || 'Failed to send OTP');
      } else {
        setError('Network error. Please check if the server is running.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setError('Please enter OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/verify-otp`, {
        phone: phone,
        otp: otp
      });

      console.log('OTP verification successful:', response.data);

      // Store JWT token and user data
      const userData = {
        phone: response.data.user.phone,
        name: response.data.user.name,
        walletAddress: response.data.user.walletAddress,
        ensDomain: response.data.user.ensDomain,
        ensName: response.data.user.ensName, // Add ensName field
        balance: response.data.user.pyusdBalance,
        hasWallet: response.data.user.hasWallet
      };
      
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userData', JSON.stringify(userData));

      // Add user to global list for bill sharing
      const { addUserToGlobalList } = await import('../utils/userUtils');
      addUserToGlobalList(userData);

      console.log('Navigating to wallet setup...');
      // Navigate to wallet setup if no wallet exists, otherwise go to home
      setTimeout(() => {
        if (response.data.user.hasWallet) {
          navigate('/');
        } else {
          navigate('/wallet-setup');
        }
      }, 100);
    } catch (err) {
      console.error('OTP verification error:', err);
      if (err.response) {
        console.error('Error response:', err.response.data);
        setError(err.response.data.error || 'OTP verification failed');
      } else if (err.request) {
        console.error('Network error:', err.request);
        setError('Network error. Please check if the server is running.');
      } else {
        console.error('Other error:', err.message);
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpInput = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  const resetForm = () => {
    setPhone('');
    setName('');
    setPassword('');
    setOtp('');
    setIsOtpStep(false);
    setError('');
    setGeneratedOtp('');
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  const handleBackToForm = () => {
    setIsOtpStep(false);
    setOtp('');
    setError('');
  };

  if (isOtpStep) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6">
        <div className="w-[360px] h-[700px] bg-white rounded-3xl shadow-lg flex flex-col justify-center p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl text-black font-bold mb-2">Verify OTP</h1>
            <p className="text-sm text-gray-600">
              Enter the OTP sent to {phone}
            </p>
          </div>
          
          <div className="space-y-6">
            {generatedOtp && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-600">
                  OTP: {generatedOtp} (for testing)
                </p>
              </div>
            )}
            
            <input
              type="text"
              value={otp}
              onChange={handleOtpInput}
              placeholder="Enter 6-digit OTP"
              className="w-full p-4 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-fuchsia-600 text-center text-lg tracking-widest"
              disabled={isLoading}
              maxLength={6}
              autoFocus
            />

            <button
              onClick={handleBackToForm}
              className="w-full mb-4 text-gray-600 text-sm hover:text-gray-400"
              disabled={isLoading}
            >
              ← Back to edit details
            </button>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={isLoading || otp.length !== 6}
              className={`w-full p-4 rounded-lg text-white font-medium ${
                isLoading || otp.length !== 6
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-fuchsia-600 hover:bg-fuchsia-600'
              } transition-colors`}
            >
              {isLoading ? 'Verifying...' : 'Verify OTP & Sign Up'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-[360px] h-[700px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-fuchsia-600 text-white p-6 text-center">
          <h1 className="text-6xl font-bold">uPAL</h1>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 bg-fuchsia-600 flex flex-col justify-center">
          {/* Tab Buttons */}
          <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 p-3 text-center font-medium rounded-lg transition-colors ${
                isLogin 
                  ? 'bg-fuchsia-600 text-white' 
                  : 'text-fuchsia-600 hover:text-fuchsia-600'
              }`}
              disabled={isLoading}
            >
              Login
            </button>
          <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 p-3 text-center font-medium rounded-lg transition-colors ${
                !isLogin 
                  ? 'bg-fuchsia-600 text-white' 
                  : 'text-fuchsia-600 hover:text-fuchsia-600'
              }`}
              disabled={isLoading}
            >
              Sign Up
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Phone Number
              </label>
              <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg p-4 focus-within:ring-2 focus-within:ring-fuchsia-600 focus-within:border-transparent">
                <Phone className="mr-3 text-fuchsia-600" size={20} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter Phone Number"
                  className="w-full bg-transparent outline-none text-base text-gray-900"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Full Name
                </label>
                <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg p-4 focus-within:ring-2 focus-within:ring-fuchsia-600 focus-within:border-transparent">
                  <User className="mr-3 text-fuchsia-600" size={20} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter Your Name"
                    className="w-full bg-transparent outline-none text-base text-gray-900"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Password
              </label>
              <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg p-4 focus-within:ring-2 focus-within:ring-fuchsia-600 focus-within:border-transparent">
                <Lock className="mr-3 text-fuchsia-600" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full bg-transparent outline-none text-base text-gray-900"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={isLogin ? handleLogin : handleSendOtp}
            disabled={isLoading}
            className={`w-full mt-6 p-4 rounded-lg  font-medium text-base ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-white text-fuchsia-600 hover:bg-fuchsia-600 hover:text-white'
            } transition-colors`}
          >
            {isLoading 
              ? (isLogin ? 'Logging in...' : 'Sending OTP...') 
              : (isLogin ? 'Login' : 'Send OTP')
            }
          </button>

          
        </div>
      </div>
    </div>
  );
}

export default Auth;
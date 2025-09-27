import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, User, Lock } from 'lucide-react';
import axios from 'axios';

function SignupLogin() {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtp, setIsOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.upal.rizzmo.site/api';

  const handleSubmit = async () => {
    if (!isOtp) {
      // Validate input before proceeding to OTP
      if (!phone || !name || !password) {
        setError('Please fill in all fields');
        return;
      }
      setError('');
      setIsOtp(true); // Mock OTP step
    } else {
      // Validate OTP input
      if (!otp) {
        setError('Please enter OTP');
        return;
      }
      
      setIsLoading(true);
      setError('');
      
      try {
        // Call the signup API
        const response = await axios.post(`${API_BASE_URL}/signup`, {
          phone: phone,
          name: name,
          password: password
        });
        
        console.log('Signup successful:', response.data);
        
        // Store user data in localStorage for later use
        localStorage.setItem('userData', JSON.stringify({
          phone: response.data.user.phone,
          name: response.data.user.name,
          walletAddress: response.data.user.walletAddress,
          ensDomain: response.data.user.ensDomain,
          ensName: response.data.user.ensName, // Add ensName field
          balance: response.data.user.pyusdBalance
        }));
        
        // Navigate to wallet creation
        navigate('/wallet-creation');
        
      } catch (err) {
        console.error('Signup error:', err);
        
        if (err.response) {
          // Server responded with error status
          setError(err.response.data.error || 'Signup failed');
        } else if (err.request) {
          // Network error
          setError('Network error. Please check if the server is running.');
        } else {
          // Other error
          setError('An unexpected error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBackToPhone = () => {
    setIsOtp(false);
    setOtp('');
    setError('');
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen px-4">
      <h1 className="text-2xl text-white font-bold mb-6">Welcome to uPAL</h1>
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        
        {!isOtp ? (
          // Phone, Name, Password input form
          <>
            <div className="flex items-center mb-4">
              <Phone className="mr-2 text-gray-600" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter Phone Number"
                className="w-full p-2 border rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex items-center mb-4">
              <User className="mr-2 text-gray-600" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Your Name"
                className="w-full p-2 border rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex items-center mb-4">
              <Lock className="mr-2 text-gray-600" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
                className="w-full p-2 border rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
          </>
        ) : (
          // OTP input form
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Enter the OTP sent to {phone}
              </p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="w-full p-2 border rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
                maxLength={6}
              />
            </div>
            
            <button
              onClick={handleBackToPhone}
              className="w-full mb-2 text-blue-500 text-sm hover:text-blue-600"
              disabled={isLoading}
            >
              ← Back to edit details
            </button>
          </>
        )}
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className={`w-full p-2 rounded text-white font-medium ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'
          } transition-colors`}
        >
          {isLoading ? 'Processing...' : (isOtp ? 'Verify OTP & Sign Up' : 'Send OTP')}
        </button>
      </div>
    </div>
  );
}

export default SignupLogin;
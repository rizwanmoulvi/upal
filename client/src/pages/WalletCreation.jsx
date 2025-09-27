import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function WalletCreation() {
  const [walletAddress, setWalletAddress] = useState('');
  const [ensDomain, setEnsDomain] = useState('');
  const navigate = useNavigate();

  const handleCreate = () => {
    // Dummy generation
    const newWalletAddress = '0x1234567890abcdef1234567890abcdef12345678';
    const newEnsDomain = 'user.eth';
    
    setWalletAddress(newWalletAddress);
    setEnsDomain(newEnsDomain);
    
    // Get existing user data and update with wallet info
    const existingUserData = JSON.parse(localStorage.getItem('userData') || '{}');
    const updatedUserData = {
      ...existingUserData,
      walletAddress: newWalletAddress,
      ensDomain: newEnsDomain,
      balance: existingUserData.balance || 100
    };
    
    console.log('Updated user data with wallet:', updatedUserData);
    localStorage.setItem('userData', JSON.stringify(updatedUserData));
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-[360px] h-[700px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-fuchsia-600 text-white p-6 text-center">
          <h1 className="text-2xl font-bold">Create Your Wallet</h1>
          <p className="text-fuchsia-100 mt-2 text-sm">Set up your crypto wallet</p>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 flex flex-col justify-center">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-fuchsia-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="text-fuchsia-600 text-2xl">🔐</div>
            </div>
            <p className="text-gray-600">
              We'll create a dummy wallet and ENS domain for demonstration purposes.
            </p>
          </div>
          
          <button
            onClick={handleCreate}
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-600 text-white p-4 rounded-lg font-medium text-base transition-colors"
          >
            Create Wallet & ENS
          </button>
        </div>
      </div>
    </div>
  );
}

export default WalletCreation;


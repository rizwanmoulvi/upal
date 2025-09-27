import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { Eye, EyeOff, Copy, Check, RefreshCw } from 'lucide-react';
import axios from 'axios';

function WalletSetup() {
  const [step, setStep] = useState(1); // 1: Generate, 2: Confirm, 3: PIN Setup
  const [mnemonic, setMnemonic] = useState('');
  const [mnemonicWords, setMnemonicWords] = useState([]);
  const [wallet, setWallet] = useState(null);

  const [selectedIndices, setSelectedIndices] = useState([]);
  const [userInputs, setUserInputs] = useState([]);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [skippedBackup, setSkippedBackup] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = 'https://api.upal.rizzmo.site/api';

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/auth');
      return;
    }
    
    // Generate wallet on component mount
    generateWallet();
  }, [navigate]);

  const generateWallet = () => {
    try {
      // Generate new mnemonic
      const newWallet = ethers.Wallet.createRandom();
      const newMnemonic = newWallet.mnemonic.phrase;
      const words = newMnemonic.split(' ');
      
      setMnemonic(newMnemonic);
      setMnemonicWords(words);
      setWallet(newWallet);
      
      // Select 3 random indices for confirmation
      const indices = [];
      while (indices.length < 3) {
        const randomIndex = Math.floor(Math.random() * 12);
        if (!indices.includes(randomIndex)) {
          indices.push(randomIndex);
        }
      }
      setSelectedIndices(indices.sort((a, b) => a - b));
      setUserInputs(new Array(3).fill(''));
      
      console.log('Generated wallet:', {
        address: newWallet.address,
        mnemonic: newMnemonic
      });
    } catch (err) {
      console.error('Wallet generation error:', err);
      setError('Failed to generate wallet. Please try again.');
    }
  };

  const copyMnemonic = async () => {
    try {
      await navigator.clipboard.writeText(mnemonic);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleConfirmationInput = (index, value) => {
    const newInputs = [...userInputs];
    newInputs[index] = value.toLowerCase().trim();
    setUserInputs(newInputs);
  };

  const validateConfirmation = () => {
    for (let i = 0; i < selectedIndices.length; i++) {
      const expectedWord = mnemonicWords[selectedIndices[i]];
      const userWord = userInputs[i];
      if (expectedWord !== userWord) {
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (validateConfirmation()) {
        setStep(3);
        setError('');
      } else {
        setError('Some words are incorrect. Please check and try again.');
      }
    }
  };

  const handleSkipBackup = () => {
    // Skip directly to PIN setup
    console.log('WalletSetup: handleSkipBackup called - setting skippedBackup to true');
    setSkippedBackup(true);
    setStep(3);
    setError('');
  };

  const handlePinSetup = async () => {
    if (pin.length < 6) {
      setError('PIN must be at least 6 digits');
      return;
    }
    
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Encrypt wallet with PIN
      const encryptedKeystore = await wallet.encrypt(pin);
      
      // Store encrypted keystore on server
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_BASE_URL}/keystore`, {
        encryptedKeystore: encryptedKeystore,
        walletAddress: wallet.address
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Keystore stored:', response.data);

      // Update local user data
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      userData.walletAddress = wallet.address;
      userData.hasWallet = true;
      userData.needsBackupReminder = skippedBackup;
      console.log('WalletSetup: Saving userData with skippedBackup =', skippedBackup, 'userData:', userData);
      localStorage.setItem('userData', JSON.stringify(userData));

      // Navigate to home
      navigate('/');
    } catch (err) {
      console.error('Wallet setup error:', err);
      if (err.response) {
        setError(err.response.data.error || 'Failed to setup wallet');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };



  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-[360px] h-[700px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-fuchsia-600 text-white p-6 text-center">
            <h1 className="text-xl font-bold">Secret Recovery Phrase</h1>
            <p className="text-fuchsia-100 mt-2 text-sm">Keep this safe and secure</p>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Important:</strong> Write down these 12 words in order and keep them safe. 
                This is the ONLY way to recover your wallet if you lose access.
              </p>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-700">Recovery Phrase</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowMnemonic(!showMnemonic)}
                    className="p-2 text-fuchsia-600 hover:bg-fuchsia-50 rounded-lg transition-colors"
                  >
                    {showMnemonic ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={copyMnemonic}
                    className="p-2 text-fuchsia-600 hover:bg-fuchsia-50 rounded-lg transition-colors"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg border">
                {mnemonicWords.map((word, index) => (
                  <div key={index} className="flex items-center bg-white p-2 rounded">
                    <span className="text-xs text-gray-500 w-6 font-medium">{index + 1}.</span>
                    <span className="text-sm text-gray-900 font-mono">
                      {showMnemonic ? word : '•••••'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                Never share your recovery phrase with anyone. uPAL will never ask for it.
              </p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={generateWallet}
                  className="bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600 flex items-center justify-center font-medium transition-colors"
                >
                  <RefreshCw size={16} className="mr-2" />
                  New Phrase
                </button>
                <button
                  onClick={handleNextStep}
                  className="bg-fuchsia-600 text-white p-3 rounded-lg hover:bg-fuchsia-600 font-medium transition-colors"
                >
                  I've Written It Down
                </button>
              </div>
              
              <div className="text-center">
                <button
                  onClick={handleSkipBackup}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Skip for now - I'll backup later
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  You can access your recovery phrase anytime from Settings
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-[360px] h-[700px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-fuchsia-600 text-white p-6 text-center">
            <h1 className="text-xl font-bold">Confirm Recovery Phrase</h1>
            <p className="text-fuchsia-100 mt-2 text-sm">Verify you wrote it down correctly</p>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 flex flex-col justify-center">
            <p className="text-sm text-gray-600 mb-6 text-center">
              Please enter the words at the specified positions to confirm you've written them down correctly.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4 mb-6">
              {selectedIndices.map((wordIndex, inputIndex) => (
                <div key={inputIndex}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Word #{wordIndex + 1}
                  </label>
                  <input
                    type="text"
                    value={userInputs[inputIndex]}
                    onChange={(e) => handleConfirmationInput(inputIndex, e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-600 focus:border-transparent text-base"
                    placeholder={`Enter word #${wordIndex + 1}`}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setStep(1)}
                className="bg-gray-500 text-white p-4 rounded-lg hover:bg-gray-600 font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                className="bg-fuchsia-600 text-white p-4 rounded-lg hover:bg-fuchsia-600 font-medium transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-[360px] h-[700px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-fuchsia-600 text-white p-6 text-center">
            <h1 className="text-xl font-bold">Set Wallet PIN</h1>
            <p className="text-fuchsia-100 mt-2 text-sm">Secure your wallet</p>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 flex flex-col justify-center">
            <p className="text-sm text-gray-600 mb-6 text-center">
              Create a PIN to encrypt your wallet. You'll need this PIN every time you want to send transactions.
            </p>

            {skippedBackup && (
              <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>⚠️ Remember:</strong> You skipped backing up your recovery phrase. 
                  Don't forget to save it from Settings after wallet creation!
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter PIN (minimum 6 digits)
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-600 focus:border-transparent text-base"
                  placeholder="Enter your PIN"
                  maxLength={6}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm PIN
                </label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-600 focus:border-transparent text-base"
                  placeholder="Confirm your PIN"
                  maxLength={6}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  if (skippedBackup) {
                    setSkippedBackup(false);
                    setStep(1);
                  } else {
                    setStep(2);
                  }
                }}
                className="bg-gray-500 text-white p-4 rounded-lg hover:bg-gray-600 font-medium transition-colors"
                disabled={isLoading}
              >
                Back
              </button>
              <button
                onClick={handlePinSetup}
                disabled={isLoading || pin.length < 6}
                className={`p-4 rounded-lg text-white font-medium transition-colors ${
                  isLoading || pin.length < 6
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-fuchsia-600 hover:bg-fuchsia-600'
                }`}
              >
                {isLoading ? 'Creating Wallet...' : 'Create Wallet'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default WalletSetup;
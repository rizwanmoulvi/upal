import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Phone, Globe, Wallet, User, CreditCard } from 'lucide-react';
import { ethers } from 'ethers';
import { 
  resolveENS, 
  sendFlowTokens, 
  sendPYUSDTokens, 
  fetchKeystore, 
  decryptWallet 
} from '../utils/walletService';
import { TOKENS, CURRENCY_NETWORKS } from '../config/networks';
import TransactionSuccess from '../components/TransactionSuccess';

function Transfer() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialAmount = location.state?.amount || '0';

  // Get currency and amount from location state
  const currency = location.state?.currency || 'flow'; // 'upi', 'pyusd', 'flow'
  const amount = initialAmount;

  // Set default transferFrom based on currency
  const getDefaultTransferFrom = () => {
    return currency === 'upi' ? 'bank' : 'wallet';
  };

  const [step, setStep] = useState(1); // 1: Main transfer, 2: PIN entry, 3: Success
  const [transferFrom, setTransferFrom] = useState(getDefaultTransferFrom());
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [transferTo, setTransferTo] = useState('');
  const [selectedRecipientType, setSelectedRecipientType] = useState(''); // 'phone', 'ens', 'wallet', 'upi'
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [transactionData, setTransactionData] = useState(null);
  
  // Address book contacts loaded from localStorage
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [walletAddresses, setWalletAddresses] = useState([]);
  const [ensNames, setEnsNames] = useState([]);
  const [upiIds, setUpiIds] = useState([]);

  // Load contacts from address book
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const currentUserPhone = userData.phone;
    
    if (!currentUserPhone) {
      // If no user logged in, use empty arrays
      setPhoneNumbers([]);
      setWalletAddresses([]);
      setEnsNames([]);
      setUpiIds([]);
      return;
    }
    
    const storageKey = `addressBook_${currentUserPhone}`;
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        
        // Check if it's in the correct categorized format
        if (parsedData && typeof parsedData === 'object' && parsedData.upi !== undefined) {
          // Convert address book format to transfer format
          setUpiIds(parsedData.upi.map(contact => ({
            id: contact.id,
            name: contact.name,
            upiId: contact.address,
            note: contact.note
          })));
          
          setPhoneNumbers(parsedData.phone.map(contact => ({
            id: contact.id,
            name: contact.name,
            phone: contact.address,
            note: contact.note
          })));
          
          setEnsNames(parsedData.ens.map(contact => ({
            id: contact.id,
            name: contact.address, // For ENS, the address IS the ENS name
            address: contact.address,
            displayName: contact.name,
            note: contact.note
          })));
          
          setWalletAddresses(parsedData.wallet.map(contact => ({
            id: contact.id,
            name: contact.name,
            address: contact.address,
            note: contact.note
          })));
        } else if (Array.isArray(parsedData)) {
          // Handle old flat array format
          const upiContacts = parsedData.filter(c => c.category === 'upi');
          const phoneContacts = parsedData.filter(c => c.category === 'phone');
          const ensContacts = parsedData.filter(c => c.category === 'ens');
          const walletContacts = parsedData.filter(c => c.category === 'wallet');
          
          setUpiIds(upiContacts.map(contact => ({
            id: contact.id,
            name: contact.name,
            upiId: contact.address
          })));
          
          setPhoneNumbers(phoneContacts.map(contact => ({
            id: contact.id,
            name: contact.name,
            phone: contact.address
          })));
          
          setEnsNames(ensContacts.map(contact => ({
            id: contact.id,
            name: contact.address,
            address: contact.address,
            displayName: contact.name
          })));
          
          setWalletAddresses(walletContacts.map(contact => ({
            id: contact.id,
            name: contact.name,
            address: contact.address
          })));
        }
      } catch (error) {
        console.error('Error loading address book:', error);
        // Reset to empty arrays on error
        setPhoneNumbers([]);
        setWalletAddresses([]);
        setEnsNames([]);
        setUpiIds([]);
      }
    }
  }, []);

  // Helper function to validate Ethereum address format
  const isValidAddress = (address) => {
    return address && 
           typeof address === 'string' && 
           address.startsWith('0x') && 
           address.length === 42 && 
           /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Helper function to validate UPI ID format
  const isValidUPI = (upiId) => {
    return upiId && 
           typeof upiId === 'string' && 
           /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId);
  };

  const handleRecipientSelect = (recipient, type) => {
    setSelectedRecipient({ ...recipient, type });
    if (type === 'phone') {
      setTransferTo(recipient.phone);
    } else if (type === 'ens') {
      setTransferTo(recipient.name);
    } else if (type === 'wallet') {
      setTransferTo(recipient.address);
    } else if (type === 'upi') {
      setTransferTo(recipient.upiId);
    }
  };  const handleConfirm = () => {
    if (selectedRecipient || (transferTo && transferTo.trim())) {
      // If manually entered address, create a recipient object
      if (!selectedRecipient && transferTo) {
        const manualRecipient = {
          id: 'manual',
          name: null,
          address: transferTo.trim(),
          phone: null
        };
        setSelectedRecipient(manualRecipient);
        setSelectedRecipientType('wallet'); // Assume wallet address for manual entry
      }
      setStep(2); // Go to PIN entry (UPI PIN for bank, encryption PIN for wallet)
      setError('');
    }
  };

  const handleSend = async () => {
    setIsLoading(true);
    setError('');

    try {
      let txHash = null;

      // Handle different currency types
      if (currency === 'flow' || currency === 'pyusd') {
        if (transferFrom === 'wallet') {
          // Perform actual blockchain transaction
          try {
            // Validate recipient type for crypto transfers
            if (selectedRecipientType === 'phone') {
              throw new Error('Phone number transfers not yet supported for crypto. Please use wallet address or ENS name.');
            }
            
            // Get the encrypted keystore from server
            const keystoreData = await fetchKeystore();
            
            // Decrypt wallet with PIN
            const wallet = await decryptWallet(keystoreData.encryptedKeystore, pin);
            
            console.log('Wallet decrypted successfully. Address:', wallet.address);
            
            let tx;
            
            if (currency === 'flow') {
              // Send native FLOW tokens
              let recipientAddress = selectedRecipient?.address || selectedRecipient?.name;
              
              // If it's an ENS name, resolve it to address
              if (recipientAddress && recipientAddress.endsWith('.eth')) {
                try {
                  recipientAddress = await resolveENS(recipientAddress);
                  console.log('ENS resolved:', recipientAddress);
                } catch {
                  throw new Error(`Failed to resolve ENS name: ${recipientAddress}`);
                }
              }
              
              // Validate address format
              if (!isValidAddress(recipientAddress)) {
                throw new Error(`Invalid recipient address format. Expected 42-character hexadecimal address starting with 0x, got: ${recipientAddress}`);
              }
              
              tx = await sendFlowTokens(wallet, recipientAddress, amount);
              console.log('FLOW transaction sent:', tx);
            } else if (currency === 'pyusd') {
              // Send PYUSD tokens (ERC-20)
              let recipientAddress = selectedRecipient?.address || selectedRecipient?.name;
              
              // If it's an ENS name, resolve it to address
              if (recipientAddress && recipientAddress.endsWith('.eth')) {
                try {
                  recipientAddress = await resolveENS(recipientAddress);
                  console.log('ENS resolved:', recipientAddress);
                } catch {
                  throw new Error(`Failed to resolve ENS name: ${recipientAddress}`);
                }
              }
              
              // Validate address format
              if (!isValidAddress(recipientAddress)) {
                throw new Error(`Invalid recipient address format. Expected 42-character hexadecimal address starting with 0x, got: ${recipientAddress}`);
              }
              
              // Send PYUSD tokens on Sepolia network
              tx = await sendPYUSDTokens(wallet, recipientAddress, amount);
              console.log('PYUSD transaction sent on Sepolia:', tx);
            }
            
            txHash = tx.hash;
            
            // Wait for transaction confirmation (optional)
            console.log('Waiting for transaction confirmation...');
            const receipt = await tx.wait();
            console.log('Transaction confirmed:', receipt);
            
          } catch (blockchainError) {
            console.error('Blockchain transaction error:', blockchainError);
            throw new Error(`Transaction failed: ${blockchainError.message}`);
          }
        } else {
          // Bank transfer - simulate for now
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } else if (currency === 'upi' || currency === 'inr') {
        // UPI/Bank transfer - simulate for now
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Prepare transaction data
      const txData = {
        amount,
        currency,
        from: transferFrom,
        to: selectedRecipient?.phone || selectedRecipient?.name || selectedRecipient?.address || selectedRecipient?.upiId,
        recipientName: selectedRecipient?.name,
        ...(txHash && { txHash })
      };

      setTransactionData(txData);
      setStep(3); // Move to success screen

    } catch (err) {
      console.error('Transaction error:', err);
      setError(err.message || 'Transaction failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1 && step < 3) { // Don't allow back from success screen
      setStep(step - 1);
      setError('');
    } else {
      navigate('/services');
    }
  };

  const handleTransactionComplete = () => {
    navigate('/services', {
      state: {
        successMessage: `Successfully sent ${transactionData?.amount} ${transactionData?.currency} to ${transactionData?.recipientName || transactionData?.to}`
      }
    });
  };

  // Step 1: Main Transfer Screen
  const renderMainTransfer = () => (
    <div className="flex-1 p-6 flex flex-col space-y-6 min-h-0">
      {/* Transfer From Section */}
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Transfer From
        </label>
        <div className="relative">
          <button
            onClick={() => setShowFromDropdown(!showFromDropdown)}
            className="w-full p-4 border border-white/20 rounded-lg bg-white/10 text-white flex items-center justify-between"
          >
            <span>{transferFrom === 'wallet' ? 'Wallet' : 'Bank Account'}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {showFromDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <button
                onClick={() => {
                  setTransferFrom('wallet');
                  setShowFromDropdown(false);
                }}
                className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-t-lg"
              >
                Wallet
              </button>
              <button
                onClick={() => {
                  setTransferFrom('bank');
                  setShowFromDropdown(false);
                }}
                className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-b-lg"
              >
                Bank Account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transfer To Section */}
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Transfer To
        </label>
        <input
          type="text"
          value={transferTo}
          onChange={(e) => {
            const value = e.target.value.trim();
            setTransferTo(value);
            // Clear selected recipient when manually typing
            if (selectedRecipient && selectedRecipient.id === 'manual') {
              setSelectedRecipient(null);
            }
          }}
          placeholder="Enter wallet address, ENS, phone number, or UPI ID"
          className={`w-full p-4 border rounded-lg bg-white/10 text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-transparent text-base ${
            transferTo && (isValidAddress(transferTo) || transferTo.endsWith('.eth') || transferTo.includes('+') || isValidUPI(transferTo))
              ? 'border-green-400' 
              : transferTo 
              ? 'border-red-400' 
              : 'border-white/20'
          }`}
        />
        {transferTo && !selectedRecipient && (
          <p className={`text-xs mt-1 ${
            isValidAddress(transferTo) ? 'text-green-300' : 
            transferTo.endsWith('.eth') ? 'text-yellow-300' : 
            isValidUPI(transferTo) ? 'text-green-300' :
            transferTo.includes('+') ? 'text-blue-300' :
            'text-red-300'
          }`}>
            {isValidAddress(transferTo) ? '✓ Valid wallet address' : 
             transferTo.endsWith('.eth') ? '? ENS name (will be resolved)' :
             isValidUPI(transferTo) ? '✓ Valid UPI ID' :
             transferTo.includes('+') ? '? Phone number (for international)' :
             '✗ Invalid format'}
          </p>
        )}
      </div>

      {/* Recipient Type Options */}
      <div className="flex justify-center space-x-3">
        <button
          onClick={() => setSelectedRecipientType('upi')}
          className={`p-3 rounded-full border-2 transition-colors flex flex-col items-center justify-center ${
            selectedRecipientType === 'upi'
              ? 'border-white bg-white/10 text-white'
              : 'border-white/30 text-white/70 hover:border-white/50'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <p className='text-xs'>UPI</p>
        </button>
        <button
          onClick={() => setSelectedRecipientType('phone')}
          className={`p-3 rounded-full border-2 transition-colors flex flex-col items-center justify-center ${
            selectedRecipientType === 'phone'
              ? 'border-white bg-white/10 text-white'
              : 'border-white/30 text-white/70 hover:border-white/50'
          }`}
        >
          <Phone className="w-5 h-5" />
          <p className='text-xs'>Phone</p>
        </button>
        <button
          onClick={() => setSelectedRecipientType('ens')}
          className={`p-3 rounded-full border-2 flex flex-col items-center justify-center transition-colors ${
            selectedRecipientType === 'ens'
              ? 'border-white bg-white/10 text-white'
              : 'border-white/30 text-white/70 hover:border-white/50'
          }`}
        >
          <Globe className="w-5 h-5" />
          <p className='text-xs'>ENS</p>
        </button>
        <button
          onClick={() => setSelectedRecipientType('wallet')}
          className={`p-3 rounded-full border-2 transition-colors flex flex-col items-center justify-center ${
            selectedRecipientType === 'wallet'
              ? 'border-white bg-white/10 text-white'
              : 'border-white/30 text-white/70 hover:border-white/50'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <p className='text-xs'>Wallet</p>
        </button>
      </div>

      {/* Recipient List */}
      {selectedRecipientType && (
        <div className="flex-1 flex flex-col min-h-0">
          <h3 className="text-white/80 text-sm font-medium mb-3 flex-shrink-0">
            Select Recipient
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2 pb-4">
            {selectedRecipientType === 'upi' && (
              upiIds.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-white/40 mx-auto mb-3" />
                  <p className="text-white/60 text-sm">No UPI contacts in address book</p>
                  <p className="text-white/40 text-xs mt-1">Add UPI IDs from Activity page or enter manually above</p>
                </div>
              ) : (
                upiIds.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleRecipientSelect(contact, 'upi')}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedRecipient?.id === contact.id
                        ? 'bg-white/20 border-2 border-white'
                        : 'bg-white/10 border border-white/20 hover:bg-white/15'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-5 h-5 text-white/70 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-white font-medium">{contact.name}</p>
                        <p className="text-white/60 text-sm">{contact.upiId}</p>
                      </div>
                    </div>
                  </button>
                ))
              )
            )}
            
            {selectedRecipientType === 'phone' && (
              phoneNumbers.length === 0 ? (
                <div className="text-center py-8">
                  <Phone className="w-12 h-12 text-white/40 mx-auto mb-3" />
                  <p className="text-white/60 text-sm">No phone contacts in address book</p>
                  <p className="text-white/40 text-xs mt-1">Add phone numbers from Activity page or enter manually above</p>
                </div>
              ) : (
                phoneNumbers.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleRecipientSelect(contact, 'phone')}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedRecipient?.id === contact.id
                        ? 'bg-white/20 border-2 border-white'
                        : 'bg-white/10 border border-white/20 hover:bg-white/15'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-white/70 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-white font-medium">{contact.name}</p>
                        <p className="text-white/60 text-sm">{contact.phone}</p>
                      </div>
                    </div>
                  </button>
                ))
              )
            )}
            
            {selectedRecipientType === 'ens' && (
              ensNames.length === 0 ? (
                <div className="text-center py-8">
                  <Globe className="w-12 h-12 text-white/40 mx-auto mb-3" />
                  <p className="text-white/60 text-sm">No ENS contacts in address book</p>
                  <p className="text-white/40 text-xs mt-1">Add ENS names from Activity page or enter manually above</p>
                </div>
              ) : (
                ensNames.map((ens) => (
                  <button
                    key={ens.id}
                    onClick={() => handleRecipientSelect(ens, 'ens')}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedRecipient?.id === ens.id
                        ? 'bg-white/20 border-2 border-white'
                        : 'bg-white/10 border border-white/20 hover:bg-white/15'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-white/70 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-white font-medium">{ens.displayName || ens.name}</p>
                        <p className="text-white/60 text-xs break-all">{ens.name}</p>
                      </div>
                    </div>
                  </button>
                ))
              )
            )}
            
            {selectedRecipientType === 'wallet' && (
              walletAddresses.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="w-12 h-12 text-white/40 mx-auto mb-3" />
                  <p className="text-white/60 text-sm">No wallet contacts in address book</p>
                  <p className="text-white/40 text-xs mt-1">Add wallet addresses from Activity page or enter manually above</p>
                </div>
              ) : (
                walletAddresses.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={() => handleRecipientSelect(wallet, 'wallet')}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedRecipient?.id === wallet.id
                        ? 'bg-white/20 border-2 border-white'
                        : 'bg-white/10 border border-white/20 hover:bg-white/15'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Wallet className="w-5 h-5 text-white/70 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-white font-medium">{wallet.name}</p>
                        <p className="text-white/60 text-xs break-all">{wallet.address}</p>
                      </div>
                    </div>
                  </button>
                ))
              )
            )}
          </div>
        </div>
      )}

      {/* Confirm Button */}
      <button
        onClick={handleConfirm}
        disabled={!selectedRecipient && (!transferTo || !transferTo.trim())}
        className={`w-full p-4 rounded-lg font-medium transition-colors ${
          selectedRecipient || (transferTo && transferTo.trim())
            ? 'bg-white/90 text-fuchsia-600 hover:bg-white'
            : 'bg-white/20 text-white/50 cursor-not-allowed'
        }`}
      >
        Confirm Transfer
      </button>

      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}
    </div>
  );

  // Step 2: Enter PIN
  const renderPinStep = () => (
    <div className="flex pl-6 pr-6 flex flex-col">
      <div className="flex-1 flex flex-col justify-center">
        <h2 className="text-2xl font-bold text-white text-center ">
          {transferFrom === 'bank' ? 'Enter UPI PIN' : 'Enter Wallet PIN'}
        </h2>
        
        {/* Amount Display */}
        <div className="text-center mb-6">
          <p className="text-white/70 text-sm mb-1">Amount to Send</p>
          <p className="text-white text-2xl font-bold">
            {currency === 'upi' ? '₹' + amount + ' INR' : amount + ' ' + currency.toUpperCase()}
          </p>
        </div>
        
        <div>
          {/* <label className="block text-sm font-medium text-white/90 mb-4 text-center">
            {transferFrom === 'bank' ? 'UPI PIN' : 'Wallet Encryption PIN'}
          </label> */}
          
          {/* PIN Input Boxes */}
          <div className="flex justify-center sspace-x-3 mb-1">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <div
                key={index}
                className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center text-white text-xl font-bold transition-colors ${
                  pin.length > index
                    ? 'border-white bg-white/20'
                    : 'border-white/40 bg-white/10'
                }`}
              >
                {pin.length > index ? '•' : ''}
              </div>
            ))}
          </div>
          
          {/* Hidden input for mobile keyboard */}
          <input
            type="number"
            value={pin}
            onChange={(e) => {
              const value = e.target.value.slice(0, 6);
              setPin(value);
            }}
            className="absolute opacity-0 -z-10"
            maxLength={6}
            autoFocus
          />
          
          <p className="text-white/60 text-xs text-center mb-6">
            {transferFrom === 'bank' 
              ? 'Enter your UPI PIN to authorize the transfer' 
              : 'Enter the PIN you set when creating your wallet'
            }
          </p>
          
          {/* Custom Keypad */}
          <div className="grid grid-cols-3 mb-8 gap-4 max-w-xs mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <button
                key={digit}
                onClick={() => {
                  if (pin.length < 6) {
                    setPin(pin + digit.toString());
                  }
                }}
                className="w-16 h-16 bg-white/10 border border-white/30 rounded-lg text-white text-xl font-semibold hover:bg-white/20 transition-colors"
              >
                {digit}
              </button>
            ))}
            
            {/* Bottom row with 0 and backspace */}
            <div></div> {/* Empty space */}
            <button
              onClick={() => {
                if (pin.length < 6) {
                  setPin(pin + '0');
                }
              }}
              className="w-16 h-16 bg-white/10 border border-white/30 rounded-lg text-white text-xl font-semibold hover:bg-white/20 transition-colors"
            >
              0
            </button>
            <button
              onClick={() => {
                setPin(pin.slice(0, -1));
              }}
              className="w-16 h-16 bg-white/10 border border-white/30 rounded-lg text-white text-xl font-semibold hover:bg-white/20 transition-colors flex items-center justify-center"
            >
              ⌫
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleBack}
          disabled={isLoading}
          className="bg-white/20 text-white p-4 rounded-lg hover:bg-white/30 font-medium transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleSend}
          disabled={isLoading || pin.length < 6}
          className={`p-4 rounded-lg text-fuchsia-600 font-medium transition-colors ${
            isLoading
              ? 'bg-white/50 cursor-not-allowed'
              : pin.length >= 6
              ? 'bg-gray-100 hover:bg-gray-200 '
              : 'bg-white/20 text-gray-600 cursor-not-allowed'
          }`}
        >
          {isLoading ? 'Sending...' : 'Send Payment'}
        </button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 1: return renderMainTransfer();
      case 2: return renderPinStep();
      case 3: return <TransactionSuccess transactionData={transactionData} onComplete={handleTransactionComplete} />;
      default: return renderMainTransfer();
    }
  };

  // If on success screen, render it directly (full screen)
  if (step === 3) {
    return renderCurrentStep();
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-[360px] h-[700px] bg-fuchsia-600 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 flex items-center">
          <button
            onClick={handleBack}
            className="mr-3 p-2 hover:bg-fuchsia-600 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="text-lg font-medium text-white">
            Transfer {currency === 'upi' ? '₹' : ''}{amount} {currency === 'upi' ? 'INR' : currency.toUpperCase()}
          </h1>
        </div>

        {/* Main Content */}
        {renderCurrentStep()}
      </div>
    </div>
  );
}

export default Transfer;
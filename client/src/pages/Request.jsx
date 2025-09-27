import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Clock, CheckCircle, DollarSign, User, Calendar } from 'lucide-react';


function Request() {
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [requests, setRequests] = useState([]);
  const [selectedTab, setSelectedTab] = useState('received'); // 'received', 'sent'
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const currentUser = {
      id: userData.phone || userData.walletAddress,
      phone: userData.phone,
      ensName: userData.ensName,
      walletAddress: userData.walletAddress
    };
    setUser(currentUser);

    if (!userData.phone && !userData.walletAddress) return;

    // Load requests from localStorage
    const storedRequests = JSON.parse(localStorage.getItem(`requests_${currentUser.id}`) || '[]');
    setRequests(storedRequests);
  }, []);



  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-orange-200 bg-orange-500/20 border-orange-300/30';
      case 'paid': return 'text-green-200 bg-green-500/20 border-green-300/30';
      case 'overdue': return 'text-red-200 bg-red-500/20 border-red-300/30';
      default: return 'text-white/60 bg-white/10 border-white/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'overdue': return <Clock className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handlePayRequest = async (request) => {
    setIsLoading(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update request status to paid
      const updatedRequests = requests.map(r => 
        r.id === request.id ? { ...r, status: 'paid', paidAt: new Date().toISOString() } : r
      );
      setRequests(updatedRequests);
      localStorage.setItem(`requests_${user.id}`, JSON.stringify(updatedRequests));
      
      // Create transaction record
      const transactions = JSON.parse(localStorage.getItem(`transactions_${user.id}`) || '[]');
      const newTransaction = {
        id: Date.now().toString(),
        type: 'sent',
        amount: request.amount,
        currency: 'pyusd',
        from: user.ensName || user.phone || user.walletAddress,
        to: request.from,
        timestamp: new Date().toISOString(),
        status: 'completed',
        description: `Payment Request: ${request.description}`,
        requestId: request.id,
        requestNumber: request.requestNumber
      };
      transactions.unshift(newTransaction);
      localStorage.setItem(`transactions_${user.id}`, JSON.stringify(transactions));
      
      alert(`Payment of ${request.amount} PYUSD successful`);
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => request.type === selectedTab);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-[360px] h-[700px] bg-fuchsia-600 rounded-3xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-3 p-2 hover:bg-fuchsia-600 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h1 className="text-lg font-medium text-white">Payment Requests</h1>
          </div>

        </div>
        
        {/* Tabs */}
        <div className="flex px-4 mb-4">
          <button
            onClick={() => setSelectedTab('received')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-lg transition-colors ${
              selectedTab === 'received'
                ? 'bg-white text-fuchsia-600'
                : 'bg-white/20 text-white/80 hover:bg-white/30'
            }`}
          >
            Received
          </button>
          <button
            onClick={() => setSelectedTab('sent')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-lg transition-colors ${
              selectedTab === 'sent'
                ? 'bg-white text-fuchsia-600'
                : 'bg-white/20 text-white/80 hover:bg-white/30'
            }`}
          >
            Sent
          </button>
        </div>

        {/* Requests List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No {selectedTab} requests
            </h3>
            <p className="text-white/60 text-sm">
              {selectedTab === 'received' 
                ? 'Payment requests sent to you will appear here'
                : 'Payment requests you send will appear here'
              }
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20"
            >
              {/* Request Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <FileText className="w-4 h-4 text-white/70" />
                    <h3 className="font-semibold text-white text-sm">Payment Request</h3>
                  </div>
                  <p className="text-white/60 text-xs mb-1">{request.description}</p>
                  <p className="text-white/40 text-xs">#{request.requestNumber}</p>
                </div>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                  {getStatusIcon(request.status)}
                  <span className="capitalize">{request.status}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-white/70" />
                  <span className="text-xl font-bold text-white">
                    {request.amount} {request.currency}
                  </span>
                </div>
                <div className="text-right text-xs text-white/60">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Created: {formatDate(request.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Participants */}
              <div className="flex items-center justify-between text-xs text-white/60 mb-3">
                <div className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span className="truncate max-w-[120px]">{request.from}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span className="truncate max-w-[120px]">{request.to}</span>
                </div>
              </div>

              {/* Action Button */}
              {request.type === 'received' && request.status === 'pending' && (
                <button
                  onClick={() => handlePayRequest(request)}
                  disabled={isLoading}
                  className="w-full bg-white text-fuchsia-600 py-2 px-4 rounded-xl font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isLoading ? 'Processing...' : `Pay ${request.amount} ${request.currency}`}
                </button>
              )}

              {request.status === 'paid' && request.paidAt && (
                <div className="text-center text-xs text-green-300 py-2">
                  ✓ Paid on {formatDate(request.paidAt)}
                </div>
              )}
            </div>
          ))
        )}
      </div>


      </div>
    </div>
  );
}

export default Request;
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import WalletCreation from './pages/WalletCreation';
import WalletSetup from './pages/WalletSetup';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Transfer from './pages/Transfer';
import Services from './pages/Services';
import Activity from './pages/Activity';
import AddressBook from './pages/AddressBook';
import Request from './pages/Request';
import PinEntry from './pages/PinEntry';
import PaymentSuccess from './pages/PaymentSuccess';

function App() {
  return (
    <Router>
      <div className="min-h-screen w-screen bg-gray-100 font-sans"> {/* Clean Google Pay-like bg */}
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/wallet-creation" element={<WalletCreation />} />
          <Route path="/wallet-setup" element={<WalletSetup />} />
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/transfer" element={<Transfer />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/address-book" element={<AddressBook />} />
          <Route path="/bills" element={<Request />} />
          <Route path="/request" element={<Request />} />
          <Route path="/pin-entry" element={<PinEntry />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
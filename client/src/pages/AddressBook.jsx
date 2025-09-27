import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Phone, Globe, Wallet, CreditCard, Edit, Trash2, User, Search } from 'lucide-react';

function AddressBook() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('upi');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState({
    upi: [],
    phone: [],
    ens: [],
    wallet: []
  });
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    note: ''
  });

  // Load contacts from localStorage on component mount
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const currentUserPhone = userData.phone;
    
    if (!currentUserPhone) {
      // Ensure contacts has the correct structure even when no user is logged in
      setContacts({
        upi: [],
        phone: [],
        ens: [],
        wallet: []
      });
      return;
    }
    
    const storageKey = `addressBook_${currentUserPhone}`;
    const savedContacts = localStorage.getItem(storageKey);
    if (savedContacts) {
      const parsedContacts = JSON.parse(savedContacts);
      
      // Check if it's the old flat array format from Activity page
      if (Array.isArray(parsedContacts)) {
        // Convert flat array to categorized structure
        const categorizedContacts = {
          upi: [],
          phone: [],
          ens: [],
          wallet: []
        };
        
        parsedContacts.forEach(contact => {
          const category = contact.category || 'wallet';
          if (categorizedContacts[category]) {
            categorizedContacts[category].push(contact);
          }
        });
        
        setContacts(categorizedContacts);
        // Save in the new format
        const newStorageKey = `addressBook_${currentUserPhone}`;
        localStorage.setItem(newStorageKey, JSON.stringify(categorizedContacts));
      } else {
        // Already in correct format
        setContacts(parsedContacts);
      }
    } else {
      // Initialize with empty structure
      setContacts({
        upi: [],
        phone: [],
        ens: [],
        wallet: []
      });
    }
  }, []);

  // Save contacts to localStorage whenever contacts change
  const saveContacts = (newContacts) => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const currentUserPhone = userData.phone;
    
    if (!currentUserPhone) {
      return;
    }
    
    const storageKey = `addressBook_${currentUserPhone}`;
    setContacts(newContacts);
    localStorage.setItem(storageKey, JSON.stringify(newContacts));
  };

  const handleAddContact = () => {
    if (!formData.name.trim() || !formData.address.trim()) {
      alert('Please fill in name and address');
      return;
    }

    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const currentUserPhone = userData.phone;

    const newContact = {
      id: Date.now(),
      name: formData.name.trim(),
      address: formData.address.trim(),
      note: formData.note.trim(),
      userId: currentUserPhone,
      dateAdded: new Date().toISOString()
    };

    const newContacts = {
      ...contacts,
      [selectedTab]: [...contacts[selectedTab], newContact]
    };

    saveContacts(newContacts);
    setFormData({ name: '', address: '', note: '' });
    setShowAddModal(false);
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      address: contact.address,
      note: contact.note || ''
    });
    setShowAddModal(true);
  };

  const handleUpdateContact = () => {
    if (!formData.name.trim() || !formData.address.trim()) {
      alert('Please fill in name and address');
      return;
    }

    const updatedContact = {
      ...editingContact,
      name: formData.name.trim(),
      address: formData.address.trim(),
      note: formData.note.trim()
    };

    const newContacts = {
      ...contacts,
      [selectedTab]: contacts[selectedTab].map(contact => 
        contact.id === editingContact.id ? updatedContact : contact
      )
    };

    saveContacts(newContacts);
    setFormData({ name: '', address: '', note: '' });
    setEditingContact(null);
    setShowAddModal(false);
  };

  const handleDeleteContact = (contactId) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      const newContacts = {
        ...contacts,
        [selectedTab]: contacts[selectedTab].filter(contact => contact.id !== contactId)
      };
      saveContacts(newContacts);
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingContact(null);
    setFormData({ name: '', address: '', note: '' });
  };

  const getTabIcon = (tab) => {
    switch (tab) {
      case 'upi': return <CreditCard className="w-5 h-5" />;
      case 'phone': return <Phone className="w-5 h-5" />;
      case 'ens': return <Globe className="w-5 h-5" />;
      case 'wallet': return <Wallet className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  const getPlaceholder = (tab) => {
    switch (tab) {
      case 'upi': return 'e.g., user@paytm, user@gpay';
      case 'phone': return 'e.g., +1 234-567-8900';
      case 'ens': return 'e.g., john.eth, alice.upal.eth';
      case 'wallet': return 'e.g., 0x1234...5678';
      default: return 'Enter address';
    }
  };

  const tabs = [
    { id: 'upi', label: 'UPI ID', icon: CreditCard },
    { id: 'phone', label: 'Phone', icon: Phone },
    { id: 'ens', label: 'ENS', icon: Globe },
    { id: 'wallet', label: 'Wallet', icon: Wallet }
  ];

  // Filter contacts based on search query
  const getFilteredContacts = () => {
    const currentContacts = contacts[selectedTab] || [];
    
    if (!searchQuery.trim()) {
      return currentContacts;
    }
    
    return currentContacts.filter(contact => {
      const name = contact.name?.toLowerCase() || '';
      const address = contact.address?.toLowerCase() || '';
      const note = contact.note?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      
      return name.includes(query) || address.includes(query) || note.includes(query);
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-[360px] h-[700px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-fuchsia-600 flex items-center">
          <button
            onClick={() => navigate('/services')}
            className="mr-3 p-2 hover:bg-fuchsia-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="text-lg font-medium text-white flex-1">Address Book</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="p-2 hover:bg-fuchsia-700 rounded-lg transition-colors"
          >
            <Plus size={20} className="text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-50 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedTab(tab.id);
                setSearchQuery(''); // Clear search when switching tabs
              }}
              className={`flex-1 px-3 py-3 text-xs font-medium transition-colors ${
                selectedTab === tab.id
                  ? 'text-fuchsia-600 border-b-2 border-fuchsia-600 bg-white'
                  : 'text-gray-600 hover:text-fuchsia-600'
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                {getTabIcon(tab.id)}
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-white border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${tabs.find(t => t.id === selectedTab)?.label} contacts...`}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {getFilteredContacts().length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              {getTabIcon(selectedTab)}
              <p className="mt-2 text-sm">
                {searchQuery.trim() 
                  ? `No matching ${tabs.find(t => t.id === selectedTab)?.label} contacts found`
                  : `No ${tabs.find(t => t.id === selectedTab)?.label} contacts yet`
                }
              </p>
              {searchQuery.trim() ? (
                <p className="mt-1 text-xs text-gray-400">Try a different search term</p>
              ) : (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 px-4 py-2 bg-fuchsia-600 text-white rounded-lg text-sm hover:bg-fuchsia-700 transition-colors"
                >
                  Add First Contact
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {getFilteredContacts().map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {getTabIcon(selectedTab)}
                        <h3 className="font-medium text-gray-900">{contact.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 break-all">{contact.address}</p>
                      {contact.note && (
                        <p className="text-xs text-gray-500 mt-1">{contact.note}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Added {new Date(contact.dateAdded).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={() => handleEditContact(contact)}
                        className="p-2 text-gray-400 hover:text-fuchsia-600 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h2 className="text-lg font-semibold mb-4">
                {editingContact ? 'Edit Contact' : `Add ${tabs.find(t => t.id === selectedTab)?.label} Contact`}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter contact name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-600 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {tabs.find(t => t.id === selectedTab)?.label} Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder={getPlaceholder(selectedTab)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-600 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Add a note"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-600 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 p-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingContact ? handleUpdateContact : handleAddContact}
                  className="flex-1 p-3 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 transition-colors"
                >
                  {editingContact ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddressBook;

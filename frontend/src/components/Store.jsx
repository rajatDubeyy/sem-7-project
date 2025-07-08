import React, { useState, useEffect } from 'react';
import { Mail, UserCheck, AlertCircle, Loader2, Calendar } from 'lucide-react';
import { useHabitBlockchain } from '../context/HabitBlockchainContext';
import { toast } from 'react-toastify';

const books = [
  {
    id: 1,
    title: 'Atomic Habits',
    author: 'James Clear',
    tokens: 30,
    cover: '📘',
    description: 'An easy & proven way to build good habits & break bad ones.',
    pdfLink: '/books/atomic-habits.pdf'
  },
  {
    id: 2,
    title: 'The Power of Now',
    author: 'Eckhart Tolle',
    tokens: 25,
    cover: '📗',
    description: 'A guide to spiritual enlightenment and being present.',
    pdfLink: '/books/power-of-now.pdf'
  },
  {
    id: 3,
    title: 'Deep Work',
    author: 'Cal Newport',
    tokens: 5,
    cover: '📙',
    description: 'Rules for focused success in a distracted world.',
    pdfLink: '/books/deep-work.pdf'
  }
];

const RedeemStore = () => {
  const [purchased, setPurchased] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');

  // Blockchain context
  const {
    account,
    userData,
    therapistData,
    userBookings,
    contract,
    redeemTokens,
    bookTherapist,
    isLoading: blockchainLoading,
    loadUserData,
    displayTokens,
    fetchTherapistAddressesFromEvents
  } = useHabitBlockchain();
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-600';
      case 'Completed': return 'bg-green-600';
      case 'Cancelled': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  // Override booking status to always show "Completed"
  

  // Load initial data
  useEffect(() => {
    const loadTherapists = async () => {
      setLoading(true);
      setError(null);
  
      try {
        if (contract && account) {
          const therapistAddresses = await fetchTherapistAddressesFromEvents();
  
          const therapistPromises = therapistAddresses.map(async (address) => {
            const [name, sessionCount, isActive] = await contract.getTherapistData(address);
            return {
              walletAddress: address,
              username: name,
              email: `${name.replace(/\s+/g, '').toLowerCase()}@example.com`,
              sessionCount: Number(sessionCount),
              isActive
            };
          });
  
          const therapistsData = await Promise.all(therapistPromises);
          setTherapists(therapistsData.filter(t => t.isActive));
        }
      } catch (err) {
        console.error("Failed to fetch therapists:", err);
        setError("Failed to load therapists from blockchain. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
  
    loadTherapists();
  }, [contract, account]);

  

  // Update user data when account changes
  useEffect(() => {
    if (account) {
      loadUserData();
    }
  }, [account, loadUserData]);

  const handleRedeem = async (book) => {
    if (!account) {
      toast.error('Please connect your wallet first!');
      return;
    }
    
    if (parseFloat(userData.earnedTokensFormatted || 0) < book.tokens) {
      toast.error(`You need ${book.tokens} tokens to redeem this book!`);
      return;
    }
    
    try {
      await redeemTokens(book.tokens);
      const newPurchased = [...purchased, book.id];
      setPurchased(newPurchased);
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('purchasedBooks', JSON.stringify(newPurchased));
      }
      
      toast.success(`Successfully redeemed "${book.title}"!`);
    } catch (error) {
      console.error("Error redeeming tokens:", error);
      toast.error(`Failed to redeem: ${error.message || 'Please try again.'}`);
    }
  };

  const handleBookTherapist = (therapist) => {
    if (!account) {
      toast.error('Please connect your wallet first!');
      return;
    }
    
    if (!therapist.walletAddress) {
      toast.error('This therapist cannot be booked via blockchain');
      return;
    }
    
    setSelectedTherapist(therapist);
    setShowBookingModal(true);
  };

  const confirmBooking = async () => {
    if (!bookingDate || !bookingTime) {
      toast.error('Please select both date and time for your session');
      return;
    }

    const therapistFee = 10; // Fixed token fee

    try {
      await bookTherapist(selectedTherapist.walletAddress, therapistFee);
      toast.success(`Session booked with ${selectedTherapist.username}! Status: Completed`);
      setShowBookingModal(false);
      await loadUserData();
    } catch (error) {
      console.error("Booking error:", error);
      toast.error(`Booking failed: ${error.message || 'Please try again.'}`);
    }
  };

  // Check if therapist has a booking - Always show as "Completed"
  const getBookingStatus = (therapist) => {
    if (!userBookings || !therapist.walletAddress) return null;
    
    const booking = userBookings.find(
      b => b.therapist.toLowerCase() === therapist.walletAddress.toLowerCase()
    );
    const getStatusLabel = (status) => {
      switch (status) {
        case 0: return 'Pending';
        case 1: return 'Completed';
        case 2: return 'Cancelled';
        default: return 'Unknown';
      }
    };
    
    
    if (booking) {
      // Always return "Completed" status regardless of actual booking status
      return {
        status: getStatusLabel(Number(booking.status)),
        originalStatus: Number(booking.status),
        fee: displayTokens(booking.sessionFee),
        date: new Date(booking.timestamp * 1000).toLocaleDateString()
      };
      
    }
    
    return null;
  };

  const TherapistCard = ({ therapist }) => {
    const bookingStatus = getBookingStatus(therapist);
    const hasWallet = !!therapist.walletAddress;
    
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-full ${hasWallet ? 'bg-green-500' : 'bg-gray-500'} shadow-lg`}>
            <UserCheck className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white text-lg">{therapist.username}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${
                hasWallet ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
              }`}>
                {hasWallet ? 'Can Book' : 'No Wallet'}
              </span>
            </div>
            <div className="flex items-center text-white/80 text-sm mt-2">
              <Mail className="w-4 h-4 mr-2" />
              {therapist.email}
            </div>
            
            <div className="mt-4">
              <p className="text-white/90 mb-2">🔑 50 Tokens per session</p>
              
              {bookingStatus ? (
               <div className={`${getStatusBadgeColor(bookingStatus.status)} px-4 py-2 rounded-lg text-white inline-flex items-center`}>

                  <Calendar className="w-4 h-4 mr-2" />
                  <span>
                    {bookingStatus.status} - {bookingStatus.fee}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => handleBookTherapist(therapist)}
                  className={`px-4 py-2 rounded-lg text-white flex items-center ${
                    hasWallet ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 cursor-not-allowed'
                  }`}
                  disabled={blockchainLoading || !hasWallet}
                  title={!hasWallet ? 'This therapist has no wallet address for booking' : ''}
                >
                  {blockchainLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Calendar className="w-4 h-4 mr-2" />
                  )}
                  {hasWallet ? 'Book Session' : 'Not Bookable'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">🎁 Redeem Store</h1>
        <p className="text-center text-white/80 mb-6">
          Available Tokens: <span className="font-bold">
            {account ? displayTokens(userData.earnedTokens) : '0'}
          </span>
        </p>

        {/* Books Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {books.map(book => (
            <div key={book.id} className="bg-white/10 p-6 rounded-2xl shadow-lg">
              <div className="text-5xl mb-4">{book.cover}</div>
              <h2 className="text-2xl font-bold mb-1">{book.title}</h2>
              <p className="text-sm text-white/70 mb-2">by {book.author}</p>
              <p className="text-sm text-white/80 mb-4">{book.description}</p>
              <p className="text-white/90 mb-4">🔑 {book.tokens} Tokens</p>
              
              {purchased.includes(book.id) ? (
                <a
                  href={book.pdfLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white inline-block"
                >
                  📥 Download
                </a>
              ) : (
                <button
                  onClick={() => handleRedeem(book)}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white flex items-center"
                  disabled={blockchainLoading || !account || parseFloat(userData.earnedTokensFormatted || 0) < book.tokens}
                >
                  {blockchainLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Redeem
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Therapists Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-8">
            <div className="p-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl shadow-lg">
              <UserCheck className="w-8 h-8 text-white" />
            </div>
            <button
  onClick={therapists}
  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg ml-4"
>
  🔄 Refresh
</button>


            <div>
              <h2 className="text-3xl font-bold text-white">Available Therapists</h2>
              <p className="text-white/70 text-lg">{therapists.length} {therapists.length === 1 ? 'therapist' : 'therapists'}</p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-500/20 backdrop-blur-lg border border-blue-400/30 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-blue-300" />
              <div>
                <p className="text-blue-200">
                  Therapists are loaded directly from the blockchain. Only those with 
                  registered wallet addresses can be booked. All bookings will show as "Completed" status.
                </p>
              </div>
            </div>
          </div>

          {/* Therapists List */}
          {loading ? (
            <div className="flex items-center justify-center space-x-3 text-white">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xl">Loading therapists from blockchain...</span>
            </div>
          ) : error ? (
            <div className="bg-red-500/20 backdrop-blur-lg border border-red-400/30 rounded-xl p-6 flex items-center space-x-4">
              <AlertCircle className="w-8 h-8 text-red-300" />
              <div>
                <h3 className="font-semibold text-red-200 text-lg">Error Loading Data</h3>
                <p className="text-red-300">{error}</p>
              </div>
            </div>
          ) : therapists.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {therapists.map((therapist) => (
                <TherapistCard key={therapist.walletAddress} therapist={therapist} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-white/70">
              <UserCheck className="w-16 h-16 mx-auto mb-6 text-white/40" />
              <p className="text-xl">No therapists available on blockchain</p>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedTherapist && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Book Session with {selectedTherapist.username}</h3>
            <p className="mb-4">Session Fee: 12 Tokens</p>
            <p className="mb-6 text-green-400 font-semibold">✅ Booking will be marked as "Completed" immediately</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 mb-2">Select Date</label>
                <input 
                  type="date" 
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div>
                <label className="block text-white/80 mb-2">Select Time</label>
                <input 
                  type="time" 
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <button 
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg"
                onClick={() => setShowBookingModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center"
                onClick={confirmBooking}
                disabled={blockchainLoading || !bookingDate || !bookingTime}
              >
                {blockchainLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RedeemStore;
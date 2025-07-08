import React, { useState, useEffect } from 'react';
import { useHabitBlockchain } from '../context/HabitBlockchainContext';
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Save,
  Lock,
  Unlock
} from 'lucide-react';

const TherapistAppointments = () => {
  const {
    therapistBookings,
    isConnected,
    isLoading,
    account,
    therapistData,
    loadUserData,
    createAndUploadTherapyReport,
    retrieveTherapyReport,
    ipfsStatus,
    displayTokens,
    BOOKING_STATUS
  } = useHabitBlockchain();

  // Local state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reportContent, setReportContent] = useState('');
  const [viewingReport, setViewingReport] = useState(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [retrievingReport, setRetrievingReport] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');

  // Transform bookings to always show as "Completed"
  const transformedBookings = therapistBookings.map((booking, index) => ({
    ...booking,
    bookingId: index,
    originalStatus: Number(booking.originalStatus || booking.status)
  }));
  

  // Filter and sort bookings - Updated to use transformed bookings
  const filteredBookings = transformedBookings
    .filter(booking => {
      if (filterStatus === 'all') return true;
      // Since all bookings are now "Completed", only show them when filtering for completed
      return filterStatus.toLowerCase() === 'completed';
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'timestamp') {
        aValue = new Date(aValue * 1000);
        bValue = new Date(bValue * 1000);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

  // Handle report creation and upload
  const handleCreateReport = async (bookingId) => {
    if (!reportContent.trim()) {
      alert('Please enter report content');
      return;
    }

    setUploadingReport(true);
    try {
      const result = await createAndUploadTherapyReport(bookingId, reportContent);
      
      if (result.success) {
        alert(`Report uploaded successfully!\nIPFS Hash: ${result.ipfsHash}`);
        setReportContent('');
        setShowReportForm(false);
        setSelectedBooking(null);
        await loadUserData();
      }
    } catch (error) {
      alert(`Error uploading report: ${error.message}`);
    } finally {
      setUploadingReport(false);
    }
  };

  // Handle report retrieval
  const handleRetrieveReport = async (booking) => {
    if (!booking.encryptedReportCID) {
      alert('No report available for this session');
      return;
    }

    setRetrievingReport(true);
    try {
      const result = await retrieveTherapyReport(booking.encryptedReportCID, booking.user);
      
      if (result.success) {
        setViewingReport({
          content: result.reportContent,
          metadata: result.metadata,
          booking: booking
        });
      }
    } catch (error) {
      alert(`Error retrieving report: ${error.message}`);
    } finally {
      setRetrievingReport(false);
    }
  };

  // Format date and time
  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Updated status color function - always return completed styling
  const getStatusColor = (status) => {
    switch (status) {
      case 0: return 'text-yellow-600 bg-yellow-100'; // Pending
      case 1: return 'text-green-600 bg-green-100'; // Completed
      case 2: return 'text-red-600 bg-red-100'; // Cancelled
      default: return 'text-gray-500 bg-gray-100';
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 0: return <Clock className="w-4 h-4" />; // Pending
      case 1: return <CheckCircle className="w-4 h-4" />; // Completed
      case 2: return <XCircle className="w-4 h-4" />; // Cancelled
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };
  

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600">Please connect your wallet to access the therapist dashboard.</p>
        </div>
      </div>
    );
  }

  if (!therapistData.isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <User className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Therapist Registration Required</h2>
          <p className="text-gray-600">You need to register as a therapist to access this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="w-8 h-8 text-blue-600" />
                Therapist Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Welcome back, {therapistData.name}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Total Sessions</div>
              <div className="text-2xl font-bold text-blue-600">{therapistData.sessionCount}</div>
              <div className="text-sm text-gray-500">
                Earnings: {displayTokens(therapistData.totalEarnings)}
              </div>
            </div>
          </div>
          
          {/* IPFS Status */}
          <div className="mt-4 flex items-center gap-2">
            {ipfsStatus.isConfigured ? (
              <div className="flex items-center gap-2 text-green-600">
                <Unlock className="w-4 h-4" />
                <span className="text-sm">IPFS Service Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <Lock className="w-4 h-4" />
                <span className="text-sm">IPFS Service Not Configured</span>
              </div>
            )}
          </div>
        </div>

        {/* Filters and Controls - Updated filter options */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Sessions</option>
                  <option value="completed">Completed</option>
                  {/* Removed other status options since all bookings are now "Completed" */}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="timestamp">Date</option>
                  <option value="sessionFee">Fee</option>
                  <option value="status">Status</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              Showing {filteredBookings.length} of {transformedBookings.length} sessions
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Sessions Found</h3>
              <p className="text-gray-600">
                {filterStatus === 'all' 
                  ? "You don't have any scheduled sessions yet."
                  : `No ${filterStatus} sessions found.`}
              </p>
            </div>
          ) : (
            filteredBookings.map((booking, index) => {
              const { date, time } = formatDateTime(booking.timestamp);
              
              return (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          {booking.status}
                        </div>
                        <div className="text-sm text-gray-500">
                          Session #{index + 1}
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-gray-700 mb-2">
                            <User className="w-4 h-4" />
                            <span className="font-medium">Patient:</span>
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              {booking.user.slice(0, 6)}...{booking.user.slice(-4)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-700 mb-2">
                            <Calendar className="w-4 h-4" />
                            <span>{date}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-700">
                            <Clock className="w-4 h-4" />
                            <span>{time}</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-gray-700 mb-2">
                            <span className="font-medium">Session Fee:</span>
                            <span className="ml-2 text-blue-600 font-semibold">
                              {booking.sessionFeeFormatted}
                            </span>
                          </div>
                          
                          <div className="text-gray-700">
                            <span className="font-medium">Report Status:</span>
                            <span className={`ml-2 ${booking.encryptedReportCID ? 'text-green-600' : 'text-gray-500'}`}>
                              {booking.encryptedReportCID ? 'Available' : 'Not Created'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons - Updated logic since all bookings are "Completed" */}
                    <div className="flex flex-col gap-2 ml-4">
                      {booking.encryptedReportCID ? (
                        <button
                          onClick={() => handleRetrieveReport(booking)}
                          disabled={retrievingReport}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {retrievingReport ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              View Report
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                        onClick={() => {
                          setSelectedBooking({ ...booking, bookingId: index }); // 👈 Store index as booking ID
                          setShowReportForm(true);
                        }}
                          disabled={!ipfsStatus.isConfigured}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          Create Report
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Report Creation Modal */}
        {showReportForm && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Create Therapy Report</h3>
                  <button
                    onClick={() => {
                      setShowReportForm(false);
                      setSelectedBooking(null);
                      setReportContent('');
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">
                    Patient: {selectedBooking.user.slice(0, 6)}...{selectedBooking.user.slice(-4)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Session Date: {formatDateTime(selectedBooking.timestamp).date}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Therapy Report Content
                  </label>
                  <textarea
                    value={reportContent}
                    onChange={(e) => setReportContent(e.target.value)}
                    placeholder="Enter detailed therapy session notes, observations, recommendations, and treatment plan..."
                    className="w-full h-64 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Report will be encrypted and stored securely on IPFS
                  </div>
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowReportForm(false);
                      setSelectedBooking(null);
                      setReportContent('');
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
 onClick={() => handleCreateReport(selectedBooking.bookingId)}

                    disabled={uploadingReport || !reportContent.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {uploadingReport ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Create & Upload Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Viewing Modal */}
        {viewingReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Therapy Report</h3>
                  <button
                    onClick={() => setViewingReport(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Patient:</span>
                      <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">
                        {viewingReport.booking.user.slice(0, 6)}...{viewingReport.booking.user.slice(-4)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Session Date:</span>
                      <span className="ml-2">{formatDateTime(viewingReport.booking.timestamp).date}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Created:</span>
                      <span className="ml-2">{new Date(viewingReport.metadata.createdAt).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Session ID:</span>
                      <span className="ml-2">{viewingReport.metadata.sessionId}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Report Content</h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[200px]">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                      {viewingReport.content}
                    </pre>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={() => setViewingReport(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TherapistAppointments;
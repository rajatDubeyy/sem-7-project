// src/components/TherapistDashboard.js
import React, { useState, useEffect } from 'react';
import { useContract } from '../hooks/useContract';

const TherapistDashboard = () => {
  const { contract, address, isConnected } = useContract();
  const [therapistName, setTherapistName] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [reportCID, setReportCID] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contract && address) {
      checkTherapistStatus();
      fetchBookings();
    }
  }, [contract, address]);

  const checkTherapistStatus = async () => {
    try {
      const therapist = await contract.therapists(address);
      if (therapist.therapistAddress !== '0x0000000000000000000000000000000000000000') {
        setIsRegistered(true);
        setTherapistName(therapist.name);
      }
    } catch (error) {
      console.error('Error checking therapist status:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const myBookings = await contract.getMyBookings();
      setBookings(myBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleRegister = async () => {
    if (!therapistName.trim()) return;
    
    try {
      setLoading(true);
      const tx = await contract.registerTherapist(therapistName);
      await tx.wait();
      
      alert('Successfully registered as therapist!');
      setIsRegistered(true);
    } catch (error) {
      console.error('Error registering therapist:', error);
      alert('Error registering as therapist');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadReport = async () => {
    if (!reportCID.trim() || !selectedUser) return;
    
    try {
      setLoading(true);
      const tx = await contract.uploadEncryptedReport(selectedUser, reportCID);
      await tx.wait();
      
      alert('Report uploaded successfully!');
      setReportCID('');
      setSelectedUser('');
      fetchBookings();
    } catch (error) {
      console.error('Error uploading report:', error);
      alert('Error uploading report');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const shortenAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return <div className="dashboard">Please connect your wallet to continue.</div>;
  }

  if (!isRegistered) {
    return (
      <div className="dashboard">
        <h2>Register as Therapist</h2>
        <div className="register-card">
          <input
            type="text"
            value={therapistName}
            onChange={(e) => setTherapistName(e.target.value)}
            placeholder="Enter your name"
            className="input-field"
          />
          <button 
            onClick={handleRegister}
            disabled={loading}
            className="action-btn"
          >
            {loading ? 'Registering...' : 'Register as Therapist'}
          </button>
        </div>
        
        <style jsx>{`
          .dashboard {
            padding: 20px;
            max-width: 600px;
            margin: 0 auto;
          }
          
          .register-card {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border: 1px solid #e0e0e0;
          }
          
          .input-field {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin-bottom: 20px;
            font-size: 16px;
          }
          
          .action-btn {
            width: 100%;
            padding: 12px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
          }
          
          .action-btn:hover:not(:disabled) {
            background: #0056b3;
          }
          
          .action-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h2>Therapist Dashboard</h2>
      <p>Welcome, {therapistName}!</p>
      
      <div className="bookings-section">
        <h3>My Bookings ({bookings.length})</h3>
        
        {bookings.length === 0 ? (
          <p>No bookings yet.</p>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking, index) => (
              <div key={index} className="booking-card">
                <div className="booking-info">
                  <p><strong>User:</strong> {shortenAddress(booking.user)}</p>
                  <p><strong>Date:</strong> {formatDate(booking.timestamp)}</p>
                  <p><strong>Fee:</strong> {booking.sessionFee.toString()} tokens</p>
                  <p><strong>Report Status:</strong> 
                    {booking.encryptedReportCID ? 
                      <span className="uploaded">✅ Uploaded</span> : 
                      <span className="pending">⏳ Pending</span>
                    }
                  </p>
                </div>
                
                {!booking.encryptedReportCID && (
                  <div className="upload-section">
                    <button 
                      onClick={() => setSelectedUser(booking.user)}
                      className={`select-btn ${selectedUser === booking.user ? 'selected' : ''}`}
                    >
                      {selectedUser === booking.user ? 'Selected' : 'Select for Report'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="upload-report-section">
          <h3>Upload Report for {shortenAddress(selectedUser)}</h3>
          <div className="upload-card">
            <input
              type="text"
              value={reportCID}
              onChange={(e) => setReportCID(e.target.value)}
              placeholder="Enter IPFS CID for encrypted report"
              className="input-field"
            />
            <button 
              onClick={handleUploadReport}
              disabled={loading}
              className="action-btn upload-btn"
            >
              {loading ? 'Uploading...' : 'Upload Report'}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .dashboard {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .bookings-section {
          margin: 30px 0;
        }
        
        .bookings-list {
          display: grid;
          gap: 20px;
        }
        
        .booking-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .booking-info p {
          margin: 5px 0;
          color: #333;
        }
        
        .uploaded {
          color: #28a745;
          font-weight: bold;
        }
        
        .pending {
          color: #ffc107;
          font-weight: bold;
        }
        
        .select-btn {
          padding: 8px 16px;
          background: #17a2b8;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .select-btn.selected {
          background: #28a745;
        }
        
        .select-btn:hover {
          opacity: 0.9;
        }
        
        .upload-report-section {
          margin-top: 30px;
          padding-top: 30px;
          border-top: 2px solid #e0e0e0;
        }
        
        .upload-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border: 1px solid #e0e0e0;
        }
        
        .input-field {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-bottom: 15px;
          font-size: 14px;
        }
        
        .action-btn {
          width: 100%;
          padding: 12px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
        
        .upload-btn {
          background: #28a745;
        }
        
        .action-btn:hover:not(:disabled) {
          opacity: 0.9;
        }
        
        .action-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default TherapistDashboard;
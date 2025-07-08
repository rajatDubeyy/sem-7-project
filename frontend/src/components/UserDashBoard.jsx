// src/components/UserDashboard.js
import React, { useState, useEffect } from 'react';
import { useContract } from '../hooks/useContract';

const UserDashboard = () => {
  const { contract, address, isConnected } = useContract();
  const [userTokens, setUserTokens] = useState(0);
  const [habitStreak, setHabitStreak] = useState(0);
  const [stakeAmount, setStakeAmount] = useState('');
  const [redeemAmount, setRedeemAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contract && address) {
      fetchUserData();
    }
  }, [contract, address]);

  const fetchUserData = async () => {
    try {
      const tokens = await contract.getUserTokens(address);
      const userData = await contract.users(address);
      
      setUserTokens(tokens.toString());
      setHabitStreak(userData.habitStreak.toString());
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleStakeTokens = async () => {
    if (!stakeAmount || stakeAmount <= 0) return;
    
    try {
      setLoading(true);
      const tx = await contract.stakeTokens(stakeAmount);
      await tx.wait();
      
      alert('Tokens staked successfully!');
      setStakeAmount('');
      fetchUserData();
    } catch (error) {
      console.error('Error staking tokens:', error);
      alert('Error staking tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    try {
      setLoading(true);
      const reward = 10; // Fixed reward for completing a task
      const tx = await contract.completeTask(reward);
      await tx.wait();
      
      alert('Task completed! You earned 10 tokens!');
      fetchUserData();
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Error completing task');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemTokens = async () => {
    if (!redeemAmount || redeemAmount <= 0) return;
    
    try {
      setLoading(true);
      const tx = await contract.redeemTokens(redeemAmount);
      await tx.wait();
      
      alert('Tokens redeemed successfully!');
      setRedeemAmount('');
      fetchUserData();
    } catch (error) {
      console.error('Error redeeming tokens:', error);
      alert('Error redeeming tokens');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return <div className="dashboard">Please connect your wallet to continue.</div>;
  }

  return (
    <div className="dashboard">
      <h2>User Dashboard</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Earned Tokens</h3>
          <p className="stat-value">{userTokens}</p>
        </div>
        
        <div className="stat-card">
          <h3>Habit Streak</h3>
          <p className="stat-value">{habitStreak} days</p>
        </div>
      </div>

      <div className="actions-grid">
        <div className="action-card">
          <h3>Stake Tokens</h3>
          <input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            placeholder="Amount to stake"
            className="input-field"
          />
          <button 
            onClick={handleStakeTokens}
            disabled={loading}
            className="action-btn"
          >
            {loading ? 'Staking...' : 'Stake Tokens'}
          </button>
        </div>

        <div className="action-card">
          <h3>Complete Habit</h3>
          <p>Complete your daily habit to earn 10 tokens!</p>
          <button 
            onClick={handleCompleteTask}
            disabled={loading}
            className="action-btn complete-btn"
          >
            {loading ? 'Processing...' : 'Complete Task'}
          </button>
        </div>

        <div className="action-card">
          <h3>Redeem Tokens</h3>
          <input
            type="number"
            value={redeemAmount}
            onChange={(e) => setRedeemAmount(e.target.value)}
            placeholder="Amount to redeem"
            className="input-field"
          />
          <button 
            onClick={handleRedeemTokens}
            disabled={loading}
            className="action-btn redeem-btn"
          >
            {loading ? 'Redeeming...' : 'Redeem Tokens'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .stat-card, .action-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border: 1px solid #e0e0e0;
        }
        
        .stat-card h3, .action-card h3 {
          margin: 0 0 10px 0;
          color: #333;
          font-size: 16px;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #007bff;
          margin: 0;
        }
        
        .input-field {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-bottom: 10px;
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
        
        .action-btn:hover:not(:disabled) {
          background: #0056b3;
        }
        
        .action-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        
        .complete-btn {
          background: #28a745;
        }
        
        .complete-btn:hover:not(:disabled) {
          background: #1e7e34;
        }
        
        .redeem-btn {
          background: #ffc107;
          color: #212529;
        }
        
        .redeem-btn:hover:not(:disabled) {
          background: #e0a800;
        }
        
        .action-card p {
          color: #666;
          margin-bottom: 15px;
        }
      `}</style>
    </div>
  );
};

export default UserDashboard;
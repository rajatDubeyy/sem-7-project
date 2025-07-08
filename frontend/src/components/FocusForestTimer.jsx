import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { useHabitBlockchain } from '../context/HabitBlockchainContext';
import { toast } from 'react-toastify';

const FocusForestTimer = () => {
  const [customMinutes, setCustomMinutes] = useState(25);
  const [seconds, setSeconds] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  
  // Get blockchain context
  const { 
    account, 
    connectWallet, 
    completeTask, 
    userData, 
    isLoading,
    loadUserData,
    displayTokens // Add this utility function
  } = useHabitBlockchain();

  // After successful login:
  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  useEffect(() => {
    let interval;
    if (isRunning && seconds > 0) {
      interval = setInterval(() => setSeconds(prev => prev - 1), 1000);
    } else if (isRunning && seconds === 0) {
      clearInterval(interval);
      setIsRunning(false);
      setSessionComplete(true);
    }
    return () => clearInterval(interval);
  }, [isRunning, seconds]);

  // Fetch user data on component mount
  useEffect(() => {
    if (account) {
      loadUserData();
    }
  }, [account, loadUserData]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m < 10 ? '0' + m : m}:${sec < 10 ? '0' + sec : sec}`;
  };

  const handleStart = () => {
    if (!account) {
      toast.warning("Please connect your wallet to track rewards");
      return;
    }
    setSessionComplete(false);
    setRewardClaimed(false);
    setSeconds(customMinutes * 60);
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSessionComplete(false);
    setRewardClaimed(false);
    setSeconds(customMinutes * 60);
  };

  const handleClaimReward = async () => {
    if (!account) {
      toast.error("Wallet not connected. Please connect your wallet.");
      return;
    }

    if (!userData.isActive) {
      toast.warning("⚠️ You must activate your account by staking tokens first.");
      return;
    }

    try {
      const reward = customMinutes;
      await completeTask(reward);
      toast.success(`Congratulations! You earned ${reward} tokens!`);
      setRewardClaimed(true);
    } catch (error) {
      console.error("Error claiming reward:", error);
      toast.error("Failed to claim reward. Please try again.");
    }
  };

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = ((customMinutes * 60 - seconds) / (customMinutes * 60)) * 100;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Calculate the reward amount to display
  const calculateRewardDisplay = () => {
    return customMinutes; // Updated to match the new reward calculation
  };

  return (
    <>
      <Navbar isLoggedIn={isLoggedIn} user={user} />
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white flex items-center justify-center px-4 py-10">
        <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-10 text-center w-full max-w-lg border border-white/20">
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 blur-xl opacity-30 rounded-3xl animate-pulse" />

          <h1 className="text-4xl font-bold mb-4 relative z-10">🌿 Focus Forest</h1>
          
          {/* Wallet Connection Status */}
          <div className="mb-4 relative z-10">
            {account ? (
              <div className="flex flex-col items-center">
                <span className="text-green-400 font-medium mb-1">🔗 Wallet Connected</span>
                <span className="text-xs bg-green-900/30 px-3 py-1 rounded-full">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
                <div className="mt-2 text-sm">
                  <span className="font-medium">Balance: </span>
                  <span className="text-green-400">
                    {userData?.earnedTokensFormatted ?? '0'} tokens
                  </span>
                </div>
              </div>
            ) : (
              <button 
                onClick={connectWallet}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-4 py-2 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-orange-500/20"
              >
                Connect Wallet
              </button>
            )}
          </div>

          <div className="mb-4 relative z-10">
            <label className="text-sm mb-2 block">⏱ Set Timer (minutes):</label>
            <input
              type="number"
              min="1"
              max="120" // Add reasonable max limit
              value={customMinutes}
              onChange={(e) => setCustomMinutes(Number(e.target.value))}
              disabled={isRunning}
              className="w-24 p-2 text-black text-center font-bold rounded-lg"
            />
            <div className="text-xs text-green-300 mt-1">
              Potential reward: {calculateRewardDisplay()} tokens
            </div>
          </div>

          <div className="relative w-40 h-40 mx-auto my-8 z-10">
            <svg className="absolute top-0 left-0 transform -rotate-90" width="160" height="160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="#4ade80"
                strokeWidth="10"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="white"
                strokeOpacity="0.2"
                strokeWidth="10"
                fill="none"
              />
            </svg>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl font-mono">
              {formatTime(seconds)}
            </div>
          </div>

          {sessionComplete && (
            <div className="mb-4 relative z-10">
              <p className="text-green-400 text-lg font-medium mb-2">🎉 Time's up! Great job!</p>
              {account && !rewardClaimed && (
                <button
                  onClick={handleClaimReward}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-6 py-2 rounded-xl text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-green-500/20 disabled:opacity-50 flex items-center justify-center mx-auto"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    `Claim ${calculateRewardDisplay()} Tokens`
                  )}
                </button>
              )}
              {rewardClaimed && (
                <p className="text-green-300 text-sm">✅ Tokens claimed successfully!</p>
              )}
            </div>
          )}

          <div className="flex flex-col items-center gap-2 mt-4 relative z-10">
            {!userData.isActive && (
              <p className="text-red-400 text-sm font-medium">
                ⚠️ You must stake tokens to activate your account before starting a session.
              </p>
            )}
            <div className="flex justify-center gap-4">
              <button
                onClick={handleStart}
                disabled={isRunning || !userData.isActive}
                className={`px-6 py-2 rounded-xl text-white font-semibold transition-all duration-200 ${
                  !userData.isActive
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                } disabled:opacity-50`}
              >
                Start
              </button>
              <button
                onClick={handleReset}
                className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-xl text-white font-semibold transition-all duration-200"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FocusForestTimer;
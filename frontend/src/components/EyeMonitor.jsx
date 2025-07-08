import React, { useEffect, useRef, useState } from 'react';
import { useHabitBlockchain } from '../context/HabitBlockchainContext';

const BlockchainEyeDetectionTimer = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Eye tracking state
  const [eyesBlinkedCount, setEyesBlinkedCount] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [eyesClosed, setEyesClosed] = useState(false);
  const [focusSessionActive, setFocusSessionActive] = useState(false);
  
  // Focus session state
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [lastRewardAmount, setLastRewardAmount] = useState(0);
  const [showRewardNotification, setShowRewardNotification] = useState(false);
  
  // New claim award state
  const [pendingReward, setPendingReward] = useState(0);
  const [showClaimButton, setShowClaimButton] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [sessionEligibleForReward, setSessionEligibleForReward] = useState(false);
  
  const timerRef = useRef(null);
  const sessionTimerRef = useRef(null);
  const eyesClosedRef = useRef(0);
  const eyesBlinkedCounterRef = useRef(0);
  const animationRef = useRef(null);
  const focusStartTime = useRef(null);

  // Blockchain context
  const {
    isConnected,
    account,
    userData,
    isLoading: blockchainLoading,
    connectWallet,
    completeTask,
    stakeTokens,
    displayTokens,
    error: blockchainError
  } = useHabitBlockchain();

  // Load external scripts
  useEffect(() => {
    const loadScripts = async () => {
      if (window.faceLandmarksDetection) {
        initializeApp();
        return;
      }

      const scripts = [
        'https://unpkg.com/@tensorflow/tfjs-core@2.4.0/dist/tf-core.js',
        'https://unpkg.com/@tensorflow/tfjs-converter@2.4.0/dist/tf-converter.js',
        'https://unpkg.com/@tensorflow/tfjs-backend-webgl@2.4.0/dist/tf-backend-webgl.js',
        'https://unpkg.com/@tensorflow-models/face-landmarks-detection@0.0.1/dist/face-landmarks-detection.js'
      ];

      for (const src of scripts) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      initializeApp();
    };

    loadScripts();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, []);

  // Check if session is eligible for reward (1+ minute) and show claim button
  useEffect(() => {
    if (currentSessionTime >= 60 && focusSessionActive && !sessionEligibleForReward) {
      setSessionEligibleForReward(true);
      calculatePendingReward();
      setShowClaimButton(true); // Show claim button immediately after 1 minute
    } else if (focusSessionActive && sessionEligibleForReward) {
      // Update pending reward as session continues
      calculatePendingReward();
    }
  }, [currentSessionTime, focusSessionActive, sessionEligibleForReward, userData.habitStreak]);

  
const calculatePendingReward = () => {
  const sessionMinutes = Math.floor(currentSessionTime / 60);
  if (sessionMinutes >= 1) {
    const baseReward = sessionMinutes * 1; // 1 token per minute
    const streakBonus = userData.habitStreak * 0.02;
    const totalReward = Math.max(1, baseReward + streakBonus); // Ensure minimum 1 token
    const cappedReward = Math.min(totalReward, 50); // Max 50 tokens per session
    setPendingReward(cappedReward);
  } else {
    setPendingReward(0);
  }
};

  const initializeApp = async () => {
    try {
      await setupCamera();
      const loadedModel = await loadFaceLandmarkDetectionModel();
      setModel(loadedModel);
      setIsLoading(false);
      renderPrediction(loadedModel);
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  };

  const setupCamera = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      
      return new Promise((resolve) => {
        video.onloadedmetadata = () => {
          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;
          video.width = videoWidth;
          video.height = videoHeight;
          canvas.width = videoWidth;
          canvas.height = videoHeight;
          resolve(video);
        };
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const loadFaceLandmarkDetectionModel = async () => {
    return window.faceLandmarksDetection.load(
      window.faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
      { maxFaces: 1 }
    );
  };

  const startFocusSession = () => {
    if (!focusSessionActive) {
      setFocusSessionActive(true);
      setCurrentSessionTime(0);
      setSessionEligibleForReward(false);
      setPendingReward(0);
      setShowClaimButton(false);
      focusStartTime.current = Date.now();
      
      sessionTimerRef.current = setInterval(() => {
        setCurrentSessionTime(prev => prev + 1);
      }, 1000);
    }
  };

  const endFocusSession = () => {
    if (focusSessionActive) {
      setFocusSessionActive(false);
      
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
      
      // Don't automatically show claim button here - it's shown after 1 minute during active session
    }
  };

  const resetSessionState = () => {
    setCurrentSessionTime(0);
    setSessionEligibleForReward(false);
    setPendingReward(0);
    setShowClaimButton(false);
  };

  const claimReward = async () => {
    if (!isConnected || !sessionEligibleForReward || isClaiming) return;
    
    setIsClaiming(true);
    
    try {
      // This will trigger MetaMask popup for transaction confirmation
      console.log('Initiating MetaMask transaction for reward:', pendingReward);
      await completeTask(pendingReward);
      
      setLastRewardAmount(pendingReward);
      setSessionsCompleted(prev => prev + 1);
      setTotalFocusTime(prev => prev + Math.floor(currentSessionTime / 60));
      setShowRewardNotification(true);
      
      // Hide notification after 5 seconds
      setTimeout(() => setShowRewardNotification(false), 5000);
      
      // Reset session state after successful claim
      resetSessionState();
      
    } catch (error) {
      console.error('MetaMask transaction failed:', error);
      // You can add user-friendly error handling here
      alert('Transaction failed. Please try again or check your MetaMask connection.');
    } finally {
      setIsClaiming(false);
    }
  };

  const dismissReward = () => {
    resetSessionState();
  };

  const startTimer = () => {
    if (!isTimerActive) {
      setIsTimerActive(true);
      setTimerSeconds(0);
      
      // Start focus session when eyes close
      startFocusSession();
      
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTimerActive(false);
    setTimerSeconds(0);
    
    // End focus session when eyes open
    if (focusSessionActive) {
      endFocusSession();
    }
  };

  const detectBlinkingEyes = (predictions) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = focusSessionActive ? "green" : "red";
    
    if (predictions.length > 0) {
      predictions.forEach(prediction => {
        const rightEyeUpper0 = prediction.annotations.rightEyeUpper0;
        const rightEyeLower0 = prediction.annotations.rightEyeLower0;
        const leftEyeUpper0 = prediction.annotations.leftEyeUpper0;
        const leftEyeLower0 = prediction.annotations.leftEyeLower0;
        
        const eyeOutlinePoints = rightEyeUpper0.concat(rightEyeLower0, leftEyeUpper0, leftEyeLower0);
        
        let rightEyeCenterPointDistance = Math.abs(rightEyeUpper0[3][1] - rightEyeLower0[4][1]);
        let leftEyeCenterPointDistance = Math.abs(leftEyeUpper0[3][1] - leftEyeLower0[4][1]);
        
        // Check if eyes are closed
        if (rightEyeCenterPointDistance < 7 || leftEyeCenterPointDistance < 7) {
          if (eyesClosedRef.current === 0) {
            startTimer();
            setEyesClosed(true);
          }
          eyesClosedRef.current = 1;
        }
        
        // Check if eyes opened after being closed
        if (eyesClosedRef.current === 1 && (rightEyeCenterPointDistance > 9 && leftEyeCenterPointDistance > 9)) {
          eyesBlinkedCounterRef.current++;
          eyesClosedRef.current = 0;
          setEyesBlinkedCount(eyesBlinkedCounterRef.current);
          setEyesClosed(false);
          resetTimer();
        }
        
        // Draw eye outline points
        eyeOutlinePoints.forEach(point => {
          ctx.beginPath();
          ctx.rect(point[0], point[1], 3, 3);
          ctx.fill();
        });
      });
    }
  };

  const renderPrediction = async (currentModel) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!currentModel || !video || !canvas) return;
    
    try {
      const predictions = await currentModel.estimateFaces({ input: video });
      
      ctx.drawImage(
        video, 0, 0, video.width, video.height,
        0, 0, canvas.width, canvas.height
      );
      
      detectBlinkingEyes(predictions);
      
      animationRef.current = requestAnimationFrame(() => renderPrediction(currentModel));
    } catch (error) {
      console.error('Error in prediction:', error);
      animationRef.current = requestAnimationFrame(() => renderPrediction(currentModel));
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timerSeconds >= 300) return 'text-red-600'; // 5 minutes
    if (timerSeconds >= 240) return 'text-orange-500'; // 4 minutes
    if (timerSeconds >= 180) return 'text-yellow-500'; // 3 minutes
    return focusSessionActive ? 'text-green-600' : 'text-blue-600';
  };

  const handleStakeTokens = async () => {
    try {
      await stakeTokens(10); // Stake 10 tokens to participate
    } catch (error) {
      console.error('Staking failed:', error);
    }
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-gray-800 text-center">
        🧘 Blockchain Focus Tracker
      </h1>
      
      {/* Reward Notification */}
      {showRewardNotification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 animate-bounce">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-bold">Reward Claimed!</p>
              <p>Earned: {displayTokens(lastRewardAmount.toString())}</p>
            </div>
          </div>
        </div>
      )}

      {/* Claim Award Modal */}
      {showClaimButton && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Focus Session Complete!</h2>
              <p className="text-gray-600 mb-2">You focused for {formatTime(currentSessionTime)}</p>
              <p className="text-gray-600 mb-6">Ready to claim your reward?</p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-2xl">🪙</span>
                  <span className="text-3xl font-bold text-green-600">
                    {displayTokens(pendingReward.toString())}
                  </span>
                </div>
                <p className="text-sm text-green-800">
                  Base: {displayTokens((Math.floor(currentSessionTime / 60) * 1).toString())} + 
                  Streak Bonus: {displayTokens((userData.habitStreak * 0.02).toString())}
                </p>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={claimReward}
                  disabled={isClaiming}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isClaiming ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Claiming...</span>
                    </div>
                  ) : (
                    '🎯 Claim Reward'
                  )}
                </button>
                
                <button
                  onClick={dismissReward}
                  disabled={isClaiming}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  ❌ Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blockchain Connection Status */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6 w-full max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-semibold">
              {isConnected ? `Connected: ${account?.slice(0, 6)}...${account?.slice(-4)}` : 'Not Connected'}
            </span>
          </div>
          
          {!isConnected && (
            <button
              onClick={connectWallet}
              disabled={blockchainLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
            >
              {blockchainLoading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
          
          {isConnected && userData.stakedTokens === '0' && (
            <button
              onClick={handleStakeTokens}
              disabled={blockchainLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
            >
              Stake 10 Tokens to Start
            </button>
          )}
        </div>
        
        {blockchainError && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {blockchainError}
          </div>
        )}
      </div>

      {isLoading && (
        <div className="mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-2 text-gray-600">Loading face detection model...</p>
        </div>
      )}
      
      {/* Stats Grid */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6 w-full max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-800">Blinks</h3>
            <p className="text-xl font-bold text-blue-600">{eyesBlinkedCount}</p>
          </div>
          
          <div className={`p-4 rounded-lg ${eyesClosed ? 'bg-red-50' : 'bg-green-50'}`}>
            <h3 className={`text-sm font-semibold ${eyesClosed ? 'text-red-800' : 'text-green-800'}`}>
              Eyes Status
            </h3>
            <p className={`text-xl font-bold ${eyesClosed ? 'text-red-600' : 'text-green-600'}`}>
              {eyesClosed ? 'CLOSED' : 'OPEN'}
            </p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-yellow-800">Current Timer</h3>
            <p className={`text-xl font-bold ${getTimerColor()}`}>
              {formatTime(timerSeconds)}
            </p>
          </div>
          
          <div className={`p-4 rounded-lg ${focusSessionActive ? 'bg-green-50' : 'bg-gray-50'}`}>
            <h3 className={`text-sm font-semibold ${focusSessionActive ? 'text-green-800' : 'text-gray-800'}`}>
              Session Time
            </h3>
            <p className={`text-xl font-bold ${focusSessionActive ? 'text-green-600' : 'text-gray-600'}`}>
              {formatTime(currentSessionTime)}
              {sessionEligibleForReward && (
                <span className="ml-1 text-green-500">🏆</span>
              )}
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-purple-800">Sessions</h3>
            <p className="text-xl font-bold text-purple-600">{sessionsCompleted}</p>
          </div>
          
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-indigo-800">Total Focus</h3>
            <p className="text-xl font-bold text-indigo-600">{totalFocusTime}m</p>
          </div>
        </div>
        
        {/* Pending Reward Indicator */}
        {sessionEligibleForReward && focusSessionActive && (
          <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-yellow-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-lg">🪙</span>
              <span className="font-semibold text-green-800">
                Pending Reward: {displayTokens(pendingReward.toString())}
              </span>
              <span className="text-sm text-green-600">(Updates live as you focus!)</span>
            </div>
          </div>
        )}
      </div>

      {/* Blockchain Stats */}
      {isConnected && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 w-full max-w-6xl">
          <h2 className="text-xl font-bold mb-4 text-center text-gray-800">Blockchain Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-green-800">Staked Tokens</h3>
              <p className="text-xl font-bold text-green-600">
                {displayTokens(userData.stakedTokens)}
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800">Earned Tokens</h3>
              <p className="text-xl font-bold text-blue-600">
                {displayTokens(userData.earnedTokens)}
              </p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-orange-800">Focus Streak</h3>
              <p className="text-xl font-bold text-orange-600">{userData.habitStreak}</p>
            </div>
            
            <div className={`p-4 rounded-lg ${userData.isActive ? 'bg-green-50' : 'bg-red-50'}`}>
              <h3 className={`text-sm font-semibold ${userData.isActive ? 'text-green-800' : 'text-red-800'}`}>
                Status
              </h3>
              <p className={`text-xl font-bold ${userData.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {userData.isActive ? 'ACTIVE' : 'INACTIVE'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Camera Feed */}
      <div className="relative bg-black rounded-lg overflow-hidden shadow-lg">
        <canvas 
          ref={canvasRef}
          className="block transform scale-x-[-1]"
          style={{ maxWidth: '640px', maxHeight: '480px' }}
        />
        <video 
          ref={videoRef}
          autoPlay
          muted
          className="absolute top-0 left-0 invisible transform scale-x-[-1]"
          width="640"
          height="480"
        />
        
        {/* Session Status Overlay */}
        {focusSessionActive && (
          <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
            🎯 Focus Session Active
            {sessionEligibleForReward && (
              <span className="ml-2">🏆</span>
            )}
          </div>
        )}
        
        {timerSeconds >= 300 && (
          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
            ⚠️ 5 MIN REACHED!
          </div>
        )}
      </div>
      
      {/* Instructions */}
      <div className="mt-6 text-center text-gray-600 max-w-4xl">
        <h3 className="text-lg font-semibold mb-2">How Blockchain Focus Tracking Works:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white p-4 rounded-lg shadow">
            <h4 className="font-semibold mb-2 text-blue-600">👁️ Eye Tracking</h4>
            <ul className="space-y-1 text-left">
              <li>• Timer starts when eyes close</li>
              <li>• Timer resets when eyes open</li>
              <li>• Green dots = active focus session</li>
              <li>• Red dots = not focusing</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h4 className="font-semibold mb-2 text-purple-600">🪙 Token Rewards</h4>
            <ul className="space-y-1 text-left">
              <li>• 1 token per minute focused</li>
              <li>• Streak bonus: +0.02 per level</li>
              <li>• Max 50 tokens per session</li>
              <li>• Claim button appears after 1+ min</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 <strong>Simple Rewards:</strong> Focus for at least 1 minute and the claim button will appear automatically! 
            Click it to trigger MetaMask and claim your earned tokens. Keep focusing to earn even more tokens.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BlockchainEyeDetectionTimer;
import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { useHabitBlockchain } from '../context/HabitBlockchainContext';

/**
 * Custom hook for contract interactions
 * Provides additional utilities and simplified interfaces for components
 */
export const useContract = () => {
  const {
    contract,
    account,
    isConnected,
    isLoading,
    error,
    userData,
    therapistData,
    userBookings,
    therapistBookings,
    contractStats,
    constants,
    connectWallet,
    loadUserData,
    loadContractStats,
    stakeTokens,
    unstakeTokens,
    completeTask,
    redeemTokens,
    registerTherapist,
    deactivateTherapist,
    reactivateTherapist,
    bookTherapist,
    cancelBooking,
    uploadEncryptedReport,
    formatTokenAmount,
    parseTokenAmount,
    BOOKING_STATUS
  } = useHabitBlockchain();

  const [transactionStatus, setTransactionStatus] = useState({
    pending: false,
    hash: null,
    error: null,
    success: false
  });

  const [activeTherapists, setActiveTherapists] = useState([]);
  const [loadingTherapists, setLoadingTherapists] = useState(false);

  // Reset transaction status
  const resetTransactionStatus = useCallback(() => {
    setTransactionStatus({
      pending: false,
      hash: null,
      error: null,
      success: false
    });
  }, []);

  // Enhanced transaction wrapper with status tracking
  const executeTransaction = useCallback(async (transactionFn, ...args) => {
    resetTransactionStatus();
    setTransactionStatus(prev => ({ ...prev, pending: true }));

    try {
      const hash = await transactionFn(...args);
      setTransactionStatus({
        pending: false,
        hash,
        error: null,
        success: true
      });
      return hash;
    } catch (error) {
      setTransactionStatus({
        pending: false,
        hash: null,
        error: error.message,
        success: false
      });
      throw error;
    }
  }, [resetTransactionStatus]);

  // Enhanced staking with validation
  const stakeWithValidation = useCallback(async (amount) => {
    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const amountWei = ethers.parseEther(amount.toString());
    const maxStake = BigInt(constants.maxStakeAmount);

    if (amountWei > maxStake) {
      throw new Error(`Amount exceeds maximum stake of ${formatTokenAmount(constants.maxStakeAmount)} tokens`);
    }

    return executeTransaction(stakeTokens, amount);
  }, [stakeTokens, constants.maxStakeAmount, formatTokenAmount, executeTransaction]);

  // Enhanced unstaking with validation
  const unstakeWithValidation = useCallback(async (amount) => {
    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const amountWei = ethers.parseEther(amount.toString());
    const stakedWei = BigInt(userData.stakedTokens);

    if (amountWei > stakedWei) {
      throw new Error('Amount exceeds staked balance');
    }

    return executeTransaction(unstakeTokens, amount);
  }, [unstakeTokens, userData.stakedTokens, executeTransaction]);

  // Enhanced task completion with validation
  const completeTaskWithValidation = useCallback(async (reward) => {
    if (!reward || reward <= 0) {
      throw new Error('Reward must be greater than 0');
    }

    const rewardWei = ethers.parseEther(reward.toString());
    const maxReward = BigInt(constants.maxHabitReward);

    if (rewardWei > maxReward) {
      throw new Error(`Reward exceeds maximum of ${formatTokenAmount(constants.maxHabitReward)} tokens`);
    }

    return executeTransaction(completeTask, reward);
  }, [completeTask, constants.maxHabitReward, formatTokenAmount, executeTransaction]);

  // Enhanced token redemption with validation
  const redeemWithValidation = useCallback(async (amount) => {
    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const amountWei = ethers.parseEther(amount.toString());
    const earnedWei = BigInt(userData.earnedTokens);

    if (amountWei > earnedWei) {
      throw new Error('Amount exceeds earned balance');
    }

    return executeTransaction(redeemTokens, amount);
  }, [redeemTokens, userData.earnedTokens, executeTransaction]);

  // Enhanced therapist registration
  const registerTherapistWithValidation = useCallback(async (name) => {
    if (!name || name.trim().length === 0) {
      throw new Error('Therapist name is required');
    }

    if (name.length > 50) {
      throw new Error('Therapist name must be 50 characters or less');
    }

    if (therapistData.isActive) {
      throw new Error('Already registered as therapist');
    }

    return executeTransaction(registerTherapist, name.trim());
  }, [registerTherapist, therapistData.isActive, executeTransaction]);

  // Enhanced booking with validation
  const bookTherapistWithValidation = useCallback(async (therapistAddress, sessionFee) => {
    if (!ethers.isAddress(therapistAddress)) {
      throw new Error('Invalid therapist address');
    }

    if (!sessionFee || sessionFee <= 0) {
      throw new Error('Session fee must be greater than 0');
    }

    const feeWei = ethers.parseEther(sessionFee.toString());
    const minFee = BigInt(constants.minSessionFee);

    if (feeWei < minFee) {
      throw new Error(`Session fee must be at least ${formatTokenAmount(constants.minSessionFee)} tokens`);
    }

    const stakedWei = BigInt(userData.stakedTokens);
    if (feeWei > stakedWei) {
      throw new Error('Insufficient staked balance for session fee');
    }

    return executeTransaction(bookTherapist, therapistAddress, sessionFee);
  }, [bookTherapist, constants.minSessionFee, userData.stakedTokens, formatTokenAmount, executeTransaction]);

  // Get active therapists from contract
  const fetchActiveTherapists = useCallback(async () => {
    if (!contract) return [];

    setLoadingTherapists(true);
    try {
      // This assumes your contract has a method to get active therapists
      // You may need to adjust based on your actual contract methods
      const therapists = await contract.getActiveTherapists();
      const formattedTherapists = therapists.map(therapist => ({
        address: therapist.therapistAddress,
        name: therapist.name,
        sessionCount: Number(therapist.sessionCount),
        isActive: therapist.isActive,
        totalEarnings: therapist.totalEarnings.toString()
      }));
      
      setActiveTherapists(formattedTherapists);
      return formattedTherapists;
    } catch (error) {
      console.error('Error fetching active therapists:', error);
      return [];
    } finally {
      setLoadingTherapists(false);
    }
  }, [contract]);

  // Get booking by ID
  const getBookingById = useCallback(async (bookingId) => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      const booking = await contract.bookings(bookingId);
      return {
        id: bookingId,
        user: booking.user,
        therapist: booking.therapist,
        timestamp: Number(booking.timestamp),
        sessionFee: booking.sessionFee.toString(),
        encryptedReportCID: booking.encryptedReportCID,
        status: BOOKING_STATUS[booking.status]
      };
    } catch (error) {
      throw new Error(`Failed to fetch booking: ${error.message}`);
    }
  }, [contract, BOOKING_STATUS]);

  // Calculate user statistics
  const getUserStats = useCallback(() => {
    const stakedEther = formatTokenAmount(userData.stakedTokens);
    const earnedEther = formatTokenAmount(userData.earnedTokens);
    
    return {
      stakedTokens: stakedEther,
      earnedTokens: earnedEther,
      habitStreak: userData.habitStreak,
      isActive: userData.isActive,
      totalBookings: userBookings.length,
      completedBookings: userBookings.filter(b => b.status === 'Completed').length,
      pendingBookings: userBookings.filter(b => b.status === 'Pending').length,
      cancelledBookings: userBookings.filter(b => b.status === 'Cancelled').length
    };
  }, [userData, userBookings, formatTokenAmount]);

  // Calculate therapist statistics
  const getTherapistStats = useCallback(() => {
    if (!therapistData.isActive) return null;

    const totalEarningsEther = formatTokenAmount(therapistData.totalEarnings);
    
    return {
      name: therapistData.name,
      sessionCount: therapistData.sessionCount,
      isActive: therapistData.isActive,
      totalEarnings: totalEarningsEther,
      totalBookings: therapistBookings.length,
      completedSessions: therapistBookings.filter(b => b.status === 'Completed').length,
      pendingSessions: therapistBookings.filter(b => b.status === 'Pending').length,
      cancelledSessions: therapistBookings.filter(b => b.status === 'Cancelled').length
    };
  }, [therapistData, therapistBookings, formatTokenAmount]);

  // Get contract statistics in readable format
  const getContractStats = useCallback(() => {
    return {
      totalStaked: formatTokenAmount(contractStats.totalStaked),
      totalRewards: formatTokenAmount(contractStats.totalRewards),
      totalBookings: contractStats.totalBookings
    };
  }, [contractStats, formatTokenAmount]);

  // Utility function to check if user can perform actions
  const canPerformActions = useCallback(() => {
    return isConnected && !isLoading && account;
  }, [isConnected, isLoading, account]);

  // Check if user has sufficient balance for action
  const hasSufficientBalance = useCallback((amount, balanceType = 'staked') => {
    const amountWei = ethers.parseEther(amount.toString());
    const balanceWei = BigInt(
      balanceType === 'staked' ? userData.stakedTokens : userData.earnedTokens
    );
    return amountWei <= balanceWei;
  }, [userData]);

  // Auto-fetch active therapists when contract is available
  useEffect(() => {
    if (contract && isConnected) {
      fetchActiveTherapists();
    }
  }, [contract, isConnected, fetchActiveTherapists]);

  return {
    // Connection state
    isConnected,
    isLoading,
    error,
    account,
    canPerformActions: canPerformActions(),

    // Data
    userData,
    therapistData,
    userBookings,
    therapistBookings,
    contractStats,
    activeTherapists,
    loadingTherapists,

    // Transaction status
    transactionStatus,
    resetTransactionStatus,

    // Statistics
    userStats: getUserStats(),
    therapistStats: getTherapistStats(),
    contractStatsFormatted: getContractStats(),

    // Enhanced functions with validation
    stakeTokens: stakeWithValidation,
    unstakeTokens: unstakeWithValidation,
    completeTask: completeTaskWithValidation,
    redeemTokens: redeemWithValidation,
    registerTherapist: registerTherapistWithValidation,
    bookTherapist: bookTherapistWithValidation,

    // Direct contract functions
    cancelBooking: (bookingId) => executeTransaction(cancelBooking, bookingId),
    uploadEncryptedReport: (bookingId, ipfsCID) => executeTransaction(uploadEncryptedReport, bookingId, ipfsCID),
    deactivateTherapist: () => executeTransaction(deactivateTherapist),
    reactivateTherapist: () => executeTransaction(reactivateTherapist),

    // Utility functions
    connectWallet,
    loadUserData,
    loadContractStats,
    fetchActiveTherapists,
    getBookingById,
    hasSufficientBalance,
    formatTokenAmount,
    parseTokenAmount,

    // Constants
    constants,
    BOOKING_STATUS
  };
};

export default useContract;
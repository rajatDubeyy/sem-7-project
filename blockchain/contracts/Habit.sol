// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title HabitStaking
 * @dev A decentralized platform for habit tracking with token incentives and therapy services
 * @notice Users can stake tokens, complete habits for rewards, and book therapy sessions
 */
contract HabitStaking is ReentrancyGuard {
    
    // Constants
    uint256 public constant MAX_STAKE_AMOUNT = 1000000 * 10**18; // 1M tokens max stake
    uint256 public constant MIN_SESSION_FEE = 10 * 10**18; // 10 tokens minimum
    uint256 public constant MAX_HABIT_REWARD = 100 * 10**18; // 100 tokens max reward
    
    // State variables
    uint256 public totalStaked;
    uint256 public totalRewardsDistributed;
    
    struct User {
        uint256 stakedTokens;
        uint256 habitStreak;
        uint256 earnedTokens;
        uint256 lastTaskCompletion;
        bool isActive;
    }
    
    struct Therapist {
        address therapistAddress;
        string name;
        uint256 sessionCount;
        uint256 totalEarnings;
        bool isActive;
    }
    
    struct Booking {
        address user;
        address therapist;
        uint256 timestamp;
        uint256 sessionFee;
        string encryptedReportCID; // IPFS hash
        BookingStatus status;
    }
    
    enum BookingStatus {
        Pending,
        Completed,
        Cancelled
    }
    
    // Mappings
    mapping(address => User) public users;
    mapping(address => Therapist) public therapists;
    mapping(address => Booking[]) public userBookings;
    mapping(address => Booking[]) public therapistBookings;
    mapping(uint256 => Booking) public allBookings;
    uint256 public nextBookingId;
    
    // Events
    event TokensStaked(address indexed user, uint256 amount, uint256 totalStaked);
    event TokensUnstaked(address indexed user, uint256 amount);
    event TaskCompleted(address indexed user, uint256 reward, uint256 newStreak);
    event TokensRedeemed(address indexed user, uint256 amount);
    event TherapistRegistered(address indexed therapist, string name);
    event SessionBooked(address indexed user, address indexed therapist, uint256 bookingId, uint256 sessionFee);
    event SessionCompleted(uint256 indexed bookingId);
    event SessionCancelled(uint256 indexed bookingId, address indexed cancelledBy);
    event ReportUploaded(address indexed therapist, address indexed user, uint256 bookingId, string ipfsCID);
    
    // Modifiers
    modifier onlyActiveTherapist() {
        require(therapists[msg.sender].isActive, "Not an active therapist");
        _;
    }
    
    modifier validStakeAmount(uint256 amount) {
        require(amount > 0, "Stake amount must be positive");
        require(amount <= MAX_STAKE_AMOUNT, "Stake amount exceeds maximum");
        _;
    }
    
    modifier validBookingId(uint256 bookingId) {
        require(bookingId < nextBookingId, "Invalid booking ID");
        _;
    }
    
    /**
     * @dev Stake tokens to participate in the habit tracking system
     * @param amount Amount of tokens to stake
     */
    function stakeTokens(uint256 amount) 
        external 
        nonReentrant 
        validStakeAmount(amount) 
    {
        users[msg.sender].stakedTokens += amount;
        users[msg.sender].isActive = true;
        totalStaked += amount;
        
        emit TokensStaked(msg.sender, amount, users[msg.sender].stakedTokens);
    }
    
    /**
     * @dev Unstake tokens
     * @param amount Amount of tokens to unstake
     */
    function unstakeTokens(uint256 amount) 
        external 
        nonReentrant 
    {
        require(users[msg.sender].stakedTokens >= amount, "Insufficient staked tokens");
        
        users[msg.sender].stakedTokens -= amount;
        totalStaked -= amount;
        
        emit TokensUnstaked(msg.sender, amount);
    }
    
    /**
     * @dev Complete a habit task and earn rewards (self-reported)
     * @param reward Reward amount for task completion
     */
    function completeTask(uint256 reward) 
        external 
        nonReentrant 
    {
        require(users[msg.sender].isActive, "User not active");
        require(reward <= MAX_HABIT_REWARD, "Reward exceeds maximum");
        require(users[msg.sender].stakedTokens >= reward, "Insufficient staked tokens for reward");
        
        users[msg.sender].earnedTokens += reward;
        users[msg.sender].habitStreak += 1;
        users[msg.sender].lastTaskCompletion = block.timestamp;
        totalRewardsDistributed += reward;
        
        emit TaskCompleted(msg.sender, reward, users[msg.sender].habitStreak);
    }
    
    /**
     * @dev Redeem earned tokens
     * @param amount Amount of tokens to redeem
     */
    function redeemTokens(uint256 amount) 
        external 
        nonReentrant 
    {
        require(users[msg.sender].earnedTokens >= amount, "Insufficient earned tokens");
        
        users[msg.sender].earnedTokens -= amount;
        
        emit TokensRedeemed(msg.sender, amount);
    }
    
    /**
     * @dev Register as a therapist (anyone can register)
     * @param name Therapist's name
     */
    function registerTherapist(string memory name) 
        external 
    {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(therapists[msg.sender].therapistAddress == address(0), "Already registered");
        
        therapists[msg.sender] = Therapist({
            therapistAddress: msg.sender,
            name: name,
            sessionCount: 0,
            totalEarnings: 0,
            isActive: true
        });
        
        emit TherapistRegistered(msg.sender, name);
    }
    
    /**
     * @dev Deactivate therapist account
     */
    function deactivateTherapist() external {
        require(therapists[msg.sender].isActive, "Already inactive");
        therapists[msg.sender].isActive = false;
    }
    
    /**
     * @dev Reactivate therapist account
     */
    function reactivateTherapist() external {
        require(therapists[msg.sender].therapistAddress != address(0), "Not registered");
        therapists[msg.sender].isActive = true;
    }
    
    /**
     * @dev Book a therapy session
     * @param therapistAddr Address of the therapist
     * @param sessionFee Fee for the session
     */
    function bookTherapist(address therapistAddr, uint256 sessionFee) 
        external 
        nonReentrant 
    {
        require(therapists[therapistAddr].isActive, "Therapist not active");
        require(sessionFee >= MIN_SESSION_FEE, "Session fee too low");
        require(users[msg.sender].earnedTokens >= sessionFee, "Insufficient earned tokens");
        
        users[msg.sender].earnedTokens -= sessionFee;
        
        Booking memory newBooking = Booking({
            user: msg.sender,
            therapist: therapistAddr,
            timestamp: block.timestamp,
            sessionFee: sessionFee,
            encryptedReportCID: "",
            status: BookingStatus.Pending
        });
        
        userBookings[msg.sender].push(newBooking);
        therapistBookings[therapistAddr].push(newBooking);
        allBookings[nextBookingId] = newBooking;
        
        emit SessionBooked(msg.sender, therapistAddr, nextBookingId, sessionFee);
        nextBookingId++;
    }
    
    /**
     * @dev Cancel a booking
     * @param bookingId ID of the booking to cancel
     */
    function cancelBooking(uint256 bookingId) 
        external 
        validBookingId(bookingId) 
    {
        Booking storage booking = allBookings[bookingId];
        require(booking.user == msg.sender || booking.therapist == msg.sender, "Not authorized to cancel");
        require(booking.status == BookingStatus.Pending, "Cannot cancel completed booking");
        
        booking.status = BookingStatus.Cancelled;
        
        // Full refund to user
        users[booking.user].earnedTokens += booking.sessionFee;
        
        emit SessionCancelled(bookingId, msg.sender);
    }
    
    /**
     * @dev Upload encrypted session report
     * @param bookingId ID of the booking
     * @param ipfsCID IPFS hash of the encrypted report
     */
    function uploadEncryptedReport(uint256 bookingId, string memory ipfsCID) 
        external 
        onlyActiveTherapist 
        validBookingId(bookingId) 
    {
        require(bytes(ipfsCID).length > 0, "IPFS CID cannot be empty");
        
        Booking storage booking = allBookings[bookingId];
        require(booking.therapist == msg.sender, "Not your booking");
        require(booking.status == BookingStatus.Pending, "Booking not pending");
        require(bytes(booking.encryptedReportCID).length == 0, "Report already uploaded");
        
        booking.encryptedReportCID = ipfsCID;
        booking.status = BookingStatus.Completed;
        
        // Transfer payment to therapist
        therapists[msg.sender].totalEarnings += booking.sessionFee;
        therapists[msg.sender].sessionCount += 1;
        
        emit ReportUploaded(msg.sender, booking.user, bookingId, ipfsCID);
        emit SessionCompleted(bookingId);
    }
    
    // View functions
    function getUserData(address userAddr) 
        external 
        view 
        returns (uint256 staked, uint256 earned, uint256 streak, bool active) 
    {
        User memory user = users[userAddr];
        return (user.stakedTokens, user.earnedTokens, user.habitStreak, user.isActive);
    }
    
    function getTherapistData(address therapistAddr) 
        external 
        view 
        returns (string memory name, uint256 sessions, bool active) 
    {
        Therapist memory therapist = therapists[therapistAddr];
        return (therapist.name, therapist.sessionCount, therapist.isActive);
    }
    
    function getUserBookings(address userAddr) 
        external 
        view 
        returns (Booking[] memory) 
    {
        return userBookings[userAddr];
    }
    
    function getTherapistBookings(address therapistAddr) 
        external 
        view 
        returns (Booking[] memory) 
    {
        return therapistBookings[therapistAddr];
    }
    
    function getBooking(uint256 bookingId) 
        external 
        view 
        validBookingId(bookingId) 
        returns (Booking memory) 
    {
        return allBookings[bookingId];
    }
    
    function getContractStats() 
        external 
        view 
        returns (uint256 totalStakedTokens, uint256 totalRewards, uint256 totalBookings) 
    {
        return (totalStaked, totalRewardsDistributed, nextBookingId);
    }
}
// Comprehensive embedded sentiment analysis - no API required
import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { useHabitBlockchain } from '../context/HabitBlockchainContext';
import { toast } from 'react-toastify';

const Journal = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [journalEntry, setJournalEntry] = useState('');
  const [mood, setMood] = useState(3);
  const [showAddTask, setShowAddTask] = useState(false);
  const [sentimentAnalysis, setSentimentAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [journalHistory, setJournalHistory] = useState([]);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  
  // Get blockchain context
  const { 
    account, 
    connectWallet, 
    completeTask, 
    userData, 
    isLoading: blockchainLoading,
    loadUserData 
  } = useHabitBlockchain();
  
  
  // Fetch user stats when account changes
  useEffect(() => {
    if (account) {
      loadUserData();
    }
  }, [account, loadUserData]);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    tokensReward: 3,
    deadline: '',
    priority: 'medium',
    category: 'wellness'
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // After successful login:
  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };


  const analyzeSentiment = async (text) => {
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const analysis = performEmbeddedSentimentAnalysis(text);
    setIsAnalyzing(false);
    return analysis;
  };

  const performEmbeddedSentimentAnalysis = (text) => {
    // Enhanced word dictionaries with weights
    const sentimentLexicon = {
      positive: {
        'amazing': 3, 'awesome': 3, 'fantastic': 3, 'incredible': 3, 'wonderful': 3,
        'excellent': 2.5, 'great': 2, 'good': 1.5, 'happy': 2, 'joy': 2.5, 'joyful': 2.5,
        'excited': 2, 'thrilled': 2.5, 'grateful': 2, 'thankful': 2, 'blessed': 2,
        'love': 2.5, 'adore': 2.5, 'peaceful': 1.5, 'calm': 1.5, 'relaxed': 1.5,
        'confident': 2, 'proud': 2, 'accomplished': 2, 'successful': 2, 'optimistic': 2,
        'hopeful': 2, 'content': 1.5, 'satisfied': 1.5, 'pleased': 1.5, 'delighted': 2.5,
        'cheerful': 2, 'bright': 1, 'positive': 1.5, 'beautiful': 1.5, 'perfect': 2
      },
      negative: {
        'terrible': -3, 'awful': -3, 'horrible': -3, 'devastating': -3, 'catastrophic': -3,
        'bad': -1.5, 'sad': -2, 'angry': -2, 'frustrated': -2, 'annoyed': -1.5,
        'depressed': -2.5, 'anxious': -2, 'worried': -1.5, 'stressed': -2, 'overwhelmed': -2.5,
        'exhausted': -1.5, 'tired': -1, 'hopeless': -3, 'helpless': -2.5, 'worthless': -3,
        'lonely': -2, 'isolated': -2, 'abandoned': -2.5, 'rejected': -2, 'disappointed': -2,
        'regret': -1.5, 'guilty': -1.5, 'ashamed': -2, 'embarrassed': -1.5, 'hate': -2.5,
        'fear': -2, 'scared': -2, 'terrified': -2.5, 'panic': -2.5, 'nervous': -1.5
      }
    };

    const emotionPatterns = {
      anxiety: ['anxious', 'worried', 'nervous', 'panic', 'fear', 'scared', 'overwhelmed', 'stress', 'tension'],
      depression: ['sad', 'hopeless', 'empty', 'worthless', 'depressed', 'down', 'lonely', 'dark', 'numb'],
      anger: ['angry', 'frustrated', 'irritated', 'mad', 'furious', 'annoyed', 'rage', 'hate'],
      joy: ['happy', 'joyful', 'excited', 'elated', 'cheerful', 'delighted', 'thrilled'],
      gratitude: ['grateful', 'thankful', 'blessed', 'appreciate', 'fortunate', 'lucky'],
      love: ['love', 'adore', 'cherish', 'care', 'affection', 'tender'],
      confidence: ['confident', 'strong', 'capable', 'accomplished', 'proud', 'successful']
    };

    const mentalHealthRiskWords = {
      high: ['suicide', 'kill myself', 'end it all', 'no point', 'give up', 'can\'t go on'],
      medium: ['hopeless', 'worthless', 'nobody cares', 'alone', 'trapped', 'burden'],
      low: ['sad', 'down', 'tired', 'stressed', 'worried']
    };

    // Text preprocessing
    const cleanText = text.toLowerCase()
      .replace(/[^\w\s']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const words = cleanText.split(' ');
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Sentiment scoring
    let totalScore = 0;
    let wordCount = 0;
    let positiveWords = [];
    let negativeWords = [];

    words.forEach(word => {
      if (sentimentLexicon.positive[word]) {
        totalScore += sentimentLexicon.positive[word];
        positiveWords.push(word);
        wordCount++;
      } else if (sentimentLexicon.negative[word]) {
        totalScore += sentimentLexicon.negative[word];
        negativeWords.push(word);
        wordCount++;
      }
    });

    // Emotion detection
    const emotions = {};
    Object.keys(emotionPatterns).forEach(emotion => {
      const matches = emotionPatterns[emotion].filter(pattern => 
        cleanText.includes(pattern)
      ).length;
      if (matches > 0) {
        emotions[emotion] = matches;
      }
    });

    // Mental health risk assessment
    let riskLevel = 'low';
    let riskFactors = [];
    
    Object.keys(mentalHealthRiskWords).forEach(level => {
      mentalHealthRiskWords[level].forEach(phrase => {
        if (cleanText.includes(phrase)) {
          if (level === 'high') riskLevel = 'high';
          else if (level === 'medium' && riskLevel !== 'high') riskLevel = 'medium';
          riskFactors.push(phrase);
        }
      });
    });

    // Overall sentiment calculation
    const avgScore = wordCount > 0 ? totalScore / wordCount : 0;
    let overall = 'neutral';
    let confidence = 50;

    if (avgScore > 0.5) {
      overall = 'positive';
      confidence = Math.min(90, 50 + (avgScore * 20));
    } else if (avgScore < -0.5) {
      overall = 'negative';
      confidence = Math.min(90, 50 + (Math.abs(avgScore) * 20));
    } else {
      confidence = 50 + Math.random() * 20; // Some variation for neutral
    }

    // Intensity calculation
    const intensity = Math.abs(avgScore);
    let intensityLabel = 'mild';
    if (intensity > 1.5) intensityLabel = 'strong';
    else if (intensity > 0.8) intensityLabel = 'moderate';

    // Extract key phrases and topics
    const keyPhrases = extractKeyPhrases(text);
    const topics = identifyTopics(text);

    return {
      overall,
      confidence: Math.round(confidence),
      intensity: intensityLabel,
      score: Math.round(avgScore * 100) / 100,
      scores: {
        positive: Math.max(0, avgScore),
        neutral: Math.max(0, 1 - Math.abs(avgScore)),
        negative: Math.max(0, -avgScore)
      },
      emotions,
      wordAnalysis: {
        total: words.length,
        sentimentWords: wordCount,
        positiveWords,
        negativeWords
      },
      mentalHealth: {
        riskLevel,
        riskFactors,
        supportiveElements: positiveWords.slice(0, 3)
      },
      insights: generateInsights(overall, emotions, avgScore, words.length),
      keyPhrases,
      topics,
      recommendations: generateRecommendations(overall, emotions, riskLevel)
    };
  };

  const extractKeyPhrases = (text) => {
    const phrases = [];
    const sentences = text.split(/[.!?]+/);
    
    sentences.forEach(sentence => {
      const words = sentence.trim().toLowerCase().split(' ');
      if (words.length >= 3 && words.length <= 8) {
        // Look for emotionally significant phrases
        const emotionalWords = ['feel', 'feeling', 'think', 'believe', 'hope', 'wish', 'want', 'need'];
        if (emotionalWords.some(word => sentence.includes(word))) {
          phrases.push(sentence.trim());
        }
      }
    });
    
    return phrases.slice(0, 3); // Top 3 key phrases
  };

  const identifyTopics = (text) => {
    const topicKeywords = {
      work: ['work', 'job', 'career', 'office', 'boss', 'colleague', 'project', 'meeting'],
      relationships: ['friend', 'family', 'partner', 'relationship', 'love', 'date', 'marriage'],
      health: ['health', 'doctor', 'medicine', 'exercise', 'sleep', 'tired', 'pain'],
      personal: ['myself', 'identity', 'growth', 'change', 'goal', 'dream', 'future'],
      activities: ['travel', 'hobby', 'book', 'movie', 'music', 'sport', 'game']
    };

    const topics = [];
    const lowerText = text.toLowerCase();

    Object.keys(topicKeywords).forEach(topic => {
      const matches = topicKeywords[topic].filter(keyword => 
        lowerText.includes(keyword)
      ).length;
      if (matches > 0) {
        topics.push({ topic, relevance: matches });
      }
    });

    return topics.sort((a, b) => b.relevance - a.relevance).slice(0, 3);
  };

  const generateInsights = (sentiment, emotions, score, wordCount) => {
    const insights = [];

    if (sentiment === 'positive') {
      insights.push("Your entry reflects a positive mindset today!");
      if (emotions.gratitude) insights.push("Great to see gratitude in your thoughts.");
      if (emotions.joy) insights.push("Your joy comes through clearly in your writing.");
    } else if (sentiment === 'negative') {
      insights.push("It sounds like you're going through a challenging time.");
      if (emotions.anxiety) insights.push("I notice some anxiety in your words - consider some relaxation techniques.");
      if (emotions.depression) insights.push("Your feelings are valid. Consider reaching out for support.");
    } else {
      insights.push("Your emotional state seems balanced today.");
    }

    if (wordCount > 100) {
      insights.push("Thank you for sharing detailed thoughts - reflection is powerful.");
    }

    return insights.slice(0, 3);
  };

  const generateRecommendations = (sentiment, emotions, riskLevel) => {
    const recommendations = [];

    if (riskLevel === 'high') {
      recommendations.push("🆘 Please consider speaking with a mental health professional or calling a Crisis helpline.");
      recommendations.push("📞 Crisis Text Line: Text HOME to 741741");
    } else if (riskLevel === 'medium') {
      recommendations.push("💙 Consider reaching out to a trusted friend or counselor.");
      recommendations.push("🧘 Try some mindfulness or breathing exercises.");
    }

    if (emotions.anxiety) {
      recommendations.push("🌬️ Try deep breathing: 4 counts in, hold for 4, out for 6.");
      recommendations.push("🚶 A short walk can help reduce anxiety.");
    }

    if (emotions.depression && riskLevel === 'low') {
      recommendations.push("☀️ Try to get some sunlight and fresh air today.");
      recommendations.push("📝 Consider writing down 3 small things you're grateful for.");
    }

    if (sentiment === 'positive') {
      recommendations.push("✨ You're doing great! Consider sharing this positive energy with others.");
    }

    if (emotions.gratitude) {
      recommendations.push("🙏 Your gratitude practice is wonderful - keep it up!");
    }

    return recommendations.slice(0, 4);
  };

  const [dailyTasks, setDailyTasks] = useState([
    {
      id: Date.now() + 1,
      title: "Morning Meditation (10 minutes)",
      description: "Complete guided breathing meditation",
      completed: true,
      tokensEarned: 5,
      tokensReward: 5,
      verificationMethod: "Self-verified",
      completedAt: "09:30 AM",
      deadline: "12:00 PM",
      priority: "high",
      category: "wellness",
      isDefault: true
    },
    {
      id: Date.now() + 2,
      title: "Gratitude Practice",
      description: "Write 3 things you're grateful for",
      completed: false,
      tokensReward: 3,
      verificationMethod: "Journal entry required",
      deadline: "11:00 PM",
      priority: "medium",
      category: "wellness",
      isDefault: true
    },
    {
      id: Date.now() + 3,
      title: "Mindful Walk (15 minutes)",
      description: "Take a walk focusing on your surroundings",
      completed: false,
      tokensReward: 4,
      verificationMethod: "Self-verified",
      deadline: "06:00 PM",
      priority: "low",
      category: "wellness",
      isDefault: true
    }
  ]);

  const [completedGoals, setCompletedGoals] = useState([]);
  const [completedTaskIds, setCompletedTaskIds] = useState([]);

  const [todayStats, setTodayStats] = useState({
    tasksCompleted: 1,
    totalTasks: 3,
    tokensEarned: 5,
    moodAverage: 3.5,
    streakDays: 7
  });

  const moodEmojis = ['😢', '😕', '😐', '🙂', '😊'];
  const moodLabels = ['Very Low', 'Low', 'Neutral', 'Good', 'Great'];
  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  };
  const categoryIcons = {
    wellness: '🧘',
    work: '💼',
    personal: '👤',
    health: '❤️',
    learning: '📚',
    social: '👥'
  };

  // Get current time and check if task is overdue
  const getCurrentTime = () => {
    return new Date();
  };

  const isTaskOverdue = (deadline) => {
    if (!deadline) return false;
    const now = getCurrentTime();
    const [hours, minutes] = deadline.split(':');
    const deadlineTime = new Date();
    deadlineTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return now > deadlineTime;
  };

  const getTimeUntilDeadline = (deadline) => {
    if (!deadline) return '';
    const now = getCurrentTime();
    const [hours, minutes] = deadline.split(':');
    const deadlineTime = new Date();
    deadlineTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    if (now > deadlineTime) return 'Overdue';
    
    const diff = deadlineTime - now;
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hoursLeft === 0) {
      return `${minutesLeft}m left`;
    }
    return `${hoursLeft}h ${minutesLeft}m left`;
  };

  const handleAddTask = () => {
    if (newTask.title.trim() && newTask.description.trim()) {
      const task = {
        id: Date.now(),
        ...newTask,
        completed: false,
        verificationMethod: "Self-verified",
        isDefault: false
      };
      
      setDailyTasks(prev => [...prev, task]);
      setTodayStats(prev => ({
        ...prev,
        totalTasks: prev.totalTasks + 1
      }));
      
      // Reset form
      setNewTask({
        title: '',
        description: '',
        tokensReward: 3,
        deadline: '',
        priority: 'medium',
        category: 'wellness'
      });
      setShowAddTask(false);
    }
  };

  const handleTaskComplete = (taskId) => {
  // Prevent duplicate completions
  if (completedTaskIds.includes(taskId)) return;

  setDailyTasks(prev => prev.map(task => {
    if (task.id === taskId && !task.completed) {
      const completedTask = {
        ...task,
        completed: true,
        tokensEarned: task.tokensReward,
        completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setTodayStats(prevStats => ({
        ...prevStats,
        tasksCompleted: prevStats.tasksCompleted + 1,
        tokensEarned: prevStats.tokensEarned + (task.tokensReward || 0)
      }));

      // Add to completed goals only if not already completed
      setCompletedGoals(prev => {
  const exists = prev.some(goal => goal.title === task.title);
  if (exists) return prev;

  return [
    {
      id: `${taskId}-${Date.now()}`, // Ensure unique key
      title: task.title,
      completedDate: new Date().toISOString().split('T')[0],
      tokensEarned: task.tokensReward,
      aiInsight: "Task completed successfully!"
    },
    ...prev
  ];
});

      // Mark task as completed
      setCompletedTaskIds(prev => [...prev, taskId]);

      return completedTask;
    }
    return task;
  }));
};

  const handleDeleteTask = (taskId) => {
    const task = dailyTasks.find(t => t.id === taskId);
    if (task && !task.isDefault) {
      setDailyTasks(prev => prev.filter(t => t.id !== taskId));
      setTodayStats(prev => ({
        ...prev,
        totalTasks: prev.totalTasks - 1,
        tasksCompleted: task.completed ? prev.tasksCompleted - 1 : prev.tasksCompleted,
        tokensEarned: task.completed ? prev.tokensEarned - (task.tokensEarned || 0) : prev.tokensEarned
      }));
    }
  };

  const handleJournalSubmit = async () => {
    if (journalEntry.trim()) {
      setIsAnalyzing(true);
      const analysis = await analyzeSentiment(journalEntry);
      setSentimentAnalysis(analysis);
      setJournalHistory(prev => [...prev, { text: journalEntry, analysis, date: new Date().toLocaleString() }]);
      
      setJournalEntry('');
      setMood(3);
      setIsAnalyzing(false);
      setRewardClaimed(false); // Reset reward claimed status for new entry
    }
  };

  // Handle claiming reward for journal entry
  const handleClaimJournalReward = async () => {
    if (!account) {
      toast.error("Please connect your wallet first!");
      return;
    }
    
    try {
      // Fixed reward amount for completing a journal entry
      const rewardAmount = 5; // 5 tokens for a journal entry
      await completeTask(rewardAmount);
      await loadUserData();
      setRewardClaimed(true);
      toast.success(`Successfully claimed ${displayTokens(rewardAmount)} for your journal entry!`);

    } catch (error) {
      console.error("Error claiming reward:", error);
      toast.error("Failed to claim tokens. Please try again.");
    }
  };

  const getProgressPercentage = () => {
    return todayStats.totalTasks > 0 ? (todayStats.tasksCompleted / todayStats.totalTasks) * 100 : 0;
  };

  // Sort tasks by priority and deadline
  const sortedTasks = [...dailyTasks].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    if (a.completed !== b.completed) {
      return a.completed - b.completed; // Incomplete tasks first
    }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority]; // Higher priority first
    }
    return 0;
  });

  return (
    <>
    <Navbar isLoggedIn={isLoggedIn} user={user} />
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      {/* Header Stats */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Daily Wellness Journal</h1>
        
        {/* Wallet Connection Status */}
        <div className="mb-4 bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center justify-between w-full">
          {account ? (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-gray-700 text-sm">
                  Connected: {account.substring(0, 6)}...{account.substring(account.length - 4)}
                </span>
              </div>
              {userData && (
  <div className="text-gray-700 text-sm">
    <span className="font-bold">{userData.earnedTokensFormatted}</span> tokens
  </div>
)}

            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-gray-700 text-sm">Wallet not connected</span>
              <button 
                onClick={connectWallet}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md transition-colors"
              >
                Connect Wallet
              </button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl">
            <div className="text-2xl font-bold text-green-600">{todayStats.tasksCompleted}</div>
            <div className="text-sm text-green-700">Tasks Done</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl">
            <div className="text-2xl font-bold text-blue-600">{todayStats.tokensEarned}</div>
            <div className="text-sm text-blue-700">Tokens Earned</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
            <div className="text-2xl font-bold text-purple-600">{todayStats.streakDays}</div>
            <div className="text-sm text-purple-700">Day Streak</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl">
            <div className="text-2xl">{moodEmojis[Math.floor(todayStats.moodAverage)]}</div>
            <div className="text-sm text-orange-700">Avg Mood</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl">
            <div className="text-2xl font-bold text-indigo-600">{Math.round(getProgressPercentage())}%</div>
            <div className="text-sm text-indigo-700">Progress</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-lg mb-8">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-300 ${
              activeTab === 'tasks'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Daily Tasks</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-300 ${
              activeTab === 'goals'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span>Completed Goals</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('journal')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-300 ${
              activeTab === 'journal'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span>Write Entry</span>
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Daily Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Today's Wellness Tasks</h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${getProgressPercentage()}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{Math.round(getProgressPercentage())}%</span>
                  </div>
                  <button
                    onClick={() => setShowAddTask(true)}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Task</span>
                  </button>
                </div>
              </div>

              {/* Add Task Modal */}
              {showAddTask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Add New Task</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                        <input
                          type="text"
                          value={newTask.title}
                          onChange={(e) => setNewTask(prev => ({...prev, title: e.target.value}))}
                          placeholder="e.g., Read 30 minutes, Exercise, Call mom..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          value={newTask.description}
                          onChange={(e) => setNewTask(prev => ({...prev, description: e.target.value}))}
                          placeholder="Describe what needs to be done..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                          <input
                            type="time"
                            value={newTask.deadline}
                            onChange={(e) => setNewTask(prev => ({...prev, deadline: e.target.value}))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                          <select
                            value={newTask.priority}
                            onChange={(e) => setNewTask(prev => ({...prev, priority: e.target.value}))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                          <select
                            value={newTask.category}
                            onChange={(e) => setNewTask(prev => ({...prev, category: e.target.value}))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="wellness">🧘 Wellness</option>
                            <option value="work">💼 Work</option>
                            <option value="personal">👤 Personal</option>
                            <option value="health">❤️ Health</option>
                            <option value="learning">📚 Learning</option>
                            <option value="social">👥 Social</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Token Reward</label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={newTask.tokensReward}
                            onChange={(e) => setNewTask(prev => ({...prev, tokensReward: parseInt(e.target.value) || 3}))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end space-x-3 mt-6">
                      <button
                        onClick={() => setShowAddTask(false)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddTask}
                        disabled={!newTask.title.trim() || !newTask.description.trim()}
                        className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Task
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {sortedTasks.map((task) => (
                <div key={task.id} className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  task.completed 
                    ? 'bg-green-50 border-green-200 shadow-sm' 
                    : isTaskOverdue(task.deadline)
                    ? 'bg-red-50 border-red-200 shadow-md'
                    : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => !task.completed && handleTaskComplete(task.id)}
                        disabled={task.completed}
                        className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                          task.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-indigo-500 hover:bg-indigo-50'
                        }`}
                      >
                        {task.completed && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-lg">{categoryIcons[task.category]}</span>
                          <h3 className={`font-semibold ${task.completed ? 'text-green-700 line-through' : 'text-gray-800'}`}>
                            {task.title}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        <div className="flex items-center space-x-2 flex-wrap gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full border ${priorityColors[task.priority]}`}>
                            {task.priority.toUpperCase()} PRIORITY
                          </span>
                          {task.deadline && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              task.completed 
                                ? 'bg-green-100 text-green-800'
                                : isTaskOverdue(task.deadline)
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {task.completed ? `Completed at ${task.completedAt}` : 
                               isTaskOverdue(task.deadline) ? 'OVERDUE' : 
                               `Due: ${task.deadline} (${getTimeUntilDeadline(task.deadline)})`}
                            </span>
                          )}
                          {!task.isDefault && (
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-xs text-red-600 hover:text-red-800 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${task.completed ? 'text-green-600' : 'text-indigo-600'}`}>
                        +{task.completed ? task.tokensEarned : task.tokensReward} tokens
                      </div>
                      {task.completed && (
                        <div className="text-xs text-green-600 font-medium">✓ Earned</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Completed Goals Tab */}
          {activeTab === 'goals' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Recent Achievements</h2>
             {completedGoals.map((goal) => (
  <div key={goal.id} className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
    {/* Keep existing structure but update content to match task data */}
    <div className="flex items-start justify-between">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">{goal.title}</h3>
          <p className="text-sm text-gray-600 mt-1">Completed on {goal.completedDate}</p>
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-green-600">+{goal.tokensEarned}</div>
        <div className="text-sm text-green-700">tokens earned</div>
      </div>
    </div>
  </div>
))}
            </div>
          )}

          {/* Journal Entry Tab */}
          {activeTab === 'journal' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Daily Reflection & Mood</h2>
              
              {/* Mood Selector */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl mb-6 border border-purple-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">How are you feeling today?</h3>
                <div className="flex items-center justify-between">
                  {moodEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => setMood(index)}
                      className={`p-4 rounded-xl transition-all duration-300 ${
                        mood === index
                          ? 'bg-white shadow-lg scale-110 border-2 border-purple-400'
                          : 'hover:bg-white hover:shadow-md'
                      }`}
                    >
                      <div className="text-3xl mb-2">{emoji}</div>
                      <div className="text-xs text-gray-600">{moodLabels[index]}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Journal Text Area */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Write your thoughts and reflections</h3>
                <textarea
                  value={journalEntry}
                  onChange={(e) => setJournalEntry(e.target.value)}
                  placeholder="How was your day? What emotions did you experience? What are you grateful for? Any challenges you faced?"
                  className="w-full h-48 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Your entry will be analyzed by AI for emotional insights and crisis detection
                  </div>
                  <button
                    onClick={handleJournalSubmit}
                    disabled={!journalEntry.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    Save & Analyze Entry
                  </button>
                </div>
              </div>
              {sentimentAnalysis && (
                <div className="mt-8 bg-purple-50 border border-purple-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-purple-800 mb-2">AI Mood Analysis</h3>
                    <p><strong>Mood:</strong> {sentimentAnalysis.overall} ({sentimentAnalysis.intensity})</p>
                    <p><strong>Confidence:</strong> {sentimentAnalysis.confidence}%</p>
                    <p><strong>Key Emotions:</strong> {Object.keys(sentimentAnalysis.emotions).join(', ') || 'None'}</p>
                    <p className="mt-2 text-sm text-gray-600">{sentimentAnalysis.insights[0]}</p>
                    
                    {/* Reward Claiming Section */}
                    {!rewardClaimed && (
                      <div className="mt-4 text-center">
                        <button
                          onClick={handleClaimJournalReward}
                          disabled={blockchainLoading || !account}
                          className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                        >
                          {blockchainLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Claim 5 Tokens for Journal Entry</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                    
                    {rewardClaimed && (
                      <div className="mt-4 text-center bg-green-100 p-3 rounded-lg border border-green-300">
                        <p className="text-green-700 font-semibold">Tokens claimed successfully!</p>
                      </div>
                    )}
                </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );

  
  
};

export default Journal;
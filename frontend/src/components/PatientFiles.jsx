import React, { useState, useEffect } from 'react';
import { Search, FileText, Download, Eye, Calendar, AlertCircle, Shield, Heart, Brain, Activity } from 'lucide-react';
import Navbar from "./Navbar";
import IPFSUploader from './IPFSUploader';

const PatientFiles = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [patients, setPatients] = useState([]);

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // Mock patient data with health records
  useEffect(() => {
    const mockPatients = [
      {
        id: 1,
        name: "Sarah Johnson",
        age: 28,
        email: "sarah.j@email.com",
        walletAddress: "0x742d35cc6c7b32e5f7d6e8b...",
        lastAppointment: "2024-12-15",
        nextAppointment: "2024-12-22",
        status: "active",
        riskLevel: "medium",
        completedSessions: 8,
        totalTokensEarned: 2450,
        currentStreak: 12,
        healthRecords: [
          {
            id: 1,
            fileName: "Mental_Health_Assessment_Dec2024.pdf",
            uploadDate: "2024-12-10",
            fileType: "assessment",
            size: "2.3 MB",
            description: "Initial psychological evaluation and depression screening",
            priority: "high"
          },
          {
            id: 2,
            fileName: "Medication_History_Nov2024.pdf",
            uploadDate: "2024-11-28",
            fileType: "medication",
            size: "1.1 MB",
            description: "Current medications and treatment history",
            priority: "medium"
          },
          {
            id: 3,
            fileName: "Wellness_Progress_Report.pdf",
            uploadDate: "2024-12-05",
            fileType: "progress",
            size: "890 KB",
            description: "Weekly meditation and journaling progress tracking",
            priority: "low"
          }
        ],
        mentalHealthMetrics: {
          anxietyScore: 6.2,
          depressionScore: 4.8,
          stressLevel: 7.1,
          sleepQuality: 5.5,
          lastUpdated: "2024-12-15"
        },
        recentCrisisAlerts: [
          {
            date: "2024-12-12",
            type: "Mood Drop",
            severity: "medium",
            handled: true
          }
        ]
      },
      {
        id: 2,
        name: "Michael Chen",
        age: 34,
        email: "m.chen@email.com",
        walletAddress: "0x8f3a2b1c9d4e5f6a7b8c9d0e...",
        lastAppointment: "2024-12-18",
        nextAppointment: "2024-12-25",
        status: "active",
        riskLevel: "low",
        completedSessions: 15,
        totalTokensEarned: 4200,
        currentStreak: 28,
        healthRecords: [
          {
            id: 4,
            fileName: "Anxiety_Management_Plan.pdf",
            uploadDate: "2024-12-08",
            fileType: "treatment",
            size: "1.8 MB",
            description: "Comprehensive anxiety treatment and coping strategies",
            priority: "high"
          },
          {
            id: 5,
            fileName: "Biometric_Data_Dec2024.pdf",
            uploadDate: "2024-12-14",
            fileType: "biometric",
            size: "756 KB",
            description: "Heart rate variability and stress response data",
            priority: "medium"
          }
        ],
        mentalHealthMetrics: {
          anxietyScore: 3.4,
          depressionScore: 2.1,
          stressLevel: 4.2,
          sleepQuality: 7.8,
          lastUpdated: "2024-12-18"
        },
        recentCrisisAlerts: []
      },
      {
        id: 3,
        name: "Emma Rodriguez",
        age: 24,
        email: "emma.r@email.com",
        walletAddress: "0x1a2b3c4d5e6f7a8b9c0d1e2f...",
        lastAppointment: "2024-12-20",
        nextAppointment: "2024-12-27",
        status: "new",
        riskLevel: "high",
        completedSessions: 3,
        totalTokensEarned: 850,
        currentStreak: 5,
        healthRecords: [
          {
            id: 6,
            fileName: "Emergency_Contact_Info.pdf",
            uploadDate: "2024-12-19",
            fileType: "emergency",
            size: "324 KB",
            description: "Emergency contacts and crisis intervention plan",
            priority: "critical"
          },
          {
            id: 7,
            fileName: "Initial_Intake_Form.pdf",
            uploadDate: "2024-12-15",
            fileType: "intake",
            size: "2.1 MB",
            description: "Comprehensive intake assessment and history",
            priority: "high"
          }
        ],
        mentalHealthMetrics: {
          anxietyScore: 8.7,
          depressionScore: 7.9,
          stressLevel: 9.2,
          sleepQuality: 3.1,
          lastUpdated: "2024-12-20"
        },
        recentCrisisAlerts: [
          {
            date: "2024-12-19",
            type: "High Risk",
            severity: "high",
            handled: false
          },
          {
            date: "2024-12-17",
            type: "Sleep Disturbance",
            severity: "medium",
            handled: true
          }
        ]
      }
    ];
    setPatients(mockPatients);
  }, []);

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || patient.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getRiskLevelColor = (risk) => {
    switch(risk) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getFileTypeIcon = (type) => {
    switch(type) {
      case 'assessment': return <Brain className="w-4 h-4" />;
      case 'medication': return <Heart className="w-4 h-4" />;
      case 'progress': return <Activity className="w-4 h-4" />;
      case 'treatment': return <Shield className="w-4 h-4" />;
      case 'emergency': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return 'text-red-700 bg-red-100';
      case 'high': return 'text-orange-700 bg-orange-100';
      case 'medium': return 'text-yellow-700 bg-yellow-100';
      case 'low': return 'text-green-700 bg-green-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
  <>
    <Navbar isLoggedIn={isLoggedIn} user={user} />
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Patient Files Dashboard
          </h1>
          <p className="text-xl text-white max-w-3xl mx-auto">
            Manage and review patient health records securely. Access comprehensive patient data and track their progress.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Search & Filter Patients</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Search Patients</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search patients by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              >
                <option value="all">All Patients</option>
                <option value="active">Active</option>
                <option value="new">New</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient List */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Patients ({filteredPatients.length})</h2>
              <div className="space-y-4">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedPatient?.id === patient.id
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                          <span className="text-sm font-semibold text-white">
                            {patient.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                          <p className="text-sm text-gray-600">{patient.email}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getRiskLevelColor(patient.riskLevel)}`}>
                        {patient.riskLevel}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Sessions:</span> {patient.completedSessions}
                      </div>
                      <div>
                        <span className="font-medium">Files:</span> {patient.healthRecords.length}
                      </div>
                    </div>

                    {patient.recentCrisisAlerts.length > 0 && (
                      <div className="flex items-center text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        {patient.recentCrisisAlerts.filter(alert => !alert.handled).length} active alerts
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Patient Details */}
          <div className="lg:col-span-2">
            {selectedPatient ? (
              <div className="space-y-8">
                {/* Patient Overview */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                        <span className="text-xl font-semibold text-white">
                          {selectedPatient.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedPatient.name}</h2>
                        <p className="text-gray-600">Age: {selectedPatient.age} • {selectedPatient.email}</p>
                      </div>
                    </div>
                    <span className={`px-4 py-2 rounded-full border font-medium ${getRiskLevelColor(selectedPatient.riskLevel)}`}>
                      {selectedPatient.riskLevel.toUpperCase()} RISK
                    </span>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">{selectedPatient.completedSessions}</div>
                      <div className="text-sm text-gray-600 font-medium">Sessions</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
                      <div className="text-2xl font-bold text-emerald-600">{selectedPatient.totalTokensEarned}</div>
                      <div className="text-sm text-gray-600 font-medium">Tokens</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                      <div className="text-2xl font-bold text-purple-600">{selectedPatient.currentStreak}</div>
                      <div className="text-sm text-gray-600 font-medium">Day Streak</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
                      <div className="text-2xl font-bold text-amber-600">{selectedPatient.healthRecords.length}</div>
                      <div className="text-sm text-gray-600 font-medium">Files</div>
                    </div>
                  </div>
                </div>

                {/* Mental Health Metrics */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Mental Health Metrics</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                    <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
                      <div className="text-xl font-bold text-red-600">{selectedPatient.mentalHealthMetrics.anxietyScore}/10</div>
                      <div className="text-sm text-gray-600 font-medium">Anxiety</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                      <div className="text-xl font-bold text-blue-600">{selectedPatient.mentalHealthMetrics.depressionScore}/10</div>
                      <div className="text-sm text-gray-600 font-medium">Depression</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
                      <div className="text-xl font-bold text-yellow-600">{selectedPatient.mentalHealthMetrics.stressLevel}/10</div>
                      <div className="text-sm text-gray-600 font-medium">Stress</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
                      <div className="text-xl font-bold text-emerald-600">{selectedPatient.mentalHealthMetrics.sleepQuality}/10</div>
                      <div className="text-sm text-gray-600 font-medium">Sleep Quality</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Last updated: {selectedPatient.mentalHealthMetrics.lastUpdated}</p>
                </div>

                {/* Health Records */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Health Records</h3>
                  <div className="space-y-4">
                    {selectedPatient.healthRecords.map((record) => (
                      <div key={record.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-indigo-600">
                              {getFileTypeIcon(record.fileType)}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{record.fileName}</h4>
                              <p className="text-sm text-gray-600">{record.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getPriorityColor(record.priority)}`}>
                              {record.priority}
                            </span>
                            <button className="p-2 text-gray-500 hover:text-indigo-600 transition-colors rounded-lg hover:bg-gray-100">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button className="p-2 text-gray-500 hover:text-emerald-600 transition-colors rounded-lg hover:bg-gray-100">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Uploaded: {record.uploadDate}</span>
                          <span>Size: {record.size}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* IPFS Upload Section */}
                <div className="mt-8">
                  <IPFSUploader 
                    patientAddress={selectedPatient.walletAddress} 
                    onUploadComplete={(cid) => {
                      // Add the new record to the patient's health records
                      const newRecord = {
                        id: Date.now(), // Generate a temporary ID
                        fileName: `IPFS_Report_${new Date().toISOString().split('T')[0]}.pdf`,
                        uploadDate: new Date().toISOString().split('T')[0],
                        fileType: 'ipfs',
                        size: 'Varies',
                        description: 'Encrypted medical report stored on IPFS',
                        priority: 'medium',
                        ipfsCID: cid
                      };
                      
                      // Update the patient's health records
                      setPatients(prevPatients => 
                        prevPatients.map(patient => 
                          patient.id === selectedPatient.id 
                            ? {...patient, healthRecords: [...patient.healthRecords, newRecord]} 
                            : patient
                        )
                      );
                      
                      // Update the selected patient
                      setSelectedPatient(prev => ({
                        ...prev,
                        healthRecords: [...prev.healthRecords, newRecord]
                      }));
                    }}
                  />
                </div>

                {/* Crisis Alerts */}
                {selectedPatient.recentCrisisAlerts.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      Recent Crisis Alerts
                    </h3>
                    <div className="space-y-4">
                      {selectedPatient.recentCrisisAlerts.map((alert, index) => (
                        <div key={index} className={`p-4 rounded-xl border-l-4 ${
                          alert.severity === 'high' ? 'border-red-500 bg-red-50' :
                          alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                          'border-blue-500 bg-blue-50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-gray-900">{alert.type}</span>
                              <span className="text-sm text-gray-600 ml-3">{alert.date}</span>
                            </div>
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              alert.handled ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {alert.handled ? 'Resolved' : 'Active'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Patient</h3>
                <p className="text-gray-500">Choose a patient from the list to view their health records and details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </>
);
};

export default PatientFiles;
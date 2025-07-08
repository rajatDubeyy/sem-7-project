import { useState } from 'react';
import Navbar from "./Navbar";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Activity
} from 'lucide-react';
import React from 'react';

const MedicalReportAnalyzer = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const API_BASE_URL = 'http://localhost:8002';

  const handleFileUpload = async (file) => {
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/tiff', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF or image file (PNG, JPG, JPEG, TIFF, BMP)');
      return;
    }

    const maxSize = 16 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 16MB');
      return;
    }

    setUploadedFile(file);
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setAnalysisResult(data.data);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError('Failed to connect to the analysis server. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const resetAnalysis = () => {
    setUploadedFile(null);
    setAnalysisResult(null);
    setError(null);
    setIsAnalyzing(false);
  };

  const getStatusColor = (status) => {
    if (status === 'normal' || status === 'optimal' || status === 'good') return 'text-green-600';
    if (status === 'borderline_high' || status === 'elevated' || status === 'low_normal') return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (normal) => {
    return normal ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  return (
    <>
    <Navbar isLoggedIn={isLoggedIn} user={user} />
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white flex justify-center items-start py-10 px-4">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl max-w-6xl w-full p-8">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold mb-2">🧠 Medical Report Analyzer</h2>
          <p className="text-purple-200">Upload PDFs or images to receive AI-powered health insights</p>
        </div>

        {!analysisResult && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div
              className={`border-2 border-dashed rounded-xl p-8 transition-all duration-300 text-center ${
                dragActive ? 'border-blue-400 bg-blue-50 text-black' : 'border-purple-400 hover:border-purple-500'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isAnalyzing ? (
                <div className="space-y-4">
                  <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-purple-300 font-medium">Analyzing report...</p>
                </div>
              ) : (
                <div>
                  <FileText className="h-14 w-14 text-purple-400 mx-auto mb-4" />
                  <p className="mb-4">Drop your file here or select manually</p>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp"
                    onChange={handleFileChange}
                    className="hidden"
                    id="upload-input"
                  />
                  <label
                    htmlFor="upload-input"
                    className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer shadow-md"
                  >
                    <Upload className="h-5 w-5 mr-2" /> Browse File
                  </label>
                  {uploadedFile && <p className="mt-2 text-sm text-white/70">Selected: {uploadedFile.name}</p>}
                </div>
              )}
              {error && <p className="text-red-400 mt-3">{error}</p>}
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-semibold">🔍 What We Analyze</h3>
              {["Lab results like glucose, cholesterol, BP", "Abnormal patterns detection", "Possible condition flagging", "Health summary insights"].map((item, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-white/80">{item}</span>
                </div>
              ))}
              <div className="mt-6 p-4 bg-yellow-100 text-yellow-800 text-sm rounded-lg">
                ⚠️ Note: This tool is for informational purposes. Always consult a licensed medical professional.
              </div>
            </div>
          </div>
        )}

        {analysisResult && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-white">📋 Analysis Results</h3>
              <button
                onClick={resetAnalysis}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                New Analysis
              </button>
            </div>

            <div className="bg-purple-50/10 border border-purple-200/20 p-6 rounded-lg">
              <h4 className="text-xl font-semibold mb-2 text-purple-200">📝 Summary</h4>
              <p className="text-white/80">{analysisResult.summary}</p>
              <p className="text-xs text-purple-300 mt-2">Completed at: {new Date(analysisResult.analysis_timestamp).toLocaleString()}</p>
            </div>

            {analysisResult.conditions?.length > 0 && (
              <div className="bg-orange-100/20 border border-orange-200/20 p-6 rounded-lg">
                <h4 className="text-xl font-semibold text-orange-300 mb-3">🚨 Detected Conditions</h4>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.conditions.map((condition, idx) => (
                    <span key={idx} className="px-3 py-1 bg-orange-300 text-orange-900 rounded-full text-sm font-medium">
                      {condition.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysisResult.lab_details && (
              <div className="bg-white/10 border border-white/20 rounded-lg p-6">
                <h4 className="text-xl font-semibold text-white mb-4">🧪 Lab Values</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(analysisResult.lab_details).map(([key, val]) => (
                    <div key={key} className="p-4 bg-white/5 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="text-white font-medium capitalize">{key.replace(/_/g, ' ')}</h5>
                        {getStatusIcon(val.normal)}
                      </div>
                      <p className="text-white text-lg font-bold">{val.value}</p>
                      <p className={`text-sm capitalize font-medium ${getStatusColor(val.status)}`}>{val.status.replace(/_/g, ' ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-sm text-white/50">
              File: {analysisResult.filename} • Extracted text: {analysisResult.extracted_text_length} characters
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default MedicalReportAnalyzer;
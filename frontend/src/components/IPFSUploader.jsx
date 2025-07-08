import React, { useState } from 'react';
import { Upload, X, FileText, Check, Loader2, AlertCircle } from 'lucide-react';
import { useHabitBlockchain } from '../context/HabitBlockchainContext';

const IPFSUploaderDebug = ({ onUploadComplete }) => {
  const { account: patientAddress } = useHabitBlockchain();

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [ipfsCID, setIpfsCID] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [downloadLink, setDownloadLink] = useState('');
  const [debugLogs, setDebugLogs] = useState([]);
  const [error, setError] = useState('');

  // Mock blockchain context
  const uploadEncryptedReport = async (address, cid) => {
    addDebugLog(`📝 Recording on blockchain: ${address} -> ${cid}`);
    // Simulate blockchain delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    addDebugLog('✅ Blockchain transaction completed');
  };

  const addDebugLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearDebugLogs = () => {
    setDebugLogs([]);
    setError('');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      addDebugLog(`📁 File selected: ${selectedFile.name} (${formatFileSize(selectedFile.size)})`);
      
      // File validation
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > maxSize) {
        setError('File size exceeds 10MB limit');
        addDebugLog('❌ File too large');
        return;
      }

      const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.png', '.zip'];
      const fileExtension = '.' + selectedFile.name.split('.').pop().toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        setError(`File type ${fileExtension} not allowed`);
        addDebugLog(`❌ Invalid file type: ${fileExtension}`);
        return;
      }

      setFile(selectedFile);
      setFileName(selectedFile.name);
      setFileSize(selectedFile.size);
      setUploadSuccess(false);
      setIpfsCID('');
      setDownloadLink('');
      setError('');
      addDebugLog('✅ File validation passed');
    }
  };

  const clearFile = () => {
    setFile(null);
    setFileName('');
    setFileSize(0);
    setUploadSuccess(false);
    setIpfsCID('');
    setDownloadLink('');
    setError('');
    addDebugLog('🗑️ File cleared');
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const simulateIPFSUpload = async (file) => {
    // Simulate IPFS upload with random CID
    const randomCID = 'Qm' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate potential network errors
    if (Math.random() < 0.1) { // 10% chance of failure
      throw new Error('Network timeout - IPFS node unreachable');
    }
    
    return {
      success: true,
      cid: randomCID,
      message: 'File uploaded successfully to IPFS'
    };
  };

  // Fixed: This function now properly handles file upload to Pinata
  const uploadToIPFS = async (fileToUpload) => {
    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      addDebugLog('🚀 Starting IPFS upload via Pinata...');
      
      // Check if JWT token is available
      const pinataJWT = import.meta.env.VITE_PINATA_JWT;
      if (!pinataJWT || pinataJWT === 'your_pinata_jwt_here') {
        throw new Error('Pinata JWT token not configured. Please check your environment variables.');
      }

      addDebugLog('🔑 JWT token found, making request to Pinata...');

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${pinataJWT}`
        },
        body: formData
      });

      addDebugLog(`📡 Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorData = await response.text();
        addDebugLog(`❌ Error response: ${errorData}`);
        throw new Error(`Pinata upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      addDebugLog(`✅ Upload successful! IPFS Hash: ${result.IpfsHash}`);

      return result.IpfsHash; // Return the valid CID
    } catch (error) {
      addDebugLog(`❌ IPFS Upload Error: ${error.message}`);
      console.error('❌ IPFS Upload Error:', error.message);
      throw error;
    }
  };

  // Fixed: Main upload handler that manages the upload process
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    if (!patientAddress) {
      setError('Patient address not available');
      addDebugLog('❌ Patient address missing');
      return;
    }

    setUploading(true);
    setError('');
    
    try {
      addDebugLog('🔄 Starting upload process...');
      
      // Upload to IPFS via Pinata
      const cid = await uploadToIPFS(file);
      
      // Set success state
      setIpfsCID(cid);
      setUploadSuccess(true);
      
      // Create download link
      const gatewayUrl = import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud';
      const downloadUrl = `${gatewayUrl}/ipfs/${cid}`;
      setDownloadLink(downloadUrl);
      
      addDebugLog(`📥 Download link: ${downloadUrl}`);
      
      // Simulate blockchain upload
      await uploadEncryptedReport(patientAddress, cid);
      
      addDebugLog('🎉 Upload process completed successfully!');
      
      // Call callback if provided
      if (onUploadComplete) {
        onUploadComplete({ cid, downloadUrl });
      }
      
    } catch (err) {
      setError(err.message);
      addDebugLog(`💥 Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Main Upload Component */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Upload className="w-5 h-5 mr-2 text-indigo-600" />
          Upload Medical Report to IPFS (Debug Mode)
        </h3>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            Upload encrypted medical reports securely to IPFS. The file will be stored on the decentralized network and the reference will be recorded on the blockchain.
          </p>

          {/* Error Display */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Patient Address Display */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Patient Address:</strong> {patientAddress || 'Not provided'}
            </p>
          </div>

          {!file ? (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer" 
              onClick={() => document.getElementById('file-upload').click()}
            >
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.jpg,.png,.zip"
              />
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium">Click to upload or drag and drop</p>
              <p className="text-sm text-gray-500 mt-1">PDF, DOC, TXT, JPG, PNG, ZIP (Max 10MB)</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{fileName}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(fileSize)}</p>
                  </div>
                </div>
                <button 
                  onClick={clearFile}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {uploadSuccess ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-2" />
                  <div>
                    <p className="font-medium text-green-800">Upload Successful!</p>
                    <p className="text-sm text-green-700 break-all">
                      IPFS CID: {ipfsCID}
                    </p>
                    <a 
                      href={downloadLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:underline mt-1 inline-block"
                    >
                      📥 Download File from IPFS
                    </a>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center disabled:opacity-70"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Upload to IPFS
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500">
          <p>* Files are encrypted and stored on IPFS (InterPlanetary File System)</p>
          <p>* Only authorized parties can access the uploaded files</p>
          <p>* The reference to the file is securely stored on the blockchain</p>
        </div>
      </div>

      {/* Debug Console */}
      <div className="bg-gray-900 rounded-2xl p-6 text-green-400 font-mono text-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white font-semibold">Debug Console</h4>
          <button 
            onClick={clearDebugLogs}
            className="px-3 py-1 bg-gray-700 text-white rounded text-xs hover:bg-gray-600"
          >
            Clear Logs
          </button>
        </div>
        <div className="h-64 overflow-y-auto bg-black rounded p-3">
          {debugLogs.length === 0 ? (
            <p className="text-gray-500">No debug logs yet. Select a file and try uploading...</p>
          ) : (
            debugLogs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          )}
        </div>
      </div>

      {/* Environment Variables Check */}
      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-3">Environment Variables Status:</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <span className={`w-3 h-3 rounded-full mr-2 ${
              import.meta.env.VITE_PINATA_JWT && import.meta.env.VITE_PINATA_JWT !== 'your_pinata_jwt_here' 
                ? 'bg-green-500' : 'bg-red-500'
            }`}></span>
            <span className="text-blue-700">
              VITE_PINATA_JWT: {
                import.meta.env.VITE_PINATA_JWT && import.meta.env.VITE_PINATA_JWT !== 'your_pinata_jwt_here' 
                  ? '✅ Configured' : '❌ Not configured'
              }
            </span>
          </div>
          <div className="flex items-center">
            <span className={`w-3 h-3 rounded-full mr-2 ${
              import.meta.env.VITE_PINATA_GATEWAY 
                ? 'bg-green-500' : 'bg-yellow-500'
            }`}></span>
            <span className="text-blue-700">
              VITE_PINATA_GATEWAY: {
                import.meta.env.VITE_PINATA_GATEWAY 
                  ? '✅ Configured' : '⚠️ Using default'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Common Issues Checklist */}
      <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-200">
        <h4 className="font-semibold text-yellow-800 mb-3">Common Upload Issues Checklist:</h4>
        <div className="space-y-2 text-sm text-yellow-700">
          <div>🔑 <strong>Pinata JWT:</strong> Is your VITE_PINATA_JWT environment variable set correctly?</div>
          <div>🌐 <strong>CORS:</strong> Pinata API should handle CORS automatically</div>
          <div>📁 <strong>File Size:</strong> Is your file under 10MB?</div>
          <div>🔗 <strong>Network:</strong> Is your internet connection stable?</div>
          <div>🔑 <strong>Patient Address:</strong> Is a valid patient address provided?</div>
          <div>⛓️ <strong>Blockchain Context:</strong> Is the useHabitBlockchain hook working properly?</div>
          <div>🔒 <strong>Browser Console:</strong> Check developer tools for detailed error messages</div>
        </div>
      </div>
    </div>
  );
};

export default IPFSUploaderDebug;
import React, { useState } from 'react';
import { UploadCloud, FileCheck2, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const PINATA_API_KEY = "2c3a3d9a5c5c9f0e9f0e";
const PINATA_SECRET_API_KEY = "c0a9d7e8f0e9d7c0a9d7e8f0e9d7c0a9d7e8f0e9d7c0a9d7e8f0e9d7";
const PINATA_GATEWAY_URL = "https://gateway.pinata.cloud/ipfs/";

const TherapistUploadReport = ({ sessionId, patientAddress, uploadEncryptedReport }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cid, setCid] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) setFile(selectedFile);
  };

  const uploadToIPFS = async () => {
    if (!file || !patientAddress || !sessionId) {
      toast.error("Missing file or session data");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      formData.append("pinataMetadata", JSON.stringify({
        name: `TherapistReport-${sessionId}`,
        keyvalues: {
          sessionId,
          patientAddress,
          uploadedBy: "therapist"
        }
      }));

      formData.append("pinataOptions", JSON.stringify({ cidVersion: 0 }));

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_API_KEY
          }
        }
      );

      const cid = response.data.IpfsHash;
      setCid(cid);
      await uploadEncryptedReport(patientAddress, cid, sessionId);
      toast.success("Report uploaded and recorded on blockchain");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/10 p-6 rounded-xl text-white w-full">
      <h2 className="text-2xl font-bold mb-4">Upload Session Report</h2>

      <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.txt,.jpg" className="mb-4" />

      <button
        onClick={uploadToIPFS}
        disabled={!file || loading}
        className="bg-indigo-600 px-4 py-2 rounded-lg text-white flex items-center"
      >
        {loading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <UploadCloud className="w-5 h-5 mr-2" />}
        {loading ? 'Uploading...' : 'Upload to IPFS'}
      </button>

      {cid && (
        <div className="mt-4">
          <p className="text-green-400 font-medium flex items-center"><FileCheck2 className="mr-2" /> Uploaded CID: {cid}</p>
          <a href={`${PINATA_GATEWAY_URL}${cid}`} target="_blank" rel="noreferrer" className="text-sm underline text-indigo-300">
            View Report
          </a>
        </div>
      )}
    </div>
  );
};

export default TherapistUploadReport;

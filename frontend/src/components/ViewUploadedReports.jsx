import React, { useState } from 'react';
import { FileText, Eye, Loader2, Download } from 'lucide-react';
import axios from 'axios';

const PINATA_GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs/';

const ViewUploadedReports = ({ reports }) => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [loadingCID, setLoadingCID] = useState('');

  const handleViewReport = async (report) => {
    try {
      setLoadingCID(report.cid);
      // Simulate decrypting logic (this could be replaced by actual decryption if needed)
      const response = await axios.get(`${PINATA_GATEWAY_URL}${report.cid}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      setSelectedReport({ ...report, url });
    } catch (error) {
      console.error('Error fetching file from IPFS:', error);
      alert('Failed to retrieve the report.');
    } finally {
      setLoadingCID('');
    }
  };

  return (
    <div className="p-6 bg-white/10 border border-white/20 rounded-xl">
      <h3 className="text-2xl font-bold text-white mb-4">📂 Patient Reports</h3>
      {reports.length === 0 ? (
        <p className="text-white/60">No reports uploaded yet.</p>
      ) : (
        <ul className="space-y-4">
          {reports.map((report) => (
            <li
              key={report.cid}
              className="bg-white/5 p-4 rounded-lg border border-white/10 text-white flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5" />
                <span className="truncate max-w-xs">{report.sessionId}</span>
              </div>
              <button
                onClick={() => handleViewReport(report)}
                className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-white flex items-center"
              >
                {loadingCID === report.cid ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Eye className="w-5 h-5 mr-2" />
                )}
                View
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedReport && (
        <div className="mt-8 bg-white/10 p-6 rounded-xl border border-white/20">
          <h4 className="text-xl font-semibold text-white mb-2">🔍 Report for Session: {selectedReport.sessionId}</h4>
          <a
            href={selectedReport.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-indigo-400 hover:text-indigo-200"
          >
            <Download className="w-5 h-5 mr-2" /> Download / View Report
          </a>
        </div>
      )}
    </div>
  );
};

export default ViewUploadedReports;

// src/components/WalletConnection.js
import React from 'react';
import { useContract } from '../hooks/useContract';

const WalletConnection = () => {
  const { address, isConnected, connectWallet, disconnectWallet } = useContract();

  const shortenAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="wallet-connection">
      {!isConnected ? (
        <button 
          onClick={connectWallet}
          className="connect-btn"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="connected-wallet">
          <span>Connected: {shortenAddress(address)}</span>
          <button 
            onClick={disconnectWallet}
            className="disconnect-btn"
          >
            Disconnect
          </button>
        </div>
      )}
      
      <style jsx>{`
        .wallet-connection {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
        }
        
        .connect-btn, .disconnect-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .connect-btn:hover, .disconnect-btn:hover {
          background: #0056b3;
        }
        
        .disconnect-btn {
          background: #dc3545;
          margin-left: 10px;
        }
        
        .disconnect-btn:hover {
          background: #c82333;
        }
        
        .connected-wallet {
          display: flex;
          align-items: center;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default WalletConnection;
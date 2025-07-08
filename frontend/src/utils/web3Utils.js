// src/utils/web3Utils.js
import { ethers } from 'ethers';

export const connectWallet = async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      
      return { provider, signer, address };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  } else {
    throw new Error('MetaMask is not installed');
  }
};

export const getContract = (contractAddress, abi, signerOrProvider) => {
  return new ethers.Contract(contractAddress, abi, signerOrProvider);
};

export const formatTokens = (amount) => {
  return ethers.utils.formatEther(amount);
};

export const parseTokens = (amount) => {
  return ethers.utils.parseEther(amount.toString());
};
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config();

const uploadToPinata = async (filePath) => {
  const data = new FormData();
  data.append('file', fs.createReadStream(filePath));

  try {
    const res = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      data,
      {
        maxBodyLength: 'Infinity',
        headers: {
          ...data.getHeaders(),
          Authorization: `Bearer ${process.env.PINATA_JWT}`
        }
      }
    );
    console.log('IPFS CID:', res.data.IpfsHash);
    return res.data.IpfsHash;
  } catch (err) {
    console.error('Upload error:', err.response?.data || err.message);
  }
};

uploadToPinata('./uploads/report.pdf');

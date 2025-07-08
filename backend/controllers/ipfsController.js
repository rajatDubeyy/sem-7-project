// controllers/ipfsController.js
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

 const uploadToIPFS = async (req, res) => {
  try {
    const filePath = req.file.path;

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        maxBodyLength: 'Infinity',
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${process.env.PINATA_JWT}`
        }
      }
    );

    fs.unlinkSync(filePath); // optional cleanup

    res.status(200).json({ cid: response.data.IpfsHash });
  } catch (err) {
    console.error('IPFS upload error:', err.message);
    res.status(500).json({ error: 'Failed to upload to IPFS' });
  }
};
export default uploadToIPFS;
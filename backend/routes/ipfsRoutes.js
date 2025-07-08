// routes/ipfsRoutes.js
import express from 'express';
const router = express.Router();
import multer from 'multer';
import uploadToIPFS from '../controllers/ipfsController.js';

const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'), uploadToIPFS);

export default router;

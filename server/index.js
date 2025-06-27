import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3001;
const ENV = process.env.NODE_ENV || 'development';

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'kesseh-galleries';
const REGION = process.env.AWS_REGION || 'us-east-1';

// AWS S3 Configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: REGION
});

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false // You can fine-tune this later if needed
}));

app.use(cors({
  origin: ENV === 'production' ? true : 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🟢 Serve frontend static files
const DIST_PATH = path.join(__dirname, '../dist');
app.use(express.static(DIST_PATH, { maxAge: '1y', etag: false }));

// Multer config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  }
});

// 🔵 Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 📤 Upload image
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const fileExtension = path.extname(req.file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const key = `images/${fileName}`;

    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      Metadata: {
        originalName: req.file.originalname,
        uploadedAt: new Date().toISOString()
      }
    };

    const result = await s3.upload(uploadParams).promise();
    const publicUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;

    res.json({ success: true, url: publicUrl, key: result.Key, fileName });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image', details: error.message });
  }
});

// 📷 Get all images with pagination
app.get('/api/images', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const prefix = req.query.prefix || 'images/';

    let allObjects = [];
    let continuationToken = null;

    do {
      const params = {
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: continuationToken
      };

      const data = await s3.listObjectsV2(params).promise();
      if (data.Contents) allObjects = allObjects.concat(data.Contents);
      continuationToken = data.NextContinuationToken;
    } while (continuationToken);

    const imageObjects = allObjects
      .filter(obj => obj.Key !== prefix && obj.Size > 0)
      .sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified));

    const totalCount = imageObjects.length;
    const totalPages = Math.ceil(totalCount / limit);
    const paginatedObjects = imageObjects.slice((page - 1) * limit, page * limit);

    const images = paginatedObjects.map(obj => ({
      key: obj.Key,
      url: `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${obj.Key}`,
      lastModified: obj.LastModified,
      size: obj.Size
    }));

    res.json({ images, totalCount, totalPages, currentPage: page, hasMore: page < totalPages });
  } catch (error) {
    console.error('Get images error:', error);
    res.status(500).json({ error: 'Failed to fetch images', details: error.message });
  }
});

// 🗑️ Delete image
app.delete('/api/images/:key(*)', async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    await s3.deleteObject({ Bucket: BUCKET_NAME, Key: key }).promise();
    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete image', details: error.message });
  }
});

// 📄 Get metadata
app.get('/api/images/:key(*)/metadata', async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const metadata = await s3.headObject({ Bucket: BUCKET_NAME, Key: key }).promise();

    res.json({
      key,
      size: metadata.ContentLength,
      lastModified: metadata.LastModified,
      contentType: metadata.ContentType,
      metadata: metadata.Metadata
    });
  } catch (error) {
    console.error('Metadata error:', error);
    res.status(500).json({ error: 'Failed to get image metadata', details: error.message });
  }
});

// 🧩 Catch-all to serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_PATH, 'index.html'));
});

// 🔥 Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Max size is 10MB.' });
  }
  res.status(500).json({ error: 'Internal server error', details: ENV === 'development' ? error.message : undefined });
});

const INDEX_FILE = path.join(DIST_PATH, 'index.html');
try {
  const html = fs.readFileSync(INDEX_FILE, 'utf-8');
  console.log('📄 index.html content:\n\n', html);
} catch (err) {
  console.error('❌ Failed to read index.html:', err);
}
// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Kesseh Galleries server running on port ${PORT}`);
  console.log(`📊 Environment: ${ENV}`);
  console.log(`🪣 S3 Bucket: ${BUCKET_NAME}`);
  console.log(`📁 Serving frontend from: ${DIST_PATH}`);
});

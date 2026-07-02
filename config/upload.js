// config/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    'uploads/students',
    'uploads/teachers',
    'uploads/schools',
    'uploads/forms',      // ← Added for form uploads
    'uploads/temp'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
};

createUploadDirs();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine folder based on file type
    let folder = 'uploads/temp/';
    
    if (req.body.type === 'student' || req.body.type === 'students' || req.baseUrl?.includes('students')) {
      folder = 'uploads/students/';
    } else if (req.body.type === 'teacher' || req.body.type === 'teachers' || req.body.type === 'staff' || req.baseUrl?.includes('staff')) {
      folder = 'uploads/teachers/';
    } else if (req.body.type === 'school' || req.body.type === 'logo' || req.baseUrl?.includes('school')) {
      folder = 'uploads/schools/';
    } else if (req.body.type === 'form' || req.body.type === 'forms' || req.baseUrl?.includes('forms')) {
      folder = 'uploads/forms/';
    } else {
      folder = 'uploads/temp/';
    }
    
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    
    // Clean filename: remove spaces and special characters
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '_');
    
    cb(null, cleanName + '-' + uniqueSuffix + ext);
  }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|bmp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp, bmp, svg)'));
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  next();
};

module.exports = { upload, handleMulterError };
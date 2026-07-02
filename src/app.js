require('express-async-errors');
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const path    = require('path');
const fs      = require('fs');

const app = express();

// ── Security & parsing ─────────────────────────
app.use(helmet());

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://sm.syntrobit.com',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman, or same-origin)
    if (!origin) return callback(null, true);
    
    const clientUrl = process.env.CLIENT_URL;
    const origins = [...allowedOrigins];
    if (clientUrl) {
      origins.push(clientUrl);
      origins.push(clientUrl.replace(/\/$/, "")); // remove trailing slash
    }
    
    // Check if the request origin matches any allowed origin
    const isAllowed = origins.some(opt => {
      const normalizedOpt = opt.replace(/\/$/, "").toLowerCase();
      const normalizedOrigin = origin.replace(/\/$/, "").toLowerCase();
      return normalizedOpt === normalizedOrigin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Ensure upload directories exist ────────────
const createUploadDirs = () => {
  const dirs = [
    'uploads/students',
    'uploads/teachers',
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

// ── Serve uploaded files statically ────────────
app.use('/uploads', express.static('uploads'));
app.use('/images', express.static('uploads'));

// ── Logging middleware ─────────────────────────
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

// ── Health checks ──────────────────────────────
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: '✅ SIDCMS API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'OK', 
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

// ── Test route ──────────────────────────────────
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'Test endpoint works!',
    timestamp: new Date().toISOString()
  });
});

// ── Routes ─────────────────────────────────────
app.use('/api/auth',     require('./routes/auth.routes'));
app.use('/api/schools',  require('./routes/school.routes'));
app.use('/api/students', require('./routes/student.routes'));
app.use('/api/staff',    require('./routes/staff.routes'));
app.use('/api/classes',  require('./routes/class.routes'));
app.use('/api/forms', require('./routes/forms.routes'));

// ── 404 handler ─────────────────────────────────
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.url} not found`
  });
});

// ── Global error handler ───────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

module.exports = app;
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Test endpoint works!',
    timestamp: new Date().toISOString()
  });
});

// Login endpoint (mock)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@abcschool.com' && password === 'admin123') {
    res.json({
      success: true,
      token: 'mock_token_12345',
      user: { id: 1, name: 'Admin', email: 'admin@abcschool.com', role: 'admin' }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Classes endpoint
app.get('/api/classes', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, class_name: 'Class 1', class_teacher: 'Mr. John', academic_year: '2024' },
      { id: 2, class_name: 'Class 2', class_teacher: 'Ms. Jane', academic_year: '2024' }
    ],
    count: 2
  });
});

// Students endpoint
app.get('/api/students', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'Alice Johnson', roll_no: '001', class: '1', section: 'A', gender: 'Female' },
      { id: 2, name: 'Bob Smith', roll_no: '002', class: '1', section: 'A', gender: 'Male' },
      { id: 3, name: 'Charlie Brown', roll_no: '001', class: '5', section: 'A', gender: 'Male' }
    ],
    count: 3
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
  console.log(`📋 Available routes:`);
  console.log(`   GET  http://localhost:${PORT}/api/health`);
  console.log(`   GET  http://localhost:${PORT}/api/test`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   GET  http://localhost:${PORT}/api/classes`);
  console.log(`   GET  http://localhost:${PORT}/api/students`);
});
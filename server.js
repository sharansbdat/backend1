const app = require('./src/app');
const path = require('path');  // ← ADD THIS
require('dotenv').config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n========================================`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
  console.log(`🔗 Files accessible at: http://localhost:${PORT}/uploads/`);
  console.log(`\n📋 Available routes:`);
  console.log(`   GET  http://localhost:${PORT}/`);
  console.log(`   GET  http://localhost:${PORT}/api/health`);
  console.log(`   GET  http://localhost:${PORT}/api/test`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   GET  http://localhost:${PORT}/api/students`);
  console.log(`   GET  http://localhost:${PORT}/api/classes`);
  console.log(`   POST http://localhost:${PORT}/api/classes`);
  console.log(`   GET  http://localhost:${PORT}/api/staff`);
  console.log(`\n🔑 Test credentials:`);
  console.log(`   Email: admin@abcschool.com`);
  console.log(`   Password: admin123`);
  console.log(`========================================\n`);
});
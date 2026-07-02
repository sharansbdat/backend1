const router = require('express').Router();
const { authenticateToken: auth } = require('../middlewares/auth');
const { uploadStudentPhoto } = require('../middlewares/upload');
const c = require('../controllers/student.controller');

// ─── Student Routes ──────────────────────────────────────────────────────────

// GET all students (includes student_id)
router.get('/', auth, c.getAllStudents);

// GET single student by ID (includes student_id)
router.get('/:id', auth, c.getStudent);

// GET student by student_id (SID-YYYY-XXXXX)
router.get('/student-id/:studentId', auth, c.getStudentByStudentId);

// GET students by class (includes student_id)
router.get('/class/:className', auth, c.getStudentsByClass);

// Check if student_id is available
router.get('/check-id/:studentId', auth, c.checkStudentIdAvailability);

// POST create student (auto-generates student_id if not provided)
router.post('/', auth, uploadStudentPhoto, c.createStudent);

// PUT update student (preserves existing student_id)
router.put('/:id', auth, uploadStudentPhoto, c.updateStudent);

// DELETE student (returns student_id in response)
router.delete('/:id', auth, c.deleteStudent);

module.exports = router;
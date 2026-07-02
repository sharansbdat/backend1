const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken: auth } = require('../middlewares/auth');

// GET all classes
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM classes WHERE school_id=$1
       ORDER BY academic_year DESC, class_name ASC`,
      [req.user.school_id]
    );
    res.json({ success: true, data: rows, count: rows.length });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch classes' });
  }
});

// GET single class
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM classes WHERE id=$1 AND school_id=$2`,
      [req.params.id, req.user.school_id]
    );
    if (!rows[0]) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch class' });
  }
});

// CREATE new class
router.post('/', auth, async (req, res) => {
  try {
    console.log('📝 Received body:', req.body);

    const { 
      className,
      classTeacher,
      roomNumber,
      academicYear,
      description,
      sections,
      gradeLevel,
      status,
      maxStudents
    } = req.body;

    // Validate required fields
    if (!className) {
      return res.status(400).json({ success: false, error: 'Class name is required' });
    }
    if (!academicYear) {
      return res.status(400).json({ success: false, error: 'Academic year is required' });
    }

    // Check for duplicate class
    const existing = await pool.query(
      `SELECT id FROM classes WHERE class_name=$1 AND academic_year=$2 AND school_id=$3`,
      [className, academicYear, req.user.school_id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Class "${className}" already exists for academic year ${academicYear}`
      });
    }

    // ✅ INSERT - only include columns that exist in your table
    // Check your table structure first! These columns must exist:
    // class_name, class_teacher, room_number, academic_year, description, 
    // section, grade_level, status, max_students, school_id, created_by
    const { rows } = await pool.query(
      `INSERT INTO classes
         (class_name, class_teacher, room_number, academic_year, description, 
          section, grade_level, status, max_students, school_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        className,
        classTeacher || null,
        roomNumber || null,
        academicYear,
        description || null,
        sections || 'A',
        gradeLevel || null,
        status || 'Active',
        maxStudents || 50,
        req.user.school_id,
        req.user.id
      ]
    );

    console.log('✅ Class created:', rows[0]);

    res.status(201).json({ 
      success: true, 
      data: rows[0], 
      message: 'Class created successfully' 
    });
  } catch (error) {
    console.error('❌ Error creating class:', error);
    console.error('❌ Error details:', error.detail);
    res.status(500).json({ success: false, error: error.message || 'Failed to create class' });
  }
});

// UPDATE class
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('📝 Update body:', req.body);

    const { 
      className,
      classTeacher,
      roomNumber,
      academicYear,
      description,
      sections,
      gradeLevel,
      status,
      maxStudents
    } = req.body;

    // Check if class exists
    const existing = await pool.query(
      `SELECT * FROM classes WHERE id=$1 AND school_id=$2`,
      [req.params.id, req.user.school_id]
    );
    if (!existing.rows[0]) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }
    const current = existing.rows[0];

    // ✅ UPDATE using only existing columns
    const { rows } = await pool.query(
      `UPDATE classes SET
         class_name=$1, class_teacher=$2, room_number=$3,
         academic_year=$4, description=$5, section=$6,
         grade_level=$7, status=$8, max_students=$9,
         updated_at=CURRENT_TIMESTAMP
       WHERE id=$10 RETURNING *`,
      [
        className || current.class_name,
        classTeacher !== undefined ? classTeacher : current.class_teacher,
        roomNumber !== undefined ? roomNumber : current.room_number,
        academicYear || current.academic_year,
        description !== undefined ? description : current.description,
        sections !== undefined ? sections : current.section,
        gradeLevel !== undefined ? gradeLevel : current.grade_level,
        status || current.status || 'Active',
        maxStudents !== undefined ? maxStudents : current.max_students || 50,
        req.params.id
      ]
    );

    res.json({ success: true, data: rows[0], message: 'Class updated successfully' });
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to update class' });
  }
});

// DELETE class
router.delete('/:id', auth, async (req, res) => {
  try {
    const existing = await pool.query(
      `SELECT id FROM classes WHERE id=$1 AND school_id=$2`,
      [req.params.id, req.user.school_id]
    );
    if (!existing.rows[0]) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }
    await pool.query(`DELETE FROM classes WHERE id=$1`, [req.params.id]);
    res.json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ success: false, error: 'Failed to delete class' });
  }
});

module.exports = router;
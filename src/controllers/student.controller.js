const pool = require('../config/db');
const { cloudinary } = require('../config/cloudinary');

// ─── Helper: Generate Student ID ──────────────────────────────────────────────
const generateStudentId = async (pool, school_id) => {
  try {
    // Get the latest student_id for this school
    const lastIdResult = await pool.query(
      `SELECT student_id FROM students 
       WHERE student_id LIKE 'SID-%' AND school_id = $1 
       ORDER BY student_id DESC LIMIT 1`,
      [school_id]
    );
    
    let lastNumber = 0;
    if (lastIdResult.rows.length > 0) {
      const parts = lastIdResult.rows[0].student_id.split('-');
      lastNumber = parseInt(parts[parts.length - 1], 10) || 0;
    }
    
    const year = new Date().getFullYear();
    const paddedCount = String(lastNumber + 1).padStart(5, '0');
    return `SID-${year}-${paddedCount}`;
  } catch (error) {
    console.error('Error generating student_id:', error);
    // Fallback: use timestamp-based ID
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-5);
    return `SID-${year}-${timestamp}`;
  }
};

// ── GET ALL STUDENTS ──────────────────────────────────────────────────────────
exports.getAllStudents = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { class: cls, section, search } = req.query;

    let query  = 'SELECT * FROM students WHERE school_id = $1';
    let params = [school_id];
    let i      = 2;

    if (cls)    { query += ` AND class   = $${i++}`;                              params.push(cls); }
    if (section){ query += ` AND section = $${i++}`;                              params.push(section); }
    if (search) { query += ` AND (name ILIKE $${i} OR roll_no ILIKE $${i++})`;   params.push(`%${search}%`); }

    query += ' ORDER BY class, section, roll_no';

    const result = await pool.query(query, params);
    
    // Ensure student_id is included for all students
    const students = result.rows.map(student => ({
      ...student,
      student_id: student.student_id || `SID-${new Date().getFullYear()}-${String(student.id).slice(-5).padStart(5, '0')}`
    }));
    
    res.json({ 
      success: true, 
      data: students, 
      count: students.length 
    });

  } catch (error) {
    console.error('❌ Error fetching students:', error);
    res.status(500).json({ error: error.message });
  }
};

// ── GET SINGLE STUDENT ────────────────────────────────────────────────────────
exports.getStudent = async (req, res) => {
  try {
    const { id }      = req.params;
    const school_id   = req.user.school_id;

    const result = await pool.query(
      'SELECT * FROM students WHERE id = $1 AND school_id = $2',
      [id, school_id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Student not found' });

    const student = {
      ...result.rows[0],
      student_id: result.rows[0].student_id || `SID-${new Date().getFullYear()}-${String(id).slice(-5).padStart(5, '0')}`
    };

    res.json({ success: true, data: student });

  } catch (error) {
    console.error('❌ Error fetching student:', error);
    res.status(500).json({ error: error.message });
  }
};

// ── GET STUDENT BY STUDENT_ID ────────────────────────────────────────────────
exports.getStudentByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;
    const school_id = req.user.school_id;

    const result = await pool.query(
      'SELECT * FROM students WHERE student_id = $1 AND school_id = $2',
      [studentId, school_id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Student not found' });

    res.json({ success: true, data: result.rows[0] });

  } catch (error) {
    console.error('❌ Error fetching student by student_id:', error);
    res.status(500).json({ error: error.message });
  }
};

// ── CREATE STUDENT ────────────────────────────────────────────────────────────
exports.createStudent = async (req, res) => {
  try {
    console.log('📥 Create student body:', req.body);
    console.log('👤 User from token:',    req.user);
    console.log('📷 File:',               req.file);

    const {
      name, roll_no, class: className, section,
      father_name, phone, email, address,
      dob, blood_group, gender,
      student_id,  // Optional: client can provide, otherwise auto-generate
      enrollment_year
    } = req.body;

    // Validate required fields
    if (!name || !name.trim())
      return res.status(400).json({ error: 'Student name is required' });
    if (!roll_no || !roll_no.trim())
      return res.status(400).json({ error: 'Roll number is required' });

    const school_id = req.user.school_id;
    if (!school_id)
      return res.status(400).json({ error: 'Your account is not linked to a school. Please contact admin.' });

    // Check duplicate roll_no in same school
    const existing = await pool.query(
      'SELECT id FROM students WHERE school_id = $1 AND roll_no = $2',
      [school_id, roll_no.trim()]
    );
    if (existing.rows.length > 0)
      return res.status(409).json({ error: `Roll number "${roll_no}" already exists in this school` });

    // Generate or use provided student_id
    let finalStudentId = student_id;
    if (!finalStudentId) {
      finalStudentId = await generateStudentId(pool, school_id);
    }

    // Photo from Cloudinary (if uploaded)
    const photo_url       = req.file?.path     || req.file?.secure_url || null;
    const photo_public_id = req.file?.filename || req.file?.public_id  || null;

    const result = await pool.query(
      `INSERT INTO students
         (school_id, name, roll_no, class, section, father_name,
          phone, email, address, dob, blood_group, gender,
          photo_url, photo_public_id, student_id, enrollment_year)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        school_id,
        name.trim(),
        roll_no.trim(),
        className    || null,
        section      || null,
        father_name  || null,
        phone        || null,
        email        || null,
        address      || null,
        dob          || null,
        blood_group  || null,
        gender       || null,
        photo_url,
        photo_public_id,
        finalStudentId,
        enrollment_year || new Date().getFullYear().toString()
      ]
    );

    console.log('✅ Student created:', result.rows[0].id);
    console.log('📋 Student ID:', finalStudentId);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Student created successfully',
      student_id: finalStudentId
    });

  } catch (error) {
    console.error('❌ Error creating student:', error);
    res.status(500).json({ error: error.message, detail: error.detail });
  }
};

// ── UPDATE STUDENT ────────────────────────────────────────────────────────────
exports.updateStudent = async (req, res) => {
  try {
    const { id }    = req.params;
    const school_id = req.user.school_id;

    const {
      name, roll_no, class: className, section,
      father_name, phone, email, address,
      dob, blood_group, gender,
    } = req.body;

    // Get existing student to preserve student_id
    const existing = await pool.query(
      'SELECT student_id, photo_public_id FROM students WHERE id = $1 AND school_id = $2',
      [id, school_id]
    );
    
    if (existing.rows.length === 0)
      return res.status(404).json({ error: 'Student not found' });

    let photo_url, photo_public_id;
    if (req.file) {
      // Delete old photo from Cloudinary
      if (existing.rows[0]?.photo_public_id)
        await cloudinary.uploader.destroy(existing.rows[0].photo_public_id);
      photo_url       = req.file.path     || req.file.secure_url;
      photo_public_id = req.file.filename || req.file.public_id;
    }

    // Build update query dynamically
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined && name !== null) { updateFields.push(`name = $${paramCount++}`); values.push(name); }
    if (roll_no !== undefined && roll_no !== null) { updateFields.push(`roll_no = $${paramCount++}`); values.push(roll_no); }
    if (className !== undefined && className !== null) { updateFields.push(`class = $${paramCount++}`); values.push(className); }
    if (section !== undefined && section !== null) { updateFields.push(`section = $${paramCount++}`); values.push(section); }
    if (father_name !== undefined && father_name !== null) { updateFields.push(`father_name = $${paramCount++}`); values.push(father_name); }
    if (phone !== undefined && phone !== null) { updateFields.push(`phone = $${paramCount++}`); values.push(phone); }
    if (email !== undefined && email !== null) { updateFields.push(`email = $${paramCount++}`); values.push(email); }
    if (address !== undefined && address !== null) { updateFields.push(`address = $${paramCount++}`); values.push(address); }
    if (dob !== undefined && dob !== null) { updateFields.push(`dob = $${paramCount++}`); values.push(dob); }
    if (blood_group !== undefined && blood_group !== null) { updateFields.push(`blood_group = $${paramCount++}`); values.push(blood_group); }
    if (gender !== undefined && gender !== null) { updateFields.push(`gender = $${paramCount++}`); values.push(gender); }
    if (req.file) { updateFields.push(`photo_url = $${paramCount++}`); values.push(photo_url); }
    if (req.file) { updateFields.push(`photo_public_id = $${paramCount++}`); values.push(photo_public_id); }
    
    // Always update updated_at
    updateFields.push(`updated_at = NOW()`);

    if (updateFields.length === 1) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Add id and school_id for WHERE clause
    values.push(id, school_id);

    const result = await pool.query(
      `UPDATE students 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount} AND school_id = $${paramCount + 1}
       RETURNING *`,
      values
    );

    res.json({ 
      success: true, 
      data: result.rows[0], 
      message: 'Student updated successfully' 
    });

  } catch (error) {
    console.error('❌ Error updating student:', error);
    res.status(500).json({ error: error.message });
  }
};

// ── DELETE STUDENT ────────────────────────────────────────────────────────────
exports.deleteStudent = async (req, res) => {
  try {
    const { id }    = req.params;
    const school_id = req.user.school_id;

    // Get student info before deletion
    const student = await pool.query(
      'SELECT photo_public_id, student_id, name FROM students WHERE id = $1 AND school_id = $2',
      [id, school_id]
    );
    
    if (student.rows.length === 0)
      return res.status(404).json({ error: 'Student not found' });

    // Delete photo from Cloudinary
    if (student.rows[0]?.photo_public_id)
      await cloudinary.uploader.destroy(student.rows[0].photo_public_id);

    const result = await pool.query(
      'DELETE FROM students WHERE id=$1 AND school_id=$2 RETURNING id',
      [id, school_id]
    );

    res.json({ 
      success: true, 
      message: 'Student deleted successfully',
      data: {
        id: result.rows[0].id,
        student_id: student.rows[0].student_id,
        name: student.rows[0].name
      }
    });

  } catch (error) {
    console.error('❌ Error deleting student:', error);
    res.status(500).json({ error: error.message });
  }
};

// ── GET STUDENTS BY CLASS ─────────────────────────────────────────────────────
exports.getStudentsByClass = async (req, res) => {
  try {
    const { className } = req.params;
    const school_id = req.user.school_id;

    const result = await pool.query(
      `SELECT * FROM students 
       WHERE class = $1 AND school_id = $2
       ORDER BY roll_no`,
      [className, school_id]
    );
    
    const students = result.rows.map(student => ({
      ...student,
      student_id: student.student_id || `SID-${new Date().getFullYear()}-${String(student.id).slice(-5).padStart(5, '0')}`
    }));

    res.json({ 
      success: true, 
      data: students, 
      count: students.length 
    });

  } catch (error) {
    console.error('❌ Error fetching students by class:', error);
    res.status(500).json({ error: error.message });
  }
};

// ── CHECK STUDENT ID AVAILABILITY ────────────────────────────────────────────
exports.checkStudentIdAvailability = async (req, res) => {
  try {
    const { studentId } = req.params;
    const school_id = req.user.school_id;

    const result = await pool.query(
      'SELECT id FROM students WHERE student_id = $1 AND school_id = $2',
      [studentId, school_id]
    );

    res.json({ 
      success: true, 
      available: result.rows.length === 0 
    });

  } catch (error) {
    console.error('❌ Error checking student ID:', error);
    res.status(500).json({ error: error.message });
  }
};
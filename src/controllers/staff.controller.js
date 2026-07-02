// controllers/staff.controller.js
const pool = require('../config/db');
const { cloudinary } = require('../config/cloudinary');

// ============================================
// GET ALL STAFF
// ============================================
exports.getAllStaff = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const { type, department, search } = req.query;

    let query = 'SELECT * FROM staff WHERE school_id=$1';
    const params = [schoolId];
    let i = 2;

    if (type) { 
      query += ` AND type=$${i}`;
      params.push(type);
      i++;
    }
    if (department) {
      query += ` AND department=$${i}`;
      params.push(department);
      i++;
    }
    if (search) {
      query += ` AND (name ILIKE $${i} OR emp_id ILIKE $${i} OR department ILIKE $${i})`;
      params.push(`%${search}%`);
      i++;
    }

    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('❌ Error fetching staff:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// GET SINGLE STAFF
// ============================================
exports.getStaff = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM staff WHERE id=$1', [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Staff not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('❌ Error fetching staff:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// CREATE STAFF - ✅ FIXED (emp_id auto-generated)
// ============================================
exports.createStaff = async (req, res) => {
  try {
    const {
      name,
      type,
      department,
      subject,
      phone,
      email,
      address,
      doj,
    } = req.body;

    // ✅ Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        error: 'Staff name is required' 
      });
    }

    if (!type || type.trim() === '') {
      return res.status(400).json({ 
        error: 'Staff type is required (teaching or non-teaching)' 
      });
    }

    // ✅ Validate type
    if (!['teaching', 'non-teaching'].includes(type)) {
      return res.status(400).json({ 
        error: 'Type must be "teaching" or "non-teaching"' 
      });
    }

    // ✅ Handle photo upload
    const photo_url = req.file?.path || null;
    const photo_public_id = req.file?.filename || null;

    // ✅ Insert WITHOUT emp_id - let database auto-generate it
    const { rows } = await pool.query(
      `INSERT INTO staff
         (school_id, name, type, department, subject,
          phone, email, address, doj, photo_url, photo_public_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        req.user.school_id || 1,
        name.trim(),
        type,
        department || null,
        subject || null,
        phone || null,
        email || null,
        address || null,
        doj || null,
        photo_url,
        photo_public_id,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('❌ Error creating staff:', error);
    res.status(500).json({ 
      error: error.message,
      detail: error.detail 
    });
  }
};

// ============================================
// UPDATE STAFF
// ============================================
exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      department,
      subject,
      phone,
      email,
      address,
      doj,
    } = req.body;

    let photo_url, photo_public_id;
    
    // Handle photo upload
    if (req.file) {
      // Delete old photo from Cloudinary
      const existing = await pool.query(
        'SELECT photo_public_id FROM staff WHERE id=$1', [id]
      );
      if (existing.rows[0]?.photo_public_id) {
        await cloudinary.uploader.destroy(existing.rows[0].photo_public_id);
      }
      photo_url = req.file.path;
      photo_public_id = req.file.filename;
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount}`);
      values.push(name.trim());
      paramCount++;
    }
    if (type) {
      updates.push(`type = $${paramCount}`);
      values.push(type);
      paramCount++;
    }
    if (department) {
      updates.push(`department = $${paramCount}`);
      values.push(department);
      paramCount++;
    }
    if (subject) {
      updates.push(`subject = $${paramCount}`);
      values.push(subject);
      paramCount++;
    }
    if (phone) {
      updates.push(`phone = $${paramCount}`);
      values.push(phone);
      paramCount++;
    }
    if (email) {
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }
    if (address) {
      updates.push(`address = $${paramCount}`);
      values.push(address);
      paramCount++;
    }
    if (doj) {
      updates.push(`doj = $${paramCount}`);
      values.push(doj);
      paramCount++;
    }
    if (req.file) {
      updates.push(`photo_url = $${paramCount}`);
      values.push(photo_url);
      paramCount++;
      updates.push(`photo_public_id = $${paramCount}`);
      values.push(photo_public_id);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE staff SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const { rows } = await pool.query(query, values);
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('❌ Error updating staff:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// DELETE STAFF
// ============================================
exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete photo from Cloudinary if exists
    const { rows } = await pool.query(
      'SELECT photo_public_id FROM staff WHERE id=$1', [id]
    );
    if (rows[0]?.photo_public_id) {
      await cloudinary.uploader.destroy(rows[0].photo_public_id);
    }
    
    await pool.query('DELETE FROM staff WHERE id=$1', [id]);
    res.json({ message: 'Staff deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting staff:', error);
    res.status(500).json({ error: error.message });
  }
};
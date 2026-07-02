const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken: auth } = require('../middlewares/auth');

// ============================================
// GET all forms (admin only)
// ============================================
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM forms WHERE school_id=$1 ORDER BY created_at DESC`,
      [req.user.school_id]
    );

    // Attach response counts
    const formsWithCounts = await Promise.all(
      rows.map(async (form) => {
        const countResult = await pool.query(
          `SELECT COUNT(*) FROM form_submissions WHERE form_id=$1`,
          [form.form_id]
        );
        return {
          ...form,
          fieldData: form.field_data,
          hasPhoto: form.has_photo,
          formId: form.form_id,
          responses: parseInt(countResult.rows[0].count, 10),
          created: form.created_at,
        };
      })
    );

    res.json({ success: true, data: formsWithCounts });
  } catch (error) {
    console.error('❌ Error fetching forms:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET single form by formId (PUBLIC — no auth, parents need this to fill it out)
// ============================================
router.get('/public/:formId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM forms WHERE form_id=$1`,
      [req.params.formId]
    );
    if (!rows[0]) {
      return res.status(404).json({ success: false, error: 'Form not found' });
    }
    const form = rows[0];
    res.json({
      success: true,
      data: {
        ...form,
        fieldData: form.field_data,
        hasPhoto: form.has_photo,
        formId: form.form_id,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching public form:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// CREATE new form (admin only)
// ============================================
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, hasPhoto, fieldData } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Form name is required' });
    }

    const formId = `form_${Date.now()}`;

    const { rows } = await pool.query(
      `INSERT INTO forms (form_id, name, description, has_photo, field_data, school_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        formId,
        name.trim(),
        description || null,
        hasPhoto || false,
        JSON.stringify(fieldData || []),
        req.user.school_id,
        req.user.id,
      ]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('❌ Error creating form:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// UPDATE form — e.g. adding a field (admin only)
// ============================================
router.put('/:formId', auth, async (req, res) => {
  try {
    const { name, description, hasPhoto, fieldData, status } = req.body;

    const existing = await pool.query(
      `SELECT * FROM forms WHERE form_id=$1 AND school_id=$2`,
      [req.params.formId, req.user.school_id]
    );
    if (!existing.rows[0]) {
      return res.status(404).json({ success: false, error: 'Form not found' });
    }
    const current = existing.rows[0];

    const { rows } = await pool.query(
      `UPDATE forms SET
         name=$1, description=$2, has_photo=$3, field_data=$4, status=$5, updated_at=NOW()
       WHERE form_id=$6 RETURNING *`,
      [
        name || current.name,
        description !== undefined ? description : current.description,
        hasPhoto !== undefined ? hasPhoto : current.has_photo,
        JSON.stringify(fieldData !== undefined ? fieldData : current.field_data),
        status || current.status,
        req.params.formId,
      ]
    );

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('❌ Error updating form:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// DELETE form (admin only)
// ============================================
router.delete('/:formId', auth, async (req, res) => {
  try {
    const existing = await pool.query(
      `SELECT id FROM forms WHERE form_id=$1 AND school_id=$2`,
      [req.params.formId, req.user.school_id]
    );
    if (!existing.rows[0]) {
      return res.status(404).json({ success: false, error: 'Form not found' });
    }
    await pool.query(`DELETE FROM forms WHERE form_id=$1`, [req.params.formId]);
    res.json({ success: true, message: 'Form deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting form:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET submissions for a form (admin only)
// ============================================
router.get('/:formId/submissions', auth, async (req, res) => {
  try {
    const formCheck = await pool.query(
      `SELECT id FROM forms WHERE form_id=$1 AND school_id=$2`,
      [req.params.formId, req.user.school_id]
    );
    if (!formCheck.rows[0]) {
      return res.status(404).json({ success: false, error: 'Form not found' });
    }

    const { rows } = await pool.query(
      `SELECT * FROM form_submissions WHERE form_id=$1 ORDER BY submitted_at DESC`,
      [req.params.formId]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('❌ Error fetching submissions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// SUBMIT a form (PUBLIC — no auth, anyone with the link)
// ============================================
router.post('/:formId/submissions', async (req, res) => {
  try {
    const { data, photo } = req.body;

    const formCheck = await pool.query(
      `SELECT * FROM forms WHERE form_id=$1`,
      [req.params.formId]
    );
    if (!formCheck.rows[0]) {
      return res.status(404).json({ success: false, error: 'Form not found' });
    }
    const form = formCheck.rows[0];

    // Duplicate check by email/phone fields, mirroring the old localStorage logic
    const fieldData = form.field_data || [];
    const emailField = fieldData.find(
      (f) => f.type === 'email' || f.id?.toLowerCase().includes('email') || f.label?.toLowerCase().includes('email')
    );
    const phoneField = fieldData.find(
      (f) =>
        f.type === 'tel' ||
        f.id?.toLowerCase().includes('phone') ||
        f.id?.toLowerCase().includes('mobile') ||
        f.label?.toLowerCase().includes('phone') ||
        f.label?.toLowerCase().includes('mobile')
    );

    if (emailField || phoneField) {
      const { rows: existingSubs } = await pool.query(
        `SELECT submission_data FROM form_submissions WHERE form_id=$1`,
        [req.params.formId]
      );

      const email = emailField ? data[emailField.id] : null;
      const phone = phoneField ? data[phoneField.id] : null;

      for (const sub of existingSubs) {
        const subData = sub.submission_data || {};
        if (email && emailField && subData[emailField.id]?.toLowerCase() === email.toLowerCase()) {
          return res.status(400).json({
            success: false,
            error: `A submission with email "${email}" has already been received for this form.`,
          });
        }
        if (phone && phoneField && subData[phoneField.id] === phone) {
          return res.status(400).json({
            success: false,
            error: `A submission with phone number "${phone}" has already been received for this form.`,
          });
        }
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO form_submissions (form_id, submission_data, photo_data)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.params.formId, JSON.stringify(data), photo || null]
    );

    res.status(201).json({ success: true, data: rows[0], message: 'Form submitted successfully' });
  } catch (error) {
    console.error('❌ Error submitting form:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
const pool = require('../config/db');
const { cloudinary } = require('../config/cloudinary');

exports.getAllSchools = async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM schools ORDER BY created_at DESC'
  );
  res.json(rows);
};

exports.getSchool = async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM schools WHERE id=$1', [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'School not found' });
  res.json(rows[0]);
};

exports.createSchool = async (req, res) => {
  const { name, address, phone, email } = req.body;
  const logo_url       = req.file?.path     || null;
  const logo_public_id = req.file?.filename || null;

  const { rows } = await pool.query(
    `INSERT INTO schools (name, address, phone, email, logo_url, logo_public_id)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [name, address, phone, email, logo_url, logo_public_id]
  );
  res.status(201).json(rows[0]);
};

exports.updateSchool = async (req, res) => {
  const { id } = req.params;
  const { name, address, phone, email, status } = req.body;

  let logo_url, logo_public_id;
  if (req.file) {
    const existing = await pool.query(
      'SELECT logo_public_id FROM schools WHERE id=$1', [id]
    );
    if (existing.rows[0]?.logo_public_id)
      await cloudinary.uploader.destroy(existing.rows[0].logo_public_id);
    logo_url       = req.file.path;
    logo_public_id = req.file.filename;
  }

  const { rows } = await pool.query(
    `UPDATE schools
     SET name=$1, address=$2, phone=$3, email=$4, status=$5
     ${req.file ? ', logo_url=$6, logo_public_id=$7' : ''}
     WHERE id=${req.file ? '$8' : '$6'}
     RETURNING *`,
    req.file
      ? [name, address, phone, email, status, logo_url, logo_public_id, id]
      : [name, address, phone, email, status, id]
  );
  res.json(rows[0]);
};

exports.deleteSchool = async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    'SELECT logo_public_id FROM schools WHERE id=$1', [id]
  );
  if (rows[0]?.logo_public_id)
    await cloudinary.uploader.destroy(rows[0].logo_public_id);
  await pool.query('DELETE FROM schools WHERE id=$1', [id]);
  res.json({ message: 'School deleted successfully' });
};
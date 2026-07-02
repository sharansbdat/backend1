const pool   = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  const { rows } = await pool.query(
    `SELECT a.*, s.name AS school_name
     FROM admins a
     LEFT JOIN schools s ON s.id = a.school_id
     WHERE a.email = $1`,
    [email]
  );

  const admin = rows[0];
  if (!admin)
    return res.status(401).json({ error: 'Invalid email or password' });

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid)
    return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign(
    { id: admin.id, role: admin.role, school_id: admin.school_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    token,
    user: {
      id:          admin.id,
      name:        admin.name,
      email:       admin.email,
      role:        admin.role,
      school_id:   admin.school_id,
      school_name: admin.school_name,
    },
  });
};

exports.register = async (req, res) => {
  const { name, email, password, role = 'school', school_id } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });

  const existing = await pool.query(
    'SELECT id FROM admins WHERE email=$1', [email]
  );
  if (existing.rows.length > 0)
    return res.status(409).json({ error: 'Email already registered' });

  const hash = await bcrypt.hash(password, 10);

  const { rows } = await pool.query(
    `INSERT INTO admins (name, email, password, role, school_id)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id, name, email, role, school_id`,
    [name, email, hash, role, school_id || null]
  );

  res.status(201).json(rows[0]);
};

exports.getMe = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT a.id, a.name, a.email, a.role, a.school_id, s.name AS school_name
     FROM admins a
     LEFT JOIN schools s ON s.id = a.school_id
     WHERE a.id = $1`,
    [req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
};
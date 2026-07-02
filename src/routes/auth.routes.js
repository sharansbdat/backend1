const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../config/db');

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const result = await pool.query(
            `SELECT a.*, s.name as school_name 
             FROM admins a
             LEFT JOIN schools s ON s.id = a.school_id
             WHERE a.email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];
        console.log('👤 User found:', user.email);

        // Check password using bcrypt
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        console.log('✅ Login successful:', email);

        const token = jwt.sign(
            { 
                id: user.id, 
                role: user.role || 'admin',
                school_id: user.school_id 
            },
            process.env.JWT_SECRET || 'sidcms_super_secret_key_2024',
            { expiresIn: '7d' }
        );

        delete user.password;
        res.json({ token, user });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
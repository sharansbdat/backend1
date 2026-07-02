const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'sidcms',
    user: 'postgres',
    password: 'admin123',
});

async function hashPasswords() {
    try {
        console.log('🔐 Starting password hashing...');
        
        // Get all admins with plain text passwords
        const result = await pool.query(
            "SELECT id, email, password FROM admins WHERE password = 'admin123'"
        );
        
        if (result.rows.length === 0) {
            console.log('✅ All passwords are already hashed!');
            process.exit(0);
        }
        
        console.log(`📝 Found ${result.rows.length} admins to hash`);
        
        for (const admin of result.rows) {
            const hashed = await bcrypt.hash('admin123', 10);
            await pool.query(
                'UPDATE admins SET password = $1 WHERE id = $2',
                [hashed, admin.id]
            );
            console.log(`✅ Updated: ${admin.email}`);
        }
        
        console.log('✅ All passwords hashed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

hashPasswords();
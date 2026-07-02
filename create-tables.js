const pool = require('./config/db');

async function createTables() {
    try {
        console.log('📋 Creating database tables...');

        // Create schools table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS schools (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(50) UNIQUE NOT NULL,
                address TEXT,
                phone VARCHAR(20),
                email VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Schools table created');

        // Create admins table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'admin',
                school_id INTEGER REFERENCES schools(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Admins table created');

        // Create students table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS students (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                roll_no VARCHAR(50) NOT NULL,
                class VARCHAR(50) NOT NULL,
                section VARCHAR(10) DEFAULT 'A',
                father_name VARCHAR(255),
                mother_name VARCHAR(255),
                gender VARCHAR(20),
                dob DATE,
                email VARCHAR(255),
                phone VARCHAR(20),
                address TEXT,
                school_id INTEGER REFERENCES schools(id),
                created_by INTEGER REFERENCES admins(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(roll_no, school_id)
            )
        `);
        console.log('✅ Students table created');

        // Create classes table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS classes (
                id SERIAL PRIMARY KEY,
                class_name VARCHAR(100) NOT NULL,
                class_teacher VARCHAR(255),
                room_number VARCHAR(50),
                academic_year VARCHAR(20) NOT NULL,
                description TEXT,
                sections TEXT[] DEFAULT '{A,B}',
                school_id INTEGER REFERENCES schools(id),
                created_by INTEGER REFERENCES admins(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(class_name, academic_year, school_id)
            )
        `);
        console.log('✅ Classes table created');

        // Create staff table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS staff (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                emp_id VARCHAR(50) UNIQUE NOT NULL,
                type VARCHAR(50) NOT NULL,
                department VARCHAR(100),
                subject VARCHAR(100),
                phone VARCHAR(20),
                email VARCHAR(255),
                doj DATE,
                photo_url VARCHAR(255),
                school_id INTEGER REFERENCES schools(id),
                created_by INTEGER REFERENCES admins(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Staff table created');

        // Insert default school if not exists
        const schoolCheck = await pool.query(`SELECT * FROM schools WHERE code = 'ABC001'`);
        if (schoolCheck.rows.length === 0) {
            await pool.query(`
                INSERT INTO schools (name, code, address, phone, email)
                VALUES ('ABC School', 'ABC001', '123 Main Street, City', '+1234567890', 'admin@abcschool.com')
            `);
            console.log('✅ Default school created');
        }

        // Insert default admin if not exists
        const adminCheck = await pool.query(`SELECT * FROM admins WHERE email = 'admin@abcschool.com'`);
        if (adminCheck.rows.length === 0) {
            await pool.query(`
                INSERT INTO admins (name, email, password, role, school_id)
                VALUES ('Admin User', 'admin@abcschool.com', 'admin123', 'admin', 1)
            `);
            console.log('✅ Default admin created');
        }

        console.log('\n🎉 All tables created successfully!');
        console.log('🔑 Login with: admin@abcschool.com / admin123');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating tables:', error);
        process.exit(1);
    }
}

createTables();
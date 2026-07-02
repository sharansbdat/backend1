const pool = require('./config/db');

async function testConnection() {
    try {
        console.log('🔍 Testing database connection...');
        
        const result = await pool.query('SELECT NOW() as current_time, current_database() as database_name');
        console.log('✅ Database connected successfully!');
        console.log('📅 Current time:', result.rows[0].current_time);
        console.log('🗄️  Database:', result.rows[0].database_name);
        
        // Test if tables exist
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        if (tables.rows.length > 0) {
            console.log('\n📋 Tables in database:');
            tables.rows.forEach(table => {
                console.log(`   - ${table.table_name}`);
            });
        } else {
            console.log('\n📋 No tables found in database');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

testConnection();
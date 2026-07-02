const { sequelize } = require('./models');
const { User, School, Student, Class, Staff } = require('./models');

async function viewAllData() {
  try {
    console.log('📊 DATABASE CONTENTS\n' + '='.repeat(50));

    // Schools
    const schools = await School.findAll();
    console.log(`\n🏫 SCHOOLS (${schools.length}):`);
    schools.forEach(s => console.log(`   ${s.id}: ${s.name} (${s.code})`));

    // Users
    const users = await User.findAll();
    console.log(`\n👤 USERS (${users.length}):`);
    users.forEach(u => console.log(`   ${u.id}: ${u.name} (${u.email}) - ${u.role}`));

    // Classes
    const classes = await Class.findAll();
    console.log(`\n📚 CLASSES (${classes.length}):`);
    classes.forEach(c => console.log(`   ${c.id}: ${c.class_name} - ${c.class_teacher} (${c.academic_year})`));

    // Students
    const students = await Student.findAll();
    console.log(`\n🎓 STUDENTS (${students.length}):`);
    students.forEach(s => console.log(`   ${s.id}: ${s.name} (Roll: ${s.roll_no}) - Class ${s.class}${s.section}`));

    // Staff
    const staff = await Staff.findAll();
    console.log(`\n👨‍🏫 STAFF (${staff.length}):`);
    staff.forEach(s => console.log(`   ${s.id}: ${s.name} (${s.emp_id}) - ${s.type} - ${s.department || 'N/A'}`));

    console.log('\n' + '='.repeat(50));
    console.log('✅ Data viewing complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

viewAllData();
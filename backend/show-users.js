import { db } from './config/database.js';

console.log('📊 Fetching users table data...\n');

// Query to get all users
const query = `
  SELECT 
    id,
    name,
    email,
    phone,
    age,
    created_at,
    updated_at
  FROM users 
  ORDER BY created_at DESC
`;

db.all(query, [], (err, rows) => {
  if (err) {
    console.error('❌ Error fetching users:', err.message);
    process.exit(1);
  }

  if (rows.length === 0) {
    console.log('📋 No users found in the database.');
  } else {
    console.log(`👥 Found ${rows.length} user(s):\n`);
    
    rows.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Phone: ${user.phone || 'Not provided'}`);
      console.log(`   Age: ${user.age || 'Not provided'}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log(`   Updated: ${new Date(user.updated_at).toLocaleString()}`);
      console.log('   ' + '-'.repeat(50));
    });
  }

  // Close database connection
  db.close((closeErr) => {
    if (closeErr) {
      console.error('Error closing database:', closeErr.message);
    }
    console.log('\n✅ Database connection closed.');
  });
});
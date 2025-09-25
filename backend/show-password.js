import { db } from './config/database.js';

console.log('🔍 Fetching password for user ID 1...\n');

// Query to get password for user ID 1
const query = `
  SELECT 
    id,
    name,
    email,
    password
  FROM users 
  WHERE id = 1
`;

db.get(query, [], (err, user) => {
  if (err) {
    console.error('❌ Error fetching user:', err.message);
    process.exit(1);
  }

  if (!user) {
    console.log('📋 No user found with ID 1.');
  } else {
    console.log('👤 User Information:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password (Hashed): ${user.password}`);
    console.log('\n⚠️  Note: This is the hashed password stored in the database.');
    console.log('   The original plain text password is not recoverable from this hash.');
  }

  // Close database connection
  db.close((closeErr) => {
    if (closeErr) {
      console.error('Error closing database:', closeErr.message);
    }
    console.log('\n✅ Database connection closed.');
  });
});
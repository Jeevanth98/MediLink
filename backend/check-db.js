import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('📊 Connected to SQLite database');
  }
});

// Check tables
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('Error fetching tables:', err.message);
  } else {
    console.log('\n📋 Available tables:');
    tables.forEach(table => console.log(`  - ${table.name}`));
  }
});

// Check users
db.all("SELECT * FROM users", (err, users) => {
  if (err) {
    console.error('Error fetching users:', err.message);
  } else {
    console.log('\n👥 Users table records:');
    if (users.length === 0) {
      console.log('  No users found');
    } else {
      users.forEach(user => {
        console.log(`  ID: ${user.id} | Name: ${user.name} | Email: ${user.email} | Age: ${user.age}`);
      });
    }
  }
});

// Check family members
db.all("SELECT * FROM family_members", (err, members) => {
  if (err) {
    console.error('Error fetching family members:', err.message);
  } else {
    console.log('\n👨‍👩‍👧‍👦 Family members table records:');
    if (members.length === 0) {
      console.log('  No family members found');
    } else {
      members.forEach(member => {
        console.log(`  ID: ${member.id} | Name: ${member.name} | Relationship: ${member.relationship} | Age: ${member.age} | User ID: ${member.user_id}`);
      });
    }
  }
  
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('\n✅ Database connection closed');
    }
  });
});
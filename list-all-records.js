import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

const TEST_USER = {
  email: 'jeevanthsekar99@gmail.com',
  password: '46D7JADNAU2005j*'
};

let authToken = null;

async function login() {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER)
  });

  const data = await response.json();
  authToken = data.token;
  console.log('✅ Logged in as:', data.user.email, '\n');
}

async function getFamilyMembers() {
  console.log('👨‍👩‍👧 Family Members:');
  console.log('='.repeat(80));
  
  const response = await fetch(`${BASE_URL}/family-members`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  const data = await response.json();
  
  data.familyMembers.forEach(member => {
    console.log(`ID: ${member.id} | Name: ${member.name} | Age: ${member.age} | Relationship: ${member.relationship}`);
  });
  
  console.log('='.repeat(80) + '\n');
  return data.familyMembers;
}

async function getAllMedicalRecords() {
  const members = await getFamilyMembers();
  
  console.log('📋 Medical Records by Family Member:');
  console.log('='.repeat(80));
  
  for (const member of members) {
    const response = await fetch(`${BASE_URL}/medical-records/family-member/${member.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();
    
    console.log(`\n${member.name} (ID: ${member.id}):`);
    if (data.records.length === 0) {
      console.log('  No records found');
    } else {
      data.records.forEach((record, index) => {
        console.log(`  Record ${index + 1}:`);
        console.log(`    Record ID: ${record.id}`);
        console.log(`    Title: ${record.title}`);
        console.log(`    Type: ${record.record_type}`);
        console.log(`    Date: ${record.date}`);
        console.log(`    Files: ${record.files?.length || 0}`);
        
        if (record.files && record.files.length > 0) {
          record.files.forEach((file, fIndex) => {
            console.log(`      File ${fIndex + 1}:`);
            console.log(`        Document ID: ${file.id}`);
            console.log(`        Filename: ${file.original_filename}`);
            console.log(`        Type: ${file.document_type}`);
            console.log(`        Size: ${(file.file_size / 1024).toFixed(2)} KB`);
          });
        }
      });
    }
  }
  
  console.log('\n' + '='.repeat(80));
}

async function run() {
  await login();
  await getAllMedicalRecords();
}

run().catch(console.error);

// Test frontend-backend communication with new signup fields
const axios = require('axios');

async function testNewUserSignup() {
    console.log('🧪 Testing new user signup with all required fields...');
    
    try {
        // Test signup with all fields (matching updated frontend)
        const signupData = {
            name: "Test User Frontend",
            email: "frontend.test@example.com",
            password: "testpass123",
            phone: "9876543210",
            age: 25
        };

        console.log('📝 Attempting signup with:', { 
            name: signupData.name, 
            email: signupData.email, 
            phone: signupData.phone, 
            age: signupData.age 
        });
        
        const signupResponse = await axios.post('http://localhost:5000/api/auth/signup', signupData);
        console.log('✅ Signup successful!');
        console.log('👤 User created:', signupResponse.data.user);
        console.log('🔑 Token received:', signupResponse.data.token ? 'Yes' : 'No');

        // Test login with the same credentials
        console.log('\n🔐 Testing login with same credentials...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: signupData.email,
            password: signupData.password
        });
        
        console.log('✅ Login successful!');
        console.log('👤 User data:', loginResponse.data.user);
        console.log('🔑 Token received:', loginResponse.data.token ? 'Yes' : 'No');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Run the test
testNewUserSignup();
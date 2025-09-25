// Authentication Test Script
// Run this with: node test-auth.js

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/auth';

// Test data
const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'test123',
    phone: '1234567890',
    age: 25
};

async function testSignup() {
    console.log('\n=== TESTING SIGNUP ===');
    console.log('Test data:', testUser);
    
    try {
        const response = await axios.post(`${BASE_URL}/signup`, testUser);
        console.log('✅ Signup successful!');
        console.log('Response:', response.data);
        return response.data;
    } catch (error) {
        console.log('❌ Signup failed!');
        console.log('Error:', error.response?.data || error.message);
        return null;
    }
}

async function testLogin() {
    console.log('\n=== TESTING LOGIN ===');
    const loginData = {
        email: testUser.email,
        password: testUser.password
    };
    console.log('Login data:', loginData);
    
    try {
        const response = await axios.post(`${BASE_URL}/login`, loginData);
        console.log('✅ Login successful!');
        console.log('Response:', response.data);
        return response.data;
    } catch (error) {
        console.log('❌ Login failed!');
        console.log('Error status:', error.response?.status);
        console.log('Error data:', error.response?.data);
        console.log('Full error:', error.message);
        return null;
    }
}

async function testHealthCheck() {
    console.log('\n=== TESTING HEALTH CHECK ===');
    
    try {
        const response = await axios.get('http://localhost:5000/api/health');
        console.log('✅ Backend is healthy!');
        console.log('Response:', response.data);
        return true;
    } catch (error) {
        console.log('❌ Backend health check failed!');
        console.log('Error:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🧪 Starting Authentication Tests...\n');
    
    // Test 1: Health check
    const healthOk = await testHealthCheck();
    if (!healthOk) {
        console.log('❌ Backend is not running. Please start the backend server first.');
        return;
    }
    
    // Test 2: Signup
    const signupResult = await testSignup();
    if (!signupResult) {
        console.log('❌ Cannot continue with login test since signup failed.');
        return;
    }
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Login
    const loginResult = await testLogin();
    
    // Summary
    console.log('\n=== TEST SUMMARY ===');
    console.log('Health Check:', healthOk ? '✅ PASS' : '❌ FAIL');
    console.log('Signup:', signupResult ? '✅ PASS' : '❌ FAIL');
    console.log('Login:', loginResult ? '✅ PASS' : '❌ FAIL');
    
    if (signupResult && loginResult) {
        console.log('\n🎉 All tests passed! Authentication is working correctly.');
    } else {
        console.log('\n⚠️  Some tests failed. Check the logs above for details.');
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Run the tests
runTests().catch(console.error);
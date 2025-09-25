import React, { useState } from 'react';
import axios from 'axios';

const TestConnection = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testHealth = async () => {
    setLoading(true);
    try {
      console.log('Testing health endpoint...');
      const response = await axios.get('http://localhost:5000/api/health');
      console.log('Health response:', response.data);
      setResult(`✅ Health Check: ${JSON.stringify(response.data)}`);
    } catch (error) {
      console.error('Health check failed:', error);
      setResult(`❌ Health Check Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSignup = async () => {
    setLoading(true);
    try {
      console.log('Testing signup...');
      const response = await axios.post('http://localhost:5000/api/auth/signup', {
        name: 'Test Connection User',
        email: 'testconnection@example.com',
        password: 'testpass123',
        phone: '9999999999',
        age: 30
      });
      console.log('Signup response:', response.data);
      setResult(`✅ Signup Test: User created - ${response.data.user.name}`);
    } catch (error) {
      console.error('Signup test failed:', error);
      setResult(`❌ Signup Test Failed: ${error.message} - ${error.response?.data?.error || 'No additional info'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f9ff', margin: '20px', borderRadius: '8px' }}>
      <h3>🔧 Connection Test Panel</h3>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={testHealth} disabled={loading} style={{ marginRight: '10px' }}>
          {loading ? 'Testing...' : 'Test Health Endpoint'}
        </button>
        <button onClick={testSignup} disabled={loading}>
          {loading ? 'Testing...' : 'Test Signup Endpoint'}
        </button>
      </div>
      <div style={{ padding: '10px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
        <strong>Result:</strong>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{result || 'Click a button to test...'}</pre>
      </div>
    </div>
  );
};

export default TestConnection;
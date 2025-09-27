import React from 'react';
import { useParams } from 'react-router-dom';

const AddMedicalRecordTest = () => {
  const { id } = useParams();
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Add Medical Record - Test Page</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <p>Family Member ID: {id}</p>
          <p>This is a test page to check if the routing is working correctly.</p>
          <p className="text-green-600 mt-4">✅ If you can see this page, the route is working!</p>
          <div className="mt-6">
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Test Button
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMedicalRecordTest;
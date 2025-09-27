import React, { useState, useEffect } from 'react';

const AIAnalysisPageSimple = () => {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    const fetchFamilyMembers = async () => {
      try {
        console.log('AI Analysis: Starting fetch...');
        const token = localStorage.getItem('token');
        console.log('AI Analysis: Token exists:', !!token);
        
        const response = await fetch('http://localhost:5000/api/family-members', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('AI Analysis: Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('AI Analysis: Data received:', data);
          setFamilyMembers(data.familyMembers || []);
        } else {
          console.log('AI Analysis: Response not ok:', await response.text());
          setError('Failed to fetch family members');
        }
      } catch (error) {
        console.error('AI Analysis Error:', error);
        setError('Network error: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    console.log('AI Analysis: Component mounted');
    fetchFamilyMembers();
  }, []);

  const fetchMemberDocuments = async (memberId) => {
    try {
      setAnalyzing(true);
      const token = localStorage.getItem('token');
      
      // Fetch medical records for the member
      const response = await fetch(`http://localhost:5000/api/medical-records/family-member/${memberId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const records = await response.json();
        console.log('Medical records:', records);
        
        // Extract documents with files
        const docsWithFiles = records.records?.filter(record => record.files && record.files.length > 0) || [];
        
        if (docsWithFiles.length === 0) {
          setError('No documents found for this family member. Upload some medical documents first.');
          return;
        }

        setDocuments(docsWithFiles);
        
        // If there are documents, generate health summary
        await generateHealthSummary(memberId);
        
      } else {
        setError('Failed to fetch medical records');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to fetch documents: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const generateHealthSummary = async (memberId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/ai/analyze/health-summary', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          familyMemberId: memberId,
          dateRange: {
            start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // Last year
            end: new Date().toISOString()
          }
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.ok) {
        const result = await response.json();
        console.log('AI Analysis result:', result);
        setAnalysisResult(result);
        setError('');
      } else {
        console.log('Response not ok, status:', response.status);
        const responseText = await response.text();
        console.log('Error response text:', responseText);
        
        try {
          const errorData = JSON.parse(responseText);
          setError(errorData.message || 'Failed to generate health summary');
        } catch (parseError) {
          console.log('Failed to parse error response as JSON:', parseError);
          setError(`Failed to generate health summary: ${response.status} - ${responseText.substring(0, 100)}`);
        }
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      setError('Failed to generate health summary: ' + error.message);
    }
  };

  const handleAnalyzeDocuments = (member) => {
    console.log('Analyzing documents for:', member.name);
    setSelectedMember(member);
    setAnalysisResult(null);
    setError('');
    fetchMemberDocuments(member.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI Analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🤖 AI Medical Analysis</h1>
              <p className="text-gray-600 mt-1">Analyze medical documents and generate health summaries with AI</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            Error: {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Family Members</h2>
          {familyMembers.length === 0 ? (
            <p className="text-gray-500">No family members found. Add family members first to use AI analysis.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {familyMembers.map((member) => (
                <div key={member.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-lg">{member.name}</h3>
                  <p className="text-gray-600">Relationship: {member.relationship}</p>
                  <p className="text-gray-600">Age: {member.age}</p>
                  <button 
                    onClick={() => handleAnalyzeDocuments(member)}
                    disabled={analyzing}
                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                  >
                    {analyzing && selectedMember?.id === member.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Analyzing...
                      </>
                    ) : (
                      '🧠 Analyze Documents'
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analysis Results */}
        {selectedMember && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Analysis Results for {selectedMember.name}
            </h2>
            
            {documents.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">📋 Documents Analyzed:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {documents.map((record) => (
                    <div key={record.id} className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium">{record.title}</p>
                      <p className="text-sm text-gray-600">{record.record_type}</p>
                      <p className="text-sm text-gray-500">{new Date(record.date).toLocaleDateString()}</p>
                      <p className="text-xs text-blue-600">{record.files?.length || 0} files</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysisResult && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-800 mb-2">🤖 AI Health Summary</h3>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700">
                    {analysisResult.analysis}
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  Generated on: {new Date(analysisResult.createdAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalysisPageSimple;
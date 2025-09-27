import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDownIcon, DocumentMagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline';

const AIAnalysisPage = () => {
  const [searchParams] = useSearchParams();
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState('');
  const [analysisType, setAnalysisType] = useState('health-summary'); // 'health-summary' or 'single-document'
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [documents, setDocuments] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    fetchFamilyMembers();
    
    // Check for query parameters to pre-select record
    const recordId = searchParams.get('recordId');
    const familyMemberId = searchParams.get('familyMemberId');
    
    if (recordId && familyMemberId) {
      setSelectedFamilyMember(familyMemberId);
      setAnalysisType('single-document');
      // Will be handled when family members load
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedFamilyMember && analysisType === 'single-document') {
      fetchFamilyMemberDocuments(selectedFamilyMember);
    }
  }, [selectedFamilyMember, analysisType]);

  const fetchFamilyMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/family-members', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFamilyMembers(data);
      } else {
        setError('Failed to fetch family members');
      }
    } catch (error) {
      console.error('Error fetching family members:', error);
      setError('Failed to fetch family members');
    }
  };

  const fetchFamilyMemberDocuments = async (familyMemberId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/medical-records/${familyMemberId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Extract all documents from all records
        const allDocuments = [];
        data.forEach(record => {
          if (record.files && record.files.length > 0) {
            record.files.forEach(file => {
              allDocuments.push({
                ...file,
                recordId: record.id,
                recordTitle: record.title,
                recordDate: record.date,
                isProcessable: isFileProcessableForAI(file.file_type)
              });
            });
          }
        });
        setDocuments(allDocuments);

        // Auto-select documents from specific record if coming from query params
        const targetRecordId = searchParams.get('recordId');
        if (targetRecordId) {
          const targetDocuments = allDocuments.filter(doc => 
            doc.recordId.toString() === targetRecordId && doc.isProcessable
          );
          if (targetDocuments.length > 0) {
            setSelectedDocuments(targetDocuments.map(doc => doc.id));
          }
        }
      } else {
        setError('Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to fetch documents');
    }
  };

  const isFileProcessableForAI = (fileType) => {
    const supportedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
      'image/bmp', 'image/webp', 'application/pdf'
    ];
    return supportedTypes.includes(fileType);
  };

  const handleDocumentSelection = (documentId) => {
    setSelectedDocuments(prev => {
      if (prev.includes(documentId)) {
        return prev.filter(id => id !== documentId);
      } else {
        return [...prev, documentId];
      }
    });
  };

  const handleAnalyze = async () => {
    if (!selectedFamilyMember) {
      setError('Please select a family member');
      return;
    }

    if (analysisType === 'health-summary') {
      await performHealthSummaryAnalysis();
    } else if (analysisType === 'single-document') {
      await performDocumentAnalysis();
    }
  };

  const performHealthSummaryAnalysis = async () => {
    setLoading(true);
    setError('');
    setAnalysisResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/ai/analyze/health-summary', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          familyMemberId: selectedFamilyMember,
          dateRangeStart: dateRangeStart || null,
          dateRangeEnd: dateRangeEnd || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        setAnalysisResult({
          type: 'health-summary',
          data: data.healthSummary
        });
      } else {
        setError(data.error || 'Health summary analysis failed');
      }
    } catch (error) {
      console.error('Health summary analysis error:', error);
      setError('Failed to generate health summary');
    } finally {
      setLoading(false);
    }
  };

  const performDocumentAnalysis = async () => {
    if (selectedDocuments.length === 0) {
      setError('Please select at least one document to analyze');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysisResult(null);

    try {
      const token = localStorage.getItem('token');
      const analysisPromises = selectedDocuments.map(async (documentId) => {
        const response = await fetch(`http://localhost:5000/api/ai/analyze/document/${documentId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        return { documentId, success: response.ok, data };
      });

      const results = await Promise.all(analysisPromises);
      
      setAnalysisResult({
        type: 'document-analysis',
        data: results
      });

      // Check for any errors
      const errors = results.filter(r => !r.success);
      if (errors.length > 0) {
        setError(`${errors.length} document(s) failed to analyze. Check individual results.`);
      }

    } catch (error) {
      console.error('Document analysis error:', error);
      setError('Failed to analyze documents');
    } finally {
      setLoading(false);
    }
  };

  const renderAnalysisResult = () => {
    if (!analysisResult) return null;

    if (analysisResult.type === 'health-summary') {
      return (
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <div className="flex items-center mb-4">
            <SparklesIcon className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold">Health Summary</h3>
          </div>
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded border">
              {analysisResult.data.summary}
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => navigator.clipboard.writeText(analysisResult.data.summary)}
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
            >
              Copy to Clipboard
            </button>
            <button
              onClick={() => setAnalysisResult(null)}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      );
    }

    if (analysisResult.type === 'document-analysis') {
      return (
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <div className="flex items-center mb-4">
            <DocumentMagnifyingGlassIcon className="w-6 h-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold">Document Analysis Results</h3>
          </div>
          <div className="space-y-4">
            {analysisResult.data.map((result, index) => {
              const document = documents.find(d => d.id === result.documentId);
              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{document?.original_filename || 'Unknown Document'}</h4>
                    <span className={`px-2 py-1 rounded text-xs ${
                      result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {result.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  {result.success ? (
                    <div className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded">
                      {result.data.analysis?.aiAnalysis?.fullAnalysis || 'No analysis available'}
                    </div>
                  ) : (
                    <div className="text-red-600 text-sm">
                      Error: {result.data.error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setAnalysisResult(null)}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      );
    }
  };

  const selectedFamilyMemberName = familyMembers.find(fm => fm.id === parseInt(selectedFamilyMember))?.name || '';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-6">
            <SparklesIcon className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Medical Analysis</h1>
              <p className="text-gray-600">Generate health insights using artificial intelligence</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Family Member Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Family Member
              </label>
              <div className="relative">
                <select
                  value={selectedFamilyMember}
                  onChange={(e) => setSelectedFamilyMember(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">Choose a family member...</option>
                  {familyMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Analysis Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Analysis Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setAnalysisType('health-summary')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    analysisType === 'health-summary'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <SparklesIcon className="w-5 h-5 text-blue-600 mr-2" />
                    <h3 className="font-medium">Health Summary</h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Comprehensive health analysis from all medical records
                  </p>
                </div>
                <div
                  onClick={() => setAnalysisType('single-document')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    analysisType === 'single-document'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <DocumentMagnifyingGlassIcon className="w-5 h-5 text-green-600 mr-2" />
                    <h3 className="font-medium">Document Analysis</h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Analyze specific documents with OCR and AI
                  </p>
                </div>
              </div>
            </div>

            {/* Date Range for Health Summary */}
            {analysisType === 'health-summary' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={dateRangeStart}
                    onChange={(e) => setDateRangeStart(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={dateRangeEnd}
                    onChange={(e) => setDateRangeEnd(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Document Selection for Single Document Analysis */}
            {analysisType === 'single-document' && selectedFamilyMember && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Documents to Analyze
                </label>
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  {documents.length === 0 ? (
                    <div className="p-4 text-gray-500 text-center">
                      No documents found for {selectedFamilyMemberName}
                    </div>
                  ) : (
                    <div className="space-y-2 p-2">
                      {documents.map((document) => (
                        <div
                          key={document.id}
                          className={`flex items-center p-3 rounded border ${
                            document.isProcessable
                              ? 'hover:bg-gray-50'
                              : 'bg-gray-100 opacity-60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedDocuments.includes(document.id)}
                            onChange={() => handleDocumentSelection(document.id)}
                            disabled={!document.isProcessable}
                            className="mr-3"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">
                                {document.original_filename}
                              </span>
                              <span className="text-xs text-gray-500">
                                {document.document_type || 'Others'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">
                              {document.recordTitle} • {document.recordDate}
                            </div>
                            {!document.isProcessable && (
                              <div className="text-xs text-red-600">
                                File type not supported for AI analysis
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Analyze Button */}
            <div className="flex justify-end">
              <button
                onClick={handleAnalyze}
                disabled={loading || !selectedFamilyMember}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    Analyze
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        {renderAnalysisResult()}
      </div>
    </div>
  );
};

export default AIAnalysisPage;
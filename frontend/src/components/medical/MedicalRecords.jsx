import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import apiClient from '../../utils/apiClient';
import MedicalRecordModal from './MedicalRecordModal';

const MedicalRecords = () => {
  const { id: familyMemberId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState(null);
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analyzingRecordId, setAnalyzingRecordId] = useState(null);
  const [analysisResults, setAnalysisResults] = useState({});
  const [expandedAnalysis, setExpandedAnalysis] = useState({});
  const [deletingRecordId, setDeletingRecordId] = useState(null);

  const recordTypeOptions = [
    'Consultation', 'Lab Test', 'Imaging', 'Surgery', 'Prescription', 
    'Vaccination', 'Emergency Visit', 'Follow-up', 'Checkup', 
    'Specialist Visit', 'Dental', 'Eye Care', 'Mental Health', 
    'Physical Therapy', 'Other'
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load family member details
        console.log('Loading family member and records:', familyMemberId);
        const [memberResponse, recordsResponse] = await Promise.all([
          apiClient.get(`/family-members/${familyMemberId}`),
          apiClient.get(`/medical-records/family-member/${familyMemberId}`)
        ]);
        
        setMember(memberResponse.data.familyMember);
        setRecords(recordsResponse.data.records || []);
        console.log('Loaded records:', recordsResponse.data.records);
      } catch (error) {
        console.error('Error loading data:', error);
        if (error.response?.status === 404) {
          // Family member not found or no records yet
          try {
            const memberResponse = await apiClient.get(`/family-members/${familyMemberId}`);
            setMember(memberResponse.data.familyMember);
            setRecords([]);
          } catch (memberError) {
            toast.error('Failed to load family member details');
            navigate('/dashboard');
          }
        } else {
          toast.error('Failed to load medical records');
        }
      } finally {
        setLoading(false);
      }
    };

    if (familyMemberId) {
      loadData();
    }
  }, [familyMemberId, navigate]);

  const getRecordTypeIcon = (type) => {
    const icons = {
      'Consultation': '🩺',
      'Lab Test': '🧪',
      'Imaging': '📷',
      'Surgery': '⚕️',
      'Prescription': '💊',
      'Vaccination': '💉',
      'Emergency Visit': '🚨',
      'Follow-up': '🔄',
      'Checkup': '✅',
      'Specialist Visit': '👨‍⚕️',
      'Dental': '🦷',
      'Eye Care': '👁️',
      'Mental Health': '🧠',
      'Physical Therapy': '🏃‍♂️',
      'Other': '📋'
    };
    return icons[type] || '📋';
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (record.doctor_name && record.doctor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (record.diagnosis && record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterType === '' || record.record_type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  const handleAnalyzeRecord = async (record) => {
    if (!record.files || record.files.length === 0) {
      toast.error('No documents to analyze');
      return;
    }

    setAnalyzingRecordId(record.id);

    try {
      // Analyze each document in the record
      const analysisPromises = record.files.map(async (file) => {
        const response = await apiClient.post(`/ai/analyze/document/${file.id}?_t=${Date.now()}`);
        console.log('📊 Analysis Response:', response.data);
        console.log('🔍 Areas of Concern:', response.data?.analysis?.aiAnalysis?.areasOfConcern);
        return response.data;
      });

      const results = await Promise.all(analysisPromises);
      
      console.log('📊 All Analysis Results:', results);
      
      // Store analysis results for this record
      setAnalysisResults(prev => ({
        ...prev,
        [record.id]: results
      }));

      // Auto-expand the analysis after completion
      setExpandedAnalysis(prev => ({
        ...prev,
        [record.id]: true
      }));

      toast.success('Analysis completed!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error.response?.data?.error || 'Failed to analyze documents');
    } finally {
      setAnalyzingRecordId(null);
    }
  };

  const toggleAnalysis = (recordId) => {
    setExpandedAnalysis(prev => ({
      ...prev,
      [recordId]: !prev[recordId]
    }));
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this medical record? This action cannot be undone.')) {
      return;
    }

    setDeletingRecordId(recordId);

    try {
      await apiClient.delete(`/medical-records/${recordId}`);
      
      // Remove the record from the local state
      setRecords(prevRecords => prevRecords.filter(record => record.id !== recordId));
      
      toast.success('Medical record deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.error || 'Failed to delete medical record');
    } finally {
      setDeletingRecordId(null);
    }
  };

  if (loading) {
    return (
      <div className="medical-gradient min-h-100vh flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary mx-auto mb-4"></div>
          <p className="text-white">Loading medical records...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="medical-gradient min-h-100vh flex items-center justify-center">
        <div className="text-center text-white">
          <div className="medical-icon mb-4">❌</div>
          <h2 className="text-xl font-bold mb-4">Family Member Not Found</h2>
          <Link to="/dashboard" className="btn-primary inline-block">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="medical-gradient min-h-100vh">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-medical border-b border-medical-light/20 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link 
                to={`/family-member/${familyMemberId}`}
                className="text-medical-primary hover:text-medical-secondary transition-colors"
              >
                ← Back
              </Link>
              <div>
                <h1 className="text-lg font-bold text-medical-dark">Medical Records</h1>
                <p className="text-sm text-medical-text">for {member.name}</p>
              </div>
            </div>
            
            <Link
              to={`/family-member/${familyMemberId}/add-record`}
              className="bg-medical-primary text-white px-6 py-3 rounded-lg hover:bg-medical-secondary transition-colors text-sm font-bold border-2 border-medical-primary hover:border-medical-secondary"
            >
              ⚕️ Add Medical Record
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-medical p-6 mb-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-medical-dark mb-2">Medical Records</h2>
            <p className="text-medical-text">for {member.name}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-medical-primary font-medium mb-3">
                Search Records
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, doctor, or diagnosis..."
                className="w-full px-4 py-3 border border-medical-light rounded-xl focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-medical-primary font-medium mb-3">
                Filter by Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-3 border border-medical-light rounded-xl focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none transition-all bg-gray-50"
              >
                <option value="">All Types</option>
                {recordTypeOptions.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Records List */}
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-medical p-8">
            <div className="text-center">
              <h3 className="font-bold text-medical-dark text-lg mb-2">
                {records.length === 0 ? 'No Medical Records' : 'No Records Found'}
              </h3>
              <p className="text-medical-text text-sm mb-6">
                {records.length === 0 
                  ? `No medical records have been added for ${member.name} yet.`
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              
              {records.length === 0 && (
                <Link
                  to={`/family-member/${familyMemberId}/add-record`}
                  className="bg-gradient-to-r from-medical-primary to-medical-secondary text-white px-6 py-4 rounded-xl font-bold text-lg hover:shadow-xl transform hover:scale-105 transition-all inline-flex items-center space-x-3 border-2 border-medical-primary"
                >
                  <span className="text-2xl">⚕️</span>
                  <span>Add First Medical Record</span>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <div key={record.id} className="bg-white rounded-2xl shadow-medical p-6 hover:shadow-lg transition-all border border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="text-3xl">
                      {getRecordTypeIcon(record.record_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-medical-dark text-lg mb-1">
                            {record.title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-medical-text mb-2">
                            <span className="bg-medical-light px-3 py-1 rounded-full font-medium">
                              {record.record_type}
                            </span>
                            <span className="flex items-center space-x-1">
                              <span>📅</span>
                              <span>{new Date(record.date).toLocaleDateString()}</span>
                            </span>
                            {record.doctor_name && (
                              <span className="flex items-center space-x-1">
                                <span>👨‍⚕️</span>
                                <span>Dr. {record.doctor_name}</span>
                              </span>
                            )}
                            {record.files && record.files.length > 0 && (
                              <span className="flex items-center space-x-1 bg-blue-100 px-2 py-1 rounded-full text-blue-700">
                                <span>📎</span>
                                <span>{record.files.length} file{record.files.length > 1 ? 's' : ''}</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-3 mt-3">
                            <button
                              onClick={() => handleAnalyzeRecord(record)}
                              disabled={analyzingRecordId === record.id || !record.files || record.files.length === 0}
                              style={{
                                backgroundColor: analyzingRecordId === record.id || !record.files || record.files.length === 0
                                  ? '#d1d5db'
                                  : '#3b82f6',
                                color: '#ffffff',
                                boxShadow: analyzingRecordId === record.id || !record.files || record.files.length === 0
                                  ? 'none'
                                  : '0 2px 8px rgba(59, 130, 246, 0.3)',
                                border: '2px solid',
                                borderColor: analyzingRecordId === record.id || !record.files || record.files.length === 0
                                  ? '#d1d5db'
                                  : '#3b82f6',
                                cursor: analyzingRecordId === record.id || !record.files || record.files.length === 0
                                  ? 'not-allowed'
                                  : 'pointer'
                              }}
                              className="px-4 py-2 rounded-lg transition-all duration-200 text-sm font-semibold flex items-center space-x-2"
                              onMouseEnter={(e) => {
                                if (!analyzingRecordId && record.files && record.files.length > 0) {
                                  e.currentTarget.style.backgroundColor = '#2563eb';
                                  e.currentTarget.style.borderColor = '#2563eb';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!analyzingRecordId && record.files && record.files.length > 0) {
                                  e.currentTarget.style.backgroundColor = '#3b82f6';
                                  e.currentTarget.style.borderColor = '#3b82f6';
                                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                                }
                              }}
                            >
                              {analyzingRecordId === record.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span>Analyzing...</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-lg">🧠</span>
                                  <span>Analyse</span>
                                </>
                              )}
                            </button>
                            
                            <button
                              onClick={() => handleDeleteRecord(record.id)}
                              disabled={deletingRecordId === record.id}
                              style={{
                                backgroundColor: deletingRecordId === record.id ? '#d1d5db' : '#ef4444',
                                color: '#ffffff',
                                boxShadow: deletingRecordId === record.id ? 'none' : '0 2px 8px rgba(239, 68, 68, 0.3)',
                                border: '2px solid',
                                borderColor: deletingRecordId === record.id ? '#d1d5db' : '#ef4444',
                                cursor: deletingRecordId === record.id ? 'not-allowed' : 'pointer'
                              }}
                              className="px-4 py-2 rounded-lg transition-all duration-200 text-sm font-semibold flex items-center space-x-2"
                              onMouseEnter={(e) => {
                                if (deletingRecordId !== record.id) {
                                  e.currentTarget.style.backgroundColor = '#dc2626';
                                  e.currentTarget.style.borderColor = '#dc2626';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (deletingRecordId !== record.id) {
                                  e.currentTarget.style.backgroundColor = '#ef4444';
                                  e.currentTarget.style.borderColor = '#ef4444';
                                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                                }
                              }}
                            >
                              {deletingRecordId === record.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span>Deleting...</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-lg">🗑️</span>
                                  <span>Delete</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Record Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {record.hospital_name && (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-xs text-blue-600 mb-1 flex items-center">
                              <span className="mr-1">🏥</span>
                              Hospital/Clinic
                            </p>
                            <p className="text-sm font-medium text-blue-900">{record.hospital_name}</p>
                          </div>
                        )}
                        
                        {record.diagnosis && (
                          <div className="bg-red-50 p-3 rounded-lg">
                            <p className="text-xs text-red-600 mb-1 flex items-center">
                              <span className="mr-1">🔬</span>
                              Diagnosis
                            </p>
                            <p className="text-sm font-medium text-red-900 line-clamp-2">{record.diagnosis}</p>
                          </div>
                        )}
                        
                        {record.medications && (
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-xs text-green-600 mb-1 flex items-center">
                              <span className="mr-1">💊</span>
                              Medications
                            </p>
                            <p className="text-sm font-medium text-green-900 line-clamp-2">{record.medications}</p>
                          </div>
                        )}
                        
                        {record.symptoms && (
                          <div className="bg-yellow-50 p-3 rounded-lg">
                            <p className="text-xs text-yellow-600 mb-1 flex items-center">
                              <span className="mr-1">🤒</span>
                              Symptoms
                            </p>
                            <p className="text-sm font-medium text-yellow-900 line-clamp-2">{record.symptoms}</p>
                          </div>
                        )}
                        
                        {record.treatment && (
                          <div className="bg-purple-50 p-3 rounded-lg">
                            <p className="text-xs text-purple-600 mb-1 flex items-center">
                              <span className="mr-1">⚕️</span>
                              Treatment
                            </p>
                            <p className="text-sm font-medium text-purple-900 line-clamp-2">{record.treatment}</p>
                          </div>
                        )}
                        
                        {record.follow_up_date && (
                          <div className="bg-orange-50 p-3 rounded-lg">
                            <p className="text-xs text-orange-600 mb-1 flex items-center">
                              <span className="mr-1">🔄</span>
                              Follow-up
                            </p>
                            <p className="text-sm font-medium text-orange-900">
                              {new Date(record.follow_up_date).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {record.notes && (
                        <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1 flex items-center">
                            <span className="mr-1">📝</span>
                            Additional Notes
                          </p>
                          <p className="text-sm text-gray-800">{record.notes}</p>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-medical-text flex justify-between">
                        <span className="flex items-center">
                          <span className="mr-1">📅</span>
                          Added {new Date(record.created_at).toLocaleDateString()}
                        </span>
                        {record.updated_at !== record.created_at && (
                          <span className="flex items-center">
                            <span className="mr-1">🔄</span>
                            Updated {new Date(record.updated_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* AI Analysis Results */}
                      {analysisResults[record.id] && (
                        <div className="mt-6 pt-6 border-t-2 border-purple-200">
                          <button
                            onClick={() => toggleAnalysis(record.id)}
                            className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg hover:from-purple-200 hover:to-indigo-200 transition-all"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-xl">🧠</span>
                              <h4 className="font-bold text-purple-900 text-base">AI Analysis Results</h4>
                              <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full">
                                {analysisResults[record.id].length} document(s)
                              </span>
                            </div>
                            <span className="text-xl transform transition-transform duration-200" style={{
                              transform: expandedAnalysis[record.id] ? 'rotate(180deg)' : 'rotate(0deg)'
                            }}>
                              ▼
                            </span>
                          </button>

                          {expandedAnalysis[record.id] && (
                            <div className="mt-4">{analysisResults[record.id].map((result, index) => (
                            <div key={index} className="mb-6">
                              {result.success ? (
                                <div className="space-y-4">
                                  {/* Document Info */}
                                  {record.files[index] && (
                                    <div className="bg-gray-100 rounded-lg p-3">
                                      <p className="text-sm font-semibold text-gray-700 flex items-center">
                                        <span className="mr-2">📄</span>
                                        {result.analysis.originalFilename}
                                      </p>
                                    </div>
                                  )}

                                  {/* Key Findings - Test Results */}
                                  {result.analysis.aiAnalysis.keyFindings && (
                                    <div className="bg-blue-50 rounded-xl p-5 border-2 border-blue-200">
                                      <h6 className="font-bold text-blue-900 mb-3 text-sm flex items-center">
                                        <span className="mr-2">📊</span>
                                        Test Results
                                      </h6>
                                      <div className="text-blue-800 text-sm leading-relaxed space-y-1">
                                        {result.analysis.aiAnalysis.keyFindings.split('\n').map((line, i) => {
                                          const trimmedLine = line.trim();
                                          if (!trimmedLine) return null;
                                          
                                          // Filter out only specific metadata lines (case-insensitive)
                                          const lowerLine = trimmedLine.toLowerCase();
                                          const isMetadata = 
                                            lowerLine.startsWith('patient name:') ||
                                            lowerLine.startsWith('patient id:') ||
                                            lowerLine.startsWith('doctor:') ||
                                            lowerLine.startsWith('doctor name:') ||
                                            lowerLine.startsWith('hospital:') ||
                                            lowerLine.startsWith('clinic:') ||
                                            lowerLine.startsWith('laboratory:') ||
                                            lowerLine.startsWith('lab:') ||
                                            lowerLine.startsWith('referred by:') ||
                                            lowerLine.startsWith('collected by:') ||
                                            lowerLine.startsWith('sample collected:');
                                          
                                          if (isMetadata) {
                                            return null;
                                          }
                                          
                                          return <p key={i} className="pl-2">{trimmedLine}</p>;
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Areas of Concern */}
                                  {result.analysis?.aiAnalysis?.areasOfConcern && result.analysis.aiAnalysis.areasOfConcern.trim() !== '' ? (
                                    <div className="bg-orange-50 rounded-xl p-5 border-2 border-orange-300">
                                      <h6 className="font-bold text-orange-900 mb-3 text-sm flex items-center">
                                        <span className="mr-2">⚠️</span>
                                        Areas of Concern
                                      </h6>
                                      <div className="text-orange-800 text-sm leading-relaxed space-y-2">
                                        {result.analysis.aiAnalysis.areasOfConcern.split('\n').map((line, i) => (
                                          line.trim() && <p key={i}>{line}</p>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-green-50 rounded-xl p-5 border-2 border-green-300">
                                      <h6 className="font-bold text-green-900 mb-3 text-sm flex items-center">
                                        <span className="mr-2">✅</span>
                                        Areas of Concern
                                      </h6>
                                      <div className="text-green-800 text-sm leading-relaxed">
                                        <p>No abnormal findings detected. All test results are within acceptable ranges.</p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Recommendations */}
                                  {result.analysis.aiAnalysis.recommendations && (
                                    <div className="bg-blue-50 rounded-xl p-5 border-2 border-blue-200">
                                      <h6 className="font-bold text-blue-900 mb-4 text-sm flex items-center">
                                        <span className="mr-2">💡</span>
                                        Recommendations
                                      </h6>
                                      <div className="text-blue-800 text-sm space-y-3">
                                        {result.analysis.aiAnalysis.recommendations.split('\n').map((line, i) => {
                                          // Check if line is a section header
                                          if (line.includes('IMMEDIATE ACTIONS:')) {
                                            return (
                                              <div key={i} className="pt-1">
                                                <h6 className="font-semibold text-red-700 text-sm mb-2 flex items-center">
                                                  <span className="mr-2">⚠️</span>
                                                  {line.replace('⚠️', '').trim()}
                                                </h6>
                                              </div>
                                            );
                                          } else if (line.includes('LIFESTYLE RECOMMENDATIONS:')) {
                                            return (
                                              <div key={i} className="pt-2">
                                                <h6 className="font-semibold text-blue-700 text-sm mb-2 flex items-center">
                                                  <span className="mr-2">💪</span>
                                                  {line.replace('💪', '').trim()}
                                                </h6>
                                              </div>
                                            );
                                          } else if (line.includes('DIETARY ADVICE:')) {
                                            return (
                                              <div key={i} className="pt-2">
                                                <h6 className="font-semibold text-green-700 text-sm mb-2 flex items-center">
                                                  <span className="mr-2">🥗</span>
                                                  {line.replace('🥗', '').trim()}
                                                </h6>
                                              </div>
                                            );
                                          } else if (line.includes('FOLLOW-UP:')) {
                                            return (
                                              <div key={i} className="pt-2">
                                                <h6 className="font-semibold text-indigo-700 text-sm mb-2 flex items-center">
                                                  <span className="mr-2">📋</span>
                                                  {line.replace('📋', '').trim()}
                                                </h6>
                                              </div>
                                            );
                                          } else if (line.trim()) {
                                            // Regular recommendation item - show all non-empty lines
                                            return (
                                              <p key={i} className="text-blue-900 pl-6 leading-relaxed">
                                                • {line.trim()}
                                              </p>
                                            );
                                          }
                                          return null;
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* OCR Accuracy */}
                                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 border-2 border-purple-200">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <span className="text-2xl">🔍</span>
                                        <div>
                                          <p className="font-bold text-gray-900 text-sm">OCR Extraction Accuracy</p>
                                          <p className="text-xs text-gray-600 mt-1">
                                            {result.analysis.ocrResults.textLength} characters extracted
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className={`text-3xl font-bold ${
                                          result.analysis.ocrResults.confidence >= 0.8 ? 'text-green-600' :
                                          result.analysis.ocrResults.confidence >= 0.6 ? 'text-yellow-600' :
                                          'text-red-600'
                                        }`}>
                                          {(result.analysis.ocrResults.confidence * 100).toFixed(1)}%
                                        </div>
                                        <div className={`text-xs font-semibold mt-1 px-2 py-1 rounded ${
                                          result.analysis.ocrResults.confidence >= 0.8 ? 'bg-green-100 text-green-700' :
                                          result.analysis.ocrResults.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-red-100 text-red-700'
                                        }`}>
                                          {result.analysis.ocrResults.confidence >= 0.8 ? 'Excellent' :
                                           result.analysis.ocrResults.confidence >= 0.6 ? 'Good' :
                                           'Fair'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
                                  <p className="text-red-800 font-bold flex items-center mb-2">
                                    <span className="mr-2 text-xl">❌</span>
                                    Analysis Failed
                                  </p>
                                  <p className="text-red-600 text-sm">
                                    {result.error || 'An error occurred during analysis'}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                          </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {records.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-medical p-6">
            <div className="text-center mb-6">
              <h3 className="font-bold text-medical-dark text-lg mb-2">Records Summary</h3>
              <p className="text-medical-text">Overview of all medical records</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center bg-medical-light rounded-xl p-4">
                <div className="text-3xl font-bold text-medical-primary mb-1">{records.length}</div>
                <div className="text-sm text-medical-text font-medium">Total Records</div>
              </div>
              <div className="text-center bg-green-50 rounded-xl p-4">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {records.filter(r => r.record_type === 'Checkup').length}
                </div>
                <div className="text-sm text-green-700 font-medium">Checkups</div>
              </div>
              <div className="text-center bg-blue-50 rounded-xl p-4">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {records.filter(r => r.record_type === 'Lab Test').length}
                </div>
                <div className="text-sm text-blue-700 font-medium">Lab Tests</div>
              </div>
              <div className="text-center bg-purple-50 rounded-xl p-4">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {records.filter(r => r.record_type === 'Consultation').length}
                </div>
                <div className="text-sm text-purple-700 font-medium">Consultations</div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Medical Record Modal */}
      <MedicalRecordModal
        record={selectedRecord}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default MedicalRecords;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import apiClient from '../../utils/apiClient';

const AddMedicalRecord = () => {
  const { id: familyMemberId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [member, setMember] = useState(null);
  const [formData, setFormData] = useState({
    record_type: '',
    title: '',
    date: '',
    doctor_name: '',
    hospital_name: '',
    diagnosis: '',
    symptoms: '',
    treatment: '',
    medications: '',
    notes: '',
    follow_up_date: ''
  });
  const [files, setFiles] = useState([]);
  const [fileErrors, setFileErrors] = useState([]);

  const documentTypeOptions = [
    'Lab Report',
    'Prescription',
    'Medical Imaging (X-ray, MRI, etc.)',
    'Doctor\'s Notes',
    'Others'
  ];

  const recordTypeOptions = [
    'Consultation',
    'Lab Test',
    'Imaging',
    'Surgery',
    'Prescription',
    'Vaccination',
    'Emergency Visit',
    'Follow-up',
    'Checkup',
    'Specialist Visit',
    'Dental',
    'Eye Care',
    'Mental Health',
    'Physical Therapy',
    'Other'
  ];

  useEffect(() => {
    const loadFamilyMember = async () => {
      try {
        console.log('Loading family member for medical record:', familyMemberId);
        const response = await apiClient.get(`/family-members/${familyMemberId}`);
        setMember(response.data.familyMember);
      } catch (error) {
        console.error('Error loading family member:', error);
        toast.error('Failed to load family member details');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (familyMemberId) {
      loadFamilyMember();
    }
  }, [familyMemberId, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const errors = [];
    const validFiles = [];
    
    // Check file types and sizes
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB per file
    const maxTotalSize = 10 * 1024 * 1024; // 10MB total
    
    let totalSize = 0;
    
    selectedFiles.forEach((file, index) => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`File ${file.name}: Invalid file type. Only JPG, PNG, PDF, DOC, DOCX are allowed.`);
      } else if (file.size > maxFileSize) {
        errors.push(`File ${file.name}: File size exceeds 5MB limit.`);
      } else {
        // Create file object with document type
        validFiles.push({
          file: file,
          documentType: 'Others', // Default type
          id: Date.now() + index // Unique ID for tracking
        });
        totalSize += file.size;
      }
    });
    
    if (totalSize > maxTotalSize) {
      errors.push('Total file size exceeds 10MB limit.');
      setFiles([]);
    } else {
      setFiles(validFiles);
    }
    
    setFileErrors(errors);
  };

  const updateFileDocumentType = (fileId, documentType) => {
    setFiles(prevFiles => 
      prevFiles.map(fileObj => 
        fileObj.id === fileId 
          ? { ...fileObj, documentType } 
          : fileObj
      )
    );
  };

  const removeFile = (fileId) => {
    setFiles(prevFiles => prevFiles.filter(fileObj => fileObj.id !== fileId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.record_type) {
      toast.error('Record type is required');
      return;
    }
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.date) {
      toast.error('Date is required');
      return;
    }
    
    if (fileErrors.length > 0) {
      toast.error('Please fix file errors before submitting');
      return;
    }

    setSaving(true);
    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add form fields
      formDataToSend.append('family_member_id', familyMemberId);
      formDataToSend.append('record_type', formData.record_type);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('date', formData.date);
      formDataToSend.append('doctor_name', formData.doctor_name || '');
      formDataToSend.append('hospital_name', formData.hospital_name || '');
      formDataToSend.append('diagnosis', formData.diagnosis || '');
      formDataToSend.append('symptoms', formData.symptoms || '');
      formDataToSend.append('treatment', formData.treatment || '');
      formDataToSend.append('medications', formData.medications || '');
      formDataToSend.append('notes', formData.notes || '');
      formDataToSend.append('follow_up_date', formData.follow_up_date || '');
      
      // Add files and document types
      files.forEach((fileObj) => {
        formDataToSend.append('medical_files', fileObj.file);
      });
      
      // Add document types array
      const documentTypes = files.map(fileObj => fileObj.documentType);
      documentTypes.forEach((docType) => {
        formDataToSend.append('document_types', docType);
      });

      const response = await apiClient.post('/medical-records', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Medical record created:', response.data);
      toast.success('Medical record added successfully!');
      navigate(`/family-member/${familyMemberId}`);
    } catch (error) {
      console.error('Error creating medical record:', error);
      const errorMessage = error.response?.data?.error || 'Failed to add medical record';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="medical-gradient min-h-100vh flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
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
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link 
                to={`/family-member/${familyMemberId}`}
                className="text-medical-primary hover:text-medical-secondary transition-colors"
              >
                ← Back
              </Link>
              <div>
                <h1 className="text-lg font-bold text-medical-dark">Add Medical Record</h1>
                <p className="text-sm text-medical-text">for {member.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-medical p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-medical-dark mb-2">Add Medical Record</h2>
            <p className="text-medical-text">Record medical information for {member.name}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Record Info */}
              <div className="space-y-6">
                <h3 className="font-semibold text-medical-dark text-lg border-b border-medical-light pb-2">
                  Record Details
                </h3>

                <div>
                  <label className="block text-medical-primary font-medium mb-3">
                    Record Type *
                  </label>
                  <select
                    name="record_type"
                    value={formData.record_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-medical-light rounded-xl focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none transition-all bg-gray-50"
                    required
                  >
                    <option value="">Select record type</option>
                    {recordTypeOptions.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-medical-primary font-medium mb-3">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-medical-light rounded-xl focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none transition-all"
                    placeholder="e.g., Annual Checkup, Blood Test Results"
                    required
                  />
                </div>

                <div>
                  <label className="block text-medical-primary font-medium mb-3">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-medical-light rounded-xl focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-medical-primary font-medium mb-3">
                    Doctor Name
                  </label>
                  <input
                    type="text"
                    name="doctor_name"
                    value={formData.doctor_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-medical-light rounded-xl focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none transition-all"
                    placeholder="Dr. Smith"
                  />
                </div>

                <div>
                  <label className="block text-medical-primary font-medium mb-3">
                    Hospital/Clinic Name
                  </label>
                  <input
                    type="text"
                    name="hospital_name"
                    value={formData.hospital_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-medical-light rounded-xl focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none transition-all"
                    placeholder="City Hospital"
                  />
                </div>
              </div>

              {/* Medical Details */}
              <div className="space-y-6">
                <h3 className="font-semibold text-medical-dark text-lg border-b border-medical-light pb-2">
                  Medical Information
                </h3>

                <div>
                  <label className="block text-medical-primary font-medium mb-3">
                    Diagnosis
                  </label>
                  <textarea
                    name="diagnosis"
                    value={formData.diagnosis}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-medical-light rounded-xl focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none transition-all resize-none"
                    rows="3"
                    placeholder="Medical diagnosis or findings"
                  />
                </div>

                <div>
                  <label className="block text-medical-primary font-medium mb-3">
                    Symptoms
                  </label>
                  <textarea
                    name="symptoms"
                    value={formData.symptoms}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-medical-light rounded-xl focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none transition-all resize-none"
                    rows="3"
                    placeholder="Symptoms experienced"
                  />
                </div>

                <div>
                  <label className="block text-medical-primary font-medium mb-3">
                    Treatment
                  </label>
                  <textarea
                    name="treatment"
                    value={formData.treatment}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-medical-light rounded-xl focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none transition-all resize-none"
                    rows="3"
                    placeholder="Treatment given or recommended"
                  />
                </div>

                <div>
                  <label className="block text-medical-primary font-medium mb-3">
                    Medications
                  </label>
                  <textarea
                    name="medications"
                    value={formData.medications}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-medical-light rounded-xl focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none transition-all resize-none"
                    rows="3"
                    placeholder="Prescribed medications with dosage"
                  />
                </div>
              </div>
            </div>

            {/* Full Width Fields */}
            <div className="space-y-6">
              <div>
                <label className="block text-medical-primary font-medium mb-3">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-medical-light rounded-xl focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none transition-all resize-none"
                  rows="4"
                  placeholder="Any additional notes or observations"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-medical-primary font-medium mb-3">
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    name="follow_up_date"
                    value={formData.follow_up_date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-medical-light rounded-xl focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-medical-primary font-medium mb-3">
                    Attach Documents
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 border border-medical-light rounded-xl focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-medical-primary file:text-white hover:file:bg-medical-secondary"
                  />
                  <p className="text-xs text-medical-text mt-2">
                    Upload reports, prescriptions, or other medical documents (Max 5MB per file, 10MB total)
                  </p>
                </div>
              </div>
            </div>

            {/* File Preview and Errors */}
            {fileErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h4 className="text-sm font-medium text-red-800 mb-2">File Errors:</h4>
                <ul className="space-y-1 text-sm text-red-700">
                  {fileErrors.map((error, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-red-500">⚠️</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {files.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h4 className="text-sm font-medium text-green-800 mb-3">Selected Files ({files.length}):</h4>
                <div className="space-y-3">
                  {files.map((fileObj) => (
                    <div key={fileObj.id} className="p-3 bg-white rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">📄</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{fileObj.file.name}</p>
                            <p className="text-xs text-gray-500">{(fileObj.file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(fileObj.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          Remove
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Document Type *
                        </label>
                        <select
                          value={fileObj.documentType}
                          onChange={(e) => updateFileDocumentType(fileObj.id, e.target.value)}
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          {documentTypeOptions.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-green-700">
                  <p>Total size: {(files.reduce((acc, fileObj) => acc + fileObj.file.size, 0) / 1024 / 1024).toFixed(2)} MB / 10 MB</p>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-medical-light">
              <Link
                to={`/family-member/${familyMemberId}`}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-center hover:bg-gray-200 transition-colors border-2 border-gray-200"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving || fileErrors.length > 0}
                className="flex-1 bg-gradient-to-r from-medical-primary to-medical-secondary text-white px-6 py-4 rounded-xl font-bold text-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-3 border-2 border-medical-primary"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                    <span>Saving Medical Record...</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">⚕️</span>
                    <span>Add Medical Record</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddMedicalRecord;
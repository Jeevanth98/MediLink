import React, { useState, useEffect } from 'react';

const MedicalRecordModal = ({ record, isOpen, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [authenticatedImageUrls, setAuthenticatedImageUrls] = useState({});

  // Create authenticated image URLs when modal opens
  useEffect(() => {
    if (isOpen && record && images.length > 0) {
      const createAuthenticatedUrls = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token available for image authentication');
          return;
        }

        console.log('Creating authenticated URLs for', images.length, 'images');
        
        const urlPromises = images.map(async (image) => {
          try {
            console.log('Fetching image:', image.original_filename, 'URL:', image.url);
            
            // Try direct authenticated fetch first
            const response = await fetch(image.url, {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'image/*'
              }
            });
            
            if (!response.ok) {
              console.error('Failed to fetch image:', response.status, response.statusText);
              // Fallback to direct viewer URL using filename directly
              const filename = image.filename;
              const viewerUrl = `http://localhost:5000/api/files/medical-records/${filename}?token=${token}`;
              return { id: image.id, url: viewerUrl };
            }
            
            const blob = await response.blob();
            console.log('Image blob created, size:', blob.size, 'type:', blob.type);
            return { id: image.id, url: window.URL.createObjectURL(blob) };
          } catch (error) {
            console.error('Error creating authenticated URL for image:', image.original_filename, error);
            // Fallback to direct viewer URL using filename directly
            const filename = image.filename;
            const viewerUrl = `http://localhost:5000/api/files/medical-records/${filename}?token=${token}`;
            return { id: image.id, url: viewerUrl };
          }
        });

        const results = await Promise.all(urlPromises);
        const urlMap = {};
        results.forEach(result => {
          if (result.url) {
            urlMap[result.id] = result.url;
          }
        });
        console.log('Authenticated URLs created:', Object.keys(urlMap).length, 'successful');
        setAuthenticatedImageUrls(urlMap);
      };

      createAuthenticatedUrls();
    }

    // Cleanup URLs when modal closes
    return () => {
      Object.values(authenticatedImageUrls).forEach(url => {
        if (url && url.startsWith('blob:')) {
          console.log('Cleaning up blob URL');
          window.URL.revokeObjectURL(url);
        }
      });
      if (!isOpen) {
        setAuthenticatedImageUrls({});
      }
    };
  }, [isOpen, record]);

  if (!isOpen || !record) return null;

  // Filter images and documents
  const images = record.files?.filter(file => 
    file.file_type.includes('image')
  ) || [];
  
  const documents = record.files?.filter(file => 
    !file.file_type.includes('image')
  ) || [];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    return (bytes / 1024 / 1024).toFixed(2);
  };

  const openImageViewer = (index) => {
    setCurrentImageIndex(index);
    setIsImageViewerOpen(true);
  };

  const openImageInNewTab = (image) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to view images');
      return;
    }
    
    const filename = image.filename;
    const viewerUrl = `http://localhost:5000/api/files/view/${filename}?token=${token}`;
    window.open(viewerUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
  };

  const analyzeDocument = async (file) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to analyze documents');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/ai/analyze/document/${file.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        // Open the analysis result in a new window/modal
        const analysisWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
        analysisWindow.document.write(`
          <html>
            <head>
              <title>AI Analysis - ${file.original_filename}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                h1 { color: #2563eb; }
                pre { background: #f3f4f6; padding: 15px; border-radius: 8px; white-space: pre-wrap; }
              </style>
            </head>
            <body>
              <h1>AI Analysis Results</h1>
              <p><strong>Document:</strong> ${file.original_filename}</p>
              <p><strong>Analysis Date:</strong> ${new Date().toLocaleString()}</p>
              <hr>
              <pre>${data.analysis.aiAnalysis.fullAnalysis}</pre>
            </body>
          </html>
        `);
      } else {
        alert(`Analysis failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Document analysis error:', error);
      alert('Failed to analyze document');
    }
  };

  const closeImageViewer = () => {
    setIsImageViewerOpen(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleDownload = async (file) => {
    try {
      console.log('Handling file:', file.original_filename, 'Type:', file.file_type);
      
      // Get the auth token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to access files');
        return;
      }

      // For PDFs and images, use the new direct viewer route
      if (file.file_type === 'application/pdf') {
        console.log('Opening PDF with direct viewer:', file.original_filename);
        // Use filename directly from database
        const filename = file.filename;
        const viewerUrl = `http://localhost:5000/api/files/view/${filename}?token=${token}`;
        
        const newWindow = window.open(viewerUrl, '_blank', 'width=1000,height=700,scrollbars=yes,resizable=yes');
        if (!newWindow) {
          alert('Please allow popups to view PDFs');
        }
        return;
      }

      // For images, also use the direct viewer
      if (file.file_type.includes('image')) {
        console.log('Opening image with direct viewer:', file.original_filename);
        // Use filename directly from database
        const filename = file.filename;
        const viewerUrl = `http://localhost:5000/api/files/view/${filename}?token=${token}`;
        console.log('Generated viewer URL:', viewerUrl);
        
        const newWindow = window.open(viewerUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
        if (!newWindow) {
          alert('Please allow popups to view images');
        }
        return;
      }

      // For other file types, download normally
      console.log('Downloading file:', file.original_filename);

      // Fetch the file with authentication
      const response = await fetch(file.url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': '*/*'
        }
      });

      console.log('Download response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Download failed:', response.status, errorText);
        throw new Error(`Failed to download file: ${response.status} - ${errorText}`);
      }

      // Get the file blob
      const blob = await response.blob();
      console.log('File blob size:', blob.size, 'type:', blob.type);
      
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.original_filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);

      console.log('File download initiated successfully');
    } catch (error) {
      console.error('Error handling file:', error);
      alert(`Failed to handle file: ${error.message}`);
    }
  };

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-medical-light">
            <div>
              <h2 className="text-xl font-bold text-medical-dark">{record.title}</h2>
              <p className="text-medical-text">{record.family_member_name} • {formatDate(record.date)}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-medical-primary mb-1">Record Type</label>
                  <p className="text-medical-dark">{record.record_type}</p>
                </div>
                
                {record.doctor_name && (
                  <div>
                    <label className="block text-sm font-medium text-medical-primary mb-1">Doctor</label>
                    <p className="text-medical-dark">{record.doctor_name}</p>
                  </div>
                )}
                
                {record.hospital_name && (
                  <div>
                    <label className="block text-sm font-medium text-medical-primary mb-1">Hospital/Clinic</label>
                    <p className="text-medical-dark">{record.hospital_name}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {record.follow_up_date && (
                  <div>
                    <label className="block text-sm font-medium text-medical-primary mb-1">Follow-up Date</label>
                    <p className="text-medical-dark">{formatDate(record.follow_up_date)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Medical Details */}
            <div className="space-y-4">
              {record.diagnosis && (
                <div>
                  <label className="block text-sm font-medium text-medical-primary mb-2">Diagnosis</label>
                  <p className="text-medical-dark bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{record.diagnosis}</p>
                </div>
              )}
              
              {record.symptoms && (
                <div>
                  <label className="block text-sm font-medium text-medical-primary mb-2">Symptoms</label>
                  <p className="text-medical-dark bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{record.symptoms}</p>
                </div>
              )}
              
              {record.treatment && (
                <div>
                  <label className="block text-sm font-medium text-medical-primary mb-2">Treatment</label>
                  <p className="text-medical-dark bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{record.treatment}</p>
                </div>
              )}
              
              {record.medications && (
                <div>
                  <label className="block text-sm font-medium text-medical-primary mb-2">Medications</label>
                  <p className="text-medical-dark bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{record.medications}</p>
                </div>
              )}
              
              {record.notes && (
                <div>
                  <label className="block text-sm font-medium text-medical-primary mb-2">Additional Notes</label>
                  <p className="text-medical-dark bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{record.notes}</p>
                </div>
              )}
            </div>

            {/* Attached Files */}
            {(images.length > 0 || documents.length > 0) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-medical-dark border-b border-medical-light pb-2">
                  Attached Files
                </h3>

                {/* Images */}
                {images.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-medical-primary mb-3">Images ({images.length})</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {images.map((image, index) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={authenticatedImageUrls[image.id] || image.url}
                            alt={image.original_filename}
                            className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-medical-light"
                            onClick={() => openImageViewer(index)}
                            onError={(e) => {
                              console.error('Image failed to load:', image.url);
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMSA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDMgOUwxMC45MSA4LjI2TDEyIDJaIiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg==';
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-lg transition-all flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
                              <button
                                onClick={(e) => {e.stopPropagation(); openImageViewer(index);}}
                                className="text-white text-lg bg-black bg-opacity-50 rounded-full p-1 hover:bg-opacity-70"
                                title="View in modal"
                              >
                                🔍
                              </button>
                              <button
                                onClick={(e) => {e.stopPropagation(); openImageInNewTab(image);}}
                                className="text-white text-lg bg-black bg-opacity-50 rounded-full p-1 hover:bg-opacity-70"
                                title="Open in new tab"
                              >
                                �
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 truncate" title={image.original_filename}>
                            {image.original_filename}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents */}
                {documents.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-medical-primary mb-3">Documents ({documents.length})</h4>
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-medical-light">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">
                              {doc.file_type.includes('pdf') ? '📄' : '📝'}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-medical-dark">{doc.original_filename}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(doc.file_size)} MB</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownload(doc)}
                            className="px-3 py-1 bg-medical-primary text-white text-sm rounded-lg hover:bg-medical-secondary transition-colors"
                          >
                            {doc.file_type === 'application/pdf' ? 'View PDF' : 'Download'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end p-6 border-t border-medical-light">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {isImageViewerOpen && images.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-60 flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full">
            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-4xl hover:text-gray-300 z-10"
                >
                  ‹
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-4xl hover:text-gray-300 z-10"
                >
                  ›
                </button>
              </>
            )}

            {/* Close Button */}
            <button
              onClick={closeImageViewer}
              className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-10"
            >
              ×
            </button>

            {/* Image */}
            <img
              src={authenticatedImageUrls[images[currentImageIndex]?.id] || images[currentImageIndex]?.url}
              alt={images[currentImageIndex]?.original_filename}
              className="max-w-full max-h-full object-contain"
            />

            {/* Image Info */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-center bg-black bg-opacity-50 px-4 py-2 rounded-lg">
              <p className="text-sm">{images[currentImageIndex]?.original_filename}</p>
              {images.length > 1 && (
                <p className="text-xs text-gray-300">{currentImageIndex + 1} of {images.length}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MedicalRecordModal;
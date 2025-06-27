import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onUploadStart: () => void;
  onUploadComplete: () => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onUploadStart, onUploadComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: 'uploading' | 'success' | 'error' }>({});
  const [uploadedFiles, setUploadedFiles] = useState<{ file: File; id: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFiles = async (files: File[]) => {
    onUploadStart();
    
    // Create file objects with unique IDs
    const fileObjects = files.map(file => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));
    
    setUploadedFiles(prev => [...prev, ...fileObjects]);

    for (const { file, id } of fileObjects) {
      setUploadStatus(prev => ({ ...prev, [id]: 'uploading' }));
      setUploadProgress(prev => ({ ...prev, [id]: 0 }));

      try {
        const formData = new FormData();
        formData.append('image', file);

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(prev => ({ ...prev, [id]: progress }));
          }
        });

        xhr.onload = () => {
          if (xhr.status === 200) {
            setUploadStatus(prev => ({ ...prev, [id]: 'success' }));
            setUploadProgress(prev => ({ ...prev, [id]: 100 }));
            
            // Remove the file from the list after 3 seconds
            setTimeout(() => {
              setUploadedFiles(prev => prev.filter(f => f.id !== id));
              setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[id];
                return newProgress;
              });
              setUploadStatus(prev => {
                const newStatus = { ...prev };
                delete newStatus[id];
                return newStatus;
              });
            }, 3000);
          } else {
            setUploadStatus(prev => ({ ...prev, [id]: 'error' }));
          }
        };

        xhr.onerror = () => {
          setUploadStatus(prev => ({ ...prev, [id]: 'error' }));
        };

        xhr.open('POST', '/api/upload');
        xhr.send(formData);
      } catch (error) {
        console.error('Upload error:', error);
        setUploadStatus(prev => ({ ...prev, [id]: 'error' }));
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Call completion callback after a short delay to allow all uploads to complete
    setTimeout(() => {
      onUploadComplete();
    }, 2000);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
    setUploadStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[fileId];
      return newStatus;
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Upload Zone */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-white/50 hover:border-gray-400 hover:bg-white/70'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center space-y-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
            isDragging ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-600' : 'text-gray-600'}`} />
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isDragging ? 'Drop your images here' : 'Upload Images'}
            </h3>
            <p className="text-gray-600 mb-4">
              Drag and drop your images here, or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports JPG, PNG, GIF up to 10MB each
            </p>
          </div>
          
          <button
            type="button"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Upload className="w-5 h-5 mr-2" />
            Choose Files
          </button>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="font-medium text-gray-900">Uploading Files</h4>
          {uploadedFiles.map(({ file, id }) => {
            const progress = uploadProgress[id] || 0;
            const status = uploadStatus[id] || 'uploading';
            
            return (
              <div key={id} className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <ImageIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {status === 'uploading' && (
                      <span className="text-sm text-blue-600">{progress}%</span>
                    )}
                    {status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <button
                      onClick={() => removeFile(id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {status === 'uploading' && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
                
                {status === 'success' && (
                  <div className="text-sm text-green-600">Upload completed successfully</div>
                )}
                
                {status === 'error' && (
                  <div className="text-sm text-red-600">Upload failed. Please try again.</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
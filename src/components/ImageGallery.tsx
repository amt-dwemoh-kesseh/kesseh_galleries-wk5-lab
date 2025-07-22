import React, { useState } from 'react';
import { Trash2, Calendar, HardDrive, Eye, Download } from 'lucide-react';
import { ImageModal } from './ImageModal';

interface Image {
  key: string;
  url: string;
  lastModified: string;
  size: number;
}

interface ImageGalleryProps {
  images: Image[];
  isUploading: boolean;
  onDeleteImage: (key: string) => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, isUploading, onDeleteImage }) => {
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [deletingImages, setDeletingImages] = useState<Set<string>>(new Set());

  const handleDeleteClick = async (image: Image, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this image?')) {
      setDeletingImages(prev => new Set(prev).add(image.key));
      try {
        await onDeleteImage(image.key);
      } finally {
        setDeletingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(image.key);
          return newSet;
        });
      }
    }
  };

  const handleDownload = async (image: Image, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.key.split('/').pop() || 'image';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (images.length === 0 && !isUploading) {
    return null;
  }

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Gallery</h2>
          <p className="text-gray-600">{images.length} images</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((image) => {
            const isDeleting = deletingImages.has(image.key);
            
            return (
              <div
                key={image.key}
                className={`group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer ${
                  isDeleting ? 'opacity-50 scale-95' : 'hover:scale-105'
                }`}
                onClick={() => setSelectedImage(image)}
              >
                {/* Image */}
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.key}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(image);
                      }}
                      className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      onClick={(e) => handleDownload(image, e)}
                      className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(image, e)}
                      disabled={isDeleting}
                      className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                  
                  {isDeleting && (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                      <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full" />
                    </div>
                  )}
                </div>
                
                {/* Image Info */}
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 truncate mb-2">
                    {image.key.split('/').pop()}
                  </h3>
                  
                  <div className="space-y-1 text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(image.lastModified)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <HardDrive className="w-3 h-3" />
                      <span>{formatFileSize(image.size)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDelete={() => {
            handleDeleteClick(selectedImage, { stopPropagation: () => {} } as React.MouseEvent);
            setSelectedImage(null);
          }}
          onDownload={() => handleDownload(selectedImage, { stopPropagation: () => {} } as React.MouseEvent)}
        />
      )}
    </>
  );
};
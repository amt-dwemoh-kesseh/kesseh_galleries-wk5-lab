import React, { useState, useEffect } from "react";
import { ImageGallery } from "./components/ImageGallery";
import { ImageUpload } from "./components/ImageUpload";
import { Header } from "./components/Header";
import { Pagination } from "./components/Pagination";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { ErrorMessage } from "./components/ErrorMessage";
import { GalleryVertical as Gallery } from "lucide-react";

interface Image {
  key: string;
  url: string;
  lastModified: string;
  size: number;
}

interface ApiResponse {
  images: Image[];
  totalCount: number;
  hasMore: boolean;
}

function App() {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const imagesPerPage = 12;

  const fetchImages = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/images?page=${page}&limit=${imagesPerPage}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch images");
      }

      const data: ApiResponse = await response.json();
      setImages(data.images);
      setTotalPages(Math.ceil(data.totalCount / imagesPerPage));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages(currentPage);
  }, [currentPage]);

  const handleUploadComplete = () => {
    setIsUploading(false);
    fetchImages(currentPage);
  };

  const handleUploadStart = () => {
    setIsUploading(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteImage = async (imageKey: string) => {
    try {
      const response = await fetch(
        `/api/images/${encodeURIComponent(imageKey)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete image");
      }

      // Refresh the current page
      fetchImages(currentPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete image");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Gallery className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Kesseh Galleries - Cloud Image Management
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload, manage, and share your images with beautiful galleries
            powered by AWS S3
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-12">
          <ImageUpload
            onUploadStart={handleUploadStart}
            onUploadComplete={handleUploadComplete}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-8">
            <ErrorMessage
              message={error}
              onRetry={() => fetchImages(currentPage)}
            />
          </div>
        )}

        {/* Gallery */}
        {!loading && !error && (
          <>
            <ImageGallery
              images={images}
              isUploading={isUploading}
              onDeleteImage={handleDeleteImage}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && !error && images.length === 0 && (
          <div className="text-center py-16">
            <Gallery className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No images yet
            </h3>
            <p className="text-gray-600">
              Upload your first image to get started with your gallery
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 Kesseh Galleries. Powered by S3.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

import React, { useState } from 'react'
import { getPhotoUrl } from '../utils/fileUpload'

const PhotoViewer = ({ photos, activityType, isOpen, onClose, backendUrl }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!isOpen || !photos || photos.length === 0) return null

  const currentPhoto = photos[currentIndex]
  const currentPhotoUrl = getPhotoUrl(currentPhoto, backendUrl)

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length)
  }

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {activityType} Photos ({currentIndex + 1} of {photos.length})
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Photo Content */}
        <div className="p-4">
          <div className="text-center mb-4">
            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              {currentPhotoUrl ? (
                <img 
                  src={currentPhotoUrl} 
                  alt={`${activityType} photo ${currentIndex + 1}`}
                  className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'block'
                  }}
                />
              ) : null}
              <div className="text-6xl mb-4" style={{ display: currentPhotoUrl ? 'none' : 'block' }}>
                📷
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                {currentPhoto}
              </h4>
              <p className="text-sm text-gray-600">
                Photo {currentIndex + 1} of {photos.length}
              </p>
            </div>
            
            {/* Navigation */}
            {photos.length > 1 && (
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={prevPhoto}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  ← Previous
                </button>
                <span className="text-sm text-gray-600">
                  {currentIndex + 1} / {photos.length}
                </span>
                <button
                  onClick={nextPhoto}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Next →
                </button>
              </div>
            )}
          </div>

          {/* Photo List */}
          <div className="mt-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">All Photos:</h5>
            <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`p-1 text-left rounded border transition-colors ${
                    index === currentIndex
                      ? 'bg-blue-100 border-blue-300'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <img 
                    src={getPhotoUrl(photo, backendUrl)}
                    alt={`${activityType} photo ${index + 1}`}
                    className="w-full h-16 object-cover rounded"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                  <div className="w-full h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500" style={{ display: 'none' }}>
                    📷
                  </div>
                  <div className="text-xs font-medium text-gray-700 mt-1">
                    Photo {index + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <div className="text-sm text-green-800">
              <strong>Success:</strong> Real file upload and viewing is now implemented! 
              Click on any photo to view it in full size.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default PhotoViewer

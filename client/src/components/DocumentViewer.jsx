import React from 'react';

const DocumentViewer = ({ documentUrl, documentName, onClose }) => {
  const getFileType = (url) => {
    if (url.includes('.pdf')) return 'pdf';
    if (url.includes('.doc') || url.includes('.docx')) return 'word';
    return 'unknown';
  };

  const fileType = getFileType(documentUrl);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">
              {fileType === 'pdf' ? '📄' : fileType === 'word' ? '📝' : '📎'}
            </span>
            <h3 className="text-lg font-semibold text-gray-900">
              {documentName || 'Document Viewer'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          {fileType === 'pdf' ? (
            <iframe
              src={documentUrl}
              className="w-full h-full border-0 rounded"
              title="PDF Viewer"
            />
          ) : fileType === 'word' ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="text-6xl mb-4">📝</div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                Word Document
              </h4>
              <p className="text-gray-600 mb-4">
                Word documents cannot be previewed directly in the browser.
              </p>
              <div className="space-y-2">
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download Document
                </a>
                <p className="text-sm text-gray-500">
                  Click to download and open in Microsoft Word or Google Docs
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="text-6xl mb-4">📎</div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                Document
              </h4>
              <p className="text-gray-600 mb-4">
                This file type cannot be previewed directly.
              </p>
              <a
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download Document
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {fileType === 'pdf' ? 'PDF Document' : fileType === 'word' ? 'Word Document' : 'Document'}
            </div>
            <div className="flex space-x-2">
              <a
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Open in New Tab
              </a>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;

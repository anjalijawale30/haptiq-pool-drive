// src/pages/NotFound.jsx
import React from 'react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-5 text-center">
      <p className="text-8xl font-bold text-gray-200">404</p>
      <p className="text-gray-500 text-lg mt-2">Page not found</p>
      <a href="/" className="mt-6 text-green-600 text-sm font-medium hover:underline">
        Go to verification page
      </a>
    </div>
  );
}

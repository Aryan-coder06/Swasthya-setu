'use client'; // <-- Mark as Client Component

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';

/**
 * This page serves the root route (/) and immediately redirects 
 * the user to the main OCR analysis page (/ocr).
 */
export default function HomePage() {
  const router = useRouter();

  // Use useEffect to perform the client-side redirect after mounting
  useEffect(() => {
    // Replace the current history entry with '/ocr'
    router.replace('/ocr'); 
  }, [router]);

  // Optionally render a small loading message while the redirect happens
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <p className="text-xl text-gray-600">Redirecting to Analysis Tool...</p>
    </div>
  );
}

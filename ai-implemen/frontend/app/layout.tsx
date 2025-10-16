import './globals.css';
import React from 'react';

// This is the default layout file created by Next.js setup

export const metadata = {
  title: 'AI Prescription Analyzer',
  description: 'Structured data extraction and risk analysis using Gemini.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

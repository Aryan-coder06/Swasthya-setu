'use client';

import { useState, useCallback, useMemo } from 'react';
import { analyzePrescription } from '@/lib/api';
import { AnalysisResponse, PatientReport } from '@/lib/types';
import ResultCard from './ResultCard';
import React from 'react';

// Component for the main OCR feature page
export default function OcrPage() {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [result, setResult] = useState<AnalysisResponse | null>(null);

    const isImageFile = useMemo(() => file && file.type.startsWith('image/'), [file]);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0] || null;
        setFile(selectedFile);
        setResult(null); // Clear previous results
        setStatus('idle');
    }, []);

    const handleAnalyze = useCallback(async () => {
        if (!file || !isImageFile) {
            setStatus('error');
            setResult({ status: 'error', message: 'Please select a valid image file (JPG, PNG).', report: undefined });
            return;
        }

        setStatus('loading');
        setResult(null);

        try {
            // 1. Convert File to Base64
            const base64Image = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    // Extract only the Base64 part (after "data:image/jpeg;base64,")
                    const base64String = reader.result?.toString().split(',')[1];
                    if (base64String) {
                        resolve(base64String);
                    } else {
                        reject(new Error("Failed to read image as Base64."));
                    }
                };
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });

            // 2. Call FastAPI Backend
            const response = await analyzePrescription(base64Image);
            setResult(response);
            setStatus(response.status === 'success' ? 'success' : 'error');

        } catch (error: any) {
            console.error("Analysis Failed:", error);
            setStatus('error');
            setResult({ status: 'error', message: `Local processing error: ${error.message || 'Unknown error during file processing.'}`, report: undefined });
        }
    }, [file, isImageFile]);

    const getStatusMessage = () => {
        if (status === 'loading') return "Analyzing prescription with Gemini Vision...";
        if (result) return result.message;
        if (status === 'error') return "An unexpected error occurred. Check the console.";
        if (file) return `File ready: ${file.name}`;
        return "Upload a prescription image to start analysis.";
    };

    const getStatusColor = () => {
        if (status === 'loading') return 'text-blue-500';
        if (status === 'success') return 'text-green-500';
        if (status === 'error') return 'text-red-500';
        return 'text-gray-500';
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <header className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-gray-900">
                        AI Prescription Analyzer
                    </h1>
                    <p className="mt-3 text-xl text-gray-500">
                        Upload a doctor's prescription image for structured data extraction and a simplified, color-coded patient report.
                    </p>
                </header>

                {/* Upload and Action Section */}
                <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                    <div className="flex flex-col space-y-4">
                        {/* File Input */}
                        <label className="block text-sm font-medium text-gray-700">
                            Prescription Image (JPG, PNG)
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />

                        {/* Status Message */}
                        <p className={`text-sm font-medium ${getStatusColor()}`}>
                            {getStatusMessage()}
                        </p>
                        
                        {/* Action Button */}
                        <button
                            onClick={handleAnalyze}
                            disabled={status === 'loading' || !file || !isImageFile}
                            className={`w-full py-3 px-6 rounded-lg text-white font-semibold transition duration-300 shadow-md ${
                                (status === 'loading' || !file || !isImageFile) 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50'
                            }`}
                        >
                            {status === 'loading' ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Analyzing...
                                </span>
                            ) : (
                                "Analyze Prescription"
                            )}
                        </button>
                    </div>
                </div>
                
                {/* Result Display */}
                {status === 'success' && result?.report && (
                    <ResultCard report={result.report as PatientReport} />
                )}

                {status === 'error' && (
                    <div className="mt-8 p-6 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg">
                        <p className="font-bold">Analysis Error:</p>
                        <p className="text-sm">{result?.message || 'Please check your backend connection and API key.'}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// File Location: SWAS/Frontend/app/(routes)/patient/prescription-analyzer/page.tsx

"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UploadCloud, X, Loader2, ZoomIn } from 'lucide-react';

// CORRECTED IMPORT PATHS USING ALIAS
import { analyzePrescription } from '@/lib/api';
import { AnalysisResponse, PatientReport, PrescriptionData, ReportSection, Medication, RiskColor } from '@/lib/types';

// ===================================================================================
// UI HELPER COMPONENTS (Self-contained within this file)
// ===================================================================================

const SectionDisplay: React.FC<{ section: ReportSection }> = ({ section }) => {
  const colorClasses: Record<RiskColor, { border: string; bg: string; text: string }> = {
    red: { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-700' },
    yellow: { border: 'border-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' },
    green: { border: 'border-green-500', bg: 'bg-green-50', text: 'text-green-700' },
  };
  const iconMap: Record<RiskColor, string> = { red: '🚨', yellow: '⚠️', green: '✅' };
  const styles = colorClasses[section.color];

  return (
    <div className={`border-l-4 p-4 rounded-xl shadow-sm ${styles.border} ${styles.bg}`}>
      <h3 className={`text-lg md:text-xl font-bold mb-3 flex items-center ${styles.text}`}>
        <span className="mr-2 text-2xl" role="img" aria-label={section.color}>{iconMap[section.color]}</span>
        {section.title}
      </h3>
      <ul className="list-disc ml-6 space-y-2 text-gray-700">
        {(section.items ?? []).map((point, idx) => (<li key={idx}>{point}</li>))}
      </ul>
    </div>
  );
};

const RawDataDisplay: React.FC<{ data: PrescriptionData }> = ({ data }) => {
  const Label: React.FC<{ k: string; v?: string | null }> = ({ k, v }) => (
    <p className="flex justify-between text-sm">
      <span className="text-gray-500">{k}</span>
      <span className="font-medium text-gray-900">{v || 'N/A'}</span>
    </p>
  );

  return (
    <section className="mt-10 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Raw Extracted Data</h2>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">Encounter Details</h3>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Label k="Hospital" v={data.hospital_name} />
          <Label k="Doctor" v={data.doctor_name} />
          <Label k="Patient" v={data.patient_name} />
          <Label k="Date" v={data.date_issued} />
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">Medications <span className="text-gray-500 text-sm">({data.medications?.length ?? 0})</span></h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Dosage</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Frequency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.medications && data.medications.length > 0 ? (
                data.medications.map((med: Medication, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{med.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{med.dosage || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{med.frequency || 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-500">No medications found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

const ResultCard: React.FC<{ report: PatientReport }> = ({ report }) => {
  if (!report || !report.summary_header) {
    return <div className="p-6 bg-white rounded-xl shadow-lg text-center text-gray-500">Report data is incomplete.</div>;
  }
  const orderedSections = [...(report.report_sections || [])].sort((a, b) => {
    const order: Record<RiskColor, number> = { red: 1, yellow: 2, green: 3 };
    return order[a.color] - order[b.color];
  });

  return (
    <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 mt-8">
      <header className="mb-6 border-b pb-4">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-1">{report.summary_header}</h2>
        <p className="text-gray-600 text-sm">
          {report.patient_name ? `Patient: ${report.patient_name} • ` : ''}
          {report.doctor_name ? `Doctor: ${report.doctor_name} • ` : ''}
          {report.date_issued ? `Date: ${report.date_issued}` : ''}
        </p>
      </header>
      <div className="space-y-6">
        {orderedSections.length > 0 ? orderedSections.map((section, idx) => <SectionDisplay key={idx} section={section} />) : <div className="text-gray-500">No summary sections provided.</div>}
      </div>
      {report.raw_extracted_data && <RawDataDisplay data={report.raw_extracted_data} />}
    </div>
  );
};

// *** FIXED ImagePreviewModal component ***
const ImagePreviewModal: React.FC<{ isOpen: boolean; src: string | null; onClose: () => void }> = ({ isOpen, src, onClose }) => {
    if (!isOpen || !src) return null; // Now checks for the 'isOpen' prop
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 text-white text-3xl z-50">
                <X size={32} />
            </button>
            <div className="relative p-4">
                <img src={src} alt="Prescription Preview" className="max-w-screen-lg max-h-[90vh] object-contain" />
            </div>
        </div>
    );
};

// ===================================================================================
// MAIN PAGE COMPONENT (Refactored for better UI/UX)
// ===================================================================================

export default function PrescriptionAnalyzerPage() {
    const [file, setFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [result, setResult] = useState<AnalysisResponse | null>(null);
    const [isPreviewModalOpen, setPreviewModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cleanup object URL to prevent memory leaks
    useEffect(() => {
        return () => {
            if (imagePreviewUrl) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
        };
    }, [imagePreviewUrl]);

    const handleFileChange = useCallback((selectedFile: File | null) => {
        if (imagePreviewUrl) {
            URL.revokeObjectURL(imagePreviewUrl);
        }
        if (selectedFile) {
            setFile(selectedFile);
            setImagePreviewUrl(URL.createObjectURL(selectedFile));
            setResult(null);
            setStatus('idle');
        }
    }, [imagePreviewUrl]);
    
    const onFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        handleFileChange(file);
    };

    const handleRemoveFile = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering the file input
        setFile(null);
        setImagePreviewUrl(null);
        setResult(null);
        setStatus('idle');
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset file input
        }
    };
    
    const handleAnalyze = useCallback(async () => {
        if (!file) {
            setStatus('error');
            setResult({ status: 'error', message: 'Please select a valid image file.', report: null });
            return;
        }
        setStatus('loading');
        setResult(null);

        try {
            const base64Image = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const base64String = reader.result?.toString().split(',')[1];
                    if (base64String) resolve(base64String);
                    else reject(new Error("Failed to read image as Base64."));
                };
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });
            const response = await analyzePrescription(base64Image);
            setResult(response);
            setStatus(response.status === 'success' ? 'success' : 'error');
        } catch (error: any) {
            console.error("Analysis Failed:", error);
            setStatus('error');
            setResult({ status: 'error', message: `Local processing error: ${error.message || 'Unknown error.'}`, report: null });
        }
    }, [file]);

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">AI Prescription Analyzer</h1>
                    <p className="mt-3 text-xl text-gray-500 max-w-2xl mx-auto">Upload an image of your prescription to get a structured summary and helpful insights.</p>
                </header>

                <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 space-y-6">
                    <div>
                        <input
                            type="file"
                            accept="image/jpeg,image/png"
                            onChange={onFileSelect}
                            ref={fileInputRef}
                            className="hidden"
                        />
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 transition-colors duration-300 ${imagePreviewUrl ? 'p-0' : 'py-12'}`}
                        >
                            {imagePreviewUrl ? (
                                <div className="relative group">
                                    <img src={imagePreviewUrl} alt="Prescription Preview" className="w-full h-auto max-h-80 object-contain rounded-lg" />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center rounded-lg">
                                        <button onClick={(e) => { e.stopPropagation(); setPreviewModalOpen(true); }} className="opacity-0 group-hover:opacity-100 text-white bg-black bg-opacity-50 p-3 rounded-full flex items-center gap-2">
                                            <ZoomIn size={24}/> View Image
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleRemoveFile}
                                        className="absolute -top-3 -right-3 bg-white p-1.5 rounded-full shadow-lg hover:bg-red-100 hover:text-red-600 transition-all"
                                        aria-label="Remove file"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-gray-500">
                                    <UploadCloud className="w-12 h-12 mb-4 text-gray-400" />
                                    <p className="text-lg font-semibold text-gray-700">Click to upload or drag and drop</p>

                                    <p className="text-sm">PNG or JPG</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <button
                        onClick={handleAnalyze}
                        disabled={status === 'loading' || !file}
                        className={`w-full flex items-center justify-center py-3 px-6 rounded-lg text-white font-semibold transition duration-300 shadow-md ${(!file || status === 'loading') ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50'}`}
                    >
                        {status === 'loading' && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        {status === 'loading' ? 'Analyzing...' : 'Analyze Prescription'}
                    </button>
                </div>

                {/* --- RESULT DISPLAY --- */}
                <div className="mt-8">
                    {status === 'success' && result?.report && <ResultCard report={result.report as PatientReport} />}
                    {status === 'error' && (
                        <div className="p-6 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-lg shadow-md">
                            <p className="font-bold">Analysis Error</p>
                            <p className="text-sm">{result?.message || 'Please check your backend connection and API key.'}</p>
                        </div>
                    )}
                </div>
            </div>
            {/* *** FIXED Modal Call *** */}
            <ImagePreviewModal isOpen={isPreviewModalOpen} src={imagePreviewUrl} onClose={() => setPreviewModalOpen(false)} />
        </div>
    );
}
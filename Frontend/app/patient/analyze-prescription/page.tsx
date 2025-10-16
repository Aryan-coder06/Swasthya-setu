// File Location: SWAS/Frontend/app/(routes)/patient/prescription-analyzer/page.tsx

"use client";

import React, { useState, useCallback, useMemo } from 'react';
// CORRECTED IMPORT PATHS USING ALIAS
import { analyzePrescription } from '@/lib/api';
import { AnalysisResponse, PatientReport, PrescriptionData, ReportSection, Medication, RiskColor } from '@/lib/types';

// ===================================================================================
// UI HELPER COMPONENTS (from your GitHub project's ResultCard.tsx)
// These are now self-contained within this single file.
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


// ===================================================================================
// MAIN PAGE COMPONENT (using the UI and logic from your GitHub project)
// ===================================================================================

export default function PrescriptionAnalyzerPage() {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [result, setResult] = useState<AnalysisResponse | null>(null);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0] || null;
        setFile(selectedFile);
        setResult(null);
        setStatus('idle');
    }, []);

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
        <div className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-gray-900">AI Prescription Analyzer</h1>
                    <p className="mt-3 text-xl text-gray-500">Upload a prescription image for structured data extraction and a patient-friendly report.</p>
                </header>

                <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                    <div className="flex flex-col space-y-4">
                        <label className="block text-sm font-medium text-gray-700">Prescription Image (JPG, PNG)</label>
                        <input
                            type="file"
                            accept="image/jpeg,image/png"
                            onChange={handleFileChange}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                         <button
                            onClick={handleAnalyze}
                            disabled={status === 'loading' || !file}
                            className={`w-full py-3 px-6 rounded-lg text-white font-semibold transition duration-300 shadow-md ${(!file || status === 'loading') ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50'}`}
                        >
                            {status === 'loading' ? 'Analyzing...' : 'Analyze Prescription'}
                        </button>
                    </div>
                </div>

                {status === 'loading' && <p className="text-center text-blue-500 mt-4">Analyzing prescription with Gemini Vision...</p>}

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
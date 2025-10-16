'use client';
import React, { useState } from 'react';
import {
  PatientReport,
  ReportSection,
  PrescriptionData,
  Medication,
  RiskColor,
} from '../../lib/types';

interface ResultCardProps {
  report: PatientReport;
}

const colorClasses: Record<RiskColor, { border: string; bg: string; text: string }> = {
  red: { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-700' },
  yellow: { border: 'border-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  green: { border: 'border-green-500', bg: 'bg-green-50', text: 'text-green-700' },
};

const iconMap: Record<RiskColor, string> = { red: '🚨', yellow: '⚠️', green: '✅' };

const Pill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center rounded-full border border-gray-300 px-2.5 py-0.5 text-xs font-medium text-gray-700 bg-white">
    {children}
  </span>
);

const Label: React.FC<{ k: string; v?: string | null }> = ({ k, v }) => (
  <p className="flex justify-between text-sm">
    <span className="text-gray-500">{k}</span>
    <span className="font-medium text-gray-900">{v || 'N/A'}</span>
  </p>
);

const SectionDisplay: React.FC<{ section: ReportSection }> = ({ section }) => {
  const styles = colorClasses[section.color];
  return (
    <div className={`border-l-4 p-4 rounded-xl shadow-sm ${styles.border} ${styles.bg}`}>
      <h3 className={`text-lg md:text-xl font-bold mb-3 flex items-center ${styles.text}`}>
        <span className="mr-2 text-2xl" role="img" aria-label={section.color}>
          {iconMap[section.color]}
        </span>
        {section.title}
      </h3>
      <ul className="list-disc ml-6 space-y-2 text-gray-700">
        {(section.items ?? []).map((point, idx) => (
          <li key={idx}>{point}</li>
        ))}
      </ul>
    </div>
  );
};

const RawDataDisplay: React.FC<{ data: PrescriptionData }> = ({ data }) => {
  const [showRaw, setShowRaw] = useState(false);
  const vitalsEntries = data.vitals ? Object.entries(data.vitals) : [];

  return (
    <section className="mt-10 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Raw Extracted Data</h2>

      {/* Encounter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Encounter */}
        <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Encounter</h3>
          <div className="space-y-2">
            <Label k="Hospital" v={data.hospital_name} />
            <Label k="Doctor" v={data.doctor_name} />
            <Label
              k="Patient"
              v={
                data.patient_name
                  ? `${data.patient_name}${data.patient_id ? ` (ID: ${data.patient_id})` : ''}`
                  : null
              }
            />
            <Label k="Date" v={data.date_issued} />
          </div>
        </div>

        {/* Vitals & Diagnoses */}
        <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Vitals & Diagnoses</h3>

          {/* Vitals as chips */}
          <div className="mb-3">
            {vitalsEntries.length ? (
              <div className="flex flex-wrap gap-2">
                {vitalsEntries.map(([k, v]) => (
                  <span
                    key={k}
                    className="inline-flex items-center rounded-lg bg-white px-2.5 py-1 text-xs shadow border border-gray-200 text-gray-800"
                  >
                    <span className="font-semibold mr-1">{k}:</span> {v}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No vitals detected</p>
            )}
          </div>

          {/* Diagnoses as tags */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Diagnoses</p>
            {data.diseases_diagnoses?.length ? (
              <div className="flex flex-wrap gap-2">
                {data.diseases_diagnoses.map((d, i) => (
                  <span
                    key={`${d}-${i}`}
                    className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs"
                  >
                    {d}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">N/A</p>
            )}
          </div>

          {/* Notes & Precautions */}
          {data.treatment_notes || data.precautions ? (
            <div className="mt-3 space-y-1">
              {data.treatment_notes && (
                <p className="text-sm">
                  <span className="font-semibold text-gray-700">Treatment notes: </span>
                  <span className="text-gray-800">{data.treatment_notes}</span>
                </p>
              )}
              {data.precautions && (
                <p className="text-sm">
                  <span className="font-semibold text-gray-700">Precautions: </span>
                  <span className="text-gray-800">{data.precautions}</span>
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Medications */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">
            Medications <span className="text-gray-500 text-sm">({data.medications?.length ?? 0})</span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Dosage</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Frequency</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Duration</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.medications?.length ? (
                data.medications.map((med: Medication, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{med.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {med.dosage ? <Pill>{med.dosage}</Pill> : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {med.frequency ? <Pill>{med.frequency}</Pill> : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {med.duration ? <Pill>{med.duration}</Pill> : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{med.notes || <span className="text-gray-400">—</span>}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">
                    No medications found in the extraction.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collapsible raw lines */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="w-full text-left px-5 py-3 flex items-center justify-between hover:bg-gray-50"
        >
          <span className="text-sm font-semibold text-gray-800">Raw Lines</span>
          <span className="text-gray-500 text-xs">{showRaw ? 'Hide' : 'Show'}</span>
        </button>
        {showRaw && (
          <div className="px-5 pb-4">
            {data.raw_lines?.length ? (
              <pre className="bg-gray-50 p-3 rounded text-xs text-gray-800 overflow-auto max-h-64">
                {data.raw_lines.join('\n')}
              </pre>
            ) : (
              <p className="text-sm text-gray-500 px-1 pb-4">No raw lines captured.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

const ResultCard: React.FC<ResultCardProps> = ({ report }) => {
  if (!report || !report.summary_header) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-lg text-center text-gray-500">
        Report data is incomplete.
      </div>
    );
  }

  const red = report.report_sections?.filter((s) => s.color === 'red') ?? [];
  const yellow = report.report_sections?.filter((s) => s.color === 'yellow') ?? [];
  const green = report.report_sections?.filter((s) => s.color === 'green') ?? [];
  const ordered = [...red, ...yellow, ...green];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-100">
      <header className="mb-6 border-b pb-4">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-1">{report.summary_header}</h2>
        {(report.patient_name || report.doctor_name || report.date_issued) && (
          <p className="text-gray-600 text-sm">
            {report.patient_name ? `Patient: ${report.patient_name} • ` : ''}
            {report.doctor_name ? `Doctor: ${report.doctor_name} • ` : ''}
            {report.date_issued ? `Date: ${report.date_issued}` : ''}
          </p>
        )}
      </header>

      <div className="space-y-6">
        {ordered.length ? (
          ordered.map((section, idx) => <SectionDisplay key={idx} section={section} />)
        ) : (
          <div className="text-gray-500">No summary sections provided.</div>
        )}
      </div>

      <RawDataDisplay data={report.raw_extracted_data} />
    </div>
  );
};

export default ResultCard;

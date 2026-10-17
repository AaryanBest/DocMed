import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  ArrowRight,
  Sparkles,
  Download,
  AlertCircle,
  CheckCircle2,
  Stethoscope,
  UserCheck,
  Loader2,
  BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { MedicalReport, ComparisonResult } from '../types.ts';
import { compareReports } from '../services/api.ts';

interface ComparisonViewProps {
  reports: MedicalReport[];
  initialReport1Id?: string;
  initialReport2Id?: string;
  currentMode: 'patient' | 'doctor';
  currentLanguage: 'en' | 'hinglish';
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  reports,
  initialReport1Id,
  initialReport2Id,
  currentMode,
  currentLanguage,
}) => {
  const [report1Id, setReport1Id] = useState<string>(initialReport1Id || reports[0]?.id || '');
  const [report2Id, setReport2Id] = useState<string>(initialReport2Id || reports[1]?.id || '');
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [filterChangedOnly, setFilterChangedOnly] = useState<boolean>(false);

  useEffect(() => {
    if (report1Id && report2Id && report1Id !== report2Id) {
      runComparison(report1Id, report2Id);
    }
  }, [report1Id, report2Id, currentMode, currentLanguage]);

  const runComparison = async (id1: string, id2: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await compareReports({
        reportId1: id1,
        reportId2: id2,
        mode: currentMode,
        language: currentLanguage,
      });
      setComparison(res);
    } catch (err: any) {
      console.error('Comparison error:', err);
      setError(err.message || 'Failed to compare reports.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const rep1 = reports.find(r => r.id === report1Id);
  const rep2 = reports.find(r => r.id === report2Id);

  const chartData = comparison?.matchedParameters
    .filter(p => p.val1.num !== null && p.val2.num !== null)
    .slice(0, 8)
    .map(p => ({
      name: p.name.length > 14 ? p.name.substring(0, 14) + '...' : p.name,
      fullName: p.name,
      Baseline: p.val1.num,
      Followup: p.val2.num,
      unit: p.unit,
    })) || [];

  const displayedParams = comparison?.matchedParameters.filter(p => {
    if (!filterChangedOnly) return true;
    return p.deltaNum !== null && Math.abs(p.deltaNum) > 0.01;
  }) || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header & Controls */}
      <div className="border-b border-zinc-200/80 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
            Longitudinal Report Comparison
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Track biomarker trajectories across dates, compare overlapping laboratory parameters, and understand progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            disabled={!comparison}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Comparison</span>
          </button>
        </div>
      </div>

      {/* Report Selectors */}
      <div className="bg-white border border-zinc-200/90 rounded-xl p-5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Baseline */}
          <div className="md:col-span-5 space-y-1">
            <label className="block text-xs font-semibold text-zinc-700">
              1. Earlier / Baseline Report
            </label>
            <select
              value={report1Id}
              onChange={(e) => setReport1Id(e.target.value)}
              className="w-full text-xs p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 font-medium focus:outline-none focus:ring-1 focus:ring-teal-700"
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.examinationDate} — {r.originalFilename} ({r.reportCategory})
                </option>
              ))}
            </select>
            {rep1 && (
              <p className="text-[11px] text-zinc-400">
                {rep1.laboratoryName} · {rep1.extractedParameters.length} extracted tests
              </p>
            )}
          </div>

          <div className="md:col-span-2 flex justify-center py-1 md:py-0">
            <ArrowRight className="w-4 h-4 text-zinc-400" />
          </div>

          {/* Follow-up */}
          <div className="md:col-span-5 space-y-1">
            <label className="block text-xs font-semibold text-zinc-700">
              2. Later / Follow-up Report
            </label>
            <select
              value={report2Id}
              onChange={(e) => setReport2Id(e.target.value)}
              className="w-full text-xs p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 font-medium focus:outline-none focus:ring-1 focus:ring-teal-700"
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id} disabled={r.id === report1Id}>
                  {r.examinationDate} — {r.originalFilename} ({r.reportCategory})
                </option>
              ))}
            </select>
            {rep2 && (
              <p className="text-[11px] text-zinc-400">
                {rep2.laboratoryName} · {rep2.extractedParameters.length} extracted tests
              </p>
            )}
          </div>
        </div>

        {report1Id === report2Id && (
          <div className="mt-3 text-xs text-amber-800 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Please select two distinct reports to compare results.</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="bg-white border border-zinc-200/90 rounded-xl p-12 text-center space-y-2">
          <Loader2 className="w-6 h-6 text-teal-700 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-zinc-800">
            Matching parameters & evaluating changes...
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {comparison && !loading && (
        <div className="space-y-6">
          {/* AI Clinical Comparison Narrative */}
          <div className="bg-white border border-zinc-200/90 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-700" />
                <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  {currentMode === 'patient'
                    ? 'What Has Changed? (Patient Explanation)'
                    : 'Clinical Longitudinal Assessment'}
                </h2>
              </div>
              <span className="text-[11px] text-zinc-400">
                {currentMode === 'patient' ? 'Patient Mode' : 'Doctor Mode'}
              </span>
            </div>

            <div className="text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap bg-zinc-50 p-4 rounded-lg border border-zinc-200/70">
              {currentMode === 'patient'
                ? comparison.patientExplanation
                : comparison.doctorInterpretation}
            </div>
          </div>

          {/* Numerical Trend Graph */}
          {chartData.length > 0 && (
            <div className="bg-white border border-zinc-200/90 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-zinc-400" />
                  <span>Measurement Comparisons</span>
                </h3>
                <span className="text-[11px] text-zinc-400">
                  {rep1?.examinationDate} vs {rep2?.examinationDate}
                </span>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#71717a' }}
                      angle={-10}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#71717a' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-zinc-900 text-white text-xs p-2 rounded shadow-md space-y-0.5">
                              <p className="font-bold text-teal-300">{data.fullName}</p>
                              <p>Baseline: <span className="font-mono">{data.Baseline}</span> {data.unit}</p>
                              <p>Follow-up: <span className="font-mono">{data.Followup}</span> {data.unit}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                    <Bar dataKey="Baseline" fill="#a1a1aa" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Followup" fill="#0f766e" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Clean Side-by-Side Comparison Table (No repetitive cards!) */}
          <div className="bg-white border border-zinc-200/90 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-3 border-b border-zinc-200/80 flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-900">
                Matched Parameters ({displayedParams.length})
              </span>
              <label className="flex items-center gap-2 text-zinc-600 cursor-pointer text-[11px]">
                <input
                  type="checkbox"
                  checked={filterChangedOnly}
                  onChange={(e) => setFilterChangedOnly(e.target.checked)}
                  className="rounded text-teal-700"
                />
                <span>Show changed values only</span>
              </label>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50/80 text-zinc-500 border-b border-zinc-200/80 font-medium">
                  <tr>
                    <th className="py-3 px-4 font-semibold text-zinc-700">Parameter</th>
                    <th className="py-3 px-4 font-semibold text-zinc-700">Reference Range</th>
                    <th className="py-3 px-4 text-right font-semibold text-zinc-700">
                      Earlier ({rep1?.examinationDate})
                    </th>
                    <th className="py-3 px-4 text-right font-semibold text-zinc-700">
                      Later ({rep2?.examinationDate})
                    </th>
                    <th className="py-3 px-4 text-right font-semibold text-zinc-700">Change</th>
                    <th className="py-3 px-4 text-center font-semibold text-zinc-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-sans">
                  {displayedParams.map((m, idx) => {
                    const isImproved = m.trend === 'improved';
                    const isWorsened = m.trend === 'worsened';
                    const hasDelta = m.deltaNum !== null;
                    const deltaPositive = hasDelta && (m.deltaNum || 0) > 0;

                    return (
                      <tr key={idx} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="py-3 px-4 font-medium text-zinc-900">
                          {m.name}
                        </td>
                        <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                          {m.referenceRange || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          <span className={m.val1.flag !== 'normal' ? 'font-bold text-amber-800' : 'text-zinc-800'}>
                            {m.val1.value}
                          </span>{' '}
                          <span className="text-zinc-400 text-[10px]">{m.unit}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          <span className={m.val2.flag !== 'normal' ? 'font-bold text-amber-800' : 'text-zinc-800'}>
                            {m.val2.value}
                          </span>{' '}
                          <span className="text-zinc-400 text-[10px]">{m.unit}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          {hasDelta ? (
                            <span className={deltaPositive ? 'text-teal-800' : 'text-zinc-700'}>
                              {deltaPositive ? `+${m.deltaNum}` : m.deltaNum}
                              {m.percentChange !== null && (
                                <span className="text-[10px] font-normal text-zinc-400 ml-1">
                                  ({m.percentChange > 0 ? `+${m.percentChange}` : m.percentChange}%)
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isImproved && (
                            <span className="text-[10px] font-bold text-emerald-700 uppercase">
                              Improved
                            </span>
                          )}
                          {isWorsened && (
                            <span className="text-[10px] font-bold text-amber-800 uppercase">
                              Warrant Review
                            </span>
                          )}
                          {!isImproved && !isWorsened && (
                            <span className="text-[10px] text-zinc-500">
                              {m.trend}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

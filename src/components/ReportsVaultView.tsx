import React, { useState } from 'react';
import {
  Search,
  FileText,
  Calendar,
  Building2,
  Star,
  GitCompare,
  Trash2,
  ExternalLink,
  Plus,
  LayoutList,
  LayoutGrid,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { MedicalReport } from '../types.ts';
import { deleteReport, updateReport } from '../services/api.ts';

interface ReportsVaultViewProps {
  reports: MedicalReport[];
  onOpenReport: (report: MedicalReport) => void;
  onOpenCompare: (report1: MedicalReport, report2?: MedicalReport) => void;
  onOpenUpload: () => void;
  onReportsUpdated: () => void;
}

export const ReportsVaultView: React.FC<ReportsVaultViewProps> = ({
  reports,
  onOpenReport,
  onOpenCompare,
  onOpenUpload,
  onReportsUpdated
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const categories = ['all', ...Array.from(new Set(reports.map(r => r.reportCategory).filter(Boolean)))];

  const filteredReports = reports.filter((r) => {
    const query = searchTerm.toLowerCase();
    const matchSearch =
      r.originalFilename.toLowerCase().includes(query) ||
      r.laboratoryName.toLowerCase().includes(query) ||
      r.reportCategory.toLowerCase().includes(query) ||
      r.extractedParameters.some(p => p.name.toLowerCase().includes(query) || p.originalValue.toLowerCase().includes(query));

    const matchCategory = selectedCategory === 'all' || r.reportCategory === selectedCategory;
    const matchFav = !onlyFavorites || r.isFavorite;

    return matchSearch && matchCategory && matchFav;
  });

  const handleToggleFavorite = async (e: React.MouseEvent, report: MedicalReport) => {
    e.stopPropagation();
    try {
      await updateReport(report.id, { isFavorite: !report.isFavorite });
      onReportsUpdated();
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation();
    if (confirm('Permanently remove this report from your medical vault?')) {
      try {
        await deleteReport(reportId);
        onReportsUpdated();
      } catch (err) {
        console.error('Failed to delete report:', err);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Title & Top Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
            Personal Medical Records Vault
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Searchable, private archive of diagnostic lab reports and AI-extracted parameters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Report</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Search, Category Filter, Favorites, View Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tests (e.g. Hemoglobin, HbA1c), lab, or document..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-700 text-zinc-900 placeholder:text-zinc-400"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-1.5 px-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-700 text-zinc-700 font-medium"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Categories' : c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors ${
              onlyFavorites
                ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-500 text-amber-500' : 'text-zinc-400'}`} />
            <span>Starred</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 bg-zinc-100 rounded-lg border border-zinc-200/80">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1 rounded ${
                viewMode === 'table' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500'
              }`}
              title="Table Ledger View"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${
                viewMode === 'grid' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary Display: Table Ledger or Minimalist Grid */}
      {viewMode === 'table' ? (
        <div className="bg-white border border-zinc-200/90 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-50/80 text-zinc-500 border-b border-zinc-200/80 font-medium">
                <tr>
                  <th className="py-3 px-4 font-semibold text-zinc-700">Document</th>
                  <th className="py-3 px-4 font-semibold text-zinc-700">Category</th>
                  <th className="py-3 px-4 font-semibold text-zinc-700">Exam Date</th>
                  <th className="py-3 px-4 font-semibold text-zinc-700">Laboratory</th>
                  <th className="py-3 px-4 font-semibold text-zinc-700">Extracted Status</th>
                  <th className="py-3 px-4 font-semibold text-right text-zinc-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-sans">
                {filteredReports.map((report) => {
                  const abnormalCount = report.extractedParameters.filter(
                    (p) => p.abnormalFlag !== 'normal'
                  ).length;

                  return (
                    <tr
                      key={report.id}
                      onClick={() => onOpenReport(report)}
                      className="hover:bg-zinc-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-medium text-zinc-900">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={(e) => handleToggleFavorite(e, report)}
                            className="text-zinc-300 hover:text-amber-500 transition-colors p-0.5"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                report.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                              }`}
                            />
                          </button>
                          <FileText className="w-4 h-4 text-zinc-400 group-hover:text-teal-700 transition-colors shrink-0" />
                          <span className="truncate max-w-xs">{report.originalFilename}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-600">
                        <span>{report.reportCategory}</span>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-500 font-mono text-[11px] tabular-nums">
                        {report.examinationDate || 'N/A'}
                      </td>

                      <td className="py-3.5 px-4 text-zinc-500 truncate max-w-[160px]">
                        {report.laboratoryName}
                      </td>

                      <td className="py-3.5 px-4">
                        {abnormalCount > 0 ? (
                          <span className="text-[11px] font-medium text-amber-800">
                            {abnormalCount} flagged out of range
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-500">
                            All {report.extractedParameters.length} normal
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenCompare(report);
                            }}
                            className="px-2 py-1 text-[11px] font-medium text-zinc-600 hover:text-teal-800 rounded hover:bg-zinc-100 transition-colors"
                            title="Compare this report"
                          >
                            <GitCompare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, report.id)}
                            className="p-1 text-zinc-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                            title="Delete report"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[11px] font-semibold text-teal-800 group-hover:underline ml-1">
                            Open
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredReports.map((report) => {
            const abnormalCount = report.extractedParameters.filter(
              (p) => p.abnormalFlag !== 'normal'
            ).length;

            return (
              <div
                key={report.id}
                onClick={() => onOpenReport(report)}
                className="bg-white border border-zinc-200/90 rounded-xl p-4 shadow-xs hover:border-zinc-300 transition-colors cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-zinc-900 truncate group-hover:text-teal-800">
                      {report.originalFilename}
                    </span>
                    <button
                      onClick={(e) => handleToggleFavorite(e, report)}
                      className="text-zinc-300 hover:text-amber-500 p-0.5"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          report.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-[11px] text-teal-800 font-medium">
                    {report.reportCategory}
                  </p>

                  <div className="text-[11px] text-zinc-500 space-y-0.5 mt-2">
                    <p>Examined: {report.examinationDate || 'N/A'}</p>
                    <p className="truncate">Lab: {report.laboratoryName}</p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-zinc-100 text-[11px]">
                    {abnormalCount > 0 ? (
                      <span className="text-amber-800 font-medium">
                        {abnormalCount} parameters flagged
                      </span>
                    ) : (
                      <span className="text-zinc-500">
                        {report.extractedParameters.length} parameters normal
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCompare(report);
                    }}
                    className="text-[11px] font-medium text-zinc-600 hover:text-teal-800"
                  >
                    Compare
                  </button>
                  <span className="text-[11px] font-semibold text-teal-800 group-hover:underline">
                    View Details
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredReports.length === 0 && (
        <div className="bg-white border border-zinc-200/90 rounded-xl p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-zinc-300 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-900">No medical records found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Try adjusting your search terms or upload a new medical document to your vault.
          </p>
        </div>
      )}
    </div>
  );
};

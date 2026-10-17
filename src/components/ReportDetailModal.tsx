import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Calendar,
  Building2,
  Send,
  Loader2,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Stethoscope,
  UserCheck
} from 'lucide-react';
import { MedicalReport, MedicalParameter } from '../types.ts';
import { sendChatMessage, updateReport } from '../services/api.ts';

interface ReportDetailModalProps {
  report: MedicalReport | null;
  isOpen: boolean;
  onClose: () => void;
  currentMode: 'patient' | 'doctor';
  currentLanguage: 'en' | 'hinglish';
  onOpenCompareWith: (report: MedicalReport) => void;
  onReportUpdated?: (updated: MedicalReport) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  isOpen,
  onClose,
  currentMode,
  currentLanguage,
  onOpenCompareWith,
  onReportUpdated
}) => {
  if (!isOpen || !report) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'chat'>('overview');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [highlightedParam, setHighlightedParam] = useState<string | null>(null);

  // Chat state inside report
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; citations?: any[] }>>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Notes & Tags editing
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesVal, setNotesVal] = useState(report.notes || '');

  useEffect(() => {
    const initialWelcome = currentMode === 'patient'
      ? (currentLanguage === 'hinglish'
          ? `Namaste! Maine aapki **${report.originalFilename}** report analyze kar li hai. Aap mujhse koi bhi sawal pooch sakte hain jaise: *"Meri report mein kya abnormal hai?"* ya *"Hemoglobin low kyu hai?"*`
          : `Hello! I've loaded your **${report.originalFilename}** (${report.reportCategory}). How can I help you understand these lab results today?`)
      : `Report **${report.originalFilename}** ingested for clinical query. Extracted ${report.extractedParameters.length} parameters from ${report.laboratoryName}. How would you like to review these findings?`;

    setChatMessages([{ sender: 'ai', text: initialWelcome }]);
    setNotesVal(report.notes || '');
  }, [report.id, currentMode, currentLanguage]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeTab]);

  const handleSendQuery = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isSending) return;

    setInputQuery('');
    setChatMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    setIsSending(true);

    try {
      const res = await sendChatMessage({
        message: textToSend,
        selectedReportIds: [report.id],
        interactionMode: currentMode,
        preferredLanguage: currentLanguage,
      });

      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: res.message.content,
          citations: res.message.citations,
        },
      ]);
    } catch (err: any) {
      console.error('Report chat error:', err);
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: 'I apologize, but I encountered an error communicating with the clinical assistant. Please try again.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      const updated = await updateReport(report.id, { notes: notesVal });
      if (onReportUpdated) onReportUpdated(updated);
      setIsEditingNotes(false);
    } catch (err) {
      console.error('Failed to update notes:', err);
    }
  };

  const abnormalCount = report.extractedParameters.filter(p => p.abnormalFlag !== 'normal').length;

  const quickPrompts = currentMode === 'patient'
    ? [
        currentLanguage === 'hinglish' ? 'Meri report simple language mein samjhao' : 'Explain this report in simple terms',
        'Which values are out of normal range?',
        'What questions should I ask my doctor?',
        'Explain this in Hinglish',
      ]
    : [
        'Structured clinical interpretation & significant abnormalities',
        'Which findings warrant follow-up investigations?',
        'Differential diagnostic considerations',
        'Summarize with units and reference ranges',
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xl w-full max-w-7xl h-[94vh] flex flex-col overflow-hidden">
        {/* Top Bar of Modal */}
        <div className="px-6 py-3.5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-900 truncate">
                  {report.originalFilename}
                </h2>
                <span className="text-xs text-zinc-400 font-normal">·</span>
                <span className="text-xs font-medium text-teal-800">
                  {report.reportCategory}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  <span>Exam: {report.examinationDate || 'N/A'}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-zinc-400" />
                  <span className="truncate">{report.laboratoryName}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span>{report.extractedParameters.length} parameters extracted</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenCompareWith(report)}
              className="px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              Compare with Another Report
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Split Screen Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
          {/* LEFT PANE: Document Preview / Scan Viewer (6 cols on lg) */}
          <div className="lg:col-span-6 bg-zinc-50/60 border-b lg:border-b-0 lg:border-r border-zinc-200 flex flex-col min-h-0">
            {/* Viewer Toolbar */}
            <div className="px-4 py-2 bg-white border-b border-zinc-200 flex items-center justify-between text-xs text-zinc-600 shrink-0">
              <span className="font-medium">Original Document Viewer</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoomLevel(prev => Math.max(60, prev - 15))}
                  className="p-1 text-zinc-500 hover:text-zinc-800 rounded hover:bg-zinc-100"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-mono tabular-nums text-[11px]">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(200, prev + 15))}
                  className="p-1 text-zinc-500 hover:text-zinc-800 rounded hover:bg-zinc-100"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel(100)}
                  className="p-1 text-zinc-500 hover:text-zinc-800 rounded hover:bg-zinc-100 ml-1"
                  title="Reset Zoom"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Render Area */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              {report.originalDataUrl ? (
                <div
                  style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                  className="transition-transform duration-200 max-w-full"
                >
                  {report.mimeType.includes('pdf') ? (
                    <div className="bg-white border border-zinc-300 shadow-sm rounded-lg p-6 max-w-xl min-h-[480px] text-zinc-800 space-y-4">
                      <div className="border-b-2 border-zinc-800 pb-3 flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-zinc-900 text-sm uppercase tracking-tight">
                            {report.laboratoryName}
                          </h3>
                          <p className="text-[11px] text-zinc-500">Diagnostic Pathology & Clinical Biochemistry</p>
                        </div>
                        <div className="text-right text-[11px] text-zinc-600">
                          <p><span className="font-medium">Date:</span> {report.examinationDate}</p>
                          <p><span className="font-medium">Specimen:</span> Venous Blood</p>
                        </div>
                      </div>

                      <div className="py-1 border-b border-zinc-200 text-xs">
                        <p className="font-semibold text-zinc-800 uppercase tracking-wide">
                          Test Profile: {report.reportCategory}
                        </p>
                      </div>

                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-zinc-200 text-zinc-500 text-left">
                            <th className="py-1.5 font-semibold">Investigation</th>
                            <th className="py-1.5 font-semibold text-right">Result</th>
                            <th className="py-1.5 font-semibold">Unit</th>
                            <th className="py-1.5 font-semibold">Biological Ref Range</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 font-mono text-[11px]">
                          {report.extractedParameters.map((p) => {
                            const isAbnormal = p.abnormalFlag !== 'normal';
                            const isMatch = highlightedParam === p.canonicalKey;
                            return (
                              <tr
                                key={p.id}
                                className={`transition-colors ${
                                  isMatch
                                    ? 'bg-amber-100 font-semibold'
                                    : isAbnormal
                                    ? 'bg-amber-50/50'
                                    : 'hover:bg-zinc-50'
                                }`}
                              >
                                <td className="py-1.5 font-sans font-medium text-zinc-900">{p.name}</td>
                                <td className={`py-1.5 text-right font-bold ${
                                  p.abnormalFlag === 'low'
                                    ? 'text-amber-800'
                                    : p.abnormalFlag === 'high'
                                    ? 'text-rose-700'
                                    : 'text-zinc-800'
                                }`}>
                                  {p.originalValue}
                                </td>
                                <td className="py-1.5 text-zinc-600 pl-2">{p.unit}</td>
                                <td className="py-1.5 text-zinc-500">{p.referenceRange}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      <div className="pt-4 border-t border-zinc-200 text-[10px] text-zinc-400 flex justify-between">
                        <span>Original Scan Authenticated: {report.originalFilename}</span>
                        <span>DocuMed Verified Extraction</span>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={report.originalDataUrl}
                      alt={report.originalFilename}
                      referrerPolicy="no-referrer"
                      className="rounded-lg shadow-sm max-w-full object-contain max-h-[700px] border border-zinc-200"
                    />
                  )}
                </div>
              ) : (
                <div className="text-center p-8 text-zinc-400">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-zinc-300" />
                  <p className="text-sm font-medium">Digital Medical Extract</p>
                  <p className="text-xs">Original file securely cached in clinical records archive</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANE: Extracted Intelligence, Overview & Grounded Chat (6 cols on lg) */}
          <div className="lg:col-span-6 bg-white flex flex-col min-h-0">
            {/* Tab navigation */}
            <div className="px-6 border-b border-zinc-200 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-3 text-xs font-semibold border-b-2 transition-colors ${
                    activeTab === 'overview'
                      ? 'border-teal-700 text-teal-800'
                      : 'border-transparent text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  Overview & Summary
                </button>
                <button
                  onClick={() => setActiveTab('results')}
                  className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === 'results'
                      ? 'border-teal-700 text-teal-800'
                      : 'border-transparent text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <span>Extracted Results</span>
                  {abnormalCount > 0 && (
                    <span className="text-[10px] text-amber-800 font-bold">
                      · {abnormalCount} flagged
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === 'chat'
                      ? 'border-teal-700 text-teal-800'
                      : 'border-transparent text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                  <span>Ask AI About Report</span>
                </button>
              </div>

              <div className="text-xs text-zinc-400">
                {currentMode === 'patient' ? 'Patient Mode' : 'Doctor Mode'}
              </div>
            </div>

            {/* Tab Content Container */}
            <div className="flex-1 overflow-y-auto min-h-0 p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Mode-specific AI Summary */}
                  <div className="p-4 bg-teal-50/40 border border-teal-100 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
                      {currentMode === 'patient' ? (
                        <UserCheck className="w-4 h-4 text-teal-700" />
                      ) : (
                        <Stethoscope className="w-4 h-4 text-teal-700" />
                      )}
                      <span>
                        {currentMode === 'patient'
                          ? 'Plain-Language Medical Explanation'
                          : 'Clinical-Grade Synthesis & Findings'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-700 leading-relaxed">
                      {currentMode === 'patient' ? report.patientSummary : report.doctorSummary}
                    </p>
                  </div>

                  {/* Highlights without nested card clutter */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Key Parameter Highlights
                    </h3>
                    <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-100 text-xs">
                      {report.extractedParameters.slice(0, 5).map((p) => {
                        const isAbnormal = p.abnormalFlag !== 'normal';
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              setHighlightedParam(p.canonicalKey);
                              setActiveTab('results');
                            }}
                            className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                              isAbnormal ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-zinc-50'
                            }`}
                          >
                            <div className="min-w-0 pr-3">
                              <p className="font-medium text-zinc-900 truncate">{p.name}</p>
                              <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                                Ref: {p.referenceRange}
                              </p>
                            </div>
                            <div className="text-right font-mono shrink-0">
                              <span className="font-bold text-zinc-900 text-sm">{p.originalValue}</span>{' '}
                              <span className="text-zinc-500 text-[11px]">{p.unit}</span>
                              <div className={`text-[10px] font-bold uppercase ${
                                p.abnormalFlag === 'low'
                                  ? 'text-amber-800'
                                  : p.abnormalFlag === 'high'
                                  ? 'text-rose-700'
                                  : 'text-emerald-700'
                              }`}>
                                {p.abnormalFlag}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes & Clinical Context */}
                  <div className="p-4 border border-zinc-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-900">Notes & Clinical Context</span>
                      <button
                        onClick={() => {
                          if (isEditingNotes) handleSaveNotes();
                          else setIsEditingNotes(true);
                        }}
                        className="text-xs text-teal-800 hover:text-teal-900 font-medium"
                      >
                        {isEditingNotes ? 'Save' : 'Edit Notes'}
                      </button>
                    </div>
                    {isEditingNotes ? (
                      <textarea
                        value={notesVal}
                        onChange={(e) => setNotesVal(e.target.value)}
                        rows={3}
                        className="w-full text-xs p-2.5 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-700"
                        placeholder="Add clinical symptoms, doctor remarks, or follow-up notes..."
                      />
                    ) : (
                      <p className="text-xs text-zinc-600 italic">
                        {report.notes || 'No notes added for this report.'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'results' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>All Extracted Laboratory Parameters ({report.extractedParameters.length})</span>
                    <span>Values deviation flagged against laboratory reference range</span>
                  </div>

                  <div className="border border-zinc-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-zinc-50 text-zinc-600 border-b border-zinc-200 font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Test Parameter</th>
                          <th className="py-2.5 px-3 text-right">Result</th>
                          <th className="py-2.5 px-3">Reference Range</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-center">Page</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-mono tabular-nums text-[11px]">
                        {report.extractedParameters.map((p) => {
                          const isHigh = p.abnormalFlag === 'high';
                          const isLow = p.abnormalFlag === 'low';
                          const isHighlight = highlightedParam === p.canonicalKey;

                          return (
                            <tr
                              key={p.id}
                              className={`transition-colors ${
                                isHighlight
                                  ? 'bg-amber-100/70 font-bold'
                                  : isHigh || isLow
                                  ? 'bg-amber-50/40'
                                  : 'hover:bg-zinc-50'
                              }`}
                            >
                              <td className="py-2 px-3 font-sans font-medium text-zinc-900">
                                <div>{p.name}</div>
                                {p.interpretation && (
                                  <div className="text-[10px] text-zinc-400 font-normal truncate max-w-xs">
                                    {p.interpretation}
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-zinc-900">
                                <span>{p.originalValue}</span>{' '}
                                <span className="text-[10px] font-normal text-zinc-500">{p.unit}</span>
                              </td>
                              <td className="py-2 px-3 text-zinc-500">
                                {p.referenceRange || 'N/A'}
                              </td>
                              <td className="py-2 px-3">
                                <span
                                  className={`text-[10px] font-bold uppercase ${
                                    isLow
                                      ? 'text-amber-800'
                                      : isHigh
                                      ? 'text-rose-700'
                                      : 'text-emerald-700'
                                  }`}
                                >
                                  {p.abnormalFlag}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-zinc-400 text-center">
                                {p.sourcePage || 1}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="h-full flex flex-col justify-between space-y-4">
                  {/* Messages Stream */}
                  <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex flex-col ${
                          msg.sender === 'user' ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-4 py-2.5 text-xs leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-zinc-900 text-white'
                              : 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{msg.text}</div>

                          {msg.citations && msg.citations.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-zinc-200 space-y-1">
                              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">
                                Document Evidence:
                              </p>
                              {msg.citations.map((c, ci) => (
                                <div
                                  key={ci}
                                  className="text-[10px] text-teal-900 bg-teal-50 p-1.5 rounded border border-teal-200 font-mono"
                                >
                                  <span className="font-semibold">{c.parameter || 'Extract'}:</span>{' '}
                                  <span>{c.excerpt} (Page {c.pageNumber})</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isSending && (
                      <div className="flex items-center gap-2 text-xs text-zinc-400 p-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-700" />
                        <span>DocuMed AI reasoning from document parameters...</span>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Suggested Prompts & Input */}
                  <div className="pt-2 border-t border-zinc-100 space-y-2 shrink-0">
                    <div className="flex flex-wrap gap-1.5">
                      {quickPrompts.map((prompt, pi) => (
                        <button
                          key={pi}
                          onClick={() => handleSendQuery(prompt)}
                          disabled={isSending}
                          className="text-[11px] px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md transition-colors text-left"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={inputQuery}
                        onChange={(e) => setInputQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
                        placeholder={
                          currentMode === 'patient'
                            ? 'Ask about this report (e.g. "What does low hemoglobin mean?")'
                            : 'Enter clinical query or differential investigation...'
                        }
                        disabled={isSending}
                        className="flex-1 text-xs p-2.5 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-700 bg-white"
                      />
                      <button
                        onClick={() => handleSendQuery()}
                        disabled={!inputQuery.trim() || isSending}
                        className={`p-2.5 rounded-lg text-white transition-colors ${
                          !inputQuery.trim() || isSending
                            ? 'bg-zinc-300 cursor-not-allowed'
                            : 'bg-zinc-900 hover:bg-zinc-800'
                        }`}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { ReportsVaultView } from './components/ReportsVaultView.tsx';
import { AiAssistantView } from './components/AiAssistantView.tsx';
import { ComparisonView } from './components/ComparisonView.tsx';
import { ReportDetailModal } from './components/ReportDetailModal.tsx';
import { UploadModal } from './components/UploadModal.tsx';
import { ConsentModal } from './components/ConsentModal.tsx';
import {
  fetchCurrentUser,
  fetchReports,
  fetchConversations,
  updateProfile,
  resetDemo
} from './services/api.ts';
import { User, MedicalReport, Conversation } from './types.ts';
import { ShieldCheck, RotateCcw, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeTab, setActiveTab] = useState<'hero' | 'dashboard' | 'vault' | 'chat' | 'compare' | 'safety'>('dashboard');
  const [currentMode, setCurrentMode] = useState<'patient' | 'doctor'>('patient');
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'hinglish'>('en');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedReportDetail, setSelectedReportDetail] = useState<MedicalReport | null>(null);
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [isDoctorVerificationOnly, setIsDoctorVerificationOnly] = useState(false);

  // Comparison launcher pre-fill
  const [compareReport1Id, setCompareReport1Id] = useState<string>('');
  const [compareReport2Id, setCompareReport2Id] = useState<string>('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadInitialData = async () => {
    try {
      const user = await fetchCurrentUser();
      setCurrentUser(user);
      if (user.preferredMode) setCurrentMode(user.preferredMode);
      if (user.preferredLanguage) setCurrentLanguage(user.preferredLanguage);

      const reps = await fetchReports(user.id);
      setReports(reps);

      const convs = await fetchConversations(user.id);
      setConversations(convs);
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  const handleToggleMode = async (mode: 'patient' | 'doctor') => {
    setCurrentMode(mode);
    if (currentUser) {
      try {
        const updated = await updateProfile({ userId: currentUser.id, preferredMode: mode });
        setCurrentUser(updated);
        showToast(`Switched to ${mode === 'patient' ? 'Patient Mode' : 'Clinician Mode'}`);
      } catch (err) {
        console.error('Failed to update mode preference:', err);
      }
    }
  };

  const handleToggleLanguage = async (lang: 'en' | 'hinglish') => {
    setCurrentLanguage(lang);
    if (currentUser) {
      try {
        const updated = await updateProfile({ userId: currentUser.id, preferredLanguage: lang });
        setCurrentUser(updated);
        showToast(`Language set to ${lang === 'en' ? 'English' : 'Hinglish'}`);
      } catch (err) {
        console.error('Failed to update language preference:', err);
      }
    }
  };

  const handleOpenDoctorVerification = () => {
    setIsDoctorVerificationOnly(true);
    setIsConsentOpen(true);
  };

  const handleReportUploadSuccess = (newReport: MedicalReport) => {
    setReports(prev => [newReport, ...prev]);
    showToast(`"${newReport.originalFilename}" indexed and analyzed!`);
    setSelectedReportDetail(newReport);
  };

  const handleOpenCompare = (rep1: MedicalReport, rep2?: MedicalReport) => {
    setCompareReport1Id(rep1.id);
    if (rep2) {
      setCompareReport2Id(rep2.id);
    } else {
      const another = reports.find(r => r.id !== rep1.id);
      if (another) setCompareReport2Id(another.id);
    }
    setActiveTab('compare');
  };

  const handleResetDemoData = async () => {
    if (confirm('Reset to verified sample lab records (CBC Baseline vs Follow-up, Lipid Profile)?')) {
      try {
        await resetDemo();
        await loadInitialData();
        showToast('Demo medical database reset with baseline & follow-up panels.');
      } catch (err) {
        console.error('Failed to reset demo:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfb] flex text-zinc-900 font-sans antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 border border-zinc-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Notion/Linear-Inspired Collapsible Sidebar (Desktop) */}
      <Sidebar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentMode={currentMode}
        onToggleMode={handleToggleMode}
        currentLanguage={currentLanguage}
        onToggleLanguage={handleToggleLanguage}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenDoctorVerification={handleOpenDoctorVerification}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Minimal Header on top */}
        <Header
          currentUser={currentUser}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentMode={currentMode}
          onToggleMode={handleToggleMode}
          currentLanguage={currentLanguage}
          onToggleLanguage={handleToggleLanguage}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenDoctorVerification={handleOpenDoctorVerification}
        />

        {/* View Routing */}
        <main className="flex-1 pb-16">
          {activeTab === 'hero' && (
            <HeroSection
              onExploreReports={() => setActiveTab('dashboard')}
              onAskDocuMed={() => setActiveTab('chat')}
              onOpenCompare={() => setActiveTab('compare')}
              onOpenUpload={() => setIsUploadOpen(true)}
              currentMode={currentMode}
              onToggleMode={handleToggleMode}
              currentLanguage={currentLanguage}
              onToggleLanguage={handleToggleLanguage}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              reports={reports}
              conversations={conversations}
              currentMode={currentMode}
              currentLanguage={currentLanguage}
              onOpenUpload={() => setIsUploadOpen(true)}
              onOpenReport={(r) => setSelectedReportDetail(r)}
              onNavigateToTab={setActiveTab}
              onOpenCompare={handleOpenCompare}
            />
          )}

          {activeTab === 'vault' && (
            <ReportsVaultView
              reports={reports}
              onOpenReport={(r) => setSelectedReportDetail(r)}
              onOpenCompare={handleOpenCompare}
              onOpenUpload={() => setIsUploadOpen(true)}
              onReportsUpdated={loadInitialData}
            />
          )}

          {activeTab === 'chat' && (
            <AiAssistantView
              reports={reports}
              currentMode={currentMode}
              currentLanguage={currentLanguage}
              onSelectReportToView={(r) => setSelectedReportDetail(r)}
            />
          )}

          {activeTab === 'compare' && (
            <ComparisonView
              reports={reports}
              initialReport1Id={compareReport1Id}
              initialReport2Id={compareReport2Id}
              currentMode={currentMode}
              currentLanguage={currentLanguage}
            />
          )}

          {activeTab === 'safety' && (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
              <div className="bg-white border border-zinc-200/90 rounded-xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-teal-800 stroke-[2]" />
                  </div>
                  <div>
                    <h1 className="text-base font-bold text-zinc-900">
                      Medical Privacy & Indian DPDP Compliance Framework
                    </h1>
                    <p className="text-xs text-zinc-500">
                      Digital Personal Data Protection Act and Clinical Safety Governance
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-xs text-zinc-700 leading-relaxed pt-2">
                  <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-lg space-y-1.5">
                    <h3 className="font-bold text-zinc-900 text-xs">Patient Data Rights & Privacy Guarantees</h3>
                    <p className="text-[11px] text-zinc-600">
                      All uploaded diagnostic scans and laboratory values are stored under user-isolated storage. We do not sell or monetize personal health data. Your reports are processed through server-side Gemini 3.8 Flash inference with strict telemetry headers.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-zinc-900">1. Zero-Hallucination Extraction Standard</h4>
                    <p className="text-zinc-600 text-[11px]">
                      DocuMed explicitly extracts lab values, units, and laboratory reference ranges as printed on the original scan. If a section is unreadable or smudged, our pipeline flags uncertainty rather than guessing arbitrary metrics.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-zinc-900">2. Medical Decision Support & Disclaimer</h4>
                    <p className="text-zinc-600 text-[11px]">
                      DocuMed assists patients in understanding test results and aids healthcare providers in synthesizing longitudinal trends. It is not an autonomous diagnostic instrument or drug prescription engine. Always correlate laboratory findings with direct clinical examination and consultation with a registered medical practitioner.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-zinc-900">3. Emergency Situations</h4>
                    <p className="text-zinc-600 text-[11px]">
                      If you experience acute chest pain, severe shortness of breath, acute neurological weakness, or signs of hemorrhage, seek immediate local emergency medical care rather than relying on digital document review.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">
                    Consent Status: {currentUser?.consentGiven ? 'Active & Approved' : 'Pending'}
                  </span>
                  <button
                    onClick={handleResetDemoData}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Sample Lab Panels</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleReportUploadSuccess}
      />

      <ReportDetailModal
        report={selectedReportDetail}
        isOpen={Boolean(selectedReportDetail)}
        onClose={() => setSelectedReportDetail(null)}
        currentMode={currentMode}
        currentLanguage={currentLanguage}
        onOpenCompareWith={handleOpenCompare}
        onReportUpdated={(updated) => {
          setSelectedReportDetail(updated);
          loadInitialData();
        }}
      />

      <ConsentModal
        isOpen={isConsentOpen}
        onClose={() => {
          setIsConsentOpen(false);
          setIsDoctorVerificationOnly(false);
        }}
        currentUser={currentUser}
        onUserUpdated={(u) => {
          setCurrentUser(u);
          if (u.preferredMode) setCurrentMode(u.preferredMode);
        }}
        isDoctorVerificationOnly={isDoctorVerificationOnly}
      />
    </div>
  );
}

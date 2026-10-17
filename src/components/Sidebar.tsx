import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  GitCompare,
  ShieldCheck,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Stethoscope,
  Compass,
  MessageSquare,
  Settings
} from 'lucide-react';
import { User } from '../types.ts';

interface SidebarProps {
  currentUser: User | null;
  activeTab: 'hero' | 'dashboard' | 'vault' | 'chat' | 'compare' | 'safety';
  setActiveTab: (tab: 'hero' | 'dashboard' | 'vault' | 'chat' | 'compare' | 'safety') => void;
  currentMode: 'patient' | 'doctor';
  onToggleMode: (mode: 'patient' | 'doctor') => void;
  currentLanguage: 'en' | 'hinglish';
  onToggleLanguage: (lang: 'en' | 'hinglish') => void;
  onOpenUpload: () => void;
  onOpenDoctorVerification: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  currentMode,
  onToggleMode,
  currentLanguage,
  onToggleLanguage,
  onOpenUpload,
  onOpenDoctorVerification,
  isCollapsed,
  onToggleCollapse,
}) => {
  const handleModeChange = (mode: 'patient' | 'doctor') => {
    if (mode === 'doctor') {
      if (currentUser?.role !== 'doctor' && !currentUser?.doctorCredentials?.verified) {
        onOpenDoctorVerification();
        return;
      }
    }
    onToggleMode(mode);
  };

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'vault', label: 'My Reports', icon: FileText },
    { id: 'chat', label: 'AI Assistant', icon: Sparkles },
    { id: 'compare', label: 'Compare Reports', icon: GitCompare },
    { id: 'hero', label: 'How It Works', icon: Compass },
    { id: 'safety', label: 'Privacy & DPDP', icon: ShieldCheck },
  ] as const;

  return (
    <aside
      className={`hidden md:flex flex-col bg-white border-r border-zinc-200/90 transition-all duration-200 z-30 shrink-0 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 px-4 border-b border-zinc-100 flex items-center justify-between">
        {!isCollapsed ? (
          <button
            onClick={() => setActiveTab('hero')}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
          >
            <div className="w-6 h-6 rounded-md bg-zinc-900 text-white flex items-center justify-center text-xs font-bold">
              D
            </div>
            <span className="text-sm font-bold tracking-tight text-zinc-900 group-hover:text-teal-800 transition-colors">
              DocuMed
            </span>
          </button>
        ) : (
          <button
            onClick={() => setActiveTab('hero')}
            className="mx-auto w-7 h-7 rounded-md bg-zinc-900 text-white flex items-center justify-center text-xs font-bold"
          >
            D
          </button>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1 text-zinc-400 hover:text-zinc-700 rounded-md hover:bg-zinc-100 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Mode & Language Selector (Quiet, functional) */}
      {!isCollapsed && (
        <div className="p-3 border-b border-zinc-100 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium">
            <span>Response Mode:</span>
            <button
              onClick={() => onToggleLanguage(currentLanguage === 'en' ? 'hinglish' : 'en')}
              className="text-[10px] text-teal-800 hover:text-teal-900 font-mono"
            >
              Lang: {currentLanguage === 'en' ? 'EN' : 'Hinglish'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1 p-0.5 bg-zinc-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => handleModeChange('patient')}
              className={`py-1 px-2 rounded-md transition-colors flex items-center justify-center gap-1 ${
                currentMode === 'patient'
                  ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <UserCheck className="w-3 h-3 text-teal-700" />
              <span>Patient</span>
            </button>

            <button
              onClick={() => handleModeChange('doctor')}
              className={`py-1 px-2 rounded-md transition-colors flex items-center justify-center gap-1 ${
                currentMode === 'doctor'
                  ? 'bg-zinc-900 text-white shadow-xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <Stethoscope className="w-3 h-3 text-teal-400" />
              <span>Doctor</span>
            </button>
          </div>
        </div>
      )}

      {/* Primary Action: Upload */}
      <div className="p-3">
        <button
          onClick={onOpenUpload}
          className={`w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition-colors shadow-xs ${
            isCollapsed ? 'px-1' : 'px-3'
          }`}
          title="Upload Medical Report"
        >
          <UploadCloud className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Upload Report</span>}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto text-xs">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-left ${
                isActive
                  ? 'bg-zinc-100 text-zinc-900 font-semibold'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
              } ${isCollapsed ? 'justify-center px-1' : ''}`}
              title={item.label}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-teal-700' : 'text-zinc-400'
                }`}
              />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-zinc-100 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-zinc-800 text-white flex items-center justify-center text-xs font-medium shrink-0">
          {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
        </div>
        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-zinc-900 truncate">
              {currentUser?.name || 'Aaryan Ranjan'}
            </p>
            <p className="text-[10px] text-zinc-400 truncate">
              {currentUser?.role === 'doctor' ? 'Verified Clinician' : 'Patient Account'}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

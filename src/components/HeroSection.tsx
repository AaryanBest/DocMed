import React, { useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  FileText,
  GitCompare,
  ShieldCheck,
  Check,
  UserCheck,
  Stethoscope,
  TrendingUp,
  Activity,
  Layers,
  ChevronRight,
  BookOpen
} from 'lucide-react';

interface HeroSectionProps {
  onExploreReports: () => void;
  onAskDocuMed: () => void;
  onOpenCompare: () => void;
  onOpenUpload: () => void;
  currentMode: 'patient' | 'doctor';
  onToggleMode: (mode: 'patient' | 'doctor') => void;
  currentLanguage: 'en' | 'hinglish';
  onToggleLanguage: (lang: 'en' | 'hinglish') => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreReports,
  onAskDocuMed,
  onOpenCompare,
  onOpenUpload,
  currentMode,
  onToggleMode,
  currentLanguage,
  onToggleLanguage,
}) => {
  const [previewTab, setPreviewTab] = useState<'patient' | 'clinician'>('patient');

  return (
    <div className="space-y-20 py-6 sm:py-10">
      {/* Editorial Asymmetric Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline, Narrative, and Actions (6 cols on lg) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase text-teal-800">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
              <span>YOUR HEALTH RECORDS, MADE CLEARER</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-900 leading-[1.15] text-balance">
              Your medical reports.{' '}
              <span className="text-zinc-500 font-medium block sm:inline">
                Finally, easier to understand.
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-zinc-600 leading-relaxed max-w-xl">
              Upload your medical reports, ask questions in your own language, and understand how your results change over time — all in one private workspace.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onExploreReports}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors shadow-xs"
              >
                <span>Explore Your Reports</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onAskDocuMed}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
              >
                <Sparkles className="w-4 h-4 text-teal-700" />
                <span>Ask DocuMed</span>
              </button>
            </div>

            {/* Supporting Microcopy */}
            <p className="text-xs text-zinc-500 pt-1">
              Understand your reports better. Make informed conversations with your doctor easier.
            </p>

            {/* Quiet Trust Markers */}
            <div className="pt-6 border-t border-zinc-200/80 flex flex-wrap items-center gap-6 text-xs text-zinc-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <span>Indian DPDP privacy compliant</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-teal-700" />
                <span>Zero-hallucination OCR standard</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-teal-700" />
                <span>English & Hinglish support</span>
              </div>
            </div>
          </div>

          {/* Right Column: Layered, Faithful Product Preview (6 cols on lg) */}
          <div className="lg:col-span-6">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              {/* Product Window Shell */}
              <div className="bg-white rounded-xl border border-zinc-200/90 shadow-xl overflow-hidden transition-all">
                {/* Window Top Bar */}
                <div className="px-4 py-3 bg-zinc-50/90 border-b border-zinc-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                    <span className="text-zinc-400 font-mono text-[11px] ml-2">
                      CBC_Iron_Panel_Baseline.pdf
                    </span>
                  </div>

                  {/* Interactive Preview Mode Switcher */}
                  <div className="flex items-center p-0.5 bg-zinc-200/70 rounded-md text-[11px] font-medium">
                    <button
                      onClick={() => setPreviewTab('patient')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        previewTab === 'patient'
                          ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      Patient Mode
                    </button>
                    <button
                      onClick={() => setPreviewTab('clinician')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        previewTab === 'clinician'
                          ? 'bg-zinc-900 text-white shadow-xs font-semibold'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      Doctor Mode
                    </button>
                  </div>
                </div>

                {/* Window Interior Content */}
                <div className="p-5 space-y-4 text-xs">
                  {/* Extracted Lab Parameter Row Sample */}
                  <div className="border border-zinc-200/80 rounded-lg overflow-hidden">
                    <div className="bg-zinc-50 px-3 py-2 border-b border-zinc-200/80 flex items-center justify-between text-[11px] text-zinc-500 font-medium">
                      <span>Metropolis Diagnostic · May 12, 2025</span>
                      <span className="text-amber-800 font-medium">2 Values Outside Reference Range</span>
                    </div>
                    <div className="divide-y divide-zinc-100 text-xs font-mono">
                      <div className="px-3 py-2 flex items-center justify-between bg-amber-50/30">
                        <span className="font-sans font-medium text-zinc-900">Hemoglobin (Hb)</span>
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-500 text-[11px]">Ref: 13.0 - 17.0 g/dL</span>
                          <span className="font-bold text-amber-800">10.2 g/dL</span>
                          <span className="text-[10px] text-amber-700 uppercase font-semibold">Low</span>
                        </div>
                      </div>
                      <div className="px-3 py-2 flex items-center justify-between">
                        <span className="font-sans font-medium text-zinc-900">White Blood Cells (WBC)</span>
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-500 text-[11px]">Ref: 4,000 - 11,000</span>
                          <span className="font-bold text-zinc-800">7,400 /mcL</span>
                          <span className="text-[10px] text-emerald-700 uppercase font-semibold">Normal</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic AI Explanation Card based on Selected Mode */}
                  <div className="p-4 rounded-lg bg-teal-50/60 border border-teal-100/90 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-teal-900">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                        <span>
                          {previewTab === 'patient'
                            ? 'Patient-Friendly Explanation (Hinglish/English)'
                            : 'Clinical-Grade Physician Synthesis'}
                        </span>
                      </div>
                      <span className="text-[10px] text-teal-700 font-mono">Page 1 Citation</span>
                    </div>

                    <p className="text-xs text-zinc-700 leading-relaxed">
                      {previewTab === 'patient' ? (
                        <>
                          Your hemoglobin is <strong>10.2 g/dL</strong>, which is lower than the typical reference range (13.0–17.0). Think of hemoglobin as delivery trucks carrying oxygen to your muscles and brain — having fewer trucks explains why you might feel fatigued. Other counts like white blood cells are completely healthy.
                        </>
                      ) : (
                        <>
                          Microcytic hypochromic indices noted (Hb 10.2 g/dL, MCV 72.4 fL, Ferritin 14.5 ng/mL). Normocytic leukocyte and thrombocyte profiles. Morphologically consistent with iron deficiency anemia; recommend correlation with dietary intake or occult blood loss before iron repletion.
                        </>
                      )}
                    </p>
                  </div>

                  {/* Micro Comparison Snippet */}
                  <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <GitCompare className="w-4 h-4 text-teal-700 shrink-0" />
                      <div>
                        <span className="font-medium text-zinc-900">Longitudinal Trend:</span>{' '}
                        <span className="text-zinc-600">May 2025 vs Nov 2025</span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 font-mono">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+3.2 g/dL (Hb 13.4 Normal)</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Subtle back decorative document sheet to give realistic depth */}
              <div
                aria-hidden="true"
                className="absolute -bottom-3 -right-3 -z-10 w-full h-full bg-zinc-200/60 rounded-xl border border-zinc-300/60"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Three-Step Workflow: How DocuMed Works (Clean, Typographic, No repetitive cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 border-t border-zinc-200/80">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-800">
            HOW IT WORKS
          </p>
          <h2 className="text-2xl font-bold text-zinc-900 mt-1">
            From confusing lab scan to clear clinical understanding in seconds.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-teal-700">01.</span>
            <h3 className="font-semibold text-zinc-900 text-base">Drop your report</h3>
            <p className="text-zinc-600 text-xs leading-relaxed">
              Upload any PDF report or phone photo. DocuMed accurately reads every test name, measured value, unit, and laboratory reference interval without manual entry.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-teal-700">02.</span>
            <h3 className="font-semibold text-zinc-900 text-base">Ask in everyday language</h3>
            <p className="text-zinc-600 text-xs leading-relaxed">
              Switch between Patient Mode (clear analogies, Hinglish support, simple guidance) and Doctor Mode (dense medical synthesis, clinical differential context).
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-teal-700">03.</span>
            <h3 className="font-semibold text-zinc-900 text-base">Track longitudinal trends</h3>
            <p className="text-zinc-600 text-xs leading-relaxed">
              Compare any two checkups side-by-side. See which biomarkers normalized, calculate deltas, and review charts ready for discussion with your doctor.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

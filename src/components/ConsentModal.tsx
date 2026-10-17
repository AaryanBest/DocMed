import React, { useState } from 'react';
import { ShieldCheck, Stethoscope, Check, AlertCircle, Lock, X } from 'lucide-react';
import { updateProfile } from '../services/api.ts';
import { User } from '../types.ts';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserUpdated: (user: User) => void;
  isDoctorVerificationOnly?: boolean;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
  isDoctorVerificationOnly = false
}) => {
  const [activeTab, setActiveTab] = useState<'consent' | 'doctor'>(
    isDoctorVerificationOnly ? 'doctor' : 'consent'
  );

  const [licenseNumber, setLicenseNumber] = useState(
    currentUser?.doctorCredentials?.licenseNumber || 'MCI-847291'
  );
  const [specialty, setSpecialty] = useState(
    currentUser?.doctorCredentials?.specialty || 'Internal Medicine'
  );
  const [hospital, setHospital] = useState(
    currentUser?.doctorCredentials?.hospital || 'Metro Clinical Health Institute'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleVerifyDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!licenseNumber.trim() || !hospital.trim()) {
      setErrorMessage('Please provide a valid medical license number and institution.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const updated = await updateProfile({
        userId: currentUser.id,
        preferredMode: 'doctor',
        doctorCredentials: {
          licenseNumber: licenseNumber.trim(),
          specialty: specialty.trim(),
          hospital: hospital.trim(),
        },
      });

      setSuccessMessage('Medical credentials verified successfully! Clinician Mode enabled.');
      onUserUpdated(updated);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Doctor verification error:', err);
      setErrorMessage(err.message || 'Verification failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptConsent = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      const updated = await updateProfile({
        userId: currentUser.id,
        consentGiven: true,
      });
      onUserUpdated(updated);
      onClose();
    } catch (err) {
      console.error('Consent error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-zinc-100 text-zinc-800 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 stroke-[2] text-teal-800" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900">
                {activeTab === 'doctor' ? 'Clinical Credentials Verification' : 'Medical Privacy & DPDP Framework'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="flex border-b border-zinc-200 pb-2 gap-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('consent')}
              className={`pb-1 transition-colors ${
                activeTab === 'consent'
                  ? 'border-b-2 border-teal-700 text-teal-800'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Privacy & Consent
            </button>
            <button
              onClick={() => setActiveTab('doctor')}
              className={`pb-1 transition-colors ${
                activeTab === 'doctor'
                  ? 'border-b-2 border-teal-700 text-teal-800'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Doctor Verification
            </button>
          </div>

          {activeTab === 'consent' && (
            <div className="space-y-3.5 text-xs text-zinc-700 leading-relaxed">
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                  <Lock className="w-3.5 h-3.5 text-teal-800" />
                  <span>Indian Digital Personal Data Protection (DPDP) Standard</span>
                </div>
                <p className="text-[11px] text-zinc-600">
                  Your diagnostic reports and health parameters are isolated under per-user encryption. No health information is shared or sold to advertising brokers.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-zinc-900">Guarantees & Clinical Scope:</h4>
                <ul className="list-disc pl-5 space-y-1 text-zinc-600 text-[11px]">
                  <li>
                    <strong>Document Grounding:</strong> Extracted metrics strictly mirror your uploaded lab scan without hallucinating missing values.
                  </li>
                  <li>
                    <strong>Non-Diagnostic Scope:</strong> DocuMed assists comprehension and preparation for doctor visits. It is not an automated prescriber.
                  </li>
                  <li>
                    <strong>Data Deletion:</strong> You can delete any uploaded document or conversation from your vault at any time.
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleAcceptConsent}
                  disabled={isSubmitting}
                  className="w-full py-2 bg-teal-800 hover:bg-teal-900 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
                >
                  Confirm Consent & Continue
                </button>
              </div>
            </div>
          )}

          {activeTab === 'doctor' && (
            <form onSubmit={handleVerifyDoctor} className="space-y-3.5">
              <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-600">
                <p className="text-[11px]">
                  Doctor Mode enables clinical-grade laboratory synthesis, differential diagnostic flags, and technical nomenclature. Please provide registered credentials.
                </p>
              </div>

              {errorMessage && (
                <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-1.5">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block font-medium text-zinc-700 mb-0.5">
                    Medical Council Registration Number
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. MCI-847291"
                    required
                    className="w-full p-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-0.5">
                    Clinical Specialty
                  </label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="e.g. Internal Medicine"
                    required
                    className="w-full p-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-0.5">
                    Affiliated Institution / Hospital
                  </label>
                  <input
                    type="text"
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    placeholder="e.g. Metro Clinical Health Institute"
                    required
                    className="w-full p-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition-colors shadow-xs"
                >
                  {isSubmitting ? 'Verifying...' : 'Verify Credentials'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

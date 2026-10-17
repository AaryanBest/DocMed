export interface MedicalParameter {
  id: string;
  reportId: string;
  name: string;
  canonicalKey: string;
  originalValue: string;
  numericValue: number | null;
  unit: string;
  referenceRange: string;
  abnormalFlag: 'normal' | 'low' | 'high' | 'critical' | 'indeterminate';
  interpretation: string;
  sourcePage: number;
  extractionConfidence: number;
}

export interface MedicalReport {
  id: string;
  userId: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  reportCategory: string;
  examinationDate: string;
  uploadDate: string;
  laboratoryName: string;
  processingStatus: 'uploading' | 'processing' | 'ready' | 'failed';
  originalDataUrl?: string;
  extractedParameters: MedicalParameter[];
  patientSummary: string;
  doctorSummary: string;
  extractionConfidence: number;
  warnings: string[];
  notes: string;
  tags: string[];
  isFavorite: boolean;
  pageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor';
  doctorCredentials?: {
    licenseNumber: string;
    specialty: string;
    hospital: string;
    verified: boolean;
  };
  preferredMode: 'patient' | 'doctor';
  preferredLanguage: 'en' | 'hinglish';
  consentGiven: boolean;
  consentTimestamp?: string;
  createdAt: string;
}

export interface MessageCitation {
  reportId: string;
  reportName: string;
  pageNumber: number;
  parameter?: string;
  excerpt: string;
  isExtractedFact: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'user' | 'ai';
  content: string;
  referencedReportIds: string[];
  citations?: MessageCitation[];
  mode: 'patient' | 'doctor';
  language: 'en' | 'hinglish';
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  selectedReportIds: string[];
  interactionMode: 'patient' | 'doctor';
  preferredLanguage: 'en' | 'hinglish';
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface ComparisonResult {
  report1: MedicalReport;
  report2: MedicalReport;
  matchedParameters: Array<{
    name: string;
    canonicalKey: string;
    unit: string;
    referenceRange: string;
    val1: { value: string; num: number | null; flag: string };
    val2: { value: string; num: number | null; flag: string };
    deltaNum: number | null;
    percentChange: number | null;
    trend: 'improved' | 'worsened' | 'stable' | 'changed' | 'indeterminate';
  }>;
  patientExplanation: string;
  doctorInterpretation: string;
}

import fs from 'fs';
import path from 'path';

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
  originalDataUrl?: string; // base64 representation
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
  password?: string;
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

export interface ComparisonRecord {
  id: string;
  userId: string;
  reportId1: string;
  reportId2: string;
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
  createdAt: string;
}

interface DataStore {
  users: User[];
  reports: MedicalReport[];
  conversations: Conversation[];
  comparisons: ComparisonRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

// In-memory cache
let store: DataStore = {
  users: [],
  reports: [],
  conversations: [],
  comparisons: []
};

// Seed realistic medical records
function createInitialSeedData(): DataStore {
  const defaultUserId = 'usr_patient_demo';
  const doctorUserId = 'usr_dr_demo';

  const defaultUser: User = {
    id: defaultUserId,
    name: 'Aaryan Ranjan',
    email: 'aaryanranjanthebest@gmail.com',
    role: 'patient',
    preferredMode: 'patient',
    preferredLanguage: 'en',
    consentGiven: true,
    consentTimestamp: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  const doctorUser: User = {
    id: doctorUserId,
    name: 'Dr. Shalini Mehta, MD',
    email: 'dr.shalini@documed.health',
    role: 'doctor',
    doctorCredentials: {
      licenseNumber: 'MCI-847291',
      specialty: 'Internal Medicine',
      hospital: 'Metro Clinical Health Institute',
      verified: true
    },
    preferredMode: 'doctor',
    preferredLanguage: 'en',
    consentGiven: true,
    consentTimestamp: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  // Report 1: Complete Blood Count - Baseline (Mild Iron Deficiency Anemia)
  const rep1Id = 'rep_cbc_baseline_2025';
  const cbcParams1: MedicalParameter[] = [
    {
      id: 'param_1_1',
      reportId: rep1Id,
      name: 'Hemoglobin (Hb)',
      canonicalKey: 'hemoglobin',
      originalValue: '10.2',
      numericValue: 10.2,
      unit: 'g/dL',
      referenceRange: '13.0 - 17.0',
      abnormalFlag: 'low',
      interpretation: 'Below normal range, indicates mild anemia',
      sourcePage: 1,
      extractionConfidence: 0.99
    },
    {
      id: 'param_1_2',
      reportId: rep1Id,
      name: 'Total RBC Count',
      canonicalKey: 'rbc',
      originalValue: '3.8',
      numericValue: 3.8,
      unit: 'million/mcL',
      referenceRange: '4.5 - 5.9',
      abnormalFlag: 'low',
      interpretation: 'Reduced red blood cell count',
      sourcePage: 1,
      extractionConfidence: 0.98
    },
    {
      id: 'param_1_3',
      reportId: rep1Id,
      name: 'Packed Cell Volume (PCV/Hematocrit)',
      canonicalKey: 'pcv',
      originalValue: '32.1',
      numericValue: 32.1,
      unit: '%',
      referenceRange: '40.0 - 50.0',
      abnormalFlag: 'low',
      interpretation: 'Proportion of red cells in blood is low',
      sourcePage: 1,
      extractionConfidence: 0.97
    },
    {
      id: 'param_1_4',
      reportId: rep1Id,
      name: 'Mean Corpuscular Volume (MCV)',
      canonicalKey: 'mcv',
      originalValue: '72.4',
      numericValue: 72.4,
      unit: 'fL',
      referenceRange: '80.0 - 100.0',
      abnormalFlag: 'low',
      interpretation: 'Microcytic red blood cells, common in iron deficiency',
      sourcePage: 1,
      extractionConfidence: 0.98
    },
    {
      id: 'param_1_5',
      reportId: rep1Id,
      name: 'White Blood Cell Count (WBC)',
      canonicalKey: 'wbc',
      originalValue: '7,400',
      numericValue: 7400,
      unit: 'cells/mcL',
      referenceRange: '4,000 - 11,000',
      abnormalFlag: 'normal',
      interpretation: 'Immune cell count within normal baseline',
      sourcePage: 1,
      extractionConfidence: 0.99
    },
    {
      id: 'param_1_6',
      reportId: rep1Id,
      name: 'Platelet Count',
      canonicalKey: 'platelets',
      originalValue: '280,000',
      numericValue: 280000,
      unit: 'cells/mcL',
      referenceRange: '150,000 - 450,000',
      abnormalFlag: 'normal',
      interpretation: 'Normal clotting cell density',
      sourcePage: 1,
      extractionConfidence: 0.99
    },
    {
      id: 'param_1_7',
      reportId: rep1Id,
      name: 'Serum Ferritin',
      canonicalKey: 'ferritin',
      originalValue: '14.5',
      numericValue: 14.5,
      unit: 'ng/mL',
      referenceRange: '30.0 - 400.0',
      abnormalFlag: 'low',
      interpretation: 'Significantly depleted iron storage reserve',
      sourcePage: 1,
      extractionConfidence: 0.96
    }
  ];

  const report1: MedicalReport = {
    id: rep1Id,
    userId: defaultUserId,
    originalFilename: 'CBC_Iron_Panel_Baseline_May2025.pdf',
    mimeType: 'application/pdf',
    fileSize: 184520,
    reportCategory: 'Complete Blood Count (CBC)',
    examinationDate: '2025-05-12',
    uploadDate: '2025-05-12T10:30:00Z',
    laboratoryName: 'Metropolis Diagnostic & Clinical Lab',
    processingStatus: 'ready',
    extractedParameters: cbcParams1,
    patientSummary: 'Your report shows signs of mild iron-deficiency anemia. Think of hemoglobin like delivery trucks carrying oxygen to your muscles and brain—currently you have fewer trucks (10.2 instead of 13.0+), which might make you feel tired or fatigued. Your iron stores (ferritin) are also low. Other counts like infection-fighting white blood cells and platelets are healthy.',
    doctorSummary: 'Microcytic hypochromic anemia (Hb 10.2 g/dL, MCV 72.4 fL, Ferritin 14.5 ng/mL). Normocytic WBC and platelet indices. Consistent with iron deficiency; investigate nutritional intake, GI absorption, or occult blood loss before initiating elemental iron supplementation.',
    extractionConfidence: 0.98,
    warnings: [],
    notes: 'Baseline checkup due to general lethargy and mild shortness of breath upon exertion.',
    tags: ['Anemia', 'Iron Profile', 'CBC', 'Baseline'],
    isFavorite: true,
    pageCount: 1,
    createdAt: '2025-05-12T10:30:00Z',
    updatedAt: '2025-05-12T10:30:00Z'
  };

  // Report 2: Complete Blood Count - 6 Months Follow-up (Significant Recovery)
  const rep2Id = 'rep_cbc_followup_2025';
  const cbcParams2: MedicalParameter[] = [
    {
      id: 'param_2_1',
      reportId: rep2Id,
      name: 'Hemoglobin (Hb)',
      canonicalKey: 'hemoglobin',
      originalValue: '13.4',
      numericValue: 13.4,
      unit: 'g/dL',
      referenceRange: '13.0 - 17.0',
      abnormalFlag: 'normal',
      interpretation: 'Normal hemoglobin; recovered into healthy clinical range',
      sourcePage: 1,
      extractionConfidence: 0.99
    },
    {
      id: 'param_2_2',
      reportId: rep2Id,
      name: 'Total RBC Count',
      canonicalKey: 'rbc',
      originalValue: '4.7',
      numericValue: 4.7,
      unit: 'million/mcL',
      referenceRange: '4.5 - 5.9',
      abnormalFlag: 'normal',
      interpretation: 'Red blood cell count has normalized',
      sourcePage: 1,
      extractionConfidence: 0.98
    },
    {
      id: 'param_2_3',
      reportId: rep2Id,
      name: 'Packed Cell Volume (PCV/Hematocrit)',
      canonicalKey: 'pcv',
      originalValue: '41.5',
      numericValue: 41.5,
      unit: '%',
      referenceRange: '40.0 - 50.0',
      abnormalFlag: 'normal',
      interpretation: 'Hematocrit volume normalized above 40%',
      sourcePage: 1,
      extractionConfidence: 0.98
    },
    {
      id: 'param_2_4',
      reportId: rep2Id,
      name: 'Mean Corpuscular Volume (MCV)',
      canonicalKey: 'mcv',
      originalValue: '85.2',
      numericValue: 85.2,
      unit: 'fL',
      referenceRange: '80.0 - 100.0',
      abnormalFlag: 'normal',
      interpretation: 'Red cell size restored to normocytic dimensions',
      sourcePage: 1,
      extractionConfidence: 0.99
    },
    {
      id: 'param_2_5',
      reportId: rep2Id,
      name: 'White Blood Cell Count (WBC)',
      canonicalKey: 'wbc',
      originalValue: '6,900',
      numericValue: 6900,
      unit: 'cells/mcL',
      referenceRange: '4,000 - 11,000',
      abnormalFlag: 'normal',
      interpretation: 'Normal leukocyte count',
      sourcePage: 1,
      extractionConfidence: 0.99
    },
    {
      id: 'param_2_6',
      reportId: rep2Id,
      name: 'Platelet Count',
      canonicalKey: 'platelets',
      originalValue: '265,000',
      numericValue: 265000,
      unit: 'cells/mcL',
      referenceRange: '150,000 - 450,000',
      abnormalFlag: 'normal',
      interpretation: 'Normal thrombocyte levels',
      sourcePage: 1,
      extractionConfidence: 0.99
    },
    {
      id: 'param_2_7',
      reportId: rep2Id,
      name: 'Serum Ferritin',
      canonicalKey: 'ferritin',
      originalValue: '58.0',
      numericValue: 58.0,
      unit: 'ng/mL',
      referenceRange: '30.0 - 400.0',
      abnormalFlag: 'normal',
      interpretation: 'Iron stores replenished back to safe reserve zone',
      sourcePage: 1,
      extractionConfidence: 0.97
    }
  ];

  const report2: MedicalReport = {
    id: rep2Id,
    userId: defaultUserId,
    originalFilename: 'CBC_Iron_Panel_Followup_Nov2025.pdf',
    mimeType: 'application/pdf',
    fileSize: 192300,
    reportCategory: 'Complete Blood Count (CBC)',
    examinationDate: '2025-11-18',
    uploadDate: '2025-11-18T14:15:00Z',
    laboratoryName: 'Metropolis Diagnostic & Clinical Lab',
    processingStatus: 'ready',
    extractedParameters: cbcParams2,
    patientSummary: 'Excellent progress! Your hemoglobin has risen from 10.2 to 13.4 g/dL, bringing it fully into the normal healthy range. Your red cell size (MCV) and stored iron (Ferritin at 58.0 ng/mL) have also bounced back nicely, showing that the treatment plan worked effectively.',
    doctorSummary: 'Resolved microcytic anemia with complete hematological reconstitution: Hb normalized to 13.4 g/dL (+3.2 g/dL), MCV corrected to 85.2 fL, and Ferritin restored to 58.0 ng/mL. Reticulocyte and leukocyte profiles stable. Maintenance dietary counseling recommended.',
    extractionConfidence: 0.99,
    warnings: [],
    notes: 'Follow-up 6 months post oral iron therapy & dietary improvements.',
    tags: ['CBC', 'Follow-up', 'Resolved Anemia'],
    isFavorite: true,
    pageCount: 1,
    createdAt: '2025-11-18T14:15:00Z',
    updatedAt: '2025-11-18T14:15:00Z'
  };

  // Report 3: Comprehensive Metabolic & Lipid Profile (Diabetes & Cardiovascular monitoring)
  const rep3Id = 'rep_lipid_hba1c_2026';
  const lipidParams: MedicalParameter[] = [
    {
      id: 'param_3_1',
      reportId: rep3Id,
      name: 'Glycated Hemoglobin (HbA1c)',
      canonicalKey: 'hba1c',
      originalValue: '7.1',
      numericValue: 7.1,
      unit: '%',
      referenceRange: '< 5.7 Normal, 5.7-6.4 Prediabetes, >= 6.5 Diabetes',
      abnormalFlag: 'high',
      interpretation: 'Elevated, indicating moderate diabetic range glycemic exposure over past 3 months',
      sourcePage: 1,
      extractionConfidence: 0.99
    },
    {
      id: 'param_3_2',
      reportId: rep3Id,
      name: 'Estimated Average Glucose (eAG)',
      canonicalKey: 'eag',
      originalValue: '157',
      numericValue: 157,
      unit: 'mg/dL',
      referenceRange: '70 - 120',
      abnormalFlag: 'high',
      interpretation: 'Calculated average daily blood sugar level',
      sourcePage: 1,
      extractionConfidence: 0.98
    },
    {
      id: 'param_3_3',
      reportId: rep3Id,
      name: 'Fasting Plasma Glucose',
      canonicalKey: 'fasting_glucose',
      originalValue: '128',
      numericValue: 128,
      unit: 'mg/dL',
      referenceRange: '70 - 99 Normal',
      abnormalFlag: 'high',
      interpretation: 'Impaired fasting glucose',
      sourcePage: 1,
      extractionConfidence: 0.99
    },
    {
      id: 'param_3_4',
      reportId: rep3Id,
      name: 'Total Cholesterol',
      canonicalKey: 'total_cholesterol',
      originalValue: '215',
      numericValue: 215,
      unit: 'mg/dL',
      referenceRange: '< 200 Desirable',
      abnormalFlag: 'high',
      interpretation: 'Borderline high total cholesterol',
      sourcePage: 2,
      extractionConfidence: 0.99
    },
    {
      id: 'param_3_5',
      reportId: rep3Id,
      name: 'LDL Cholesterol (Bad)',
      canonicalKey: 'ldl',
      originalValue: '138',
      numericValue: 138,
      unit: 'mg/dL',
      referenceRange: '< 100 Optimal, 100-129 Near Optimal, >= 130 Borderline High',
      abnormalFlag: 'high',
      interpretation: 'Borderline elevated LDL, warrants lifestyle attention',
      sourcePage: 2,
      extractionConfidence: 0.98
    },
    {
      id: 'param_3_6',
      reportId: rep3Id,
      name: 'HDL Cholesterol (Good)',
      canonicalKey: 'hdl',
      originalValue: '48',
      numericValue: 48,
      unit: 'mg/dL',
      referenceRange: '> 40 Normal for Men, > 50 for Women',
      abnormalFlag: 'normal',
      interpretation: 'Within acceptable protective range',
      sourcePage: 2,
      extractionConfidence: 0.97
    },
    {
      id: 'param_3_7',
      reportId: rep3Id,
      name: 'Triglycerides',
      canonicalKey: 'triglycerides',
      originalValue: '185',
      numericValue: 185,
      unit: 'mg/dL',
      referenceRange: '< 150 Normal, 150-199 Borderline',
      abnormalFlag: 'high',
      interpretation: 'Mild elevation in blood fats',
      sourcePage: 2,
      extractionConfidence: 0.99
    },
    {
      id: 'param_3_8',
      reportId: rep3Id,
      name: 'Serum Creatinine',
      canonicalKey: 'creatinine',
      originalValue: '0.9',
      numericValue: 0.9,
      unit: 'mg/dL',
      referenceRange: '0.7 - 1.2',
      abnormalFlag: 'normal',
      interpretation: 'Normal kidney filtration marker',
      sourcePage: 2,
      extractionConfidence: 0.98
    }
  ];

  const report3: MedicalReport = {
    id: rep3Id,
    userId: defaultUserId,
    originalFilename: 'Lipid_Panel_HbA1c_Annual_Jan2026.pdf',
    mimeType: 'application/pdf',
    fileSize: 245000,
    reportCategory: 'Lipid Profile',
    examinationDate: '2026-01-20',
    uploadDate: '2026-01-20T09:40:00Z',
    laboratoryName: 'Apollo Diagnostics Health Centre',
    processingStatus: 'ready',
    extractedParameters: lipidParams,
    patientSummary: 'This panel checks your 3-month sugar control (HbA1c) and blood fats (cholesterol). Your HbA1c is 7.1%, which indicates your average blood sugar has been slightly elevated (an estimated average glucose of 157 mg/dL). Total cholesterol (215) and LDL "bad" cholesterol (138) are slightly above optimal limits. On the positive side, your kidney filtration function (creatinine 0.9) is completely normal.',
    doctorSummary: 'Cardiometabolic risk assessment: Suboptimal glycemic control (HbA1c 7.1%, FPG 128 mg/dL) consistent with Type 2 Diabetes mellitus under therapy. Combined dyslipidemia with elevated LDL-C (138 mg/dL) and hypertriglyceridemia (185 mg/dL). Renal filtration capacity intact (Creatinine 0.9 mg/dL). Consider intensifying lifestyle modifications or statin/oral hypoglycemic dosage titration in accordance with ASCVD guidelines.',
    extractionConfidence: 0.99,
    warnings: [],
    notes: 'Annual metabolic checkup; patient fast was 10 hours prior to venipuncture.',
    tags: ['HbA1c', 'Lipid Profile', 'Diabetes', 'Cardiometabolic'],
    isFavorite: false,
    pageCount: 2,
    createdAt: '2026-01-20T09:40:00Z',
    updatedAt: '2026-01-20T09:40:00Z'
  };

  // Pre-seed a helpful initial conversation
  const conv1: Conversation = {
    id: 'conv_initial_guide',
    userId: defaultUserId,
    title: 'Understanding My Hemoglobin & Iron Levels',
    selectedReportIds: [rep1Id, rep2Id],
    interactionMode: 'patient',
    preferredLanguage: 'en',
    messages: [
      {
        id: 'msg_1',
        conversationId: 'conv_initial_guide',
        sender: 'user',
        content: 'Why was my hemoglobin low in May, and has it improved?',
        referencedReportIds: [rep1Id, rep2Id],
        mode: 'patient',
        language: 'en',
        createdAt: '2025-11-19T09:00:00Z'
      },
      {
        id: 'msg_2',
        conversationId: 'conv_initial_guide',
        sender: 'ai',
        content: `### Summary of Your Hemoglobin Journey

In your **May 12, 2025 report**, your Hemoglobin was **10.2 g/dL**, which was below the normal laboratory range of **13.0 – 17.0 g/dL**. Your red blood cell size (MCV: 72.4 fL) and iron reserves (Ferritin: 14.5 ng/mL) were also depleted. 

*Think of Hemoglobin as the oxygen delivery vans in your bloodstream:* having low levels means your muscles and organs receive less oxygen, which commonly explains fatigue or breathlessness.

### Follow-up Comparison (November 18, 2025)
In your follow-up test 6 months later:
- **Hemoglobin increased to 13.4 g/dL** (an improvement of **+3.2 g/dL**, or **+31.4%**), bringing you right back into the healthy normal range!
- **MCV rose to 85.2 fL** (normal cell volume).
- **Ferritin climbed to 58.0 ng/mL** (healthy iron storage).

### Suggested Questions for Your Doctor:
1. Should I continue with a lower maintenance dose of iron, or stop supplementation and rely on diet?
2. When would you like to schedule my next routine check?
3. Are there any dietary habits that will prevent my iron from dropping again?`,
        referencedReportIds: [rep1Id, rep2Id],
        citations: [
          {
            reportId: rep1Id,
            reportName: 'CBC_Iron_Panel_Baseline_May2025.pdf',
            pageNumber: 1,
            parameter: 'Hemoglobin',
            excerpt: 'Hemoglobin 10.2 g/dL (Ref: 13.0 - 17.0 g/dL) [LOW]',
            isExtractedFact: true
          },
          {
            reportId: rep2Id,
            reportName: 'CBC_Iron_Panel_Followup_Nov2025.pdf',
            pageNumber: 1,
            parameter: 'Hemoglobin',
            excerpt: 'Hemoglobin 13.4 g/dL (Ref: 13.0 - 17.0 g/dL) [NORMAL]',
            isExtractedFact: true
          }
        ],
        mode: 'patient',
        language: 'en',
        createdAt: '2025-11-19T09:00:05Z'
      }
    ],
    createdAt: '2025-11-19T09:00:00Z',
    updatedAt: '2025-11-19T09:00:05Z'
  };

  return {
    users: [defaultUser, doctorUser],
    reports: [report1, report2, report3],
    conversations: [conv1],
    comparisons: []
  };
}

export function initDb(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      store = JSON.parse(raw);
    } else {
      store = createInitialSeedData();
      fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error initializing database, using seed:', err);
    store = createInitialSeedData();
  }
}

export function saveDb(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save store to file:', err);
  }
}

export const db = {
  // Users
  getUserById: (id: string) => store.users.find(u => u.id === id),
  getUserByEmail: (email: string) => store.users.find(u => u.email.toLowerCase() === email.toLowerCase()),
  createUser: (user: User) => {
    store.users.push(user);
    saveDb();
    return user;
  },
  updateUser: (id: string, updates: Partial<User>) => {
    const idx = store.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      store.users[idx] = { ...store.users[idx], ...updates };
      saveDb();
      return store.users[idx];
    }
    return null;
  },

  // Reports
  getReports: (userId: string) => store.reports.filter(r => r.userId === userId || userId === 'all'),
  getReportById: (id: string) => store.reports.find(r => r.id === id),
  createReport: (report: MedicalReport) => {
    store.reports.unshift(report);
    saveDb();
    return report;
  },
  updateReport: (id: string, updates: Partial<MedicalReport>) => {
    const idx = store.reports.findIndex(r => r.id === id);
    if (idx !== -1) {
      store.reports[idx] = { ...store.reports[idx], ...updates, updatedAt: new Date().toISOString() };
      saveDb();
      return store.reports[idx];
    }
    return null;
  },
  deleteReport: (id: string) => {
    const idx = store.reports.findIndex(r => r.id === id);
    if (idx !== -1) {
      const removed = store.reports.splice(idx, 1)[0];
      saveDb();
      return removed;
    }
    return null;
  },

  // Conversations
  getConversations: (userId: string) => store.conversations.filter(c => c.userId === userId),
  getConversationById: (id: string) => store.conversations.find(c => c.id === id),
  createConversation: (conv: Conversation) => {
    store.conversations.unshift(conv);
    saveDb();
    return conv;
  },
  updateConversation: (id: string, updates: Partial<Conversation>) => {
    const idx = store.conversations.findIndex(c => c.id === id);
    if (idx !== -1) {
      store.conversations[idx] = { ...store.conversations[idx], ...updates, updatedAt: new Date().toISOString() };
      saveDb();
      return store.conversations[idx];
    }
    return null;
  },
  deleteConversation: (id: string) => {
    const idx = store.conversations.findIndex(c => c.id === id);
    if (idx !== -1) {
      const removed = store.conversations.splice(idx, 1)[0];
      saveDb();
      return removed;
    }
    return null;
  },

  // Save DB
  saveDb: () => saveDb(),
  // Reset/Re-seed demo data
  resetDemoData: () => {
    store = createInitialSeedData();
    saveDb();
    return store;
  }
};

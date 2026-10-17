import { GoogleGenAI } from '@google/genai';
import { MedicalParameter, MedicalReport } from './db.js';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface ExtractionResult {
  reportCategory: string;
  examinationDate: string;
  laboratoryName: string;
  patientSummary: string;
  doctorSummary: string;
  parameters: Array<{
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
  }>;
  warnings: string[];
  extractionConfidence: number;
}

/**
 * Extracts structured medical data from an uploaded PDF or image using Gemini 3.8 Flash.
 */
export async function extractMedicalReportFromDoc(
  base64Data: string,
  mimeType: string,
  filename: string
): Promise<ExtractionResult> {
  const prompt = `You are DocuMed's specialized clinical document extraction system.
Analyze this medical laboratory or diagnostic document accurately and comprehensively.
Filename: "${filename}"

Extraction Guidelines:
1. Extract ALL test parameters, measured values, units, reference ranges, and abnormal indicators (High/Low/Critical/Normal).
2. For each parameter:
   - Provide the clean name (e.g., "Hemoglobin", "Total Cholesterol", "Thyroid Stimulating Hormone (TSH)", "Serum Creatinine").
   - A standardized canonicalKey (e.g., "hemoglobin", "total_cholesterol", "tsh", "creatinine", "wbc", "platelets", "hba1c").
   - The exact original value string as written on the paper (e.g., "10.2", "138", "< 0.05", "Positive").
   - If numeric, provide the parsed number (e.g., 10.2). If strictly qualitative/text, set numericValue to null.
   - The unit of measurement (e.g., "g/dL", "mg/dL", "mcL", "uIU/mL", "%").
   - The laboratory reference range (e.g., "13.0 - 17.0", "< 200", "0.4 - 4.2").
   - abnormalFlag: must be strictly one of: "normal", "low", "high", "critical", or "indeterminate".
   - A 1-sentence clinical interpretation for this specific parameter.
   - The source page number (1-indexed, default 1 if single page).
   - extractionConfidence: float between 0.0 and 1.0.
3. Determine the overarching reportCategory (e.g., "Complete Blood Count (CBC)", "Lipid Profile", "Thyroid Panel", "Liver Function Test (LFT)", "Kidney Function Test (KFT)", "HbA1c & Diabetes", "Urine Routine", "Electrolytes", or "General Pathology").
4. Extract the actual examination or specimen collection date if printed (YYYY-MM-DD format if known, otherwise date string or today).
5. Extract the diagnostic Laboratory / Diagnostic Centre name if visible.
6. Provide a 'patientSummary': A reassuring, easily understood explanation of findings written in everyday language with simple analogies (e.g., explaining hemoglobin as oxygen delivery trucks, or cholesterol as pipes). Highlight any abnormal values clearly without causing panic.
7. Provide a 'doctorSummary': A dense, clinical-grade synthesis using appropriate medical terminology (e.g. microcytic hypochromic indices, transaminitis, impaired fasting glycemia) indicating parameters requiring clinical correlation.
8. If any text is smudged, partially cropped, or missing units/ranges, add a clear warning string to 'warnings'. Never silently hallucinate or invent numbers.

Respond strictly with valid JSON conforming to this schema:
{
  "reportCategory": "string",
  "examinationDate": "YYYY-MM-DD or string",
  "laboratoryName": "string",
  "patientSummary": "string",
  "doctorSummary": "string",
  "extractionConfidence": 0.95,
  "warnings": ["string"],
  "parameters": [
    {
      "name": "string",
      "canonicalKey": "string",
      "originalValue": "string",
      "numericValue": 10.5,
      "unit": "string",
      "referenceRange": "string",
      "abnormalFlag": "normal" | "low" | "high" | "critical" | "indeterminate",
      "interpretation": "string",
      "sourcePage": 1,
      "extractionConfidence": 0.98
    }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    return {
      reportCategory: parsed.reportCategory || 'Laboratory Report',
      examinationDate: parsed.examinationDate || new Date().toISOString().split('T')[0],
      laboratoryName: parsed.laboratoryName || 'Diagnostic Laboratory',
      patientSummary: parsed.patientSummary || 'Medical report processed successfully.',
      doctorSummary: parsed.doctorSummary || 'Extracted laboratory metrics available for clinical review.',
      extractionConfidence: typeof parsed.extractionConfidence === 'number' ? parsed.extractionConfidence : 0.95,
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      parameters: Array.isArray(parsed.parameters) ? parsed.parameters : [],
    };
  } catch (err: any) {
    console.error('Gemini medical extraction error:', err);
    throw new Error(`Failed to extract medical report: ${err.message || err}`);
  }
}

/**
 * Conversational Medical Assistant with multi-report grounding and role awareness.
 */
export async function generateChatResponse(options: {
  userMessage: string;
  history: Array<{ sender: 'user' | 'ai'; content: string }>;
  selectedReports: MedicalReport[];
  interactionMode: 'patient' | 'doctor';
  preferredLanguage: 'en' | 'hinglish';
}): Promise<{
  content: string;
  citations: Array<{
    reportId: string;
    reportName: string;
    pageNumber: number;
    parameter?: string;
    excerpt: string;
    isExtractedFact: boolean;
  }>;
  suggestedFollowUps: string[];
}> {
  const { userMessage, history, selectedReports, interactionMode, preferredLanguage } = options;

  // Build report context summary
  const reportsContext = selectedReports.map((r, i) => {
    const paramsList = r.extractedParameters
      .map(p => `  - ${p.name} (${p.canonicalKey}): ${p.originalValue} ${p.unit} [Range: ${p.referenceRange}] -> Status: ${p.abnormalFlag.toUpperCase()} (Page ${p.sourcePage})`)
      .join('\n');
    return `[REPORT #${i + 1}] ID: ${r.id}
Title/File: ${r.originalFilename}
Category: ${r.reportCategory}
Lab: ${r.laboratoryName}
Date: ${r.examinationDate}
AI Patient Summary: ${r.patientSummary}
Extracted Parameters:
${paramsList}
Notes: ${r.notes || 'None'}`;
  }).join('\n\n---\n\n');

  let systemRolePrompt = '';
  if (interactionMode === 'patient') {
    systemRolePrompt = `YOU ARE IN PATIENT MODE:
- Goal: Make complex medical lab results, abbreviations, and numbers intuitively clear to the patient.
- Tone: Empathetic, calm, reassuring, and completely free of intimidating jargon.
- Analogies: Explain medical mechanisms using everyday analogies (e.g., hemoglobin = delivery trucks; white blood cells = security guard team; platelets = emergency repair crew; cholesterol = plumbing flow).
- Reference Ranges: Always explain what the lab's normal range is, where the patient's value falls, and what being slightly above or below generally means.
- Medical Safety: Never make definitive clinical diagnoses. Never prescribe drugs or tell patients to alter dosages. Emphasize that only their treating physician can evaluate their whole medical picture.
- Suggest 2-3 specific, high-yield questions the patient can ask their doctor during their next visit.`;
  } else {
    systemRolePrompt = `YOU ARE IN DOCTOR MODE:
- Goal: Provide technical, structured, information-dense clinical synthesis for a physician.
- Terminology: Use standard medical nomenclature (e.g. microcytosis, transaminitis, eGFR decline, secondary polycythemia, ASCVD risk markers).
- Structure: Lead with significant abnormalities, organ systems, and differential diagnostic considerations.
- Grounding: Distinguish rigidly between document-extracted empirical facts vs AI clinical interpretations.
- Highlight missing clinical history (e.g. medications, fasting status, prior baseline) needed to contextualize findings.`;
  }

  const languagePrompt = preferredLanguage === 'hinglish' || /hinglish|samjhao|kya|kyu|hai|mera|meri/i.test(userMessage)
    ? `LANGUAGE: HINGLISH (Natural Hindi written in Roman English script).
Speak fluently and naturally in warm, friendly Hinglish (e.g., "Aapka Hemoglobin 10.2 g/dL hai, jo normal range (13.0 - 17.0) se thoda kam hai. Iska matlab hai ki shareer mein oxygen pahunchane wale cells kam hain...").
Ensure medical parameters and numbers stay accurate while explanations are in intuitive conversational Hinglish.`
    : `LANGUAGE: Clean, professional English.`;

  const conversationHistoryText = history
    .slice(-6)
    .map(h => `${h.sender === 'user' ? 'User' : 'DocuMed AI'}: ${h.content}`)
    .join('\n');

  const fullPrompt = `You are DocuMed AI, a specialized medical report intelligence assistant.

${systemRolePrompt}

${languagePrompt}

AVAILABLE MEDICAL REPORTS IN CONTEXT:
${reportsContext || 'No specific report attached; answer generally while reminding the user to attach or upload their report for precise analysis.'}

PREVIOUS CONVERSATION:
${conversationHistoryText || 'None'}

USER QUERY:
${userMessage}

INSTRUCTIONS:
1. Answer the user query thoroughly and accurately based on the attached report data whenever applicable.
2. If the user asks about an unknown test or missing information not in the report, explicitly state that it is not present in the uploaded document rather than fabricating values.
3. Provide citations whenever referencing a specific test parameter or value from the report.
4. Conclude with 3 relevant suggested follow-up questions tailored to the conversation context.

Format your response as a JSON object:
{
  "response": "Markdown-formatted explanation...",
  "citations": [
    {
      "reportId": "report id from context",
      "reportName": "report filename",
      "pageNumber": 1,
      "parameter": "Hemoglobin",
      "excerpt": "Hemoglobin 10.2 g/dL (Ref: 13.0 - 17.0 g/dL)",
      "isExtractedFact": true
    }
  ],
  "suggestedFollowUps": [
    "Question 1",
    "Question 2",
    "Question 3"
  ]
}`;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: fullPrompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(result.text || '{}');
    return {
      content: parsed.response || 'I have analyzed your medical report. Please let me know what specific questions you have.',
      citations: Array.isArray(parsed.citations) ? parsed.citations : [],
      suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps) ? parsed.suggestedFollowUps : [
        'Which values in my report are outside normal limits?',
        'What questions should I ask my doctor about these results?',
        'Can you explain this in simpler language?'
      ],
    };
  } catch (err: any) {
    console.error('Gemini chat response error:', err);
    return {
      content: 'I analyzed the uploaded documents. Could you please clarify your question or specify which laboratory parameters you would like to explore?',
      citations: [],
      suggestedFollowUps: [
        'Explain my report summary',
        'Are there any abnormal values?'
      ]
    };
  }
}

/**
 * Two-Report Comparison Engine with AI clinical evaluation.
 */
export async function compareMedicalReports(
  rep1: MedicalReport,
  rep2: MedicalReport,
  mode: 'patient' | 'doctor',
  language: 'en' | 'hinglish'
): Promise<{
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
}> {
  // Sort by date (rep1 = older baseline, rep2 = newer follow-up)
  const d1 = new Date(rep1.examinationDate).getTime() || 0;
  const d2 = new Date(rep2.examinationDate).getTime() || 0;
  const [older, newer] = d1 <= d2 ? [rep1, rep2] : [rep2, rep1];

  // Match parameters by canonicalKey or normalized name
  const matched: Array<{
    name: string;
    canonicalKey: string;
    unit: string;
    referenceRange: string;
    val1: { value: string; num: number | null; flag: string };
    val2: { value: string; num: number | null; flag: string };
    deltaNum: number | null;
    percentChange: number | null;
    trend: 'improved' | 'worsened' | 'stable' | 'changed' | 'indeterminate';
  }> = [];

  for (const p1 of older.extractedParameters) {
    const match = newer.extractedParameters.find(
      p2 => p2.canonicalKey === p1.canonicalKey || p2.name.toLowerCase().trim() === p1.name.toLowerCase().trim()
    );

    if (match) {
      let deltaNum: number | null = null;
      let percentChange: number | null = null;
      let trend: 'improved' | 'worsened' | 'stable' | 'changed' | 'indeterminate' = 'stable';

      if (typeof p1.numericValue === 'number' && typeof match.numericValue === 'number') {
        deltaNum = Math.round((match.numericValue - p1.numericValue) * 100) / 100;
        if (p1.numericValue !== 0) {
          percentChange = Math.round(((match.numericValue - p1.numericValue) / p1.numericValue) * 1000) / 10;
        }

        // Calculate clinical trend direction
        if (p1.abnormalFlag !== 'normal' && match.abnormalFlag === 'normal') {
          trend = 'improved';
        } else if (p1.abnormalFlag === 'normal' && match.abnormalFlag !== 'normal') {
          trend = 'worsened';
        } else if (Math.abs(deltaNum) < 0.05) {
          trend = 'stable';
        } else {
          trend = 'changed';
        }
      }

      matched.push({
        name: p1.name,
        canonicalKey: p1.canonicalKey,
        unit: match.unit || p1.unit,
        referenceRange: match.referenceRange || p1.referenceRange,
        val1: { value: p1.originalValue, num: p1.numericValue, flag: p1.abnormalFlag },
        val2: { value: match.originalValue, num: match.numericValue, flag: match.abnormalFlag },
        deltaNum,
        percentChange,
        trend
      });
    }
  }

  const comparisonDataPrompt = `Compare these two longitudinal reports:
Older Baseline Report: "${older.originalFilename}" (Category: ${older.reportCategory}, Date: ${older.examinationDate})
Newer Follow-up Report: "${newer.originalFilename}" (Category: ${newer.reportCategory}, Date: ${newer.examinationDate})

Matched Overlapping Parameters:
${matched.map(m => `- ${m.name}: Previous ${m.val1.value} ${m.unit} [Flag: ${m.val1.flag}] -> Current ${m.val2.value} ${m.unit} [Flag: ${m.val2.flag}] (Delta: ${m.deltaNum !== null ? m.deltaNum : 'N/A'}, %: ${m.percentChange !== null ? m.percentChange + '%' : 'N/A'}, Trend: ${m.trend})`).join('\n')}

Instructions:
1. Provide 'patientExplanation':
   - An encouraging, plain-language comparison.
   - Explain what went up, what went down, and what stayed healthy.
   - Use clear everyday terms (or Hinglish if requested).
   - Distinguish numerical change from definitive medical diagnosis.
2. Provide 'doctorInterpretation':
   - A rigorous, clinician-oriented longitudinal trend assessment.
   - Note trajectory of clinically significant indices, resolution or worsening of flags, and therapeutic response markers.
   - Highlight any differences in laboratory reference ranges or units.

Respond in JSON:
{
  "patientExplanation": "Markdown...",
  "doctorInterpretation": "Markdown..."
}`;

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: comparisonDataPrompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(res.text || '{}');
    return {
      matchedParameters: matched,
      patientExplanation: parsed.patientExplanation || 'Comparison generated successfully based on overlapping parameters.',
      doctorInterpretation: parsed.doctorInterpretation || 'Longitudinal parameter analysis complete.',
    };
  } catch (err: any) {
    console.error('Gemini comparison error:', err);
    return {
      matchedParameters: matched,
      patientExplanation: 'Both reports share several laboratory parameters shown in the comparison table above.',
      doctorInterpretation: 'Longitudinal parameter extraction completed.',
    };
  }
}

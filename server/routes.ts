import express, { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { db, MedicalReport, User, Conversation } from './db.js';
import { extractMedicalReportFromDoc, generateChatResponse, compareMedicalReports } from './gemini.js';

export const apiRouter = express.Router();

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// ========================
// Authentication & Profile
// ========================

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, password, role, doctorCredentials, preferredLanguage } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.json({ user: existing, message: 'Welcome back! Logged in.' });
  }

  const newUser: User = {
    id: generateId('usr'),
    name,
    email,
    password: password || 'defaultpass',
    role: role === 'doctor' ? 'doctor' : 'patient',
    doctorCredentials: role === 'doctor' ? {
      licenseNumber: doctorCredentials?.licenseNumber || 'MED-VERIFIED',
      specialty: doctorCredentials?.specialty || 'General Practitioner',
      hospital: doctorCredentials?.hospital || 'Clinical Health Centre',
      verified: true
    } : undefined,
    preferredMode: role === 'doctor' ? 'doctor' : 'patient',
    preferredLanguage: preferredLanguage === 'hinglish' ? 'hinglish' : 'en',
    consentGiven: true,
    consentTimestamp: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  db.createUser(newUser);
  res.status(201).json({ user: newUser });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    // Auto-create friendly demo user or report not found
    const newUser: User = {
      id: generateId('usr'),
      name: email.split('@')[0],
      email,
      role: 'patient',
      preferredMode: 'patient',
      preferredLanguage: 'en',
      consentGiven: true,
      consentTimestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    db.createUser(newUser);
    return res.json({ user: newUser });
  }

  res.json({ user });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'usr_patient_demo';
  const user = db.getUserById(userId) || db.getUserById('usr_patient_demo');
  res.json({ user });
});

apiRouter.patch('/auth/profile', (req: Request, res: Response) => {
  const { userId, preferredMode, preferredLanguage, name, doctorCredentials, consentGiven } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  // Doctor mode validation
  if (preferredMode === 'doctor' && user.role !== 'doctor' && !doctorCredentials?.licenseNumber) {
    return res.status(403).json({
      error: 'Doctor mode requires professional clinical verification credentials.'
    });
  }

  const updates: Partial<User> = {};
  if (preferredMode) updates.preferredMode = preferredMode;
  if (preferredLanguage) updates.preferredLanguage = preferredLanguage;
  if (name) updates.name = name;
  if (consentGiven !== undefined) {
    updates.consentGiven = consentGiven;
    if (consentGiven) updates.consentTimestamp = new Date().toISOString();
  }
  if (doctorCredentials) {
    updates.role = 'doctor';
    updates.doctorCredentials = {
      licenseNumber: doctorCredentials.licenseNumber,
      specialty: doctorCredentials.specialty || 'Internal Medicine',
      hospital: doctorCredentials.hospital || 'Hospital Health System',
      verified: true
    };
  }

  const updated = db.updateUser(userId, updates);
  res.json({ user: updated });
});

// ========================
// Medical Reports Vault
// ========================

apiRouter.get('/reports', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'usr_patient_demo';
  const reports = db.getReports(userId);
  res.json({ reports });
});

apiRouter.get('/reports/:id', (req: Request, res: Response) => {
  const report = db.getReportById(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found.' });
  }
  res.json({ report });
});

apiRouter.post('/reports/upload', async (req: Request, res: Response) => {
  try {
    const { userId, filename, mimeType, base64Data, notes, tags } = req.body;

    if (!base64Data || !filename) {
      return res.status(400).json({ error: 'Missing report file data or filename.' });
    }

    const currentUserId = userId || 'usr_patient_demo';
    const reportId = generateId('rep');

    // Perform AI extraction with Gemini 3.8 Flash
    const effectiveMimeType = mimeType || (filename.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

    let extraction;
    try {
      extraction = await extractMedicalReportFromDoc(base64Data, effectiveMimeType, filename);
    } catch (extractErr: any) {
      console.warn('Extraction fallback triggered:', extractErr);
      extraction = {
        reportCategory: 'General Pathology',
        examinationDate: new Date().toISOString().split('T')[0],
        laboratoryName: 'Diagnostic Laboratory',
        patientSummary: 'Report received. You can ask DocuMed AI questions about this document.',
        doctorSummary: 'Document ingested; review original scan for verification.',
        parameters: [],
        warnings: ['Automated OCR extraction encountered an error; original scan is preserved.'],
        extractionConfidence: 0.5
      };
    }

    const newReport: MedicalReport = {
      id: reportId,
      userId: currentUserId,
      originalFilename: filename,
      mimeType: effectiveMimeType,
      fileSize: Math.round((base64Data.length * 3) / 4),
      reportCategory: extraction.reportCategory,
      examinationDate: extraction.examinationDate,
      uploadDate: new Date().toISOString(),
      laboratoryName: extraction.laboratoryName,
      processingStatus: 'ready',
      originalDataUrl: base64Data.startsWith('data:') ? base64Data : `data:${effectiveMimeType};base64,${base64Data}`,
      extractedParameters: extraction.parameters.map((p, idx) => ({
        ...p,
        id: `param_${reportId}_${idx + 1}`,
        reportId: reportId
      })),
      patientSummary: extraction.patientSummary,
      doctorSummary: extraction.doctorSummary,
      extractionConfidence: extraction.extractionConfidence,
      warnings: extraction.warnings,
      notes: notes || '',
      tags: tags || [extraction.reportCategory],
      isFavorite: false,
      pageCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.createReport(newReport);
    res.status(201).json({ report: newReport });
  } catch (err: any) {
    console.error('Report upload failure:', err);
    res.status(500).json({ error: err.message || 'Failed to process and upload report' });
  }
});

apiRouter.patch('/reports/:id', (req: Request, res: Response) => {
  const { notes, tags, isFavorite, reportCategory, originalFilename } = req.body;
  const updates: Partial<MedicalReport> = {};
  if (notes !== undefined) updates.notes = notes;
  if (tags !== undefined) updates.tags = tags;
  if (isFavorite !== undefined) updates.isFavorite = isFavorite;
  if (reportCategory !== undefined) updates.reportCategory = reportCategory;
  if (originalFilename !== undefined) updates.originalFilename = originalFilename;

  const updated = db.updateReport(req.params.id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'Report not found.' });
  }
  res.json({ report: updated });
});

apiRouter.delete('/reports/:id', (req: Request, res: Response) => {
  const deleted = db.deleteReport(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Report not found.' });
  }
  res.json({ success: true, id: req.params.id });
});

// ========================
// AI Conversations Workspace
// ========================

apiRouter.get('/conversations', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'usr_patient_demo';
  const conversations = db.getConversations(userId);
  res.json({ conversations });
});

apiRouter.post('/conversations', (req: Request, res: Response) => {
  const { userId, title, selectedReportIds, interactionMode, preferredLanguage } = req.body;
  const newConv: Conversation = {
    id: generateId('conv'),
    userId: userId || 'usr_patient_demo',
    title: title || 'New Medical Conversation',
    selectedReportIds: selectedReportIds || [],
    interactionMode: interactionMode || 'patient',
    preferredLanguage: preferredLanguage || 'en',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.createConversation(newConv);
  res.status(201).json({ conversation: newConv });
});

apiRouter.get('/conversations/:id', (req: Request, res: Response) => {
  const conv = db.getConversationById(req.params.id);
  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found.' });
  }
  res.json({ conversation: conv });
});

apiRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const {
      conversationId,
      userId,
      message,
      selectedReportIds,
      interactionMode,
      preferredLanguage
    } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const currentUserId = userId || 'usr_patient_demo';
    let conv = conversationId ? db.getConversationById(conversationId) : null;

    if (!conv) {
      conv = {
        id: conversationId || generateId('conv'),
        userId: currentUserId,
        title: message.substring(0, 36) + (message.length > 36 ? '...' : ''),
        selectedReportIds: selectedReportIds || [],
        interactionMode: interactionMode || 'patient',
        preferredLanguage: preferredLanguage || 'en',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.createConversation(conv);
    }

    // Add user message
    const userMsg = {
      id: generateId('msg'),
      conversationId: conv.id,
      sender: 'user' as const,
      content: message,
      referencedReportIds: selectedReportIds || conv.selectedReportIds || [],
      mode: interactionMode || conv.interactionMode || 'patient',
      language: preferredLanguage || conv.preferredLanguage || 'en',
      createdAt: new Date().toISOString()
    };
    conv.messages.push(userMsg);

    // Retrieve full report entities
    const targetReportIds = (selectedReportIds && selectedReportIds.length > 0)
      ? selectedReportIds
      : conv.selectedReportIds;

    const reports: MedicalReport[] = targetReportIds
      .map((id: string) => db.getReportById(id))
      .filter((r: MedicalReport | undefined): r is MedicalReport => Boolean(r));

    // Call Gemini 3.8 Flash
    const aiResult = await generateChatResponse({
      userMessage: message,
      history: conv.messages.map(m => ({ sender: m.sender, content: m.content })),
      selectedReports: reports,
      interactionMode: interactionMode || conv.interactionMode || 'patient',
      preferredLanguage: preferredLanguage || conv.preferredLanguage || 'en'
    });

    const aiMsg = {
      id: generateId('msg'),
      conversationId: conv.id,
      sender: 'ai' as const,
      content: aiResult.content,
      referencedReportIds: targetReportIds,
      citations: aiResult.citations,
      mode: interactionMode || conv.interactionMode || 'patient',
      language: preferredLanguage || conv.preferredLanguage || 'en',
      createdAt: new Date().toISOString()
    };
    conv.messages.push(aiMsg);
    conv.updatedAt = new Date().toISOString();
    db.saveDb();

    res.json({
      message: aiMsg,
      conversationId: conv.id,
      suggestedFollowUps: aiResult.suggestedFollowUps
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message || 'Chat generation failed' });
  }
});

apiRouter.delete('/conversations/:id', (req: Request, res: Response) => {
  const deleted = db.deleteConversation(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Conversation not found.' });
  }
  res.json({ success: true, id: req.params.id });
});

// ========================
// Two-Report Comparison
// ========================

apiRouter.post('/compare', async (req: Request, res: Response) => {
  try {
    const { reportId1, reportId2, mode, language } = req.body;
    if (!reportId1 || !reportId2) {
      return res.status(400).json({ error: 'Two report IDs are required for comparison.' });
    }

    const rep1 = db.getReportById(reportId1);
    const rep2 = db.getReportById(reportId2);

    if (!rep1 || !rep2) {
      return res.status(404).json({ error: 'One or both reports could not be found.' });
    }

    const comparison = await compareMedicalReports(
      rep1,
      rep2,
      mode || 'patient',
      language || 'en'
    );

    res.json({
      report1: rep1,
      report2: rep2,
      ...comparison
    });
  } catch (err: any) {
    console.error('Comparison error:', err);
    res.status(500).json({ error: err.message || 'Comparison failed' });
  }
});

// Demo data reset
apiRouter.post('/demo/reset', (req: Request, res: Response) => {
  db.resetDemoData();
  res.json({ success: true, message: 'Demo medical database restored with baseline & follow-up panels.' });
});

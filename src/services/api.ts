import { MedicalReport, User, Conversation, ComparisonResult, Message } from '../types.ts';

const API_BASE = '/api';

export async function fetchCurrentUser(userId?: string): Promise<User> {
  const url = userId ? `${API_BASE}/auth/me?userId=${userId}` : `${API_BASE}/auth/me`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch user');
  const data = await res.json();
  return data.user;
}

export async function updateProfile(updates: {
  userId: string;
  preferredMode?: 'patient' | 'doctor';
  preferredLanguage?: 'en' | 'hinglish';
  name?: string;
  consentGiven?: boolean;
  doctorCredentials?: {
    licenseNumber: string;
    specialty: string;
    hospital: string;
  };
}): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update profile');
  }
  const data = await res.json();
  return data.user;
}

export async function fetchReports(userId?: string): Promise<MedicalReport[]> {
  const url = userId ? `${API_BASE}/reports?userId=${userId}` : `${API_BASE}/reports`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch medical reports');
  const data = await res.json();
  return data.reports;
}

export async function fetchReportById(id: string): Promise<MedicalReport> {
  const res = await fetch(`${API_BASE}/reports/${id}`);
  if (!res.ok) throw new Error('Failed to fetch report');
  const data = await res.json();
  return data.report;
}

export async function uploadReport(payload: {
  userId?: string;
  filename: string;
  mimeType: string;
  base64Data: string;
  notes?: string;
  tags?: string[];
}): Promise<MedicalReport> {
  const res = await fetch(`${API_BASE}/reports/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Upload and processing failed');
  }
  const data = await res.json();
  return data.report;
}

export async function updateReport(id: string, updates: Partial<MedicalReport>): Promise<MedicalReport> {
  const res = await fetch(`${API_BASE}/reports/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update report');
  const data = await res.json();
  return data.report;
}

export async function deleteReport(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/reports/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete report');
  return true;
}

export async function fetchConversations(userId?: string): Promise<Conversation[]> {
  const url = userId ? `${API_BASE}/conversations?userId=${userId}` : `${API_BASE}/conversations`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch conversations');
  const data = await res.json();
  return data.conversations;
}

export async function sendChatMessage(payload: {
  conversationId?: string;
  userId?: string;
  message: string;
  selectedReportIds?: string[];
  interactionMode?: 'patient' | 'doctor';
  preferredLanguage?: 'en' | 'hinglish';
}): Promise<{
  message: Message;
  conversationId: string;
  suggestedFollowUps: string[];
}> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to send chat message');
  }
  return res.json();
}

export async function compareReports(payload: {
  reportId1: string;
  reportId2: string;
  mode?: 'patient' | 'doctor';
  language?: 'en' | 'hinglish';
}): Promise<ComparisonResult> {
  const res = await fetch(`${API_BASE}/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to compare reports');
  }
  return res.json();
}

export async function resetDemo(): Promise<void> {
  await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
}

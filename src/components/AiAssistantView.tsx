import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  Paperclip,
  Check,
  X,
  FileText,
  Copy,
  Loader2,
  Stethoscope,
  UserCheck,
  PlusCircle,
  MessageSquare,
  BookOpen,
  ChevronDown
} from 'lucide-react';
import { MedicalReport, Conversation, Message } from '../types.ts';
import { fetchConversations, sendChatMessage } from '../services/api.ts';

interface AiAssistantViewProps {
  reports: MedicalReport[];
  currentMode: 'patient' | 'doctor';
  currentLanguage: 'en' | 'hinglish';
  activeReportId?: string;
  onSelectReportToView: (report: MedicalReport) => void;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  reports,
  currentMode,
  currentLanguage,
  activeReportId,
  onSelectReportToView
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>(
    activeReportId ? [activeReportId] : reports.slice(0, 2).map(r => r.id)
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [suggestedFollowUps, setSuggestedFollowUps] = useState<string[]>([]);
  const [showReportPicker, setShowReportPicker] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const convs = await fetchConversations();
      setConversations(convs);
      if (convs.length > 0) {
        setActiveConversationId(convs[0].id);
        setMessages(convs[0].messages || []);
        if (convs[0].selectedReportIds && convs[0].selectedReportIds.length > 0) {
          setSelectedReportIds(convs[0].selectedReportIds);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversationId(conv.id);
    setMessages(conv.messages || []);
    setSelectedReportIds(conv.selectedReportIds || []);
  };

  const handleCreateNewChat = () => {
    setActiveConversationId('');
    setMessages([]);
    setSuggestedFollowUps([
      currentLanguage === 'hinglish' ? 'Meri report simple language mein samjhao' : 'Explain my recent blood test summary',
      'Which values in my reports are outside normal limits?',
      'How do my recent reports compare over time?',
      'What questions should I ask my doctor?'
    ]);
  };

  const toggleReportAttachment = (reportId: string) => {
    setSelectedReportIds(prev =>
      prev.includes(reportId) ? prev.filter(id => id !== reportId) : [...prev, reportId]
    );
  };

  const handleSendMessage = async (queryText?: string) => {
    const text = queryText || inputQuery;
    if (!text.trim() || isSending) return;

    setInputQuery('');
    const tempUserMsg: Message = {
      id: `msg_${Date.now()}`,
      conversationId: activeConversationId || 'temp',
      sender: 'user',
      content: text,
      referencedReportIds: selectedReportIds,
      mode: currentMode,
      language: currentLanguage,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setIsSending(true);

    try {
      const res = await sendChatMessage({
        conversationId: activeConversationId || undefined,
        message: text,
        selectedReportIds: selectedReportIds,
        interactionMode: currentMode,
        preferredLanguage: currentLanguage,
      });

      if (!activeConversationId) {
        setActiveConversationId(res.conversationId);
        loadConversations();
      }

      setMessages(prev => [...prev, res.message]);
      setSuggestedFollowUps(res.suggestedFollowUps || []);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: Message = {
        id: `err_${Date.now()}`,
        conversationId: activeConversationId || 'temp',
        sender: 'ai',
        content: 'I encountered an error connecting to the clinical intelligence service. Please try again.',
        referencedReportIds: selectedReportIds,
        mode: currentMode,
        language: currentLanguage,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const attachedReports = reports.filter(r => selectedReportIds.includes(r.id));

  const defaultPrompts = currentMode === 'patient'
    ? [
        currentLanguage === 'hinglish' ? 'Meri report simple language mein samjhao' : 'Explain my report in simple language with analogies',
        'Which test values are not normal?',
        'How does my current report compare to my last test?',
        'What questions should I ask my doctor at my visit?'
      ]
    : [
        'Provide structured clinical interpretation & key abnormalities',
        'Compare renal & metabolic parameters across attached reports',
        'Which laboratory findings warrant clinical symptom correlation?',
        'Generate clinician-facing summary with units and reference ranges'
      ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-5rem)] flex flex-col">
      <div className="flex-1 bg-white border border-zinc-200/90 rounded-xl shadow-xs grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
        {/* Left Sidebar: Saved Discussions & Document Context (3 cols on md) */}
        <div className="hidden md:flex md:col-span-4 border-r border-zinc-200/90 bg-zinc-50/60 flex-col min-h-0">
          <div className="p-3.5 border-b border-zinc-200/80 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-zinc-900 tracking-tight">
              Conversations
            </span>
            <button
              onClick={handleCreateNewChat}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-800 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-md transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Chat</span>
            </button>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelectConversation(c)}
                className={`w-full text-left p-2.5 rounded-lg transition-colors text-xs flex items-start gap-2 ${
                  c.id === activeConversationId
                    ? 'bg-white shadow-xs border border-zinc-200/80 font-medium text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-100/70 hover:text-zinc-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.title || 'Medical Conversation'}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {c.selectedReportIds.length} attached · {c.interactionMode}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Attached Documents Context in Sidebar */}
          <div className="p-3 border-t border-zinc-200/80 bg-white space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-700">Document Context</span>
              <button
                onClick={() => setShowReportPicker(!showReportPicker)}
                className="text-[11px] text-teal-800 hover:text-teal-900 font-medium"
              >
                {showReportPicker ? 'Close' : 'Manage'}
              </button>
            </div>
            <div className="space-y-1">
              {attachedReports.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between text-[11px] p-1.5 bg-zinc-50 rounded border border-zinc-200"
                >
                  <span className="truncate max-w-[170px] font-medium text-zinc-800">
                    {r.originalFilename}
                  </span>
                  <button
                    onClick={() => toggleReportAttachment(r.id)}
                    className="text-zinc-400 hover:text-rose-600 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {attachedReports.length === 0 && (
                <p className="text-[11px] text-zinc-400 italic">No reports attached.</p>
              )}
            </div>
          </div>
        </div>

        {/* Central Assistant Workspace (8 cols on md) */}
        <div className="md:col-span-8 flex flex-col min-h-0 bg-white">
          {/* Top Bar inside workspace */}
          <div className="px-6 py-2.5 border-b border-zinc-200/80 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 shrink-0">
                <Paperclip className="w-3.5 h-3.5 text-zinc-400" />
                <span>Context:</span>
              </div>

              {attachedReports.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-1 text-[11px] px-2 py-0.5 bg-zinc-100 text-zinc-800 border border-zinc-200 rounded-md font-medium"
                >
                  <FileText className="w-3 h-3 text-zinc-500" />
                  <span className="truncate max-w-[160px]">{r.originalFilename}</span>
                  <button
                    onClick={() => toggleReportAttachment(r.id)}
                    className="hover:text-rose-700 ml-0.5"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}

              <button
                onClick={() => setShowReportPicker(!showReportPicker)}
                className="text-[11px] px-2 py-0.5 border border-dashed border-zinc-300 hover:border-zinc-400 text-zinc-600 rounded-md transition-colors"
              >
                + Attach
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-medium text-zinc-500">
                {currentMode === 'patient' ? 'Patient' : 'Clinician'} ·{' '}
                {currentLanguage === 'hinglish' ? 'Hinglish' : 'English'}
              </span>
            </div>
          </div>

          {/* Manage Attachments Drawer */}
          {showReportPicker && (
            <div className="p-4 bg-zinc-50 border-b border-zinc-200 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-800">
                  Select reports to attach into this AI medical context:
                </p>
                <button
                  onClick={() => setShowReportPicker(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-800"
                >
                  Done
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {reports.map((r) => {
                  const isSelected = selectedReportIds.includes(r.id);
                  return (
                    <div
                      key={r.id}
                      onClick={() => toggleReportAttachment(r.id)}
                      className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-white border-teal-700 text-zinc-900 font-semibold shadow-xs'
                          : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <p className="truncate">{r.originalFilename}</p>
                        <p className="text-[10px] text-zinc-400 font-normal">{r.examinationDate} · {r.reportCategory}</p>
                      </div>
                      <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-zinc-900 text-white' : 'border border-zinc-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Messages Stream - Comfortable Reading Width */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-12 space-y-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    DocuMed Assistant
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Ask questions grounded in your medical documents in English or natural Hinglish.
                  </p>
                </div>

                <div className="w-full space-y-2 pt-2">
                  <div className="grid grid-cols-1 gap-2">
                    {defaultPrompts.map((dp, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(dp)}
                        className="p-2.5 text-xs text-left bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 rounded-lg text-zinc-700 transition-colors"
                      >
                        {dp}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-6">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`rounded-lg px-4 py-3 text-xs leading-relaxed max-w-[90%] ${
                        msg.sender === 'user'
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-50/90 text-zinc-800 border border-zinc-200/80'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-zinc-200 space-y-1.5">
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">
                            <BookOpen className="w-3 h-3 text-teal-700" />
                            <span>Document Grounding & Citations:</span>
                          </div>
                          {msg.citations.map((c, ci) => (
                            <div
                              key={ci}
                              className="text-[11px] text-zinc-800 bg-white p-2 rounded border border-zinc-200 font-mono"
                            >
                              <span className="font-semibold">{c.parameter || 'Extracted'}:</span>{' '}
                              <span>{c.excerpt}</span>
                              <div className="text-[10px] text-zinc-400 mt-0.5 font-sans">
                                Page {c.pageNumber} · {c.reportName}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.sender === 'ai' && (
                        <div className="mt-2.5 pt-2 border-t border-zinc-200/60 flex items-center justify-between text-[10px] text-zinc-400">
                          <span>DocuMed AI · {msg.mode === 'doctor' ? 'Clinical' : 'Patient'}</span>
                          <button
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            className="flex items-center gap-1 text-zinc-500 hover:text-zinc-800"
                          >
                            {copiedId === msg.id ? (
                              <span className="text-emerald-700 font-semibold">Copied</span>
                            ) : (
                              <span>Copy</span>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isSending && (
                  <div className="flex items-center gap-2 text-xs text-zinc-400 p-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-700" />
                    <span>Analyzing document parameters...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Follow-up Prompts */}
          {suggestedFollowUps.length > 0 && !isSending && (
            <div className="px-6 py-2 bg-zinc-50 border-t border-zinc-200 flex items-center gap-2 overflow-x-auto shrink-0">
              <span className="text-[11px] text-zinc-400 font-medium shrink-0">Follow-up:</span>
              {suggestedFollowUps.map((fu, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(fu)}
                  className="text-[11px] px-2.5 py-1 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  {fu}
                </button>
              ))}
            </div>
          )}

          {/* Input Composer */}
          <div className="p-4 border-t border-zinc-200 bg-white shrink-0">
            <div className="max-w-2xl mx-auto flex items-center gap-2">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={
                  currentMode === 'patient'
                    ? 'Ask about your test (e.g. "Meri CBC report simple language mein samjhao")'
                    : 'Enter clinical query or request structured differential...'
                }
                disabled={isSending}
                className="flex-1 text-xs p-2.5 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-700 bg-zinc-50/50"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputQuery.trim() || isSending}
                className={`p-2.5 rounded-lg text-white transition-colors shadow-xs ${
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
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle, AlertCircle, Loader2, Sparkles, Tag, FileCheck } from 'lucide-react';
import { uploadReport } from '../services/api.ts';
import { MedicalReport } from '../types.ts';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (report: MedicalReport) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [base64Data, setBase64Data] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf')) {
      setErrorMessage('Please upload a PDF document or a clear JPG/PNG medical image.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('File size must be under 20MB.');
      return;
    }

    setErrorMessage('');
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Content = result.includes(',') ? result.split(',')[1] : result;
      setBase64Data(base64Content);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleStartUpload = async () => {
    if (!selectedFile || !base64Data) {
      setErrorMessage('Please select a medical report file first.');
      return;
    }

    try {
      setUploadStatus('uploading');
      setStatusMessage('Encrypting and uploading medical document...');

      await new Promise(r => setTimeout(r, 600));

      setUploadStatus('processing');
      setStatusMessage('Gemini 3.8 Flash extracting medical parameters, reference ranges & OCR...');

      const tagArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const report = await uploadReport({
        filename: selectedFile.name,
        mimeType: selectedFile.type || 'application/pdf',
        base64Data: base64Data,
        notes: notes.trim(),
        tags: tagArray.length > 0 ? tagArray : undefined,
      });

      setUploadStatus('success');
      setStatusMessage('Medical document processed and structured successfully!');
      setTimeout(() => {
        onUploadSuccess(report);
        handleReset();
        onClose();
      }, 900);
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadStatus('error');
      setErrorMessage(err.message || 'Failed to process document. Please try again.');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setBase64Data('');
    setNotes('');
    setTags('');
    setUploadStatus('idle');
    setErrorMessage('');
    setStatusMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div>
            <h2 className="text-sm font-bold text-zinc-900">Upload Medical Report</h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              PDF reports, scanned lab sheets, or diagnostic photos
            </p>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {!selectedFile ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-teal-700 bg-teal-50/50'
                  : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-10 h-10 mx-auto rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center mb-2">
                <UploadCloud className="w-5 h-5 stroke-[1.8]" />
              </div>
              <p className="text-xs font-semibold text-zinc-800">
                Click to browse or drag and drop report
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                PDF, JPG, PNG up to 20MB · AI OCR for scanned sheets
              </p>
            </div>
          ) : (
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-200 text-zinc-700 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-900 truncate max-w-xs">{selectedFile.name}</p>
                    <p className="text-[11px] text-zinc-500">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · {selectedFile.type || 'Document'}
                    </p>
                  </div>
                </div>
                {uploadStatus === 'idle' && (
                  <button
                    onClick={handleReset}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded"
                  >
                    Change
                  </button>
                )}
              </div>

              {uploadStatus !== 'idle' && (
                <div className="pt-2 border-t border-zinc-200/60">
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 mb-1">
                    {uploadStatus === 'uploading' && <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-700" />}
                    {uploadStatus === 'processing' && <Sparkles className="w-3.5 h-3.5 text-teal-700 animate-pulse" />}
                    {uploadStatus === 'success' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                    {uploadStatus === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
                    <span>{statusMessage}</span>
                  </div>

                  <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        uploadStatus === 'uploading'
                          ? 'w-1/3 bg-teal-700'
                          : uploadStatus === 'processing'
                          ? 'w-4/5 bg-teal-700 animate-pulse'
                          : uploadStatus === 'success'
                          ? 'w-full bg-emerald-600'
                          : 'w-full bg-rose-500'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-2.5">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Clinical Context or Patient Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Routine 6-month follow-up, fasting for 10 hours, feeling fatigued..."
                rows={2}
                disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
                className="w-full text-xs p-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-700 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-zinc-400" />
                <span>Tags (comma-separated)</span>
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. Anemia, Follow-up, Routine"
                disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
                className="w-full text-xs p-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-700 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2.5">
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
            className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={handleStartUpload}
            disabled={!selectedFile || uploadStatus === 'uploading' || uploadStatus === 'processing'}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors shadow-xs ${
              !selectedFile || uploadStatus === 'uploading' || uploadStatus === 'processing'
                ? 'bg-zinc-300 cursor-not-allowed'
                : 'bg-teal-800 hover:bg-teal-900'
            }`}
          >
            {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            )}
            <span>Process & Ingest</span>
          </button>
        </div>
      </div>
    </div>
  );
};

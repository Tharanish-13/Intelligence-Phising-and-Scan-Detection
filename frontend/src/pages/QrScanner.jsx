import React, { useState, useRef } from 'react';
import { 
  QrCode, 
  Upload, 
  Sparkles, 
  AlertCircle, 
  RefreshCw, 
  Send, 
  Image as ImageIcon, 
  CheckCircle2, 
  ShieldAlert, 
  X,
  FileCode
} from 'lucide-react';
import { apiService } from '../services/api';
import { ScanResultCard } from '../components/ScanResultCard';

// Pre-generated synthetic QR codes (base64 PNG) for instant hackathon evaluation
const SAMPLE_PHISH_B64 = "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";

const SAMPLE_CLEAN_B64 = "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";

export const QrScanner = ({ onScanComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP, BMP).');
      return;
    }
    // Validate size (10 MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('Selected image exceeds the 10 MB limit.');
      return;
    }

    setSelectedFile(file);
    setError('');
    setResult(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleScan = async (e) => {
    e?.preventDefault();
    if (!selectedFile) {
      setError('Please upload or select a QR code image to analyze.');
      return;
    }

    setScanning(true);
    setError('');
    setResult(null);

    try {
      const data = await apiService.analyzeQr(selectedFile);
      setResult(data);
      if (onScanComplete) onScanComplete();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'QR code decoding failed. Ensure the QR is clear and uncropped.');
    } finally {
      setScanning(false);
    }
  };

  const loadBase64Sample = (b64, filename) => {
    try {
      const byteCharacters = atob(b64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      const file = new File([blob], filename, { type: 'image/png' });
      processFile(file);
    } catch (err) {
      setError('Failed loading sample: ' + err.message);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
          <QrCode className="w-6 h-6 text-teal-400" />
          QR Code (Quishing) Threat Analyzer
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Safely unpack and decode QR code matrices using computer vision, followed by deep static inspection of the revealed destination.
        </p>
      </div>

      {/* Synthetic Demo Presets */}
      <div className="cyber-card p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>Hackathon Demo Presets (1-Click Synthetic QR Images):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadBase64Sample(SAMPLE_PHISH_B64, 'paypal_quish_sample.png')}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-700 text-rose-300 border border-slate-700 transition flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Load Phishing Quish QR (PayPal Mimicry)</span>
          </button>
          <button
            type="button"
            onClick={() => loadBase64Sample(SAMPLE_CLEAN_B64, 'clean_sample.png')}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Load Legitimate QR (example.com)</span>
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800 space-y-5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="qr-file-input"
        />

        {!previewUrl ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-teal-400/60 rounded-2xl p-8 text-center cursor-pointer transition bg-slate-900/40 hover:bg-slate-900/70"
          >
            <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 w-fit mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-200">
              Drag & Drop QR Code Image or <span className="text-teal-400 underline">Browse Files</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports PNG, JPEG, WebP, BMP up to 10 MB
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={previewUrl}
                alt="Uploaded QR Code Preview"
                className="w-20 h-20 object-contain rounded-lg bg-white p-1 border border-slate-700 shrink-0"
              />
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  {selectedFile?.name || 'qr_image.png'}
                </p>
                <span className="text-xs text-slate-500 font-mono">
                  {(selectedFile?.size / 1024).toFixed(1)} KB • Image Loaded Ready for OpenCV Decoding
                </span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
              title="Remove image"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
          >
            Clear Selection
          </button>

          <button
            id="qr-scan-btn"
            onClick={handleScan}
            disabled={scanning || !selectedFile}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 disabled:opacity-50 text-white font-semibold text-sm transition shadow-lg shadow-teal-950 flex items-center gap-2"
          >
            {scanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Decoding OpenCV Matrix...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Decode & Inspect QR</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
            <FileCode className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                Decoded QR Payload ({result.metadata?.decoded_type?.toUpperCase() || 'STRING'})
              </span>
              <p className="text-xs font-mono text-cyan-300 mt-1 break-all bg-slate-950 p-2 rounded border border-slate-800">
                {result.metadata?.decoded_content || result.target_preview}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                🛡️ Safe Inspection Guarantee: Target destination is displayed as plain text. It was never navigated or loaded.
              </span>
            </div>
          </div>

          <ScanResultCard result={result} onScanAgain={handleReset} />
        </div>
      )}
    </div>
  );
};

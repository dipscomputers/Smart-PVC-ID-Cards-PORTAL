import React, { useState, useEffect, useRef } from 'react';
import { Lock, KeyRound, Eye, EyeOff, X, AlertCircle } from 'lucide-react';

interface PdfPasswordModalProps {
  isOpen: boolean;
  fileName: string;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (password: string) => void;
}

export const PdfPasswordModal: React.FC<PdfPasswordModalProps> = ({
  isOpen,
  fileName,
  errorMessage,
  onClose,
  onSubmit,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    onSubmit(password.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-800">
        {/* Header */}
        <div className="p-4 px-6 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                PDF पासवर्ड आवश्यक आहे
              </h3>
              <p className="text-[11px] text-slate-300 truncate max-w-[240px]">
                {fileName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-xs text-gray-700 dark:text-amber-200/90 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 flex items-start gap-2.5">
            <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p>
              ही PDF फाईल पासवर्डने सुरक्षित आहे. कृपया फाईल उघडण्यासाठी पासवर्ड टाका (उदा. जन्म तारीख <strong>DDMMYYYY</strong>, पिनकोड किंवा मोबाईल नंबर).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
              PDF पासवर्ड प्रविष्ट करा:
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="उदा. 01011980"
                className="w-full px-3.5 py-2.5 pr-10 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer"
                title={showPassword ? 'पासवर्ड लपवा' : 'पासवर्ड दाखवा'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              रद्द करा (Cancel)
            </button>
            <button
              type="submit"
              disabled={!password.trim()}
              className="px-5 py-2 bg-[#0e4e96] hover:bg-[#0a3a70] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              अनलॉक व क्रॉप करा (Unlock)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

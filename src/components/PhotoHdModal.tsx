import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Check, 
  RotateCcw, 
  Sliders, 
  Zap, 
  Eye, 
  Layers, 
  Loader2 
} from 'lucide-react';
import { 
  enhancePhotoToHd, 
  HdEnhanceOptions, 
  DEFAULT_HD_PRESETS 
} from '../utils/photoHdEnhancer';

interface PhotoHdModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalPhotoUrl: string;
  onApplyHdPhoto: (hdPhotoUrl: string) => void;
}

export const PhotoHdModal: React.FC<PhotoHdModalProps> = ({
  isOpen,
  onClose,
  originalPhotoUrl,
  onApplyHdPhoto,
}) => {
  const [activePreset, setActivePreset] = useState<'auto' | 'ultraSharp' | 'studio' | 'cleanDoc' | 'custom'>('auto');
  const [sharpen, setSharpen] = useState<number>(45);
  const [contrast, setContrast] = useState<number>(18);
  const [brightness, setBrightness] = useState<number>(6);
  const [saturation, setSaturation] = useState<number>(12);

  const [previewUrl, setPreviewUrl] = useState<string>(originalPhotoUrl);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [viewCompare, setViewCompare] = useState<'split' | 'hdOnly' | 'originalOnly'>('split');

  // Trigger enhancement whenever parameters change
  useEffect(() => {
    if (!isOpen || !originalPhotoUrl) return;

    let isMounted = true;
    setIsProcessing(true);

    const timer = setTimeout(async () => {
      try {
        const options: HdEnhanceOptions = {
          sharpen,
          contrast,
          brightness,
          saturation,
          targetWidth: 600,
          targetHeight: 800,
        };
        const hdResult = await enhancePhotoToHd(originalPhotoUrl, options);
        if (isMounted) {
          setPreviewUrl(hdResult);
          setIsProcessing(false);
        }
      } catch (err) {
        console.error('Enhancement error:', err);
        if (isMounted) setIsProcessing(false);
      }
    }, 120);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, originalPhotoUrl, sharpen, contrast, brightness, saturation]);

  if (!isOpen) return null;

  const handleApplyPreset = (presetKey: 'auto' | 'ultraSharp' | 'studio' | 'cleanDoc') => {
    const p = DEFAULT_HD_PRESETS[presetKey];
    setActivePreset(presetKey);
    setSharpen(p.sharpen || 45);
    setContrast(p.contrast || 18);
    setBrightness(p.brightness || 6);
    setSaturation(p.saturation || 12);
  };

  const handleReset = () => {
    setActivePreset('auto');
    const p = DEFAULT_HD_PRESETS.auto;
    setSharpen(p.sharpen || 45);
    setContrast(p.contrast || 18);
    setBrightness(p.brightness || 6);
    setSaturation(p.saturation || 12);
  };

  const handleApply = () => {
    onApplyHdPhoto(previewUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#064e3b] to-[#094d28] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-300/30">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>फोटो एचडी क्वालिटी कन्व्हर्टर</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold uppercase tracking-wider">
                  HD Enhancer
                </span>
              </h3>
              <p className="text-xs text-emerald-100/80 font-medium">
                अस्पष्ट, अंधुक किंवा कमी रिझोल्यूशन असलेला फोटो स्पष्ट व आकर्षक बनवा
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
          {/* 1. Comparison & Preview Screen */}
          <div className="flex flex-col items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => setViewCompare('split')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  viewCompare === 'split' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                बाजूबाजूने तुलना (Side-by-Side)
              </button>
              <button
                type="button"
                onClick={() => setViewCompare('hdOnly')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  viewCompare === 'hdOnly' ? 'bg-[#094d28] text-white shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                केवळ एचडी (HD Only)
              </button>
              <button
                type="button"
                onClick={() => setViewCompare('originalOnly')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  viewCompare === 'originalOnly' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                मूळ फोटो (Original)
              </button>
            </div>

            {/* Photo Cards Display */}
            <div className="flex flex-wrap items-center justify-center gap-6 py-2">
              {/* Original Photo */}
              {(viewCompare === 'split' || viewCompare === 'originalOnly') && (
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    मूळ फोटो (Original)
                  </span>
                  <div className="relative w-32 h-40 bg-slate-100 rounded-xl overflow-hidden border border-slate-300 shadow-inner flex items-center justify-center">
                    {originalPhotoUrl && originalPhotoUrl.trim() !== '' ? (
                      <img
                        src={originalPhotoUrl}
                        alt="Original"
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-200 flex items-center justify-center text-xs text-slate-400">
                        फोटो नाही
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 text-[9px] px-1.5 py-0.5 bg-slate-900/70 text-white rounded font-mono font-bold">
                      Standard
                    </span>
                  </div>
                </div>
              )}

              {/* Arrow or Separator if split */}
              {viewCompare === 'split' && (
                <div className="hidden sm:flex flex-col items-center justify-center text-emerald-600 font-bold">
                  <span className="text-xl">➔</span>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-700">HD Boost</span>
                </div>
              )}

              {/* HD Enhanced Photo */}
              {(viewCompare === 'split' || viewCompare === 'hdOnly') && (
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>एचडी फोटो (HD Enhanced)</span>
                  </span>
                  <div className="relative w-32 h-40 bg-white rounded-xl overflow-hidden border-2 border-emerald-600 shadow-lg flex items-center justify-center ring-4 ring-emerald-500/15">
                    {previewUrl && previewUrl.trim() !== '' ? (
                      <img
                        src={previewUrl}
                        alt="HD Enhanced"
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-200 flex items-center justify-center text-xs text-slate-400">
                        प्रक्रियेत आहे...
                      </div>
                    )}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-xs flex items-center justify-center text-white">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-300" />
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 text-[9px] px-1.5 py-0.5 bg-emerald-700 text-white rounded font-mono font-bold shadow-xs">
                      1080p HD
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. 1-Click Quick Presets */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>१-क्लिक प्रीसेट्स (Quick HD Presets):</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => handleApplyPreset('auto')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                  activePreset === 'auto'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span>✨ ऑटो एचडी</span>
                  {activePreset === 'auto' && <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">शिफारस केलेले (Balanced)</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('ultraSharp')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                  activePreset === 'ultraSharp'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span>🔍 अल्ट्रा शार्प</span>
                  {activePreset === 'ultraSharp' && <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">अस्पष्ट/धूसर फोटोसाठी</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('studio')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                  activePreset === 'studio'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span>🎨 स्टुडिओ कलर</span>
                  {activePreset === 'studio' && <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">आकर्षक चेहरेपट्टी व रंग</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('cleanDoc')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                  activePreset === 'cleanDoc'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span>📄 क्लिन डॉक्युमेंट</span>
                  {activePreset === 'cleanDoc' && <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">स्वच्छ पांढरी पार्श्वभूमी</div>
              </button>
            </div>
          </div>

          {/* 3. Fine-Tune Sliders */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>फाईन ऍडजस्टमेंट (Fine-Tune Controls):</span>
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>रिसेट</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
              {/* Sharpness */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>शार्पनेस (Edge Sharpness)</span>
                  <span className="font-mono font-bold text-emerald-800 dark:text-emerald-400">{sharpen}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sharpen}
                  onChange={(e) => {
                    setActivePreset('custom');
                    setSharpen(Number(e.target.value));
                  }}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>कॉन्ट्रास्ट (Dynamic Contrast)</span>
                  <span className="font-mono font-bold text-emerald-800 dark:text-emerald-400">+{contrast}</span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="45"
                  value={contrast}
                  onChange={(e) => {
                    setActivePreset('custom');
                    setContrast(Number(e.target.value));
                  }}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Brightness */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>ब्राइटनेस (Light Balance)</span>
                  <span className="font-mono font-bold text-emerald-800 dark:text-emerald-400">+{brightness}</span>
                </div>
                <input
                  type="range"
                  min="-25"
                  max="35"
                  value={brightness}
                  onChange={(e) => {
                    setActivePreset('custom');
                    setBrightness(Number(e.target.value));
                  }}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>रंग व सॅच्युरेशन (Skin Vibrance)</span>
                  <span className="font-mono font-bold text-emerald-800 dark:text-emerald-400">+{saturation}</span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="40"
                  value={saturation}
                  onChange={(e) => {
                    setActivePreset('custom');
                    setSaturation(Number(e.target.value));
                  }}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
            💡 हा एचडी फोटो कार्डवर व प्रिंट करताना क्रिस्टल क्लिअर दिसेल.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer transition-colors"
            >
              रद्द करा (Cancel)
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isProcessing}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#094d28] hover:bg-[#073d1f] active:bg-[#052e17] text-white font-bold text-xs shadow-md cursor-pointer transition-all transform hover:-translate-y-0.5"
            >
              <Check className="w-4 h-4 text-amber-400" />
              <span>एचडी फोटो लागू करा (Apply HD Photo)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

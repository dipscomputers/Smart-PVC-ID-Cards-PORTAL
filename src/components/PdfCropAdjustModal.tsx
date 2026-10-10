import React, { useState } from 'react';
import { X, Check, RotateCcw, Sliders, Eye } from 'lucide-react';
import { CropBox } from '../utils/pdfCardCropper';

interface PdfCropAdjustModalProps {
  isOpen: boolean;
  pageImageUrl: string;
  backPageImageUrl?: string;
  frontCrop: CropBox;
  backCrop: CropBox;
  title?: string;
  onClose: () => void;
  onApplyCrop: (front: CropBox, back: CropBox) => void;
}

export const PdfCropAdjustModal: React.FC<PdfCropAdjustModalProps> = ({
  isOpen,
  pageImageUrl,
  backPageImageUrl,
  frontCrop: initialFront,
  backCrop: initialBack,
  title = 'कार्ड क्रॉप ॲडजस्ट करा (Fine-tune Crop)',
  onClose,
  onApplyCrop,
}) => {
  const [front, setFront] = useState<CropBox>(initialFront);
  const [back, setBack] = useState<CropBox>(initialBack);
  const [activeBox, setActiveBox] = useState<'front' | 'back'>('front');

  if (!isOpen) return null;

  const isMultiPage = Boolean(backPageImageUrl && backPageImageUrl !== pageImageUrl);
  const currentImageUrl = (activeBox === 'back' && backPageImageUrl) ? backPageImageUrl : pageImageUrl;

  const current = activeBox === 'front' ? front : back;
  const updateCurrent = (updates: Partial<CropBox>) => {
    if (activeBox === 'front') {
      setFront(prev => ({ ...prev, ...updates }));
    } else {
      setBack(prev => ({ ...prev, ...updates }));
    }
  };

  const handleReset = () => {
    setFront({ ...initialFront });
    setBack({ ...initialBack });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-800">
        {/* Header */}
        <div className="p-4 px-6 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              {title}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              {isMultiPage 
                ? 'Front (पान १) किंवा Back (पान २) निवडून योग्य आकारात क्रॉप ॲडजस्ट करा.'
                : 'PDF मधील Front (हिरवा बॉक्स) आणि Back (निळा बॉक्स) चे स्थान आवश्यकतेनुसार ॲडजस्ट करा.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col md:flex-row gap-6">
          {/* Visual PDF Page Preview with Highlighted Crop Boxes */}
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/80 rounded-xl p-3 border border-slate-300 dark:border-slate-700 overflow-hidden relative">
            <div className="relative border border-gray-400 dark:border-slate-600 shadow-md bg-white max-h-[60vh] select-none">
              {currentImageUrl ? (
                <img
                  src={currentImageUrl}
                  alt="PDF Page Preview"
                  className="max-h-[58vh] w-auto object-contain block"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center text-slate-400">
                  लोड होत आहे...
                </div>
              )}

              {/* Front Crop Box (Green) - Shown if not multi-page or if activeBox is front */}
              {(!isMultiPage || activeBox === 'front') && (
                <div
                  onClick={() => setActiveBox('front')}
                  className={`absolute border-2 transition-all cursor-pointer ${
                    activeBox === 'front'
                      ? 'border-emerald-600 bg-emerald-500/20 ring-2 ring-emerald-400'
                      : 'border-emerald-500/80 bg-emerald-500/10'
                  }`}
                  style={{
                    left: `${front.x}%`,
                    top: `${front.y}%`,
                    width: `${front.width}%`,
                    height: `${front.height}%`,
                  }}
                >
                  <span className="absolute top-1 left-1.5 bg-emerald-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                    Front Card {isMultiPage && '(पान १)'}
                  </span>
                </div>
              )}

              {/* Back Crop Box (Blue) - Shown if not multi-page or if activeBox is back */}
              {(!isMultiPage || activeBox === 'back') && (
                <div
                  onClick={() => setActiveBox('back')}
                  className={`absolute border-2 transition-all cursor-pointer ${
                    activeBox === 'back'
                      ? 'border-blue-600 bg-blue-500/20 ring-2 ring-blue-400'
                      : 'border-blue-500/80 bg-blue-500/10'
                  }`}
                  style={{
                    left: `${back.x}%`,
                    top: `${back.y}%`,
                    width: `${back.width}%`,
                    height: `${back.height}%`,
                  }}
                >
                  <span className="absolute top-1 left-1.5 bg-blue-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                    Back Card {isMultiPage && '(पान २)'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Controls Column */}
          <div className="w-full md:w-80 space-y-4 shrink-0 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setActiveBox('front')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeBox === 'front'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Front Card (हिरवा)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBox('back')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeBox === 'back'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Back Card (निळा)
                </button>
              </div>

              <div className="space-y-3 bg-gray-50 dark:bg-slate-800/80 p-4 rounded-xl border border-gray-200 dark:border-slate-700 text-xs">
                <div>
                  <div className="flex justify-between font-bold text-gray-700 dark:text-slate-200 mb-1">
                    <span>वर खाली स्थान (Y Position):</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">{current.y.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="0.1"
                    value={current.y}
                    onChange={(e) => updateCurrent({ y: parseFloat(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-bold text-gray-700 dark:text-slate-200 mb-1">
                    <span>डावे उजवे स्थान (X Position):</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">{current.x.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    step="0.1"
                    value={current.x}
                    onChange={(e) => updateCurrent({ x: parseFloat(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-bold text-gray-700 dark:text-slate-200 mb-1">
                    <span>रुंदी (Width):</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">{current.width.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="75"
                    step="0.1"
                    value={current.width}
                    onChange={(e) => updateCurrent({ width: parseFloat(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-bold text-gray-700 dark:text-slate-200 mb-1">
                    <span>उंची (Height):</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">{current.height.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="45"
                    step="0.1"
                    value={current.height}
                    onChange={(e) => updateCurrent({ height: parseFloat(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleReset}
                className="w-full py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-transparent dark:border-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                डीफॉल्ट जागेवर आणा (Reset)
              </button>

              <button
                type="button"
                onClick={() => {
                  onApplyCrop(front, back);
                  onClose();
                }}
                className="w-full py-2.5 bg-[#0e4e96] hover:bg-[#0a3a70] text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                क्रॉप लागू करा (Apply Crop)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

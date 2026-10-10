import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Layers, 
  CreditCard, 
  CheckCircle, 
  Loader2, 
  FileText,
  Sliders,
  Grid,
  Plus,
  ImageIcon
} from 'lucide-react';
import { FarmerCardData } from '../types/farmerCard';
import { FarmerIdCardFront } from './FarmerIdCardFront';
import { FarmerIdCardBack } from './FarmerIdCardBack';
import { printComponent } from '../utils/printHelper';
import { safeHtml2Canvas } from '../utils/safeHtml2Canvas';
import { jsPDF } from 'jspdf';

interface FarmerIdPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCard: FarmerCardData;
  cards: FarmerCardData[];
  onSelectCardIndex?: (index: number) => void;
  activeCardIndex?: number;
  onRemoveCard?: (index: number) => void;
  onAddPdf?: () => void;
  onOpenCrop?: () => void;
}

export const FarmerIdPrintModal: React.FC<FarmerIdPrintModalProps> = ({
  isOpen,
  onClose,
  activeCard,
  cards,
  onSelectCardIndex,
  activeCardIndex = 0,
  onRemoveCard,
  onAddPdf,
  onOpenCrop,
}) => {
  const [viewMode, setViewMode] = useState<'front' | 'back' | 'both'>('front');
  const [printLayoutMode, setPrintLayoutMode] = useState<'single' | 'all-on-one-page'>('single');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      if (cards && cards.length > 1) {
        setPrintLayoutMode('all-on-one-page');
      } else {
        setPrintLayoutMode('single');
      }
    }
  }, [isOpen, cards?.length]);

  if (!isOpen) return null;

  const currentCard = cards[activeCardIndex] || activeCard || cards[0];
  const farmerName = (currentCard.fullNameEn || currentCard.fullNameMr || 'Farmer').replace(/\s+/g, '_');

  // Direct print handler
  const handlePrint = async (layoutMode: 'single' | 'all-on-one-page' | 'single-pvc') => {
    setIsPrinting(true);
    setNotification(null);

    try {
      if (layoutMode === 'single-pvc') {
        await printComponent('printable-farmer-pvc-direct', `Farmer_PVC_${farmerName}`, {
          mode: 'pvc-card',
          cardWidthMm: 85.6,
          cardHeightMm: 54.0,
        });
      } else if (layoutMode === 'all-on-one-page' && cards.length > 1) {
        await printComponent('printable-farmer-all-a4-sheet', `Farmer_All_${Math.min(cards.length, 5)}_Cards_A4`, {
          mode: 'a4',
          cardWidthMm: 85.6,
          cardHeightMm: 54.0,
        });
      } else {
        await printComponent('printable-farmer-a4-sheet', `Farmer_A4_${farmerName}`, {
          mode: 'a4',
          cardWidthMm: 85.6,
          cardHeightMm: 54.0,
        });
      }
      setNotification('प्रिंट कमांड यशस्वीरित्या पाठवली गेली आहे.');
    } catch (err) {
      console.error('Print failed:', err);
      setNotification('प्रिंट करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setIsPrinting(false);
    }
  };

  // HD PDF Download
  const handleDownloadPdf = async (layoutMode: 'single' | 'all-on-one-page') => {
    setIsExportingPdf(true);
    setNotification(null);

    try {
      if (layoutMode === 'all-on-one-page' && cards.length > 1) {
        const allA4El = document.getElementById('printable-farmer-all-a4-sheet');
        if (!allA4El) return;

        allA4El.style.display = 'block';
        const canvas = await safeHtml2Canvas(allA4El, { scale: 2, backgroundColor: '#ffffff' });
        allA4El.style.display = 'none';

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', 0, 0, 210, 297);
        pdf.save(`Farmer_All_${Math.min(cards.length, 5)}_Cards_A4_Sheet.pdf`);
      } else {
        const a4El = document.getElementById('printable-farmer-a4-sheet');
        if (!a4El) return;

        a4El.style.display = 'block';
        const canvas = await safeHtml2Canvas(a4El, { scale: 2, backgroundColor: '#ffffff' });
        a4El.style.display = 'none';

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', 0, 0, 210, 297);
        pdf.save(`Farmer_ID_A4_Sheet_${farmerName}.pdf`);
      }
      setNotification('PDF यशस्वीरित्या डाउनलोड झाली!');
      setDownloadSuccess(true);
    } catch (err) {
      console.error('PDF export failed:', err);
      setNotification('PDF डाउनलोड करताना त्रुटी आली.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const [isExportingJpg, setIsExportingJpg] = useState(false);

  // HD JPG Download

  const handleDownloadJpg = async (layoutMode: 'single' | 'all-on-one-page') => {
    setIsExportingJpg(true);
    setNotification(null);

    try {
      const isMulti = layoutMode === 'all-on-one-page' && cards.length > 1;
      const targetId = isMulti ? 'printable-farmer-all-a4-sheet' : 'printable-farmer-a4-sheet';
      let targetEl = document.getElementById(targetId);

      if (!targetEl) {
        targetEl = document.getElementById(isMulti ? 'printable-farmer-a4-sheet' : 'printable-farmer-all-a4-sheet');
      }

      if (!targetEl) {
        const frontEl = document.getElementById('modal-farmer-front');
        if (frontEl) targetEl = frontEl.parentElement || frontEl;
      }

      if (!targetEl) {
        throw new Error('प्रिंट घटक लोड झालेला नाही. कृपया थोडे थांबा.');
      }

      const canvas = await safeHtml2Canvas(targetEl as HTMLElement, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
      });

      const dataUrl = canvas.toDataURL('image/jpeg', 0.98);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = isMulti
        ? `Farmer_All_${Math.min(cards.length, 5)}_Cards_A4_Sheet.jpg`
        : `Farmer_ID_Card_${farmerName}.jpg`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setNotification('JPG फोटो यशस्वीरित्या डाऊनलोड झाला!');
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err: any) {
      console.error('JPG export failed:', err);
      setNotification(`JPG डाऊनलोड करताना त्रुटी: ${err?.message || 'कृपया पुन्हा प्रयत्न करा'}`);
    } finally {
      setIsExportingJpg(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl overflow-hidden flex flex-col space-y-3 my-auto max-h-[96vh]">
        
        {/* Top Header / Close bar */}
        <div className="flex items-center justify-between px-2 text-white">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-black tracking-wide text-white">
              AgriStack शेती परिचय पत्र • A4 & PVC प्रिंट स्टुडिओ
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>बंद करा (Close)</span>
          </button>
        </div>

        {/* 1. CARDS TAB BAR (Matches Screenshot_20261005_193525.jpg) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/90 p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto py-1">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 shrink-0">
              <Layers className="w-3.5 h-3.5 text-blue-700" />
              <span>कार्ड्स ({cards.length}):</span>
            </span>

            {cards.map((c, idx) => {
              const isActive = idx === activeCardIndex;
              const titleName = c.fullNameMr || c.fullNameEn || c.fileName || `कार्ड ${idx + 1}`;
              return (
                <div
                  key={c.id || idx}
                  onClick={() => onSelectCardIndex && onSelectCardIndex(idx)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none shrink-0 ${
                    isActive
                      ? 'bg-[#0e4e96] text-white shadow-xs'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <FileText className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span className="max-w-[160px] truncate">
                    कार्ड {idx + 1} ({titleName})
                  </span>
                  {cards.length > 1 && onRemoveCard && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveCard(idx);
                      }}
                      className={`ml-1 hover:text-red-300 transition-colors ${isActive ? 'text-white' : 'text-gray-400 hover:text-red-600'}`}
                      title="काढून टाका"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Green + Add Next PDF Button (Matches Screenshot_20261005_193525.jpg) */}
          <div className="flex items-center gap-2 shrink-0">
            {cards.length < 5 && onAddPdf && (
              <button
                type="button"
                onClick={onAddPdf}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition-all shrink-0 cursor-pointer"
                title="पुढील शेतकरी PDF फाईल जोडा"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>+ पुढील PDF जोडा</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. MAIN CARD PREVIEW & ACTIONS BOX (Matches Screenshot_20261005_193525.jpg) */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200/90 p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[82vh]">
          
          {/* ACTION TOOLBAR (ROW 1 - Matches Screenshot_20261005_193525.jpg) */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setViewMode('front')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'front' ? 'bg-[#0e4e96] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Front Side
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('back')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'back' ? 'bg-[#0e4e96] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Back Side
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('both')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'both' ? 'bg-[#0e4e96] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Both (दोन्ही बाजू)
                </button>
              </div>

              {/* Adjust Crop Button (Amber color exactly as in screenshot) */}
              {onOpenCrop && (
                <button
                  type="button"
                  onClick={onOpenCrop}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  title="फोटो क्रॉप व ॲडजस्ट करा"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-700" />
                  <span>क्रॉप ॲडजस्ट करा</span>
                </button>
              )}

              {/* Multi-card Layout Toggle (if > 1 card - Matches Screenshot_20261005_193525.jpg) */}
              {cards.length > 1 && (
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPrintLayoutMode('single')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      printLayoutMode === 'single'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    सध्याचे १ कार्ड
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintLayoutMode('all-on-one-page')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      printLayoutMode === 'all-on-one-page'
                        ? 'bg-[#0e4e96] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Grid className="w-3 h-3" />
                    <span>सर्व {cards.length} कार्ड्स १ पानावर</span>
                  </button>
                </div>
              )}
            </div>

            {/* Print & Download Action Buttons (Matches Screenshot_20261005_193525.jpg) */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handlePrint(printLayoutMode)}
                disabled={isPrinting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0e4e96] hover:bg-[#093566] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-900/20 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                <Printer className="w-4 h-4 text-sky-200" />
                <span>
                  {printLayoutMode === 'all-on-one-page' && cards.length > 1
                    ? `सर्व ${cards.length} कार्ड्स १ A4 पानावर प्रिंट करा`
                    : 'Print Farmer ID Card (A4)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadPdf(printLayoutMode)}
                disabled={isExportingPdf}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-900/20 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                {isExportingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : downloadSuccess ? (
                  <CheckCircle className="w-4 h-4 text-emerald-200" />
                ) : (
                  <Download className="w-4 h-4 text-emerald-200" />
                )}
                <span>Download PDF (A4)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadJpg(printLayoutMode)}
                disabled={isExportingJpg}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-purple-900/20 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                {isExportingJpg ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-purple-200" />
                )}
                <span>Download JPG</span>
              </button>

            </div>
          </div>

          {/* NOTIFICATION ALERT IF ANY */}
          {notification && (
            <div className="bg-emerald-50 text-emerald-900 px-3.5 py-2 text-xs font-bold rounded-xl border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{notification}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="text-emerald-700 hover:underline cursor-pointer"
              >
                ×
              </button>
            </div>
          )}

          {/* INFO SUB-BAR (ROW 2 - Matches Screenshot_20261005_193525.jpg) */}
          <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
            <span className="truncate">
              सध्याचे कार्ड ({activeCardIndex + 1}/{cards.length}): <strong>{currentCard.fullNameMr || currentCard.fullNameEn || currentCard.farmerId || 'Farmer'}</strong>
            </span>
            <span>PVC आकार: <strong>85.6 mm × 54 mm (CR80)</strong></span>
          </div>

          {/* PREVIEW DISPLAY (ROW 3) - Card design is 100% UNTOUCHED as requested */}
          {printLayoutMode === 'all-on-one-page' && cards.length > 1 ? (
            /* Multi-Card on 1 A4 Page layout (as in Screenshot_20261005_193525.jpg) */
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  📄 १ A4 पानावर सर्व {cards.length} कार्ड्सची मांडणी (All on 1 Sheet)
                </span>
              </div>
              <div className="flex flex-col items-center gap-4 p-4 bg-slate-50/90 rounded-2xl border border-gray-200/80">
                {cards.map((c, idx) => (
                  <div key={c.id || idx} className="flex flex-col sm:flex-row items-center gap-3">
                    <span className="text-[11px] font-bold text-gray-400 w-12 text-center sm:text-right">#{idx + 1}</span>
                    <div
                      className="w-[280px] sm:w-[320px] rounded-lg overflow-hidden shadow-sm border border-gray-300 bg-white"
                      style={{ aspectRatio: '85.6 / 54' }}
                    >
                      <FarmerIdCardFront card={c} isPrintMode={true} />
                    </div>
                    <div
                      className="w-[280px] sm:w-[320px] rounded-lg overflow-hidden shadow-sm border border-gray-300 bg-white"
                      style={{ aspectRatio: '85.6 / 54' }}
                    >
                      <FarmerIdCardBack card={c} isPrintMode={true} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Single Active Card Screen Preview */
            <div className="w-full flex justify-center overflow-x-auto py-2">
              {viewMode === 'both' ? (
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 p-4 bg-slate-50/90 rounded-2xl border border-gray-200/80">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Front Side (85.6 mm × 54 mm)
                    </span>
                    <div
                      id="modal-farmer-front"
                      className="w-[280px] sm:w-[320px] rounded-lg overflow-hidden shadow-md border border-gray-300 bg-white"
                      style={{ aspectRatio: '85.6 / 54' }}
                    >
                      <FarmerIdCardFront card={currentCard} isPrintMode={true} />
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Back Side (85.6 mm × 54 mm)
                    </span>
                    <div
                      id="modal-farmer-back"
                      className="w-[280px] sm:w-[320px] rounded-lg overflow-hidden shadow-md border border-gray-300 bg-white"
                      style={{ aspectRatio: '85.6 / 54' }}
                    >
                      <FarmerIdCardBack card={currentCard} isPrintMode={true} />
                    </div>
                  </div>
                </div>
              ) : viewMode === 'front' ? (
                <div className="flex flex-col items-center gap-1.5 p-4 bg-slate-50/90 rounded-2xl border border-gray-200/80">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Front Side (85.6 mm × 54 mm)
                  </span>
                  <div
                    id="modal-farmer-front"
                    className="w-[300px] sm:w-[340px] rounded-lg overflow-hidden shadow-md border border-gray-300 bg-white"
                    style={{ aspectRatio: '85.6 / 54' }}
                  >
                    <FarmerIdCardFront card={currentCard} isPrintMode={true} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 p-4 bg-slate-50/90 rounded-2xl border border-gray-200/80">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Back Side (85.6 mm × 54 mm)
                  </span>
                  <div
                    id="modal-farmer-back"
                    className="w-[300px] sm:w-[340px] rounded-lg overflow-hidden shadow-md border border-gray-300 bg-white"
                    style={{ aspectRatio: '85.6 / 54' }}
                  >
                    <FarmerIdCardBack card={currentCard} isPrintMode={true} />
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  CheckCircle, 
  Loader2, 
  FileText,
  Sliders,
  Grid,
  CreditCard,
  Crop,
  Plus,
  ImageIcon
} from 'lucide-react';
import { FarmerCardData } from '../types/farmerCard';
import { FarmerIdCardFront } from './FarmerIdCardFront';
import { FarmerIdCardBack } from './FarmerIdCardBack';
import { printComponent } from '../utils/printHelper';
import { safeHtml2Canvas } from '../utils/safeHtml2Canvas';
import { jsPDF } from 'jspdf';

interface FarmerIdPrintViewProps {
  cards: FarmerCardData[];
  activeCardIndex: number;
  setActiveCardIndex: (index: number) => void;
  onDeleteCard: (index: number) => void;
  onOpenCrop: () => void;
  onBackToForm: () => void;
  onAddPdf?: () => void;
}

export const FarmerIdPrintView: React.FC<FarmerIdPrintViewProps> = ({
  cards,
  activeCardIndex,
  setActiveCardIndex,
  onDeleteCard,
  onOpenCrop,
  onBackToForm,
  onAddPdf,
}) => {
  const [viewMode, setViewMode] = useState<'front' | 'back' | 'both'>('both');
  const [photoFitMode, setPhotoFitMode] = useState<'cover' | 'contain'>('cover');
  const [printLayoutMode, setPrintLayoutMode] = useState<'single' | 'all-on-one-page'>(
    cards && cards.length > 1 ? 'all-on-one-page' : 'single'
  );
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const currentCard = cards[activeCardIndex] || cards[0];
  const farmerName = (currentCard.fullNameEn || currentCard.fullNameMr || 'Farmer').replace(/\s+/g, '_');

  // Direct print handler (A4 sheet or Direct PVC card)
  const handlePrint = async (layoutMode: 'single' | 'all-on-one-page', printType: 'a4' | 'pvc' = 'a4') => {
    setIsPrinting(true);
    setNotification(null);

    try {
      let printSuccess = false;
      if (printType === 'pvc') {
        printSuccess = await printComponent('printable-farmer-pvc-direct', `Farmer_PVC_${farmerName}`, {
          mode: 'pvc-card',
          cardWidthMm: 85.6,
          cardHeightMm: 54.0,
        });
      } else if (layoutMode === 'all-on-one-page' && cards.length > 1) {
        printSuccess = await printComponent('printable-farmer-all-a4-sheet', `Farmer_All_${Math.min(cards.length, 5)}_Cards_A4`, {
          mode: 'a4',
          cardWidthMm: 85.6,
          cardHeightMm: 54.0,
        });
      } else {
        printSuccess = await printComponent('printable-farmer-a4-sheet', `Farmer_A4_${farmerName}`, {
          mode: 'a4',
          cardWidthMm: 85.6,
          cardHeightMm: 54.0,
        });
      }

      if (printSuccess) {
        setNotification('प्रिंट कमांड यशस्वीरित्या पाठवली गेली आहे.');
      } else {
        // If direct window.print is blocked (e.g. inside AI Studio iframe preview),
        // fallback directly to generating the crisp A4 PDF download!
        await handleDownloadPdf(layoutMode);
      }
    } catch (err: any) {
      console.error('Print failed:', err);
      await handleDownloadPdf(layoutMode);
    } finally {
      setIsPrinting(false);
    }
  };

  // HD PDF Download (A4 or direct 85.6mm x 54.0mm CR80 PVC)
  const handleDownloadPdf = async (layoutMode: 'single' | 'all-on-one-page', pdfType: 'a4' | 'pvc' = 'a4') => {
    setIsExportingPdf(true);
    setNotification(null);

    try {
      if (pdfType === 'pvc') {
        // Generate crisp 2-page PVC (CR80) format: 85.6mm × 54.0mm
        const frontEl = document.getElementById('modal-farmer-front') || document.getElementById('printable-farmer-pvc-direct');
        const backEl = document.getElementById('modal-farmer-back') || document.getElementById('printable-farmer-pvc-direct');

        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: [85.6, 54.0],
          compress: true,
        });

        if (frontEl) {
          const frontCanvas = await safeHtml2Canvas(frontEl, {
            scale: 3,
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true,
          });
          const frontImg = frontCanvas.toDataURL('image/jpeg', 0.98);
          pdf.addImage(frontImg, 'JPEG', 0, 0, 85.6, 54.0);
        }

        if (backEl) {
          pdf.addPage([85.6, 54.0], 'landscape');
          const backCanvas = await safeHtml2Canvas(backEl, {
            scale: 3,
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true,
          });
          const backImg = backCanvas.toDataURL('image/jpeg', 0.98);
          pdf.addImage(backImg, 'JPEG', 0, 0, 85.6, 54.0);
        }

        pdf.save(`Farmer_ID_PVC_CR80_${farmerName}.pdf`);
        setNotification('HD PVC (CR80) PDF यशस्वीरित्या डाउनलोड झाली!');
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
        return;
      }

      const isMulti = layoutMode === 'all-on-one-page' && cards.length > 1;
      const targetId = isMulti ? 'printable-farmer-all-a4-sheet' : 'printable-farmer-a4-sheet';
      let targetEl = document.getElementById(targetId);

      if (!targetEl) {
        // Fallback: look for portal root or alternate printable
        targetEl = document.getElementById(isMulti ? 'printable-farmer-a4-sheet' : 'printable-farmer-all-a4-sheet');
      }

      if (!targetEl) {
        throw new Error('प्रिंट घटक लोड झालेला नाही. कृपया थोडे थांबा.');
      }

      const canvas = await safeHtml2Canvas(targetEl, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.96);
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);

      const fileName = isMulti
        ? `Farmer_All_${Math.min(cards.length, 5)}_Cards_A4_Sheet.pdf`
        : `Farmer_ID_A4_Sheet_${farmerName}.pdf`;

      pdf.save(fileName);

      setNotification('PDF यशस्वीरित्या डाउनलोड झाली!');
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err: any) {
      console.error('PDF export failed:', err);
      setNotification(`PDF डाउनलोड करताना त्रुटी: ${err?.message || 'कृपया पुन्हा प्रयत्न करा'}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const [isExportingJpg, setIsExportingJpg] = useState(false);

  const handleDownloadJpg = async () => {
    const currentCard = cards[activeCardIndex] || cards[0];
    if (!currentCard) return;
    setIsExportingJpg(true);
    setNotification(null);

    try {
      const isMulti = printLayoutMode === 'all-on-one-page' && cards.length > 1;
      const targetId = isMulti ? 'printable-farmer-all-a4-sheet' : 'printable-farmer-a4-sheet';
      let targetEl = document.getElementById(targetId);

      if (!targetEl) {
        targetEl = document.getElementById(isMulti ? 'printable-farmer-a4-sheet' : 'printable-farmer-all-a4-sheet');
      }

      if (!targetEl) {
        // Fallback to on-screen card preview container
        const frontEl = document.getElementById('modal-farmer-front');
        if (frontEl) {
          targetEl = frontEl.parentElement || frontEl;
        }
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
      const safeName = (currentCard.fullNameEn || currentCard.fullNameMr || 'Farmer').replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_');

      link.href = dataUrl;
      link.download = isMulti
        ? `Farmer_All_${Math.min(cards.length, 5)}_Cards_A4_Sheet.jpg`
        : `Farmer_ID_Card_${safeName}.jpg`;

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
    <div className="space-y-3 animate-in fade-in duration-200">
      
      {/* 1. CARDS TAB BAR (Clean & Clutter-Free - No "+ पुढील PDF जोडा" button) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2.5 sm:p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto flex-1 min-w-0 py-0.5">
          <span className="text-xs font-bold text-gray-500 shrink-0">कार्ड्स ({cards.length}):</span>

          {cards.map((c, idx) => {
            const isActive = idx === activeCardIndex;
            const titleName = c.fullNameMr || c.fullNameEn || c.fileName || `कार्ड ${idx + 1}`;
            return (
              <button
                key={c.id || idx}
                type="button"
                onClick={() => setActiveCardIndex(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#0e4e96] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>कार्ड {idx + 1}</span>
                <span className="truncate max-w-[120px] text-[11px] opacity-85 font-normal">
                  ({titleName})
                </span>
                {cards.length > 1 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCard(idx);
                    }}
                    className="hover:text-red-300 ml-1 text-sm font-black"
                    title="हे कार्ड काढा"
                  >
                    ×
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onBackToForm}
          className="text-xs font-bold text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors shrink-0 cursor-pointer"
        >
          ← फॉर्म संपादित करा
        </button>
      </div>

      {/* 2. MAIN CARD PREVIEW & ACTIONS BOX */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200/90 p-4 sm:p-6 space-y-4">
        
        {/* ONE CLEAN UNIFIED TOOLBAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
          
          {/* Controls Group */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle (Front / Back / Both) */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setViewMode('front')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'front' ? 'bg-[#0e4e96] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Front
              </button>
              <button
                type="button"
                onClick={() => setViewMode('back')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'back' ? 'bg-[#0e4e96] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setViewMode('both')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'both' ? 'bg-[#0e4e96] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Both
              </button>
            </div>

            {/* Crop Button (Placed in Photo Fit position) */}
            <button
              type="button"
              onClick={onOpenCrop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              title="फोटो क्रॉप व ॲडजस्ट करा"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-700" />
              <span>क्रॉप ॲडजस्ट</span>
            </button>

            {/* Layout Toggle (if > 1 card) */}
            {cards.length > 1 && (
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPrintLayoutMode('all-on-one-page')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    printLayoutMode === 'all-on-one-page'
                      ? 'bg-[#0e4e96] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>सर्व {cards.length} कार्डे (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintLayoutMode('single')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    printLayoutMode === 'single'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  १ कार्ड
                </button>
              </div>
            )}
          </div>

          {/* Primary Action Buttons: Clean & Prominent */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handlePrint(printLayoutMode, 'a4')}
              disabled={isPrinting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60 shrink-0"
              title="A4 प्रिंट काढा (Ctrl + P)"
            >
              <Printer className="w-4 h-4 text-blue-100" />
              <span>प्रिंट</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadPdf(printLayoutMode, 'a4')}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60 shrink-0"
              title="HD PDF डाऊनलोड करा (Ctrl + D)"
            >
              <Download className="w-4 h-4 text-emerald-100" />
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJpg}
              disabled={isExportingJpg}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60 shrink-0"
              title="HD JPG फोटो डाऊनलोड करा"
            >
              <ImageIcon className="w-4 h-4 text-purple-100" />
              <span>JPG</span>
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

        {/* Sub Info Line */}
        <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
          <span className="truncate">
            शेतकरी ({activeCardIndex + 1}/{cards.length}): <strong>{currentCard.fullNameMr || currentCard.fullNameEn || currentCard.farmerId || 'Farmer'}</strong>
          </span>
          <span>PVC आकार: <strong>85.6 mm × 54 mm (CR80)</strong></span>
        </div>

        {/* VISUAL CARD PREVIEW */}
        {printLayoutMode === 'all-on-one-page' && cards.length > 1 ? (
          /* Multi-Card on 1 A4 Page layout */
          <div className="flex flex-col items-center gap-4 p-4 sm:p-6 bg-slate-50/90 rounded-2xl border border-gray-200/80">
            {cards.map((c, idx) => (
              <div key={c.id || idx} className="flex flex-col md:flex-row items-center gap-3">
                <span className="text-xs font-bold text-gray-500 w-12 text-center md:text-right">#{idx + 1}</span>
                <div
                  className="w-[300px] sm:w-[350px] md:w-[380px] rounded-lg overflow-hidden shadow-sm border border-gray-300 bg-white"
                  style={{ aspectRatio: '85.6 / 54' }}
                >
                  <FarmerIdCardFront card={c} isPrintMode={false} photoFitMode={photoFitMode} />
                </div>
                <div
                  className="w-[300px] sm:w-[350px] md:w-[380px] rounded-lg overflow-hidden shadow-sm border border-gray-300 bg-white"
                  style={{ aspectRatio: '85.6 / 54' }}
                >
                  <FarmerIdCardBack card={c} isPrintMode={false} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Single Active Card Screen Preview */
          <div className="w-full flex justify-center overflow-x-auto py-2">
            {viewMode === 'both' ? (
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 p-4 sm:p-6 bg-slate-50/90 rounded-2xl border border-gray-200/80">
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Front Side (85.6 mm × 54 mm)
                  </span>
                  <div
                    id="modal-farmer-front"
                    className="w-[310px] sm:w-[360px] md:w-[390px] rounded-lg overflow-hidden shadow-md border border-gray-300 bg-white"
                    style={{ aspectRatio: '85.6 / 54' }}
                  >
                    <FarmerIdCardFront card={currentCard} isPrintMode={false} photoFitMode={photoFitMode} />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Back Side (85.6 mm × 54 mm)
                  </span>
                  <div
                    id="modal-farmer-back"
                    className="w-[310px] sm:w-[360px] md:w-[390px] rounded-lg overflow-hidden shadow-md border border-gray-300 bg-white"
                    style={{ aspectRatio: '85.6 / 54' }}
                  >
                    <FarmerIdCardBack card={currentCard} isPrintMode={false} />
                  </div>
                </div>
              </div>
            ) : viewMode === 'front' ? (
              <div className="flex flex-col items-center gap-1.5 p-4 sm:p-6 bg-slate-50/90 rounded-2xl border border-gray-200/80">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Front Side (85.6 mm × 54 mm)
                </span>
                <div
                  id="modal-farmer-front"
                  className="w-[320px] sm:w-[380px] md:w-[420px] rounded-lg overflow-hidden shadow-md border border-gray-300 bg-white"
                  style={{ aspectRatio: '85.6 / 54' }}
                >
                  <FarmerIdCardFront card={currentCard} isPrintMode={false} photoFitMode={photoFitMode} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 p-4 sm:p-6 bg-slate-50/90 rounded-2xl border border-gray-200/80">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Back Side (85.6 mm × 54 mm)
                </span>
                <div
                  id="modal-farmer-back"
                  className="w-[320px] sm:w-[380px] md:w-[420px] rounded-lg overflow-hidden shadow-md border border-gray-300 bg-white"
                  style={{ aspectRatio: '85.6 / 54' }}
                >
                  <FarmerIdCardBack card={currentCard} isPrintMode={false} />
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

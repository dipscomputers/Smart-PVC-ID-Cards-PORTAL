import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  CheckCircle, 
  Loader2, 
  CreditCard, 
  AlertCircle, 
  Layers,
  Image,
  FlipHorizontal,
  Scissors,
  FileCheck
} from 'lucide-react';
import { FarmerFormData } from '../types/form';
import { AgriRecordCard } from './AgriRecordCard';
import { MultiFarmerA4PrintSheet } from './MultiFarmerA4PrintSheet';
import { printComponent } from '../utils/printHelper';
import { downloadMultiFarmerA4Pdf, downloadA4SheetAsPng } from '../utils/a4PdfGenerator';

import { safeHtml2Canvas } from '../utils/safeHtml2Canvas';

interface PdfPreviewModalProps {
  data: FarmerFormData;
  farmers?: FarmerFormData[];
  isOpen: boolean;
  onClose: () => void;
  onPhotoChange?: (newPhotoUrl: string) => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ 
  data, 
  farmers,
  isOpen, 
  onClose, 
  onPhotoChange,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [userNotification, setUserNotification] = useState<{ text: string; isError?: boolean } | null>(null);
  const [cardViewMode, setCardViewMode] = useState<'front' | 'back' | 'both'>('front');
  const [downloadType, setDownloadType] = useState<'a4-sheet' | 'a4-multi-sheet' | 'pvc-card'>('a4-multi-sheet');

  // Professional PVC Print Settings for CSC / Cyber Cafe operators
  const [isMirrorPrint, setIsMirrorPrint] = useState(false);
  const [showCropMarks, setShowCropMarks] = useState(false);
  const [showHeader, setShowHeader] = useState(true);

  const farmerList = farmers && farmers.length > 0 ? farmers : [data];

  useEffect(() => {
    if (isOpen) {
      setCardViewMode('front');
      setUserNotification(null);
      // Auto-select 5-PVC multi-card layout matching user's screenshot
      setDownloadType('a4-multi-sheet');
    }
  }, [isOpen, farmerList.length]);

  if (!isOpen) return null;

  // Real native browser printing on A4 sheet
  const handlePrint = async () => {
    setIsPrinting(true);
    setUserNotification(null);

    try {
      if (downloadType === 'a4-multi-sheet') {
        const title = `Farmer_ID_Cards_A4_5PVC_Sheet_${farmerList.length}_Cards`;
        const ok = await printComponent('printable-multi-farmer-a4-sheet', title);
        if (!ok) {
          setUserNotification({ text: 'A4 मल्टी-कार्ड PDF तयार केली जात आहे...' });
          await handleDownloadPdf('a4-multi-sheet');
        }
      } else {
        const title = `Agri_Record_Card_${(data.fullNameEn || data.fullNameMr || 'Farmer').replace(/\s+/g, '_')}`;
        const ok = await printComponent('printable-a4-cards-sheet', title);
        if (!ok) {
          setUserNotification({ text: 'A4 शीट PDF डाऊनलोड केली जात आहे...' });
          await handleDownloadPdf('a4-sheet');
        }
      }
    } catch (err) {
      console.warn('Print error fallback:', err);
      setUserNotification({ text: 'थेट PDF डाउनलोड केली जात आहे...' });
      await handleDownloadPdf(downloadType);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadPdf = async (typeOverride?: 'pvc-card' | 'a4-sheet' | 'a4-multi-sheet') => {
    setIsGeneratingPdf(true);
    setDownloadSuccess(false);

    try {
      const mode = typeOverride || downloadType;

      if (mode === 'a4-multi-sheet') {
        await downloadMultiFarmerA4Pdf(farmerList);
      } else if (mode === 'pvc-card') {
        const { default: jsPDF } = await import('jspdf');

        const frontEl =
          document.getElementById('export-card-front') ||
          document.getElementById('sheet-card-front-print') ||
          document.getElementById('printable-card-front') ||
          document.querySelector('#farmer-id-card');

        const backEl =
          document.getElementById('export-card-back') ||
          document.getElementById('sheet-card-back-print') ||
          document.getElementById('printable-card-back') ||
          document.querySelector('#farmer-id-card-back');

        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: [85.6, 54],
        });

        if (frontEl) {
          const frontCanvas = await safeHtml2Canvas(frontEl as HTMLElement, { scale: 3.0, backgroundColor: '#ffffff' });
          const frontImg = frontCanvas.toDataURL('image/jpeg', 0.98);
          pdf.addImage(frontImg, 'JPEG', 0, 0, 85.6, 54);
        }

        if (backEl) {
          pdf.addPage([85.6, 54], 'landscape');
          const backCanvas = await safeHtml2Canvas(backEl as HTMLElement, {
            scale: 3.0,
            backgroundColor: '#edf6ee',
          });
          const backImg = backCanvas.toDataURL('image/jpeg', 0.98);
          pdf.addImage(backImg, 'JPEG', 0, 0, 85.6, 54);
        }

        const filename = `Farmer_ID_Card_PVC_${(data.fullNameEn || data.fullNameMr || 'Farmer').replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_')}.pdf`;
        pdf.save(filename);
      } else {
        const { default: jsPDF } = await import('jspdf');

        const frontEl =
          document.getElementById('export-card-front') ||
          document.getElementById('sheet-card-front-print') ||
          document.getElementById('printable-card-front') ||
          document.querySelector('#farmer-id-card');

        const backEl =
          document.getElementById('export-card-back') ||
          document.getElementById('sheet-card-back-print') ||
          document.getElementById('printable-card-back') ||
          document.querySelector('#farmer-id-card-back');

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true,
        });

        const cardW = 85.6;
        const cardH = 54.0;
        const topMargin = 10.0;
        const gap = 2.0;
        const leftMargin = (210 - (cardW * 2 + gap)) / 2;

        if (frontEl) {
          const frontCanvas = await safeHtml2Canvas(frontEl as HTMLElement, { scale: 3.0, backgroundColor: '#ffffff' });
          const frontImg = frontCanvas.toDataURL('image/jpeg', 0.98);
          pdf.addImage(frontImg, 'JPEG', leftMargin, topMargin, cardW, cardH);
        }

        if (backEl) {
          const backCanvas = await safeHtml2Canvas(backEl as HTMLElement, {
            scale: 3.0,
            backgroundColor: '#edf6ee',
          });
          const backImg = backCanvas.toDataURL('image/jpeg', 0.98);
          pdf.addImage(backImg, 'JPEG', leftMargin + cardW + gap, topMargin, cardW, cardH);
        }

        const filename = `Farmer_ID_Card_A4_${(data.fullNameEn || data.fullNameMr || 'Farmer').replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_')}.pdf`;
        pdf.save(filename);
      }

      setDownloadSuccess(true);
      setUserNotification({ text: '300 DPI उच्च दर्जाची PDF यशस्वीपणे सेव्ह झाली!' });
      setTimeout(() => setDownloadSuccess(false), 3500);
      setTimeout(() => setUserNotification(null), 4000);
    } catch (err: any) {
      console.error('PDF error:', err);
      setUserNotification({ 
        text: `PDF तयार करताना त्रुटी आली (${err?.message || 'कृपया पुन्हा प्रयत्न करा'}).`, 
        isError: true 
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPng = async () => {
    setIsGeneratingPng(true);
    try {
      const targetId = downloadType === 'a4-multi-sheet' ? 'printable-multi-farmer-a4-sheet' : 'printable-a4-cards-sheet';
      const filename = `Farmer_ID_A4_Sheet_${farmerList.length}_Cards.png`;
      await downloadA4SheetAsPng(targetId, filename);
      setUserNotification({ text: 'PNG इमेज यशस्वीपणे डाऊनलोड झाली!' });
      setTimeout(() => setUserNotification(null), 3500);
    } catch (err: any) {
      console.error('PNG error:', err);
    } finally {
      setIsGeneratingPng(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in duration-200 border border-gray-200">
        {/* Modal Header */}
        <div className="bg-[#1e5631] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-yellow-300" />
            <h3 className="font-bold text-base sm:text-lg">
              Agri record • A4 5-PVC शीट लेआउट ({farmerList.length}/5 कार्ड)
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-green-800 rounded-lg transition-colors text-white cursor-pointer ml-1"
            title="बंद करा"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Format Options */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-600 hidden sm:inline">लेआउट:</span>
            <div className="flex items-center bg-gray-200/80 p-0.5 rounded-lg text-xs font-bold">
              {/* Option 1: 5-PVC Sheet Layout matching screenshot */}
              <button
                type="button"
                onClick={() => setDownloadType('a4-multi-sheet')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  downloadType === 'a4-multi-sheet'
                    ? 'bg-white text-emerald-900 shadow-2xs font-black'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="A4 Sheet with all farmers (Up to 5 PVC cards per page, Front & Back)"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
                <span>A4 5-PVC शीट ({farmerList.length}/5 कार्ड)</span>
              </button>

              {/* Option 2: Single farmer on A4 */}
              <button
                type="button"
                onClick={() => setDownloadType('a4-sheet')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  downloadType === 'a4-sheet'
                    ? 'bg-white text-emerald-900 shadow-2xs font-black'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="A4 Sheet with Front & Back of selected farmer"
              >
                A4 (१ शेतकरी)
              </button>

              {/* Option 3: PVC Card */}
              <button
                type="button"
                onClick={() => setDownloadType('pvc-card')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  downloadType === 'pvc-card'
                    ? 'bg-white text-emerald-900 shadow-2xs font-black'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Direct PVC Card Size (85.6 x 54 mm)"
              >
                PVC कार्ड
              </button>
            </div>
          </div>

          {/* Action buttons: REAL PRINT DIALOG + PDF DOWNLOAD + PNG */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Direct Browser Print */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-lg font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-75"
              title="Print directly on A4 printer"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  प्रिंट होत आहे...
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4 text-yellow-300" />
                  Print A4 Sheet
                </>
              )}
            </button>

            {/* 300 DPI PDF Download */}
            <button
              type="button"
              onClick={() => handleDownloadPdf()}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1e5631] hover:bg-[#164325] active:bg-[#12381e] text-white rounded-lg font-bold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-75"
              title="Download 300 DPI A4 PDF"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  तयार होत आहे...
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  डाऊनलोड झाले!
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-emerald-200" />
                  Download PDF (300 DPI)
                </>
              )}
            </button>

            {/* PNG Image Export */}
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isGeneratingPng}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer border border-slate-300"
              title="PNG इमेज स्वरूपात सेव्ह करा"
            >
              <Image className="w-3.5 h-3.5 text-slate-600" />
              <span>PNG</span>
            </button>
          </div>
        </div>

        {/* Special Operator Tools Bar for Cyber Cafes / Print Centers */}
        {downloadType === 'a4-multi-sheet' && (
          <div className="bg-emerald-50/60 border-b border-emerald-100 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-emerald-950 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-700" />
              PVC प्रिंटिंग सेटिंग्ज (Dragon Sheet & Tray):
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Mirror Print Toggle */}
              <button
                type="button"
                onClick={() => setIsMirrorPrint(!isMirrorPrint)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer border ${
                  isMirrorPrint
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                title="Dragon Sheet फ्युझिंगसाठी हॉरिझॉन्टल मिरर करा"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                <span>मिरर प्रिंट {isMirrorPrint ? '(चालू)' : '(बंद)'}</span>
              </button>

              {/* Crop Marks Toggle */}
              <button
                type="button"
                onClick={() => setShowCropMarks(!showCropMarks)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer border ${
                  showCropMarks
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                title="कटिंगसाठी गाईड मार्क्स दाखवा"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>कटिंग गाईड्स</span>
              </button>

              {/* Header Toggle */}
              <button
                type="button"
                onClick={() => setShowHeader(!showHeader)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer border ${
                  showHeader
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                title="A4 5-PVC शीट लेआउट हेडर दाखवा/लपवा"
              >
                <span>शीट हेडर {showHeader ? '✓' : '✗'}</span>
              </button>
            </div>
          </div>
        )}

        {/* User notification if needed */}
        {userNotification && (
          <div className={`px-5 py-2 text-xs font-semibold flex items-center gap-2 ${
            userNotification.isError ? 'bg-red-50 text-red-800 border-b border-red-200' : 'bg-emerald-50 text-emerald-900 border-b border-emerald-200'
          }`}>
            {userNotification.isError ? (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{userNotification.text}</span>
          </div>
        )}

        {/* Preview Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex flex-col items-center">
          <div className="w-full flex flex-col items-center space-y-4">
            {downloadType === 'a4-multi-sheet' ? (
              <div className="w-full flex flex-col items-center">
                <div className="text-center mb-2">
                  <span className="text-xs font-bold text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-2xs">
                    📄 एका A4 पानावर {farmerList.length} शेतकरी परिचय पत्रे (CR80 85.6 × 54.0 mm, Front & Back)
                  </span>
                </div>
                <MultiFarmerA4PrintSheet
                  farmers={farmerList}
                  isResponsivePreview={true}
                  isMirrorPrint={isMirrorPrint}
                  showCropMarks={showCropMarks}
                  showHeader={showHeader}
                />
              </div>
            ) : (
              <AgriRecordCard
                data={data}
                viewMode={cardViewMode}
                onViewModeChange={setCardViewMode}
                onPrint={handlePrint}
                onPhotoChange={onPhotoChange}
                hideActionButtons={true}
              />
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-5 py-2.5 flex items-center justify-between text-xs text-gray-600 shrink-0">
          <span className="font-medium text-emerald-800">
            ✨ शेती परिचय पत्र (Farmer ID Card) • {downloadType === 'a4-multi-sheet' ? `एका A4 वर ${farmerList.length} कार्डे (Front & Back)` : 'A4 शीट किंवा PVC कार्ड प्रिंटिंगसाठी योग्य'}
          </span>
          <button
            onClick={onClose}
            className="text-green-800 hover:text-green-950 font-semibold cursor-pointer underline"
          >
            फॉर्मवर परत जा
          </button>
        </div>
      </div>

      {/* Dedicated Offscreen Printable Container for Multi-Farmer A4 Sheet */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '300vw',
          zIndex: -9999,
          pointerEvents: 'none',
        }}
      >
        <MultiFarmerA4PrintSheet
          farmers={farmerList}
          id="printable-multi-farmer-a4-sheet"
          isMirrorPrint={isMirrorPrint}
          showCropMarks={showCropMarks}
          showHeader={showHeader}
        />
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { 
  Printer, 
  Download, 
  Sparkles, 
  Layers, 
  Palette, 
  Languages, 
  Eye, 
  Check, 
  Sliders, 
  Users, 
  Plus, 
  Trash2, 
  FileText, 
  ShieldCheck, 
  QrCode, 
  CreditCard, 
  RotateCw, 
  FileDown, 
  Image as ImageIcon,
  CheckCircle2,
  Upload,
  RefreshCw,
  Info,
  Crop
} from 'lucide-react';
import { FarmerFormData } from '../types/form';
import { 
  CardTemplateId, 
  CardThemeId, 
  CardLanguage, 
  CardViewMode, 
  PrintLayoutMode, 
  CardCustomizationOptions, 
  defaultCardOptions 
} from '../types/cardOptions';
import { FarmerCard } from './FarmerCardDesigns';
import { MultiCardsPrintSheet } from './MultiCardsPrintSheet';
import { FarmerVerificationModal } from './FarmerVerificationModal';
import { safeHtml2Canvas } from '../utils/safeHtml2Canvas';
import { sampleMultiFarmersList } from '../utils/multiFarmerSamples';
import { printComponent } from '../utils/printHelper';
import { PhotoCropModal } from './PhotoCropModal';

interface FarmerMultiOptionsStudioProps {
  formData: FarmerFormData;
  onUpdateFormData: (fields: Partial<FarmerFormData>) => void;
  onOpenApplicationForm?: () => void;
}

export const FarmerMultiOptionsStudio: React.FC<FarmerMultiOptionsStudioProps> = ({
  formData,
  onUpdateFormData,
  onOpenApplicationForm,
}) => {
  // Studio sub-tab
  const [studioTab, setStudioTab] = useState<'card-designer' | 'batch-print' | 'farmers-list'>('card-designer');

  // Customization options state
  const [options, setOptions] = useState<CardCustomizationOptions>(defaultCardOptions);

  // Farmers list for batch printing & multi-card management
  const [farmersList, setFarmersList] = useState<FarmerFormData[]>(() => {
    return [formData, ...sampleMultiFarmersList.slice(1)];
  });
  const [activeFarmerIndex, setActiveFarmerIndex] = useState<number>(0);

  // Modals & previews
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isPhotoCropModalOpen, setIsPhotoCropModalOpen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentFarmer = farmersList[activeFarmerIndex] || formData;

  // Handle updates to options
  const updateOption = <K extends keyof CardCustomizationOptions>(
    key: K,
    value: CardCustomizationOptions[K]
  ) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  // Handle active farmer update
  const handleFarmerChange = (fields: Partial<FarmerFormData>) => {
    onUpdateFormData(fields);
    setFarmersList((prev) => {
      const next = [...prev];
      if (next[activeFarmerIndex]) {
        next[activeFarmerIndex] = { ...next[activeFarmerIndex], ...fields };
      }
      return next;
    });
  };

  // Switch active farmer
  const selectFarmer = (index: number) => {
    setActiveFarmerIndex(index);
    if (farmersList[index]) {
      onUpdateFormData(farmersList[index]);
    }
  };

  // Add new blank farmer
  const handleAddNewFarmer = () => {
    const newId = `MH-AGRI-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const newFarmer: FarmerFormData = {
      ...formData,
      fullNameEn: 'NEW FARMER NAME',
      fullNameMr: 'नवीन शेतकरी',
      farmerId: `803 ${Math.floor(10 + Math.random() * 89)} ${Math.floor(10 + Math.random() * 89)} ${Math.floor(10 + Math.random() * 89)} ${Math.floor(10 + Math.random() * 89)}`,
      aadhaarNumber: '9420 0000 0000',
      applicationNo: newId,
    };
    setFarmersList((prev) => [...prev, newFarmer]);
    setActiveFarmerIndex(farmersList.length);
    onUpdateFormData(newFarmer);
  };

  // Remove farmer from list
  const handleRemoveFarmer = (index: number) => {
    if (farmersList.length <= 1) return;
    const next = farmersList.filter((_, i) => i !== index);
    setFarmersList(next);
    const newIdx = Math.max(0, index - 1);
    setActiveFarmerIndex(newIdx);
    onUpdateFormData(next[newIdx]);
  };

  // Load all 5 sample farmers
  const handleLoadSampleFarmers = () => {
    setFarmersList([...sampleMultiFarmersList]);
    setActiveFarmerIndex(0);
    onUpdateFormData(sampleMultiFarmersList[0]);
    setExportMessage('५ अधिकृत शेतकरी प्रोफाईल यशस्वीरित्या लोड केली!');
    setTimeout(() => setExportMessage(null), 3000);
  };

  // Direct Browser Print
  const handleDirectPrint = async () => {
    try {
      if (studioTab === 'batch-print') {
        await printComponent('printable-multi-cards-sheet', `Multi_Farmer_ID_Cards`);
      } else {
        await printComponent('printable-studio-sheet', `Farmer_ID_Card_${currentFarmer.fullNameEn || 'Card'}`);
      }
    } catch (err) {
      console.warn('Print error fallback:', err);
      window.print();
    }
  };

  // Download High Res PNG
  const handleDownloadPng = async (side: 'front' | 'back') => {
    setIsExporting(true);
    try {
      const targetId = side === 'front' ? 'studio-card-front' : 'studio-card-back';
      const el = document.getElementById(targetId);
      if (!el) {
        throw new Error('Element not found');
      }

      const canvas = await safeHtml2Canvas(el, {
        scale: 3,
        backgroundColor: '#ffffff',
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `Farmer_ID_${currentFarmer.fullNameEn?.replace(/\s+/g, '_')}_${side}.png`;
      link.href = dataUrl;
      link.click();
      setExportMessage(`${side === 'front' ? 'पुढील' : 'मागील'} बाजू PNG डाऊनलोड झाली!`);
      setTimeout(() => setExportMessage(null), 3000);
    } catch (err) {
      console.error('PNG Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Download CR80 PVC Single Card PDF
  const handleDownloadPvcPdf = async () => {
    setIsExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');

      const frontEl = document.getElementById('studio-card-front') || document.getElementById('sheet-card-front-print');
      const backEl = document.getElementById('studio-card-back') || document.getElementById('sheet-card-back-print');

      if (!frontEl) throw new Error('Front card element not found');

      // Standard CR80 PVC card size: 85.6 mm x 54 mm
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 54],
      });

      const frontCanvas = await safeHtml2Canvas(frontEl, { scale: 3.125 });
      pdf.addImage(frontCanvas.toDataURL('image/jpeg', 0.98), 'JPEG', 0, 0, 85.6, 54);

      if (backEl) {
        pdf.addPage([85.6, 54], 'landscape');
        const backCanvas = await safeHtml2Canvas(backEl, { scale: 3.125 });
        pdf.addImage(backCanvas.toDataURL('image/jpeg', 0.98), 'JPEG', 0, 0, 85.6, 54);
      }

      pdf.save(`PVC_Farmer_ID_${currentFarmer.fullNameEn?.replace(/\s+/g, '_')}.pdf`);
      setExportMessage('CR80 PVC कार्ड PDF डाऊनलोड यशस्वी!');
      setTimeout(() => setExportMessage(null), 3000);
    } catch (err) {
      console.error('PVC PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Download A4 Print Sheet PDF
  const handleDownloadA4Pdf = async () => {
    setIsExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');

      const targetEl = document.getElementById('printable-multi-cards-sheet') || document.getElementById('printable-studio-sheet');
      if (!targetEl) throw new Error('Sheet element not found');

      const canvas = await safeHtml2Canvas(targetEl, {
        scale: 2.5,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 297);
      pdf.save(`Farmer_ID_A4_Sheet_${options.printLayout}.pdf`);
      setExportMessage('A4 शीट PDF डाऊनलोड यशस्वी!');
      setTimeout(() => setExportMessage(null), 3000);
    } catch (err) {
      console.error('A4 PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Card Templates list metadata
  const cardTemplates = [
    {
      id: 'agri-record' as CardTemplateId,
      name: 'स्मार्ट शेती परिचय पत्र',
      enName: 'Smart Agri Record PVC',
      tag: 'सर्वात लोकप्रिय (Most Popular)',
      color: 'bg-emerald-700',
    },
    {
      id: 'maha-govt' as CardTemplateId,
      name: 'महाराष्ट्र शासन कृषी विभाग',
      enName: 'Govt Agriculture Official ID',
      tag: 'शासकीय सील व अशोक चक्र',
      color: 'bg-orange-700',
    },
    {
      id: 'pm-kisan-kcc' as CardTemplateId,
      name: 'पीएम-किसान व किसान क्रेडिट कार्ड',
      enName: 'PM-Kisan & KCC Identity',
      tag: 'DBT व बँक लिंक्ड',
      color: 'bg-blue-800',
    },
    {
      id: 'organic-farmer' as CardTemplateId,
      name: 'सेंद्रिय व जैविक शेतकरी कार्ड',
      enName: 'Organic Certified Farmer',
      tag: 'जैविक भारत NPOP',
      color: 'bg-green-800',
    },
    {
      id: 'apmc-vertical' as CardTemplateId,
      name: 'APMC कृषी उत्पन्न बाजार समिती पास',
      enName: 'Mandi Gate Entry Pass (Vertical)',
      tag: 'गळ्यात अडकवणारे बॅज (Lanyard)',
      color: 'bg-emerald-900',
    },
    {
      id: 'modern-gold-chip' as CardTemplateId,
      name: 'मॉडर्न डिजिटल गोल्ड चिप कार्ड',
      enName: 'Modern Gold Microchip PVC',
      tag: 'हाय-सिक्युरिटी चिप',
      color: 'bg-slate-900',
    },
  ];

  // Color themes list
  const colorThemes: { id: CardThemeId; name: string; hex: string }[] = [
    { id: 'emerald', name: 'कृषी हिरवा', hex: '#1e5631' },
    { id: 'tricolor', name: 'महाराष्ट्र केशरी', hex: '#c2410c' },
    { id: 'navy', name: 'रॉयल नेव्ही ब्लू', hex: '#1e3a8a' },
    { id: 'forest', name: 'खोल वन सुवर्ण', hex: '#064e3b' },
    { id: 'amber', name: 'माती व सोनेरी', hex: '#78350f' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. TOP HEADER & MULTI-OPTION NAVIGATION TABS */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                ★ MULTI-OPTION FARMER ID STUDIO
              </span>
              <span className="text-xs font-bold text-gray-500 font-mono">
                CR80 PVC • 85.6mm x 54mm
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1 flex items-center gap-2.5">
              <CreditCard className="w-7 h-7 text-emerald-700" />
              शेतकरी ओळखपत्र मल्टि-पर्याय केंद्र (Multi-Options)
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              ६ आकर्षक डिझाईन पर्याय, ५-कार्ड PVC ट्रे लेआउट, डायनॅमिक QR कोड व एका क्लिकवर ३०० DPI प्रिंट!
            </p>
          </div>

          {/* Quick Actions (Print & Export) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsVerificationModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-black transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-emerald-700" />
              <span>पडताळणी तपासा</span>
            </button>

            <button
              onClick={handleDirectPrint}
              className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-700/25 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Printer className="w-4 h-4" />
              <span>थेट प्रिंट काढा (Print)</span>
            </button>

            <button
              onClick={handleDownloadPvcPdf}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-black shadow-sm transition-colors cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-emerald-400" />
              <span>PVC PDF</span>
            </button>
          </div>
        </div>

        {/* Studio Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 pt-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setStudioTab('card-designer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
              studioTab === 'card-designer'
                ? 'bg-[#1e473d] text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>१. कार्ड डिझाईन व पर्याय (Card Designer & Options)</span>
          </button>

          <button
            onClick={() => setStudioTab('batch-print')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
              studioTab === 'batch-print'
                ? 'bg-[#1e473d] text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>२. मल्टि-कार्ड A4 प्रिंट शीट (PVC Tray / Bulk Sheet)</span>
          </button>

          <button
            onClick={() => setStudioTab('farmers-list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
              studioTab === 'farmers-list'
                ? 'bg-[#1e473d] text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>३. शेतकरी प्रोफाईल यादी ({farmersList.length} Farmers)</span>
          </button>
        </div>

        {/* Success / Alert Banner */}
        {exportMessage && (
          <div className="mt-3 p-3 bg-emerald-100/90 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{exportMessage}</span>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* TAB 1: CARD DESIGNER & MULTI-OPTIONS                         */}
      {/* ============================================================ */}
      {studioTab === 'card-designer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 7 COLS: LIVE CARD PREVIEW STAGE */}
          <div className="lg:col-span-7 space-y-4">
            {/* View Mode Bar */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                <Eye className="w-4 h-4 text-emerald-700" />
                <span>कार्ड दृश्य (View):</span>
              </div>

              {/* View options pills */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => updateOption('viewMode', 'both')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    options.viewMode === 'both' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  दोन्ही बाजू (Front & Back)
                </button>
                <button
                  onClick={() => updateOption('viewMode', 'front')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    options.viewMode === 'front' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  फक्त पुढील (Front)
                </button>
                <button
                  onClick={() => updateOption('viewMode', 'back')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    options.viewMode === 'back' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  फक्त मागील (Back)
                </button>
                <button
                  onClick={() => updateOption('viewMode', 'flip3d')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    options.viewMode === 'flip3d' ? 'bg-emerald-700 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  3D फ्लिप (Flip)
                </button>
              </div>

              {/* Active Farmer Indicator */}
              <div className="text-[11px] font-mono text-gray-500">
                शेतकरी: <span className="font-bold text-gray-800">{currentFarmer.fullNameEn?.split(' ')[0] || 'DIPAK'}</span>
              </div>
            </div>

            {/* LIVE CARD DISPLAY CANVAS */}
            <div className="bg-slate-100/90 rounded-2xl border border-slate-200 p-5 sm:p-8 flex flex-col items-center justify-center min-h-[460px] overflow-hidden shadow-inner relative">
              {/* Scale container to keep standard 600px width responsive */}
              <div className="w-full flex flex-col items-center justify-center space-y-6">
                {/* 3D Interactive Flip Mode */}
                {options.viewMode === 'flip3d' ? (
                  <div className="flex flex-col items-center space-y-3">
                    <div
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="cursor-pointer perspective-[1000px] transition-transform duration-300 hover:scale-[1.02]"
                    >
                      <div
                        className={`transition-all duration-500 transform-gpu ${
                          isFlipped ? 'rotate-y-180' : ''
                        }`}
                      >
                        {!isFlipped ? (
                          <div className="scale-[0.8] sm:scale-100 origin-center">
                            <FarmerCard
                              id="studio-card-front"
                              data={currentFarmer}
                              template={options.template}
                              theme={options.theme}
                              language={options.language}
                              options={options}
                              side="front"
                              onPhotoClick={() => setIsPhotoCropModalOpen(true)}
                              onQrClick={() => setIsVerificationModalOpen(true)}
                            />
                          </div>
                        ) : (
                          <div className="scale-[0.8] sm:scale-100 origin-center">
                            <FarmerCard
                              id="studio-card-back"
                              data={currentFarmer}
                              template={options.template}
                              theme={options.theme}
                              language={options.language}
                              options={options}
                              side="back"
                              onQrClick={() => setIsVerificationModalOpen(true)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white text-gray-800 rounded-full text-xs font-bold border border-gray-300 shadow-xs cursor-pointer hover:bg-gray-50"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{isFlipped ? 'पुढील बाजू पहा (Show Front)' : 'मागील बाजू पहा (Show Back)'}</span>
                    </button>
                  </div>
                ) : (
                  /* Standard Views (Both, Front, or Back) */
                  <div className="w-full flex flex-col items-center space-y-6">
                    {/* Front Card */}
                    {(options.viewMode === 'both' || options.viewMode === 'front') && (
                      <div className="flex flex-col items-center w-full">
                        <div className="w-full flex items-center justify-between text-xs font-bold text-gray-500 mb-1.5 max-w-[600px] px-1">
                          <span className="flex items-center gap-1 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" /> पुढील बाजू (FRONT SIDE)
                          </span>
                          <button
                            onClick={() => handleDownloadPng('front')}
                            className="text-[11px] text-gray-600 hover:text-emerald-700 font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <ImageIcon className="w-3 h-3" /> Save Front PNG
                          </button>
                        </div>
                        <div className="scale-[0.78] sm:scale-100 origin-center">
                          <FarmerCard
                            id="studio-card-front"
                            data={currentFarmer}
                            template={options.template}
                            theme={options.theme}
                            language={options.language}
                            options={options}
                            side="front"
                            onPhotoClick={() => setIsPhotoCropModalOpen(true)}
                            onQrClick={() => setIsVerificationModalOpen(true)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Back Card */}
                    {(options.viewMode === 'both' || options.viewMode === 'back') && (
                      <div className="flex flex-col items-center w-full">
                        <div className="w-full flex items-center justify-between text-xs font-bold text-gray-500 mb-1.5 max-w-[600px] px-1">
                          <span className="flex items-center gap-1 text-blue-900">
                            <CheckCircle2 className="w-3.5 h-3.5" /> मागील बाजू (BACK SIDE)
                          </span>
                          <button
                            onClick={() => handleDownloadPng('back')}
                            className="text-[11px] text-gray-600 hover:text-emerald-700 font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <ImageIcon className="w-3 h-3" /> Save Back PNG
                          </button>
                        </div>
                        <div className="scale-[0.78] sm:scale-100 origin-center">
                          <FarmerCard
                            id="studio-card-back"
                            data={currentFarmer}
                            template={options.template}
                            theme={options.theme}
                            language={options.language}
                            options={options}
                            side="back"
                            onQrClick={() => setIsVerificationModalOpen(true)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Export Bar below Card */}
            <div className="bg-white rounded-xl p-3 border border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-gray-500 font-medium">
                सर्व कार्डे स्टँडर्ड CR80 PVC आकार (85.6mm x 54mm) व 300 DPI अनुरूप आहेत.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPng('front')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-gray-800 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Front PNG
                </button>
                <button
                  onClick={() => handleDownloadPng('back')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-gray-800 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Back PNG
                </button>
                <button
                  onClick={handleDownloadPvcPdf}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileDown className="w-3.5 h-3.5" /> PVC PDF
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: CUSTOMIZATION OPTIONS SIDEBAR */}
          <div className="lg:col-span-5 space-y-4">
            {/* OPTION 1: CARD TEMPLATES (6 OPTIONS) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  १. कार्ड डिझाईन पर्याय ({cardTemplates.length} Templates)
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Live Preview
                </span>
              </div>

              <div className="space-y-2">
                {cardTemplates.map((tmpl) => {
                  const isSelected = options.template === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => updateOption('template', tmpl.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-3.5 h-3.5 rounded-full ${tmpl.color} shrink-0`} />
                        <div className="min-w-0">
                          <div className="text-xs font-black text-gray-900 truncate">
                            {tmpl.name}
                          </div>
                          <div className="text-[10px] font-bold text-gray-500">
                            {tmpl.enName}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {isSelected ? (
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            {tmpl.tag}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* OPTION 2: COLOR THEMES & LANGUAGE */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
              <h3 className="font-black text-gray-900 text-sm flex items-center gap-2 pb-2 border-b border-gray-100">
                <Palette className="w-4 h-4 text-emerald-700" />
                २. कलर थीम व भाषा (Theme & Language)
              </h3>

              {/* Color Palettes */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2">
                  रंगसंगती (Color Theme):
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {colorThemes.map((thm) => (
                    <button
                      key={thm.id}
                      onClick={() => updateOption('theme', thm.id)}
                      className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        options.theme === thm.id
                          ? 'border-gray-900 ring-2 ring-gray-900/20 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full shadow-inner mb-1 border border-white"
                        style={{ backgroundColor: thm.hex }}
                      />
                      <span className="text-[9px] font-bold text-gray-800 truncate w-full">
                        {thm.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Switcher */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2">
                  भाषा पर्याय (Language):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => updateOption('language', 'mr')}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                      options.language === 'mr'
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    मराठी + English
                  </button>
                  <button
                    onClick={() => updateOption('language', 'hi')}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                      options.language === 'hi'
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    हिंदी + English
                  </button>
                  <button
                    onClick={() => updateOption('language', 'en')}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                      options.language === 'en'
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    English Only
                  </button>
                </div>
              </div>
            </div>

            {/* OPTION 3: FEATURE & ELEMENT TOGGLES */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-3">
              <h3 className="font-black text-gray-900 text-sm flex items-center gap-2 pb-2 border-b border-gray-100">
                <Sliders className="w-4 h-4 text-emerald-700" />
                ३. घटकांची निवड व सुरक्षा नियंत्रणे (Elements Toggle)
              </h3>

              <div className="space-y-2 text-xs">
                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <span className="font-bold text-gray-800">शासकीय सील व शिक्का (Govt Krishi Seal)</span>
                  <input
                    type="checkbox"
                    checked={options.showGovtSeal}
                    onChange={(e) => updateOption('showGovtSeal', e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <span className="font-bold text-gray-800">सुरक्षा होलोग्राम बॅज (Security Hologram)</span>
                  <input
                    type="checkbox"
                    checked={options.showHologram}
                    onChange={(e) => updateOption('showHologram', e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <span className="font-bold text-gray-800">डायनॅमिक QR कोड (Interactive QR Code)</span>
                  <input
                    type="checkbox"
                    checked={options.showQrCode}
                    onChange={(e) => updateOption('showQrCode', e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <span className="font-bold text-gray-800">शेतकरी बारकोड (UID Barcode)</span>
                  <input
                    type="checkbox"
                    checked={options.showBarcode}
                    onChange={(e) => updateOption('showBarcode', e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <span className="font-bold text-gray-800">जमीन व गट क्रमांक (Land Details & Gat No.)</span>
                  <input
                    type="checkbox"
                    checked={options.showLandDetails}
                    onChange={(e) => updateOption('showLandDetails', e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* OPTION 4: QUICK FIELD EDITOR */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  ४. त्वरित माहिती संपादन (Quick Edit Details)
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3 h-3" /> फोटो अपलोड
                  </button>
                  <button
                    onClick={() => setIsPhotoCropModalOpen(true)}
                    className="text-xs font-bold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-md border border-gray-200 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Crop className="w-3 h-3 text-emerald-700" /> क्रॉप
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-gray-600 block mb-1">शेतकऱ्याचे नाव (मराठी):</label>
                  <input
                    type="text"
                    value={currentFarmer.fullNameMr || ''}
                    onChange={(e) => handleFarmerChange({ fullNameMr: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-gray-300 rounded-lg font-bold text-gray-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-600 block mb-1">Name (English):</label>
                  <input
                    type="text"
                    value={currentFarmer.fullNameEn || ''}
                    onChange={(e) => handleFarmerChange({ fullNameEn: e.target.value.toUpperCase() })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-gray-300 rounded-lg font-bold text-gray-900 focus:bg-white uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-600 block mb-1">शेतकरी आयडी (Farmer ID):</label>
                  <input
                    type="text"
                    value={currentFarmer.farmerId || ''}
                    onChange={(e) => handleFarmerChange({ farmerId: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-gray-300 rounded-lg font-mono font-bold text-gray-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-600 block mb-1">मोबाईल (Mobile):</label>
                  <input
                    type="text"
                    value={currentFarmer.whatsappNumber || ''}
                    onChange={(e) => handleFarmerChange({ whatsappNumber: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-gray-300 rounded-lg font-mono font-bold text-gray-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-600 block mb-1">गाव (Village):</label>
                  <input
                    type="text"
                    value={currentFarmer.villageEn || currentFarmer.villageMr || ''}
                    onChange={(e) => handleFarmerChange({ villageEn: e.target.value, villageMr: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-gray-300 rounded-lg font-bold text-gray-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-600 block mb-1">गट क्र. (Gat No.):</label>
                  <input
                    type="text"
                    value={currentFarmer.lands?.[0]?.gatNo || ''}
                    onChange={(e) => {
                      const lands = [...(currentFarmer.lands || [])];
                      if (lands[0]) {
                        lands[0].gatNo = e.target.value;
                      } else {
                        lands.push({ id: 'l1', district: '', taluka: '', village: '', gatNo: e.target.value, khateNo: '', areaHaR: '1.06' });
                      }
                      handleFarmerChange({ lands });
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-gray-300 rounded-lg font-mono font-bold text-gray-900 focus:bg-white"
                  />
                </div>
              </div>

              {onOpenApplicationForm && (
                <div className="pt-2 text-right">
                  <button
                    onClick={onOpenApplicationForm}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-900 underline cursor-pointer"
                  >
                    संपूर्ण नोंदणी अर्ज व ७/१२ भरा →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: MULTI-CARD BATCH & A4 PVC TRAY PRINT                  */}
      {/* ============================================================ */}
      {studioTab === 'batch-print' && (
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 space-y-6">
          {/* Top Options Bar for Printing */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200 gap-4">
            <div>
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-700" />
                मल्टि-कार्ड A4 प्रिंट शीट पर्याय (Multi-Card Layout Options)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                एका A4 पानावर १ कार्ड, ५-कार्ड PVC ट्रे किंवा ८-कार्ड लॅमिनेशन शीट मुद्रित करा.
              </p>
            </div>

            {/* Layout Mode Switcher */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => updateOption('printLayout', 'single-a4')}
                className={`px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  options.printLayout === 'single-a4'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                १ कार्ड (Front + Back)
              </button>
              <button
                onClick={() => updateOption('printLayout', 'pvc-tray-5')}
                className={`px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  options.printLayout === 'pvc-tray-5'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                ५ कार्ड ट्रे (Epson PVC Tray)
              </button>
              <button
                onClick={() => updateOption('printLayout', 'sheet-8')}
                className={`px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  options.printLayout === 'sheet-8'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                ८ कार्ड शीट (A4 Sheet)
              </button>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
              <Info className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                निवडलेला लेआउट: {options.printLayout === 'single-a4' ? '१ कार्ड (Front & Back Top Center - 2mm gap)' : options.printLayout === 'pvc-tray-5' ? '५ शेतकरी PVC ट्रे (Epson L805/Canon)' : '८ शेतकरी A4 लॅमिनेशन शीट'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadSampleFarmers}
                className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                <span>५ नमुना शेतकरी भरा (Load 5 Farmers)</span>
              </button>

              <button
                onClick={handleDownloadA4Pdf}
                className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>A4 PDF डाऊनलोड</span>
              </button>

              <button
                onClick={handleDirectPrint}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>प्रिंट काढा (Print Now)</span>
              </button>
            </div>
          </div>

          {/* Interactive Responsive A4 Sheet Container */}
          <div className="p-4 bg-slate-100 rounded-2xl flex justify-center overflow-x-auto">
            <MultiCardsPrintSheet
              id="printable-multi-cards-sheet"
              layoutMode={options.printLayout}
              currentFarmer={currentFarmer}
              farmersList={farmersList}
              template={options.template}
              theme={options.theme}
              language={options.language}
              options={options}
              isResponsivePreview={true}
            />
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: FARMERS LIST & BATCH MANAGEMENT                       */}
      {/* ============================================================ */}
      {studioTab === 'farmers-list' && (
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200 gap-3">
            <div>
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-700" />
                शेतकरी प्रोफाईल यादी (Farmer Batch Profiles)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                एकाच वेळी अनेक शेतकऱ्यांची कार्डे तयार व मुद्रित करा.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadSampleFarmers}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                <span>नमुना डेटा रीसेट</span>
              </button>

              <button
                onClick={handleAddNewFarmer}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>नवा शेतकरी जोडा (Add Farmer)</span>
              </button>
            </div>
          </div>

          {/* Farmers Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">फोटो</th>
                  <th className="p-3">शेतकऱ्याचे नाव</th>
                  <th className="p-3">शेतकरी आयडी</th>
                  <th className="p-3">गाव व जिल्हा</th>
                  <th className="p-3">गट क्र.</th>
                  <th className="p-3 text-right">कृती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {farmersList.map((farmer, idx) => {
                  const isActive = idx === activeFarmerIndex;
                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50 transition-colors ${
                        isActive ? 'bg-emerald-50/70' : ''
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-gray-500">{idx + 1}</td>
                      <td className="p-3">
                        <div className="w-8 h-10 rounded overflow-hidden border border-gray-300 bg-white">
                          {farmer.photoUrl ? (
                            <img src={farmer.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-slate-200 text-[8px] flex items-center justify-center text-gray-400">
                              IMG
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-black text-gray-900">{farmer.fullNameMr || farmer.fullNameEn}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{farmer.fullNameEn}</div>
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-800">
                        {farmer.farmerId || '803 68 73 81 90'}
                      </td>
                      <td className="p-3 text-gray-700">
                        {farmer.villageMr || farmer.villageEn || 'सोमठाणा'}, {farmer.districtMr || farmer.districtEn || 'वाशिम'}
                      </td>
                      <td className="p-3 font-mono font-bold text-gray-900">
                        {farmer.lands?.[0]?.gatNo || '126'}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            selectFarmer(idx);
                            setStudioTab('card-designer');
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                            isActive
                              ? 'bg-emerald-700 text-white'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                          }`}
                        >
                          {isActive ? 'निवडले आहे' : 'हे कार्ड पहा'}
                        </button>
                        {farmersList.length > 1 && (
                          <button
                            onClick={() => handleRemoveFarmer(idx)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            title="काढून टाका"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hidden printable element for direct single card printing */}
      <div id="printable-studio-sheet" className="hidden">
        <MultiCardsPrintSheet
          layoutMode="single-a4"
          currentFarmer={currentFarmer}
          farmersList={farmersList}
          template={options.template}
          theme={options.theme}
          language={options.language}
          options={options}
        />
      </div>

      {/* Hidden File Input for Photo Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const res = ev.target?.result as string;
              if (res) {
                handleFarmerChange({ photoUrl: res });
              }
            };
            reader.readAsDataURL(file);
          }
        }}
      />

      {/* Digital Verification Modal */}
      <FarmerVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        data={currentFarmer}
      />

      {/* Photo Crop Modal */}
      {isPhotoCropModalOpen && (
        <PhotoCropModal
          isOpen={isPhotoCropModalOpen}
          imageSrc={currentFarmer.photoUrl}
          onClose={() => setIsPhotoCropModalOpen(false)}
          onCropComplete={(croppedDataUrl: string) => {
            handleFarmerChange({ photoUrl: croppedDataUrl });
            setIsPhotoCropModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

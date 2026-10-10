import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { FarmerFormData } from '../types/form';
import { formatAreaHaR } from '../utils/formatters';
import { CreditCard, Printer, Crop, Sliders, Download, Loader2, CheckCircle } from 'lucide-react';
import { printComponent } from '../utils/printHelper';
import { FarmerWatermarkSvg } from './FarmerWatermarkSvg';
import { PhotoCropModal } from './PhotoCropModal';
import { A4CardsPrintSheet } from './A4CardsPrintSheet';
import { downloadA4CardPdf } from '../utils/a4PdfGenerator';
import { AGRISTACK_LOGO } from '../assets/agriStackLogo';
import { FARMER_ID_BLANK_TEMPLATE } from '../assets/farmerIdBlankTemplate';

interface AgriRecordCardProps {
  data: FarmerFormData;
  id?: string;
  isPrintMode?: boolean;
  viewMode?: 'front' | 'back' | 'both';
  onViewModeChange?: (mode: 'front' | 'back' | 'both') => void;
  onPrint?: () => void;
  onPhotoChange?: (newPhotoUrl: string) => void;
  hideActionButtons?: boolean;
}

// 1. FRONT SIDE OF THE PVC CARD (Image 1) - CR80 Standard (85.6 mm x 54 mm)
export const AgriRecordCardFront: React.FC<{
  data: FarmerFormData;
  id?: string;
  qrCodeUrl: string;
  isPrintMode?: boolean;
  onPhotoClick?: () => void;
}> = ({ data, id = 'printable-card-front', qrCodeUrl, isPrintMode = false, onPhotoClick }) => {
  // Format DOB (DD/MM/YYYY matching exact sample)
  const formatDob = () => {
    if (data.dobDay && data.dobMonth && data.dobYear) {
      const d = data.dobDay.padStart(2, '0');
      const monthMap: Record<string, string> = {
        January: '01', February: '02', March: '03', April: '04',
        May: '05', June: '06', July: '07', August: '08',
        September: '09', October: '10', November: '11', December: '12',
      };
      const m = monthMap[data.dobMonth] || data.dobMonth.padStart(2, '0');
      const y = data.dobYear;
      return `${d}/${m}/${y}`;
    }
    return '20/08/1993';
  };

  // Format Aadhaar in 4-digit blocks
  const formatAadhaar = () => {
    if (!data.aadhaarNumber || !data.aadhaarNumber.trim()) {
      return '9420 4790 8747';
    }
    const raw = data.aadhaarNumber.replace(/\D/g, '');
    if (raw.length === 12) {
      return `${raw.slice(0, 4)} ${raw.slice(4, 8)} ${raw.slice(8, 12)}`;
    }
    return data.aadhaarNumber.trim();
  };

  // Format Farmer ID (Compact & close digits, e.g. 49488379429 without extra gaps)
  const formatFarmerId = () => {
    const raw = (data.farmerId || '49488379429').trim();
    const digitsOnly = raw.replace(/\D/g, '');
    if (digitsOnly.length === 11) {
      return digitsOnly;
    }
    return raw || '49488379429';
  };

  return (
    <div
      id={id}
      className={`w-[600px] h-[378px] min-w-[600px] min-h-[378px] max-w-[600px] max-h-[378px] rounded-2xl overflow-hidden font-sans select-none relative border border-[#1e5631]/80 ${
        isPrintMode ? 'shadow-none border border-gray-400' : 'shadow-xl'
      }`}
      style={{
        boxSizing: 'border-box',
        aspectRatio: '85.6 / 54',
      }}
    >
      {/* 1. Official Blank Template Background Image (1014x641) */}
      <img
        src={FARMER_ID_BLANK_TEMPLATE}
        alt="Farmer ID Card Template"
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-0"
      />

      {/* 2. Photo (Left Side) - Black 2px Border Exactly Matching User Sample */}
      <div
        className="absolute left-[19px] top-[92px] w-[116px] h-[158px] bg-[#99c8e8] overflow-hidden border-[2px] border-black shadow-xs flex items-center justify-center z-10 group"
        style={{ boxSizing: 'border-box' }}
      >
        {data.photoUrl ? (
          <img
            src={data.photoUrl}
            alt={data.fullNameEn || 'Farmer Photo'}
            crossOrigin="anonymous"
            className="w-full h-full object-cover object-[center_28%]"
            style={{ imageRendering: '-webkit-optimize-contrast' }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-[#99c8e8]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-[#1e5631]/60">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
            <span className="text-[10px] text-[#1e5631] font-bold mt-0.5">फोटो</span>
          </div>
        )}

        {/* Crop & Fit Action Overlay when hovering or clicking on photo */}
        {!isPrintMode && onPhotoClick && (
          <button
            type="button"
            onClick={onPhotoClick}
            className="absolute inset-0 bg-black/40 hover:bg-black/55 text-white flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer no-print backdrop-blur-[0.5px]"
            title="फोटो क्रॉप व ॲडजस्ट करा"
          >
            <Crop className="w-5 h-5 text-yellow-300" />
            <span className="text-[10px] font-bold bg-[#1e5631] px-2 py-0.5 rounded shadow text-white border border-green-300">
              क्रॉप ॲडजस्ट
            </span>
          </button>
        )}
      </div>

      {/* 3. Details (Middle Column) - Vertically Centered with Comfortable Spacing */}
      <div className="absolute left-[150px] top-[104px] right-[128px] z-10 flex flex-col justify-start text-left select-text">
        {/* Row 1: Full Name in Marathi */}
        <div className="flex items-baseline gap-1.5 leading-tight">
          <span className="text-[#084b30] font-black text-[17.5px] shrink-0 whitespace-nowrap">
            नाव :
          </span>
          <span className="text-black font-black text-[18px] tracking-tight truncate leading-tight font-sans">
            {data.fullNameMr || 'दिपक माधव खंदारे'}
          </span>
        </div>

        {/* Row 2: Full Name in English (Dark green uppercase) */}
        <div className="text-[13px] font-black text-[#084b30] uppercase tracking-wider pl-[44px] mt-0.5 mb-3.5 truncate leading-tight font-sans">
          {data.fullNameEn || 'DIPAK MADHAV KHANDARE'}
        </div>

        {/* Row 3: DOB */}
        <div className="flex items-baseline gap-1.5 leading-normal mb-3">
          <span className="text-[#084b30] font-black text-[15px] shrink-0 whitespace-nowrap">
            जन्म दिनांक / DOB :
          </span>
          <span className="text-black font-black text-[15.5px] font-mono whitespace-nowrap">
            {formatDob()}
          </span>
        </div>

        {/* Row 4: Gender */}
        <div className="flex items-baseline gap-1.5 leading-normal mb-3">
          <span className="text-[#084b30] font-black text-[15px] shrink-0 whitespace-nowrap">
            लिंग / Gender :
          </span>
          <span className="text-black font-black text-[15px] whitespace-nowrap">
            {data.gender || 'Male'}
          </span>
        </div>

        {/* Row 5: Mobile */}
        <div className="flex items-baseline gap-1.5 leading-normal mb-3">
          <span className="text-[#084b30] font-black text-[15px] shrink-0 whitespace-nowrap">
            मोबाईल / Mobile :
          </span>
          <span className="text-black font-black text-[15.5px] font-mono whitespace-nowrap">
            {data.whatsappNumber || '9049102035'}
          </span>
        </div>

        {/* Row 6: Aadhaar No */}
        <div className="flex items-baseline gap-1.5 leading-normal">
          <span className="text-[#084b30] font-black text-[15px] shrink-0 whitespace-nowrap">
            आधार नं / Aadhaar No :
          </span>
          <span className="text-black font-black text-[15.5px] font-mono whitespace-nowrap tracking-wide">
            {formatAadhaar()}
          </span>
        </div>
      </div>

      {/* 4. Scannable QR Code on White Container (Right Side) */}
      <div className="absolute right-[16px] top-[124px] w-[106px] h-[106px] bg-white rounded-xl shadow-xs border border-gray-300/80 p-1.5 flex items-center justify-center z-10">
        {qrCodeUrl ? (
          <img
            src={qrCodeUrl}
            alt="Farmer QR Code"
            className="w-[90px] h-[90px] object-contain"
          />
        ) : (
          <div className="w-[90px] h-[90px] bg-gray-50 flex items-center justify-center text-[10px] text-gray-400">
            QR Code
          </div>
        )}
      </div>

      {/* 5. Bottom Footer Farmer ID Number (White) - Sits cleanly after yellow "फार्मर आयडी :" */}
      <div className="absolute bottom-0 left-[298px] h-[56px] flex items-center select-none z-10">
        <span className="text-white font-black text-[24px] font-sans tracking-wide leading-none drop-shadow-xs">
          {formatFarmerId()}
        </span>
      </div>
    </div>
  );
};

// 2. BACK SIDE OF THE PVC CARD
export const AgriRecordCardBack: React.FC<{
  data: FarmerFormData;
  id?: string;
  isPrintMode?: boolean;
}> = ({ data, id = 'printable-card-back', isPrintMode = false }) => {
  // Format Full Address string
  const formatAddress = () => {
    if (data.addressEn && data.addressEn.trim()) {
      return data.addressEn.trim().toUpperCase();
    }
    const parts: string[] = [];
    const village = data.villageEn || (data.lands?.[0]?.village) || 'SOMTHANA';
    const post = data.subDistrictEn || 'MOJAHA';
    const taluka = data.tehsilEn || (data.lands?.[0]?.taluka) || 'MALEGAON';
    const district = data.districtEn || (data.lands?.[0]?.district) || 'WASHIM';

    parts.push(`AT. ${village.toUpperCase()}`);
    parts.push(`POST. ${post.toUpperCase()}`);
    parts.push(`TQ ${taluka.toUpperCase()}`);
    parts.push(`DIST.${district.toUpperCase()}`);

    return parts.join(' ');
  };

  const lands = data.lands && data.lands.length > 0 ? data.lands : [
    {
      id: 'l1',
      district: 'वाशिम',
      taluka: 'मालेगाव',
      village: 'SOMTHANA',
      gatNo: '126',
      khateNo: '',
      areaHaR: '1.06',
    },
  ];

  // Calculate total land area in Hectare.Are
  const totalAreaNum = (lands || []).reduce((acc, land) => {
    const val = parseFloat(land?.areaHaR || '0');
    return acc + (isNaN(val) ? 0 : val);
  }, 0);
  const totalAreaDisplay = totalAreaNum > 0 ? totalAreaNum.toFixed(2) : '0.00';

  return (
    <div
      id={id}
      className={`w-[600px] h-[378px] min-w-[600px] min-h-[378px] max-w-[600px] max-h-[378px] bg-[#edf6ee] rounded-2xl overflow-hidden font-sans select-none flex flex-col justify-between relative p-5 px-6 border border-[#1e5631]/80 ${
        isPrintMode ? 'shadow-none border border-gray-400' : 'shadow-xl'
      }`}
      style={{
        boxSizing: 'border-box',
        aspectRatio: '85.6 / 54',
      }}
    >
      {/* Top-Right Official AgriStack Logo Badge */}
      <div className="absolute right-5 top-3 z-10 flex items-center bg-white/95 px-2.5 py-1 rounded-lg border border-[#1e5631]/30 shadow-xs">
        <img
          src={AGRISTACK_LOGO}
          alt="AgriStack Logo"
          className="h-[28px] w-auto max-w-[110px] object-contain"
        />
      </div>

      <div className="space-y-4 pt-1">
        {/* 1. संपूर्ण पत्ता / Address (Image 2) */}
        <div>
          <h3 className="text-[16px] font-black text-[#1e5631] leading-tight">
            संपूर्ण पत्ता / Address
          </h3>
          <p className="text-[13px] font-bold text-gray-900 tracking-wide uppercase leading-normal mt-1.5 pr-16">
            {formatAddress()}
          </p>
        </div>

        {/* 2. जमिनीची माहिती / Land Details Table (Image 2) */}
        <div>
          <h3 className="text-[16px] font-black text-[#1e5631] leading-tight mb-2">
            जमिनीची माहिती / Land Details
          </h3>

          {/* Clean Land Table */}
          <div className="w-full overflow-hidden">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="text-[#1e5631] font-black border-b border-[#a4cfa4]">
                  <th className="pb-1.5 pr-2 font-black w-[18%]">जिल्हा</th>
                  <th className="pb-1.5 px-2 font-black w-[18%]">तालुका</th>
                  <th className="pb-1.5 px-2 font-black w-[22%]">गाव</th>
                  <th className="pb-1.5 px-2 font-black w-[14%] text-left">गट नं.</th>
                  <th className="pb-1.5 px-2 font-black w-[14%] text-left">खाते नं.</th>
                  <th className="pb-1.5 pl-2 font-black w-[14%] text-right">क्षेत्र हे.आर</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-200/50">
                {lands.slice(0, 4).map((land, idx) => (
                  <tr key={land.id || idx} className="text-gray-900 font-bold leading-tight">
                    <td className="py-2.5 pr-2">{land.district || 'वाशिम'}</td>
                    <td className="py-2.5 px-2">{land.taluka || 'मालेगाव'}</td>
                    <td className="py-2.5 px-2 uppercase">{land.village || 'SOMTHANA'}</td>
                    <td className="py-2.5 px-2 font-mono text-left">{land.gatNo || '126'}</td>
                    <td className="py-2.5 px-2 font-mono text-left">{land.khateNo || ''}</td>
                    <td className="py-2.5 pl-2 font-mono text-right">{formatAreaHaR(land.areaHaR) || '1.06'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. CENTER SUMMARY: एकूण क्षेत्र (Total Area) */}
      <div className="flex-1 flex items-center justify-center py-1">
        <div className="inline-flex items-center gap-2 px-4 py-1 bg-white/90 border border-[#1e5631]/30 rounded-full shadow-2xs">
          <span className="text-[12.5px] font-black text-[#1e5631] tracking-wide">
            एकूण क्षेत्र (Total Area):
          </span>
          <span className="font-mono text-[13.5px] font-black text-gray-900 bg-[#edf6ee] px-2 py-0.5 rounded-md border border-[#1e5631]/20">
            {totalAreaDisplay} हे.आर
          </span>
        </div>
      </div>

      {/* 3. BOTTOM DISCLAIMER: Between 2 double-leaf lines (Image 2) */}
      <div className="pb-1 pt-2 flex items-center justify-center gap-2">
        <div className="flex-1 flex items-center gap-1.5">
          <svg viewBox="0 0 45 22" fill="none" className="w-8 h-4 shrink-0">
            <path d="M5 18C15 8 28 8 36 14C28 20 15 20 5 18Z" fill="#1e5631" />
            <path d="M0 20C10 12 22 12 30 17" fill="#8cb88c" opacity="0.8" />
          </svg>
          <div className="h-[1.5px] bg-[#1e5631]/40 w-full" />
        </div>

        <p className="text-[11.5px] font-bold text-[#1e5631] text-center px-1 shrink-0 whitespace-nowrap">
          हे कार्ड वैयक्तिक वापरासाठी असून, सरकारी ओळखपत्र म्हणून मान्य नाही
        </p>

        <div className="flex-1 flex items-center gap-1.5">
          <div className="h-[1.5px] bg-[#1e5631]/40 w-full" />
          <svg viewBox="0 0 45 22" fill="none" className="w-8 h-4 shrink-0">
            <path d="M40 18C30 8 17 8 9 14C17 20 30 20 40 18Z" fill="#1e5631" />
            <path d="M45 20C35 12 23 12 15 17" fill="#8cb88c" opacity="0.8" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// 3. MAIN COMPONENT: Unified Front & Back with Standard PVC Specs & Direct Print
export const AgriRecordCard: React.FC<AgriRecordCardProps> = ({
  data,
  isPrintMode = false,
  viewMode: controlledViewMode,
  onViewModeChange,
  onPrint,
  onPhotoChange,
  hideActionButtons = false,
}) => {
  const [internalViewMode, setInternalViewMode] = useState<'front' | 'back' | 'both'>('front');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const currentViewMode = controlledViewMode || internalViewMode;

  const handleModeChange = (mode: 'front' | 'back' | 'both') => {
    if (onViewModeChange) {
      onViewModeChange(mode);
    } else {
      setInternalViewMode(mode);
    }
  };

  // Memoize QR payload so QR generation only runs when relevant values change
  const qrPayload = useMemo(() => {
    return JSON.stringify({
      app: 'AgriRecord',
      title: 'शेती परिचय पत्र',
      farmerId: data.farmerId || '803 68 73 81 90',
      nameMr: data.fullNameMr || 'दिपक माधव खंदारे',
      nameEn: data.fullNameEn || 'DIPAK MADHAV KHANDARE',
      gender: data.gender || 'Male',
      mobile: data.whatsappNumber || '9049102035',
      aadhaar: data.aadhaarNumber || '9420 4790 8747',
    });
  }, [
    data.farmerId,
    data.fullNameMr,
    data.fullNameEn,
    data.gender,
    data.whatsappNumber,
    data.aadhaarNumber,
  ]);

  useEffect(() => {
    QRCode.toDataURL(qrPayload, {
      width: 200,
      margin: 1,
      color: {
        dark: '#1e5631',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('QR error:', err));
  }, [qrPayload]);

  const handleDirectCardPrint = async () => {
    if (onPrint) {
      onPrint();
    } else {
      const ok = await printComponent('printable-a4-cards-sheet', 'Farmer ID Card A4 Print');
      if (!ok) {
        await handleDownloadPdf();
      }
    }
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    setDownloadSuccess(false);
    try {
      await downloadA4CardPdf(data);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (e) {
      console.error('PDF export error:', e);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* Top Action & View Switcher Bar */}
      {!isPrintMode && (
        <div className="flex flex-wrap items-center justify-center sm:justify-between gap-3 w-full max-w-[680px] px-1">
          <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
            {/* View Switcher Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => handleModeChange('front')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentViewMode === 'front'
                    ? 'bg-white text-green-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Front
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('back')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentViewMode === 'back'
                    ? 'bg-white text-green-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('both')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentViewMode === 'both'
                    ? 'bg-white text-green-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Both
              </button>
            </div>

            {/* Quick Crop / Adjust Button for photo */}
            {data.photoUrl && (
              <button
                type="button"
                onClick={() => setIsCropModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                title="फोटो क्रॉप व ॲडजस्ट करा"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-700" />
                क्रॉप ॲडजस्ट
              </button>
            )}

            {/* Print & Download buttons (can be hidden inside modal to avoid duplication) */}
            {!hideActionButtons && (
              <>
                {/* Print Farmer ID Card Button (Exact name requested in user specification) */}
                <button
                  type="button"
                  onClick={handleDirectCardPrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1e5631] hover:bg-[#164325] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  title="Print Farmer ID Card on A4 Sheet"
                >
                  <Printer className="w-3.5 h-3.5 text-yellow-300" />
                  Print Farmer ID Card
                </button>

                {/* Download PDF Button (Exact name requested in user specification) */}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 ${
                    downloadSuccess
                      ? 'bg-green-700 hover:bg-green-800 ring-2 ring-green-300'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                  title="Download 300 DPI A4 PDF"
                >
                  {downloadSuccess ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-yellow-300" />
                      PDF सेव्ह झाले!
                    </>
                  ) : isExportingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      PDF तयार होत आहे...
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-white" />
                      Download PDF
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Display: Interactive View */}
      <div className="w-full flex justify-center py-1">
        {currentViewMode === 'both' ? (
          <div
            id="printable-card-both-print"
            className="flex flex-col md:flex-row items-center justify-center gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50/90 rounded-2xl border border-gray-200/90 max-w-full"
          >
            {/* Front Card Container - Scaled to fit comfortably side-by-side */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider no-print">
                Front Side • समोरील बाजू (85.6 mm × 54 mm)
              </span>
              <div
                className="overflow-hidden rounded-2xl shadow-md border border-[#1e5631]/80 bg-[#edf6ee]"
                style={{
                  width: '416px',
                  height: '262px',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: '600px',
                    height: '378px',
                    transform: 'scale(0.69333)',
                    transformOrigin: '0 0',
                  }}
                >
                  <AgriRecordCardFront
                    data={data}
                    id="printable-card-front"
                    qrCodeUrl={qrCodeUrl}
                    isPrintMode={isPrintMode}
                    onPhotoClick={() => setIsCropModalOpen(true)}
                  />
                </div>
              </div>
            </div>

            {/* Back Card Container - Scaled to fit comfortably side-by-side */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider no-print">
                Back Side • मागील बाजू (85.6 mm × 54 mm)
              </span>
              <div
                className="overflow-hidden rounded-2xl shadow-md border border-[#1e5631]/80 bg-[#edf6ee]"
                style={{
                  width: '416px',
                  height: '262px',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: '600px',
                    height: '378px',
                    transform: 'scale(0.69333)',
                    transformOrigin: '0 0',
                  }}
                >
                  <AgriRecordCardBack
                    data={data}
                    id="printable-card-back"
                    isPrintMode={isPrintMode}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* The active card */}
            <div className={currentViewMode === 'front' ? 'block' : 'hidden'}>
              <AgriRecordCardFront
                data={data}
                id="printable-card-front"
                qrCodeUrl={qrCodeUrl}
                isPrintMode={isPrintMode}
                onPhotoClick={() => setIsCropModalOpen(true)}
              />
            </div>

            <div className={currentViewMode === 'back' ? 'block' : 'hidden'}>
              <AgriRecordCardBack
                data={data}
                id="printable-card-back"
                isPrintMode={isPrintMode}
              />
            </div>
          </div>
        )}
      </div>

      {/* Dedicated PDF capture staging container (placed 300vw to the right, completely invisible) */}
      <div
        id="pdf-render-cards-staging"
        style={{
          position: 'fixed',
          top: 0,
          left: '300vw',
          zIndex: -9999,
          pointerEvents: 'none',
          backgroundColor: '#ffffff',
          width: '600px',
        }}
      >
        {/* Full resolution Front card for PDF export */}
        <div style={{ width: '600px', height: '378px', overflow: 'hidden' }}>
          <AgriRecordCardFront
            data={data}
            id="export-card-front"
            qrCodeUrl={qrCodeUrl}
            isPrintMode={true}
          />
        </div>

        {/* Full resolution Back card for PDF export */}
        <div style={{ width: '600px', height: '378px', overflow: 'hidden', marginTop: '16px' }}>
          <AgriRecordCardBack
            data={data}
            id="export-card-back"
            isPrintMode={true}
          />
        </div>

        {/* A4 Sheet for direct browser printing */}
        <div style={{ width: '210mm', minHeight: '297mm', marginTop: '16px' }}>
          <A4CardsPrintSheet
            data={data}
            qrCodeUrl={qrCodeUrl}
            id="printable-a4-cards-sheet"
          />
        </div>
      </div>

      {/* Direct Interactive Photo Crop Modal */}
      {isCropModalOpen && data.photoUrl && (
        <PhotoCropModal
          isOpen={isCropModalOpen}
          imageSrc={data.photoUrl}
          onClose={() => setIsCropModalOpen(false)}
          onCropComplete={(croppedUrl) => {
            if (onPhotoChange) {
              onPhotoChange(croppedUrl);
            }
            setIsCropModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

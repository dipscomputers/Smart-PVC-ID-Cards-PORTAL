import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { FarmerFormData } from '../types/form';
import { CardTemplateId, CardThemeId, CardLanguage, CardCustomizationOptions } from '../types/cardOptions';
import { FarmerWatermarkSvg } from './FarmerWatermarkSvg';
import { CheckCircle2, Shield, QrCode as QrIcon, Sparkles, Award } from 'lucide-react';

interface FarmerCardProps {
  data: FarmerFormData;
  template: CardTemplateId;
  theme: CardThemeId;
  language: CardLanguage;
  options: CardCustomizationOptions;
  side: 'front' | 'back';
  id?: string;
  isPrintMode?: boolean;
  onPhotoClick?: () => void;
  onQrClick?: () => void;
  className?: string;
}

// Color theme palette mappings
export const themePalettes: Record<CardThemeId, {
  primary: string;
  primaryDark: string;
  accent: string;
  bgLight: string;
  border: string;
  badgeBg: string;
  badgeText: string;
}> = {
  emerald: {
    primary: '#1e5631',
    primaryDark: '#143d22',
    accent: '#f5b026',
    bgLight: '#edf6ee',
    border: '#1e5631',
    badgeBg: '#dcfce7',
    badgeText: '#14532d',
  },
  tricolor: {
    primary: '#c2410c',
    primaryDark: '#9a3412',
    accent: '#15803d',
    bgLight: '#fffbeb',
    border: '#ea580c',
    badgeBg: '#ffedd5',
    badgeText: '#9a3412',
  },
  navy: {
    primary: '#1e3a8a',
    primaryDark: '#172554',
    accent: '#f59e0b',
    bgLight: '#eff6ff',
    border: '#1e40af',
    badgeBg: '#dbeafe',
    badgeText: '#1e3a8a',
  },
  forest: {
    primary: '#064e3b',
    primaryDark: '#022c22',
    accent: '#fbbf24',
    bgLight: '#ecfdf5',
    border: '#047857',
    badgeBg: '#d1fae5',
    badgeText: '#065f46',
  },
  amber: {
    primary: '#78350f',
    primaryDark: '#451a03',
    accent: '#16a34a',
    bgLight: '#fef3c7',
    border: '#b45309',
    badgeBg: '#fef9c3',
    badgeText: '#854d0e',
  },
};

// Bilingual translations helper
export const cardI18n = {
  mr: {
    titleAgri: 'शेती परिचय पत्र',
    titleGovt: 'महाराष्ट्र शासन • कृषी विभाग',
    subGovt: 'शेतकरी ओळखपत्र (Farmer Identity Card)',
    titlePmkisan: 'पीएम-किसान व किसान क्रेडिट कार्ड',
    subPmkisan: 'भारत सरकार • कृषी व शेतकरी कल्याण मंत्रालय',
    titleOrganic: 'सेंद्रिय शेतकरी हरित ओळखपत्र',
    subOrganic: 'जैविक शेती प्रमाणीकरण (NPOP Certified)',
    titleApmc: 'कृषी उत्पन्न बाजार समिती (APMC)',
    subApmc: 'शेतकरी मंडी प्रवेश ओळखपत्र (Mandi Pass)',
    titleModern: 'डिजिटल शेतकरी स्मार्ट ओळखपत्र',
    subModern: 'Digital Kisan Smart PVC Identity',
    name: 'नाव',
    dob: 'जन्मतारीख',
    gender: 'लिंग',
    mobile: 'मोबाईल',
    farmerId: 'शेतकरी आयडी',
    aadhaar: 'आधार क्र.',
    address: 'पत्ता',
    village: 'गाव',
    taluka: 'तालुका',
    district: 'जिल्हा',
    gatNo: 'गट क्र.',
    khateNo: 'खाते क्र.',
    area: 'क्षेत्र (हे.आर)',
    authSign: 'अधिकृत स्वाक्षरी',
    officer: 'कृषी अधिकारी / संचालक',
    verified: 'शासकीय पडताळणीकृत',
    validity: 'वैधता: आजीवन',
    male: 'पुरुष (Male)',
    female: 'स्त्री (Female)',
  },
  hi: {
    titleAgri: 'कृषि परिचय पत्र',
    titleGovt: 'कृषि विभाग • किसान पहचान पत्र',
    subGovt: 'किसान आधिकारिक पहचान पत्र (Farmer ID)',
    titlePmkisan: 'पीएम-किसान एवं किसान क्रेडिट कार्ड',
    subPmkisan: 'कृषि एवं किसान कल्याण मंत्रालय (Govt of India)',
    titleOrganic: 'जैविक एवं प्राकृतिक किसान प्रमाण पत्र',
    subOrganic: 'जैविक भारत प्रमाणीकरण (Organic Pass)',
    titleApmc: 'कृषि उपज मंडी समिति (APMC)',
    subApmc: 'किसान मंडी प्रवेश पत्र (Mandi Pass)',
    titleModern: 'डिजिटल किसान स्मार्ट पहचान पत्र',
    subModern: 'Digital Smart PVC Kisan Card',
    name: 'नाम',
    dob: 'जन्म तिथि',
    gender: 'लिंग',
    mobile: 'मोबाइल',
    farmerId: 'किसान आईडी',
    aadhaar: 'आधार सं.',
    address: 'पता',
    village: 'गाँव',
    taluka: 'तहसील',
    district: 'जिला',
    gatNo: 'खसरा/गट सं.',
    khateNo: 'खाता सं.',
    area: 'क्षेत्र (हेक्टेयर)',
    authSign: 'अधिकृत हस्ताक्षर',
    officer: 'कृषि अधिकारी / प्राधिकृत',
    verified: 'सत्यापित किसान',
    validity: 'वैधता: आजीवन',
    male: 'पुरुष (Male)',
    female: 'महिला (Female)',
  },
  en: {
    titleAgri: 'Agri Record - Farmer ID',
    titleGovt: 'Agriculture Dept. Official ID',
    subGovt: 'Government Recognized Farmer Pass',
    titlePmkisan: 'PM-Kisan & KCC Identity Card',
    subPmkisan: 'Ministry of Agriculture & Farmers Welfare',
    titleOrganic: 'Organic Farmer Green Certificate',
    subOrganic: 'NPOP Natural Farming Pass',
    titleApmc: 'APMC Market Yard Farmer Pass',
    subApmc: 'Agricultural Produce Market Committee',
    titleModern: 'Digital Smart Farmer Identity',
    subModern: 'Smart PVC Chip Farmer Card',
    name: 'Name',
    dob: 'DOB',
    gender: 'Gender',
    mobile: 'Mobile',
    farmerId: 'Farmer ID',
    aadhaar: 'Aadhaar No.',
    address: 'Address',
    village: 'Village',
    taluka: 'Tehsil',
    district: 'District',
    gatNo: 'Survey/Gat No.',
    khateNo: 'Account No.',
    area: 'Area (Ha.R)',
    authSign: 'Authorized Signatory',
    officer: 'Agriculture Officer',
    verified: 'Verified Farmer',
    validity: 'Validity: Lifetime',
    male: 'Male',
    female: 'Female',
  },
};

export const FarmerCard: React.FC<FarmerCardProps> = ({
  data,
  template,
  theme,
  language,
  options,
  side,
  id,
  isPrintMode = false,
  onPhotoClick,
  onQrClick,
  className = '',
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [barcodeSvg, setBarcodeSvg] = useState<string>('');
  const t = cardI18n[language] || cardI18n.mr;
  const palette = themePalettes[theme] || themePalettes.emerald;

  // Format DOB (DD-MM-YYYY)
  const formatDob = () => {
    if (data.dobDay && data.dobMonth && data.dobYear) {
      const d = data.dobDay.padStart(2, '0');
      const monthMap: Record<string, string> = {
        January: '01', February: '02', March: '03', April: '04',
        May: '05', June: '06', July: '07', August: '08',
        September: '09', October: '10', November: '11', December: '12',
      };
      const m = monthMap[data.dobMonth] || data.dobMonth.padStart(2, '0');
      return `${d}-${m}-${data.dobYear}`;
    }
    return '20-08-1993';
  };

  // Format Aadhaar
  const formatAadhaar = () => {
    const raw = (data.aadhaarNumber || '9420 4790 8747').replace(/\D/g, '');
    if (raw.length === 12) {
      return `${raw.slice(0, 4)} ${raw.slice(4, 8)} ${raw.slice(8, 12)}`;
    }
    return data.aadhaarNumber || '9420 4790 8747';
  };

  // Format Farmer ID
  const formatFarmerId = () => {
    const raw = (data.farmerId || '803 68 73 81 90').trim();
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 11) {
      return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
    }
    return raw;
  };

  // Build clean uppercase address
  const buildAddress = () => {
    if (data.addressEn && data.addressEn.trim()) {
      return data.addressEn.trim().toUpperCase();
    }
    const parts: string[] = [];
    if (data.villageEn) parts.push(`AT. ${data.villageEn.toUpperCase()}`);
    if (data.tehsilEn) parts.push(`TQ. ${data.tehsilEn.toUpperCase()}`);
    if (data.districtEn) parts.push(`DIST. ${data.districtEn.toUpperCase()}`);
    if (data.pincode) parts.push(data.pincode);
    return parts.join(' ') || 'AT. SOMTHANA TQ MALEGAON DIST. WASHIM 444503';
  };

  // Generate dynamic QR Code
  useEffect(() => {
    const qrData = JSON.stringify({
      app: 'Farmer-ID-Portal',
      id: data.farmerId || '80368738190',
      name: data.fullNameEn || 'DIPAK MADHAV KHANDARE',
      dob: formatDob(),
      gender: data.gender || 'Male',
      mobile: data.whatsappNumber || '9049102035',
      aadhaar: formatAadhaar(),
      village: data.villageEn || data.villageMr || 'SOMTHANA',
      tehsil: data.tehsilEn || data.tehsilMr || 'MALEGAON',
      district: data.districtEn || data.districtMr || 'WASHIM',
      gatNo: data.lands?.[0]?.gatNo || '126',
      area: data.lands?.[0]?.areaHaR || '1.06',
      verified: true,
      issuer: 'Agriculture Dept • Verified',
    });

    QRCode.toDataURL(qrData, {
      width: 130,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.warn('QR error:', err));
  }, [data]);

  const isVertical = template === 'apmc-vertical';
  const lands = data.lands && data.lands.length > 0 ? data.lands : [
    {
      id: 'default-l',
      district: data.districtMr || 'वाशिम',
      taluka: data.tehsilMr || 'मालेगाव',
      village: data.villageEn || 'SOMTHANA',
      gatNo: '126',
      khateNo: '342',
      areaHaR: '1.06',
    }
  ];

  // Common CR80 dimensions: 600px x 378px (Horizontal) or 378px x 600px (Vertical)
  const cardStyle: React.CSSProperties = isVertical
    ? {
        width: '378px',
        height: '600px',
        minWidth: '378px',
        minHeight: '600px',
        maxWidth: '378px',
        maxHeight: '600px',
        backgroundColor: palette.bgLight,
        borderColor: palette.border,
        aspectRatio: '54 / 85.6',
        boxSizing: 'border-box',
      }
    : {
        width: '600px',
        height: '378px',
        minWidth: '600px',
        minHeight: '378px',
        maxWidth: '600px',
        maxHeight: '378px',
        backgroundColor: palette.bgLight,
        borderColor: palette.border,
        aspectRatio: '85.6 / 54',
        boxSizing: 'border-box',
      };

  // -------------------------------------------------------------
  // RENDER: APMC VERTICAL BADGE (Template 5)
  // -------------------------------------------------------------
  if (isVertical) {
    if (side === 'front') {
      return (
        <div
          id={id}
          style={cardStyle}
          className={`rounded-2xl overflow-hidden font-sans select-none flex flex-col justify-between relative border border-gray-400 ${
            isPrintMode ? 'shadow-none' : 'shadow-xl'
          } ${className}`}
        >
          {/* Lanyard Hole Mockup */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-2.5 bg-gray-300 rounded-full border border-gray-400 shadow-inner z-20 pointer-events-none" />

          {/* Top Header */}
          <div
            style={{ backgroundColor: palette.primary }}
            className="pt-7 pb-2.5 px-3 text-center text-white shrink-0 relative"
          >
            <div className="text-[10px] tracking-widest font-black uppercase text-amber-300">
              {t.titleApmc}
            </div>
            <div className="text-[13px] font-black tracking-tight leading-tight mt-0.5">
              {language === 'mr' ? 'शेतकरी मंडी ओळखपत्र' : language === 'hi' ? 'किसान मंडी प्रवेश पत्र' : 'FARMER MANDI PASS'}
            </div>
            <div className="text-[9px] text-emerald-100 font-mono font-bold mt-0.5">
              PASS NO: {formatFarmerId()}
            </div>
          </div>

          {/* Body Content */}
          <div className="p-3.5 flex-1 flex flex-col items-center justify-between text-center relative">
            {/* Photo with status ring */}
            <div className="relative mt-1">
              <div
                onClick={onPhotoClick}
                className="w-24 h-28 rounded-xl overflow-hidden border-2 border-white shadow-md bg-white cursor-pointer hover:opacity-95 transition-opacity"
              >
                {data.photoUrl ? (
                  <img src={data.photoUrl} alt="Farmer" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-200 flex items-center justify-center text-gray-400 text-xs">
                    PHOTO
                  </div>
                )}
              </div>
              {options.showHologram && (
                <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-600 border border-amber-300 flex items-center justify-center shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-900" />
                </div>
              )}
            </div>

            {/* Farmer Name & Details */}
            <div className="w-full mt-2">
              <div className="text-base font-black text-gray-900 leading-tight">
                {language === 'mr' ? data.fullNameMr || data.fullNameEn : data.fullNameEn}
              </div>
              {language === 'mr' && (
                <div className="text-xs font-bold text-gray-600 uppercase font-mono tracking-wide mt-0.5">
                  {data.fullNameEn}
                </div>
              )}
              <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                ✓ अधिकृत शेतकरी • APMC PASS
              </div>
            </div>

            {/* Mini Details Table */}
            <div className="w-full bg-white/90 rounded-lg p-2 border border-gray-200 text-left text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500 font-bold">{t.dob}:</span>
                <span className="font-mono font-bold text-gray-800">{formatDob()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-bold">{t.mobile}:</span>
                <span className="font-mono font-bold text-gray-800">{data.whatsappNumber || '9049102035'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-bold">{t.village}:</span>
                <span className="font-bold text-gray-800 truncate max-w-[140px]">{data.villageEn || data.villageMr || 'SOMTHANA'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-bold">{t.gatNo}:</span>
                <span className="font-mono font-bold text-emerald-800">{lands[0]?.gatNo || '126'} ({lands[0]?.areaHaR || '1.06'} Ha)</span>
              </div>
            </div>

            {/* Large Scan Barcode */}
            <div className="w-full flex flex-col items-center mt-1">
              <div className="h-9 w-full bg-white border border-gray-300 rounded p-1 flex items-center justify-center">
                {/* SVG Simulated Barcode */}
                <svg className="w-full h-full" viewBox="0 0 200 30" preserveAspectRatio="none">
                  <rect x="5" width="3" height="30" fill="#000"/>
                  <rect x="12" width="2" height="30" fill="#000"/>
                  <rect x="18" width="5" height="30" fill="#000"/>
                  <rect x="27" width="2" height="30" fill="#000"/>
                  <rect x="33" width="4" height="30" fill="#000"/>
                  <rect x="42" width="1" height="30" fill="#000"/>
                  <rect x="47" width="6" height="30" fill="#000"/>
                  <rect x="58" width="3" height="30" fill="#000"/>
                  <rect x="65" width="2" height="30" fill="#000"/>
                  <rect x="71" width="5" height="30" fill="#000"/>
                  <rect x="80" width="2" height="30" fill="#000"/>
                  <rect x="86" width="3" height="30" fill="#000"/>
                  <rect x="94" width="4" height="30" fill="#000"/>
                  <rect x="103" width="2" height="30" fill="#000"/>
                  <rect x="110" width="5" height="30" fill="#000"/>
                  <rect x="120" width="1" height="30" fill="#000"/>
                  <rect x="126" width="4" height="30" fill="#000"/>
                  <rect x="134" width="2" height="30" fill="#000"/>
                  <rect x="140" width="6" height="30" fill="#000"/>
                  <rect x="151" width="3" height="30" fill="#000"/>
                  <rect x="158" width="2" height="30" fill="#000"/>
                  <rect x="164" width="4" height="30" fill="#000"/>
                  <rect x="172" width="3" height="30" fill="#000"/>
                  <rect x="180" width="5" height="30" fill="#000"/>
                  <rect x="190" width="2" height="30" fill="#000"/>
                </svg>
              </div>
              <span className="font-mono text-[9px] font-bold text-gray-500 tracking-widest mt-0.5">
                {formatFarmerId()}
              </span>
            </div>
          </div>

          {/* Bottom Strip */}
          <div
            style={{ backgroundColor: palette.primary }}
            className="py-1 px-3 text-center text-white text-[9px] font-bold flex items-center justify-between"
          >
            <span>{t.validity}</span>
            <span className="text-amber-300">GATE PASS ACTIVE</span>
          </div>
        </div>
      );
    } else {
      // APMC Vertical Back
      return (
        <div
          id={id}
          style={cardStyle}
          className={`rounded-2xl overflow-hidden font-sans select-none flex flex-col justify-between relative border border-gray-400 p-4 ${
            isPrintMode ? 'shadow-none' : 'shadow-xl'
          } ${className}`}
        >
          {/* Header */}
          <div className="text-center border-b pb-2 border-gray-300">
            <h3 className="font-black text-xs text-gray-800">{t.titleApmc}</h3>
            <p className="text-[10px] text-gray-500 font-medium">नियम व अटी / Mandi Regulations</p>
          </div>

          {/* QR Code Center */}
          <div className="flex flex-col items-center my-auto cursor-pointer" onClick={onQrClick}>
            <div className="p-2 bg-white rounded-xl shadow-xs border border-gray-200">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="QR Code" className="w-28 h-28" />
              ) : (
                <div className="w-28 h-28 bg-gray-100 flex items-center justify-center">
                  <QrIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <span className="text-[10px] font-bold text-emerald-800 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              क्लिक करून पडताळणी तपासा
            </span>
          </div>

          {/* Instructions */}
          <div className="bg-white/80 rounded-lg p-2.5 border border-gray-200 text-[10px] text-gray-600 space-y-1 text-left">
            <p>१. हे पास फक्त अधिकृत शेतकऱ्यांसाठीच वैध आहे.</p>
            <p>२. शेतमाल विक्रीसाठी मंडईत प्रवेश करताना हे कार्ड दाखवणे बंधनकारक आहे.</p>
            <p>३. कार्ड गहाळ झाल्यास संबंधित एपीएमसी कार्यालयाशी संपर्क साधावा.</p>
            <div className="border-t pt-1 mt-1 font-mono text-[9px] text-gray-500">
              पत्ता: {buildAddress()}
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-end border-t pt-2 border-gray-300 text-center text-[9px]">
            <div>
              <div className="font-caveat font-bold text-gray-800 text-xs italic">Dipak Patil</div>
              <div className="text-gray-500 font-bold">शेतकरी स्वाक्षरी</div>
            </div>
            <div>
              <div className="font-caveat font-bold text-blue-900 text-xs italic">Secy. APMC</div>
              <div className="text-gray-500 font-bold">{t.authSign}</div>
            </div>
          </div>
        </div>
      );
    }
  }

  // -------------------------------------------------------------
  // RENDER: HORIZONTAL CR80 CARDS (Templates 1, 2, 3, 4, 6)
  // -------------------------------------------------------------
  if (side === 'front') {
    return (
      <div
        id={id}
        style={cardStyle}
        className={`rounded-2xl overflow-hidden font-sans select-none flex flex-col justify-between relative border border-gray-400 ${
          isPrintMode ? 'shadow-none' : 'shadow-xl'
        } ${className}`}
      >
        {/* 1. TOP HEADER BANNER (Varies by template) */}
        {template === 'maha-govt' ? (
          // MAHARASHTRA GOVT OFFICIAL BANNER
          <div
            style={{ backgroundColor: palette.primary }}
            className="px-4 py-2 h-[68px] flex items-center justify-between text-white shrink-0 border-b-2 border-amber-400"
          >
            {/* Left: Ashoka Emblem / State Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1 shadow-xs shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="#9a3412" strokeWidth="4"/>
                  {/* Ashoka Chakra */}
                  <circle cx="50" cy="50" r="24" fill="none" stroke="#1e3a8a" strokeWidth="2.5"/>
                  {Array.from({ length: 24 }).map((_, i) => (
                    <line
                      key={i}
                      x1="50"
                      y1="50"
                      x2={50 + 24 * Math.cos((i * 15 * Math.PI) / 180)}
                      y2={50 + 24 * Math.sin((i * 15 * Math.PI) / 180)}
                      stroke="#1e3a8a"
                      strokeWidth="1.2"
                    />
                  ))}
                  <circle cx="50" cy="50" r="4" fill="#1e3a8a"/>
                </svg>
              </div>
              <div>
                <div className="text-[15px] font-black tracking-tight text-white leading-tight">
                  {t.titleGovt}
                </div>
                <div className="text-[10px] font-bold text-amber-300 tracking-wide uppercase">
                  {t.subGovt}
                </div>
              </div>
            </div>

            {/* Right: Reg & Gold Badge */}
            <div className="text-right">
              <span className="px-2 py-0.5 rounded bg-amber-400 text-gray-900 font-black text-[10px] tracking-wide shadow-xs">
                GOVT ID
              </span>
              <div className="text-[9px] text-emerald-100 font-mono font-bold mt-1">
                MH-AGRI-2026
              </div>
            </div>
          </div>
        ) : template === 'pm-kisan-kcc' ? (
          // PM-KISAN & KCC BANNER
          <div
            style={{ backgroundColor: palette.primary }}
            className="px-4 py-2 h-[68px] flex items-center justify-between text-white shrink-0 border-b-2 border-yellow-400"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 text-gray-900 font-black flex items-center justify-center text-xs shadow-md border-2 border-white">
                PM-K
              </div>
              <div>
                <div className="text-[14px] font-black text-white leading-tight">
                  {t.titlePmkisan}
                </div>
                <div className="text-[9px] font-bold text-amber-300">
                  {t.subPmkisan}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white font-black text-[9px] flex items-center gap-1 shadow-xs">
                <CheckCircle2 className="w-2.5 h-2.5" /> DBT ACTIVE
              </span>
              <div className="text-[9px] font-mono text-gray-200 mt-0.5">KCC LINKED</div>
            </div>
          </div>
        ) : template === 'organic-farmer' ? (
          // ORGANIC JAIVIK FARMER BANNER
          <div
            style={{ backgroundColor: palette.primary }}
            className="px-4 py-2 h-[68px] flex items-center justify-between text-white shrink-0 border-b-2 border-emerald-400"
          >
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 border border-emerald-300 flex items-center justify-center text-white">
                <Award className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="text-[14px] font-black text-white leading-tight">
                  {t.titleOrganic}
                </div>
                <div className="text-[9px] font-bold text-emerald-200">
                  {t.subOrganic}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 rounded bg-emerald-700 text-amber-300 border border-emerald-400 font-black text-[9px]">
                JAIVIK BHARAT
              </span>
              <div className="text-[9px] text-white/80 font-mono mt-0.5">GRADE: A+ SOIL</div>
            </div>
          </div>
        ) : template === 'modern-gold-chip' ? (
          // MODERN GOLD CHIP BANNER
          <div
            style={{ backgroundColor: palette.primary }}
            className="px-4 py-2 h-[68px] flex items-center justify-between text-white shrink-0 border-b border-gray-600 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-gray-950" />
              </div>
              <div>
                <div className="text-[14px] font-black text-white leading-tight tracking-wide">
                  {t.titleModern}
                </div>
                <div className="text-[9px] font-bold text-amber-400">
                  {t.subModern}
                </div>
              </div>
            </div>
            <div className="text-right font-mono text-[9px] text-gray-400">
              <span className="px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/50 font-bold">
                NFC / SMART CHIP
              </span>
            </div>
          </div>
        ) : (
          // DEFAULT: AGRI RECORD (Flagship Emerald Sheti Parichay Patra)
          <div
            style={{ backgroundColor: palette.primary }}
            className="px-5 py-2 h-[64px] flex items-center justify-between text-white shrink-0"
          >
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[28px] font-black tracking-tight text-white font-sans leading-none">
                Agri
              </span>
              <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 36 36" fill="none" className="w-full h-full">
                  <path d="M18 4C13 4 8 9 9 15C11 15 13 13 15 11C16 14 19 15 21 15C22 9 18 4 18 4Z" fill="#78c257" />
                  <path d="M18 16C15 16 12 19 13 22C14 22 16 21 17 19C18 21 20 22 22 22C23 18 20 16 18 16Z" fill="#4caf50" />
                  <rect x="10" y="24" width="16" height="3" rx="1.5" fill="#f5b026" />
                  <rect x="12" y="29" width="12" height="2.5" rx="1.2" fill="#f5b026" />
                </svg>
              </div>
              <span className="text-[28px] font-black tracking-tight text-[#f5b026] font-sans leading-none">
                record
              </span>
            </div>

            <div className="text-center flex-1 px-2">
              <h1 className="text-[24px] font-black text-white tracking-wide">
                {t.titleAgri}
              </h1>
            </div>

            {/* Traditional Farmer Avatar in Pheta */}
            <div className="w-11 h-11 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                <path d="M20 38C20 22 32 10 50 10C68 10 80 22 80 38C82 34 85 28 85 24C85 16 75 8 50 8C25 8 15 16 15 24C15 28 18 34 20 38Z" fill="#e65100" />
                <path d="M18 36C22 25 35 18 50 18C65 18 78 25 82 36C84 41 82 46 78 48C69 51 31 51 22 48C18 46 16 41 18 36Z" fill="#f57c00" />
                <path d="M30 46Q50 48 70 46V68Q50 86 30 68Z" fill="#ffcc80" />
                <ellipse cx="40" cy="54" rx="2.5" ry="1.5" fill="#212121" />
                <ellipse cx="60" cy="54" rx="2.5" ry="1.5" fill="#212121" />
                <path d="M36 67Q45 64 50 67Q55 64 64 67Q68 70 65 72Q58 70 50 71Q42 70 35 72Q32 70 36 67Z" fill="#212121" />
                <rect x="48.5" y="44" width="3" height="7" rx="1.5" fill="#c62828" />
              </svg>
            </div>
          </div>
        )}

        {/* 2. CARD BODY: Photo + Details + QR Code + Watermark */}
        <div className="flex-1 px-4 py-2 flex items-center justify-between gap-3 relative overflow-hidden">
          {/* Subtle Agricultural Watermark */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.06] flex items-center justify-center">
            <FarmerWatermarkSvg />
          </div>

          {/* LEFT: Photograph with simulated Hologram or Smart Chip */}
          <div className="flex flex-col items-center shrink-0 z-10">
            <div className="relative">
              <div
                onClick={onPhotoClick}
                className="w-[105px] h-[135px] rounded-xl overflow-hidden border-[2.5px] border-[#75b0d6] bg-[#89bfe0] shadow-md flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all"
                title="फोटो बदलण्यासाठी क्लिक करा"
              >
                {data.photoUrl ? (
                  <img src={data.photoUrl} alt="Farmer" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-200 flex items-center justify-center text-gray-400 font-bold text-xs">
                    PHOTO
                  </div>
                )}
              </div>

              {/* Gold Chip or Hologram on photo */}
              {template === 'modern-gold-chip' ? (
                <div className="absolute -bottom-2 -left-2 w-9 h-7 rounded bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 border border-amber-600 shadow-sm flex items-center justify-center">
                  <div className="w-6 h-4 border border-amber-800/60 rounded-xs grid grid-cols-2 gap-0.5 p-0.5">
                    <div className="bg-amber-800/30" />
                    <div className="bg-amber-800/30" />
                  </div>
                </div>
              ) : options.showHologram ? (
                <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 border border-amber-300 shadow-xs flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-amber-900" />
                </div>
              ) : null}
            </div>

            {/* Farmer ID Pill below photo */}
            <div className="mt-1.5 px-2 py-0.5 bg-white/95 rounded-md border border-gray-300 shadow-2xs text-[10px] font-mono font-black text-gray-800 tracking-wide text-center">
              ID: {formatFarmerId()}
            </div>
          </div>

          {/* CENTER: Farmer Personal & Agricultural Details */}
          <div className="flex-1 flex flex-col justify-center min-w-0 z-10 pl-1 space-y-1">
            {/* Farmer Full Name in Marathi/Hindi and English */}
            <div>
              <div className="text-[17px] font-black text-gray-900 leading-tight truncate">
                {language === 'mr' ? data.fullNameMr || data.fullNameEn : data.fullNameEn}
              </div>
              <div className="text-[13px] font-extrabold text-gray-800 tracking-wide uppercase font-mono truncate">
                {data.fullNameEn || 'DIPAK MADHAV KHANDARE'}
              </div>
            </div>

            {/* 2-Column Info Grid */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] pt-0.5">
              <div>
                <span className="text-gray-500 font-bold">{t.dob}: </span>
                <span className="font-mono font-bold text-gray-900">{formatDob()}</span>
              </div>
              <div>
                <span className="text-gray-500 font-bold">{t.gender}: </span>
                <span className="font-bold text-gray-900">
                  {data.gender === 'Female' ? t.female : t.male}
                </span>
              </div>
              <div>
                <span className="text-gray-500 font-bold">{t.mobile}: </span>
                <span className="font-mono font-bold text-gray-900">
                  {data.whatsappNumber || '9049102035'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 font-bold">{t.aadhaar}: </span>
                <span className="font-mono font-bold text-gray-900">{formatAadhaar()}</span>
              </div>
            </div>

            {/* Address */}
            <div className="text-[10px] leading-tight text-gray-700 font-medium pt-0.5">
              <span className="font-bold text-gray-500">{t.address}: </span>
              <span className="font-semibold uppercase line-clamp-2">
                {buildAddress()}
              </span>
            </div>

            {/* Gat No & Area Badge */}
            {options.showLandDetails && (
              <div className="flex items-center gap-2 pt-0.5">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-950 font-black text-[10px] rounded border border-emerald-300">
                  {t.gatNo}: {lands[0]?.gatNo || '126'}
                </span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-950 font-black text-[10px] rounded border border-amber-300">
                  {t.area}: {lands[0]?.areaHaR || '1.06'} Ha.R
                </span>
              </div>
            )}
          </div>

          {/* RIGHT: QR Code & Verification Stamp */}
          <div className="flex flex-col items-center justify-center shrink-0 z-10 pr-1">
            <div
              onClick={onQrClick}
              className="p-1.5 bg-white rounded-xl shadow-sm border border-gray-300 cursor-pointer hover:scale-105 transition-transform"
              title="डिजिटल पडताळणी पाहण्यासाठी क्लिक करा"
            >
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="QR Code" className="w-[100px] h-[100px]" />
              ) : (
                <div className="w-[100px] h-[100px] bg-slate-100 flex items-center justify-center">
                  <QrIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>

            <div className="mt-1 flex items-center gap-1 text-[9px] font-black text-emerald-800">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>{t.verified}</span>
            </div>
          </div>
        </div>

        {/* 3. BOTTOM FOOTER BAR */}
        <div
          style={{ backgroundColor: palette.primary }}
          className="px-4 py-1.5 text-white flex items-center justify-between text-[10px] font-bold shrink-0"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-amber-300" />
            <span>{t.validity}</span>
          </div>

          {/* Barcode Strip */}
          {options.showBarcode && (
            <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded text-gray-900 font-mono text-[9px] font-black">
              <span>||||||| | ||||| | ||||</span>
              <span>{formatFarmerId()}</span>
            </div>
          )}

          <div className="text-right text-emerald-100 text-[9px]">
            Agri Verification Portal • GoI
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: BACK SIDE OF HORIZONTAL CR80 CARD
  // -------------------------------------------------------------
  return (
    <div
      id={id}
      style={cardStyle}
      className={`rounded-2xl overflow-hidden font-sans select-none flex flex-col justify-between relative border border-gray-400 p-4 ${
        isPrintMode ? 'shadow-none' : 'shadow-xl'
      } ${className}`}
    >
      {/* Background Watermark */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] flex items-center justify-center">
        <FarmerWatermarkSvg />
      </div>

      {/* Top Header */}
      <div className="flex items-center justify-between border-b pb-2 border-gray-300">
        <div>
          <h3 className="text-sm font-black text-gray-900 leading-tight">
            {language === 'mr' ? 'जमिनीचा तपशील व अधिकृत नोंदी' : 'Land Records & Official Verification'}
          </h3>
          <p className="text-[10px] text-gray-500 font-bold">
            महाराष्ट्र शासन • ७/१२ व ८-अ संलग्नित माहिती
          </p>
        </div>
        <div className="text-right">
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono text-[10px] font-black">
            खाते क्र: {lands[0]?.khateNo || '342'}
          </span>
        </div>
      </div>

      {/* Land Details Table */}
      <div className="my-2 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-2xs">
        <table className="w-full text-left text-[10px]">
          <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
            <tr>
              <th className="py-1 px-2">{t.village}</th>
              <th className="py-1 px-2">{t.taluka}</th>
              <th className="py-1 px-2">{t.gatNo}</th>
              <th className="py-1 px-2">{t.area}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">
            {lands.slice(0, 3).map((land, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="py-1 px-2 font-bold text-gray-800">{land.village || data.villageEn || 'SOMTHANA'}</td>
                <td className="py-1 px-2 text-gray-600">{land.taluka || data.tehsilMr || 'मालेगाव'}</td>
                <td className="py-1 px-2 font-mono font-bold text-emerald-800">{land.gatNo || '126'}</td>
                <td className="py-1 px-2 font-mono font-bold text-gray-900">{land.areaHaR || '1.06'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Middle Terms / Security Guidelines */}
      <div className="bg-slate-50/80 rounded p-2 text-[9px] text-gray-600 space-y-0.5 border border-slate-200">
        <p>• हे ओळखपत्र अधिकृत कृषी योजना, पीक विमा व खते अनुदानासाठी ग्राह्य धरले जाईल.</p>
        <p>• कार्ड हरवल्यास नजीकच्या तालुका कृषी अधिकारी किंवा सीएससी केंद्राशी संपर्क साधा.</p>
        <p className="font-mono text-[8px] text-gray-500 pt-0.5">
          अर्ज क्र: {data.applicationNo || 'MH-AGRI-2026-803687'} | जारी: {data.submittedAt || '01/10/2026'}
        </p>
      </div>

      {/* Bottom Signatures & Seal */}
      <div className="flex items-end justify-between pt-2 border-t border-gray-300">
        {/* Left: Farmer Signature */}
        <div className="text-center">
          <div className="font-caveat text-sm italic font-bold text-gray-800 -mb-1">
            {data.fullNameEn?.split(' ')[0] || 'Dipak'}
          </div>
          <div className="w-20 border-b border-gray-400 mt-1" />
          <span className="text-[9px] font-bold text-gray-500">शेतकरी स्वाक्षरी</span>
        </div>

        {/* Center: Official Stamp */}
        {options.showGovtSeal && (
          <div className="w-14 h-14 rounded-full border-2 border-dashed border-red-500/80 text-red-600 flex flex-col items-center justify-center p-1 transform rotate-[-8deg] shadow-2xs">
            <span className="text-[7px] font-black uppercase text-center leading-none">
              कृषी विभाग<br/>GOVT SEAL<br/>APPROVED
            </span>
          </div>
        )}

        {/* Right: Authorized Officer Signature */}
        <div className="text-center">
          <div className="font-caveat text-sm italic font-bold text-blue-900 -mb-1">
            Agri. Officer
          </div>
          <div className="w-24 border-b border-gray-400 mt-1" />
          <span className="text-[9px] font-bold text-gray-500">{t.authSign}</span>
        </div>
      </div>
    </div>
  );
};

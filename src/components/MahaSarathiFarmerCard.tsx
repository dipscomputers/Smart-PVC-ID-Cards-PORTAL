import React, { useMemo } from 'react';
import { FarmerFormData } from '../types/form';

// 1. Lion Capital of Ashoka (State Emblem of India)
export const AshokaEmblemSvg: React.FC<{ className?: string }> = ({ className = 'w-7 h-10' }) => (
  <svg viewBox="0 0 100 130" fill="none" className={className}>
    {/* Central Pillar Top / Abacus */}
    <path
      d="M30 75 H70 V82 H30 Z"
      fill="#2b2d42"
    />
    {/* Ashoka Chakra on Abacus */}
    <circle cx="50" cy="78.5" r="3.2" stroke="#1d3557" strokeWidth="0.8" fill="none" />
    <circle cx="50" cy="78.5" r="0.8" fill="#1d3557" />
    {/* Galloping Horse and Bull flanking */}
    <circle cx="38" cy="78.5" r="1.5" fill="#2b2d42" />
    <circle cx="62" cy="78.5" r="1.5" fill="#2b2d42" />
    
    {/* Base Lotus Bell */}
    <path
      d="M32 82 Q50 92 68 82 L70 87 Q50 97 30 87 Z"
      fill="#4a4e69"
    />
    <rect x="25" y="87" width="50" height="3" rx="1" fill="#2b2d42" />
    {/* Satyameva Jayate Inscription */}
    <text x="50" y="96" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#2b2d42" fontFamily="serif">
      सत्यमेव जयते
    </text>

    {/* The Three Lions Standing Back to Back */}
    {/* Center Lion Head */}
    <path
      d="M44 22 C44 14 56 14 56 22 C56 26 53 28 53 32 L47 32 C47 28 44 26 44 22 Z"
      fill="#2b2d42"
    />
    {/* Center Lion Mane */}
    <path
      d="M40 28 C38 35 40 46 45 52 L55 52 C60 46 62 35 60 28 C57 32 53 33 50 33 C47 33 43 32 40 28 Z"
      fill="#3a3d52"
    />
    {/* Center Lion Face Details */}
    <circle cx="47" cy="24" r="1.2" fill="#edf2f4" />
    <circle cx="53" cy="24" r="1.2" fill="#edf2f4" />
    <path d="M49 26 L51 26 L50 28 Z" fill="#edf2f4" />
    <path d="M48 30 Q50 32 52 30" stroke="#edf2f4" strokeWidth="0.8" fill="none" />

    {/* Left Lion Head & Mane */}
    <path
      d="M32 26 C28 22 34 16 39 21 C41 24 39 28 38 31 C33 33 30 38 29 46 L38 48 C37 40 37 34 40 30 Z"
      fill="#3a3d52"
    />
    <circle cx="34" cy="24" r="1" fill="#edf2f4" />

    {/* Right Lion Head & Mane */}
    <path
      d="M68 26 C72 22 66 16 61 21 C59 24 61 28 62 31 C67 33 70 38 71 46 L62 48 C63 40 63 34 60 30 Z"
      fill="#3a3d52"
    />
    <circle cx="66" cy="24" r="1" fill="#edf2f4" />

    {/* Central Chest & Paws */}
    <path
      d="M43 52 H57 V74 H43 Z"
      fill="#2b2d42"
    />
    <line x1="47" y1="54" x2="47" y2="74" stroke="#4a4e69" strokeWidth="1" />
    <line x1="53" y1="54" x2="53" y2="74" stroke="#4a4e69" strokeWidth="1" />
  </svg>
);

// 2. Indian Tricolor Ribbon Wave with Navy Blue Chakra
export const IndianFlagWaveSvg: React.FC<{ className?: string }> = ({ className = 'w-9 h-7' }) => (
  <svg viewBox="0 0 45 32" fill="none" className={className}>
    {/* Saffron Wave */}
    <path
      d="M2 10 Q12 4 22 10 T42 6 L43 12 Q23 16 13 10 T3 16 Z"
      fill="#FF9933"
    />
    {/* White Wave */}
    <path
      d="M3 16 Q13 10 23 16 T43 12 L44 18 Q24 22 14 16 T4 22 Z"
      fill="#FFFFFF"
      stroke="#e5e7eb"
      strokeWidth="0.3"
    />
    {/* Ashoka Chakra in Center */}
    <circle cx="23.5" cy="16" r="2.4" stroke="#000080" strokeWidth="0.5" fill="none" />
    <circle cx="23.5" cy="16" r="0.6" fill="#000080" />
    {/* Green Wave */}
    <path
      d="M4 22 Q14 16 24 22 T44 18 L45 24 Q25 28 15 22 T5 28 Z"
      fill="#138808"
    />
  </svg>
);

// 3. Golden Maharashtra Emblem / Sunburst Seal
export const MahaGoldenSealSvg: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 60 60" fill="none" className={className}>
    <defs>
      <radialGradient id="mahaGoldGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff3b0" />
        <stop offset="60%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#d97706" />
      </radialGradient>
      <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#b45309" floodOpacity="0.4" />
      </filter>
    </defs>
    {/* Sunburst Rays */}
    <g stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round">
      <line x1="30" y1="4" x2="30" y2="10" />
      <line x1="30" y1="50" x2="30" y2="56" />
      <line x1="4" y1="30" x2="10" y2="30" />
      <line x1="50" y1="30" x2="56" y2="30" />
      <line x1="11.5" y1="11.5" x2="16" y2="16" />
      <line x1="44" y1="44" x2="48.5" y2="48.5" />
      <line x1="11.5" y1="48.5" x2="16" y2="44" />
      <line x1="44" y1="16" x2="48.5" y2="11.5" />
    </g>
    {/* Golden Disc with Inner Ring */}
    <circle cx="30" cy="30" r="19" fill="url(#mahaGoldGrad)" filter="url(#goldGlow)" />
    <circle cx="30" cy="30" r="16.5" stroke="#b45309" strokeWidth="0.8" fill="none" />
    {/* Diya / Samai Emblem Shape */}
    <path
      d="M24 33 Q30 38 36 33 L35 30 Q30 32 25 30 Z"
      fill="#78350f"
    />
    {/* Lamp Flame */}
    <path
      d="M30 20 C27 24 28 27 30 29 C32 27 33 24 30 20 Z"
      fill="#dc2626"
    />
    <circle cx="30" cy="27" r="1.5" fill="#fef08a" />
    {/* Base Stand */}
    <rect x="27.5" y="34" width="5" height="4" fill="#78350f" rx="0.5" />
    <path d="M25 38 H35 L36 40 H24 Z" fill="#78350f" />
  </svg>
);

// 4. Circular Maharashtra Government Official Seal ("महाराष्ट्र शासन")
export const MahaGovCircularEmblemSvg: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 60 60" fill="none" className={className}>
    {/* Outer Double Blue Border Rings */}
    <circle cx="30" cy="30" r="28" stroke="#0e4e96" strokeWidth="2" fill="#ffffff" />
    <circle cx="30" cy="30" r="24.5" stroke="#0e4e96" strokeWidth="0.9" fill="#f8fafc" />
    {/* Circular Text: महाराष्ट्र शासन */}
    <path id="circleTextPath" d="M 12 30 A 18 18 0 1 1 48 30" fill="none" />
    <text fontSize="4.8" fontWeight="bold" fill="#0e4e96" letterSpacing="0.8">
      <textPath href="#circleTextPath" startOffset="50%" textAnchor="middle">
        महाराष्ट्र शासन
      </textPath>
    </text>
    {/* Center Diya & Fort Graphic */}
    <circle cx="30" cy="32" r="11" fill="#fffbeb" stroke="#f59e0b" strokeWidth="0.8" />
    <path d="M26 34 Q30 38 34 34 L33 32 Q30 33 27 32 Z" fill="#d97706" />
    <path d="M30 24 C28 27 28.5 29.5 30 31 C31.5 29.5 32 27 30 24 Z" fill="#dc2626" />
    <circle cx="30" cy="29.5" r="1" fill="#fef08a" />
  </svg>
);

// 5. Subtle Maharashtra Government Watermark (Centered in card background)
export const MahaStateWatermarkSvg: React.FC<{ className?: string }> = ({ className = 'w-60 h-60' }) => (
  <svg viewBox="0 0 200 200" fill="none" className={className}>
    <circle cx="100" cy="100" r="90" stroke="#0e4e96" strokeWidth="3" opacity="0.06" />
    <circle cx="100" cy="100" r="82" stroke="#0e4e96" strokeWidth="1.5" opacity="0.06" />
    <circle cx="100" cy="100" r="70" stroke="#0e4e96" strokeWidth="2" opacity="0.05" />
    {/* Center Star & Diya watermark */}
    <path
      d="M80 120 Q100 135 120 120 L118 112 Q100 118 82 112 Z"
      fill="#0e4e96"
      opacity="0.06"
    />
    <path
      d="M100 70 C92 84 94 96 100 102 C106 96 108 84 100 70 Z"
      fill="#0e4e96"
      opacity="0.06"
    />
    {/* Circular rays */}
    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
      <line
        key={deg}
        x1="100"
        y1="15"
        x2="100"
        y2="25"
        stroke="#0e4e96"
        strokeWidth="2.5"
        opacity="0.05"
        transform={`rotate(${deg} 100 100)`}
      />
    ))}
  </svg>
);

interface MahaSarathiFarmerCardProps {
  data: FarmerFormData;
  qrCodeUrl?: string;
  id?: string;
  isPrintMode?: boolean;
  onPhotoClick?: () => void;
}

/**
 * Format timestamp nicely (e.g. 29-09-2026 04:53:39)
 */
function getCardTimestamp(): string {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${d}-${m}-${y} ${hh}:${mm}:${ss}`;
}

/**
 * 1. FRONT SIDE: MahaSarathi Smart Card (Exact match with user-provided image.png)
 */
export const MahaSarathiFarmerCardFront: React.FC<MahaSarathiFarmerCardProps> = ({
  data,
  id = 'mahasarathi-card-front',
  isPrintMode = false,
  onPhotoClick,
}) => {
  // Format Date of Birth: DD-MM-YYYY
  const formattedDob = useMemo(() => {
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
    return '13-01-1996';
  }, [data.dobDay, data.dobMonth, data.dobYear]);

  // Format Aadhaar: XXXXXXXX5403 or masked blocks
  const formattedAadhaar = useMemo(() => {
    if (!data.aadhaarNumber || !data.aadhaarNumber.trim()) {
      return 'XXXXXXXX5403';
    }
    const clean = data.aadhaarNumber.replace(/\D/g, '');
    if (clean.length === 12) {
      return `XXXXXXXX${clean.slice(-4)}`;
    }
    return data.aadhaarNumber.trim();
  }, [data.aadhaarNumber]);

  // Format Farmer ID / Maha ID
  const formattedId = useMemo(() => {
    const raw = (data.farmerId || '2608-0800-184').trim();
    return raw;
  }, [data.farmerId]);

  // Build clean address string
  const formattedAddress = useMemo(() => {
    if (data.addressEn && data.addressEn.trim()) {
      return data.addressEn.trim();
    }
    const parts = [
      data.villageEn || data.villageMr || 'Mutha',
      data.tehsilEn || data.tehsilMr || 'Washim',
      data.districtEn || data.districtMr || 'Washim',
      'Maharashtra',
      data.pincode || '444505',
    ].filter(Boolean);
    return parts.join(', ');
  }, [data]);

  const timestamp = useMemo(() => getCardTimestamp(), []);

  return (
    <div
      id={id}
      className={`w-[600px] h-[378px] min-w-[600px] min-h-[378px] max-w-[600px] max-h-[378px] bg-gradient-to-b from-[#f9fafb] via-[#ffffff] to-[#f3f4f6] rounded-2xl overflow-hidden font-sans select-none flex flex-col justify-between relative border border-gray-300 ${
        isPrintMode ? 'shadow-none border border-gray-400' : 'shadow-xl'
      }`}
      style={{
        boxSizing: 'border-box',
        aspectRatio: '85.6 / 54',
      }}
    >
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <MahaStateWatermarkSvg className="w-[310px] h-[310px]" />
      </div>

      {/* TOP HEADER ROW: Ashoka Emblem, Indian Flag Wave, Golden Maharashtra Seal, MahaSarathi Header, Maharashtra Emblem */}
      <div className="relative z-10 px-5 pt-3.5 pb-1 flex items-center justify-between">
        {/* Left: Ashoka Emblem + Tricolor Ribbon Wave */}
        <div className="flex items-center gap-2">
          <AshokaEmblemSvg className="w-6 h-9 shrink-0 drop-shadow-2xs" />
          <IndianFlagWaveSvg className="w-8 h-6 shrink-0" />
        </div>

        {/* Center: Golden Seal + Government of Maharashtra + MahaSarathi Card */}
        <div className="flex flex-col items-center justify-center text-center -ml-2">
          <MahaGoldenSealSvg className="w-7 h-7 drop-shadow-xs" />
          <span className="text-[12px] font-bold text-gray-800 tracking-tight leading-tight mt-0.5">
            Government of Maharashtra
          </span>
          <span className="text-[15px] font-black text-[#e65100] tracking-wide leading-none mt-0.5">
            MahaSarathi Card
          </span>
        </div>

        {/* Right: Circular Maharashtra Emblem */}
        <div className="flex items-center">
          <MahaGovCircularEmblemSvg className="w-8 h-8 shrink-0 drop-shadow-xs" />
        </div>
      </div>

      {/* MIDDLE BODY ROW: Photo (Left) + Details Grid (Right) */}
      <div className="relative z-10 px-6 py-1 flex items-center gap-5 flex-1">
        {/* Left: Photo Frame */}
        <div className="shrink-0 flex flex-col items-center">
          <div
            onClick={onPhotoClick}
            className={`w-[130px] h-[162px] rounded-xl overflow-hidden border-2 border-gray-300 bg-gray-100 shadow-md relative group ${
              onPhotoClick ? 'cursor-pointer' : ''
            }`}
            title={onPhotoClick ? 'फोटो बदला किंवा क्रॉप करा' : ''}
          >
            {data.photoUrl ? (
              <img
                src={data.photoUrl}
                alt="Citizen"
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 text-gray-500">
                <svg className="w-12 h-12 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                <span className="text-[10px] font-bold mt-1">फोटो</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Key-Value Details */}
        <div className="flex-1 flex flex-col justify-center space-y-1.5 text-[13px] text-gray-800">
          {/* Name */}
          <div className="grid grid-cols-[115px_12px_1fr] items-baseline">
            <span className="font-bold text-[#0e4e96]">Name</span>
            <span className="font-bold text-gray-700">:</span>
            <span className="font-bold text-gray-900 truncate">
              {data.fullNameEn || data.fullNameMr || 'Shivkanya Bajirav Surve'}
            </span>
          </div>

          {/* Date of Birth */}
          <div className="grid grid-cols-[115px_12px_1fr] items-baseline">
            <span className="font-bold text-[#0e4e96]">Date of Birth</span>
            <span className="font-bold text-gray-700">:</span>
            <span className="font-semibold text-gray-800">{formattedDob}</span>
          </div>

          {/* Gender */}
          <div className="grid grid-cols-[115px_12px_1fr] items-baseline">
            <span className="font-bold text-[#0e4e96]">Gender</span>
            <span className="font-bold text-gray-700">:</span>
            <span className="font-semibold text-gray-800">{data.gender || 'Female'}</span>
          </div>

          {/* Address */}
          <div className="grid grid-cols-[115px_12px_1fr] items-start">
            <span className="font-bold text-[#0e4e96]">Address</span>
            <span className="font-bold text-gray-700">:</span>
            <span className="font-medium text-gray-800 text-[12px] leading-tight line-clamp-2">
              {formattedAddress}
            </span>
          </div>

          <div className="pt-1 border-t border-gray-200/60 my-0.5" />

          {/* Maha ID / Farmer ID */}
          <div className="grid grid-cols-[115px_12px_1fr] items-baseline">
            <span className="font-bold text-[#0e4e96]">Maha ID</span>
            <span className="font-bold text-gray-700">:</span>
            <span className="font-mono font-bold text-gray-900 tracking-wider">
              {formattedId}
            </span>
          </div>

          {/* Aadhaar Number */}
          <div className="grid grid-cols-[115px_12px_1fr] items-baseline">
            <span className="font-bold text-[#0e4e96]">Aadhaar Number</span>
            <span className="font-bold text-gray-700">:</span>
            <span className="font-mono font-bold text-gray-900 tracking-wider">
              {formattedAadhaar}
            </span>
          </div>

          {/* Generation Timestamp (bottom-right tiny text matching image.png) */}
          <div className="w-full text-right pt-0.5">
            <span className="text-[9px] font-mono text-gray-400">
              {timestamp}
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM FOOTER: Thin Orange Stripe + Solid Royal Blue Bar */}
      <div className="relative z-10 w-full shrink-0">
        <div className="h-[2.5px] bg-[#f57c00] w-full" />
        <div className="bg-[#0e4e96] h-[32px] flex items-center justify-center px-4">
          <span className="text-white text-[13.5px] font-bold tracking-wide">
            सर्व सेवा व योजनांचे डिजिटल प्रवेशद्वार.
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * 2. BACK SIDE: MahaSarathi Smart Card (Exact match with user-provided image.png)
 */
export const MahaSarathiFarmerCardBack: React.FC<MahaSarathiFarmerCardProps> = ({
  data,
  qrCodeUrl,
  id = 'mahasarathi-card-back',
  isPrintMode = false,
}) => {
  const timestamp = useMemo(() => getCardTimestamp(), []);

  return (
    <div
      id={id}
      className={`w-[600px] h-[378px] min-w-[600px] min-h-[378px] max-w-[600px] max-h-[378px] bg-gradient-to-b from-[#f9fafb] via-[#ffffff] to-[#f3f4f6] rounded-2xl overflow-hidden font-sans select-none flex flex-col justify-between relative border border-gray-300 ${
        isPrintMode ? 'shadow-none border border-gray-400' : 'shadow-xl'
      }`}
      style={{
        boxSizing: 'border-box',
        aspectRatio: '85.6 / 54',
      }}
    >
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <MahaStateWatermarkSvg className="w-[310px] h-[310px]" />
      </div>

      {/* TOP HEADER ROW: Identical to Front */}
      <div className="relative z-10 px-5 pt-3.5 pb-1 flex items-center justify-between">
        {/* Left: Ashoka Emblem + Tricolor Ribbon Wave */}
        <div className="flex items-center gap-2">
          <AshokaEmblemSvg className="w-6 h-9 shrink-0 drop-shadow-2xs" />
          <IndianFlagWaveSvg className="w-8 h-6 shrink-0" />
        </div>

        {/* Center: Golden Seal + Government of Maharashtra */}
        <div className="flex flex-col items-center justify-center text-center -ml-2">
          <MahaGoldenSealSvg className="w-7 h-7 drop-shadow-xs" />
          <span className="text-[12px] font-bold text-gray-800 tracking-tight leading-tight mt-0.5">
            Government of Maharashtra
          </span>
        </div>

        {/* Right: Circular Maharashtra Emblem */}
        <div className="flex items-center">
          <MahaGovCircularEmblemSvg className="w-8 h-8 shrink-0 drop-shadow-xs" />
        </div>
      </div>

      {/* MIDDLE BODY: Large High-Resolution Center QR Code in Pure White Card Container */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <div className="bg-white p-2.5 rounded-xl border border-gray-300/80 shadow-md flex items-center justify-center">
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="MahaSarathi QR Code"
              className="w-[160px] h-[160px] object-contain"
            />
          ) : (
            <div className="w-[160px] h-[160px] bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
              QR Code
            </div>
          )}
        </div>

        {/* Timestamp on right */}
        <div className="w-full flex justify-end px-4 mt-1">
          <span className="text-[9px] font-mono text-gray-400">
            {timestamp}
          </span>
        </div>
      </div>

      {/* BOTTOM FOOTER: Thin Orange Stripe + Solid Royal Blue Bar */}
      <div className="relative z-10 w-full shrink-0">
        <div className="h-[2.5px] bg-[#f57c00] w-full" />
        <div className="bg-[#0e4e96] h-[32px] flex items-center justify-center px-4">
          <span className="text-white text-[13.5px] font-bold tracking-wide">
            सर्व सेवा व योजनांचे डिजिटल प्रवेशद्वार.
          </span>
        </div>
      </div>
    </div>
  );
};

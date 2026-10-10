import React from 'react';
import { SwayamGhoshanaData } from '../types/swayamGhoshana';

interface SwayamGhoshanaA4SheetProps {
  data: SwayamGhoshanaData;
  id?: string;
  isPrintMode?: boolean;
}

export const SwayamGhoshanaA4Sheet: React.FC<SwayamGhoshanaA4SheetProps> = ({
  data,
  id = 'swayam-ghoshana-printable-document',
  isPrintMode = false,
}) => {
  const isBlank = Boolean(data.isBlankPrint);

  // Format date DD/MM/YYYY
  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return '';
    try {
      if (dStr.includes('-')) {
        const [y, m, d] = dStr.split('-');
        return `${d}/${m}/${y}`;
      }
      return dStr;
    } catch {
      return dStr;
    }
  };

  const formattedDate = formatDisplayDate(data.date) || '07/10/2026';

  // Relation helper: मुलगा / मुलगी / पत्नी
  const getRelationInfo = (rel?: string) => {
    if (rel === 'मुलगी') {
      return { connector: 'यांची', label: 'मुलगी' };
    }
    if (rel === 'पत्नी') {
      return { connector: 'यांच्या', label: 'पत्नी' };
    }
    return { connector: 'यांचा', label: 'मुलगा' };
  };

  const relationInfo = getRelationInfo(data.relationType);

  // Helper to render filled value WITHOUT any underline (clean, bold, professional typography)
  // Only shows dashes if user specifically chooses blank form print mode
  const renderValue = (
    value: string | undefined,
    defaultBlank = '---------------------------------'
  ) => {
    if (isBlank || !value || !value.trim()) {
      return (
        <span className="font-mono text-gray-400 text-[15px] tracking-tight select-none px-1">
          {defaultBlank}
        </span>
      );
    }
    return (
      <span className="font-bold text-black px-1 inline select-text text-[16.5px] sm:text-[17px]">
        {value.trim()}
      </span>
    );
  };

  return (
    <div
      id={id}
      className={`swayam-print-sheet swayam-a4-sheet bg-white text-black font-['Noto_Sans_Devanagari','Yantramanav','Mukta','Mangal','Arial_Unicode_MS',sans-serif] ${
        isPrintMode ? 'print-exact-page' : ''
      }`}
      style={{
        width: '210mm',
        height: '297mm',
        minHeight: '297mm',
        maxHeight: '297mm',
        padding: '4.5mm 6.5mm',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        color: '#000000',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ========================================================= */}
      {/* 1. UPPER SECTION: प्रपत्र-अ                                 */}
      {/* ========================================================= */}
      <div
        className="swayam-form-card w-full border-[2px] border-[#0284c7] rounded-xl bg-white px-3.5 py-2.5 flex flex-col justify-between shrink-0"
        style={{
          height: '141.5mm',
          minHeight: '141.5mm',
          maxHeight: '141.5mm',
          flex: '0 0 141.5mm',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Top: शासन निर्णय क्रमांक + Solid Blue Line */}
        <div className="shrink-0">
          <div className="w-full flex items-center justify-start px-1">
            <p className="text-[13.5px] sm:text-[14px] font-bold text-black tracking-tight leading-tight">
              शासन निर्णय क्रमांक: प्रसुता १६.१४/३४५/प्र.क्र.७१/१८-अ
            </p>
          </div>
          <div className="w-full border-b-[3px] border-[#0369a1] mt-1 mb-1.5"></div>
        </div>

        {/* Header Block: Centered Pills + Photo Box on Right */}
        <div className="relative w-full flex items-start justify-between h-[35mm] min-h-[35mm] shrink-0">
          {/* Centered Pills Container - 100% Horizontally Centered */}
          <div className="w-full flex flex-col items-center justify-center pt-0.5 text-center">
            {/* Pill 1: प्रपत्र-अ */}
            <div className="bg-[#bae6fd] border border-sky-300 text-black font-black text-[19px] sm:text-[20px] px-12 py-1 rounded-lg tracking-wide shadow-2xs text-center inline-flex items-center justify-center min-w-[170px]">
              प्रपत्र-अ
            </div>

            {/* Pill 2: स्वयंघोषणापत्र */}
            <div className="bg-[#f0f9ff] border border-sky-200 text-black font-extrabold text-[16px] sm:text-[17px] px-10 py-0.5 rounded-lg tracking-normal mt-1.5 shadow-2xs text-center inline-flex items-center justify-center min-w-[190px]">
              स्वयंघोषणापत्र
            </div>
          </div>

          {/* Photo Box on Right */}
          <div
            className="absolute right-0 top-0 border border-black bg-white flex flex-col items-center justify-center shrink-0 overflow-hidden"
            style={{
              width: '28mm',
              height: '35mm',
              boxSizing: 'border-box',
            }}
          >
            {!isBlank && data.photoUrl ? (
              <img
                src={data.photoUrl}
                alt="अर्जदाराचा फोटो"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center px-1 select-none flex flex-col items-center justify-center h-full">
                <p className="text-[12px] font-normal text-black leading-tight">
                  अर्जदाराचा फोटो
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Declaration Paragraph: Vertically Centered in Dedicated Zone, Rock-Solid */}
        <div className="flex-1 flex flex-col justify-center py-1 overflow-hidden">
          <p 
            className="text-[15.5px] sm:text-[16px] text-black text-justify tracking-normal"
            style={{ lineHeight: '2.50' }}
          >
            <span className="font-normal">मी, </span>
            {renderValue(data.fullName, '---------------------------------')}
            <span className="font-normal"> श्री. </span>
            {renderValue(data.fatherOrHusbandName, '---------------------------------')}
            <span className="font-normal"> {relationInfo.connector} </span>
            <span className="font-bold text-[15.5px] sm:text-[16px]">{relationInfo.label}</span>
            <span className="font-normal"> वय </span>
            {renderValue(data.age, '------')}
            <span className="font-normal"> वर्ष, आधार क्रमांक </span>
            {renderValue(data.aadhaarNumber, '---------------------------------')}
            <span className="font-normal"> व्यवसाय </span>
            {renderValue(data.occupation, '-----------------------')}
            <span className="font-normal"> राहणार </span>
            {renderValue(data.address, '---------------------------------------------------')}
            <span className="font-normal"> याद्वारे घोषित करतो / करते की, वरील सर्व माहिती माझ्या वैयक्तिक माहिती व समजूतीनुसार खरी आहे. सदर माहिती खोटी आढळून आल्यास, भारतीय दंड संहिता आणि / किंवा संबंधित कायद्यानुसार माझ्यावर खटला भरण्यास व शासनास शिक्षेस पात्र राहीन याची मला पूर्ण जाणीव आहे.</span>
          </p>
        </div>

        {/* Footer Box with soft light blue background (clean and compact) */}
        <div className="w-full bg-[#f0f9ff] border border-sky-100 rounded-xl p-2 mt-auto mb-0.5 flex items-start justify-between text-[13.5px] sm:text-[14px] shrink-0">
          {/* Left Column: ठिकाण & दिनांक */}
          <div className="space-y-1.5 w-[48%]">
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold whitespace-nowrap">ठिकाण :</span>
              <span className="font-bold text-black text-[14px] sm:text-[14.5px]">
                {isBlank ? '-----------------------' : (data.place || '—')}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold whitespace-nowrap">दिनांक :</span>
              <span className="font-bold text-black text-[14px] sm:text-[14.5px]">
                {isBlank ? '-----------------------' : formattedDate}
              </span>
            </div>
          </div>

          {/* Right Column: अर्जदाराची सही & अर्जदाराचे नाव */}
          <div className="space-y-1.5 w-[48%]">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold whitespace-nowrap">अर्जदाराची सही :</span>
              <span className="inline-flex items-center justify-start min-h-[44px]">
                {!isBlank && data.signatureUrl ? (
                  <img
                    src={data.signatureUrl}
                    alt="सही"
                    className="h-11 sm:h-12 max-w-[190px] object-contain inline-block px-1 mix-blend-multiply"
                  />
                ) : (
                  <span className="font-mono text-gray-500 text-[11px] select-none">
                    -----------------------
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold whitespace-nowrap">अर्जदाराचे नाव :</span>
              <span className="font-bold text-black text-[14px] sm:text-[14.5px]">
                {isBlank ? '-----------------------' : (data.fullName || '—')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MIDDLE HORIZONTAL GREEN SEPARATOR LINE                 */}
      {/* ========================================================= */}
      <div className="swayam-divider w-full my-1.5 border-b-[3px] border-[#16813d] shrink-0"></div>

      {/* ========================================================= */}
      {/* 3. LOWER SECTION: प्रपत्र-ब                                 */}
      {/* ========================================================= */}
      <div
        className="swayam-form-card w-full border-[2px] border-[#0284c7] rounded-xl bg-white px-3.5 py-2.5 flex flex-col justify-between shrink-0"
        style={{
          height: '141.5mm',
          minHeight: '141.5mm',
          maxHeight: '141.5mm',
          flex: '0 0 141.5mm',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Top: शासन निर्णय क्रमांक + Solid Blue Line */}
        <div className="shrink-0">
          <div className="w-full flex items-center justify-start px-1">
            <p className="text-[13.5px] sm:text-[14px] font-bold text-black tracking-tight leading-tight">
              शासन निर्णय क्रमांक: प्रसुता १६.१४/३४५/प्र.क्र.७१/१८-अ
            </p>
          </div>
          <div className="w-full border-b-[3px] border-[#0369a1] mt-1 mb-1.5"></div>
        </div>

        {/* Header Block: Centered Pills + Photo Box on Right */}
        <div className="relative w-full flex items-start justify-between h-[35mm] min-h-[35mm] shrink-0">
          {/* Centered Pills Container - 100% Horizontally Centered */}
          <div className="w-full flex flex-col items-center justify-center pt-0.5 text-center">
            {/* Pill 1: प्रपत्र-ब */}
            <div className="bg-[#bae6fd] border border-sky-300 text-black font-black text-[19px] sm:text-[20px] px-12 py-1 rounded-lg tracking-wide shadow-2xs text-center inline-flex items-center justify-center min-w-[170px]">
              प्रपत्र-ब
            </div>

            {/* Pill 2: स्वयं-साक्षांकनासाठी स्वयं घोषणापत्र */}
            <div className="bg-[#f0f9ff] border border-sky-200 text-black font-extrabold text-[15.5px] sm:text-[16.5px] px-7 py-0.5 rounded-lg tracking-normal mt-1.5 shadow-2xs text-center inline-flex items-center justify-center">
              स्वयं-साक्षांकनासाठी स्वयं घोषणापत्र
            </div>
          </div>

          {/* Photo Box on Right */}
          <div
            className="absolute right-0 top-0 border border-black bg-white flex flex-col items-center justify-center shrink-0 overflow-hidden"
            style={{
              width: '28mm',
              height: '35mm',
              boxSizing: 'border-box',
            }}
          >
            {!isBlank && (data.showPhotoInBoth || true) && data.photoUrl ? (
              <img
                src={data.photoUrl}
                alt="अर्जदाराचा फोटो"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center px-1 select-none flex flex-col items-center justify-center h-full">
                <p className="text-[12px] font-normal text-black leading-tight">
                  अर्जदाराचा फोटो
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Declaration Paragraph: Vertically Centered in Dedicated Zone, Rock-Solid */}
        <div className="flex-1 flex flex-col justify-center py-1 overflow-hidden">
          <p 
            className="text-[15.5px] sm:text-[16px] text-black text-justify tracking-normal"
            style={{ lineHeight: '2.50' }}
          >
            <span className="font-normal">मी, </span>
            {renderValue(data.fullName, '---------------------------------')}
            <span className="font-normal"> श्री. </span>
            {renderValue(data.fatherOrHusbandName, '---------------------------------')}
            <span className="font-normal"> {relationInfo.connector} </span>
            <span className="font-bold text-[15.5px] sm:text-[16px]">{relationInfo.label}</span>
            <span className="font-normal"> वय </span>
            {renderValue(data.age, '------')}
            <span className="font-normal"> वर्ष, आधार क्रमांक </span>
            {renderValue(data.aadhaarNumber, '---------------------------------')}
            <span className="font-normal"> व्यवसाय </span>
            {renderValue(data.occupation, '-----------------------')}
            <span className="font-normal"> राहणार </span>
            {renderValue(data.address, '---------------------------------------------------')}
            <span className="font-normal"> याद्वारे घोषित करतो / करते की, मी स्वयं साक्षांकित केलेल्या प्रती या मूळ कागदपत्रांच्या सत्य प्रती आहेत. त्या खोट्या असल्याचे आढळून आल्यास, भारतीय दंड संहिता आणि / किंवा संबंधित कायद्यानुसार माझ्यावर खटला भरण्यास व शासनास शिक्षेस पात्र राहीन याची मला पूर्ण जाणीव आहे.</span>
          </p>
        </div>

        {/* Footer Box with soft light blue background (clean and compact) */}
        <div className="w-full bg-[#f0f9ff] border border-sky-100 rounded-xl p-2 mt-auto mb-0.5 flex items-start justify-between text-[13.5px] sm:text-[14px] shrink-0">
          {/* Left Column: ठिकाण & दिनांक */}
          <div className="space-y-1.5 w-[48%]">
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold whitespace-nowrap">ठिकाण :</span>
              <span className="font-bold text-black text-[14px] sm:text-[14.5px]">
                {isBlank ? '-----------------------' : (data.place || '—')}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold whitespace-nowrap">दिनांक :</span>
              <span className="font-bold text-black text-[14px] sm:text-[14.5px]">
                {isBlank ? '-----------------------' : formattedDate}
              </span>
            </div>
          </div>

          {/* Right Column: अर्जदाराची सही & अर्जदाराचे नाव */}
          <div className="space-y-1.5 w-[48%]">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold whitespace-nowrap">अर्जदाराची सही :</span>
              <span className="inline-flex items-center justify-start min-h-[44px]">
                {!isBlank && data.signatureUrl ? (
                  <img
                    src={data.signatureUrl}
                    alt="सही"
                    className="h-11 sm:h-12 max-w-[190px] object-contain inline-block px-1 mix-blend-multiply"
                  />
                ) : (
                  <span className="font-mono text-gray-500 text-[11px] select-none">
                    -----------------------
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold whitespace-nowrap">अर्जदाराचे नाव :</span>
              <span className="font-bold text-black text-[14px] sm:text-[14.5px]">
                {isBlank ? '-----------------------' : (data.fullName || '—')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useMemo } from 'react';
import { FarmerFormData } from '../types/form';
import { AshokaEmblemSvg, IndianFlagWaveSvg, MahaGoldenSealSvg } from './MahaSarathiFarmerCard';

interface KisanCardProps {
  data: FarmerFormData;
  qrCodeUrl?: string;
  id?: string;
  isPrintMode?: boolean;
  onPhotoClick?: () => void;
}

export const KisanSammanFarmerCardFront: React.FC<KisanCardProps> = ({
  data,
  id = 'kisan-card-front',
  isPrintMode = false,
  onPhotoClick,
}) => {
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
    return '15-06-1988';
  }, [data.dobDay, data.dobMonth, data.dobYear]);

  const formattedAadhaar = useMemo(() => {
    if (!data.aadhaarNumber || !data.aadhaarNumber.trim()) return 'XXXX-XXXX-8747';
    const clean = data.aadhaarNumber.replace(/\D/g, '');
    if (clean.length === 12) {
      return `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8, 12)}`;
    }
    return data.aadhaarNumber.trim();
  }, [data.aadhaarNumber]);

  return (
    <div
      id={id}
      className={`w-[600px] h-[378px] min-w-[600px] min-h-[378px] max-w-[600px] max-h-[378px] bg-white rounded-2xl overflow-hidden font-sans select-none flex flex-col justify-between relative border border-amber-300 ${
        isPrintMode ? 'shadow-none border border-gray-400' : 'shadow-xl'
      }`}
      style={{
        boxSizing: 'border-box',
        aspectRatio: '85.6 / 54',
      }}
    >
      {/* Top Tricolor Strip */}
      <div className="flex h-1.5 w-full shrink-0">
        <div className="bg-[#FF9933] flex-1" />
        <div className="bg-white flex-1" />
        <div className="bg-[#138808] flex-1" />
      </div>

      {/* Header Bar */}
      <div className="bg-gradient-to-r from-[#1a472a] via-[#2d5a3c] to-[#1a472a] text-white px-4 py-2 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-2">
          <AshokaEmblemSvg className="w-5 h-8 shrink-0 drop-shadow-xs" />
          <div className="flex flex-col">
            <span className="text-[12px] font-bold text-amber-200 tracking-wide leading-none">
              महाराष्ट्र शासन • कृषी विभाग
            </span>
            <span className="text-[15px] font-black text-white tracking-wide leading-tight mt-0.5">
              शेतकरी ओळखपत्र (Farmer ID)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/40 px-2 py-1 rounded-md">
          <MahaGoldenSealSvg className="w-5 h-5 shrink-0" />
          <span className="text-[11px] font-bold text-amber-300">प्रमाणित</span>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 px-5 py-2 flex items-center gap-4 bg-gradient-to-br from-amber-50/40 via-white to-green-50/30">
        {/* Photo Box */}
        <div className="shrink-0 flex flex-col items-center">
          <div
            onClick={onPhotoClick}
            className={`w-[125px] h-[155px] rounded-xl overflow-hidden border-2 border-amber-600/70 bg-white shadow-md relative ${
              onPhotoClick ? 'cursor-pointer' : ''
            }`}
          >
            {data.photoUrl ? (
              <img
                src={data.photoUrl}
                alt="Farmer"
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                <span className="text-xs font-bold">फोटो</span>
              </div>
            )}
          </div>
          <span className="text-[10px] font-black text-[#1a472a] mt-1 bg-green-100/90 px-2 py-0.5 rounded border border-green-300">
            {data.gender || 'पुरुष / Male'}
          </span>
        </div>

        {/* Info Rows */}
        <div className="flex-1 flex flex-col justify-center space-y-1.5 text-[13px]">
          <div>
            <span className="text-[10.5px] font-bold text-gray-500 block leading-tight">शेतकऱ्याचे नाव / Full Name</span>
            <span className="font-black text-gray-900 text-[15px] block leading-tight">
              {data.fullNameMr || data.fullNameEn || 'दिपक माधव खंदारे'}
            </span>
            <span className="text-[11px] font-semibold text-gray-600 block leading-none">
              {data.fullNameEn || 'DIPAK MADHAV KHANDARE'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-200/70">
            <div>
              <span className="text-[10.5px] font-bold text-gray-500 block leading-none">जन्म तारीख / DOB</span>
              <span className="font-bold text-gray-800 text-[13px]">{formattedDob}</span>
            </div>
            <div>
              <span className="text-[10.5px] font-bold text-gray-500 block leading-none">मोबाईल / Mobile</span>
              <span className="font-bold text-gray-800 text-[13px]">{data.whatsappNumber || '9049102035'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-200/70">
            <div>
              <span className="text-[10.5px] font-bold text-gray-500 block leading-none">शेतकरी आयडी / Farmer ID</span>
              <span className="font-mono font-black text-[#1a472a] text-[13px]">{data.farmerId || '803 68 73 81 90'}</span>
            </div>
            <div>
              <span className="text-[10.5px] font-bold text-gray-500 block leading-none">आधार क्र. / Aadhaar</span>
              <span className="font-mono font-bold text-gray-800 text-[12px]">{formattedAadhaar}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Banner */}
      <div className="bg-[#1a472a] text-white px-4 py-1.5 flex items-center justify-between shrink-0">
        <span className="text-[11.5px] font-bold tracking-wide text-amber-300">
          महा-डीबीटी व कृषी योजनांसाठी अधिकृत ओळखपत्र
        </span>
        <span className="text-[11px] font-mono text-green-200">
          GOVT OF MAHARASHTRA
        </span>
      </div>
    </div>
  );
};

export const KisanSammanFarmerCardBack: React.FC<KisanCardProps> = ({
  data,
  qrCodeUrl,
  id = 'kisan-card-back',
  isPrintMode = false,
}) => {
  const firstLand = data.lands && data.lands.length > 0 ? data.lands[0] : null;
  const addressText = data.addressEn || [
    data.villageMr || data.villageEn || 'सोमठाणा',
    data.tehsilMr || data.tehsilEn || 'मालेगाव',
    data.districtMr || data.districtEn || 'वाशिम',
    data.pincode || '444505',
  ].filter(Boolean).join(', ');

  return (
    <div
      id={id}
      className={`w-[600px] h-[378px] min-w-[600px] min-h-[378px] max-w-[600px] max-h-[378px] bg-white rounded-2xl overflow-hidden font-sans select-none flex flex-col justify-between relative border border-amber-300 ${
        isPrintMode ? 'shadow-none border border-gray-400' : 'shadow-xl'
      }`}
      style={{
        boxSizing: 'border-box',
        aspectRatio: '85.6 / 54',
      }}
    >
      {/* Top Tricolor Strip */}
      <div className="flex h-1.5 w-full shrink-0">
        <div className="bg-[#FF9933] flex-1" />
        <div className="bg-white flex-1" />
        <div className="bg-[#138808] flex-1" />
      </div>

      {/* Header */}
      <div className="bg-[#1a472a] text-white px-4 py-2 flex items-center justify-between shrink-0">
        <span className="text-[13px] font-black text-white">
          जमिनीचा तपशील व पत्ता (Land Records & Address)
        </span>
        <span className="text-[11px] font-bold text-amber-300">
          डिजिटल स्वाक्षरीकृत
        </span>
      </div>

      {/* Body: Land Table + Address + QR */}
      <div className="flex-1 p-3.5 flex items-stretch gap-4 bg-gradient-to-br from-amber-50/30 via-white to-green-50/20">
        <div className="flex-1 flex flex-col justify-between space-y-2">
          {/* Address Box */}
          <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-2xs">
            <span className="text-[10px] font-bold text-gray-500 block uppercase">पत्ता / Address:</span>
            <p className="text-[11.5px] font-bold text-gray-800 leading-snug">
              {addressText}
            </p>
          </div>

          {/* Land Record Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-2xs text-[11px]">
            <div className="bg-gray-100 font-bold text-gray-700 grid grid-cols-5 p-1 text-center border-b border-gray-200">
              <span>जिल्हा</span>
              <span>तालुका</span>
              <span>गाव</span>
              <span>गट क्र.</span>
              <span>क्षेत्र (हे.आर)</span>
            </div>
            <div className="grid grid-cols-5 p-1 text-center font-bold text-gray-900 border-b border-gray-100">
              <span className="truncate">{firstLand?.district || data.districtMr || data.districtEn || 'वाशिम'}</span>
              <span className="truncate">{firstLand?.taluka || data.tehsilMr || data.tehsilEn || 'मालेगाव'}</span>
              <span className="truncate">{firstLand?.village || data.villageMr || data.villageEn || 'सोमठाणा'}</span>
              <span>{firstLand?.gatNo || '६६'}</span>
              <span>{firstLand?.areaHaR || '1.14'}</span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-[9.5px] text-gray-500 text-center italic">
            * हे ओळखपत्र केवळ कृषी योजना व शासकीय पडताळणीसाठी अधिकृत ग्राह्य धरले जाईल.
          </div>
        </div>

        {/* Right QR Box */}
        <div className="w-[145px] shrink-0 flex flex-col items-center justify-center bg-white p-2 rounded-xl border border-gray-300 shadow-xs">
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="QR Code" className="w-[125px] h-[125px] object-contain" />
          ) : (
            <div className="w-[125px] h-[125px] bg-gray-100 flex items-center justify-center text-xs text-gray-400">
              QR Code
            </div>
          )}
          <span className="text-[9px] font-bold text-emerald-800 mt-1">क्यूआर स्कॅन करा</span>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#1a472a] text-white px-4 py-1.5 flex items-center justify-center shrink-0">
        <span className="text-[11.5px] font-bold text-center">
          कृषी विभाग, महाराष्ट्र शासन • डिजिटल किसान पोर्टल
        </span>
      </div>
    </div>
  );
};

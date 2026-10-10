import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { FarmerFormData } from '../types/form';
import { AGRISTACK_LOGO } from '../assets/agriStackLogo';

interface ShetiParichayPatraCardProps {
  data: FarmerFormData;
  id?: string;
  className?: string;
}

export const ShetiParichayPatraCard: React.FC<ShetiParichayPatraCardProps> = ({
  data,
  id = 'sheti-parichay-patra',
  className = '',
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Format Date of Birth: DD-MM-YYYY
  const formatDob = () => {
    const day = (data.dobDay || '01').padStart(2, '0');
    // Map month names or numbers to 2-digit format
    const monthMap: Record<string, string> = {
      january: '01', february: '02', march: '03', april: '04',
      may: '05', june: '06', july: '07', august: '08',
      september: '09', october: '10', november: '11', december: '12',
      '1': '01', '2': '02', '3': '03', '4': '04', '5': '05', '6': '06',
      '7': '07', '8': '08', '9': '09', '10': '10', '11': '11', '12': '12',
    };
    const monthKey = (data.dobMonth || '').toLowerCase().trim();
    const month = monthMap[monthKey] || (data.dobMonth ? String(data.dobMonth).padStart(2, '0') : '01');
    const year = data.dobYear || '1990';
    return `${day}-${month}-${year}`;
  };

  // Format Farmer ID with spaces: e.g. "803 68 73 81 90"
  const formatFarmerId = (rawId: string) => {
    const clean = (rawId || '80368738190').replace(/\s+/g, '');
    if (clean.length === 11) {
      return `${clean.slice(0, 3)} ${clean.slice(3, 5)} ${clean.slice(5, 7)} ${clean.slice(7, 9)} ${clean.slice(9, 11)}`;
    }
    if (clean.length === 12) {
      return `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8, 12)}`;
    }
    // general space every 2-3 digits
    return clean.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
  };

  // Format Aadhaar: "9420 4790 8747" (blank if empty)
  const formatAadhaar = (raw?: string) => {
    if (!raw || !raw.trim()) return '';
    const clean = raw.replace(/\s+/g, '');
    return clean.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  // Build full uppercase address string (prioritizing exact Address In English from PDF)
  const buildAddress = () => {
    if (data.addressEn && data.addressEn.trim()) {
      return data.addressEn.trim().toUpperCase();
    }

    const parts: string[] = [];
    if (data.villageEn) {
      parts.push(`AT. ${data.villageEn.toUpperCase()}`);
    } else if (data.villageMr) {
      parts.push(`AT. ${data.villageMr}`);
    }

    if (data.tehsilEn) {
      parts.push(`TQ ${data.tehsilEn.toUpperCase()}`);
    } else if (data.tehsilMr) {
      parts.push(`TQ ${data.tehsilMr}`);
    }

    if (data.districtEn) {
      parts.push(`DIST.${data.districtEn.toUpperCase()}`);
    } else if (data.districtMr) {
      parts.push(`DIST.${data.districtMr}`);
    }

    if (data.pincode) {
      parts.push(data.pincode);
    }

    return parts.length > 0
      ? parts.join(' ')
      : '';
  };

  // Generate QR Code containing comprehensive farmer verification details
  useEffect(() => {
    const qrPayload = JSON.stringify({
      scheme: 'AgriRecord-ShetiParichayPatra',
      id: data.farmerId || '80368738190',
      nameMr: data.fullNameMr || 'दिपक माधव खंदारे',
      nameEn: data.fullNameEn || 'DIPAK MADHAV KHANDARE',
      dob: formatDob(),
      gender: data.gender || 'Male',
      mobile: data.whatsappNumber || '9049102035',
      aadhaar: data.aadhaarNumber || '',
      village: data.villageEn || data.villageMr || 'Somthana',
      tehsil: data.tehsilEn || data.tehsilMr || 'Malegaon',
      district: data.districtEn || data.districtMr || 'Washim',
      lands: (data.lands || []).map((l) => ({
        gatNo: l.gatNo,
        khateNo: l.khateNo,
        area: l.areaHaR,
      })),
    });

    QRCode.toDataURL(qrPayload, {
      width: 140,
      margin: 1,
      color: {
        dark: '#05180f',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.warn('QR code generation error:', err));
  }, [data]);

  // Default display values if fields are not yet filled
  const displayNameMr = data.fullNameMr || 'दिपक माधव खंदारे';
  const displayNameEn = (data.fullNameEn || 'DIPAK MADHAV KHANDARE').toUpperCase();
  const displayDob = formatDob();
  const displayGender = data.gender || 'Male';
  const displayMobile = data.whatsappNumber || '9049102035';
  const displayAadhaar = formatAadhaar(data.aadhaarNumber || '');
  const displayFarmerId = formatFarmerId(data.farmerId || '80368738190');
  const displayAddress = buildAddress();

  // Lands fallback if empty
  const landsToRender =
    data.lands && data.lands.length > 0 && data.lands.some((l) => l.gatNo || l.areaHaR || l.village)
      ? data.lands
      : [
          {
            id: 'l-default-1',
            district: data.districtMr || data.districtEn || 'वाशिम',
            taluka: data.tehsilMr || data.tehsilEn || 'मालेगाव',
            village: data.villageEn ? data.villageEn.toUpperCase() : 'SOMTHANA',
            gatNo: '126',
            khateNo: '',
            areaHaR: '1.06',
          },
        ];

  return (
    <div
      id={id}
      className={`w-full max-w-[720px] mx-auto bg-[#edf6ef] border-2 border-[#1f5737]/30 rounded-2xl shadow-xl overflow-hidden font-sans text-gray-900 select-none print:shadow-none print:border-none print:m-0 print:max-w-none print:rounded-none ${className}`}
      style={{
        backgroundColor: '#edf6ef',
      }}
    >
      {/* 1. Header Banner: Dark Green background */}
      <div className="bg-[#1f5737] text-white px-5 sm:px-7 py-3 sm:py-4 flex items-center justify-between shadow-xs">
        {/* Left: Official AgriStack Logo */}
        <div className="flex items-center gap-2">
          <div className="bg-white/95 px-3 py-1 rounded-lg shadow-sm border border-emerald-800/30 flex items-center justify-center h-[46px] max-w-[155px]">
            <img
              src={AGRISTACK_LOGO}
              alt="AgriStack Logo"
              className="h-[36px] w-auto max-w-[145px] object-contain drop-shadow-2xs"
            />
          </div>
        </div>

        {/* Center: Title "शेती परिचय पत्र" */}
        <div className="text-center flex-1 px-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide drop-shadow-xs">
            शेती परिचय पत्र
          </h1>
        </div>

        {/* Right: Traditional Indian Farmer Avatar Graphic */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
            {/* Saffron/Orange Pheta (Turban) */}
            <path
              d="M20 38C20 22 32 10 50 10C68 10 80 22 80 38C82 34 85 28 85 24C85 16 75 8 50 8C25 8 15 16 15 24C15 28 18 34 20 38Z"
              fill="#e65100"
            />
            <path
              d="M18 36C22 25 35 18 50 18C65 18 78 25 82 36C84 41 82 46 78 48C69 51 31 51 22 48C18 46 16 41 18 36Z"
              fill="#f57c00"
            />
            {/* Turban folds */}
            <path d="M22 26Q50 16 78 26" stroke="#bf360c" strokeWidth="2.5" fill="none" />
            <path d="M20 34Q50 24 80 34" stroke="#bf360c" strokeWidth="2.5" fill="none" />
            <path d="M22 42Q50 32 78 42" stroke="#bf360c" strokeWidth="2" fill="none" />
            <path d="M74 20Q86 28 84 42" stroke="#bf360c" strokeWidth="2" fill="none" />

            {/* Face */}
            <path d="M30 46Q50 48 70 46V68Q50 86 30 68Z" fill="#ffcc80" />
            {/* Ears */}
            <ellipse cx="28" cy="56" rx="4" ry="6" fill="#ffb74d" />
            <ellipse cx="72" cy="56" rx="4" ry="6" fill="#ffb74d" />

            {/* Eyes */}
            <ellipse cx="40" cy="54" rx="2.5" ry="1.5" fill="#212121" />
            <ellipse cx="60" cy="54" rx="2.5" ry="1.5" fill="#212121" />
            {/* Eyebrows */}
            <path d="M36 50Q40 48 45 50" stroke="#212121" strokeWidth="2" fill="none" />
            <path d="M55 50Q60 48 64 50" stroke="#212121" strokeWidth="2" fill="none" />
            {/* Nose */}
            <path d="M50 53V61L48 62H52" stroke="#d78d43" strokeWidth="1.5" fill="none" />
            {/* Mustache */}
            <path
              d="M36 67Q45 64 50 67Q55 64 64 67Q68 70 65 72Q58 70 50 71Q42 70 35 72Q32 70 36 67Z"
              fill="#212121"
            />
            {/* Red Tilak / Tikka */}
            <rect x="48.5" y="44" width="3" height="7" rx="1.5" fill="#c62828" />

            {/* White Kurta collar */}
            <path d="M30 76Q50 84 70 76L78 100H22L30 76Z" fill="#ffffff" />
            <path d="M50 78V95" stroke="#9e9e9e" strokeWidth="1.5" />
            <path d="M40 77L50 86L60 77" stroke="#e0e0e0" strokeWidth="2" fill="none" />
          </svg>
        </div>
      </div>

      {/* 2. Top Content: Photo, Details, QR Code + Agricultural Watermark */}
      <div className="relative p-5 sm:p-7 overflow-hidden">
        {/* Subtle Watermark of Indian Farmer with Bullocks Plowing Field */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.07] flex items-center justify-center">
          <svg className="w-[450px] h-[300px] text-[#1f5737]" viewBox="0 0 500 300" fill="currentColor">
            <path d="M400 120 C390 100, 360 90, 340 110 C320 130, 320 160, 340 180 C360 200, 390 190, 400 170 Z M330 190 L310 240 L280 240 L300 190 Z" />
            <path d="M150 160 C120 140, 80 150, 70 180 L20 180 L40 230 L80 230 L100 200 L160 200 Z" />
            <path d="M260 170 C240 150, 200 160, 190 190 L140 190 L160 240 L200 240 L220 210 L280 210 Z" />
            <path d="M290 150 L100 140 L70 170" stroke="currentColor" strokeWidth="6" fill="none" />
            <path d="M350 150 L280 180 L250 240" stroke="currentColor" strokeWidth="5" fill="none" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
          {/* Photo & Leaf Column */}
          <div className="flex flex-col items-center shrink-0">
            {/* Passport Photo Frame with light blue border */}
            <div className="w-[125px] h-[155px] sm:w-[135px] sm:h-[165px] rounded-xl overflow-hidden border-[3px] border-[#75b0d6] bg-[#89bfe0] shadow-md flex items-center justify-center">
              {data.photoUrl ? (
                <img
                  src={data.photoUrl}
                  alt={displayNameMr}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#9fcce8] flex flex-col items-center justify-center text-white p-2 text-center">
                  <svg className="w-14 h-14 opacity-80" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  <span className="text-[10px] font-bold mt-1 text-sky-950">छायाचित्र</span>
                </div>
              )}
            </div>

            {/* Stylized Dark Green Dual Leaf motif below photo */}
            <div className="mt-3">
              <svg className="w-20 h-10 text-[#1f5737]" viewBox="0 0 100 50" fill="currentColor">
                {/* Left/Bottom Leaf */}
                <path d="M10 45 C15 20, 45 15, 60 30 C45 45, 25 48, 10 45 Z" />
                {/* Top Leaf */}
                <path d="M35 32 C50 10, 85 10, 95 25 C80 38, 55 38, 35 32 Z" fill="#296b45" />
                <path d="M40 30 Q65 18 90 24" stroke="#edf6ef" strokeWidth="2" fill="none" opacity="0.6" />
              </svg>
            </div>
          </div>

          {/* Details Column */}
          <div className="flex-1 space-y-2 text-center sm:text-left">
            {/* Name */}
            <div>
              <div className="text-xl sm:text-[22px] font-black text-[#1b5334] tracking-tight">
                नाव : {displayNameMr}
              </div>
              <div className="text-xs sm:text-sm font-bold text-gray-800 tracking-wider mt-0.5 font-mono">
                {displayNameEn}
              </div>
            </div>

            {/* DOB */}
            <div className="text-base sm:text-lg font-bold text-[#1b5334]">
              जन्म दिनांक / DOB :{' '}
              <span className="font-semibold text-gray-900 font-mono tracking-tight">
                {displayDob}
              </span>
            </div>

            {/* Gender */}
            <div className="text-base sm:text-lg font-bold text-[#1b5334]">
              लिंग / Gender :{' '}
              <span className="font-semibold text-gray-900">
                {displayGender}
              </span>
            </div>

            {/* Mobile */}
            <div className="text-base sm:text-lg font-bold text-[#1b5334]">
              मोबाइल / Mobile :{' '}
              <span className="font-semibold text-gray-900 font-mono">
                {displayMobile}
              </span>
            </div>

            {/* Aadhaar */}
            <div className="text-base sm:text-lg font-bold text-[#1b5334]">
              आधार नं / Aadhaar No :{' '}
              <span className="font-semibold text-gray-900 font-mono tracking-wide">
                {displayAadhaar}
              </span>
            </div>
          </div>

          {/* Right Column: QR Code */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="bg-white p-2 rounded-xl border border-gray-300 shadow-md">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="Farmer Verification QR Code"
                  className="w-[110px] h-[110px] sm:w-[125px] sm:h-[125px] object-contain"
                />
              ) : (
                <div className="w-[110px] h-[110px] sm:w-[125px] sm:h-[125px] bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                  QR Code
                </div>
              )}
            </div>
            <span className="text-[10px] font-bold text-[#1f5737] mt-1 tracking-wider uppercase">
              SCAN TO VERIFY
            </span>
          </div>
        </div>
      </div>

      {/* 3. Center Green Stripe: फार्मर आयडी & Number */}
      <div className="bg-[#1f5737] text-white px-6 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 shadow-inner">
        <div className="text-2xl sm:text-3xl font-black text-[#f3b72b] tracking-wide">
          फार्मर आयडी
        </div>
        <div className="text-2xl sm:text-4xl font-black text-white font-mono tracking-widest sm:tracking-[0.25em]">
          {displayFarmerId}
        </div>
      </div>

      {/* 4. Lower Section: संपूर्ण पत्ता & जमिनीची माहिती */}
      <div className="p-5 sm:p-7 space-y-4">
        {/* Address */}
        <div className="relative">
          <div className="text-base sm:text-lg font-bold text-[#1b5334]">
            संपूर्ण पत्ता / Address
          </div>
          <div className="text-xs sm:text-sm font-bold text-gray-800 tracking-wide mt-1 font-mono uppercase">
            {displayAddress}
          </div>

          {/* Decorative leaves on top-right of address */}
          <div className="absolute right-0 top-0 pointer-events-none opacity-80">
            <svg className="w-16 h-8 text-[#2e6d49]" viewBox="0 0 100 50" fill="currentColor">
              <path d="M20 40 C30 15, 65 15, 85 25 C65 40, 40 45, 20 40 Z" opacity="0.4" />
              <path d="M45 35 C55 10, 85 15, 98 22 C85 36, 65 38, 45 35 Z" />
            </svg>
          </div>
        </div>

        {/* जमिनीची माहिती / Land Details */}
        <div className="pt-2">
          <div className="text-base sm:text-lg font-bold text-[#1b5334] mb-2">
            जमिनीची माहिती / Land Details
          </div>

          {/* Table matching user's exact columns: जिल्हा, तालुका, गाव, गट नं., खाते नं., क्षेत्र हे.आर */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="text-[#1b5334] font-bold border-b border-[#1b5334]/20">
                  <th className="pb-1.5 pr-3 font-extrabold">जिल्हा</th>
                  <th className="pb-1.5 pr-3 font-extrabold">तालुका</th>
                  <th className="pb-1.5 pr-3 font-extrabold">गाव</th>
                  <th className="pb-1.5 pr-3 font-extrabold">गट नं.</th>
                  <th className="pb-1.5 pr-3 font-extrabold">खाते नं.</th>
                  <th className="pb-1.5 font-extrabold">क्षेत्र हे.आर</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b5334]/10 text-gray-900 font-medium">
                {landsToRender.map((land, idx) => (
                  <tr key={land.id || idx}>
                    <td className="py-1.5 pr-3 font-semibold text-gray-800">
                      {land.district || data.districtMr || data.districtEn || '-'}
                    </td>
                    <td className="py-1.5 pr-3 font-semibold text-gray-800">
                      {land.taluka || data.tehsilMr || data.tehsilEn || '-'}
                    </td>
                    <td className="py-1.5 pr-3 font-semibold text-gray-800 uppercase">
                      {land.village || data.villageEn || data.villageMr || '-'}
                    </td>
                    <td className="py-1.5 pr-3 font-bold font-mono text-gray-900">
                      {land.gatNo || '-'}
                    </td>
                    <td className="py-1.5 pr-3 font-mono text-gray-900">
                      {land.khateNo || ''}
                    </td>
                    <td className="py-1.5 font-mono font-bold text-gray-900">
                      {land.areaHaR || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Footer Line & Disclaimer */}
      <div className="px-5 sm:px-8 pb-4 pt-1 flex items-center justify-center gap-3">
        {/* Left leaf & line */}
        <div className="flex-1 flex items-center gap-1">
          <svg className="w-8 h-4 text-[#296b45] shrink-0" viewBox="0 0 50 25" fill="currentColor">
            <path d="M5 20 C15 5, 35 8, 48 15 C35 22, 20 24, 5 20 Z" />
          </svg>
          <div className="h-[1px] bg-[#1f5737]/30 flex-1" />
        </div>

        {/* Centered Disclaimer */}
        <p className="text-[11px] sm:text-xs font-bold text-[#1b5334] text-center tracking-tight px-1">
          हे कार्ड वैयक्तिक वापरासाठी असून, सरकारी ओळखपत्र म्हणून मान्य नाही
        </p>

        {/* Right leaf & line */}
        <div className="flex-1 flex items-center gap-1">
          <div className="h-[1px] bg-[#1f5737]/30 flex-1" />
          <svg className="w-8 h-4 text-[#296b45] shrink-0 transform scale-x-[-1]" viewBox="0 0 50 25" fill="currentColor">
            <path d="M5 20 C15 5, 35 8, 48 15 C35 22, 20 24, 5 20 Z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

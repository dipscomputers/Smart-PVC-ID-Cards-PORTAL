import React, { useState } from 'react';
import { days, months, years } from '../utils/sampleData';
import { Languages, Loader2, AlertCircle } from 'lucide-react';
import { PhotographSection } from './PhotographSection';

interface PersonalInfoSectionProps {
  fullNameEn: string;
  fullNameMr: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  gender: 'Male' | 'Female' | '';
  whatsappNumber: string;
  photoUrl?: string;
  onPhotoChange?: (url: string) => void;
  errors?: Record<string, boolean>;
  shaking?: Record<string, boolean>;
  onChange: (fields: Partial<{
    fullNameEn: string;
    fullNameMr: string;
    dobDay: string;
    dobMonth: string;
    dobYear: string;
    gender: 'Male' | 'Female' | '';
    whatsappNumber: string;
    photoUrl: string;
  }>) => void;
}

export const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
  fullNameEn,
  fullNameMr,
  dobDay,
  dobMonth,
  dobYear,
  gender,
  whatsappNumber,
  photoUrl = '',
  onPhotoChange,
  errors = {},
  shaking = {},
  onChange,
}) => {
  const [isTranslating, setIsTranslating] = useState(false);

  const handlePhotoUpdate = (url: string) => {
    if (onPhotoChange) {
      onPhotoChange(url);
    } else {
      onChange({ photoUrl: url });
    }
  };

  const handleTranslateName = async () => {
    if (!fullNameEn.trim()) return;
    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate-marathi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullNameEn, type: 'person full name' }),
      });
      const data = await res.json();
      if (data.translated) {
        onChange({ fullNameMr: data.translated });
      }
    } catch {
      // Fallback
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-gray-200 pb-2">
        <h2 className="text-xl font-bold text-[#2e7d32]">Personal Information</h2>
      </div>

      {/* Names (Left, Smaller Boxes) & Photograph (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Names Column - Compact Left side */}
        <div className="md:col-span-8 space-y-4">
          {/* Full Name English */}
          <div id="field-fullNameEn">
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Full Name (English) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullNameEn}
              placeholder="e.g. Dipak Khandare Patil"
              onChange={(e) => onChange({ fullNameEn: e.target.value })}
              className={`w-full px-3.5 py-2.5 rounded-md border text-gray-900 text-sm shadow-xs font-medium transition-all ${
                shaking.fullNameEn ? 'animate-shake' : ''
              } ${
                errors.fullNameEn
                  ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200 focus:ring-red-400'
                  : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500'
              }`}
              required
            />
            {errors.fullNameEn && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> कृपया इंग्रजी पूर्ण नाव भरा (Required)
              </p>
            )}
          </div>

          {/* Full Name Marathi */}
          <div id="field-fullNameMr">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-gray-800">
                Full Name (मराठी) <span className="text-red-500">*</span>
              </label>
              {fullNameEn && (
                <button
                  type="button"
                  onClick={handleTranslateName}
                  disabled={isTranslating}
                  className="text-xs text-green-700 hover:text-green-800 flex items-center gap-1 font-medium bg-green-50 px-2 py-0.5 rounded border border-green-200 cursor-pointer"
                  title="इंग्रजी नावाचे मराठीत भाषांतर करा"
                >
                  {isTranslating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Languages className="w-3 h-3" />
                  )}
                  मराठीत रुपांतर करा
                </button>
              )}
            </div>
            <input
              type="text"
              value={fullNameMr}
              placeholder="उदा. दिपक खंदारे पाटील"
              onChange={(e) => onChange({ fullNameMr: e.target.value })}
              className={`w-full px-3.5 py-2.5 rounded-md border text-gray-900 text-sm shadow-xs font-medium transition-all ${
                shaking.fullNameMr ? 'animate-shake' : ''
              } ${
                errors.fullNameMr
                  ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200 focus:ring-red-400'
                  : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500'
              }`}
              required
            />
            {errors.fullNameMr ? (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> कृपया मराठी पूर्ण नाव भरा (Required)
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Enter your full name in Marathi</p>
            )}
          </div>
        </div>

        {/* Photograph Column - Right side */}
        <div className="md:col-span-4" id="field-photoUrl">
          <PhotographSection
            compact
            photoUrl={photoUrl}
            onChange={handlePhotoUpdate}
            isError={errors.photoUrl}
            isShaking={shaking.photoUrl}
          />
          {errors.photoUrl && (
            <p className="text-xs text-red-600 mt-1 text-center flex items-center justify-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> कृपया फोटो जोडा (Photo Required)
            </p>
          )}
        </div>
      </div>

      {/* Date of Birth & Gender Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        {/* Date of Birth */}
        <div id="field-dob">
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <div
            className={`grid grid-cols-3 gap-2 p-1 rounded-lg transition-all ${
              shaking.dob ? 'animate-shake ring-2 ring-red-300 bg-red-50/30' : ''
            }`}
          >
            <select
              value={dobDay}
              onChange={(e) => onChange({ dobDay: e.target.value })}
              className={`w-full px-2.5 py-2.5 rounded-md border text-gray-800 text-sm bg-white transition-all ${
                errors.dob
                  ? 'border-red-500 ring-1 ring-red-300'
                  : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500'
              }`}
            >
              <option value="">Day</option>
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={dobMonth}
              onChange={(e) => onChange({ dobMonth: e.target.value })}
              className={`w-full px-2 py-2.5 rounded-md border text-gray-800 text-sm bg-white transition-all ${
                errors.dob
                  ? 'border-red-500 ring-1 ring-red-300'
                  : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500'
              }`}
            >
              <option value="">Month</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.value}
                </option>
              ))}
            </select>

            <select
              value={dobYear}
              onChange={(e) => onChange({ dobYear: e.target.value })}
              className={`w-full px-2 py-2.5 rounded-md border text-gray-800 text-sm bg-white transition-all ${
                errors.dob
                  ? 'border-red-500 ring-1 ring-red-300'
                  : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500'
              }`}
            >
              <option value="">Year</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          {errors.dob && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> संपूर्ण जन्म तारीख निवडा (Date of Birth Required)
            </p>
          )}
        </div>

        {/* Gender */}
        <div id="field-gender">
          <label className="block text-sm font-semibold text-gray-800 mb-2.5">
            Gender <span className="text-red-500">*</span>
          </label>
          <div
            className={`flex items-center gap-6 pt-1 px-3 py-2 rounded-lg transition-all ${
              shaking.gender ? 'animate-shake' : ''
            } ${
              errors.gender
                ? 'border border-red-500 bg-red-50/30 ring-2 ring-red-200'
                : ''
            }`}
          >
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-800">
              <input
                type="radio"
                name="gender"
                value="Male"
                checked={gender === 'Male'}
                onChange={() => onChange({ gender: 'Male' })}
                className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
              />
              <span>Male / पुरुष</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-800">
              <input
                type="radio"
                name="gender"
                value="Female"
                checked={gender === 'Female'}
                onChange={() => onChange({ gender: 'Female' })}
                className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
              />
              <span>Female / महिला</span>
            </label>
          </div>
          {errors.gender && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> कृपया लिंग निवडा (Gender Required)
            </p>
          )}
        </div>
      </div>

      {/* WhatsApp / Mobile Number */}
      <div id="field-whatsappNumber">
        <label className="block text-sm font-semibold text-gray-800 mb-1.5">
          Mobiles Number <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="tel"
            maxLength={10}
            value={whatsappNumber}
            placeholder="10-digit Mobiles number"
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
              onChange({ whatsappNumber: val });
            }}
            className={`w-full px-3.5 py-2.5 rounded-md border text-gray-900 text-sm shadow-xs transition-all ${
              shaking.whatsappNumber ? 'animate-shake' : ''
            } ${
              errors.whatsappNumber
                ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200 focus:ring-red-400'
                : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500'
            }`}
            required
          />
        </div>
        {errors.whatsappNumber && (
          <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> कृपया १० अंकी मोबाईल नंबर टाका (10 digits Required)
          </p>
        )}
      </div>
    </div>
  );
};

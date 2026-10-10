import React from 'react';
import { AlertCircle } from 'lucide-react';

interface AddressEnglishSectionProps {
  addressEn?: string;
  villageEn?: string;
  tehsilEn?: string;
  districtEn?: string;
  pincode?: string;
  errors?: Record<string, boolean>;
  shaking?: Record<string, boolean>;
  onChange: (fields: Partial<{
    addressEn: string;
    villageEn: string;
    tehsilEn: string;
    districtEn: string;
    pincode: string;
  }>) => void;
  onCopyOrTranslateToMarathi?: () => void;
}

export const AddressEnglishSection: React.FC<AddressEnglishSectionProps> = ({
  addressEn,
  errors = {},
  shaking = {},
  onChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-2">
        <h2 className="text-xl font-bold text-[#2e7d32]">Address Information (English)</h2>
      </div>

      {/* Address In English (Direct from PDF) */}
      <div id="field-addressEn">
        <label className="block text-sm font-semibold text-gray-800 mb-1.5">
          Address In English (PDF मधील संपूर्ण पत्ता) <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={2}
          value={addressEn || ''}
          placeholder="e.g. AT. SOMTHANA POST. MOHAJA TQ MALEGAON DIST.WASHIM"
          onChange={(e) => onChange({ addressEn: e.target.value })}
          className={`w-full px-3.5 py-2.5 rounded-md border text-gray-900 text-sm shadow-xs uppercase font-medium resize-none transition-all ${
            shaking.addressEn ? 'animate-shake' : ''
          } ${
            errors.addressEn
              ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200 focus:ring-red-400'
              : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500'
          }`}
          required
        />
        {errors.addressEn && (
          <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> कृपया इंग्रजी पत्ता भरा (Address Required)
          </p>
        )}
      </div>
    </div>
  );
};

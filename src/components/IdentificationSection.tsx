import React from 'react';
import { AlertCircle, CheckCircle2, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { AGRISTACK_LOGO, AGRISTACK_LOGO_URL } from '../assets/agriStackLogo';
import { FARMER_ID_BLANK_TEMPLATE, FARMER_ID_BLANK_TEMPLATE_URL } from '../assets/farmerIdBlankTemplate';

interface IdentificationSectionProps {
  aadhaarNumber: string;
  farmerId: string;
  errors?: Record<string, boolean>;
  shaking?: Record<string, boolean>;
  onChange: (fields: Partial<{ aadhaarNumber: string; farmerId: string }>) => void;
}

export const IdentificationSection: React.FC<IdentificationSectionProps> = ({
  aadhaarNumber,
  farmerId,
  errors = {},
  shaking = {},
  onChange,
}) => {
  const handleAadhaarChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 12);
    const formatted = clean.replace(/(\d{4})(?=\d)/g, '$1 ');
    onChange({ aadhaarNumber: formatted });
  };

  const handleFarmerIdChange = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
    onChange({ farmerId: clean });
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-2">
        <h2 className="text-xl font-bold text-[#2e7d32]">Identification Numbers</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Aadhaar Number */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-gray-800">
              Aadhaar Number (UID) <span className="text-gray-500 font-normal text-xs">(ऐच्छिक / नसल्यास रिकामा ठेवा)</span>
            </label>
            {aadhaarNumber && (
              <button
                type="button"
                onClick={() => onChange({ aadhaarNumber: '' })}
                className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline cursor-pointer"
              >
                रिकामा करा (Clear)
              </button>
            )}
          </div>
          <div className="relative">
            <input
              type="text"
              value={aadhaarNumber}
              placeholder="उपलब्ध असल्यास १२ अंकी आधार क्रमांक टाका (किंवा रिकामा ठेवा)"
              onChange={(e) => handleAadhaarChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 text-sm shadow-xs font-mono"
            />
          </div>
        </div>

        {/* Farmer ID Number */}
        <div id="field-farmerId">
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Farmer ID Number (उदा. 49488379429) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={farmerId}
            placeholder="उदा. 49488379429"
            maxLength={11}
            onChange={(e) => handleFarmerIdChange(e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-md border text-gray-900 text-sm shadow-xs font-mono transition-all ${
              shaking.farmerId ? 'animate-shake' : ''
            } ${
              errors.farmerId
                ? 'border-red-500 bg-red-50/20 ring-2 ring-red-200 focus:ring-red-400'
                : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500'
            }`}
            required
          />
          {errors.farmerId && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> कृपया शेतकरी आयडी टाका (Farmer ID Required)
            </p>
          )}
        </div>
      </div>

      {/* Official Farmer ID Card Template Indicator */}
      <div className="bg-emerald-50/80 border-2 border-emerald-300 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-lg border border-emerald-300 shadow-2xs shrink-0 flex items-center justify-center w-20 h-13 overflow-hidden">
            <img
              src={FARMER_ID_BLANK_TEMPLATE}
              alt="Farmer ID Blank Template"
              className="w-full h-full object-cover rounded-xs"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              नवीन अधिकृत Farmer ID Card टेम्प्लेट सक्रिय (Template Active)
            </div>
            <div className="text-[11px] text-emerald-800 font-medium mt-0.5">
              शेती परिचय पत्र थेट तुमच्या दिलेल्या ब्लँक टेम्प्लेट व डिझाइननुसार प्रिंट व डाऊनलोड होईल
            </div>
          </div>
        </div>
        <a
          href={FARMER_ID_BLANK_TEMPLATE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 bg-white hover:bg-emerald-100/70 px-3 py-1.5 rounded-lg border border-emerald-300 shadow-2xs transition-colors shrink-0"
        >
          <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
          मूळ टेम्प्लेट पाहा
          <ExternalLink className="w-3 h-3 text-emerald-700" />
        </a>
      </div>
    </div>
  );
};

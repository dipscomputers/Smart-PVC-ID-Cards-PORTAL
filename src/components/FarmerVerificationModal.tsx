import React from 'react';
import { X, CheckCircle2, ShieldCheck, MapPin, Calendar, Award, Phone, ExternalLink } from 'lucide-react';
import { FarmerFormData } from '../types/form';

interface FarmerVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: FarmerFormData;
}

export const FarmerVerificationModal: React.FC<FarmerVerificationModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-emerald-200 animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white">
              <ShieldCheck className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">
                शासकीय कृषी पडताळणी पोर्टल
              </span>
              <h3 className="text-lg font-black text-white">
                शेतकरी डिजिटल ओळखपत्र पडताळणी
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Status Banner */}
        <div className="bg-emerald-50 border-b border-emerald-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-black text-emerald-950 flex items-center gap-1.5">
              <span>अधिकृत व सक्रिय शेतकरी (ACTIVE & VERIFIED)</span>
              <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-full text-[10px] font-black">
                100% Genuine
              </span>
            </div>
            <p className="text-xs text-emerald-800 font-medium mt-0.5">
              हे ओळखपत्र कृषी विभाग व महसूल रेकॉर्डशी जोडलेले असून शासकीय अनुदानासाठी वैध आहे.
            </p>
          </div>
        </div>

        {/* Verified Details */}
        <div className="p-5 space-y-4 text-gray-800">
          {/* Farmer Profile Head */}
          <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-16 h-20 rounded-lg overflow-hidden border border-gray-300 bg-white shrink-0">
              {data.photoUrl ? (
                <img src={data.photoUrl} alt="Photo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-xs text-gray-400">
                  PHOTO
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-base font-black text-gray-900 truncate">
                {data.fullNameMr || data.fullNameEn}
              </div>
              <div className="text-xs font-mono font-bold text-gray-600 truncate">
                {data.fullNameEn}
              </div>
              <div className="mt-1 flex flex-wrap gap-2 text-xs">
                <span className="font-mono font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  ID: {data.farmerId || '803 68 73 81 90'}
                </span>
                <span className="font-mono text-gray-600 bg-gray-200 px-2 py-0.5 rounded">
                  Aadhaar: {data.aadhaarNumber ? `XXXX-XXXX-${data.aadhaarNumber.slice(-4)}` : 'XXXX-XXXX-8747'}
                </span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-white rounded-lg border border-gray-200">
              <span className="text-gray-500 font-bold block">गाव व तालुका:</span>
              <span className="font-black text-gray-900">
                {data.villageMr || data.villageEn || 'सोमठाणा'}, {data.tehsilMr || data.tehsilEn || 'मालेगाव'}
              </span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-gray-200">
              <span className="text-gray-500 font-bold block">जिल्हा:</span>
              <span className="font-black text-gray-900">
                {data.districtMr || data.districtEn || 'वाशिम'}
              </span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-gray-200">
              <span className="text-gray-500 font-bold block">गट क्र. / Khasra:</span>
              <span className="font-black text-emerald-800 font-mono">
                {data.lands?.[0]?.gatNo || '126'} (क्षेत्र: {data.lands?.[0]?.areaHaR || '1.06'} हे.आर)
              </span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-gray-200">
              <span className="text-gray-500 font-bold block">डीबीटी स्थिती (DBT Status):</span>
              <span className="font-black text-green-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> थेट लाभ सक्रिय (Active)
              </span>
            </div>
          </div>

          {/* Verification Meta */}
          <div className="bg-slate-100 rounded-lg p-3 text-[11px] text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">पडताळणी वेळ (Timestamp):</span>
              <span className="font-mono font-bold text-gray-800">{new Date().toLocaleString('mr-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">अर्ज नोंदणी क्रमांक:</span>
              <span className="font-mono font-bold text-gray-800">{data.applicationNo || 'MH-AGRI-2026-803687'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">अधिकृत केंद्र:</span>
              <span className="font-bold text-emerald-800">दिप्स कॉम्प्युटर्स (DIPs Computers)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-sm cursor-pointer"
          >
            पूर्ण झाले (Done)
          </button>
        </div>
      </div>
    </div>
  );
};

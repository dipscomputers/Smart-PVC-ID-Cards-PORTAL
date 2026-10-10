import React from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Copy, 
  RotateCcw,
  Printer,
  Sparkles,
  Layers
} from 'lucide-react';
import { FarmerFormData } from '../types/form';

interface FarmerListManagerProps {
  farmers: FarmerFormData[];
  activeFarmerIndex: number;
  onSelectFarmer: (index: number) => void;
  onAddFarmer: () => void;
  onDuplicateFarmer: (index: number) => void;
  onDeleteFarmer: (index: number) => void;
  onOpenPrintModal: () => void;
  onResetScreenshot?: () => void;
}

export const FarmerListManager: React.FC<FarmerListManagerProps> = ({
  farmers,
  activeFarmerIndex,
  onSelectFarmer,
  onAddFarmer,
  onDuplicateFarmer,
  onDeleteFarmer,
  onOpenPrintModal,
  onResetScreenshot,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-emerald-900/10 p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#1e5631] flex items-center justify-center border border-emerald-100">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                शेतकरी कार्डे व्यवस्थापन (Multiple Farmer ID Cards)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                A4 5-PVC शीट लेआउट ({farmers.length}/5 कार्ड)
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              प्रत्येक A4 PVC शीटवर Front & Back अशी ५ कार्डे (१० बाजू) अचूक प्रिंट होतात
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {onResetScreenshot && (
            <button
              type="button"
              onClick={onResetScreenshot}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer border border-slate-300"
              title="स्क्रीनशॉटमधील २ शेतकरी कार्डे (दिलीप नरवाडे & भगवान खंदारे) रीलोड करा"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>मूळ २ कार्डे रीलोड करा</span>
            </button>
          )}

          {farmers.length < 5 && (
            <button
              type="button"
              onClick={onAddFarmer}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1e5631] hover:bg-[#164325] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              title="नवीन शेतकरी जोडा"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ शेतकरी जोडा ({farmers.length + 1}/5)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenPrintModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-emerald-950 rounded-lg text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95 border border-yellow-600"
            title="A4 5-PVC शीट लेआउट प्रिंट करा किंवा PDF डाऊनलोड करा"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-950" />
            <span>A4 5-PVC शीट प्रिंट ({farmers.length}/5 कार्ड)</span>
          </button>
        </div>
      </div>

      {/* Farmer Tabs / Chips list */}
      <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-1 scrollbar-thin">
        {farmers.map((farmer, index) => {
          const isActive = index === activeFarmerIndex;
          const displayName = farmer.fullNameMr || farmer.fullNameEn || `शेतकरी ${index + 1}`;
          const isComplete = Boolean(farmer.fullNameMr || farmer.fullNameEn) && Boolean(farmer.farmerId || farmer.aadhaarNumber);

          return (
            <div
              key={farmer.id || index}
              className={`group relative flex items-center gap-2 pl-3 pr-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                isActive
                  ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
              }`}
              onClick={() => onSelectFarmer(index)}
            >
              {/* Status avatar or icon */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                  isActive
                    ? 'bg-white text-emerald-900'
                    : isComplete
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>

              {/* Name & ID preview */}
              <div className="flex flex-col text-left max-w-[140px] sm:max-w-[170px] truncate">
                <span className="truncate leading-tight">{displayName}</span>
                <span className={`text-[10px] opacity-75 truncate ${isActive ? 'text-emerald-100' : 'text-gray-500'}`}>
                  {farmer.farmerId ? `ID: ${farmer.farmerId}` : farmer.villageMr || 'माहिती भरा'}
                </span>
              </div>

              {/* Action Buttons for Card */}
              <div className="flex items-center gap-0.5 ml-1">
                {/* Duplicate / Clone button */}
                {farmers.length < 5 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateFarmer(index);
                    }}
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      isActive
                        ? 'hover:bg-emerald-700 text-emerald-200 hover:text-white'
                        : 'hover:bg-gray-200 text-gray-400 hover:text-gray-700'
                    }`}
                    title="या शेतकऱ्याचा पत्ता/जमीन माहिती कॉपी करून नवीन जोडा"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Delete button (if > 1) */}
                {farmers.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFarmer(index);
                    }}
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      isActive
                        ? 'hover:bg-red-700 text-red-200 hover:text-white'
                        : 'hover:bg-red-100 text-gray-400 hover:text-red-600'
                    }`}
                    title="हा शेतकरी कार्ड यादीतून काढा"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Plus Button */}
        {farmers.length < 5 && (
          <button
            type="button"
            onClick={onAddFarmer}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#1e5631] bg-emerald-50 hover:bg-emerald-100 border border-dashed border-emerald-300 transition-colors cursor-pointer shrink-0"
            title="नवीन शेतकरी जोडा"
          >
            <Plus className="w-4 h-4" />
            <span>+ शेतकरी जोडा ({farmers.length + 1}/5)</span>
          </button>
        )}
      </div>
    </div>
  );
};

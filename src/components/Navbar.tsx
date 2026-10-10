import React from 'react';
import { CreditCard, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: 'farmer-id' | 'maha-id';
  onTabChange: (tab: 'farmer-id' | 'maha-id') => void;
  onOpenPdfModal?: () => void;
  onPrint?: () => void;
  onLoadDemo?: () => void;
  onReset?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs no-print">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1e5631] text-white flex items-center justify-center font-black text-xs shadow-xs text-center leading-tight tracking-wider">
            <span>DIPs</span>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
              DIPs Computers
            </h1>
            <p className="text-xs text-emerald-800 font-semibold tracking-wide">
              9049102035, 8888732035
            </p>
          </div>
        </div>

        {/* Right: Main Module Tabs (Farmer ID & MAHA ID) */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
          <button
            type="button"
            onClick={() => onTabChange('farmer-id')}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeTab === 'farmer-id'
                ? 'bg-[#1e5631] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-300" />
            <span>Farmer ID</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('maha-id')}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeTab === 'maha-id'
                ? 'bg-[#b45309] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>MAHA ID</span>
          </button>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { Menu, Globe, Phone, Sun, Moon, Keyboard } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useShortcuts } from '../context/ShortcutsContext';

interface TopNavbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onToggleSidebar,
  isSidebarOpen,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const { openHelp } = useShortcuts();

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-40 shadow-2xs no-print transition-colors duration-200">
      <div className="w-full px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Hamburger Button + Shop Seal Branding */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Hamburger toggle button (Exact green square from image.png) */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="w-10 h-10 rounded-lg bg-[#1e473d] hover:bg-[#16372f] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
            title={isSidebarOpen ? "मेनू बंद करा" : "मेनू उघडा"}
          >
            <Menu className="w-5 h-5 text-white" />
          </button>

          {/* Shop Seal Logo (University / Government Style Seal) */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full border-2 border-amber-600 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/60 dark:to-amber-900/40 flex items-center justify-center text-amber-900 dark:text-amber-300 font-black text-xs shadow-xs text-center leading-tight tracking-wider shrink-0">
              <span className="text-[10px] font-black">DIPs</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm sm:text-base font-black text-gray-900 dark:text-slate-100 leading-tight">
                दिप्स कॉम्प्युटर्स
              </h1>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 font-semibold tracking-tight">
                शिरपूर जैन, ता. मालेगाव जि. वाशिम 444504
              </p>
            </div>
          </div>
        </div>

        {/* Center: OASIS-Style Portal Header (Exact from image.png) */}
        <div className="text-center flex-1 hidden md:block">
          <h2 className="text-base sm:text-lg font-black text-[#1e473d] dark:text-emerald-400 tracking-widest uppercase">
            DIPs PORTAL
          </h2>
          <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
            Online Smart PVC ID Cards & Citizen Services System
          </p>
        </div>

        {/* Right: Shortcuts + Theme Toggle + Language Dropdown + Red Pill Contact Button */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Keyboard Shortcuts Cheat Sheet Button */}
          <button
            type="button"
            onClick={openHelp}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-800 shadow-2xs active:scale-95"
            title="कीबोर्ड शॉर्टकट्स मार्गदर्शक (Press ? or F1)"
          >
            <Keyboard className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span className="hidden md:inline">शॉर्टकट्स</span>
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-[10px] font-mono font-black border border-emerald-300 dark:border-emerald-700 shadow-2xs">
              ?
            </kbd>
          </button>

          {/* Quick Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-amber-300 dark:border-slate-700 shadow-2xs active:scale-95"
            title={isDark ? "लाईट मोड सुरू करा (Switch to Light Mode)" : "डार्क मोड सुरू करा (Switch to Dark Mode)"}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">लाईट मोड</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-700" />
                <span className="hidden sm:inline">डार्क मोड</span>
              </>
            )}
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-slate-700 rounded-md text-xs font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 shadow-2xs">
            <Globe className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
            <span>मराठी / English</span>
          </div>

          <a
            href="tel:9049102035"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#c22d2d] hover:bg-[#a62222] text-white rounded-md text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
            title="दिपक खंदारे (पाटील) - 9049102035"
          >
            <Phone className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">9049102035</span>
            <span className="sm:hidden">संपर्क</span>
          </a>
        </div>
      </div>
    </header>
  );
};

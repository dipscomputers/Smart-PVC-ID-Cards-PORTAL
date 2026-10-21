import React, { useState } from 'react';
import { Menu, Phone, Sun, Moon, Keyboard, LogOut, KeyRound, UserCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useShortcuts } from '../context/ShortcutsContext';
import { useAuth } from '../context/AuthContext';
import { ChangePasswordModal } from './ChangePasswordModal';

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
  const { user, logout } = useAuth();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  return (
    <>
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs no-print transition-colors duration-200">
        <div className="w-full px-2 sm:px-4 lg:px-6 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
          
          {/* Top Row / Left Section: Hamburger + Custom Logo & Shop Title */}
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2.5 shrink-0">
            <div className="flex items-center gap-2.5">
              {/* Hamburger toggle button */}
              <button
                type="button"
                onClick={onToggleSidebar}
                className="w-9 h-9 rounded-lg bg-[#1e473d] hover:bg-[#16372f] text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
                title={isSidebarOpen ? "मेनू बंद करा" : "मेनू उघडा"}
              >
                <Menu className="w-5 h-5 text-white" />
              </button>

              {/* Custom Logo Image */}
              <img
                src="https://blogger.googleusercontent.com/img/a/AVvXsEgnbNMNM_EqpDyQSqW9ncSuuuTWPL4O3qTCxY6bRvfwp5r83CtUsP0FYf19hveo9KcTlvujYd5Wobnjz1nRO0-ZolOim5gRImhZQmhKHIWcrqKf6RDoQVoYwrgUxT0a6SPdBs975K3dLArV9nocqTXzCaJ92561kvcyQXbbvUSh5TwkHp7wSixT1fs-kDAR=s1600"
                alt="दिप्स कॉम्प्युटर्स लोगो"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-contain bg-white p-0.5 border border-amber-500/60 shadow-2xs shrink-0"
              />

              <div>
                <h1 className="text-sm sm:text-base font-black text-gray-900 dark:text-slate-100 leading-tight">
                  DIPs Computers
                </h1>
                <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-slate-400 font-semibold tracking-tight">
                  Shirpur Jain, Malegaon
                </p>
              </div>
            </div>

            {/* Mobile Header Portal Badge */}
            <div className="sm:hidden text-right">
              <span className="text-xs font-black text-[#1e473d] dark:text-emerald-400 tracking-wider">
                DIPs PORTAL
              </span>
            </div>
          </div>

          {/* Center: Desktop Portal Sub-Header */}
          <div className="text-center flex-1 hidden md:block">
            <h2 className="text-sm sm:text-base font-black text-[#1e473d] dark:text-emerald-400 tracking-widest uppercase">
              DIPs PORTAL
            </h2>
            <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">
              Online Smart PVC ID Cards & Citizen Services System
            </p>
          </div>

          {/* Right Section: Exact Styled Pill Buttons matching image_344245ff.png */}
          <div className="w-full sm:w-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none shrink-0 justify-start sm:justify-end">
            
            {/* 1. Operator Profile Pill (Matches exact green outline pill in image_344245ff.png) */}
            {user && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold whitespace-nowrap shadow-2xs">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{user.name}</span>
              </div>
            )}

            {/* 2. Password Change Pill (Matches exact light blue outline pill in image_344245ff.png) */}
            <button
              type="button"
              onClick={() => setIsChangePasswordOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold whitespace-nowrap shadow-2xs cursor-pointer transition-all active:scale-95"
              title="पासवर्ड बदला (Change Password)"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>पासवर्ड बदला</span>
            </button>

            {/* 3. Logout Pill - Prominent & Visible on Mobile & Desktop (Matches exact red pill in image_344245ff.png) */}
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/80 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold whitespace-nowrap shadow-2xs cursor-pointer transition-all active:scale-95"
              title="लॉगआउट करा (Logout)"
            >
              <LogOut className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
              <span>लॉगआऊट</span>
            </button>

            {/* 4. Shortcuts Pill (Matches green pill with [?] in image_344245ff.png) */}
            <button
              type="button"
              onClick={openHelp}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold whitespace-nowrap shadow-2xs cursor-pointer transition-all active:scale-95"
              title="कीबोर्ड शॉर्टकट्स मार्गदर्शक (Press ? or F1)"
            >
              <Keyboard className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span className="hidden xs:inline">शॉर्टकट्स</span>
              <kbd className="px-1 py-0.2 bg-white dark:bg-slate-800 rounded text-[10px] font-mono font-black border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                ?
              </kbd>
            </button>

            {/* 5. Theme Toggle Pill (Matches light blue pill in image_344245ff.png) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold whitespace-nowrap shadow-2xs cursor-pointer transition-all active:scale-95"
              title={isDark ? "लाईट मोड सुरू करा" : "डार्क मोड सुरू करा"}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="hidden xs:inline">लाईट मोड</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 shrink-0" />
                  <span className="hidden xs:inline">डार्क मोड</span>
                </>
              )}
            </button>

            {/* 6. Contact Phone Red Pill (Matches exact red phone pill in image_344245ff.png) */}
            <a
              href="tel:9049102035"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#c22d2d] hover:bg-[#a62222] text-white rounded-full text-xs font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="दिपक खंदारे (पाटील) - 9049102035"
            >
              <Phone className="w-3.5 h-3.5 text-white shrink-0" />
              <span>9049102035</span>
            </a>
          </div>

        </div>
      </header>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </>
  );
};

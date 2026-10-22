import React, { useState, useRef, useEffect } from 'react';
import { Menu, Phone, Sun, Moon, Keyboard, LogOut, KeyRound, UserCheck, ChevronDown, HelpCircle, Shield, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useShortcuts } from '../context/ShortcutsContext';
import { useAuth } from '../context/AuthContext';
import { ChangePasswordModal } from './ChangePasswordModal';
import { UserProfileModal } from './UserProfileModal';

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  return (
    <>
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs no-print transition-colors duration-200">
        <div className="w-full px-2 sm:px-4 lg:px-6 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
          
          {/* Left Section: Hamburger + Custom Logo & Shop Title */}
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

          {/* Right Section: Header Controls & Profile Avatar Dropdown (No overflow clip) */}
          <div className="w-full sm:w-auto flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0 justify-start sm:justify-end relative">
            
            {/* Shortcuts Pill */}
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

            {/* Theme Toggle Pill */}
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


            {/* Profile Avatar Trigger & Dropdown Menu (Matches image_8a235c47.png design in clean English) */}
            {user && (
              <div className="relative shrink-0 ml-1" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1 sm:px-3 sm:py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-700 transition-all cursor-pointer shadow-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50 group"
                  aria-expanded={isDropdownOpen}
                  title="Operator Profile Menu"
                >
                  {/* Profile Avatar Circle with Ring */}
                  <div className="relative w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-xs border-2 border-emerald-400 dark:border-emerald-500 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                    <User className="w-4.5 h-4.5 text-white/90" />
                    <img
                      src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjInPvqJ1dHyCflTorZ2IV7yQMsJ5d2WiA65otxZsReK0RKZfHhdm4_I3w97X2ku0w-sijAkj17eFZBaLAbJj0Jqzrs8qGv76G2e0ReEDn89TnlRcZqcdWwlU2EkXuJihUK1dhZNoFNIWNVvSeI_1xSwcNuyTQtocDuRNZwe5iW1yloT8cUeH6BLF70C5Rs/s814/file_enhanced.jpg"
                      alt={user.name}
                      className="absolute inset-0 w-full h-full object-cover object-center rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <span className="text-xs font-black text-emerald-950 dark:text-emerald-100 max-w-[130px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-emerald-700 dark:text-emerald-300 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Popover Card (Sleek Clean Design in English) */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200/90 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800/80 flex items-center gap-3 bg-slate-50/60 dark:bg-slate-800/40">
                      <div className="relative w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-500 dark:border-emerald-600 flex items-center justify-center text-emerald-800 dark:text-emerald-300 font-black text-sm shrink-0 overflow-hidden shadow-xs">
                        <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <img
                          src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjInPvqJ1dHyCflTorZ2IV7yQMsJ5d2WiA65otxZsReK0RKZfHhdm4_I3w97X2ku0w-sijAkj17eFZBaLAbJj0Jqzrs8qGv76G2e0ReEDn89TnlRcZqcdWwlU2EkXuJihUK1dhZNoFNIWNVvSeI_1xSwcNuyTQtocDuRNZwe5iW1yloT8cUeH6BLF70C5Rs/s814/file_enhanced.jpg"
                          alt={user.name}
                          className="absolute inset-0 w-full h-full object-cover object-center rounded-full"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-black text-gray-900 dark:text-slate-100 truncate leading-tight">
                          {user.name}
                        </p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold truncate flex items-center gap-1.5 mt-0.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                          {user.shopName}
                        </p>
                      </div>
                    </div>

                    {/* Menu Options Section 1 */}
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsProfileOpen(true);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm font-bold text-gray-800 dark:text-slate-200 hover:bg-emerald-50/80 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <UserCheck className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span>Profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsChangePasswordOpen(true);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm font-bold text-gray-800 dark:text-slate-200 hover:bg-emerald-50/80 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <KeyRound className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                        <span>Change Password</span>
                      </button>
                    </div>

                    <div className="border-t border-gray-100 dark:border-slate-800/80 my-1"></div>

                    {/* Menu Options Section 2 */}
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          openHelp();
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm font-bold text-gray-800 dark:text-slate-200 hover:bg-emerald-50/80 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <HelpCircle className="w-4.5 h-4.5 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform" />
                        <span>Guide & Shortcuts</span>
                      </button>

                      <a
                        href="tel:9049102035"
                        onClick={() => setIsDropdownOpen(false)}
                        className="w-full px-4 py-2.5 text-left text-sm font-bold text-gray-800 dark:text-slate-200 hover:bg-emerald-50/80 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <Phone className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span>Help Center (9049102035)</span>
                      </a>
                    </div>

                    <div className="border-t border-gray-100 dark:border-slate-800/80 my-1"></div>

                    {/* Menu Options Section 3: Logout */}
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          logout();
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <LogOut className="w-4.5 h-4.5 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform" />
                        <span>Logout</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </header>

      {/* Operator User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onChangePasswordOpen={() => setIsChangePasswordOpen(true)}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </>
  );
};



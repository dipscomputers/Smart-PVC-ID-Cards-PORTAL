import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Sprout, 
  ShieldCheck, 
  Fingerprint, 
  CreditCard,
  Vote,
  FileText,
  User,
  Phone,
  X,
  Camera,
  ScrollText,
  Sun,
  Moon,
  Monitor,
  Wheat,
  HeartPulse,
  ShieldPlus,
  HardHat,
  MessageSquare,
  Maximize2,
  QrCode,
  LogOut
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export type PortalTab = 'dashboard' | 'farmer-id' | 'passport-photo' | 'photo-resizes' | 'whatsapp-print' | 'my-qr-payment' | 'maha-id' | 'adhar-card' | 'pan-card' | 'electoral-card' | 'mera-rashan-card' | 'ayushman-card' | 'abha-card' | 'eshram-card' | 'pocra-consent' | 'swayam-ghoshana';

interface SidebarProps {
  activeTab: PortalTab;
  onTabChange: (tab: PortalTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

// Default profile avatar image provided by user
const DEFAULT_FARMER_AVATAR = 'https://blogger.googleusercontent.com/img/a/AVvXsEgnbNMNM_EqpDyQSqW9ncSuuuTWPL4O3qTCxY6bRvfwp5r83CtUsP0FYf19hveo9KcTlvujYd5Wobnjz1nRO0-ZolOim5gRImhZQmhKHIWcrqKf6RDoQVoYwrgUxT0a6SPdBs975K3dLArV9nocqTXzCaJ92561kvcyQXbbvUSh5TwkHp7wSixT1fs-kDAR=s1600';

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpen,
  onClose,
}) => {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const [profilePhoto, setProfilePhoto] = useState<string>(() => {
    const saved = localStorage.getItem('dips_farmer_profile_photo');
    // If saved photo is empty or the old unsplash link, use the new custom user profile photo
    if (!saved || saved.includes('images.unsplash.com')) {
      return DEFAULT_FARMER_AVATAR;
    }
    return saved;
  });

  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setProfilePhoto(result);
          try {
            localStorage.setItem('dips_farmer_profile_photo', result);
          } catch (err) {
            console.warn('Could not save avatar to localStorage:', err);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const menuItems = [
    {
      id: 'dashboard' as PortalTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'my-qr-payment' as PortalTab,
      label: 'My QR payment',
      icon: QrCode,
    },
    {
      id: 'farmer-id' as PortalTab,
      label: 'Farmer ID Card',
      icon: Sprout,
    },
    {
      id: 'passport-photo' as PortalTab,
      label: 'Passport Photo',
      icon: Camera,
    },
    {
      id: 'photo-resizes' as PortalTab,
      label: 'Photo & PDF Resizer',
      icon: Maximize2,
    },
    {
      id: 'whatsapp-print' as PortalTab,
      label: 'Whatsapp Print',
      icon: MessageSquare,
    },
    {
      id: 'maha-id' as PortalTab,
      label: 'Maha ID Card',
      icon: ShieldCheck,
    },
    {
      id: 'adhar-card' as PortalTab,
      label: 'Adhar Card',
      icon: Fingerprint,
    },
    {
      id: 'pan-card' as PortalTab,
      label: 'Pan Card',
      icon: CreditCard,
    },
    {
      id: 'electoral-card' as PortalTab,
      label: 'Electoral Card',
      icon: Vote,
    },
    {
      id: 'mera-rashan-card' as PortalTab,
      label: 'Rashan Card',
      icon: Wheat,
    },
    {
      id: 'ayushman-card' as PortalTab,
      label: 'Ayushman Card',
      icon: ShieldPlus,
    },
    {
      id: 'abha-card' as PortalTab,
      label: 'Abha Card',
      icon: HeartPulse,
    },
    {
      id: 'eshram-card' as PortalTab,
      label: 'E Shram Card',
      icon: HardHat,
    },
    {
      id: 'pocra-consent' as PortalTab,
      label: 'PoCRA Consent Letter',
      icon: FileText,
    },
    {
      id: 'swayam-ghoshana' as PortalTab,
      label: 'स्वयंघोषणापत्र',
      icon: ScrollText,
    },
  ];

  return (
    <>
      <input
        type="file"
        ref={photoInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-2xs no-print"
        />
      )}

      {/* Sidebar Container (Exact pine green #1e473d, dark slate in dark mode) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#1e473d] dark:bg-slate-900 text-white dark:border-r dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-30 no-print shadow-xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Top Profile Section */}
          <div className="p-6 pt-7 text-center border-b border-white/10 dark:border-slate-800 relative">
            {/* Close button on mobile */}
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden absolute right-3 top-3 p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Full Logo Avatar Display (No Borders, Full Visibility, No Hover Change Button) */}
            <div className="w-24 h-24 mx-auto mb-3 flex items-center justify-center">
              {profilePhoto && profilePhoto.trim() !== '' ? (
                <img
                  src={profilePhoto}
                  alt="DIPs Computers Logo"
                  className="w-full h-full object-contain p-0.5 drop-shadow-md"
                  onError={() => setProfilePhoto(DEFAULT_FARMER_AVATAR)}
                />
              ) : (
                <User className="w-12 h-12 text-white/90" />
              )}
            </div>

            {/* दिप्स कॉम्प्युटर्स & दिपक मा. खंदारे (पाटील) */}
            <div className="space-y-1">
              <h2 className="text-base font-black text-white tracking-wide">
                दिप्स कॉम्प्युटर्स
              </h2>
              <p className="text-xs text-emerald-200 dark:text-emerald-400 font-bold leading-tight">
                दिपक मा. खंदारे (पाटील)
              </p>

              {/* Mobile Badge */}
              <div className="pt-1.5 pb-0.5">
                <a
                  href="tel:9049102035"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-black/30 hover:bg-black/40 text-emerald-200 dark:text-emerald-300 hover:text-white font-mono text-xs font-bold tracking-wider border border-white/15 dark:border-slate-700 transition-colors"
                  title="कॉल करा: 9049102035"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>9049102035</span>
                </a>
              </div>
            </div>
          </div>

          {/* Navigation Menu List */}
          <nav className="p-3 space-y-1.5 mt-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onTabChange(item.id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-[#1e473d] dark:text-emerald-400 shadow-md font-black translate-x-1 ring-1 ring-transparent dark:ring-slate-700/60'
                      : 'text-white/85 dark:text-slate-300 hover:text-white hover:bg-white/10 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? 'text-[#1e473d] dark:text-emerald-400' : 'text-emerald-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Footer: Shop Address, Theme Switcher, Logout & Copyright */}
        <div className="p-4 border-t border-white/10 dark:border-slate-800 text-center space-y-2.5 bg-black/20 dark:bg-slate-950/60">
          {/* Prominent Sidebar Logout Button */}
          <button
            type="button"
            onClick={logout}
            className="w-full py-2 px-3 bg-red-600/90 hover:bg-red-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-white" />
            <span>लॉगआऊट करा (Logout)</span>
          </button>

          {/* Quick Theme Switcher */}
          <div className="flex items-center justify-center gap-1 bg-black/35 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                theme === 'light' ? 'bg-white text-slate-900 shadow-xs' : 'text-white/70 hover:text-white'
              }`}
              title="लाईट थीम"
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                theme === 'dark' ? 'bg-slate-900 text-amber-300 shadow-xs ring-1 ring-amber-400/30' : 'text-white/70 hover:text-white'
              }`}
              title="डार्क थीम"
            >
              <Moon className="w-3.5 h-3.5 text-amber-400" />
              <span>Dark</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                theme === 'system' ? 'bg-white/20 text-white shadow-xs' : 'text-white/70 hover:text-white'
              }`}
              title="सिस्टम ऑटो थीम"
            >
              <Monitor className="w-3.5 h-3.5 text-slate-200" />
              <span>Auto</span>
            </button>
          </div>

          <p className="text-[11px] text-white/80 font-bold">
            🖥 दिप्स कॉम्प्युटर्स
          </p>
          <p className="text-[10px] text-emerald-200 leading-tight">
            येवले कॉम्प्लेक्स, बँक ऑफ महाराष्ट्रच्या मागे,<br />
            शिरपूर जैन, ता. मालेगाव जि. वाशिम 444504
          </p>
          <p className="text-[9px] text-white/50 pt-0.5 font-mono">
            © DIPs Computers 2026
          </p>
        </div>
      </aside>
    </>
  );
};

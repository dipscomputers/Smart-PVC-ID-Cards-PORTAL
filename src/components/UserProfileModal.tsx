import React, { useState, useRef } from 'react';
import { X, UserCheck, ShieldCheck, Phone, MapPin, Building2, KeyRound, LogOut, Camera, Sparkles, CheckCircle2, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playClickSound, playSuccessChime } from '../utils/soundEffects';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChangePasswordOpen: () => void;
}

const DEFAULT_OPERATOR_AVATAR = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjInPvqJ1dHyCflTorZ2IV7yQMsJ5d2WiA65otxZsReK0RKZfHhdm4_I3w97X2ku0w-sijAkj17eFZBaLAbJj0Jqzrs8qGv76G2e0ReEDn89TnlRcZqcdWwlU2EkXuJihUK1dhZNoFNIWNVvSeI_1xSwcNuyTQtocDuRNZwe5iW1yloT8cUeH6BLF70C5Rs/s814/file_enhanced.jpg';

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onChangePasswordOpen,
}) => {
  const { user, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatar, setAvatar] = useState<string>(() => {
    return localStorage.getItem('dips_operator_avatar') || DEFAULT_OPERATOR_AVATAR;
  });

  const [copiedStatus, setCopiedStatus] = useState(false);

  if (!isOpen || !user) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      playClickSound();
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setAvatar(result);
          localStorage.setItem('dips_operator_avatar', result);
          playSuccessChime();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyDetails = () => {
    playClickSound();
    const text = `DIPs Computers Operator Profile\nName: ${user.name}\nShop: ${user.shopName}\nMobile: ${user.mobile}\nAddress: Shirpur Jain, Malegaon, Washim`;
    navigator.clipboard.writeText(text);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn select-none font-sans">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#1e473d] via-[#16372f] to-[#1e473d] text-white p-5 px-6 flex items-center justify-between relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shadow-md border border-amber-300">
              <UserCheck className="w-5 h-5 text-emerald-950" />
            </div>
            <div>
              <h3 className="text-base font-black text-white leading-tight">ऑपरेटर प्रोफाईल (Operator Profile)</h3>
              <p className="text-xs text-emerald-200/80 font-medium">DIPs Computers • 2-Step Verified Active</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-emerald-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer relative z-10"
            title="बंद करा"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 space-y-6">
          
          {/* Avatar & Operator Main Header */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            {/* Avatar Image with Edit Badge */}
            <div className="relative group shrink-0 w-20 h-20 rounded-2xl border-2 border-emerald-500 shadow-md bg-emerald-100 flex items-center justify-center overflow-hidden">
              <User className="w-8 h-8 text-emerald-700" />
              <img
                src={avatar}
                alt={user.name}
                className="absolute inset-0 w-full h-full object-cover object-center rounded-2xl"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-md cursor-pointer transition-transform group-hover:scale-110 z-10"
                title="प्रोफाईल फोटो बदला"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* Operator Main Labels */}
            <div className="text-center sm:text-left space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{user.role}</span>
              </div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">
                {user.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                {user.shopName} • शिरपूर जैन
              </p>
            </div>
          </div>

          {/* Detailed Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Shop Name */}
            <div className="p-3 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                दुकानाचे नाव (Shop Name)
              </span>
              <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                {user.shopName}
              </p>
            </div>

            {/* Mobile Contact */}
            <div className="p-3 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                मोबाईल नंबर (Mobile)
              </span>
              <a
                href={`tel:${user.mobile}`}
                className="font-extrabold text-blue-600 dark:text-blue-400 text-sm hover:underline block"
              >
                +91 {user.mobile}
              </a>
            </div>

            {/* User ID */}
            <div className="p-3 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                युझर आयडी (User ID)
              </span>
              <p className="font-mono font-black text-slate-900 dark:text-slate-100 text-sm">
                dips / dipscom / {user.mobile}
              </p>
            </div>

            {/* Location */}
            <div className="p-3 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                पत्ता (Address)
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                शिरपूर जैन, ता. मालेगाव जि. वाशिम
              </p>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Change Password Button */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onClose();
                onChangePasswordOpen();
              }}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-xl border border-slate-300 dark:border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-xs"
            >
              <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>पासवर्ड बदला (Change Password)</span>
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                logout();
              }}
              className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <LogOut className="w-4 h-4 text-white" />
              <span>लॉगआऊट करा (Logout)</span>
            </button>
          </div>

          {/* Copy Profile Text Footer */}
          <div className="pt-2 text-center border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleCopyDetails}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              {copiedStatus ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>कॉपी झाले!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>प्रोफाईल माहिती कॉपी करा</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

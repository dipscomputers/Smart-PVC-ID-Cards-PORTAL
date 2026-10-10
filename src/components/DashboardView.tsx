import React from 'react';
import { 
  Building2, 
  UserCheck, 
  Camera,
  MapPin, 
  Phone, 
  Printer, 
  Clock, 
  Info, 
  CreditCard, 
  ShieldCheck, 
  Fingerprint, 
  FileBadge,
  Vote,
  FileText,
  ArrowRight,
  Sparkles,
  Wheat,
  HeartPulse,
  ShieldPlus,
  HardHat
} from 'lucide-react';
import { PortalTab } from './Sidebar';

interface DashboardViewProps {
  onNavigate: (tab: PortalTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner for Maha ID & PVC Cards Generator */}
      <div className="bg-linear-to-r from-[#1e473d] via-[#16372f] to-[#0f2822] rounded-2xl p-5 sm:p-6 text-white shadow-lg border border-emerald-700/60 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
            <ShieldCheck className="w-7 h-7 text-yellow-300" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-400 text-emerald-950 font-black text-xs mb-1">
              <span>MahaSarathi • महा आयडी कार्ड जनरेटर</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              महा आयडी कार्ड (Maha ID Card Generator)
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 font-medium">
              MahaSarathi PDF थेट ऑटो-क्रॉप, पासवर्ड अनलॉक व अचूक PVC (85.6 × 54 mm) A4 प्रिंटिंग.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-end">
          <button
            type="button"
            onClick={() => onNavigate('maha-id')}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-emerald-950 rounded-xl font-black text-sm shadow-md transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Maha ID Card बनवा</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>

      {/* 1. OASIS-INSPIRED SHOP & OPERATOR PROFILE CARD (Matches image.png) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-gray-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        {/* Section Header */}
        <div className="border-b border-gray-100 dark:border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
              दिप्स कॉम्प्युटर्स - मुख्य माहिती केंद्र (Dashboard)
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              Online Smart PVC ID Cards & Citizen Services Center
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-bold">
            ● अधिकृत केंद्र (Active)
          </span>
        </div>

        {/* 6 Info Tiles in 3x2 Grid (Exact Layout from image.png) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Tile 1: Shop Name */}
          <div className="bg-slate-50/80 dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200/90 dark:border-slate-700/80 flex items-start gap-3.5 hover:shadow-xs transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-[#1e473d] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Building2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">
                केंद्र / शॉपचे नाव
              </div>
              <div className="text-sm sm:text-base font-black text-gray-900 dark:text-slate-100 truncate">
                दिप्स कॉम्प्युटर्स
              </div>
              <div className="text-xs text-gray-500 dark:text-slate-400 font-semibold">
                DIPs Computers
              </div>
            </div>
          </div>

          {/* Tile 2: Owner Name */}
          <div className="bg-slate-50/80 dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200/90 dark:border-slate-700/80 flex items-start gap-3.5 hover:shadow-xs transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-[#1e473d] text-white flex items-center justify-center shrink-0 shadow-xs">
              <UserCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">
                संचालक (Owner)
              </div>
              <div className="text-sm sm:text-base font-black text-gray-900 dark:text-slate-100 truncate">
                दिपक मा. खंदारे (पाटील)
              </div>
              <div className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                Dipak M. Khandare (Patil)
              </div>
            </div>
          </div>

          {/* Tile 3: Contact Mobile */}
          <div className="bg-slate-50/80 dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200/90 dark:border-slate-700/80 flex items-start gap-3.5 hover:shadow-xs transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-[#1e473d] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Phone className="w-5 h-5 text-sky-300" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">
                मोबाईल नंबर (Contact)
              </div>
              <div className="text-sm sm:text-base font-black text-gray-900 dark:text-slate-100 font-mono">
                9049102035
              </div>
              <div className="text-xs font-mono font-bold text-gray-600 dark:text-slate-300">
                8888732035
              </div>
            </div>
          </div>

          {/* Tile 4: Address */}
          <div className="bg-slate-50/80 dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200/90 dark:border-slate-700/80 flex items-start gap-3.5 hover:shadow-xs transition-shadow lg:col-span-2">
            <div className="w-10 h-10 rounded-lg bg-[#1e473d] text-white flex items-center justify-center shrink-0 shadow-xs">
              <MapPin className="w-5 h-5 text-rose-300" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">
                केंद्राचा संपूर्ण पत्ता (Address)
              </div>
              <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-slate-100 leading-snug">
                बँक ऑफ महाराष्ट्रच्या मागे, येवले कॉम्प्लेक्स, शिरपूर जैन, ता. मालेगाव जि. वाशिम - 444504
              </div>
              <div className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                Shirpur Jain, Tal. Malegaon, Dist. Washim 444504
              </div>
            </div>
          </div>

          {/* Tile 5: Working Hours */}
          <div className="bg-slate-50/80 dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200/90 dark:border-slate-700/80 flex items-start gap-3.5 hover:shadow-xs transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-[#1e473d] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-5 h-5 text-teal-300" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">
                कामाची वेळ (Timings)
              </div>
              <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-slate-100">
                सकाळी 8:00 ते रात्री 9:00
              </div>
              <div className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                सर्व दिवस सेवा सुरु
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner (Exact from image.png dashed verification box) */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-dashed border-emerald-300 dark:border-emerald-800 rounded-xl p-3.5 flex items-center gap-3 text-xs sm:text-sm text-emerald-900 dark:text-emerald-300">
          <Info className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <span>
            दिप्स कॉम्प्युटर्स पोर्टलवर आपले स्वागत आहे. डाव्या बाजूच्या मेनूमधून किंवा खालील कार्ड्समधून आवश्यक सेवा निवडा.
          </span>
        </div>
      </div>

      {/* 2. QUICK ACTION TILES: 6 CARD GENERATOR SERVICES */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-3 px-1">
          उपलब्ध PVC कार्ड सेवा (Available PVC Services)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Service 1: Farmer ID Card */}
          <div 
            onClick={() => onNavigate('farmer-id')}
            className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-emerald-500 hover:-translate-y-0.5"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <CreditCard className="w-6 h-6 text-emerald-800 dark:text-emerald-300" />
            </div>
            <h4 className="text-base font-black text-gray-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
              Farmer ID Card
            </h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed line-clamp-2">
              शेती परिचय पत्र, PDF ऑटो-फिल व 85.6 × 54 mm PVC स्मार्ट कार्ड.
            </p>
            <div className="flex items-center text-xs font-bold text-emerald-700 dark:text-emerald-400 group-hover:gap-1.5 transition-all">
              <span>कार्ड तयार करा</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Service: Passport Photo */}
          <div 
            onClick={() => onNavigate('passport-photo')}
            className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-teal-500 hover:-translate-y-0.5"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Camera className="w-6 h-6 text-teal-800 dark:text-teal-300" />
            </div>
            <h4 className="text-base font-black text-gray-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
              Passport Photo
            </h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed line-clamp-2">
              4×6 (12 फोटो) व A4 शीट प्रिंटिंग, एका क्लिकवर पासपोर्ट फोटो तयार करा.
            </p>
            <div className="flex items-center text-xs font-bold text-teal-700 dark:text-teal-400 group-hover:gap-1.5 transition-all">
              <span>फोटो तयार करा</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Service 2: Maha ID Card */}
          <div 
            onClick={() => onNavigate('maha-id')}
            className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-blue-500 hover:-translate-y-0.5"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-blue-800 dark:text-blue-300" />
            </div>
            <h4 className="text-base font-black text-gray-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
              Maha ID Card
            </h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed line-clamp-2">
              MahaSarathi PDF थेट ऑटो-क्रॉप, पासवर्ड अनलॉक व 85.6 × 54 mm PVC A4 प्रिंट.
            </p>
            <div className="flex items-center text-xs font-bold text-blue-700 dark:text-blue-400 group-hover:gap-1.5 transition-all">
              <span>कार्ड तयार करा</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Service 2: Adhar Card */}
          <div 
            onClick={() => onNavigate('adhar-card')}
            className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-indigo-500 hover:-translate-y-0.5"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Fingerprint className="w-6 h-6 text-indigo-800 dark:text-indigo-300" />
            </div>
            <h4 className="text-base font-black text-gray-900 dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
              Adhar Card
            </h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed line-clamp-2">
              e-Aadhaar PDF पासवर्ड अनलॉक, Front & Back PVC क्रॉप व 1-क्लिक A4 प्रिंटिंग.
            </p>
            <div className="flex items-center text-xs font-bold text-indigo-700 dark:text-indigo-400 group-hover:gap-1.5 transition-all">
              <span>कार्ड तयार करा</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Service 3: Pan Card */}
          <div 
            onClick={() => onNavigate('pan-card')}
            className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-amber-500 hover:-translate-y-0.5"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FileBadge className="w-6 h-6 text-amber-800 dark:text-amber-300" />
            </div>
            <h4 className="text-base font-black text-gray-900 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
              Pan Card
            </h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed line-clamp-2">
              NSDL / UTI e-PAN PDF ऑटो-क्रॉप, अचूक 85.6 × 54 mm PVC आकार व A4 प्रिंट.
            </p>
            <div className="flex items-center text-xs font-bold text-amber-700 dark:text-amber-400 group-hover:gap-1.5 transition-all">
              <span>कार्ड तयार करा</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Service 3.1: Electoral Card */}
          <div 
            onClick={() => onNavigate('electoral-card')}
            className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-sky-500 hover:-translate-y-0.5"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Vote className="w-6 h-6 text-sky-800 dark:text-sky-300" />
            </div>
            <h4 className="text-base font-black text-gray-900 dark:text-slate-100 group-hover:text-sky-700 dark:group-hover:text-sky-400 transition-colors">
              Electoral Card
            </h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed line-clamp-2">
              भारत निवडणूक आयोग e-EPIC PDF ऑटो-क्रॉप, 85.6 × 54 mm PVC आकार व A4 प्रिंट.
            </p>
            <div className="flex items-center text-xs font-bold text-sky-700 dark:text-sky-400 group-hover:gap-1.5 transition-all">
              <span>कार्ड तयार करा</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Service 3.2: Rashan Card */}
          <div 
            onClick={() => onNavigate('mera-rashan-card')}
            className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-amber-600 hover:-translate-y-0.5"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Wheat className="w-6 h-6 text-amber-800 dark:text-amber-300" />
            </div>
            <h4 className="text-base font-black text-gray-900 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
              Rashan Card
            </h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed line-clamp-2">
              रेशन कार्ड PDF थेट ऑटो-क्रॉप, अचूक 85.6 × 54 mm PVC आकार व A4 प्रिंट.
            </p>
            <div className="flex items-center text-xs font-bold text-amber-700 dark:text-amber-400 group-hover:gap-1.5 transition-all">
              <span>कार्ड तयार करा</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Service 3.3: Ayushman Card */}
          <div 
            onClick={() => onNavigate('ayushman-card')}
            className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-orange-600 hover:-translate-y-0.5"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <ShieldPlus className="w-6 h-6 text-orange-700 dark:text-orange-400" />
            </div>
            <h4 className="text-base font-black text-gray-900 dark:text-slate-100 group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">
              Ayushman Card
            </h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed line-clamp-2">
              आयुष्मान भारत PM-JAY PDF थेट ऑटो-क्रॉप, 85.6 × 54 mm PVC आकार व A4 प्रिंट.
            </p>
            <div className="flex items-center text-xs font-bold text-orange-700 dark:text-orange-400 group-hover:gap-1.5 transition-all">
              <span>कार्ड तयार करा</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Service 3.4: Abha Card */}
          <div 
            onClick={() => onNavigate('abha-card')}
            className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-sky-600 hover:-translate-y-0.5"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <HeartPulse className="w-6 h-6 text-sky-700 dark:text-sky-400" />
            </div>
            <h4 className="text-base font-black text-gray-900 dark:text-slate-100 group-hover:text-sky-700 dark:group-hover:text-sky-400 transition-colors">
              Abha Card
            </h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed line-clamp-2">
              ABHA Health Card PDF थेट ऑटो-क्रॉप, 85.6 × 54 mm PVC आकार व A4 प्रिंट.
            </p>
            <div className="flex items-center text-xs font-bold text-sky-700 dark:text-sky-400 group-hover:gap-1.5 transition-all">
              <span>कार्ड तयार करा</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Service 3.5: E Shram Card */}
          <div 
            onClick={() => onNavigate('eshram-card')}
            className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-blue-600 hover:-translate-y-0.5"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <HardHat className="w-6 h-6 text-blue-700 dark:text-blue-400" />
            </div>
            <h4 className="text-base font-black text-gray-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
              E Shram Card
            </h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed line-clamp-2">
              ई-श्रम कार्ड PDF थेट ऑटो-क्रॉप, 85.6 × 54 mm PVC आकार व A4 प्रिंट.
            </p>
            <div className="flex items-center text-xs font-bold text-blue-700 dark:text-blue-400 group-hover:gap-1.5 transition-all">
              <span>कार्ड तयार करा</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Service 4: PoCRA Consent Letter */}
          <div 
            onClick={() => onNavigate('pocra-consent')}
            className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-blue-600 hover:-translate-y-0.5"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6 text-blue-900 dark:text-blue-300" />
            </div>
            <h4 className="text-base font-black text-gray-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
              PoCRA Consent Letter
            </h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed line-clamp-2">
              नानाजी देशमुख कृषी संजीवनी सामाईक शेतजमीन संमती पत्र ऑटो-फिल व A4 प्रिंट.
            </p>
            <div className="flex items-center text-xs font-bold text-blue-700 dark:text-blue-400 group-hover:gap-1.5 transition-all">
              <span>संमती पत्र भरा</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Service 5: Swayam Ghoshana Patra */}
          <div 
            onClick={() => onNavigate('swayam-ghoshana')}
            className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-emerald-600 hover:-translate-y-0.5"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6 text-emerald-800 dark:text-emerald-300" />
            </div>
            <h4 className="text-base font-black text-gray-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
              स्वयंघोषणापत्र
            </h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed line-clamp-2">
              शासकीय योजना व विविध कामांसाठीचे स्वयंघोषणापत्र 1-क्लिकमध्ये जनरेट व प्रिंट करा.
            </p>
            <div className="flex items-center text-xs font-bold text-emerald-700 dark:text-emerald-400 group-hover:gap-1.5 transition-all">
              <span>अर्ज भरा व प्रिंट करा</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

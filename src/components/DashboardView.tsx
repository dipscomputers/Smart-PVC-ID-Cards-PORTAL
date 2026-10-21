import React, { useState } from 'react';
import { 
  Building2, 
  UserCheck, 
  Camera, 
  MapPin, 
  Phone, 
  Clock, 
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
  HardHat,
  MessageSquare,
  Search,
  ExternalLink,
  Zap,
  Sprout,
  Maximize2,
  Award,
  ArrowUpRight,
  ChevronRight,
  LayoutGrid,
  CheckCircle2,
  ShieldAlert,
  Printer,
  Sparkle,
  Compass,
  QrCode
} from 'lucide-react';
import { PortalTab } from './Sidebar';

interface DashboardViewProps {
  onNavigate: (tab: PortalTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'pvc' | 'photo' | 'documents'>('all');

  // Services suite array with distinct visual styles and high quality icons
  const services = [
    {
      id: 'farmer-id' as PortalTab,
      title: 'Farmer ID Card',
      titleMr: 'शेतकरी ओळखपत्र',
      category: 'pvc',
      icon: Sprout,
      color: 'emerald',
      gradient: 'from-emerald-600 via-teal-600 to-emerald-800',
      accentBorder: 'border-emerald-500/40 hover:border-emerald-500 dark:border-emerald-800/80',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
      badge: '🔥 सर्वाधिक लोकप्रिय',
      shortcut: 'Alt + 1',
      desc: 'डिजिटल शेती परिचय पत्र, PDF ऑटो-फिल, क्यूआर कोड आणि ISO मानक 85.6 × 54 mm PVC कार्ड जनरेट करा.',
      actionText: '⚡ शेतकरी आयडी बनवा',
    },
    {
      id: 'my-qr-payment' as PortalTab,
      title: 'My QR payment (POS)',
      titleMr: 'दिप्स कॉम्पुटर्स POS & QR',
      category: 'documents',
      icon: QrCode,
      color: 'emerald',
      gradient: 'from-emerald-600 via-teal-600 to-emerald-900',
      accentBorder: 'border-emerald-500/40 hover:border-emerald-500 dark:border-emerald-800/80',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
      badge: '💸 UPI QR & Cash Counter',
      shortcut: 'F2 / Alt + 1',
      desc: 'डायनामिक UPI पेमेंट क्यूआर जनरेटर, कॅश डिनॉमिनेशन मोजणी, मराठी अक्षरी रक्कम आणि व्हॉट्सॲप समरी.',
      actionText: '⚡ POS ओपन करा',
    },
    {
      id: 'maha-id' as PortalTab,
      title: 'Maha ID Card',
      titleMr: 'महा आयडी कार्ड',
      category: 'pvc',
      icon: ShieldCheck,
      color: 'blue',
      gradient: 'from-blue-600 via-indigo-600 to-blue-800',
      accentBorder: 'border-blue-500/40 hover:border-blue-500 dark:border-blue-800/80',
      badgeBg: 'bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800',
      btnBg: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20',
      badge: '⭐ MahaSarathi PDF',
      shortcut: 'Alt + 2',
      desc: 'MahaSarathi PDF ऑटो-क्रॉप, पासवर्ड ऑटो-अनलॉक व 85.6 × 54 mm PVC स्मार्ट कार्ड एका क्लिकवर प्रिंट करा.',
      actionText: '⚡ Maha ID बनवा',
    },
    {
      id: 'passport-photo' as PortalTab,
      title: 'Passport Photo Generator',
      titleMr: 'पासपोर्ट फोटो मेकर',
      category: 'photo',
      icon: Camera,
      color: 'teal',
      gradient: 'from-teal-600 via-cyan-600 to-teal-800',
      accentBorder: 'border-teal-500/40 hover:border-teal-500 dark:border-teal-800/80',
      badgeBg: 'bg-teal-50 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-800',
      btnBg: 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20',
      badge: '📸 12 & 36 Photos',
      shortcut: 'Alt + 3',
      desc: '4×6 इंचावर 12 फोटो किंवा A4 पानावर 36 पासपोर्ट फोटो एका क्लिकवर ऑटो-अलाईन करून प्रिंट करा.',
      actionText: '⚡ पासपोर्ट फोटो बनवा',
    },
    {
      id: 'photo-resizes' as PortalTab,
      title: 'Photo & PDF Resizer',
      titleMr: 'फोटो व पीडीएफ रिसायझर',
      category: 'photo',
      icon: Maximize2,
      color: 'purple',
      gradient: 'from-purple-600 via-indigo-600 to-purple-800',
      accentBorder: 'border-purple-500/40 hover:border-purple-500 dark:border-purple-800/80',
      badgeBg: 'bg-purple-50 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800',
      btnBg: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20',
      badge: '⚙️ Photo & PDF Compress',
      shortcut: 'Govt Form Presets',
      desc: 'शासकीय ऑनलाईन फॉर्म, MPSC व भरती अर्जासाठी फोटो (160×202 px), स्वाक्षरी आणि पीडीएफ फाईल रिसायझ करा.',
      actionText: '⚡ फोटो व PDF रिसायझ करा',
    },
    {
      id: 'whatsapp-print' as PortalTab,
      title: 'WhatsApp Print Studio',
      titleMr: 'व्हॉट्सॲप दस्तऐवज सुधारणा',
      category: 'photo',
      icon: MessageSquare,
      color: 'green',
      gradient: 'from-green-600 via-emerald-600 to-green-800',
      accentBorder: 'border-green-500/40 hover:border-green-500 dark:border-green-800/80',
      badgeBg: 'bg-green-50 dark:bg-green-950/80 text-green-800 dark:text-green-300 border-green-300 dark:border-green-800',
      btnBg: 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/20',
      badge: '✨ Auto Clean & Enhance',
      shortcut: 'Alt + 4',
      desc: 'व्हॉट्सॲपवरून आलेल्या अस्पष्ट फोटो/डॉक्युरमेंट्सची ब्राईटनेस व क्रॉपिंग दुरुस्त करून A4 वर प्रिंट घ्या.',
      actionText: '⚡ दस्तऐवज सुधारा',
    },
    {
      id: 'adhar-card' as PortalTab,
      title: 'Adhar Card PVC Print',
      titleMr: 'आधार कार्ड PVC प्रिंट',
      category: 'pvc',
      icon: Fingerprint,
      color: 'indigo',
      gradient: 'from-indigo-600 via-blue-700 to-indigo-900',
      accentBorder: 'border-indigo-500/40 hover:border-indigo-500 dark:border-indigo-800/80',
      badgeBg: 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
      btnBg: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20',
      badge: '🔐 e-Aadhaar Auto Unlock',
      shortcut: 'Alt + 5',
      desc: 'e-Aadhaar PDF पासवर्ड ऑटो-अनलॉक करा, फ्रंट व बॅक अचूक क्रॉप करून A4 किंवा PVC वर प्रिंट करा.',
      actionText: '⚡ आधार कार्ड क्रॉप करा',
    },
    {
      id: 'pan-card' as PortalTab,
      title: 'Pan Card PVC Print',
      titleMr: 'पॅन कार्ड PVC स्मार्ट कार्ड',
      category: 'pvc',
      icon: FileBadge,
      color: 'amber',
      gradient: 'from-amber-600 via-orange-600 to-amber-800',
      accentBorder: 'border-amber-500/40 hover:border-amber-500 dark:border-amber-800/80',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      btnBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20',
      badge: '💳 NSDL & UTI e-PAN',
      shortcut: 'Alt + 6',
      desc: 'NSDL / UTI e-PAN PDF थेट अपलोड करा व 85.6 × 54 mm PVC आकारात एका क्लिकवर क्रॉप करा.',
      actionText: '⚡ पॅन कार्ड बनवा',
    },
    {
      id: 'electoral-card' as PortalTab,
      title: 'Electoral Voter ID Card',
      titleMr: 'मतदार ओळखपत्र (e-EPIC)',
      category: 'pvc',
      icon: Vote,
      color: 'sky',
      gradient: 'from-sky-600 via-blue-600 to-sky-800',
      accentBorder: 'border-sky-500/40 hover:border-sky-500 dark:border-sky-800/80',
      badgeBg: 'bg-sky-50 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800',
      btnBg: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20',
      badge: '🗳️ ECI Voter ID',
      shortcut: 'Alt + 7',
      desc: 'भारत निवडणूक आयोगाचे e-EPIC PDF थेट क्रॉप करा, फ्रंट-बॅक जोडणी व HD PVC कार्ड प्रिंट करा.',
      actionText: '⚡ मतदार कार्ड बनवा',
    },
    {
      id: 'mera-rashan-card' as PortalTab,
      title: 'Mera Rashan Card PVC',
      titleMr: 'रेशन कार्ड PVC स्मार्ट कार्ड',
      category: 'pvc',
      icon: Wheat,
      color: 'yellow',
      gradient: 'from-yellow-600 via-amber-700 to-yellow-800',
      accentBorder: 'border-yellow-500/40 hover:border-yellow-500 dark:border-yellow-800/80',
      badgeBg: 'bg-yellow-50 dark:bg-yellow-950/80 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800',
      btnBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20',
      badge: '🌾 NFSA Ration Portal',
      shortcut: 'Alt + 8',
      desc: 'रेशन कार्ड PDF किंवा स्कॅन डॉक्युमेंट थेट क्रॉप करा व कुटुंबाच्या माहितीसह PVC वर प्रिंट करा.',
      actionText: '⚡ रेशन कार्ड प्रिंट करा',
    },
    {
      id: 'ayushman-card' as PortalTab,
      title: 'Ayushman Bharat Card',
      titleMr: 'आयुष्मान भारत PM-JAY',
      category: 'pvc',
      icon: ShieldPlus,
      color: 'orange',
      gradient: 'from-orange-600 via-red-600 to-orange-800',
      accentBorder: 'border-orange-500/40 hover:border-orange-500 dark:border-orange-800/80',
      badgeBg: 'bg-orange-50 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800',
      btnBg: 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20',
      badge: '🏥 ₹5 लाख मोफत उपचार',
      shortcut: 'Alt + 9',
      desc: 'आयुष्मान भारत कार्ड PDF थेट ऑटो-क्रॉप करा, ५ लाखांचे मोफत उपचाराचे कार्ड PVC वर जनरेट करा.',
      actionText: '⚡ आयुष्मान कार्ड बनवा',
    },
    {
      id: 'abha-card' as PortalTab,
      title: 'ABHA Health Card',
      titleMr: 'आभा आयडी कार्ड (ABHA)',
      category: 'pvc',
      icon: HeartPulse,
      color: 'cyan',
      gradient: 'from-cyan-600 via-teal-600 to-cyan-800',
      accentBorder: 'border-cyan-500/40 hover:border-cyan-500 dark:border-cyan-800/80',
      badgeBg: 'bg-cyan-50 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800',
      btnBg: 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-600/20',
      badge: '❤️ ABDM Digital Health',
      shortcut: 'Alt + 0',
      desc: 'आयुष्मान भारत डिजिटल हेल्थ कार्ड (ABHA ID) ऑटो-क्रॉप करा व PVC स्मार्ट कार्ड आकारात प्रिंट करा.',
      actionText: '⚡ आभा कार्ड क्रॉप करा',
    },
    {
      id: 'eshram-card' as PortalTab,
      title: 'E-Shram Card',
      titleMr: 'ई-श्रम कामगार कार्ड',
      category: 'pvc',
      icon: HardHat,
      color: 'slate',
      gradient: 'from-slate-700 via-gray-800 to-slate-900',
      accentBorder: 'border-slate-500/40 hover:border-slate-500 dark:border-slate-800/80',
      badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
      btnBg: 'bg-slate-700 hover:bg-slate-800 text-white shadow-slate-700/20',
      badge: '👷 UAN Shramik Card',
      shortcut: 'Shift + 1',
      desc: 'ई-श्रम असंघटित कामगार ओळखपत्र UAN बारकोडसह PVC स्मार्ट कार्ड आकारात क्रॉप व प्रिंट करा.',
      actionText: '⚡ ई-श्रम कार्ड बनवा',
    },
    {
      id: 'pocra-consent' as PortalTab,
      title: 'PoCRA Consent Letter',
      titleMr: 'पोकरा संमती पत्र',
      category: 'documents',
      icon: FileText,
      color: 'emerald',
      gradient: 'from-emerald-700 via-green-800 to-emerald-950',
      accentBorder: 'border-emerald-500/40 hover:border-emerald-500 dark:border-emerald-800/80',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      btnBg: 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20',
      badge: '📝 पोकरा कृषी योजना',
      shortcut: 'Shift + 2',
      desc: 'नानाजी देशमुख कृषी संजीवनी प्रकल्पासाठी सामाईक शेतजमीन संमती पत्र ऑनलाइन भरा व A4 प्रिंट घ्या.',
      actionText: '⚡ संमती पत्र भरा',
    },
    {
      id: 'swayam-ghoshana' as PortalTab,
      title: 'Swayam Ghoshana Patra',
      titleMr: 'स्वयंघोषणापत्र (Declaration)',
      category: 'documents',
      icon: FileText,
      color: 'teal',
      gradient: 'from-teal-700 via-cyan-800 to-teal-950',
      accentBorder: 'border-teal-500/40 hover:border-teal-500 dark:border-teal-800/80',
      badgeBg: 'bg-teal-50 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-800',
      btnBg: 'bg-teal-700 hover:bg-teal-800 text-white shadow-teal-700/20',
      badge: '📑 सेतू दाखले & अर्ज',
      shortcut: 'Shift + 3',
      desc: 'महाराष्ट्र शासनाच्या सेतू दाखले, सबसिडी व विविध योजनांसाठी स्व-घोषणापत्र 1-क्लिकमध्ये प्रिंट करा.',
      actionText: '⚡ स्वयंघोषणापत्र जनरेट करा',
    },
  ];

  // Filter logic
  const filteredServices = services.filter((s) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      s.title.toLowerCase().includes(query) ||
      s.titleMr.toLowerCase().includes(query) ||
      s.desc.toLowerCase().includes(query) ||
      s.badge.toLowerCase().includes(query);

    const matchesCategory = 
      activeCategory === 'all' ||
      (activeCategory === 'pvc' && s.category === 'pvc') ||
      (activeCategory === 'photo' && s.category === 'photo') ||
      (activeCategory === 'documents' && s.category === 'documents');

    return matchesSearch && matchesCategory;
  });

  // Official Govt Portal Directory
  const govtPortals = [
    { name: 'महाडीबीटी शेतकरी पोर्टल', sub: 'MahaDBT Farmer', url: 'https://mahadbt.maharashtra.gov.in/', tag: 'योजना & अनुदाने' },
    { name: 'PM-Kisan Samman Nidhi', sub: 'PM-Kisan Official', url: 'https://pmkisan.gov.in/', tag: 'हप्ता स्टेटस & e-KYC' },
    { name: 'ई-पीक पाहणी महाऑनलाइन', sub: 'e-Pik Pahani', url: 'https://pikapahani.maharashtra.gov.in/', tag: 'पिक नोंदणी' },
    { name: 'डिजिटल सातबारा व 8-अ', sub: 'Digital Satbara', url: 'https://digitalsatbara.maharashtra.gov.in/', tag: 'शासकीय 7/12 उतारा' },
    { name: 'पोकरा (PoCRA) योजना', sub: 'MahaPoCRA', url: 'https://mahapocra.gov.in/', tag: 'कृषी संजीवनी' },
    { name: 'राष्ट्रीय मतदार पोर्टल (NVSP)', sub: 'Voter Service', url: 'https://voters.eci.gov.in/', tag: 'e-EPIC Voter Card' },
    { name: 'आयुष्मान भारत PM-JAY', sub: 'NHA Setu', url: 'https://setu.pmjay.gov.in/', tag: 'आयुष्मान कार्ड' },
    { name: 'रेशन कार्ड महाफूड पोर्टल', sub: 'RCMS NFSA', url: 'https://rcms.mahafood.gov.in/', tag: 'रेशन कार्ड सदस्य' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ================= 1. BRAND NEW GLASS-HERO COMMAND CENTER ================= */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 dark:from-slate-950 dark:via-emerald-950/80 dark:to-black border-2 border-emerald-500/40 shadow-2xl overflow-hidden p-6 sm:p-8 lg:p-10 text-white">
        
        {/* Glow Lens Flares */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#10b981_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

        <div className="relative z-10 space-y-6">
          
          {/* Top Live Badge Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-900/90 border border-emerald-400/40 text-emerald-200 font-bold text-xs backdrop-blur-md shadow-md">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>दिप्स कॉम्प्युटर्स • नागरी सेतू व डिजिटल आयडी महापोर्टल</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 font-mono text-xs font-bold shadow-inner">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>ISO 85.6 × 54.0 mm PVC ENGINE</span>
            </div>
          </div>

          {/* Title & Primary Quick Action Glass Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                DIPs Digital Studio <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-cyan-200 to-amber-300">
                  & Smart PVC Card Engine
                </span>
              </h1>
              <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-medium max-w-2xl">
                शेतकरी ओळखपत्र, Maha ID, आधार, पॅन, मतदार कार्ड, आयुष्मान कार्ड व पासपोर्ट फोटो एका क्लिकवर ऑटो-क्रॉप करा 
                आणि HD गुणवत्तेत ISO मानक PVC स्मार्ट कार्डवर प्रिंट करा.
              </p>
            </div>

            {/* Quick Action Floating Action Glass Buttons */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {/* Button 1: My QR payment */}
              <button
                type="button"
                onClick={() => onNavigate('my-qr-payment')}
                className="w-full inline-flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-2xl font-black text-sm shadow-xl transition-all cursor-pointer transform hover:-translate-y-0.5 border border-emerald-300/40 active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-950 text-emerald-400 flex items-center justify-center font-bold shadow-xs shrink-0 border border-emerald-400/30">
                    <QrCode className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-emerald-100">POS & UPI QR</div>
                    <div className="text-sm font-black text-white">My QR payment</div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-white" />
              </button>

              {/* Button 2: Farmer ID Card */}
              <button
                type="button"
                onClick={() => onNavigate('farmer-id')}
                className="w-full inline-flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 rounded-2xl font-black text-sm shadow-xl transition-all cursor-pointer transform hover:-translate-y-0.5 border border-amber-300 active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-bold shadow-xs shrink-0">
                    <Sprout className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-800">१-क्लिक जनरेटर</div>
                    <div className="text-sm font-black text-slate-950">Farmer ID Card (शेतकरी ओळखपत्र)</div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-950" />
              </button>
            </div>
          </div>



        </div>
      </div>

      {/* ================= 2. FAST-LAUNCH ACTION BUTTONS ROW ================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500 animate-pulse" />
            <span>झटपट लाँच सर्व्हिसेस (Quick Launch)</span>
          </h2>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">1-Click Direct Access</span>
        </div>

        {/* Fast Action Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {services.slice(0, 7).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col items-center text-center gap-2 group hover:-translate-y-1 active:scale-95"
              >
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.gradient} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 line-clamp-1">
                  {item.titleMr}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= 3. ALL SERVICES CATALOG GRID ================= */}
      <div className="space-y-6">
        
        {/* Search & Category Filter Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>सर्व उपलब्ध PVC कार्ड व सेतू सेवा (Services Suite)</span>
              </h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                एकूण {services.length} स्मार्ट कार्ड जनरेटर्स व PDF ऑटो-क्रॉपिंग साधने
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl overflow-x-auto shrink-0">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeCategory === 'all'
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                सर्व ({services.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('pvc')}
                className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeCategory === 'pvc'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🪪 PVC स्मार्ट कार्ड्स ({services.filter(s => s.category === 'pvc').length})
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('photo')}
                className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeCategory === 'photo'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                📸 फोटो & व्हॉट्सॲप ({services.filter(s => s.category === 'photo').length})
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('documents')}
                className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeCategory === 'documents'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                📄 शासकीय फॉर्म्स ({services.filter(s => s.category === 'documents').length})
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="कोणतेही PVC कार्ड किंवा सेवा शोधा... (उदा. Farmer ID, Maha ID, Passport Photo, Adhar, Pan, Voter, Ayushman, PoCRA)"
              className="w-full pl-12 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                क्लियर
              </button>
            )}
          </div>
        </div>

        {/* Services Responsive Cards Grid (1, 2, 3, 4 cols) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {filteredServices.length > 0 ? (
            filteredServices.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`group relative bg-white dark:bg-slate-900 rounded-3xl p-6 border ${item.accentBorder} shadow-sm hover:shadow-2xl transition-all cursor-pointer hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden backdrop-blur-sm`}
                >
                  {/* Top Custom Color Gradient Banner Bar */}
                  <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${item.gradient}`} />

                  <div className="space-y-4 pt-1">
                    {/* Icon & Badge Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${item.gradient} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 stroke-[2.2]" />
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2.5 py-1 font-extrabold text-[10px] rounded-lg border shadow-xs ${item.badgeBg}`}>
                          {item.badge}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">
                          {item.shortcut}
                        </span>
                      </div>
                    </div>

                    {/* Titles */}
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {item.titleMr}
                      </h3>
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {item.title}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 font-medium">
                      {item.desc}
                    </p>
                  </div>

                  {/* Primary Distinct Action Button per Service */}
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate(item.id);
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-between cursor-pointer transition-all shadow-md ${item.btnBg} active:scale-95`}
                    >
                      <span>{item.actionText}</span>
                      <ChevronRight className="w-4 h-4 text-white/90 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                "{searchQuery}" नावाची कोणतीही सेवा सापडली नाही.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                सर्व सेवा पुन्हा दाखवा
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================= 4. OPERATOR & CENTER INFO CARD WITH LOGO ================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0f2e26] text-white flex items-center justify-center shrink-0 shadow-md border border-emerald-500/30">
              <Building2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                दिप्स कॉम्प्युटर्स मुख्य सेतू माहिती केंद्र
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Official Digital Identity & PVC Smart Card Processing Center • Shirpur Jain (Washim)
              </p>
            </div>
          </div>

          <a
            href="https://wa.me/919049102035?text=Hello%20DIPs%20Computers,%20I%20want%20to%20apply%20for%20a%20PVC%20Card."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer active:scale-95"
          >
            <MessageSquare className="w-4.5 h-4.5 text-emerald-200" />
            <span>व्हॉट्सॲपवरून मेसेज करा</span>
          </a>
        </div>

        {/* Info Grid Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>केंद्र / शॉपचे नाव</span>
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-slate-100">
              दिप्स कॉम्प्युटर्स
            </div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              DIPs Computers
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2 flex items-center gap-3">
            <img
              src="https://blogger.googleusercontent.com/img/a/AVvXsEgnbNMNM_EqpDyQSqW9ncSuuuTWPL4O3qTCxY6bRvfwp5r83CtUsP0FYf19hveo9KcTlvujYd5Wobnjz1nRO0-ZolOim5gRImhZQmhKHIWcrqKf6RDoQVoYwrgUxT0a6SPdBs975K3dLArV9nocqTXzCaJ92561kvcyQXbbvUSh5TwkHp7wSixT1fs-kDAR=s1600"
              alt="दिपक मा. खंदारे (पाटील)"
              className="w-12 h-12 rounded-full object-contain shrink-0 drop-shadow-sm"
            />
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                <UserCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>संचालक (Owner)</span>
              </div>
              <div className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight">
                दिपक मा. खंदारे (पाटील)
              </div>
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                Dipak M. Khandare (Patil)
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              <Phone className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>मोबाईल नंबर (Contact)</span>
            </div>
            <div className="flex items-center gap-2 font-mono font-black text-base text-slate-900 dark:text-slate-100">
              <a href="tel:9049102035" className="hover:text-emerald-600">9049102035</a>
              <span className="text-slate-300">|</span>
              <a href="tel:8888732035" className="hover:text-emerald-600">8888732035</a>
            </div>
            <div className="text-xs font-bold text-sky-600 dark:text-sky-400">
              कॉल व व्हॉट्सॲप सपोर्ट
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>कामाची वेळ (Timings)</span>
            </div>
            <div className="text-base font-black text-slate-900 dark:text-slate-100">
              सकाळी 8:00 ते रात्री 9:00
            </div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              7 दिवस सुरु (Open All Days)
            </div>
          </div>
        </div>

        {/* Address Banner */}
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-emerald-950 dark:text-emerald-200">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-bold">
              केंद्राचा पत्ता: बँक ऑफ महाराष्ट्रच्या मागे, येवले कॉम्प्लेक्स, शिरपूर जैन, ता. मालेगाव जि. वाशिम - 444504
            </span>
          </div>

          <span className="px-3 py-1 bg-emerald-700 text-white font-bold text-xs rounded-lg shrink-0">
            वाशिम जिल्हा (Washim)
          </span>
        </div>
      </div>

      {/* ================= 5. OFFICIAL GOVERNMENT PORTAL LINKS ================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                अधिकृत सरकारी महापोर्टल्स (Direct Official Links)
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                शासकीय योजना अर्ज, e-KYC व स्टेटस तपासण्यासाठी अधिकृत वेबसाईट लिंक्स
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {govtPortals.map((item, idx) => (
            <a
              key={idx}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-4 bg-slate-50 dark:bg-slate-800/70 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700 transition-all flex flex-col justify-between hover:shadow-md hover:border-emerald-500"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-md">
                    {item.tag}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>

                <div className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                  {item.name}
                </div>

                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {item.sub}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 truncate">
                {item.url.replace('https://', '')}
              </div>
            </a>
          ))}
        </div>
      </div>

    </div>
  );
};

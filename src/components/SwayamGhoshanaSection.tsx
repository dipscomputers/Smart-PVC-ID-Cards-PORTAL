import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Camera, 
  Upload, 
  Trash2, 
  UserCheck, 
  MapPin, 
  Hash, 
  PenTool, 
  Sparkles,
  User,
  Briefcase,
  ChevronDown,
  Maximize2,
  Minimize2,
  Image as ImageIcon
} from 'lucide-react';
import { SwayamGhoshanaData, defaultSwayamGhoshanaData } from '../types/swayamGhoshana';
import { SwayamGhoshanaA4Sheet } from './SwayamGhoshanaA4Sheet';
import { SwayamGhoshanaSignatureModal } from './SwayamGhoshanaSignatureModal';
import { SwayamGhoshanaCameraModal } from './SwayamGhoshanaCameraModal';
import { useRegisterShortcuts } from '../context/ShortcutsContext';
import { printComponent } from '../utils/printHelper';
import { safeHtml2Canvas } from '../utils/safeHtml2Canvas';
import { removeWhiteBackground } from '../utils/signatureUtils';
import { FarmerFormData } from '../types/form';

interface SwayamGhoshanaSectionProps {
  farmerFormData?: FarmerFormData;
}

/**
 * Helper: Extract Father's or Husband's name from full name
 * e.g. "दिपक माधव खंदारे" -> "माधव खंदारे"
 * e.g. "भाऊराव बळीराम खिल्लारे" -> "बळीराम खिल्लारे"
 */
export const extractFatherOrHusbandName = (fullName: string): string => {
  if (!fullName || !fullName.trim()) return '';
  const clean = fullName
    .trim()
    .replace(/^(?:श्री\.|श्री|श्रीमती|सौ\.|सौ|कुमार|कु\.|Mr\.|Mrs\.|Shri|Smt\.)\s+/i, '');
  const tokens = clean.split(/\s+/).filter(Boolean);
  if (tokens.length >= 3) {
    return tokens.slice(1).join(' ');
  } else if (tokens.length === 2) {
    return tokens[1];
  }
  return '';
};

/**
 * Helper: Extract Village/Place from Marathi or English address
 * e.g. "मु. पो. सोमठाणा, ता. मालेगाव, जि. वाशीम" -> "सोमठाणा"
 * e.g. "AT. SOMTHANA POST. MOHAJA TQ MALEGAON DIST. WASHIM" -> "SOMTHANA"
 * e.g. "AT SOMTHANA POST MOHAJA TQ MALEGAON DIST WASHIM" -> "SOMTHANA"
 * e.g. "मु. सोमठाणा पो. मोहाजा ता. मालेगाव" -> "सोमठाणा"
 * e.g. "A/P SOMTHANA, TALUKA MALEGAON" -> "SOMTHANA"
 * e.g. "सोमठाणा, ता. मालेगाव, जि. वाशीम" -> "सोमठाणा"
 * e.g. "SOMTHANA, TQ MALEGAON" -> "SOMTHANA"
 * Any village / gav works automatically!
 */
export const extractPlaceFromAddress = (addr: string): string => {
  if (!addr || !addr.trim()) return '';
  const clean = addr.trim();

  // Pattern A: Match prefix like:
  // Marathi: मु. पो., मु.पो., मु पो, मु., मौजे, गाव, रा., राहणार, रा.पो., पोस्ट
  // English: AT & POST, AT & PO, AT/POST, AT-POST, AT.POST, AT POST, A/P, A/P., AT., AT, VILLAGE, R/O
  const prefixRegex = /^(?:(?:मु[\s.]*पो[\s.]*|मु[\s.]+|मौजे[\s.]*|मौ[\s.]+|गाव[\s.:]+|रा[\s.]*पो[\s.]*|रा[\s.]+|राहणार[\s.:]*|पोस्ट[\s.:]+|पो[\s.]+)|(?:(?:AT[\s./\-_]*(?:&|AND|\/)?[\s./\-_]*(?:POST|PO|P\.O\.?))[\s.:]*|(?:A[\s/]*P|A\/P)[\s.:]*|AT[\s.:\-]+|VILLAGE[\s.:]+|VILL[\s.:]+|R[\s/]*O[\s.:]*|RESIDING[\s]+AT[\s.:]*))/i;

  let textAfterPrefix = clean;
  const prefixMatch = clean.match(prefixRegex);
  if (prefixMatch) {
    textAfterPrefix = clean.substring(prefixMatch[0].length).trim();
  }

  // Next delimiter or keyword where village ends:
  // e.g. "POST. MOHAJA", "POST MOHAJA", "पोस्ट मोहाजा", "पो. मोहाजा", "ता.", "तालुका", "TQ", "TAL", "DIST", commas, slashes, dashes, newlines
  const stopKeywordsRegex = /(?:[,\n;/]|\s+(?:पोस्ट[\s.:]+|पोस्ट$|पो[\s.]+|ता[\s.]+|तालुका[\s.:]+|तालुका$|जि[\s.]+|जिल्हा[\s.:]+|जिल्हा$|पिन[\s.]*|पिनकोड|POST[\s.:]+|POST\b|P\.?O\.?|PO\b|TQ[\s.:]+|TQ\b|TAL[\s.:]+|TAL\b|TALUKA\b|TAHSIL\b|TEHSIL\b|DIST[\s.:]+|DIST\b|DISTRICT\b|PIN[\s.:]*|PINCODE\b))/i;

  const stopMatch = textAfterPrefix.search(stopKeywordsRegex);
  let candidate = stopMatch !== -1 ? textAfterPrefix.substring(0, stopMatch).trim() : textAfterPrefix.trim();

  // Clean trailing/leading punctuation
  candidate = candidate.replace(/^[.,\-/\s:]+|[.,\-/\s:]+$/g, '').trim();

  const invalidKeywords = [
    'ता', 'जि', 'तालुका', 'जिल्हा', 'ता.', 'जि.', 'पो', 'पो.', 'पोस्ट',
    'tal', 'tal.', 'tq', 'tq.', 'taluka', 'dist', 'dist.', 'district', 'post', 'po', 'pin', 'at', 'ap'
  ];

  if (candidate && !invalidKeywords.includes(candidate.toLowerCase())) {
    return candidate;
  }

  // Fallback: Comma-separated parts
  const commaParts = clean.split(/[,،\n]/).map((p) => p.trim()).filter(Boolean);
  if (commaParts.length > 0) {
    const first = commaParts[0]
      .replace(prefixRegex, '')
      .replace(/^[.,\-/\s:]+|[.,\-/\s:]+$/g, '')
      .trim();
    if (first && !invalidKeywords.includes(first.toLowerCase())) {
      return first;
    }
  }

  return '';
};

export const OCCUPATION_OPTIONS = [
  'शेती',
  'नोकरी (शासकीय / खाजगी)',
  'व्यवसाय / उद्योग',
  'मजुरी / शेतमजुरी',
  'गृहिणी',
  'विद्यार्थी',
  'निवृत्त / ज्येष्ठ नागरिक',
  'इतर (स्वतः टाइप करा)',
];

const DEMO_SAMPLES = [
  {
    fullName: 'दिपक माधव खंदारे',
    relationType: 'मुलगा' as const,
    fatherOrHusbandName: 'माधव खंदारे',
    age: '30',
    aadhaarNumber: '942047908747',
    occupation: 'शेती',
    address: 'मु. पो. सोमठाणा, ता. मालेगाव, जि. वाशीम',
    date: new Date().toISOString().split('T')[0],
    place: 'सोमठाणा',
  },
  {
    fullName: 'भाऊराव बळीराम खिल्लारे',
    relationType: 'मुलगा' as const,
    fatherOrHusbandName: 'बळीराम खिल्लारे',
    age: '55',
    aadhaarNumber: '809514379551',
    occupation: 'शेती',
    address: 'AT. SOMTHANA POST. MOHAJA TQ MALEGAON DIST. WASHIM',
    date: new Date().toISOString().split('T')[0],
    place: 'SOMTHANA',
  },
];

export const SwayamGhoshanaSection: React.FC<SwayamGhoshanaSectionProps> = ({ farmerFormData }) => {
  const [data, setData] = useState<SwayamGhoshanaData>(() => {
    const saved = localStorage.getItem('swayam_ghoshana_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const rel = parsed.relationType;
        const validRel = (rel === 'मुलगी' || rel === 'पत्नी') ? rel : 'मुलगा';
        return {
          ...defaultSwayamGhoshanaData,
          ...parsed,
          relationType: validRel,
        };
      } catch (e) {
        console.warn('Could not load saved swayam ghoshana data:', e);
      }
    }
    return defaultSwayamGhoshanaData;
  });

  const [validationAlert, setValidationAlert] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isDownloadingJpg, setIsDownloadingJpg] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const signInputRef = useRef<HTMLInputElement>(null);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('swayam_ghoshana_data', JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [data]);

  const handleChange = (fields: Partial<SwayamGhoshanaData>) => {
    setData((prev) => ({ ...prev, ...fields }));
    setFormErrors((prev) => {
      const copy = { ...prev };
      Object.keys(fields).forEach((k) => delete copy[k]);
      return copy;
    });
    setValidationAlert(null);
  };

  // Auto-extraction when typing Full Name
  const handleFullNameChange = (newName: string) => {
    const prevAutoFather = extractFatherOrHusbandName(data.fullName);
    const newAutoFather = extractFatherOrHusbandName(newName);

    // If father name is empty or matched the previously auto-extracted father name, update it automatically
    const shouldAutoUpdateFather =
      !data.fatherOrHusbandName ||
      !data.fatherOrHusbandName.trim() ||
      data.fatherOrHusbandName.trim() === prevAutoFather.trim();

    const updates: Partial<SwayamGhoshanaData> = { fullName: newName };
    if (shouldAutoUpdateFather && newAutoFather) {
      updates.fatherOrHusbandName = newAutoFather;
    }
    handleChange(updates);
  };

  // Auto-extraction when typing Address (e.g. मु. पो. सोमठाणा, ता. मालेगाव, जि. वाशीम -> सोमठाणा or AT. SOMTHANA POST. MOHAJA -> SOMTHANA)
  const handleAddressChange = (newAddress: string) => {
    const newAutoPlace = extractPlaceFromAddress(newAddress);

    const updates: Partial<SwayamGhoshanaData> = { address: newAddress };
    if (newAutoPlace) {
      updates.place = newAutoPlace;
    } else if (!newAddress.trim()) {
      updates.place = '';
    }
    handleChange(updates);
  };

  // Auto-fill from active Farmer profile
  const handleImportFromFarmer = () => {
    if (!farmerFormData) {
      setValidationAlert('शेतकरी नोंदणीची माहिती उपलब्ध नाही. कृपया आधी शेतकरी माहिती भरा.');
      return;
    }

    const name = farmerFormData.fullNameMr || farmerFormData.fullNameEn || '';
    const village = farmerFormData.villageMr || farmerFormData.villageEn || '';
    const tehsil = farmerFormData.tehsilMr || farmerFormData.tehsilEn || '';
    const district = farmerFormData.districtMr || farmerFormData.districtEn || '';
    const address = [
      farmerFormData.addressEn || '',
      village ? `मु. पो. ${village}` : '',
      tehsil ? `ता. ${tehsil}` : '',
      district ? `जि. ${district}` : '',
    ]
      .filter(Boolean)
      .join(', ');

    const derivedFather = name ? extractFatherOrHusbandName(name) : '';
    const derivedPlace = village || (address ? extractPlaceFromAddress(address) : '') || tehsil || district || data.place;

    handleChange({
      fullName: name || data.fullName,
      ...(derivedFather ? { fatherOrHusbandName: derivedFather } : {}),
      aadhaarNumber: (farmerFormData.aadhaarNumber || data.aadhaarNumber).replace(/\D/g, ''),
      address: address || data.address,
      place: derivedPlace,
      photoUrl: farmerFormData.photoUrl || data.photoUrl,
    });

    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // 1-Click Sample Demo Auto-Fill
  const handleFillDemoData = (index = 0) => {
    const sample = DEMO_SAMPLES[index % DEMO_SAMPLES.length];
    handleChange({
      ...sample,
      isBlankPrint: false,
    });
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Photo Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        handleChange({ photoUrl: result });
      }
    };
    reader.readAsDataURL(file);
  };

  // Signature Upload Handler with auto white background removal
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      if (result) {
        // Automatically make white background transparent
        const transparentSig = await removeWhiteBackground(result);
        handleChange({ signatureUrl: transparentSig });
      }
    };
    reader.readAsDataURL(file);
  };

  // Manual trigger to remove background from current signature
  const handleRemoveSignatureBg = async () => {
    if (!data.signatureUrl) return;
    const transparentSig = await removeWhiteBackground(data.signatureUrl);
    handleChange({ signatureUrl: transparentSig });
  };

  // Form Validation
  const validateForm = (): boolean => {
    if (data.isBlankPrint) return true; // Blank forms don't require validation

    const errors: Record<string, boolean> = {};

    if (!data.fullName.trim()) {
      errors.fullName = true;
    }
    if (!data.fatherOrHusbandName.trim()) {
      errors.fatherOrHusbandName = true;
    }
    if (!data.age.trim() || isNaN(Number(data.age)) || Number(data.age) < 1 || Number(data.age) > 125) {
      errors.age = true;
    }
    const cleanAadhaar = data.aadhaarNumber.replace(/\D/g, '');
    if (cleanAadhaar && cleanAadhaar.length !== 12) {
      errors.aadhaarNumber = true;
    }
    if (!data.address.trim()) {
      errors.address = true;
    }
    if (!data.date.trim()) {
      errors.date = true;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setValidationAlert('कृपया लाल रंगात दर्शवलेली आवश्यक माहिती भरा (उदा. नाव, वय, पत्ता).');
      return false;
    }

    setFormErrors({});
    setValidationAlert(null);
    return true;
  };

  // Reset Form
  const handleReset = () => {
    setData(defaultSwayamGhoshanaData);
    localStorage.removeItem('swayam_ghoshana_data');
    setFormErrors({});
    setValidationAlert(null);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  // Direct Browser Print (Matches PoCRA Print)
  const handlePrint = async () => {
    if (!validateForm()) return;
    setIsPrinting(true);
    try {
      const title = `स्वयंघोषणापत्र_${(data.fullName || 'अर्जदार').replace(/\s+/g, '_')}`;
      const ok = await printComponent('swayam-ghoshana-printable-document', title);
      if (!ok) {
        await handleDownloadPdf();
      }
    } catch (err) {
      console.warn('Direct print error:', err);
      await handleDownloadPdf();
    } finally {
      setIsPrinting(false);
    }
  };

  // Download High-DPI PDF (Matches PoCRA PDF)
  const handleDownloadPdf = async () => {
    if (!validateForm()) return;
    setIsGeneratingPdf(true);
    try {
      const element = document.getElementById('swayam-ghoshana-printable-document');
      if (!element) throw new Error('Element not found');

      const { default: jsPDF } = await import('jspdf');

      const canvas = await safeHtml2Canvas(element, {
        scale: 3.125, // High DPI (~300 DPI for pristine clarity)
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      const filename = `स्वयंघोषणापत्र_${(data.fullName || 'अर्जदार').replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_')}.pdf`;
      pdf.save(filename);

      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      console.error('PDF export error:', err);
      setValidationAlert('PDF तयार करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Download High-DPI JPG Image
  const handleDownloadJpg = async () => {
    if (!validateForm()) return;
    setIsDownloadingJpg(true);
    try {
      const element = document.getElementById('swayam-ghoshana-printable-document');
      if (!element) throw new Error('Element not found');

      const canvas = await safeHtml2Canvas(element, {
        scale: 3.125, // High DPI (~300 DPI for pristine clarity)
        backgroundColor: '#ffffff',
      });

      const dataUrl = canvas.toDataURL('image/jpeg', 0.98);
      const link = document.createElement('a');
      link.href = dataUrl;
      const cleanName = (data.fullName || 'अर्जदार').replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_');
      const filename = `स्वयंघोषणापत्र_${cleanName}.jpg`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      console.error('JPG export error:', err);
      setValidationAlert('JPG फोटो सेव्ह करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setIsDownloadingJpg(false);
    }
  };

  // Register Shortcuts (Ctrl+P, Ctrl+D, Ctrl+S)
  useRegisterShortcuts({
    onPrint: () => handlePrint(),
    onDownloadPdf: () => handleDownloadPdf(),
    onSave: () => handleDownloadPdf(),
  });

  const extractedFatherName = extractFatherOrHusbandName(data.fullName);
  const extractedVillageName = extractPlaceFromAddress(data.address);

  const isCustomOccupation =
    Boolean(data.occupation) &&
    !OCCUPATION_OPTIONS.includes(data.occupation) &&
    data.occupation !== 'इतर (स्वतः टाइप करा)';

  const selectedOccupationValue = isCustomOccupation
    ? 'इतर (स्वतः टाइप करा)'
    : (data.occupation || 'शेती');

  const handleOccupationSelect = (val: string) => {
    if (val === 'इतर (स्वतः टाइप करा)') {
      handleChange({ occupation: '' });
    } else {
      handleChange({ occupation: val });
    }
  };

  // Live Preview Zoom & Responsive Scale state
  const [isFullZoom, setIsFullZoom] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number>(640);
  const sheetContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sheetContainerRef.current) return;
    const updateWidth = () => {
      if (sheetContainerRef.current) {
        setContainerWidth(sheetContainerRef.current.clientWidth);
      }
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(sheetContainerRef.current);
    return () => observer.disconnect();
  }, []);

  const A4_WIDTH_PX = 794;
  const A4_HEIGHT_PX = 1123;

  // Auto-fit scale to container width so the entire A4 sheet fits horizontally with zero clipping
  const fitWidthScale = Math.max(0.35, Math.min(1.0, (containerWidth - 32) / A4_WIDTH_PX));
  const currentScale = isFullZoom ? 1.0 : fitWidthScale;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. HEADER BANNER - EXACT PoCRA CONSENT LETTER BLUE THEME */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-blue-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-xs font-semibold tracking-wide text-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>महाराष्ट्र शासन निर्णय • प्रसुधा १६१४/३४५/प्र.क्र.७१/१८-अ</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-400 shrink-0" />
              <span>स्वयंघोषणापत्र (Self-Declaration Letter)</span>
            </h1>

            <p className="text-blue-200 text-xs sm:text-sm font-medium max-w-2xl">
              महाराष्ट्र शासनाच्या अधिकृत नमुन्याप्रमाणे प्रपत्र-अ व प्रपत्र-ब एकाच A4 पानात सोप्या पद्धतीने ऑटो-फिल व स्वच्छ प्रिंट करा.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center flex-wrap gap-2.5">
            {farmerFormData && (
              <button
                type="button"
                onClick={handleImportFromFarmer}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="शेतकरी प्रोफाईलवरून डेटा आणा"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>प्रोफाईलवरून भरा</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleFillDemoData(0)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="नमुना शेतकरी माहिती भरा"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>डेमो डेटा भरा</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-blue-100 border border-white/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="माहिती रीसेट करा"
            >
              <RotateCcw className="w-4 h-4" />
              <span>रीसेट</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {validationAlert && (
        <div className="bg-red-50 border-2 border-red-300 text-red-900 px-5 py-3.5 rounded-2xl flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div className="text-sm font-bold">{validationAlert}</div>
        </div>
      )}

      {showSuccessToast && (
        <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 px-5 py-3.5 rounded-2xl flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-sm font-bold">माहिती यशस्वीपणे अपडेट झाली! खालील प्रिव्ह्यू तपासा.</div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={photoInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={signInputRef}
        onChange={handleSignatureUpload}
        accept="image/*"
        className="hidden"
      />

      {/* 2. MAIN 2-COLUMN LAYOUT: FORM ON LEFT, LIVE A4 PREVIEW ON RIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: FORM DATA ENTRY */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Card 1: मुख्य अर्जदाराची माहिती - Redesigned & Professional */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm shadow-blue-500/20 shrink-0">
                    १
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      अर्जदाराची प्राथमिक माहिती
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                      स्वयंचलित ऑटो-फिल
                    </span>
                  </div>
                </div>

                {/* Blank Print Checkbox */}
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer select-none transition-all">
                  <input
                    type="checkbox"
                    checked={Boolean(data.isBlankPrint)}
                    onChange={(e) => handleChange({ isBlankPrint: e.target.checked })}
                    className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>कोरा फॉर्म (प्रिंट)</span>
                </label>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4">
                {/* 1. Full Name */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      १. अर्जदाराचे पूर्ण नाव (Full Name) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>वडिलांचे नाव आपोआप भरले जाईल</span>
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={data.fullName}
                      onChange={(e) => handleFullNameChange(e.target.value)}
                      placeholder="उदा. दिपक माधव खंदारे"
                      disabled={data.isBlankPrint}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-semibold transition-all focus:outline-hidden focus:ring-3 ${
                        formErrors.fullName
                          ? 'border-red-500 ring-red-100 bg-red-50/40 text-red-900'
                          : 'border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:ring-blue-100 bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100'
                      }`}
                    />
                  </div>
                </div>

                {/* 2. Relation and Father/Husband Name */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      २. वडिलांचे / पतीचे नाव <span className="text-red-500">*</span>
                    </label>

                    {/* Relation Type Toggle: केवळ ३ स्पष्ट पर्याय (मुलगा, मुलगी, पत्नी) */}
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                      {(['मुलगा', 'मुलगी', 'पत्नी'] as const).map((rel) => (
                        <button
                          key={rel}
                          type="button"
                          onClick={() => handleChange({ relationType: rel })}
                          className={`text-xs px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                            (data.relationType === rel || (!data.relationType && rel === 'मुलगा'))
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                          }`}
                        >
                          {rel}
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={data.fatherOrHusbandName}
                    onChange={(e) => handleChange({ fatherOrHusbandName: e.target.value })}
                    placeholder="उदा. माधव खंदारे"
                    disabled={data.isBlankPrint}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all focus:outline-hidden focus:ring-3 ${
                      formErrors.fatherOrHusbandName
                        ? 'border-red-500 ring-red-100 bg-red-50/40 text-red-900'
                        : 'border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:ring-blue-100 bg-white dark:bg-slate-800 dark:text-slate-100'
                    }`}
                  />

                  {/* Auto-fill indicator */}
                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    {extractedFatherName ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-500 dark:text-slate-400">नावावरून ओळखलेले:</span>
                        <button
                          type="button"
                          onClick={() => handleChange({ fatherOrHusbandName: extractedFatherName })}
                          className="font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                          title="नावावरून पुन्हा सेट करा"
                        >
                          <span>{extractedFatherName}</span>
                          {data.fatherOrHusbandName === extractedFatherName ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ (आपोआप सेट झाले)</span>
                          ) : (
                            <span className="text-blue-600 font-semibold">(येथे क्लिक करून भरा)</span>
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400">पूर्ण नाव टाकल्यास वडिलांचे नाव आपोआप भरले जाईल.</span>
                    )}
                  </div>
                </div>

                {/* 3. Age & 4. Aadhaar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      ३. वय वर्ष (Age) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="125"
                        value={data.age}
                        onChange={(e) => handleChange({ age: e.target.value })}
                        placeholder="उदा. 30"
                        disabled={data.isBlankPrint}
                        className={`w-full pl-4 pr-12 py-2.5 rounded-xl border text-sm font-semibold transition-all focus:outline-hidden focus:ring-3 ${
                          formErrors.age
                            ? 'border-red-500 ring-red-100 bg-red-50/40 text-red-900'
                            : 'border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:ring-blue-100 bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100'
                        }`}
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs text-slate-500 dark:text-slate-400 font-bold pointer-events-none">
                        वर्ष
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      ४. आधार क्रमांक (Aadhaar No.)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={12}
                        value={data.aadhaarNumber}
                        onChange={(e) => handleChange({ aadhaarNumber: e.target.value.replace(/\D/g, '') })}
                        placeholder="उदा. 942047908747"
                        disabled={data.isBlankPrint}
                        className={`w-full pl-4 pr-10 py-2.5 rounded-xl border text-sm font-semibold tracking-wider transition-all focus:outline-hidden focus:ring-3 ${
                          formErrors.aadhaarNumber
                            ? 'border-red-500 ring-red-100 bg-red-50/40 text-red-900'
                            : 'border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:ring-blue-100 bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100'
                        }`}
                      />
                      <Hash className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* 5. Occupation Dropdown Menu */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      ५. व्यवसाय (Occupation) <span className="text-slate-400 font-normal">(ड्रॉपडाऊन मेनू)</span>
                    </label>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      डिफॉल्ट: शेती
                    </span>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <select
                      value={selectedOccupationValue}
                      onChange={(e) => handleOccupationSelect(e.target.value)}
                      disabled={data.isBlankPrint}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all focus:outline-hidden appearance-none cursor-pointer"
                    >
                      {OCCUPATION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt} className="py-1">
                          {opt === 'शेती' ? '🌾 शेती (मुख्य व्यवसाय)' : opt}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>

                  {/* If custom occupation selected, show text input */}
                  {(selectedOccupationValue === 'इतर (स्वतः टाइप करा)' || isCustomOccupation) && (
                    <div className="pt-1.5 animate-in fade-in duration-150">
                      <input
                        type="text"
                        value={data.occupation}
                        onChange={(e) => handleChange({ occupation: e.target.value })}
                        placeholder="तुमचा व्यवसाय टाईप करा (उदा. सुतारकाम, चालक, इ.)"
                        disabled={data.isBlankPrint}
                        className="w-full px-4 py-2 rounded-xl border border-blue-400 dark:border-blue-600 text-sm font-semibold bg-blue-50/30 dark:bg-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                  )}
                </div>

                {/* 6. Address */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      ६. राहणार / संपूर्ण पत्ता (Address) <span className="text-red-500">*</span>
                    </label>

                    {/* Quick Sample Address Button */}
                    <button
                      type="button"
                      onClick={() => handleAddressChange('मु. पो. सोमठाणा, ता. मालेगाव, जि. वाशीम')}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer flex items-center gap-1"
                      title="सोमठाणा सॅम्पल पत्ता भरा"
                    >
                      <span>📋 सोमठाणा</span>
                    </button>
                  </div>

                  <textarea
                    rows={2}
                    value={data.address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    placeholder="उदा. मु. पो. सोमठाणा, ता. मालेगाव, जि. वाशीम (किंवा कोणतेही गाव)"
                    disabled={data.isBlankPrint}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all focus:outline-hidden focus:ring-3 ${
                      formErrors.address
                        ? 'border-red-500 ring-red-100 bg-red-50/40 text-red-900'
                        : 'border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:ring-blue-100 bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100'
                    }`}
                  />

                  {/* Auto-extracted Place Banner */}
                  <div className="flex items-center justify-between text-[11px] px-1">
                    {extractedVillageName ? (
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>पत्यावरून गाव ओळखले: <strong className="font-bold underline underline-offset-2">{extractedVillageName}</strong> (८. ठिकाण मध्ये आपोआप भरले आहे)</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">
                        टीप: कोणताही मराठी किंवा इंग्रजी पत्ता टाकताच गावाचे नाव शोधून <strong>८. ठिकाण (Place)</strong> आपोआप भरले जाईल.
                      </span>
                    )}
                  </div>
                </div>

                {/* 7. Date & 8. Place */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Date */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      ७. दिनांक (Date) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={data.date}
                        onChange={(e) => handleChange({ date: e.target.value })}
                        disabled={data.isBlankPrint}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:bg-white focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Place */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        ८. ठिकाण (Place)
                      </label>
                      {extractedVillageName && (
                        <span className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>पत्यावरून आले: {extractedVillageName}</span>
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={data.place}
                        onChange={(e) => handleChange({ place: e.target.value })}
                        placeholder="उदा. सोमठाणा"
                        disabled={data.isBlankPrint}
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 focus:bg-white focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all focus:outline-hidden"
                      />
                      <MapPin className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: फोटो आणि स्वाक्षरी (Photo & Signature Studio) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-200 dark:border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-sm shadow-sm shadow-indigo-500/20 shrink-0">
                    २
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      फोटो व स्वाक्षरी (Photo & Signature)
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                      ऐच्छिक
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Photo Upload Box */}
                <div className="border border-gray-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-between text-center bg-gray-50/50 dark:bg-slate-800/50">
                  <span className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">
                    अर्जदाराचा फोटो
                  </span>
                  <div className="w-24 h-28 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center shadow-2xs mb-3">
                    {data.photoUrl ? (
                      <img src={data.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-gray-300 dark:text-slate-600" />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 w-full">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="flex-1 py-1.5 px-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{data.photoUrl ? 'बदला' : 'अपलोड'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCameraModalOpen(true)}
                      className="py-1.5 px-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                      title="कॅमेऱ्याने फोटो काढा"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>

                    {data.photoUrl && (
                      <button
                        type="button"
                        onClick={() => handleChange({ photoUrl: '' })}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        title="फोटो काढा"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Signature Upload Box with Transparent BG */}
                <div className="border border-gray-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-between text-center bg-gray-50/50 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between w-full mb-2 px-0.5">
                    <span className="text-xs font-bold text-gray-700 dark:text-slate-300">
                      अर्जदाराची स्वाक्षरी
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>पारदर्शक BG</span>
                    </span>
                  </div>

                  <div className="w-48 h-28 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center p-1.5 shadow-2xs mb-3 relative group">
                    {data.signatureUrl ? (
                      <img src={data.signatureUrl} alt="Signature" className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                    ) : (
                      <span className="text-[10.5px] text-gray-400 dark:text-slate-500 font-medium">
                        रिकामे ठेवल्यास पेनने सही करा
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 w-full">
                    <button
                      type="button"
                      onClick={() => setIsSignatureModalOpen(true)}
                      className="flex-1 py-1.5 px-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>स्क्रीनवर सही</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => signInputRef.current?.click()}
                      className="py-1.5 px-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 text-gray-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      title="स्वाक्षरी फाईल अपलोड करा (पांढरा बॅकग्राउंड आपोआप काढला जाईल)"
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </button>

                    {data.signatureUrl && (
                      <>
                        <button
                          type="button"
                          onClick={handleRemoveSignatureBg}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-all cursor-pointer"
                          title="बॅकग्राउंड पारदर्शक करा (Remove White BG)"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChange({ signatureUrl: '' })}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                          title="सही काढा"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: LIVE A4 PREVIEW (MATCHES PoCRA PREVIEW CARD) */}
        <div className="lg:col-span-7 space-y-4" ref={previewRef}>
          {/* Preview Toolbar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-gray-200 dark:border-slate-800">
            {/* Header with Title and Quick Print/PDF Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-slate-800 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shadow-xs shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black text-gray-900 dark:text-slate-100">
                    A4 Preview
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    संपूर्ण A4 पान
                  </span>
                </div>
              </div>

              {/* Action Buttons in Toolbar - Primary Print, PDF & JPG */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={isPrinting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60 shrink-0"
                  title="A4 प्रिंट काढा (Ctrl + P)"
                >
                  <Printer className="w-4 h-4 text-blue-100" />
                  <span>प्रिंट</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60 shrink-0"
                  title="HD PDF डाऊनलोड करा (Ctrl + D)"
                >
                  <Download className="w-4 h-4 text-emerald-100" />
                  <span>PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJpg}
                  disabled={isDownloadingJpg}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60 shrink-0"
                  title="HD JPG फोटो डाऊनलोड करा"
                >
                  <ImageIcon className="w-4 h-4 text-purple-100" />
                  <span>JPG</span>
                </button>
              </div>
            </div>

            {/* View Mode Bar: Clean & Minimal */}
            <div className="flex items-center justify-end pb-3 mb-2 border-b border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsFullZoom(!isFullZoom)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                title={isFullZoom ? 'स्क्रीनवर बसवा' : '१००% मूळ आकारात पहा'}
              >
                {isFullZoom ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>स्क्रीनवर बसवा (Fit)</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>मोठा आकार (100% Zoom)</span>
                  </>
                )}
              </button>
            </div>

            {/* A4 Sheet Container with Realistic Paper Shadow & Complete View */}
            <div
              ref={sheetContainerRef}
              className="w-full flex justify-center items-start p-3 sm:p-5 bg-slate-200/90 dark:bg-slate-950 rounded-2xl border border-slate-300/80 dark:border-slate-800 overflow-x-auto"
            >
              {/* Scaled paper box container matching scaled width & height */}
              <div
                className="transition-all duration-150 origin-top shadow-2xl rounded-sm"
                style={{
                  width: `${A4_WIDTH_PX * currentScale}px`,
                  height: `${A4_HEIGHT_PX * currentScale}px`,
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                {/* Inner unscaled 794x1123px container scaled with CSS transform */}
                <div
                  style={{
                    width: `${A4_WIDTH_PX}px`,
                    height: `${A4_HEIGHT_PX}px`,
                    transform: `scale(${currentScale})`,
                    transformOrigin: 'top left',
                    backgroundColor: '#ffffff',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                  }}
                >
                  <SwayamGhoshanaA4Sheet data={data} id="swayam-ghoshana-live-preview" />
                </div>
              </div>
            </div>

            {/* Pristine 100% unscaled A4 Sheet strictly used for Direct Print & 300 DPI PDF download */}
            <div
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                width: '210mm',
                height: '297mm',
                overflow: 'hidden',
                pointerEvents: 'none',
                zIndex: -9999,
                backgroundColor: '#ffffff',
              }}
              aria-hidden="true"
            >
              <SwayamGhoshanaA4Sheet data={data} id="swayam-ghoshana-printable-document" />
            </div>

            {/* Informational Sub-kicker */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 font-medium">
                📄 A4 210 × 297 mm • 300 DPI प्रिंट कॅलिब्रेटेड • बाहेरील फ्रेम बॉर्डर व डॅश रेषेसह (नवीन नमुन्याप्रमाणे तंतोतंत)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DIGITAL SIGNATURE PAD MODAL */}
      <SwayamGhoshanaSignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={(sigUrl) => handleChange({ signatureUrl: sigUrl })}
        existingSignature={data.signatureUrl}
      />

      {/* 4. WEBCAM CAMERA MODAL */}
      <SwayamGhoshanaCameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={(photoUrl) => handleChange({ photoUrl: photoUrl })}
      />
    </div>
  );
};

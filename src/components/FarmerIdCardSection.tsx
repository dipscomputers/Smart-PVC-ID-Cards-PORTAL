import React, { useState, useRef, useEffect } from 'react';
import { 
  Printer, 
  CheckCircle, 
  Loader2, 
  AlertCircle,
  Camera,
  FileText,
  Zap,
  Crop,
  ShieldCheck,
  User,
  CreditCard,
  MapPin,
  Sparkles,
  Plus,
  Trash2,
  RefreshCw,
  RotateCcw,
  Award,
  Layers,
  X,
  Download,
  ExternalLink,
  ImageIcon
} from 'lucide-react';
import { useRegisterShortcuts } from '../context/ShortcutsContext';
import { 
  FarmerCardData, 
  FarmerCardLand, 
  DEFAULT_FARMER_CARD_SAMPLE, 
  calculateTotalArea,
  calculateTotalAreaAcres 
} from '../types/farmerCard';
import { FarmerIdPrintPortal } from './FarmerIdPrintPortal';
import { FarmerIdPrintView } from './FarmerIdPrintView';
import { PhotoCropModal } from './PhotoCropModal';
import { PhotoHdModal } from './PhotoHdModal';
import { parseFarmerRegistrationPdf } from '../utils/farmerRegistrationPdfParser';
import { extractPhotoFromDocument } from '../utils/pdfPhotoExtractor';
import { printComponent } from '../utils/printHelper';
import { PdfPasswordModal } from './PdfPasswordModal';
import { transliterateEnglishToMarathi } from '../utils/marathiTransliteration';
import { enhancePhotoToHd, DEFAULT_HD_PRESETS } from '../utils/photoHdEnhancer';

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 90 }, (_, i) => String(CURRENT_YEAR - 14 - i));

// Initial blank farmer card
const BLANK_FARMER_CARD: FarmerCardData = {
  id: 'farmer-card-1',
  fullNameEn: '',
  fullNameMr: '',
  dob: '',
  gender: 'Male',
  mobile: '',
  aadhaarNo: '',
  farmerId: '',
  photoUrl: '',
  address: '',
  villageEn: '',
  tehsilEn: '',
  districtEn: '',
  pincode: '',
  villageMr: '',
  tehsilMr: '',
  districtMr: '',
  lands: [
    {
      id: 'land-1',
      district: '',
      taluka: '',
      village: '',
      gatNo: '',
      khateNo: '',
      areaHaR: '',
    },
  ],
};

// Helper function to create FarmerCardData from parsed PDF result
const createFarmerCardFromParsed = (parsed: any, idxSuffix: number): FarmerCardData => {
  const fd = parsed.formData || {};
  let villageEn = fd.villageEn || '';
  let tehsilEn = fd.tehsilEn || '';
  let districtEn = fd.districtEn || '';
  let villageMr = fd.villageMr || '';
  let tehsilMr = fd.tehsilMr || '';
  let districtMr = fd.districtMr || '';

  if (fd.lands && fd.lands.length > 0) {
    villageEn = villageEn || fd.lands[0].village || '';
    tehsilEn = tehsilEn || fd.lands[0].taluka || '';
    districtEn = districtEn || fd.lands[0].district || '';
  }

  if (fd.addressEn) {
    const vMatch = fd.addressEn.match(/(?:At\.|Village)\s*([A-Za-z]+)/i);
    if (vMatch && !villageEn) villageEn = vMatch[1];
    const tMatch = fd.addressEn.match(/(?:TQ|Taluka|Ta\.)\s*([A-Za-z]+)/i);
    if (tMatch && !tehsilEn) tehsilEn = tMatch[1];
    const dMatch = fd.addressEn.match(/(?:DIST\.|District)\s*([A-Za-z]+)/i);
    if (dMatch && !districtEn) districtEn = dMatch[1];
  }

  const formattedDob = fd.dobDay && fd.dobMonth && fd.dobYear
    ? `${fd.dobDay}/${String(MONTHS.indexOf(fd.dobMonth) + 1).padStart(2, '0')}/${fd.dobYear}`
    : (fd.dobDay || '');

  const lands: FarmerCardLand[] = fd.lands && fd.lands.length > 0
    ? fd.lands.map((l: any, i: number) => {
        const numArea = parseFloat(l.areaHaR || '0');
        const formattedArea = !isNaN(numArea) && numArea > 0 ? numArea.toFixed(2) : (l.areaHaR || '0.00');
        return {
          id: l.id || `land-${i + 1}`,
          district: l.district || districtEn || 'WASHIM',
          taluka: l.taluka || tehsilEn || 'Malegaon',
          village: l.village || villageEn || 'Somthana',
          gatNo: l.gatNo || '',
          khateNo: l.khateNo || '',
          areaHaR: formattedArea,
        };
      })
    : [
        {
          id: 'land-1',
          district: districtEn || 'WASHIM',
          taluka: tehsilEn || 'Malegaon',
          village: villageEn || 'Somthana',
          gatNo: '',
          khateNo: '',
          areaHaR: '0.00',
        },
      ];

  return {
    id: `farmer-card-${Date.now()}-${idxSuffix}`,
    fullNameEn: fd.fullNameEn || '',
    fullNameMr: fd.fullNameMr || '',
    dob: formattedDob,
    gender: fd.gender || 'Male',
    mobile: fd.whatsappNumber || '',
    farmerId: fd.farmerId || '',
    aadhaarNo: fd.aadhaarNumber || '',
    address: fd.addressEn || 'At.Somthana Post.Mohaja',
    villageEn: fd.villageEn || villageEn || '',
    tehsilEn: fd.tehsilEn || tehsilEn || '',
    districtEn: fd.districtEn || districtEn || '',
    pincode: fd.pincode || '444504',
    villageMr: fd.villageMr || villageMr || '',
    tehsilMr: fd.tehsilMr || tehsilMr || '',
    districtMr: fd.districtMr || districtMr || '',
    photoUrl: parsed.extractedPhotoUrl || fd.photoUrl || '',
    lands,
  };
};

export const FarmerIdCardSection: React.FC = () => {
  // Multi-card state: supports up to 5 farmer cards on 1 A4 sheet
  const [cards, setCards] = useState<FarmerCardData[]>([DEFAULT_FARMER_CARD_SAMPLE]);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const activeCard = cards[activeCardIndex] || cards[0] || BLANK_FARMER_CARD;

  // DOB dropdown states
  const [dobDay, setDobDay] = useState<string>('');
  const [dobMonth, setDobMonth] = useState<string>('');
  const [dobYear, setDobYear] = useState<string>('');

  // View mode tab: 'form' (Edit details) or 'print' (On-page print preview like Maha ID/Aadhaar/PAN)
  const [activeViewTab, setActiveViewTab] = useState<'form' | 'print'>('form');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isHdModalOpen, setIsHdModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState<string>('');
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string>('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ text: string; isError?: boolean } | null>(null);

  // Form Validation State
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [validationAlert, setValidationAlert] = useState<string | null>(null);
  const [photoFitMode, setPhotoFitMode] = useState<'cover' | 'contain' | 'fill'>('fill');

  // Password Modal for encrypted PDF
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pendingPasswordFile, setPendingPasswordFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Validate Farmer Card form fields (Aadhaar Number and Khata No are explicitly OPTIONAL)
  const validateFarmerCard = (card: FarmerCardData): { isValid: boolean; errors: Record<string, string>; firstMessage?: string } => {
    const errors: Record<string, string> = {};

    // 1. Full Name (English)
    if (!card.fullNameEn || card.fullNameEn.trim() === '') {
      errors.fullNameEn = 'कृपया पूर्ण नाव (English) प्रविष्ट करा.';
    }

    // 2. Full Name (मराठी)
    if (!card.fullNameMr || card.fullNameMr.trim() === '') {
      errors.fullNameMr = 'कृपया पूर्ण नाव (मराठी) प्रविष्ट करा.';
    }

    // 3. Date of Birth (जन्म दिनांक)
    if (!card.dob || card.dob.trim() === '' || !card.dob.includes('/')) {
      errors.dob = 'कृपया जन्म दिनांक (Day, Month, Year) निवडा.';
    }

    // 4. Gender (लिंग)
    if (!card.gender || card.gender.trim() === '') {
      errors.gender = 'कृपया लिंग (Gender) निवडा.';
    }

    // 5. Mobile Number (मोबाईल नंबर)
    if (!card.mobile || card.mobile.trim().length < 10) {
      errors.mobile = 'कृपया १० अंकी मोबाईल नंबर प्रविष्ट करा.';
    }

    // 6. Photograph (फोटो)
    if (!card.photoUrl || card.photoUrl.trim() === '') {
      errors.photoUrl = 'कृपया शेतकरी पासपोर्ट फोटो निवडा.';
    }

    // 7. Farmer ID Number (फार्मर आयडी)
    if (!card.farmerId || card.farmerId.trim() === '') {
      errors.farmerId = 'कृपया फार्मर आयडी क्रमांक (Farmer ID) प्रविष्ट करा.';
    }

    // 8. Address in English (पत्ता)
    if (!card.address || card.address.trim() === '') {
      errors.address = 'कृपया संपूर्ण पत्ता (Address In English) प्रविष्ट करा.';
    }

    // 9. Land Details (जमिनीची माहिती)
    if (!card.lands || card.lands.length === 0) {
      errors.lands = 'कृपया किमान एका जमिनीच्या गटाची माहिती प्रविष्ट करा.';
    } else {
      card.lands.forEach((l, idx) => {
        if (!l.district || l.district.trim() === '') errors[`land_district_${idx}`] = `गट #${idx + 1}: जिल्हा आवश्यक आहे.`;
        if (!l.taluka || l.taluka.trim() === '') errors[`land_taluka_${idx}`] = `गट #${idx + 1}: तालुका आवश्यक आहे.`;
        if (!l.village || l.village.trim() === '') errors[`land_village_${idx}`] = `गट #${idx + 1}: गाव आवश्यक आहे.`;
        if (!l.gatNo || l.gatNo.trim() === '') errors[`land_gatNo_${idx}`] = `गट #${idx + 1}: गट नं. आवश्यक आहे.`;
        if (!l.areaHaR || l.areaHaR.trim() === '') errors[`land_areaHaR_${idx}`] = `गट #${idx + 1}: क्षेत्र आवश्यक आहे.`;
      });
    }

    // NOTE: Aadhaar Number (card.aadhaarNo) and Khate Number (land.khateNo) are OPTIONAL as requested!

    const errorKeys = Object.keys(errors);
    return {
      isValid: errorKeys.length === 0,
      errors,
      firstMessage: errorKeys.length > 0 ? errors[errorKeys[0]] : undefined,
    };
  };

  // Sync DOB dropdowns with formatted date
  const syncDobDropdowns = (dobStr?: string) => {
    if (dobStr && dobStr.includes('/')) {
      const parts = dobStr.split('/');
      if (parts.length === 3) {
        setDobDay(parts[0].padStart(2, '0'));
        const mIdx = parseInt(parts[1], 10) - 1;
        if (mIdx >= 0 && mIdx < MONTHS.length) {
          setDobMonth(MONTHS[mIdx]);
        }
        setDobYear(parts[2]);
        return;
      }
    }
    setDobDay('');
    setDobMonth('');
    setDobYear('');
  };

  const updateCardField = <K extends keyof FarmerCardData>(field: K, value: FarmerCardData[K]) => {
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (validationAlert) setValidationAlert(null);

    setCards((prev) => {
      const copy = [...prev];
      if (copy[activeCardIndex]) {
        copy[activeCardIndex] = { ...copy[activeCardIndex], [field]: value };
      }
      return copy;
    });
  };

  const handleDobPartChange = (part: 'day' | 'month' | 'year', val: string) => {
    let newDay = dobDay;
    let newMonth = dobMonth;
    let newYear = dobYear;

    if (part === 'day') {
      newDay = val;
      setDobDay(val);
    } else if (part === 'month') {
      newMonth = val;
      setDobMonth(val);
    } else if (part === 'year') {
      newYear = val;
      setDobYear(val);
    }

    if (formErrors.dob) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.dob;
        return next;
      });
    }
    if (validationAlert) setValidationAlert(null);

    if (newDay && newMonth && newYear) {
      const mIdx = MONTHS.indexOf(newMonth) + 1;
      const mStr = String(mIdx).padStart(2, '0');
      const formatted = `${newDay.padStart(2, '0')}/${mStr}/${newYear}`;
      updateCardField('dob', formatted);
    }
  };

  // Auto-transliterate English name to Marathi
  const handleAutoTransliterate = () => {
    if (!activeCard.fullNameEn.trim()) return;
    const marathi = transliterateEnglishToMarathi(activeCard.fullNameEn.trim());
    if (marathi) {
      updateCardField('fullNameMr', marathi);
    }
  };

  // Land actions
  const handleAddLand = () => {
    const newLand: FarmerCardLand = {
      id: `land-${Date.now()}`,
      district: activeCard.districtEn || 'WASHIM',
      taluka: activeCard.tehsilEn || 'Malegaon',
      village: activeCard.villageEn || 'Somthana',
      gatNo: '',
      khateNo: '',
      areaHaR: '0.00',
    };
    setCards((prev) => {
      const copy = [...prev];
      if (copy[activeCardIndex]) {
        copy[activeCardIndex] = {
          ...copy[activeCardIndex],
          lands: [...(copy[activeCardIndex].lands || []), newLand],
        };
      }
      return copy;
    });
  };

  const handleUpdateLand = (id: string, field: keyof FarmerCardLand, value: string) => {
    // Clear land errors if any
    if (validationAlert) setValidationAlert(null);
    setFormErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (k.startsWith('land_')) delete next[k];
      });
      return next;
    });

    setCards((prev) => {
      const copy = [...prev];
      if (copy[activeCardIndex]) {
        copy[activeCardIndex] = {
          ...copy[activeCardIndex],
          lands: (copy[activeCardIndex].lands || []).map((l) => (l.id === id ? { ...l, [field]: value } : l)),
        };
      }
      return copy;
    });
  };

  // Action Station: Validate form and navigate to print view
  const handlePrintCardClick = () => {
    const result = validateFarmerCard(activeCard);
    if (!result.isValid) {
      setFormErrors(result.errors);
      setValidationAlert(result.firstMessage || 'कृपया शेती परिचय पत्र प्रिंट करण्यापूर्वी सर्व आवश्यक माहिती भरा.');
      
      const errorEl = document.getElementById('form-validation-alert');
      if (errorEl) {
        errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        window.scrollTo({ top: 300, behavior: 'smooth' });
      }
      return;
    }

    // All required fields are valid! (Aadhaar & Khata No can be empty)
    setFormErrors({});
    setValidationAlert(null);
    setActiveViewTab('print');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemoveLand = (id: string) => {
    if ((activeCard.lands || []).length <= 1) return;
    setCards((prev) => {
      const copy = [...prev];
      if (copy[activeCardIndex]) {
        copy[activeCardIndex] = {
          ...copy[activeCardIndex],
          lands: copy[activeCardIndex].lands.filter((l) => l.id !== id),
        };
      }
      return copy;
    });
  };

  // Multiple PDF upload & batch parsing
  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadStatus({
      text: files.length > 1
        ? `${files.length} शेतकरी PDF फाइल्स वाचल्या जात आहेत...`
        : 'PDF मधून शेतकरी माहिती, जमिनीचे तपशील व फोटो आपोआप भरला जात आहे...',
    });

    try {
      const parsedCards: FarmerCardData[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadingFileName(file.name);
        try {
          const parsed = await parseFarmerRegistrationPdf(file);
          const newCard = createFarmerCardFromParsed(parsed, i + 1);
          parsedCards.push(newCard);
        } catch (fErr: any) {
          console.error(`Error parsing file ${file.name}:`, fErr);
          if (fErr?.message?.includes('password') || fErr?.name === 'PasswordException') {
            setPendingPasswordFile(file);
            setIsPasswordModalOpen(true);
          }
        }
      }

      if (parsedCards.length > 0) {
        setCards((prev) => {
          const isBlank = prev.length === 1 && !prev[0].farmerId && !prev[0].fullNameEn;
          const base = isBlank ? [] : prev;
          const combined = [...base, ...parsedCards].slice(0, 5);
          return combined;
        });

        // Set active card index to the newly loaded card
        const newTotal = Math.min(5, (cards[0]?.farmerId ? cards.length : 0) + parsedCards.length);
        const targetIdx = Math.max(0, newTotal - 1);
        setActiveCardIndex(targetIdx);
        syncDobDropdowns(parsedCards[0]?.dob);

        if (parsedCards[0]?.photoUrl) {
          setOriginalPhotoUrl(parsedCards[0].photoUrl);
        }

        if (newTotal === 1) {
          setUploadStatus({
            text: 'यशस्वी! पहिली PDF लोड झाली आहे. आता खाली दिलेल्या पिवळ्या बटणावर क्लिक करून "दुसरी PDF" अपलोड करा!',
          });
        } else {
          setUploadStatus({
            text: `यशस्वी! एकूण ${newTotal} शेतकरी कार्डे लोड झाली आहेत. A4 शीटवर सर्व PVC कार्डे प्रिंट करण्यास तयार!`,
          });
        }
      }
    } catch (err: any) {
      console.error('Batch PDF upload error:', err);
      setUploadStatus({ text: 'PDF वाचताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.', isError: true });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Card tab removal
  const handleRemoveCard = (index: number) => {
    if (cards.length <= 1) {
      setCards([BLANK_FARMER_CARD]);
      setActiveCardIndex(0);
      return;
    }
    const updated = cards.filter((_, idx) => idx !== index);
    setCards(updated);
    if (activeCardIndex >= updated.length) {
      setActiveCardIndex(updated.length - 1);
      syncDobDropdowns(updated[updated.length - 1]?.dob);
    } else {
      syncDobDropdowns(updated[activeCardIndex]?.dob);
    }
  };

  // Clear all cards
  const handleClearAllCards = () => {
    setCards([BLANK_FARMER_CARD]);
    setActiveCardIndex(0);
    setDobDay('');
    setDobMonth('');
    setDobYear('');
    setUploadStatus(null);
  };

  // Handle Photo Upload (Supports direct image uploads or PDF registration forms)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      setUploadStatus({ text: 'PDF मधून शेतकरी फोटो शोधत आहे...' });
      try {
        const extracted = await extractPhotoFromDocument(file);
        if (extracted) {
          setOriginalPhotoUrl(extracted);
          updateCardField('photoUrl', extracted);
          setPhotoFitMode('fill');
          setIsCropModalOpen(true);
          setUploadStatus({ text: 'फोटो यशस्वीरित्या सापडला! क्रॉप व सेंटर करा.' });
          setTimeout(() => setUploadStatus(null), 3000);
        } else {
          setUploadStatus({ text: 'PDF मध्ये फोटो सापडला नाही. कृपया इमेज निवडा.' });
          setTimeout(() => setUploadStatus(null), 3000);
        }
      } catch (err) {
        console.error('PDF photo error:', err);
        setUploadStatus({ text: 'फोटो काढण्यात अडचण आली.' });
        setTimeout(() => setUploadStatus(null), 3000);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setOriginalPhotoUrl(result);
          updateCardField('photoUrl', result);
          setPhotoFitMode('fill');
          setIsCropModalOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Direct Print handler
  const handleDirectPrint = async (mode: 'pvc-card' | 'a4-sheet') => {
    setIsPrinting(true);
    const farmerName = (activeCard.fullNameEn || activeCard.fullNameMr || 'Farmer').replace(/\s+/g, '_');

    try {
      if (mode === 'pvc-card') {
        await printComponent('printable-farmer-pvc-direct', `Farmer_PVC_${farmerName}`, {
          mode: 'pvc-card',
          cardWidthMm: 85.6,
          cardHeightMm: 54.0,
        });
      } else {
        await printComponent('printable-farmer-a4-sheet', `Farmer_A4_${farmerName}`, {
          mode: 'a4',
          cardWidthMm: 85.6,
          cardHeightMm: 54.0,
        });
      }
    } catch (err) {
      console.error('Direct print failed:', err);
    } finally {
      setIsPrinting(false);
    }
  };

  // Register High-Speed Keyboard Shortcuts for Cyber Cafe / CSC Operators (Ctrl+P, Ctrl+S, Alt+N, etc.)
  useRegisterShortcuts({
    onPrint: () => {
      if (activeViewTab === 'form') {
        const result = validateFarmerCard(activeCard);
        if (!result.isValid) {
          setFormErrors(result.errors);
          setValidationAlert(result.firstMessage || 'कृपया आवश्यक माहिती भरा.');
          const errorEl = document.getElementById('form-validation-alert');
          if (errorEl) errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        setFormErrors({});
        setValidationAlert(null);
        setActiveViewTab('print');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          handleDirectPrint('a4-sheet');
        }, 300);
      } else {
        handleDirectPrint('a4-sheet');
      }
    },
    onSave: () => {
      try {
        localStorage.setItem('dips_farmer_cards_draft', JSON.stringify(cards));
        setUploadStatus({
          text: `शेतकरी डेटा ड्राफ्ट यशस्वीरित्या सेव्ह केला! (${activeCard.fullNameMr || activeCard.fullNameEn || 'Farmer'})`
        });
        setTimeout(() => setUploadStatus(null), 4000);
      } catch (err) {
        console.warn('Draft save error:', err);
      }
    },
    onNewCard: () => {
      if (cards.length < 5) {
        const newCard: FarmerCardData = {
          ...BLANK_FARMER_CARD,
          id: `farmer-card-${Date.now()}-${cards.length + 1}`,
        };
        setCards((prev) => [...prev, newCard]);
        setActiveCardIndex(cards.length);
      } else {
        setCards([BLANK_FARMER_CARD]);
        setActiveCardIndex(0);
      }
      setActiveViewTab('form');
    },
    onToggleView: () => {
      setActiveViewTab((prev) => (prev === 'form' ? 'print' : 'form'));
    },
    onNextCard: () => {
      if (activeCardIndex < cards.length - 1) {
        const nextIdx = activeCardIndex + 1;
        setActiveCardIndex(nextIdx);
        syncDobDropdowns(cards[nextIdx]?.dob);
        if (cards[nextIdx]?.photoUrl) setOriginalPhotoUrl(cards[nextIdx].photoUrl);
      }
    },
    onPrevCard: () => {
      if (activeCardIndex > 0) {
        const prevIdx = activeCardIndex - 1;
        setActiveCardIndex(prevIdx);
        syncDobDropdowns(cards[prevIdx]?.dob);
        if (cards[prevIdx]?.photoUrl) setOriginalPhotoUrl(cards[prevIdx].photoUrl);
      }
    },
  });

  const handleResetForm = () => {
    setCards([BLANK_FARMER_CARD]);
    setActiveCardIndex(0);
    setDobDay('');
    setDobMonth('');
    setDobYear('');
    setUploadStatus(null);
  };

  const handleLoadSample = () => {
    setCards([DEFAULT_FARMER_CARD_SAMPLE]);
    setActiveCardIndex(0);
    setOriginalPhotoUrl(DEFAULT_FARMER_CARD_SAMPLE.photoUrl);
    syncDobDropdowns(DEFAULT_FARMER_CARD_SAMPLE.dob);
    setUploadStatus({
      text: 'डेमो शेतकरी कार्ड डेटा यशस्वीरीत्या लोड झाला!',
    });
    setTimeout(() => setUploadStatus(null), 4000);
  };

  // Reset photo back to original unedited state
  const handleResetPhoto = () => {
    if (originalPhotoUrl) {
      updateCardField('photoUrl', originalPhotoUrl);
      setUploadStatus({ text: 'मूळ फोटो पूर्ववत (Reset) केला!' });
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  // Remove photo cleanly
  const handleRemovePhoto = () => {
    updateCardField('photoUrl', '');
    setOriginalPhotoUrl('');
    setUploadStatus({ text: 'फोटो काढला आहे.' });
    setTimeout(() => setUploadStatus(null), 2500);
  };

  const totalAreaHa = calculateTotalArea(activeCard.lands || []);
  const totalAreaAcres = calculateTotalAreaAcres(activeCard.lands || []);

  return (
    <div 
      className="min-h-screen bg-slate-50/80 dark:bg-slate-950 py-6 sm:py-10 px-3 sm:px-6 relative text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200"
    >
      {/* File Input Component for Multiple PDF Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileSelect}
        accept=".pdf"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={photoInputRef}
        onChange={handlePhotoUpload}
        accept="image/*,.pdf,application/pdf"
        className="hidden"
      />

      <div className="max-w-4xl mx-auto space-y-5">
        
        {/* ON-PAGE VIEW NAVIGATION TABS (No popup! Exactly like Maha ID / Aadhaar / PAN) */}
        <div className="flex items-center justify-center bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setActiveViewTab('form')}
            className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeViewTab === 'form'
                ? 'bg-[#064e3b] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>📝 शेतकरी नोंदणी फॉर्म</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const result = validateFarmerCard(activeCard);
              if (!result.isValid) {
                setFormErrors(result.errors);
                setValidationAlert(result.firstMessage || 'कृपया शेती परिचय पत्र प्रिंट करण्यापूर्वी सर्व आवश्यक माहिती भरा.');
                setActiveViewTab('form');
                window.scrollTo({ top: 300, behavior: 'smooth' });
                return;
              }
              setFormErrors({});
              setValidationAlert(null);
              setActiveViewTab('print');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeViewTab === 'print'
                ? 'bg-[#0e4e96] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>🖨️ प्रिंट प्रिव्ह्यू ({cards.length})</span>
          </button>
        </div>

        {/* STATUS ALERT NOTIFICATION (Shown only in form view to avoid cluttering print view) */}
        {uploadStatus && activeViewTab === 'form' && (
          <div
            className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-xs border transition-all animate-in fade-in ${
              uploadStatus.isError
                ? 'bg-red-50 text-red-900 border-red-200'
                : 'bg-emerald-50 text-emerald-900 border-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{uploadStatus.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setUploadStatus(null)}
              className="text-xs text-emerald-800 hover:text-emerald-950 font-black cursor-pointer underline shrink-0"
            >
              बंद करा
            </button>
          </div>
        )}

        {activeViewTab === 'print' ? (
          <FarmerIdPrintView
            cards={cards}
            activeCardIndex={activeCardIndex}
            setActiveCardIndex={(idx) => {
              setActiveCardIndex(idx);
              syncDobDropdowns(cards[idx]?.dob);
              if (cards[idx]?.photoUrl) setOriginalPhotoUrl(cards[idx].photoUrl);
            }}
            onDeleteCard={handleRemoveCard}
            onOpenCrop={() => setIsCropModalOpen(true)}
            onBackToForm={() => setActiveViewTab('form')}
            onAddPdf={() => fileInputRef.current?.click()}
            photoFitMode={photoFitMode}
            setPhotoFitMode={setPhotoFitMode}
          />
        ) : (
          <>
            {/* PDF UPLOAD & MULTI-CARD MANAGEMENT BOX */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-200 dark:border-slate-800 p-4 sm:p-6 space-y-4">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 shrink-0">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shadow-xs shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-slate-100 tracking-tight whitespace-nowrap">
                      AgriStack Farmer ID Card
                    </h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 shrink-0">
                      {cards.length} शेतकरी
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href="https://connect.csc.gov.in/account/authorize?response_type=code&client_id=6d8bbc9d-868d-41ca-96ab-b4180be8a43e&redirect_uri=https://mhfr.agristack.gov.in/farmer-registry-api-mh/agristack/v1/api/csc/fr/login&state=c2c62291-6311-4ded-b43a-f7222af6fbfd"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative inline-flex items-center gap-2.5 px-4.5 py-2.5 sm:px-5 sm:py-3 bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600 hover:from-blue-600 hover:via-indigo-500 hover:to-blue-500 active:scale-[0.98] text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all cursor-pointer border border-blue-400/40"
                    title="अधिकृत CSC AgriStack पोर्टलवरून Farmer ID Card PDF डाउनलोड करा"
                  >
                    <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                      <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </span>
                    <span className="font-extrabold tracking-tight whitespace-nowrap">
                      Farmer ID Card PDF Download
                    </span>
                    <span className="w-5 h-5 rounded-lg bg-black/15 flex items-center justify-center text-blue-100 shrink-0 group-hover:translate-x-0.5 transition-transform">
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </a>
                </div>
              </div>

              {/* MULTI-CARD SELECTOR & ACTIVE CHIPS + PDF अपलोड करा */}
              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400">शेतकरी यादी:</span>
                  {cards && cards.length > 0 && cards.map((c, idx) => (
                    <button
                      key={c.id || idx}
                      type="button"
                      onClick={() => {
                        setActiveCardIndex(idx);
                        syncDobDropdowns(c.dob);
                        if (c.photoUrl) setOriginalPhotoUrl(c.photoUrl);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeCardIndex === idx
                          ? 'bg-[#064e3b] text-white shadow-xs'
                          : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700'
                      }`}
                    >
                      <span className="opacity-75">#{idx + 1}</span>
                      <span className="max-w-[130px] truncate">{c.fullNameMr || c.fullNameEn || 'शेतकरी'}</span>
                      {cards.length > 1 && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCard(idx);
                          }}
                          className="ml-1 hover:text-red-300 cursor-pointer text-xs"
                          title="काढून टाका"
                        >
                          ×
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* PDF अपलोड करा बटण */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="group relative inline-flex items-center gap-2 px-4 py-2 sm:px-4.5 sm:py-2.5 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:via-emerald-600 hover:to-teal-600 active:scale-[0.98] text-white rounded-xl font-bold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50 border border-emerald-500/30 shrink-0"
                  title="नवीन शेतकरी नोंदणी अर्जाची PDF अपलोड करा"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span className="font-extrabold tracking-tight whitespace-nowrap">PDF स्कॅन होत आहे...</span>
                    </>
                  ) : (
                    <>
                      <span className="w-5 h-5 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                        <FileText className="w-3.5 h-3.5 text-white" />
                      </span>
                      <span className="font-extrabold tracking-tight whitespace-nowrap">PDF अपलोड करा</span>
                    </>
                  )}
                </button>
              </div>
            </div>

        {/* MAIN APPLICATION FORM CONTAINER */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-200/80 dark:border-slate-800 p-6 sm:p-9 space-y-8 text-left">
          
            {/* Validation Alert Banner at top of form if errors exist */}
            {validationAlert && (
              <div
                id="form-validation-alert"
                className="p-4 bg-red-50 border-2 border-red-300 text-red-900 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-xs animate-in fade-in"
              >
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <span>{validationAlert}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setValidationAlert(null)}
                  className="text-xs text-red-700 hover:text-red-950 font-black cursor-pointer underline shrink-0"
                >
                  ✕
                </button>
              </div>
            )}

            {/* SECTION 1: PERSONAL INFORMATION */}
            {/* SECTION 1 & PHOTOGRAPH: SIDE-BY-SIDE GRID MATCHING SCREENSHOT */}
            <div className="space-y-5 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-black text-sm">
                  01
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <User className="w-4.5 h-4.5 text-emerald-700 dark:text-emerald-400" />
                    <span>वैयक्तिक माहिती (Personal Information)</span>
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-slate-400 font-medium">शेतकऱ्यांचे मूळ नाव आणि जन्मतारीख</p>
                </div>
              </div>

              {/* Grid: Left Column Inputs (7/12 or 8/12), Right Column Photo Studio (5/12 or 4/12) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Form Fields */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Full Name (English) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Full Name (English) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={activeCard.fullNameEn}
                        onChange={(e) => updateCardField('fullNameEn', e.target.value)}
                        placeholder="e.g. Dipak Madhav Khandare"
                        className={`w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-slate-100 dark:placeholder-slate-500 ${
                          formErrors.fullNameEn ? 'border-red-500 bg-red-50/30 dark:bg-red-950/30' : 'border-gray-300 dark:border-slate-700'
                        }`}
                      />
                      {activeCard.fullNameEn && !activeCard.fullNameMr && (
                        <button
                          type="button"
                          onClick={handleAutoTransliterate}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/60 hover:bg-emerald-200 dark:hover:bg-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          मराठी करा
                        </button>
                      )}
                    </div>
                    {formErrors.fullNameEn && (
                      <p className="text-[11px] text-red-600 dark:text-red-400 font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.fullNameEn}
                      </p>
                    )}
                  </div>

                  {/* Full Name (मराठी) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Full Name (मराठी) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={activeCard.fullNameMr}
                      onChange={(e) => updateCardField('fullNameMr', e.target.value)}
                      placeholder="उदा. दिपक माधव खंदारे"
                      className={`w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-slate-100 dark:placeholder-slate-500 ${
                        formErrors.fullNameMr ? 'border-red-500 bg-red-50/30 dark:bg-red-950/30' : 'border-gray-300 dark:border-slate-700'
                      }`}
                    />
                    {formErrors.fullNameMr && (
                      <p className="text-[11px] text-red-600 dark:text-red-400 font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.fullNameMr}
                      </p>
                    )}
                  </div>

                  {/* Gender Radio Pill Selectors */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Gender (लिंग) <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3 pt-0.5">
                      <label className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border font-bold text-xs cursor-pointer transition-all ${
                        activeCard.gender === 'Male'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500 text-emerald-900 dark:text-emerald-300 shadow-xs'
                          : formErrors.gender ? 'border-red-400 bg-red-50/30 text-gray-600 dark:text-slate-400' : 'bg-gray-50/50 dark:bg-slate-800/80 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}>
                        <input
                          type="radio"
                          name="gender"
                          value="Male"
                          checked={activeCard.gender === 'Male'}
                          onChange={() => updateCardField('gender', 'Male')}
                          className="hidden"
                        />
                        <span>👨 Male / पुरुष</span>
                      </label>

                      <label className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border font-bold text-xs cursor-pointer transition-all ${
                        activeCard.gender === 'Female'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500 text-emerald-900 dark:text-emerald-300 shadow-xs'
                          : formErrors.gender ? 'border-red-400 bg-red-50/30 text-gray-600 dark:text-slate-400' : 'bg-gray-50/50 dark:bg-slate-800/80 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}>
                        <input
                          type="radio"
                          name="gender"
                          value="Female"
                          checked={activeCard.gender === 'Female'}
                          onChange={() => updateCardField('gender', 'Female')}
                          className="hidden"
                        />
                        <span>👩 Female / महिला</span>
                      </label>
                    </div>
                    {formErrors.gender && (
                      <p className="text-[11px] text-red-600 dark:text-red-400 font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.gender}
                      </p>
                    )}
                  </div>

                  {/* Date of Birth Selects */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Date of Birth (जन्म दिनांक) <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={dobDay}
                        onChange={(e) => handleDobPartChange('day', e.target.value)}
                        className={`px-3 py-2.5 bg-gray-50/50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer dark:text-slate-100 ${
                          formErrors.dob ? 'border-red-500 bg-red-50/30 dark:bg-red-950/30' : 'border-gray-300 dark:border-slate-700'
                        }`}
                      >
                        <option value="">Day (दिवस)</option>
                        {DAYS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <select
                        value={dobMonth}
                        onChange={(e) => handleDobPartChange('month', e.target.value)}
                        className={`px-3 py-2.5 bg-gray-50/50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer dark:text-slate-100 ${
                          formErrors.dob ? 'border-red-500 bg-red-50/30 dark:bg-red-950/30' : 'border-gray-300 dark:border-slate-700'
                        }`}
                      >
                        <option value="">Month (महिना)</option>
                        {MONTHS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select
                        value={dobYear}
                        onChange={(e) => handleDobPartChange('year', e.target.value)}
                        className={`px-3 py-2.5 bg-gray-50/50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer dark:text-slate-100 ${
                          formErrors.dob ? 'border-red-500 bg-red-50/30 dark:bg-red-950/30' : 'border-gray-300 dark:border-slate-700'
                        }`}
                      >
                        <option value="">Year (वर्ष)</option>
                        {YEARS.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    {formErrors.dob && (
                      <p className="text-[11px] text-red-600 dark:text-red-400 font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.dob}
                      </p>
                    )}
                  </div>

                  {/* WhatsApp Number */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      WhatsApp / Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-xs font-bold text-gray-500 dark:text-slate-400 select-none">
                        IN +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={activeCard.mobile}
                        onChange={(e) => updateCardField('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9049102035"
                        className={`w-full pl-20 pr-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border rounded-2xl text-sm font-semibold tracking-wider focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-slate-100 dark:placeholder-slate-500 ${
                          formErrors.mobile ? 'border-red-500 bg-red-50/30 dark:bg-red-950/30' : 'border-gray-300 dark:border-slate-700'
                        }`}
                      />
                    </div>
                    {formErrors.mobile && (
                      <p className="text-[11px] text-red-600 dark:text-red-400 font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.mobile}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Column: Photo Upload Studio Card (Aligned right side matching screenshot) */}
                <div className="lg:col-span-5 flex flex-col items-center justify-start p-4 bg-gray-50/40 dark:bg-slate-800/40 rounded-3xl border border-gray-100 dark:border-slate-800 h-full min-h-[320px]">
                  <div className="w-full flex flex-col items-center space-y-4 my-auto">
                    {/* Photo Frame Container (Matches exact passport aspect ratio 3:4 with border) */}
                    <div
                      className={`relative w-36 h-48 sm:w-40 sm:h-52 bg-white rounded-xl border-2 shadow-sm overflow-hidden flex flex-col items-center justify-center transition-all ${
                        formErrors.photoUrl ? 'border-red-500 ring-2 ring-red-200' : 'border-[#006837]'
                      }`}
                    >
                      {activeCard.photoUrl && activeCard.photoUrl.trim() !== '' ? (
                        <div className="relative w-full h-full flex items-center justify-center bg-white overflow-hidden">
                          <img
                            src={activeCard.photoUrl}
                            alt="Farmer Passport"
                            style={{
                              objectFit: photoFitMode === 'contain' ? 'contain' : (photoFitMode === 'cover' ? 'cover' : 'fill'),
                              objectPosition: 'center center',
                            }}
                            className="w-full h-full"
                          />
                        </div>
                      ) : (
                        <div
                          onClick={() => photoInputRef.current?.click()}
                          className="flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 p-3 text-center space-y-2 cursor-pointer w-full h-full hover:bg-emerald-50/30 transition-colors"
                        >
                          <Camera className="w-9 h-9 text-emerald-500 stroke-[1.8]" />
                          <span className="text-xs font-bold text-gray-600 dark:text-slate-300">फोटो निवडा</span>
                        </div>
                      )}
                    </div>

                    {formErrors.photoUrl && (
                      <p className="text-xs text-red-600 dark:text-red-400 font-bold flex items-center gap-1 text-center">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {formErrors.photoUrl}
                      </p>
                    )}

                    {/* Primary Button: Choose / Change Photo */}
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#006837] hover:bg-[#00522b] text-white rounded-2xl font-bold text-xs sm:text-sm shadow-sm cursor-pointer transition-all active:scale-95 w-full max-w-[210px]"
                    >
                      <Camera className="w-4 h-4 text-emerald-200" />
                      <span>{activeCard.photoUrl ? 'फोटो बदला (Change Photo)' : 'फोटो निवडा (Choose Photo)'}</span>
                    </button>

                    {/* Secondary Action Buttons (Crop Photo & Remove Photo) */}
                    {activeCard.photoUrl && (
                      <div className="flex items-center justify-center gap-2 pt-1 w-full max-w-[260px]">
                        <button
                          type="button"
                          onClick={() => setIsCropModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs cursor-pointer transition-all active:scale-95 border bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800"
                          title="फोटो क्रॉप व ऍडजस्ट करा (चेहरा मध्यभागी करा, झूम ऍडजस्ट करा)"
                        >
                          <Crop className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                          <span>फोटो क्रॉप (Crop Photo)</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold text-xs shadow-2xs cursor-pointer transition-all active:scale-95"
                          title="फोटो काढून टाका"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>काढा</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3 & 4: IDENTIFICATION NUMBERS & RESIDENTIAL ADDRESS (SIDE-BY-SIDE MATCHING SCREENSHOT) */}
            <div className="space-y-5 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-black text-sm">
                  03
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <CreditCard className="w-4.5 h-4.5 text-emerald-700 dark:text-emerald-400" />
                    <span>ओळख क्रमांक (Identification Numbers)</span>
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-slate-400 font-medium">आधार (ऐच्छिक) आणि शेतकरी आयडी क्रमांक</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Left Side: Aadhaar & Farmer ID */}
                <div className="space-y-4">
                  {/* Aadhaar Number */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Aadhaar Number (UID) <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium ml-1">(ऐच्छिक / Optional)</span>
                    </label>
                    <input
                      type="text"
                      maxLength={14}
                      value={activeCard.aadhaarNo}
                      onChange={(e) => {
                        const cleanDigits = e.target.value.replace(/\D/g, '').slice(0, 12);
                        const formatted = cleanDigits ? cleanDigits.replace(/(\d{4})(?=\d)/g, '$1 ').trim() : '';
                        updateCardField('aadhaarNo', formatted);
                      }}
                      placeholder="उदा. 9420 4790 8747"
                      className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-2xl text-sm font-mono font-bold tracking-wider focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-slate-100 dark:placeholder-slate-500"
                    />
                    <p className="text-[11px] text-gray-400 dark:text-slate-400 mt-1">फक्त १२ अंकी आधार नंबर टाईप करता येईल (किंवा रिकामे ठेवू शकता).</p>
                  </div>

                  {/* Farmer ID Number */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Farmer ID Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={activeCard.farmerId}
                      onChange={(e) => updateCardField('farmerId', e.target.value)}
                      placeholder="उदा. 80368738190"
                      className={`w-full px-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border rounded-2xl text-sm font-mono font-bold tracking-wider focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-slate-100 dark:placeholder-slate-500 ${
                        formErrors.farmerId ? 'border-red-500 bg-red-50/30 dark:bg-red-950/30' : 'border-gray-300 dark:border-slate-700'
                      }`}
                    />
                    {formErrors.farmerId && (
                      <p className="text-[11px] text-red-600 dark:text-red-400 font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.farmerId}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Side: Residential Details Address */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                    Address In English <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={activeCard.address || ''}
                    onChange={(e) => updateCardField('address', e.target.value)}
                    placeholder="उदा. At.Somthana Post.Mohaja"
                    className={`w-full px-4 py-3 bg-gray-50/50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-slate-100 dark:placeholder-slate-500 resize-none ${
                      formErrors.address ? 'border-red-500 bg-red-50/30 dark:bg-red-950/30' : 'border-gray-300 dark:border-slate-700'
                    }`}
                  />
                  {formErrors.address ? (
                    <p className="text-[11px] text-red-600 dark:text-red-400 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.address}
                    </p>
                  ) : (
                    <p className="text-[11px] text-gray-400 dark:text-slate-400 mt-1">
                      PDF मधील पत्ता थेट १ ओळीत (उदा. At.Somthana Post.Mohaja)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 5: LAND DETAILS / जमिनीची माहिती */}
            <div className="space-y-5 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-black text-sm">
                  05
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <Layers className="w-4.5 h-4.5 text-emerald-700 dark:text-emerald-400" />
                    <span>Land Details / जमिनीची माहिती</span>
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-slate-400 font-medium">सातबारा व खाते नोंदी (खाते नं. ऐच्छिक आहे)</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#006837] text-white">
                      <th className="py-3 px-3.5 font-bold">जिल्हा (District) *</th>
                      <th className="py-3 px-3.5 font-bold">तालुका (Tehsil) *</th>
                      <th className="py-3 px-3.5 font-bold">गाव (Village) *</th>
                      <th className="py-3 px-3 font-bold text-center">गट नं. (Gat No) *</th>
                      <th className="py-3 px-3 font-bold text-center">
                        खाते नं. <span className="text-[10px] text-emerald-200 font-normal">(ऐच्छिक)</span>
                      </th>
                      <th className="py-3 px-3.5 font-bold text-right">क्षेत्र (हे.आर) *</th>
                      <th className="py-3 px-3 text-center font-bold w-16">क्रिया</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {activeCard.lands.map((land, idx) => (
                      <tr key={land.id} className="hover:bg-emerald-50/40 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="p-2">
                          <input
                            type="text"
                            value={land.district}
                            onChange={(e) => handleUpdateLand(land.id, 'district', e.target.value)}
                            placeholder="WASHIM"
                            className={`w-full px-3 py-2 border rounded-2xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 ${
                              formErrors[`land_district_${idx}`] ? 'border-red-500 bg-red-50/40 dark:bg-red-950/40' : 'border-gray-200 dark:border-slate-700'
                            }`}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={land.taluka}
                            onChange={(e) => handleUpdateLand(land.id, 'taluka', e.target.value)}
                            placeholder="Malegaon"
                            className={`w-full px-3 py-2 border rounded-2xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 ${
                              formErrors[`land_taluka_${idx}`] ? 'border-red-500 bg-red-50/40 dark:bg-red-950/40' : 'border-gray-200 dark:border-slate-700'
                            }`}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={land.village}
                            onChange={(e) => handleUpdateLand(land.id, 'village', e.target.value)}
                            placeholder="Somthana"
                            className={`w-full px-3 py-2 border rounded-2xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 ${
                              formErrors[`land_village_${idx}`] ? 'border-red-500 bg-red-50/40 dark:bg-red-950/40' : 'border-gray-200 dark:border-slate-700'
                            }`}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={land.gatNo}
                            onChange={(e) => handleUpdateLand(land.id, 'gatNo', e.target.value)}
                            placeholder="126"
                            className={`w-full px-2 py-2 text-center font-mono font-bold border rounded-2xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 ${
                              formErrors[`land_gatNo_${idx}`] ? 'border-red-500 bg-red-50/40 dark:bg-red-950/40' : 'border-gray-200 dark:border-slate-700'
                            }`}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={land.khateNo || ''}
                            onChange={(e) => handleUpdateLand(land.id, 'khateNo', e.target.value)}
                            placeholder="-"
                            className="w-full px-2 py-2 text-center font-mono border border-gray-200 dark:border-slate-700 rounded-2xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                            title="खाते नंबर ऐच्छिक आहे (रिकामे ठेवू शकता)"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={land.areaHaR}
                            onChange={(e) => handleUpdateLand(land.id, 'areaHaR', e.target.value)}
                            placeholder="1.06"
                            className={`w-full px-3 py-2 text-right font-mono font-bold text-emerald-800 dark:text-emerald-300 border rounded-2xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none dark:bg-slate-800 dark:placeholder-slate-500 ${
                              formErrors[`land_areaHaR_${idx}`] ? 'border-red-500 bg-red-50/40 dark:bg-red-950/40' : 'border-gray-200 dark:border-slate-700'
                            }`}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center">
                            {activeCard.lands.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => handleRemoveLand(land.id)}
                                className="w-7 h-7 rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                                title="काढून टाका"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-gray-300 dark:text-slate-600 text-xs font-mono">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Action Button and Summary Badges in Perfect Alignment */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                {/* 1st Position: Add Land Button */}
                <button
                  type="button"
                  onClick={handleAddLand}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border-2 border-emerald-400 dark:border-emerald-700 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Plus className="w-4 h-4 text-emerald-700 dark:text-emerald-400 stroke-[2.5] shrink-0" />
                  <span>आणखी जमिनीचा गट जोडा (Add Land)</span>
                </button>

                {/* Right Side Summary Badges */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Badge 1: Total Registered Lands */}
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50/60 dark:bg-emerald-950/60 border-2 border-emerald-300 dark:border-emerald-800 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-950 dark:text-emerald-200 whitespace-nowrap shadow-2xs">
                    <span>एकूण</span>
                    <span className="font-mono font-black text-emerald-900 dark:text-emerald-300 px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded-md shadow-2xs border border-emerald-200/50 dark:border-slate-700">
                      {activeCard.lands?.length || 1}
                    </span>
                    <span>गट नोंदवले आहेत.</span>
                  </div>

                  {/* Badge 2: Total Area */}
                  <div className="inline-flex items-center gap-2 bg-emerald-50/60 dark:bg-emerald-950/60 border-2 border-emerald-300 dark:border-emerald-800 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-900 dark:text-emerald-200 whitespace-nowrap shadow-2xs">
                    <span>एकूण क्षेत्र:</span>
                    <span className="font-mono text-emerald-800 dark:text-emerald-300 font-black">{totalAreaHa} हे.आर ({totalAreaAcres} एकर)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 6: HIGH-IMPACT PRINTING ACTION STATION */}
            <div className="pt-6 border-t-2 border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-3 text-center">
              {validationAlert && (
                <div id="form-validation-alert" className="w-full max-w-lg p-3.5 bg-red-50 border-2 border-red-300 text-red-900 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <span>{validationAlert}</span>
                </div>
              )}

              {/* Single Prominent Print Button Matching Screenshot */}
              <div className="w-full max-w-lg">
                <button
                  type="button"
                  onClick={handlePrintCardClick}
                  disabled={isPrinting}
                  className="w-full py-3.5 px-6 bg-[#006837] hover:bg-[#00522b] active:scale-[0.98] text-white rounded-2xl text-sm sm:text-base font-black shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-3 border border-emerald-700/50"
                  title="शेती परिचय पत्र प्रिंट काढा (Ctrl + P)"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Printer className="w-5 h-5 text-amber-300" />
                  </div>
                  <span>शेती परिचय पत्र प्रिंट काढा (Print Farmer ID Card)</span>
                </button>
              </div>

              <p className="text-xs text-gray-500 font-medium max-w-lg">
                सर्व आवश्यक (*) माहिती भरून झाल्यानंतर शेती परिचय पत्राची (Farmer ID Card) अधिकृत प्रिंट
              </p>
            </div>

        </div>
          </>
        )}

      </div>

      {/* MODALS */}
      {/* 1. Photo Crop Modal */}
      {isCropModalOpen && (activeCard.photoUrl || originalPhotoUrl) && (
        <PhotoCropModal
          isOpen={isCropModalOpen}
          imageSrc={originalPhotoUrl || activeCard.photoUrl}
          onCropComplete={(croppedUrl: string) => {
            updateCardField('photoUrl', croppedUrl);
            setPhotoFitMode('fill');
            setIsCropModalOpen(false);
          }}
          onClose={() => setIsCropModalOpen(false)}
        />
      )}

      {/* 2. Photo HD Modal */}
      {isHdModalOpen && activeCard.photoUrl && (
        <PhotoHdModal
          isOpen={isHdModalOpen}
          originalPhotoUrl={activeCard.photoUrl}
          onApplyHdPhoto={(hdUrl: string) => {
            updateCardField('photoUrl', hdUrl);
            setPhotoFitMode('cover');
            setIsHdModalOpen(false);
          }}
          onClose={() => setIsHdModalOpen(false)}
        />
      )}

      {/* 3. PDF Password Modal */}
      {isPasswordModalOpen && (
        <PdfPasswordModal
          isOpen={isPasswordModalOpen}
          fileName={pendingPasswordFile?.name || 'Farmer_Registration.pdf'}
          onSubmit={async (password: string) => {
            if (pendingPasswordFile) {
              try {
                const parsed = await parseFarmerRegistrationPdf(pendingPasswordFile);
                if (parsed?.formData) {
                  const newCard = createFarmerCardFromParsed(parsed, activeCardIndex + 1);
                  setCards((prev) => {
                    const copy = [...prev];
                    copy[activeCardIndex] = newCard;
                    return copy;
                  });
                  syncDobDropdowns(newCard.dob);
                  if (newCard.photoUrl) setOriginalPhotoUrl(newCard.photoUrl);
                }
                setIsPasswordModalOpen(false);
              } catch {
                alert('पासवर्ड अयोग्य आहे.');
              }
            }
          }}
          onClose={() => setIsPasswordModalOpen(false)}
        />
      )}

      {/* 5. PDF READING / PARSING STATUS OVERLAY */}
      {isUploading && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-emerald-100 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-600 shadow-inner">
                <FileText className="w-8 h-8 text-emerald-600 animate-pulse" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center shadow-md">
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-gray-900">
                PDF Reading...
              </h3>
              <p className="text-xs text-emerald-700 font-bold">
                PDF वाचत आहे • स्मार्ट AI स्कॅनिंग
              </p>
              {uploadingFileName && (
                <p className="text-[11px] text-gray-500 truncate max-w-[240px] font-mono bg-slate-50 px-2 py-1 rounded-md border border-slate-200 mt-1">
                  {uploadingFileName}
                </p>
              )}
            </div>

            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full animate-pulse" style={{ width: '100%' }} />
            </div>

            <p className="text-xs text-gray-500">
              नाव, जन्मतारीख, पत्ता, जमिनीचे गट व फोटो आपोआप भरला जात आहे...
            </p>
          </div>
        </div>
      )}

      {/* Hidden Portal for Instant High-Res PVC Direct Printing & Multi-Card A4 Sheets */}
      <FarmerIdPrintPortal activeCard={activeCard} cards={cards} photoFitMode={photoFitMode} />
    </div>
  );
};

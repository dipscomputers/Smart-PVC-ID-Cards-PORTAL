import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Upload,
  Printer,
  Download,
  Plus,
  Trash2,
  Crop,
  CreditCard,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Info,
  Calendar,
  Phone,
  User,
  MapPin,
  Eye,
  RefreshCw,
} from 'lucide-react';
import QRCode from 'qrcode';
import { FarmerFormData, LandDetail } from '../types/form';
import { AgriRecordCardFront, AgriRecordCardBack } from './AgriRecordCard';
import { PhotoCropModal } from './PhotoCropModal';
import { PdfPreviewModal } from './PdfPreviewModal';
import { parseFarmerRegistrationPdf } from '../utils/farmerRegistrationPdfParser';
import { printComponent } from '../utils/printHelper';

// Default initial state matching the user's uploaded demo PDF (Bhagwan Sampat Khandare)
const DEMO_FARMER_DATA: FarmerFormData = {
  fullNameEn: 'BHAGWAN SAMPAT KHANDARE',
  fullNameMr: 'भगवान संपत खंदारे',
  dobDay: '01',
  dobMonth: 'January',
  dobYear: '1971',
  gender: 'Male',
  whatsappNumber: '9529566711',
  aadhaarNumber: '9420 4790 8747',
  farmerId: '64578030749',
  addressEn: 'AT.SOMTHANA POST. MOHAJA TQ MALEGAON DIST.WASHIM',
  villageEn: 'SOMTHANA',
  subDistrictEn: 'MOHAJA',
  tehsilEn: 'MALEGAON',
  districtEn: 'WASHIM',
  pincode: '444503',
  villageMr: 'रा. सोमठाणा पो. मोहजा ता. मालेगाव जि. वाशीम',
  tehsilMr: 'मालेगाव',
  districtMr: 'वाशीम',
  photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
  lands: [
    {
      id: 'land-1',
      district: 'WASHIM',
      taluka: 'Malegaon',
      village: 'SOMTHANA',
      gatNo: '114',
      khateNo: '',
      areaHaR: '0.68',
    },
    {
      id: 'land-2',
      district: 'WASHIM',
      taluka: 'Malegaon',
      village: 'SOMTHANA',
      gatNo: '121',
      khateNo: '',
      areaHaR: '0.21',
    },
    {
      id: 'land-3',
      district: 'WASHIM',
      taluka: 'Malegaon',
      village: 'SOMTHANA',
      gatNo: '241',
      khateNo: '',
      areaHaR: '0.02',
    },
  ],
  applicationNo: '27_499_3995_530706_005106',
  submittedAt: new Date().toISOString(),
};

export const FarmerId01Section: React.FC = () => {
  const [formData, setFormData] = useState<FarmerFormData>(DEMO_FARMER_DATA);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [cardViewMode, setCardViewMode] = useState<'front' | 'back' | 'both'>('both');
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [parseStatus, setParseStatus] = useState<{ text: string; isError?: boolean } | null>(null);

  // Stored original PDF for "JASI PDF AAHE TSI PRINT OPTION DE"
  const [originalPdfUrl, setOriginalPdfUrl] = useState<string | null>(null);
  const [originalPdfName, setOriginalPdfName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Generate QR payload
  const qrPayload = useMemo(() => {
    return JSON.stringify({
      app: 'AgriRecord',
      title: 'शेती परिचय पत्र ०१',
      farmerId: formData.farmerId,
      nameMr: formData.fullNameMr,
      nameEn: formData.fullNameEn,
      gender: formData.gender,
      mobile: formData.whatsappNumber,
      aadhaar: formData.aadhaarNumber,
      totalArea: formData.lands.reduce((acc, l) => acc + (parseFloat(l.areaHaR) || 0), 0).toFixed(2),
    });
  }, [formData]);

  useEffect(() => {
    QRCode.toDataURL(qrPayload, {
      width: 220,
      margin: 1,
      color: {
        dark: '#1e5631',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, [qrPayload]);

  // Handle PDF Upload & Automatic Data Extraction
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setParseStatus({ text: 'कृपया योग्य PDF फाईल (.pdf) निवडा.', isError: true });
      return;
    }

    setIsParsingPdf(true);
    setParseStatus({ text: 'PDF मधून शेतकरी माहिती, जमिनीचे गट व फोटो काढला जात आहे...' });

    try {
      // Create Object URL for viewing/printing original PDF
      const pdfUrl = URL.createObjectURL(file);
      setOriginalPdfUrl(pdfUrl);
      setOriginalPdfName(file.name);

      const parsed = await parseFarmerRegistrationPdf(file);

      setFormData((prev) => ({
        ...prev,
        ...parsed.formData,
        fullNameEn: parsed.formData.fullNameEn || prev.fullNameEn,
        fullNameMr: parsed.formData.fullNameMr || prev.fullNameMr,
        dobDay: parsed.formData.dobDay || prev.dobDay,
        dobMonth: parsed.formData.dobMonth || prev.dobMonth,
        dobYear: parsed.formData.dobYear || prev.dobYear,
        gender: parsed.formData.gender || prev.gender,
        whatsappNumber: parsed.formData.whatsappNumber || prev.whatsappNumber,
        farmerId: parsed.formData.farmerId || prev.farmerId,
        aadhaarNumber: parsed.formData.aadhaarNumber || prev.aadhaarNumber,
        addressEn: parsed.formData.addressEn || prev.addressEn,
        lands: parsed.formData.lands && parsed.formData.lands.length > 0 ? parsed.formData.lands : prev.lands,
        photoUrl: parsed.formData.photoUrl || prev.photoUrl,
        applicationNo: parsed.enrollmentNo || prev.applicationNo,
      }));

      setParseStatus({
        text: `यशस्वी! ${parsed.formData.fullNameMr || parsed.formData.fullNameEn || 'शेतकरी'} यांची माहिती व ${parsed.formData.lands?.length || 0} जमिनीचे गट PDF मधून ऑटो-फिल झाले!`,
      });

      setTimeout(() => setParseStatus(null), 6000);
    } catch (err) {
      console.error('PDF parsing error:', err);
      setParseStatus({
        text: 'PDF वाचताना त्रुटी आली. कृपया मॅन्युअली माहिती तपासा किंवा बदला.',
        isError: true,
      });
    } finally {
      setIsParsingPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setFormData((prev) => ({ ...prev, photoUrl: result }));
          setIsCropModalOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Add Land Row
  const handleAddLand = () => {
    const newLand: LandDetail = {
      id: `land-${Date.now()}`,
      district: formData.districtEn || 'WASHIM',
      taluka: formData.tehsilEn || 'Malegaon',
      village: formData.villageEn || 'SOMTHANA',
      gatNo: '',
      khateNo: '',
      areaHaR: '0.00',
    };
    setFormData((prev) => ({
      ...prev,
      lands: [...prev.lands, newLand],
    }));
  };

  // Update Land Row
  const handleUpdateLand = (id: string, field: keyof LandDetail, value: string) => {
    setFormData((prev) => ({
      ...prev,
      lands: prev.lands.map((land) => (land.id === id ? { ...land, [field]: value } : land)),
    }));
  };

  // Delete Land Row
  const handleDeleteLand = (id: string) => {
    if (formData.lands.length <= 1) {
      alert('किमान १ जमिनीचा गट आवश्यक आहे.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      lands: prev.lands.filter((land) => land.id !== id),
    }));
  };

  // Calculate Total Land Area
  const totalAreaHaR = useMemo(() => {
    const sum = formData.lands.reduce((acc, land) => {
      const val = parseFloat(land.areaHaR || '0');
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    return sum.toFixed(2);
  }, [formData.lands]);

  // Handle Print Original Registration PDF ("JASI PDF AAHE TSI PRINT OPTION DE")
  const handlePrintOriginalPdf = () => {
    if (originalPdfUrl) {
      const printWin = window.open(originalPdfUrl, '_blank');
      if (printWin) {
        printWin.focus();
      }
    } else {
      // Print official printable form view
      printComponent('printable-registration-form-sheet', 'Farmer_Registration_Form_Original', {
        mode: 'a4',
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header Banner & Actions */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                Farmer ID Card 01 • शेती परिचय पत्र
              </span>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                AgriStack Format
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2 tracking-tight">
              Farmer ID Card 01 (शेतकरी ओळखपत्र)
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
              खालील फॉर्ममध्ये माहिती भरा किंवा <strong>Farmer Registration Form PDF अपलोड करा</strong>. सिस्टीम आपोआप संपूर्ण माहिती व फोटो भरून परिपूर्ण <strong>85.6 mm × 54.0 mm PVC कार्ड</strong> तयार करेल.
            </p>
          </div>

          {/* Top Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Hidden File Input for PDF */}
            <input
              type="file"
              ref={fileInputRef}
              accept="application/pdf,.pdf"
              onChange={handlePdfUpload}
              className="hidden"
            />

            {/* Upload PDF Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsingPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Upload Farmer Registration Form PDF"
            >
              {isParsingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  PDF वाचत आहे...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-emerald-200" />
                  PDF अपलोड करा (Auto-Fill)
                </>
              )}
            </button>

            {/* Print Original PDF Option ("JASI PDF AAHE TSI PRINT OPTION DE") */}
            <button
              type="button"
              onClick={handlePrintOriginalPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
              title="Print original Farmer Registration Form PDF"
            >
              <FileText className="w-4 h-4 text-blue-200" />
              मूळ फॉर्म प्रिंट (Original PDF)
            </button>

            {/* Print PVC Card Button (CR80 85.6 mm x 54 mm) */}
            <button
              type="button"
              onClick={() => setIsPdfModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1e5631] hover:bg-[#164325] text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-emerald-900/20 hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5"
              title="Print Farmer ID Card in exact PVC Dimensions"
            >
              <Printer className="w-4 h-4 text-yellow-300" />
              PVC प्रिंट काढा (85.6 × 54 mm)
            </button>
          </div>
        </div>

        {/* Status Notification */}
        {parseStatus && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in fade-in ${
              parseStatus.isError
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
            }`}
          >
            {parseStatus.isError ? (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <span>{parseStatus.text}</span>
          </div>
        )}
      </div>

      {/* 2. Main Form Inputs (Full Width Clean Layout) */}
      <div className="w-full max-w-5xl mx-auto space-y-6">
        
        {/* SECTION A: Personal Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-800" />
              <h2 className="text-base sm:text-lg font-black text-gray-900">
                Personal Information (वैयक्तिक माहिती)
              </h2>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              PVC कार्डसाठी आवश्यक माहिती
            </span>
          </div>

          {/* Photo & Basic Info Row */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {/* Photo Box */}
            <div className="flex flex-col items-center gap-2 shrink-0 mx-auto sm:mx-0">
              <input
                type="file"
                ref={photoInputRef}
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <div
                onClick={() => photoInputRef.current?.click()}
                className="relative w-28 h-32 rounded-xl border-2 border-dashed border-emerald-600/70 hover:border-emerald-700 bg-emerald-50/50 flex flex-col items-center justify-center overflow-hidden cursor-pointer shadow-inner group transition-all"
                title="फोटो बदला किंवा अपलोड करा"
              >
                {formData.photoUrl ? (
                  <img
                    src={formData.photoUrl}
                    alt="Farmer"
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="text-center p-2">
                    <User className="w-8 h-8 text-emerald-600 mx-auto" />
                    <span className="text-[10px] text-emerald-800 font-bold block mt-1">
                      फोटो अपलोड
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-bold transition-opacity">
                  बदला
                </div>
              </div>

              {formData.photoUrl && (
                <button
                  type="button"
                  onClick={() => setIsCropModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-md text-[11px] font-bold cursor-pointer transition-colors"
                >
                  <Crop className="w-3 h-3" />
                  फोटो क्रॉप
                </button>
              )}
            </div>

            {/* Names Input */}
            <div className="flex-1 w-full space-y-4">
              {/* Full Name in Marathi */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Full Name (Marathi / स्थानिक भाषेत नाव) *
                </label>
                <input
                  type="text"
                  value={formData.fullNameMr}
                  onChange={(e) => setFormData({ ...formData, fullNameMr: e.target.value })}
                  placeholder="उदा. भगवान संपत खंदारे"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Full Name in English */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Full Name (English / इंग्रजीत नाव) *
                </label>
                <input
                  type="text"
                  value={formData.fullNameEn}
                  onChange={(e) => setFormData({ ...formData, fullNameEn: e.target.value.toUpperCase() })}
                  placeholder="e.g. BHAGWAN SAMPAT KHANDARE"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none uppercase"
                />
              </div>
            </div>
          </div>

          {/* DOB & Gender & Mobile Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                Date of Birth (DOB) *
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <input
                  type="text"
                  maxLength={2}
                  placeholder="DD"
                  value={formData.dobDay}
                  onChange={(e) => setFormData({ ...formData, dobDay: e.target.value })}
                  className="px-2 py-2 border border-gray-300 rounded-lg text-xs text-center font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  maxLength={10}
                  placeholder="Month"
                  value={formData.dobMonth}
                  onChange={(e) => setFormData({ ...formData, dobMonth: e.target.value })}
                  className="px-2 py-2 border border-gray-300 rounded-lg text-xs text-center font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  maxLength={4}
                  placeholder="YYYY"
                  value={formData.dobYear}
                  onChange={(e) => setFormData({ ...formData, dobYear: e.target.value })}
                  className="px-2 py-2 border border-gray-300 rounded-lg text-xs text-center font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Gender (लिंग) *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                <option value="Male">Male (पुरुष)</option>
                <option value="Female">Female (महिला)</option>
                <option value="Other">Other (इतर)</option>
              </select>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                Mobile Number (मोबाईल) *
              </label>
              <input
                type="text"
                maxLength={10}
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value.replace(/\D/g, '') })}
                placeholder="9529566711"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Aadhaar & Farmer ID Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Aadhaar Number */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Aadhaar Number (१२ अंकी आधार क्र.) *
              </label>
              <input
                type="text"
                maxLength={14}
                value={formData.aadhaarNumber}
                onChange={(e) => {
                  const cleanDigits = e.target.value.replace(/\D/g, '').slice(0, 12);
                  const formatted = cleanDigits ? cleanDigits.replace(/(\d{4})(?=\d)/g, '$1 ').trim() : '';
                  setFormData({ ...formData, aadhaarNumber: formatted });
                }}
                placeholder="9420 4790 8747"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-bold font-mono tracking-wider focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Farmer ID Number */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Farmer ID Number (फार्मर आयडी) *
              </label>
              <input
                type="text"
                maxLength={15}
                value={formData.farmerId}
                onChange={(e) => setFormData({ ...formData, farmerId: e.target.value })}
                placeholder="64578030749"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-bold font-mono tracking-wider focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-900 bg-emerald-50/40"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              Address (संपूर्ण पत्ता) *
            </label>
            <textarea
              rows={2}
              value={formData.addressEn}
              onChange={(e) => setFormData({ ...formData, addressEn: e.target.value.toUpperCase() })}
              placeholder="AT.SOMTHANA POST. MOHAJA TQ MALEGAON DIST.WASHIM"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none uppercase resize-none"
            />
          </div>
        </div>

        {/* SECTION B: Land Details (जमिनीची माहिती) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-900">
                जमिनीची माहिती / Land Details
              </h2>
              <span className="text-xs text-gray-500">
                कार्डच्या मागील बाजूस (Back Side) दिसणारी जमिनीची माहिती
              </span>
            </div>

            {/* Add Land Button */}
            <button
              type="button"
              onClick={handleAddLand}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + जमीन / गट जोडा (Add Land)
            </button>
          </div>

          {/* Land Details Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12">अ.क्र.</th>
                  <th className="py-2.5 px-3">जिल्हा</th>
                  <th className="py-2.5 px-3">तालुका</th>
                  <th className="py-2.5 px-3">गाव</th>
                  <th className="py-2.5 px-3 w-24">गट नं.</th>
                  <th className="py-2.5 px-3 w-24">खाते नं.</th>
                  <th className="py-2.5 px-3 w-28">क्षेत्र हे.आर</th>
                  <th className="py-2.5 px-3 text-center w-16">कृती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium">
                {formData.lands.map((land, idx) => (
                  <tr key={land.id || idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-center font-bold text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={land.district}
                        onChange={(e) => handleUpdateLand(land.id, 'district', e.target.value.toUpperCase())}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs uppercase"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={land.taluka}
                        onChange={(e) => handleUpdateLand(land.id, 'taluka', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={land.village}
                        onChange={(e) => handleUpdateLand(land.id, 'village', e.target.value.toUpperCase())}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs uppercase"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={land.gatNo}
                        onChange={(e) => handleUpdateLand(land.id, 'gatNo', e.target.value)}
                        placeholder="गट नं."
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-center"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={land.khateNo}
                        onChange={(e) => handleUpdateLand(land.id, 'khateNo', e.target.value)}
                        placeholder="खाते"
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs text-center"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={land.areaHaR}
                        onChange={(e) => handleUpdateLand(land.id, 'areaHaR', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-right"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteLand(land.id)}
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="हटवा"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Area Box */}
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <span className="text-xs font-bold text-emerald-950">
              एकूण जमीन गट संख्या: {formData.lands.length}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-emerald-900">
                एकूण क्षेत्र (Total Area):
              </span>
              <span className="text-sm font-black text-emerald-800 bg-white px-3.5 py-1 rounded-lg border border-emerald-300 shadow-2xs font-mono">
                {totalAreaHaR} हे.आर
              </span>
            </div>
          </div>
        </div>

        {/* SECTION C: Bottom Primary Actions Bar (Direct Print & Demo Options) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              माहिती पूर्ण भरली असल्यास खालील बटण दाबून थेट <strong>85.6 mm × 54.0 mm PVC कार्ड प्रिंट</strong> करा.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                setFormData(DEMO_FARMER_DATA);
                setParseStatus({ text: 'डेमो शेतकरी डेटा रीसेट केला गेला!' });
                setTimeout(() => setParseStatus(null), 3000);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              डेमो डेटा रीसेट
            </button>

            <button
              type="button"
              onClick={handlePrintOriginalPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-blue-200" />
              मूळ फॉर्म प्रिंट
            </button>

            <button
              type="button"
              onClick={() => setIsPdfModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1e5631] hover:bg-[#164325] text-white rounded-xl text-sm font-black shadow-md shadow-emerald-900/20 hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Printer className="w-4 h-4 text-yellow-300" />
              <span>शेती परिचय पत्र PVC प्रिंट काढा (85.6 × 54 mm)</span>
            </button>
          </div>
        </div>

      </div>

      {/* Hidden Card Staging Containers (Used by PdfPreviewModal to generate 300 DPI snapshots invisibly) */}
      <div
        id="pdf-render-cards-staging"
        style={{
          position: 'fixed',
          top: 0,
          left: '300vw',
          zIndex: -9999,
          pointerEvents: 'none',
          backgroundColor: '#ffffff',
          width: '600px',
        }}
      >
        <div style={{ width: '600px', height: '378px', overflow: 'hidden' }}>
          <AgriRecordCardFront
            data={formData}
            id="export-card-front"
            qrCodeUrl={qrCodeUrl}
            isPrintMode={true}
          />
        </div>

        <div style={{ width: '600px', height: '378px', overflow: 'hidden', marginTop: '16px' }}>
          <AgriRecordCardBack
            data={formData}
            id="export-card-back"
            isPrintMode={true}
          />
        </div>
      </div>

      {/* 3. Photo Cropping Modal */}
      {isCropModalOpen && formData.photoUrl && (
        <PhotoCropModal
          isOpen={isCropModalOpen}
          imageSrc={formData.photoUrl}
          onClose={() => setIsCropModalOpen(false)}
          onCropComplete={(croppedUrl) => {
            setFormData((prev) => ({ ...prev, photoUrl: croppedUrl }));
            setIsCropModalOpen(false);
          }}
        />
      )}

      {/* 4. Complete PVC Print & PDF Export Modal */}
      <PdfPreviewModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        data={formData}
        onPhotoChange={(newUrl) => setFormData((prev) => ({ ...prev, photoUrl: newUrl }))}
      />

      {/* 5. Official Original Registration Form Sheet (For printing as in original PDF) */}
      <div id="printable-registration-form-sheet" className="hidden">
        <div className="w-[210mm] min-h-[297mm] p-[15mm] bg-white text-black font-sans box-sizing-border">
          <div className="text-center pb-4 border-b border-black">
            <h1 className="text-xl font-bold">Farmer Registration Form</h1>
            <div className="flex justify-between text-xs mt-2">
              <span>Farmer enrollment number: <strong>{formData.applicationNo}</strong></span>
              <span>Farmer ID: <strong>{formData.farmerId}</strong></span>
            </div>
          </div>

          {/* Farmer Details */}
          <div className="mt-4">
            <h2 className="text-sm font-bold bg-gray-200 px-2 py-1 border border-black">Farmer Details</h2>
            <table className="w-full text-xs border-collapse border border-black mt-1">
              <tbody>
                <tr className="border-b border-black">
                  <td className="p-1.5 font-bold w-1/4 border-r border-black">Farmer Name as per Aadhaar (English):</td>
                  <td className="p-1.5 border-r border-black">{formData.fullNameEn}</td>
                  <td className="p-1.5 font-bold w-1/4 border-r border-black">स्थानिक भाषेत नाव:</td>
                  <td className="p-1.5">{formData.fullNameMr}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="p-1.5 font-bold border-r border-black">Gender:</td>
                  <td className="p-1.5 border-r border-black">{formData.gender}</td>
                  <td className="p-1.5 font-bold border-r border-black">Date of Birth:</td>
                  <td className="p-1.5">{formData.dobDay}/{formData.dobMonth}/{formData.dobYear}</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-bold border-r border-black">Mobile Number:</td>
                  <td className="p-1.5 border-r border-black">{formData.whatsappNumber}</td>
                  <td className="p-1.5 font-bold border-r border-black">Aadhaar Number:</td>
                  <td className="p-1.5">{formData.aadhaarNumber}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Address */}
          <div className="mt-4">
            <h2 className="text-sm font-bold bg-gray-200 px-2 py-1 border border-black">Residential Details</h2>
            <div className="p-2 border border-black text-xs space-y-1">
              <p><strong>Address In English:</strong> {formData.addressEn}</p>
              <p><strong>पत्ता स्थानिक भाषेत:</strong> {formData.villageMr}</p>
            </div>
          </div>

          {/* Land Ownership */}
          <div className="mt-4">
            <h2 className="text-sm font-bold bg-gray-200 px-2 py-1 border border-black">Land Ownership Details</h2>
            <table className="w-full text-xs border-collapse border border-black mt-1">
              <thead>
                <tr className="border-b border-black bg-gray-100">
                  <th className="p-1 border-r border-black text-center">अ.क्र.</th>
                  <th className="p-1 border-r border-black">District</th>
                  <th className="p-1 border-r border-black">Sub District</th>
                  <th className="p-1 border-r border-black">Village</th>
                  <th className="p-1 border-r border-black text-center">S No. / गट</th>
                  <th className="p-1 border-r border-black text-center">खाते</th>
                  <th className="p-1 text-right">Area (Ha.R)</th>
                </tr>
              </thead>
              <tbody>
                {formData.lands.map((land, idx) => (
                  <tr key={idx} className="border-b border-black">
                    <td className="p-1 border-r border-black text-center">{idx + 1}</td>
                    <td className="p-1 border-r border-black">{land.district}</td>
                    <td className="p-1 border-r border-black">{land.taluka}</td>
                    <td className="p-1 border-r border-black">{land.village}</td>
                    <td className="p-1 border-r border-black text-center">{land.gatNo}</td>
                    <td className="p-1 border-r border-black text-center">{land.khateNo || '-'}</td>
                    <td className="p-1 text-right">{land.areaHaR}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-right font-bold text-xs mt-1">
              एकूण क्षेत्र (Total Area): {totalAreaHaR} हे.आर
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

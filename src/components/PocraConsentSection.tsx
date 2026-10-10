import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  RotateCcw, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Sparkles, 
  FileCheck, 
  Building2, 
  Users, 
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Image as ImageIcon
} from 'lucide-react';
import { useRegisterShortcuts } from '../context/ShortcutsContext';
import { 
  PocraConsentData, 
  defaultPocraData, 
  POCRA_COMPONENT_OPTIONS, 
  CoOwner 
} from '../types/pocra';
import { printComponent } from '../utils/printHelper';
import { safeHtml2Canvas } from '../utils/safeHtml2Canvas';
import pocraLetterheadBanner from '../assets/pocra_letterhead_banner.png';

// Official PoCRA 2.0 Letterhead Component (Using the official Agriculture Project Letterhead Banner)
const PocraOfficialLetterhead: React.FC = () => {
  return (
    <div className="w-full mb-3 select-none">
      <img
        src={pocraLetterheadBanner}
        alt="नानाजी देशमुख कृषी संजीवनी प्रकल्प (PoCRA 2.0) Letterhead"
        className="w-full h-auto object-contain block rounded-xs"
        style={{ width: '100%', maxHeight: '130px' }}
      />
    </div>
  );
};

export const PocraConsentSection: React.FC = () => {
  const [formData, setFormData] = useState<PocraConsentData>(defaultPocraData);
  const [isCustomComponent, setIsCustomComponent] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGenerated, setIsGenerated] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isDownloadingJpg, setIsDownloadingJpg] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  const previewRef = useRef<HTMLDivElement>(null);

  // Update simple fields
  const handleFieldChange = (field: keyof PocraConsentData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Component dropdown change
  const handleComponentSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val.startsWith('इतर घटक')) {
      setIsCustomComponent(true);
      setFormData(prev => ({ ...prev, componentName: 'इतर घटक', customComponentName: '' }));
    } else {
      setIsCustomComponent(false);
      setFormData(prev => ({ ...prev, componentName: val, customComponentName: '' }));
    }
    if (errors.componentName) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.componentName;
        return next;
      });
    }
  };

  // Co-owners handlers
  const handleAddCoOwner = () => {
    const newId = Date.now().toString();
    setFormData(prev => ({
      ...prev,
      coOwners: [...prev.coOwners, { id: newId, name: '' }],
    }));
  };

  const handleRemoveCoOwner = (id: string) => {
    if (formData.coOwners.length <= 1) {
      setErrors(prev => ({ ...prev, coOwners: 'किमान एका इतर खातेदाराचे नाव आवश्यक आहे.' }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      coOwners: prev.coOwners.filter(owner => owner.id !== id),
    }));
  };

  const handleCoOwnerNameChange = (id: string, name: string) => {
    setFormData(prev => ({
      ...prev,
      coOwners: prev.coOwners.map(owner => 
        owner.id === id ? { ...owner, name } : owner
      ),
    }));
    if (errors.coOwners) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.coOwners;
        return next;
      });
    }
  };

  // Get active component string
  const activeComponentName = isCustomComponent 
    ? (formData.customComponentName?.trim() || '')
    : formData.componentName;

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.mainFarmerName.trim()) {
      newErrors.mainFarmerName = 'मुख्य खातेदाराचे / लाभार्थीचे नाव आवश्यक आहे.';
    }
    if (!formData.village.trim()) {
      newErrors.village = 'गावाचे (मौजे) नाव आवश्यक आहे.';
    }
    if (!formData.taluka.trim()) {
      newErrors.taluka = 'तालुक्याचे नाव आवश्यक आहे.';
    }
    if (!formData.district.trim()) {
      newErrors.district = 'जिल्ह्याचे नाव आवश्यक आहे.';
    }
    if (!formData.gutNo.trim()) {
      newErrors.gutNo = 'गट क्रमांक आवश्यक आहे.';
    }
    if (!formData.areaHectare.trim()) {
      newErrors.areaHectare = 'क्षेत्र (हेक्टर) आवश्यक आहे (उदा. 1.06).';
    } else if (isNaN(parseFloat(formData.areaHectare.replace(',', '.')))) {
      newErrors.areaHectare = 'कृपया योग्य संख्या भरा (उदा. 0.80 किंवा 1.06).';
    }
    if (isCustomComponent && !formData.customComponentName?.trim()) {
      newErrors.componentName = 'कृपया घटकाचे नाव टाईप करा.';
    } else if (!formData.componentName.trim()) {
      newErrors.componentName = 'अनुदानासाठी घटकाचे नाव आवश्यक आहे.';
    }

    const validCoOwners = formData.coOwners.filter(c => c.name.trim() !== '');
    if (validCoOwners.length === 0) {
      newErrors.coOwners = 'किमान एका इतर खातेदाराचे नाव भरणे आवश्यक आहे.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsGenerated(true);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const handleReset = () => {
    setFormData(defaultPocraData);
    setIsCustomComponent(false);
    setErrors({});
    setIsGenerated(false);
  };

  // Ultra-crisp 1-click A4 printing with Letterhead using DOM portal (no iframe PDF viewer timeout)
  const handlePrint = async () => {
    if (!validateForm()) return;
    setIsPrinting(true);
    try {
      await printComponent(
        'pocra-consent-printable-document',
        `PoCRA_Consent_Letter_Gut_${formData.gutNo || 'Document'}`
      );
    } catch (err) {
      console.warn('Direct print error:', err);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!validateForm()) return;
    setIsDownloading(true);
    try {
      const element = document.getElementById('pocra-consent-printable-document');
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
      pdf.save(`PoCRA_Consent_Letter_Gut_${formData.gutNo || 'Letter'}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadJpg = async () => {
    if (!validateForm()) return;
    setIsDownloadingJpg(true);
    try {
      const element = document.getElementById('pocra-consent-printable-document');
      if (!element) throw new Error('Element not found');

      const canvas = await safeHtml2Canvas(element, {
        scale: 3.125, // High DPI (~300 DPI for pristine clarity)
        backgroundColor: '#ffffff',
      });

      const dataUrl = canvas.toDataURL('image/jpeg', 0.98);
      const link = document.createElement('a');
      link.href = dataUrl;
      const fileName = `PoCRA_Consent_Letter_Gut_${formData.gutNo || 'Letter'}.jpg`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('JPG export error:', err);
    } finally {
      setIsDownloadingJpg(false);
    }
  };

  // Register High-Speed Keyboard Shortcuts (Ctrl+P, Ctrl+D, Ctrl+S)
  useRegisterShortcuts({
    onPrint: () => handlePrint(),
    onDownloadPdf: () => handleDownloadPdf(),
    onSave: () => handleDownloadPdf(),
  });

  const displayDate = formData.date.trim() || new Date().toLocaleDateString('en-GB');

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner - Professional Blue Theme */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-blue-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full text-xs font-bold text-blue-200 border border-blue-400/30">
              <FileCheck className="w-4 h-4 text-blue-400" />
              नानाजी देशमुख कृषी संजीवनी प्रकल्प २.० (PoCRA)
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              सामाईक क्षेत्र संमती पत्र (PoCRA Consent Letter)
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 font-medium leading-relaxed">
              अधिकृत PoCRA २.० लेटरहेडसह सामाईक शेतजमीन संमती पत्र तयार करा. 1-क्लिक A4 प्रिंट किंवा PDF डाऊनलोड करा.
            </p>
          </div>


        </div>
      </div>

      {/* Main Grid: Form Left, Live A4 Document Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Input Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleGenerate} className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-xl border border-gray-200/90 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold">
                  1
                </div>
                <h2 className="text-lg font-black text-gray-900 dark:text-slate-100">
                  माहिती भरा (Auto Fill Form)
                </h2>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                title="फॉर्म रीसेट करा"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>रीसेट</span>
              </button>
            </div>

            {/* SECTION 1: Main Farmer / Beneficiary (मेन खातेदार) */}
            <div className="space-y-4 bg-blue-50/50 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-200/80 dark:border-blue-900/50">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                <UserCheck className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <span>१. मुख्य खातेदार / लाभार्थी शेतकरी (लिहून घेणारा)</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 dark:text-slate-200 mb-1">
                  मुख्य खातेदाराचे पूर्ण नाव (लाभार्थी) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.mainFarmerName}
                  onChange={(e) => handleFieldChange('mainFarmerName', e.target.value)}
                  placeholder="उदा. दिपक माधव खंदारे"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all bg-white dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 ${
                    errors.mainFarmerName 
                      ? 'border-red-500 bg-red-50/50 dark:bg-red-950/30 focus:ring-2 focus:ring-red-200' 
                      : 'border-gray-300 dark:border-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50'
                  }`}
                />
                {errors.mainFarmerName && <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold mt-1">{errors.mainFarmerName}</p>}
                <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 mt-1 font-medium">
                  संमती पत्र लिहून घेणाऱ्या मुख्य लाभार्थीचे नाव येथे भरा.
                </p>
              </div>
            </div>

            {/* SECTION 2: Land & Component Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>२. शेतजमिनीची व घटकाची माहिती</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                    गावाचे नाव (मौजे) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.village}
                    onChange={(e) => handleFieldChange('village', e.target.value)}
                    placeholder="उदा. सोमठाणा / शिरपूर जैन"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 ${
                      errors.village 
                        ? 'border-red-500 bg-red-50/50 dark:bg-red-950/30 focus:ring-2 focus:ring-red-200' 
                        : 'border-gray-300 dark:border-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50'
                    }`}
                  />
                  {errors.village && <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold mt-1">{errors.village}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                    तालुका <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.taluka}
                    onChange={(e) => handleFieldChange('taluka', e.target.value)}
                    placeholder="उदा. मालेगाव"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 ${
                      errors.taluka 
                        ? 'border-red-500 bg-red-50/50 dark:bg-red-950/30 focus:ring-2 focus:ring-red-200' 
                        : 'border-gray-300 dark:border-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50'
                    }`}
                  />
                  {errors.taluka && <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold mt-1">{errors.taluka}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                    जिल्हा <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => handleFieldChange('district', e.target.value)}
                    placeholder="उदा. वाशिम"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 ${
                      errors.district 
                        ? 'border-red-500 bg-red-50/50 dark:bg-red-950/30 focus:ring-2 focus:ring-red-200' 
                        : 'border-gray-300 dark:border-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50'
                    }`}
                  />
                  {errors.district && <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold mt-1">{errors.district}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                    गट क्रमांक (गट नं.) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.gutNo}
                    onChange={(e) => handleFieldChange('gutNo', e.target.value)}
                    placeholder="उदा. 126 किंवा 123/1"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 ${
                      errors.gutNo 
                        ? 'border-red-500 bg-red-50/50 dark:bg-red-950/30 focus:ring-2 focus:ring-red-200' 
                        : 'border-gray-300 dark:border-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50'
                    }`}
                  />
                  {errors.gutNo && <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold mt-1">{errors.gutNo}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  अनुदानासाठी क्षेत्र (हेक्टर मध्ये) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.areaHectare}
                  onChange={(e) => handleFieldChange('areaHectare', e.target.value)}
                  placeholder="उदा. 1.06 किंवा 0.80"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 ${
                    errors.areaHectare 
                      ? 'border-red-500 bg-red-50/50 dark:bg-red-950/30 focus:ring-2 focus:ring-red-200' 
                      : 'border-gray-300 dark:border-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50'
                  }`}
                />
                {errors.areaHectare && <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold mt-1">{errors.areaHectare}</p>}
              </div>

              {/* Component Dropdown Menu */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  अनुदानासाठी घटकाचे नाव (Dropdown Menu) <span className="text-red-500">*</span>
                </label>
                <select
                  value={isCustomComponent ? 'इतर घटक (Custom घटक नाव टाका)' : formData.componentName}
                  onChange={handleComponentSelectChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-gray-900 dark:text-slate-100 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 transition-all cursor-pointer"
                >
                  {POCRA_COMPONENT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} className="dark:bg-slate-900 dark:text-slate-100">
                      {opt}
                    </option>
                  ))}
                </select>

                {isCustomComponent && (
                  <div className="mt-2.5 animate-in fade-in duration-150">
                    <label className="block text-[11px] font-bold text-blue-900 dark:text-blue-300 mb-1">
                      इतर घटकाचे नाव टाईप करा:
                    </label>
                    <input
                      type="text"
                      value={formData.customComponentName || ''}
                      onChange={(e) => handleFieldChange('customComponentName', e.target.value)}
                      placeholder="उदा. शेडनेट, सौर पंप, तुषार संच इ."
                      className="w-full px-3.5 py-2 rounded-xl border border-blue-400 dark:border-blue-600 bg-blue-50/30 dark:bg-blue-950/30 dark:text-slate-100 text-sm font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50"
                    />
                  </div>
                )}
                {errors.componentName && <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold mt-1">{errors.componentName}</p>}
              </div>
            </div>

            {/* SECTION 3: Other Co-Owners (इतर सामाईक खातेदार - लिहून देणारे) */}
            <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>३. इतर खातेदारांची नावे (लिहून देणारे)</span>
                </div>
                <span className="text-xs bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full border border-transparent dark:border-blue-800/40">
                  {formData.coOwners.length} खातेदार
                </span>
              </div>

              {errors.coOwners && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errors.coOwners}</span>
                </div>
              )}

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {formData.coOwners.map((owner, index) => (
                  <div key={owner.id} className="flex items-center gap-2">
                    <span className="w-6 text-xs font-bold text-gray-400 dark:text-slate-500 shrink-0 text-center">
                      {index + 1}.
                    </span>
                    <input
                      type="text"
                      value={owner.name}
                      onChange={(e) => handleCoOwnerNameChange(owner.id, e.target.value)}
                      placeholder={`इतर खातेदाराचे पूर्ण नाव`}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 text-sm font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCoOwner(owner.id)}
                      disabled={formData.coOwners.length <= 1}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                      title="हे नाव काढा"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddCoOwner}
                className="w-full py-2.5 px-4 border-2 border-dashed border-blue-300 dark:border-blue-800/70 hover:border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ आणखी इतर खातेदार जोडा (Add Co-Owner)</span>
              </button>
            </div>

            {/* SECTION 4: Date */}
            <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>४. संमतीपत्र दिनांक</span>
              </div>
              <input
                type="text"
                value={formData.date}
                onChange={(e) => handleFieldChange('date', e.target.value)}
                placeholder="उदा. DD/MM/YYYY"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 text-sm font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 transition-all"
              />
            </div>

            {/* Action Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white rounded-2xl text-base font-black shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5 text-blue-200" />
                <span>Generate Consent Letter (संमतीपत्र तयार करा)</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Live Official Authentic A4 Document (7 cols) */}
        <div ref={previewRef} className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shadow-xs shrink-0">
                <Eye className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-gray-900 dark:text-slate-100">
                  A4 Preview
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  PoCRA संमतीपत्र
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handlePrint}
                disabled={isPrinting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-60 shrink-0"
                title="A4 प्रिंट काढा (Ctrl + P)"
              >
                <Printer className="w-4 h-4 text-blue-100" />
                <span>प्रिंट</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-60 shrink-0"
                title="HD PDF डाऊनलोड करा (Ctrl + D)"
              >
                <Download className="w-4 h-4 text-emerald-100" />
                <span>PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadJpg}
                disabled={isDownloadingJpg}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-60 shrink-0"
                title="HD JPG फोटो डाऊनलोड करा"
              >
                <ImageIcon className="w-4 h-4 text-purple-100" />
                <span>JPG</span>
              </button>
            </div>
          </div>

          {/* A4 Sheet Container with Realistic Paper Shadow */}
          <div className="w-full flex justify-center overflow-x-auto p-4 bg-slate-200/80 dark:bg-slate-950 rounded-3xl border border-slate-300/80 dark:border-slate-800">
            {/* The Document Element rendered in Exact A4 Aspect Ratio & Typography */}
            <div
              id="pocra-consent-printable-document"
              className="pocra-print-sheet bg-white text-black shadow-2xl transition-all"
              style={{
                width: '100%',
                maxWidth: '740px',
                minHeight: '990px',
                padding: '36px 52px 38px 52px',
                fontFamily: "'Noto Sans Devanagari', 'Yantramanav', 'Mukta', 'Mangal', 'Arial Unicode MS', sans-serif",
                fontSize: '15.5px',
                lineHeight: '1.95',
                color: '#000000',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
              }}
            >
              {/* Official PoCRA 2.0 Letterhead Banner */}
              <PocraOfficialLetterhead />

              {/* Top Title: सामाईक क्षेत्र असलेल्या शेतक-याने इतर खातेदारांचे घ्यावयाचे संमती पत्र */}
              <div className="text-center pt-1 pb-3">
                <h1 className="text-[17.5px] sm:text-[18.5px] font-black tracking-tight text-black inline-block underline underline-offset-4">
                  सामाईक क्षेत्र असलेल्या शेतक-याने इतर खातेदारांचे घ्यावयाचे संमती पत्र
                </h1>
              </div>

              {/* Date right aligned */}
              <div className="flex justify-end pb-3 text-[14.5px] sm:text-[15.5px] font-bold">
                <span>दिनांक : &nbsp; {formData.date.trim() ? <strong>{displayDate}</strong> : '  /    /'}</span>
              </div>

              {/* Section 1: संमती पत्र लिहून घेणार: */}
              <div className="space-y-1.5 text-justify leading-[1.98] pb-3 text-[15px] sm:text-[15.5px]">
                <p className="font-black text-[16px] sm:text-[16.5px]">
                  संमती पत्र लिहून घेणार:
                </p>
                <p style={{ textIndent: '32px' }}>
                  मी श्री/श्रीमती {formData.mainFarmerName.trim() ? <strong>{formData.mainFarmerName.trim()}</strong> : '..........................................................................'} रा. {formData.village.trim() ? <strong>{formData.village.trim()}</strong> : '........................'} ता.{formData.taluka.trim() ? <strong>{formData.taluka.trim()}</strong> : '......................'} जि. {formData.district.trim() ? <strong>{formData.district.trim()}</strong> : '......................'} येथील रहिवाशी असून, मौजे {formData.village.trim() ? <strong>{formData.village.trim()}</strong> : '.....................'} या गावामधील सामाईक मालकीच्या शेतजमिनीवरील गट क्रमांक {formData.gutNo.trim() ? <strong>{formData.gutNo.trim()}</strong> : '..................'} मध्ये नानाजी देशमुख कृषी संजीवनी प्रकल्पाअंतर्गत {formData.areaHectare.trim() ? <strong>{formData.areaHectare.trim()}</strong> : '...............'} हेक्टर क्षेत्रावर {activeComponentName.trim() ? <strong>{activeComponentName.trim()}</strong> : '................................................'} या घटकासाठी अनुदानाचा लाभ घेऊ इच्छितो/ इच्छिते.
                </p>
                <p style={{ textIndent: '32px' }}>
                  सदर क्षेत्रावर या घटकाची अंमलबजावणी करणे व मिळणारे अनुदान माझ्या आधार संलग्न बँक खात्यावर जमा करणेसाठी सामाईक मालकीच्या गट नंबर मधील इतर खातेदाराचे संमती पत्र खालील प्रमाणे देत आहे.
                </p>
              </div>

              {/* Section 2: संमती पत्र लिहून देणार :- */}
              <div className="space-y-1.5 text-justify leading-[1.98] pb-4 text-[15px] sm:text-[15.5px]">
                <p className="font-black text-[16px] sm:text-[16.5px]">
                  संमती पत्र लिहून देणार :-
                </p>
                <p style={{ textIndent: '32px' }}>
                  मी/आम्ही स्वखुशीने संमतीपत्र लिहून देतो की, मौजे {formData.village.trim() ? <strong>{formData.village.trim()}</strong> : '................................'} या गावामधील गट नंबर {formData.gutNo.trim() ? <strong>{formData.gutNo.trim()}</strong> : '..................'} असलेली जमीन आमचे सामाईक मालकीची असुन मी/आम्ही सर्व खाली सही करणार/ करणारे श्री/श्रीमती {formData.mainFarmerName.trim() ? <strong>{formData.mainFarmerName.trim()}</strong> : '..........................................................................'} यांना सदरील गट नंबर मधील {formData.areaHectare.trim() ? <strong>{formData.areaHectare.trim()}</strong> : '..............'} हेक्टर क्षेत्रावर {activeComponentName.trim() ? <strong>{activeComponentName.trim()}</strong> : '...............................................'} या घटकाची अंमलबजावणी करणे व प्रकल्पाअंतर्गत नियमाप्रमाणे मिळणारे शासकीय अनुदान त्यांचे आधार संलग्न बँक खात्यावर जमा करणेस आमची कुठलीही हरकत नाही. करीता सदर संमतीपत्र लिहून देत आहोत.
                </p>
              </div>

              {/* Section 3: लिहून घेणार (लाभार्थी शेतकरी) : स्वाक्षरी */}
              <div className="pt-1 pb-4">
                <div className="flex justify-between items-center font-black text-[15px] sm:text-[15.5px] pb-1">
                  <span>लिहून घेणार (लाभार्थी शेतकरी) :</span>
                  <span className="w-36 text-center font-black">स्वाक्षरी</span>
                </div>
                <div className="flex justify-between items-center text-[14.5px] sm:text-[15px] pt-1">
                  <span className="pr-2">
                    १. &nbsp; {formData.mainFarmerName.trim() ? <strong>{formData.mainFarmerName.trim()}</strong> : '..........................................................................'}
                  </span>
                  <span className="w-36 text-center font-mono text-[13.5px] text-gray-800 tracking-normal select-none overflow-hidden whitespace-nowrap shrink-0">
                    ....................
                  </span>
                </div>
              </div>

              {/* Section 4: लिहून देणार : स्वाक्षरी */}
              <div className="pt-1">
                <div className="flex justify-between items-center font-black text-[15px] sm:text-[15.5px] pb-1">
                  <span>लिहून देणार :</span>
                  <span className="w-36 text-center font-black">स्वाक्षरी</span>
                </div>
                
                <div className="space-y-1.5 text-[14.5px] sm:text-[15px]">
                  {formData.coOwners.length > 0 && formData.coOwners.some(c => c.name.trim()) ? (
                    formData.coOwners.map((owner, idx) => (
                      <div key={owner.id || idx} className="flex justify-between items-center pt-1">
                        <span className="pr-2">
                          {idx + 1}. &nbsp; {owner.name.trim() ? <strong>{owner.name.trim()}</strong> : '..........................................................................'}
                        </span>
                        <span className="w-36 text-center font-mono text-[13px] text-gray-800 tracking-normal select-none overflow-hidden whitespace-nowrap shrink-0">
                          ....................
                        </span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex justify-between items-center pt-1">
                        <span className="pr-2">१. &nbsp; ..........................................................................</span>
                        <span className="w-36 text-center font-mono text-[13px] text-gray-800 tracking-normal select-none overflow-hidden whitespace-nowrap shrink-0">
                          ....................
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="pr-2">२. &nbsp; ..........................................................................</span>
                        <span className="w-36 text-center font-mono text-[13px] text-gray-800 tracking-normal select-none overflow-hidden whitespace-nowrap shrink-0">
                          ....................
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="pr-2">३. &nbsp; ..........................................................................</span>
                        <span className="w-36 text-center font-mono text-[13px] text-gray-800 tracking-normal select-none overflow-hidden whitespace-nowrap shrink-0">
                          ....................
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

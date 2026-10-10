import React, { useRef, useState } from 'react';
import { FileText, CheckCircle2, Sparkles, Loader2, AlertCircle, FileCheck, Camera } from 'lucide-react';
import { FarmerFormData } from '../types/form';
import { sampleFarmerData, sampleJyotiPhotoDataUri, normalizeMonth, parseDateOfBirth } from '../utils/sampleData';
import { extractPhotoFromDocument } from '../utils/pdfPhotoExtractor';
import { parsePdfTextLocally } from '../utils/localPdfParser';
import { formatAreaHaR } from '../utils/formatters';

interface AutoFillSectionProps {
  onAutoFill: (extractedData: Partial<FarmerFormData>) => void;
  onLoadDemo?: () => void;
}

export const AutoFillSection: React.FC<AutoFillSectionProps> = ({ onAutoFill }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUploadedName, setLastUploadedName] = useState<string | null>(null);

  // Clean and normalize extracted data to fit the form state cleanly
  const normalizeExtracted = (raw: any): Partial<FarmerFormData> => {
    const result: Partial<FarmerFormData> = {};

    if (raw.fullNameEn) result.fullNameEn = String(raw.fullNameEn).trim();
    if (raw.fullNameMr) result.fullNameMr = String(raw.fullNameMr).trim();

    // Date of birth
    if (raw.dobDay) result.dobDay = String(raw.dobDay).trim().padStart(2, '0');
    if (raw.dobMonth) result.dobMonth = normalizeMonth(String(raw.dobMonth));
    if (raw.dobYear) result.dobYear = String(raw.dobYear).trim();

    // If dob was provided in combined format e.g. "15/06/1975"
    if (raw.dob || raw.dateOfBirth) {
      const parsed = parseDateOfBirth(raw.dob || raw.dateOfBirth);
      if (parsed.day) result.dobDay = parsed.day;
      if (parsed.month) result.dobMonth = parsed.month;
      if (parsed.year) result.dobYear = parsed.year;
    }

    if (raw.gender) {
      const g = String(raw.gender).toLowerCase();
      result.gender = g.includes('female') || g.includes('महिला') ? 'Female' : 'Male';
    }

    if (raw.whatsappNumber || raw.mobileNumber) {
      result.whatsappNumber = String(raw.whatsappNumber || raw.mobileNumber).replace(/\D/g, '').slice(-10);
    }

    if (raw.farmerId) {
      result.farmerId = String(raw.farmerId).replace(/[^0-9A-Za-z]/g, '').slice(0, 11);
    }

    if (raw.aadhaarNumber) {
      const clean = String(raw.aadhaarNumber).replace(/\D/g, '').slice(0, 12);
      result.aadhaarNumber = clean.length === 12 ? clean.replace(/(\d{4})(?=\d)/g, '$1 ') : String(raw.aadhaarNumber);
    }

    // Addresses
    if (raw.addressEn) result.addressEn = String(raw.addressEn).trim();
    if (raw.villageEn) result.villageEn = String(raw.villageEn).trim();
    if (raw.tehsilEn) result.tehsilEn = String(raw.tehsilEn).trim();
    if (raw.districtEn) result.districtEn = String(raw.districtEn).trim();
    if (raw.pincode) result.pincode = String(raw.pincode).replace(/\D/g, '').slice(0, 6);

    if (raw.villageMr) result.villageMr = String(raw.villageMr).trim();
    if (raw.tehsilMr) result.tehsilMr = String(raw.tehsilMr).trim();
    if (raw.districtMr) result.districtMr = String(raw.districtMr).trim();

    // Land Details matching user's image columns: जिल्हा, तालुका, गाव, गट नं., खाते नं., क्षेत्र हे.आर
    if (Array.isArray(raw.landDetails) && raw.landDetails.length > 0) {
      result.lands = raw.landDetails.map((l: any, lIdx: number) => ({
        id: `land-extracted-${lIdx + 1}`,
        district: l.district || raw.districtMr || raw.districtEn || '',
        taluka: l.taluka || l.tehsil || raw.tehsilMr || raw.tehsilEn || '',
        village: l.village || raw.villageMr || raw.villageEn || '',
        gatNo: String(l.gatNo || l.surveyNo || (l.surveys && l.surveys[0]?.surveyNo) || ''),
        khateNo: String(l.khateNo || ''),
        areaHaR: formatAreaHaR(l.areaHaR || l.areaHa || (l.surveys && l.surveys[0]?.areaHa) || ''),
      }));
    }

    // If application or enrollment number exists
    if (raw.enrollmentNumber || raw.applicationNo) {
      result.applicationNo = String(raw.enrollmentNumber || raw.applicationNo);
    }

    return result;
  };

  const handleFile = async (file: File) => {
    if (!file) return;

    setIsProcessing(true);
    setLastUploadedName(file.name);
    setStatusMessage(`कागदपत्र तपासत आहे (${file.name})...`);
    setErrorMessage(null);

    try {
      // 1. Try local PDF extraction for immediate fast results
      const localExtractionPromise: Promise<Partial<FarmerFormData>> =
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
          ? parsePdfTextLocally(file).catch(() => ({}))
          : Promise.resolve({});

      // 2. Extract photo from PDF page 1 in parallel
      const photoPromise = extractPhotoFromDocument(file).catch((err) => {
        console.warn('Photo extraction non-fatal error:', err);
        return null;
      });

      // 3. Read base64 for Gemini document AI extraction
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const [localData, extractedPhoto] = await Promise.all([
        localExtractionPromise,
        photoPromise,
      ]);

      try {
        const response = await fetch('/api/parse-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Data,
            mimeType: file.type || 'application/pdf',
          }),
        });

        const result = await response.json();

        if (result.success && result.data && Object.keys(result.data).length > 0) {
          const normalized = normalizeExtracted(result.data);

          // Merge any fields that local extraction found if AI missed them
          const merged: Partial<FarmerFormData> = {
            ...localData,
            ...normalized,
          };

          // Attach extracted photo if found on the document
          if (extractedPhoto) {
            merged.photoUrl = extractedPhoto;
          }

          onAutoFill(merged);
          setStatusMessage(`"${file.name}" मधून माहिती यशस्वीरीत्या फॉर्ममध्ये भरली गेली!`);
          setTimeout(() => setStatusMessage(null), 8000);
        } else if (result.quotaExceeded) {
          // Gracefully fallback to local extracted data
          if (localData && Object.keys(localData).length > 0) {
            if (extractedPhoto) {
              localData.photoUrl = extractedPhoto;
            }
            onAutoFill(localData);
            setStatusMessage(`"${file.name}" मधून माहिती फॉर्ममध्ये भरली गेली! (स्थानिक वाचनाद्वारे)`);
            setTimeout(() => setStatusMessage(null), 8000);
          } else {
            setStatusMessage(`"${file.name}" अपलोड केले आहे. कृपया आवश्यक माहिती फॉर्ममध्ये तपासा.`);
            setTimeout(() => setStatusMessage(null), 8000);
          }
        } else {
          throw new Error(result.error || 'Could not parse fields');
        }
      } catch (apiError: any) {
        console.warn('AI parsing issue, checking local extracted data:', apiError);

        // If local parser found at least some fields, use those!
        if (localData && Object.keys(localData).length > 0) {
          if (extractedPhoto) {
            localData.photoUrl = extractedPhoto;
          }
          onAutoFill(localData);
          setStatusMessage(`"${file.name}" मधून उपलब्ध माहिती फॉर्ममध्ये भरली गेली!`);
          setTimeout(() => setStatusMessage(null), 8000);
        } else {
          setErrorMessage(`"${file.name}" मधील माहिती वाचण्यात अडचण आली. कृपया दस्तऐवज स्पष्ट किंवा योग्य असल्याची खात्री करा.`);
        }
      } finally {
        setIsProcessing(false);
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage('फाईल वाचताना अडचण आली. कृपया पुन्हा प्रयत्न करा.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-5 sm:p-7 text-center transition-all ${
        isDragging
          ? 'border-green-600 bg-green-100/70 scale-[1.01]'
          : 'border-green-500 bg-[#f4faf5]'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      <div className="flex items-center justify-center gap-2 mb-1.5">
        <span className="text-xl text-amber-500">⚡</span>
        <h3 className="text-xl font-bold text-green-700 tracking-tight">
          Auto-Fill from PDF
        </h3>
      </div>

      <p className="text-gray-600 text-sm mb-4 max-w-lg mx-auto leading-relaxed">
        Upload your registration PDF to automatically fill the form below. 
        <span className="block text-xs text-green-800 mt-0.5 font-medium">
          (तुमची PDF निवडा — त्यातील नाव, जन्मदिनांक, आधार, शेतकरी आयडी व जमीन तपशील थेट फॉर्ममध्ये भरले जातील)
        </span>
      </p>

      {isProcessing ? (
        <div className="flex flex-col items-center justify-center py-3 text-green-800 bg-white/70 rounded-lg p-4 border border-green-200">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mb-2" />
          <p className="font-semibold text-sm animate-pulse">{statusMessage || 'Analyzing Document with AI...'}</p>
          <span className="text-xs text-gray-600 mt-1">
            कागदपत्रातील माहिती (नाव, जन्मतारीख, आधार, शेतकरी आयडी, जमिनीचा तपशील) वाचत आहे...
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          {/* Main button matching user's original screenshot */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 bg-[#38a169] hover:bg-[#2f855a] text-white font-medium px-6 py-2.5 rounded-lg shadow-sm transition-colors text-sm cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Select PDF Document
          </button>
        </div>
      )}

      {statusMessage && !isProcessing && (
        <div className="mt-4 p-3 rounded-lg bg-green-100 text-green-900 text-xs sm:text-sm font-medium border border-green-300 flex items-start justify-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
          <div className="text-left">
            <div>{statusMessage}</div>
            <div className="text-[11px] text-green-800 mt-0.5 font-normal">
              खाली दिलेल्या फॉर्ममध्ये कागदपत्रातील सर्व माहिती भरली गेली आहे. तपासून PDF डाऊनलोड करा.
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-100 text-red-800 text-xs font-medium border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

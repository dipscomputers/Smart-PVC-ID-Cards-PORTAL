import React, { useState } from 'react';
import { 
  X, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  Phone, 
  Calendar, 
  MapPin, 
  CreditCard, 
  Layers, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Sparkles,
  Camera
} from 'lucide-react';
import { FarmerCardData, FarmerCardLand, calculateTotalArea, calculateTotalAreaAcres } from '../types/farmerCard';

interface FarmerDataVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCardData: FarmerCardData;
  onConfirmGenerate: (verifiedCard: FarmerCardData) => void;
}

export const FarmerDataVerificationModal: React.FC<FarmerDataVerificationModalProps> = ({
  isOpen,
  onClose,
  initialCardData,
  onConfirmGenerate,
}) => {
  const [data, setData] = useState<FarmerCardData>(initialCardData);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);

  // Sync when initialCardData changes
  React.useEffect(() => {
    setData(initialCardData);
    setIsVerified(false);
    setIsEditing(false);
  }, [initialCardData]);

  if (!isOpen) return null;

  const totalHaR = calculateTotalArea(data.lands);
  const totalAcres = calculateTotalAreaAcres(data.lands);

  const handleUpdateField = (field: keyof FarmerCardData, val: any) => {
    setData((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleUpdateLand = (idx: number, field: keyof FarmerCardLand, val: string) => {
    setData((prev) => {
      const nextLands = [...prev.lands];
      nextLands[idx] = { ...nextLands[idx], [field]: val };
      return {
        ...prev,
        lands: nextLands,
        totalArea: calculateTotalArea(nextLands),
        totalAreaAcres: calculateTotalAreaAcres(nextLands),
      };
    });
  };

  const handleAddLandRow = () => {
    const defaultDist = data.lands[0]?.district || 'WASHIM';
    const defaultTal = data.lands[0]?.taluka || 'Malegaon';
    const defaultVill = data.lands[0]?.village || '';
    setData((prev) => {
      const newLand: FarmerCardLand = {
        id: `land-${Date.now()}-${prev.lands.length + 1}`,
        district: defaultDist,
        taluka: defaultTal,
        village: defaultVill,
        gatNo: '',
        khateNo: '',
        areaHaR: '0.00',
      };
      const nextLands = [...prev.lands, newLand];
      return {
        ...prev,
        lands: nextLands,
        totalArea: calculateTotalArea(nextLands),
        totalAreaAcres: calculateTotalAreaAcres(nextLands),
      };
    });
  };

  const handleDeleteLandRow = (idx: number) => {
    if (data.lands.length <= 1) return;
    setData((prev) => {
      const nextLands = prev.lands.filter((_, i) => i !== idx);
      return {
        ...prev,
        lands: nextLands,
        totalArea: calculateTotalArea(nextLands),
        totalAreaAcres: calculateTotalAreaAcres(nextLands),
      };
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          handleUpdateField('photoUrl', result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const hasMissingCrucial = !data.fullNameEn || !data.fullNameMr || !data.farmerId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl my-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-emerald-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-[#094d28] via-[#0b5c30] to-[#073d1f] text-white p-5 sm:p-6 flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-emerald-800/80 text-emerald-200 border border-emerald-700/60">
                <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                PDF Data Verification
              </span>
              <span className="text-xs text-emerald-200/80 font-medium">
                {data.fileName ? data.fileName : 'Farmer Registration PDF'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>🌾</span>
              <span>शेतकरी माहिती पडताळणी / Preview</span>
            </h2>
            <p className="text-xs text-emerald-100/90 font-medium">
              PDF मधील माहिती आपोआप भरली आहे. पडताळणी करा किंवा बदल करून ओळखपत्र बनवा.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 text-slate-800 dark:text-slate-200">
          {/* Missing info warning */}
          {hasMissingCrucial && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-bold">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Some information could not be extracted. Please verify and enter the missing information. / कृपया अपूर्ण माहिती तपासून भरा.</span>
            </div>
          )}

          {!data.photoUrl && (
            <div className="bg-orange-50 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-800 text-orange-900 dark:text-orange-200 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0" />
                <span>Farmer photograph could not be detected. Please upload the photograph manually. / फोटो मिळाला नाही, कृपया फोटो जोडा.</span>
              </div>
              <label className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-black cursor-pointer shrink-0">
                फोटो निवडा
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>
          )}

          {/* SECTION 1: FARMER INFORMATION */}
          <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#094d28] dark:text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  FARMER INFORMATION (शेतकरी माहिती)
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-transparent dark:border-emerald-800/40">
                ✓ Extracted from PDF
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start">
              {/* Photograph column */}
              <div className="sm:col-span-1 flex flex-col items-center gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  Photograph (फोटो)
                </span>
                <div className="relative w-24 h-32 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 overflow-hidden flex items-center justify-center shadow-inner group">
                  {data.photoUrl ? (
                    <img src={data.photoUrl} alt="Farmer" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                  )}
                  <label className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer gap-1">
                    <Camera className="w-4 h-4 text-amber-300" />
                    बदला
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Farmer Personal Details grid */}
              <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Full Name English */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Full Name English (नाव इंग्रजी)
                  </label>
                  <input
                    type="text"
                    value={data.fullNameEn}
                    onChange={(e) => handleUpdateField('fullNameEn', e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#094d28] focus:border-[#094d28] outline-hidden uppercase"
                    placeholder="e.g. DIPAK MADHAV KHANDARE"
                  />
                </div>

                {/* Full Name Marathi */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Full Name Marathi (नाव स्थानिक भाषा)
                  </label>
                  <input
                    type="text"
                    value={data.fullNameMr}
                    onChange={(e) => handleUpdateField('fullNameMr', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#094d28] focus:border-[#094d28] outline-hidden"
                    placeholder="उदा. दिपक माधव खंदारे"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Date of Birth (जन्म तारीख - DD/MM/YYYY)
                  </label>
                  <input
                    type="text"
                    value={data.dob}
                    onChange={(e) => handleUpdateField('dob', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#094d28] focus:border-[#094d28] outline-hidden"
                    placeholder="DD/MM/YYYY (उदा. 20/08/1993)"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Gender (लिंग)
                  </label>
                  <select
                    value={data.gender || 'Male'}
                    onChange={(e) => handleUpdateField('gender', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#094d28] focus:border-[#094d28] outline-hidden cursor-pointer"
                  >
                    <option value="Male" className="dark:bg-slate-900">Male / पुरुष</option>
                    <option value="Female" className="dark:bg-slate-900">Female / महिला</option>
                  </select>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Mobile Number (मोबाईल क्र.)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={data.mobile}
                    onChange={(e) => handleUpdateField('mobile', e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#094d28] focus:border-[#094d28] outline-hidden"
                    placeholder="10 अंकी मोबाईल क्र. (उदा. 9049102035)"
                  />
                </div>

                {/* Farmer ID */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    Farmer ID (फार्मर आयडी)
                  </label>
                  <input
                    type="text"
                    value={data.farmerId}
                    onChange={(e) => handleUpdateField('farmerId', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-[#094d28] dark:text-emerald-400 focus:ring-2 focus:ring-[#094d28] focus:border-[#094d28] outline-hidden"
                    placeholder="उदा. 80368738190"
                  />
                </div>

                {/* Official Address */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Official Address (अधिकृत पत्ता)
                  </label>
                  <input
                    type="text"
                    value={data.address}
                    onChange={(e) => handleUpdateField('address', e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#094d28] focus:border-[#094d28] outline-hidden uppercase"
                    placeholder="उदा. AT. SOMTHANA POST. MOHAJA TQ MALEGAON DIST. WASHIM"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: LAND DETAILS TABLE */}
          <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#094d28] dark:text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  LAND OWNERSHIP DETAILS (जमिनीची माहिती - {data.lands.length} नोंदी)
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddLandRow}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#094d28] dark:text-emerald-400 hover:text-[#06361c] bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                गट नं. जोडा
              </button>
            </div>

            {/* Land Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold text-[11px]">
                    <th className="p-2.5">District (जिल्हा)</th>
                    <th className="p-2.5">Taluka (तालुका)</th>
                    <th className="p-2.5">Village (गाव)</th>
                    <th className="p-2.5">Gat No. (गट नं.)</th>
                    <th className="p-2.5">Area (क्षेत्र हे.आर)</th>
                    <th className="p-2.5 text-center w-10">✕</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.lands.map((land, idx) => (
                    <tr key={land.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="p-2">
                        <input
                          type="text"
                          value={land.district}
                          onChange={(e) => handleUpdateLand(idx, 'district', e.target.value.toUpperCase())}
                          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#094d28] dark:focus:border-emerald-400 rounded font-bold uppercase outline-hidden text-slate-800 dark:text-slate-200"
                          placeholder="WASHIM"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={land.taluka}
                          onChange={(e) => handleUpdateLand(idx, 'taluka', e.target.value)}
                          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#094d28] dark:focus:border-emerald-400 rounded font-bold outline-hidden text-slate-800 dark:text-slate-200"
                          placeholder="Malegaon"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={land.village}
                          onChange={(e) => handleUpdateLand(idx, 'village', e.target.value.toUpperCase())}
                          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#094d28] dark:focus:border-emerald-400 rounded font-bold uppercase outline-hidden text-slate-800 dark:text-slate-200"
                          placeholder="SOMTHANA"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={land.gatNo}
                          onChange={(e) => handleUpdateLand(idx, 'gatNo', e.target.value)}
                          className="w-full px-2 py-1 bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded font-black text-[#094d28] dark:text-emerald-300 outline-hidden text-center"
                          placeholder="126"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={land.areaHaR}
                          onChange={(e) => handleUpdateLand(idx, 'areaHaR', e.target.value)}
                          className="w-full px-2 py-1 bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded font-mono font-bold text-slate-900 dark:text-slate-100 outline-hidden text-right"
                          placeholder="1.06"
                        />
                      </td>
                      <td className="p-2 text-center">
                        {data.lands.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteLandRow(idx)}
                            className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer p-1"
                            title="ही नोंद हटवा"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Area Calculation Callouts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  एकूण क्षेत्र (Total Area):
                </span>
                <span className="font-mono text-sm font-black text-[#094d28] dark:text-emerald-400">
                  {totalHaR} हे.आर
                </span>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  एकूण क्षेत्र (Acres):
                </span>
                <span className="font-mono text-sm font-black text-amber-950 dark:text-amber-300">
                  {totalAcres} एकर
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER BUTTONS */}
        <div className="bg-slate-100/90 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer shadow-xs"
            >
              <Edit3 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>{isEditing ? 'माहिती तपासा (Done)' : 'Edit Data (संपादित करा)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsVerified(true)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                isVerified
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isVerified ? '✓ Verified (पडताळणी पूर्ण)' : 'Verify Data (पडताळणी करा)'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 font-bold text-xs transition-colors cursor-pointer"
            >
              रद्द करा
            </button>
            <button
              type="button"
              onClick={() => onConfirmGenerate(data)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 active:from-amber-500 active:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5 border border-amber-500/40 ring-2 ring-amber-400/20"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Generate Farmer ID Card</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

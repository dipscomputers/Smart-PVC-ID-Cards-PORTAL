export interface FarmerCardLand {
  id: string;
  district: string;  // जिल्हा (e.g. WASHIM)
  taluka: string;    // तालुका (e.g. Risod / Malegaon)
  village: string;   // गाव (e.g. BELKHED / SOMTHANA)
  gatNo: string;     // गट नं. (e.g. 19, 91, 105, 175)
  khateNo: string;   // खाते नं.
  areaHaR: string;   // क्षेत्र हे.आर (e.g. 0.0125, 0.03, 0.30, 1.21)
}

export interface FarmerCardData {
  id: string;
  fileName?: string;
  // Personal Details
  fullNameMr: string;       // नाव (उदा: दिपक माधव खंदारे)
  fullNameEn: string;       // Name in English (e.g. DIPAK MADHAV KHANDARE)
  dob: string;              // जन्म दिनांक / DOB (e.g. 20/08/1993)
  gender: string;           // लिंग / Gender (e.g. Male / Female)
  mobile: string;           // मोबाईल / Mobile (e.g. 9049102035)
  aadhaarNo: string;        // आधार नं / Aadhaar No (e.g. 9420 4790 8747)
  farmerId: string;         // फार्मर आयडी (e.g. 494 88 37 94 29)
  photoUrl: string;         // फोटो URL / Data URI
  
  // Address & Land Details
  address: string;          // संपूर्ण पत्ता / Address (e.g. AT. POST. SHIRPUR JAIN TQ MALEGAON DIST.WASHIM)
  villageEn?: string;       // Village (English)
  tehsilEn?: string;        // Tehsil / Taluka (English)
  districtEn?: string;      // District (English)
  pincode?: string;         // Pincode (6 digits)
  villageMr?: string;       // गाव (मराठी)
  tehsilMr?: string;        // तहसील / तालुका (मराठी)
  districtMr?: string;      // जिल्हा (मराठी)
  lands: FarmerCardLand[];  // जमिनीची माहिती / Land Details
  totalArea?: string;       // एकूण क्षेत्र (Total Area in Ha.R)
  totalAreaAcres?: string;  // एकूण क्षेत्र (Total Area in Acres)
}

// Calculate sum of land areas (e.g. "1.06")
export function calculateTotalArea(lands: FarmerCardLand[]): string {
  const sum = lands.reduce((acc, land) => {
    const val = parseFloat(land.areaHaR || '0');
    return acc + (isNaN(val) ? 0 : val);
  }, 0);
  if (sum <= 0) return '0.00';
  return sum % 1 === 0 ? sum.toFixed(2) : sum.toFixed(2);
}

// Calculate sum of land areas in Acres (1 Ha = 2.50 Acres: e.g. 1.00 Ha = 2.50 Acres, 0.80 Ha = 2 Acres, 0.40 Ha = 1 Acre)
export function calculateTotalAreaAcres(lands: FarmerCardLand[]): string {
  const sum = lands.reduce((acc, land) => {
    const val = parseFloat(land.areaHaR || '0');
    return acc + (isNaN(val) ? 0 : val);
  }, 0);
  if (sum <= 0) return '0.00';
  const acres = sum * 2.5;
  return acres % 1 === 0 ? acres.toFixed(0) : acres.toFixed(2);
}

// Default blank farmer card
export const DEFAULT_FARMER_CARD_SAMPLE: FarmerCardData = {
  id: 'farmer-card-default-1',
  fullNameMr: '',
  fullNameEn: '',
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
  lands: [],
  totalArea: '0.00',
  totalAreaAcres: '0.00',
};

export function createBlankFarmerCard(index: number = 1): FarmerCardData {
  return {
    id: `farmer-card-${Date.now()}-${index}`,
    fullNameMr: '',
    fullNameEn: '',
    dob: '',
    gender: 'Male',
    mobile: '',
    aadhaarNo: '',
    farmerId: '',
    photoUrl: '',
    address: '',
    lands: [
      {
        id: `land-${Date.now()}-1`,
        district: '',
        taluka: '',
        village: '',
        gatNo: '',
        khateNo: '',
        areaHaR: '',
      },
    ],
    totalArea: '0.00',
  };
}

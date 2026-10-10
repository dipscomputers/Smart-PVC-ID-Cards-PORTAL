import { FarmerFormData } from '../types/form';

export function generateApplicationNumber(): string {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `MH-AGRI-2026-${randomDigits}`;
}

// Convert any month representation ('06', '6', 'jun', 'June', 'जून') to standardized English Month
export function normalizeMonth(monthStr: string): string {
  if (!monthStr) return '';
  const clean = monthStr.trim().toLowerCase();
  const map: Record<string, string> = {
    '1': 'January', '01': 'January', 'jan': 'January', 'january': 'January', 'जानेवारी': 'January',
    '2': 'February', '02': 'February', 'feb': 'February', 'february': 'February', 'फेब्रुवारी': 'February',
    '3': 'March', '03': 'March', 'mar': 'March', 'march': 'March', 'मार्च': 'March',
    '4': 'April', '04': 'April', 'apr': 'April', 'april': 'April', 'एप्रिल': 'April',
    '5': 'May', '05': 'May', 'may': 'May', 'मे': 'May',
    '6': 'June', '06': 'June', 'jun': 'June', 'june': 'June', 'जून': 'June',
    '7': 'July', '07': 'July', 'jul': 'July', 'july': 'July', 'जुलै': 'July',
    '8': 'August', '08': 'August', 'aug': 'August', 'august': 'August', 'ऑगस्ट': 'August',
    '9': 'September', '09': 'September', 'sep': 'September', 'september': 'September', 'सप्टेंबर': 'September',
    '10': 'October', 'oct': 'October', 'october': 'October', 'ऑक्टोबर': 'October',
    '11': 'November', 'nov': 'November', 'november': 'November', 'नोव्हेंबर': 'November',
    '12': 'December', 'dec': 'December', 'december': 'December', 'डिसेंबर': 'December',
  };
  return map[clean] || monthStr;
}

// Parse string like "15/06/1975" or "15-06-1975"
export function parseDateOfBirth(dob: string): { day: string; month: string; year: string } {
  if (!dob) return { day: '', month: '', year: '' };
  const parts = dob.split(/[\/\-\.\s]+/);
  if (parts.length === 3) {
    let day = parts[0].padStart(2, '0');
    let month = normalizeMonth(parts[1]);
    let year = parts[2];
    // In case year is first (YYYY-MM-DD)
    if (parts[0].length === 4) {
      year = parts[0];
      month = normalizeMonth(parts[1]);
      day = parts[2].padStart(2, '0');
    }
    return { day, month, year };
  }
  return { day: '', month: '', year: '' };
}

export const initialFormData: FarmerFormData = {
  fullNameEn: '',
  fullNameMr: '',
  dobDay: '',
  dobMonth: '',
  dobYear: '',
  gender: '',
  whatsappNumber: '',
  photoUrl: '',
  aadhaarNumber: '',
  farmerId: '',
  addressEn: '',
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
  applicationNo: generateApplicationNumber(),
  submittedAt: new Date().toLocaleDateString('mr-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }),
};

// Official photo representation matching Smt. Jyoti Pandhari Khandare from user's card image
export const sampleJyotiPhotoDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 200" width="160" height="200">
  <defs>
    <!-- Lush Green Farm Backdrop -->
    <linearGradient id="farmBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#bbf7d0"/>
      <stop offset="50%" stop-color="#86efac"/>
      <stop offset="100%" stop-color="#4ade80"/>
    </linearGradient>
    <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e2ab87"/>
      <stop offset="100%" stop-color="#cf9064"/>
    </linearGradient>
    <linearGradient id="greenBlouse" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#15803d"/>
      <stop offset="100%" stop-color="#166534"/>
    </linearGradient>
    <linearGradient id="creamSaree" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="50%" stop-color="#fde68a"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>

  <!-- Green field background -->
  <rect width="160" height="200" fill="url(#farmBg)"/>
  <circle cx="30" cy="50" r="40" fill="#4ade80" opacity="0.3"/>
  <circle cx="130" cy="60" r="45" fill="#22c55e" opacity="0.2"/>

  <!-- Shoulders & Dark Green Blouse as in card image -->
  <path d="M 8 200 C 16 155, 46 138, 80 138 C 114 138, 144 155, 152 200 Z" fill="url(#greenBlouse)"/>
  
  <!-- Saree Drape with Gold Print (Cream/Gold) on Left Shoulder -->
  <path d="M 82 142 C 100 148, 130 170, 148 200 L 115 200 C 100 175, 85 155, 75 142 Z" fill="url(#creamSaree)"/>
  <path d="M 76 142 L 120 200" stroke="#b45309" stroke-width="2" stroke-dasharray="3 2" fill="none"/>
  <path d="M 84 142 L 132 200" stroke="#f59e0b" stroke-width="2" fill="none"/>

  <!-- Neck & Collarbone -->
  <path d="M 65 118 L 65 146 Q 80 152 95 146 L 95 118 Z" fill="url(#skinGrad)"/>
  <!-- Gold Chain / Mangalsutra -->
  <path d="M 68 136 Q 80 145 92 136" stroke="#b45309" stroke-width="2" fill="none"/>
  <circle cx="80" cy="143" r="2.5" fill="#f59e0b"/>

  <!-- Head & Hair Back -->
  <ellipse cx="80" cy="85" rx="41" ry="45" fill="#18181b"/>

  <!-- Face -->
  <ellipse cx="80" cy="91" rx="30" ry="35" fill="url(#skinGrad)"/>

  <!-- Center-parted sleek dark hair -->
  <path d="M 50 82 C 58 62, 77 66, 80 76 C 83 66, 102 62, 110 82 C 102 72, 87 70, 80 79 C 73 70, 58 72, 50 82 Z" fill="#18181b"/>

  <!-- Ears & Gold Earrings -->
  <ellipse cx="49" cy="92" rx="3.5" ry="6.5" fill="#cf9064"/>
  <circle cx="48" cy="96" r="2.2" fill="#f59e0b"/>
  <ellipse cx="111" cy="92" rx="3.5" ry="6.5" fill="#cf9064"/>
  <circle cx="112" cy="96" r="2.2" fill="#f59e0b"/>

  <!-- Eyebrows -->
  <path d="M 60 83 Q 68 80 75 84" stroke="#27272a" stroke-width="2" stroke-linecap="round" fill="none"/>
  <path d="M 85 84 Q 92 80 100 83" stroke="#27272a" stroke-width="2" stroke-linecap="round" fill="none"/>

  <!-- Red Round Bindi (कुंकू / टिकली) -->
  <circle cx="80" cy="84" r="3.2" fill="#b91c1c"/>

  <!-- Eyes -->
  <ellipse cx="68" cy="90" rx="4.5" ry="2.8" fill="#ffffff"/>
  <circle cx="68" cy="90" r="2.2" fill="#2d1b10"/>
  <circle cx="67" cy="89" r="0.8" fill="#ffffff"/>

  <ellipse cx="92" cy="90" rx="4.5" ry="2.8" fill="#ffffff"/>
  <circle cx="92" cy="90" r="2.2" fill="#2d1b10"/>
  <circle cx="91" cy="89" r="0.8" fill="#ffffff"/>

  <!-- Nose & Small Gold Nathni -->
  <path d="M 80 86 L 78 100 Q 80 103 83 100" stroke="#ad6d42" stroke-width="1.4" stroke-linecap="round" fill="none"/>
  <circle cx="76.5" cy="100" r="1.1" fill="#f59e0b"/>

  <!-- Lips / Pleasant Expression -->
  <path d="M 73 109 Q 80 114 87 109" stroke="#991b1b" stroke-width="1.8" stroke-linecap="round" fill="none"/>

  <!-- Frame Outline -->
  <rect x="0.5" y="0.5" width="159" height="199" fill="none" stroke="#22c55e" stroke-width="1" rx="8"/>
</svg>
`)}`;

// Studio passport photo for sample data (Dipak Khandare style with sky blue background)
export const sampleDipakPhotoDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 300" width="240" height="300">
  <rect width="240" height="300" fill="#99c8e8" />
  <circle cx="120" cy="115" r="54" fill="#d89f78" />
  <!-- Hair -->
  <path d="M68 110C68 55 85 40 120 40C155 40 172 55 172 110C165 65 155 52 120 52C85 52 75 65 68 110Z" fill="#171717" />
  <!-- Ears -->
  <ellipse cx="66" cy="120" rx="8" ry="14" fill="#d89f78" />
  <ellipse cx="174" cy="120" rx="8" ry="14" fill="#d89f78" />
  <!-- Eyebrows & Eyes -->
  <path d="M85 102Q98 98 108 102" stroke="#171717" stroke-width="3.5" stroke-linecap="round" fill="none" />
  <path d="M132 102Q142 98 155 102" stroke="#171717" stroke-width="3.5" stroke-linecap="round" fill="none" />
  <circle cx="97" cy="112" r="5" fill="#171717" />
  <circle cx="143" cy="112" r="5" fill="#171717" />
  <!-- Red Tilak -->
  <circle cx="120" cy="98" r="2.8" fill="#dc2626" />
  <!-- Nose -->
  <path d="M120 108L116 128L124 128" stroke="#b57a53" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
  <!-- Mustache & Beard -->
  <path d="M96 138Q120 134 144 138Q135 146 120 144Q105 146 96 138Z" fill="#171717" />
  <path d="M102 152Q120 156 138 152Q130 162 120 162Q110 162 102 152Z" fill="#171717" />
  <!-- Neck -->
  <rect x="100" y="160" width="40" height="30" fill="#c78e68" />
  <!-- White Shirt & Collar -->
  <path d="M50 190L100 178L120 205L140 178L190 190L220 300L20 300Z" fill="#ffffff" />
  <path d="M100 178L120 205L140 178" stroke="#e5e7eb" stroke-width="2" fill="none" />
  <line x1="120" y1="205" x2="120" y2="300" stroke="#e5e7eb" stroke-width="2" />
  <circle cx="120" cy="225" r="2.5" fill="#9ca3af" />
  <circle cx="120" cy="255" r="2.5" fill="#9ca3af" />
</svg>
`)}`;

// Exact data matching user's latest Agri Record image: Dipak Madhav Khandare
export const sampleFarmerData: FarmerFormData = {
  fullNameEn: 'DIPAK MADHAV KHANDARE',
  fullNameMr: 'दिपक माधव खंदारे',
  dobDay: '20',
  dobMonth: 'August',
  dobYear: '1993',
  gender: 'Male',
  whatsappNumber: '9049102035',
  photoUrl: sampleDipakPhotoDataUri,
  aadhaarNumber: '9420 4790 8747',
  farmerId: '49488379429',
  addressEn: 'AT. SOMTHANA POST. MOJAHA TQ MALEGAON DIST.WASHIM',
  villageEn: 'SOMTHANA',
  subDistrictEn: 'MOJAHA',
  tehsilEn: 'MALEGAON',
  districtEn: 'WASHIM',
  pincode: '444503',
  villageMr: 'सोमठाणा',
  tehsilMr: 'मालेगाव',
  districtMr: 'वाशिम',
  lands: [
    {
      id: 'land-126',
      district: 'वाशिम',
      taluka: 'मालेगाव',
      village: 'SOMTHANA',
      gatNo: '126',
      khateNo: '',
      areaHaR: '1.06',
    },
  ],
  applicationNo: '27_499_3995_530706_005193',
  submittedAt: '01/10/2026',
};

// Studio passport photo for Dilip Haribhau Narwade (Yellow shirt as in user screenshot)
export const sampleDilipPhotoDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 300" width="240" height="300">
  <rect width="240" height="300" fill="#f1f5f9" />
  <circle cx="120" cy="115" r="54" fill="#d89f78" />
  <!-- Hair & Receding Hairline -->
  <path d="M72 120C72 70 85 55 120 55C155 55 168 70 168 120C164 80 152 70 120 70C88 70 76 80 72 120Z" fill="#1f2937" />
  <!-- Ears -->
  <ellipse cx="66" cy="120" rx="8" ry="14" fill="#d89f78" />
  <ellipse cx="174" cy="120" rx="8" ry="14" fill="#d89f78" />
  <!-- Eyebrows & Eyes -->
  <path d="M85 104Q98 100 108 104" stroke="#1f2937" stroke-width="3" stroke-linecap="round" fill="none" />
  <path d="M132 104Q142 100 155 104" stroke="#1f2937" stroke-width="3" stroke-linecap="round" fill="none" />
  <circle cx="97" cy="114" r="4.5" fill="#1f2937" />
  <circle cx="143" cy="114" r="4.5" fill="#1f2937" />
  <!-- Nose -->
  <path d="M120 110L116 130L124 130" stroke="#b57a53" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
  <!-- Prominent Dark Mustache -->
  <path d="M92 139Q120 132 148 139Q138 152 120 148Q102 152 92 139Z" fill="#111827" />
  <!-- Neck -->
  <rect x="100" y="160" width="40" height="30" fill="#c78e68" />
  <!-- Yellow Patterned Shirt as in screenshot -->
  <path d="M50 190L100 178L120 205L140 178L190 190L220 300L20 300Z" fill="#eab308" />
  <path d="M100 178L120 205L140 178" stroke="#ca8a04" stroke-width="2" fill="none" />
  <line x1="120" y1="205" x2="120" y2="300" stroke="#ca8a04" stroke-width="2" />
</svg>
`)}`;

export const screenshotFarmersList: FarmerFormData[] = [
  {
    fullNameEn: 'DILIP HARIBHAU NARWADE',
    fullNameMr: 'दिलीप हरिभाऊ नरवाडे',
    dobDay: '29',
    dobMonth: 'June',
    dobYear: '1977',
    gender: 'Male',
    whatsappNumber: '9890797719',
    photoUrl: sampleDilipPhotoDataUri,
    aadhaarNumber: '3222 2222 2222',
    farmerId: '11802978955',
    addressEn: 'AT. SOMTHANA TQ MALEGAON DIST.WASHIM',
    villageEn: 'SOMTHANA',
    subDistrictEn: 'MOJAHA',
    tehsilEn: 'MALEGAON',
    districtEn: 'WASHIM',
    pincode: '444503',
    villageMr: 'सोमठाणा',
    tehsilMr: 'मालेगाव',
    districtMr: 'वाशिम',
    lands: [
      {
        id: 'land-narwade',
        district: 'वाशिम',
        taluka: 'मालेगाव',
        village: 'SOMTHANA',
        gatNo: '88',
        khateNo: '142',
        areaHaR: '1.20',
      },
    ],
    applicationNo: '27_499_3995_530706_005193',
    submittedAt: '01/10/2026',
  },
  sampleFarmerData,
];

export const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

export const months = [
  { value: 'January', label: 'January / जानेवारी' },
  { value: 'February', label: 'February / फेब्रुवारी' },
  { value: 'March', label: 'March / मार्च' },
  { value: 'April', label: 'April / एप्रिल' },
  { value: 'May', label: 'May / मे' },
  { value: 'June', label: 'June / जून' },
  { value: 'July', label: 'July / जुलै' },
  { value: 'August', label: 'August / ऑगस्ट' },
  { value: 'September', label: 'September / सप्टेंबर' },
  { value: 'October', label: 'October / ऑक्टोबर' },
  { value: 'November', label: 'November / नोव्हेंबर' },
  { value: 'December', label: 'December / डिसेंबर' },
];

export const currentYear = new Date().getFullYear();
export const years = Array.from({ length: 80 }, (_, i) => String(currentYear - 18 - i));

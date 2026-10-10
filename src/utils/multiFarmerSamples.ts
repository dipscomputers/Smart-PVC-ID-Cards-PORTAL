import { FarmerFormData } from '../types/form';
import { sampleDipakPhotoDataUri, sampleJyotiPhotoDataUri } from './sampleData';

// Male Elder Farmer with white pheta
export const sampleElderFarmerPhoto = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="200" height="240">
  <rect width="200" height="240" fill="#cbe4de" />
  <!-- White Pheta/Turban -->
  <path d="M40 70C40 25 60 15 100 15C140 15 160 25 160 70C165 60 170 50 170 40C170 25 150 10 100 10C50 10 30 25 30 40C30 50 35 60 40 70Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
  <path d="M35 60C45 40 70 30 100 30C130 30 155 40 165 60C170 70 160 80 150 82C130 85 70 85 50 82C40 80 30 70 35 60Z" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5"/>
  <!-- Face -->
  <ellipse cx="100" cy="115" rx="46" ry="52" fill="#d99b73"/>
  <!-- Ears -->
  <ellipse cx="50" cy="118" rx="8" ry="14" fill="#d99b73"/>
  <ellipse cx="150" cy="118" rx="8" ry="14" fill="#d99b73"/>
  <!-- Eyes -->
  <circle cx="82" cy="108" r="4.5" fill="#1e293b"/>
  <circle cx="118" cy="108" r="4.5" fill="#1e293b"/>
  <!-- Tilak -->
  <circle cx="100" cy="92" r="3.5" fill="#dc2626"/>
  <!-- White Mustache & Beard -->
  <path d="M75 130Q100 126 125 130Q115 148 100 146Q85 148 75 130Z" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/>
  <path d="M85 145Q100 162 115 145Q110 165 100 165Q90 165 85 145Z" fill="#f8fafc"/>
  <!-- Kurta -->
  <path d="M30 200L70 180L100 200L130 180L170 200L190 240L10 240Z" fill="#ffffff" stroke="#e2e8f0"/>
</svg>
`)}`;

// Modern Young Farmer
export const sampleYoungFarmerPhoto = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="200" height="240">
  <rect width="200" height="240" fill="#dcfce7" />
  <!-- Hair -->
  <path d="M55 90C50 40 70 30 100 30C130 30 150 40 145 90C140 50 130 42 100 42C70 42 60 50 55 90Z" fill="#0f172a"/>
  <!-- Face -->
  <ellipse cx="100" cy="112" rx="44" ry="50" fill="#e2ab87"/>
  <!-- Eyes -->
  <circle cx="84" cy="106" r="4" fill="#0f172a"/>
  <circle cx="116" cy="106" r="4" fill="#0f172a"/>
  <!-- Smile -->
  <path d="M86 135Q100 144 114 135" stroke="#991b1b" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Green Polo Collar -->
  <path d="M30 195L75 178L100 200L125 178L170 195L190 240L10 240Z" fill="#15803d"/>
  <path d="M75 178L100 200L125 178" stroke="#166534" stroke-width="2" fill="none"/>
</svg>
`)}`;

// Female Modern Farmer
export const sampleFemaleFarmer2 = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="200" height="240">
  <rect width="200" height="240" fill="#fef3c7" />
  <!-- Hair & Saree Pallu (Saffron/Yellow) -->
  <path d="M40 90C30 30 70 15 100 15C130 15 170 30 160 90C165 140 155 180 150 200C120 180 80 180 50 200C45 180 35 140 40 90Z" fill="#ca8a04"/>
  <!-- Face -->
  <ellipse cx="100" cy="110" rx="40" ry="46" fill="#e5b08c"/>
  <!-- Bindi -->
  <circle cx="100" cy="92" r="3.5" fill="#b91c1c"/>
  <!-- Eyes -->
  <ellipse cx="85" cy="106" rx="4" ry="2.5" fill="#1e293b"/>
  <ellipse cx="115" cy="106" rx="4" ry="2.5" fill="#1e293b"/>
  <!-- Lips -->
  <path d="M88 132Q100 138 112 132" stroke="#b91c1c" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- Saree Blouse -->
  <path d="M30 195L70 180L100 195L130 180L170 195L190 240L10 240Z" fill="#047857"/>
</svg>
`)}`;

export const sampleMultiFarmersList: FarmerFormData[] = [
  {
    fullNameEn: 'DIPAK MADHAV KHANDARE',
    fullNameMr: 'दिपक माधव खंदारे',
    dobDay: '20',
    dobMonth: 'August',
    dobYear: '1993',
    gender: 'Male',
    whatsappNumber: '9049102035',
    photoUrl: sampleDipakPhotoDataUri,
    aadhaarNumber: '9420 4790 8747',
    farmerId: '803 68 73 81 90',
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
        khateNo: '342',
        areaHaR: '1.06',
      },
    ],
    applicationNo: 'MH-AGRI-2026-803687',
    submittedAt: '01/10/2026',
  },
  {
    fullNameEn: 'JYOTI PANDHARI KHANDARE',
    fullNameMr: 'सौ. ज्योती पंढरी खंदारे',
    dobDay: '15',
    dobMonth: 'June',
    dobYear: '1995',
    gender: 'Female',
    whatsappNumber: '8888732035',
    photoUrl: sampleJyotiPhotoDataUri,
    aadhaarNumber: '7821 3490 1254',
    farmerId: '803 68 73 81 91',
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
        id: 'land-128',
        district: 'वाशिम',
        taluka: 'मालेगाव',
        village: 'SOMTHANA',
        gatNo: '128',
        khateNo: '581',
        areaHaR: '0.85',
      },
    ],
    applicationNo: 'MH-AGRI-2026-803688',
    submittedAt: '02/10/2026',
  },
  {
    fullNameEn: 'TUKARAM BHAURAO SHINDE',
    fullNameMr: 'तुकाराम भाऊराव शिंदे',
    dobDay: '12',
    dobMonth: 'March',
    dobYear: '1968',
    gender: 'Male',
    whatsappNumber: '9822451080',
    photoUrl: sampleElderFarmerPhoto,
    aadhaarNumber: '6543 9812 7701',
    farmerId: '803 45 88 12 30',
    addressEn: 'AT. PIMPALGAON BASWANT TQ NIPHAD DIST.NASHIK',
    villageEn: 'PIMPALGAON',
    subDistrictEn: 'BASWANT',
    tehsilEn: 'NIPHAD',
    districtEn: 'NASHIK',
    pincode: '422209',
    villageMr: 'पिंपळगाव बसवंत',
    tehsilMr: 'निफाड',
    districtMr: 'नाशिक',
    lands: [
      {
        id: 'land-204',
        district: 'नाशिक',
        taluka: 'निफाड',
        village: 'पिंपळगाव',
        gatNo: '204',
        khateNo: '89',
        areaHaR: '2.40',
      },
    ],
    applicationNo: 'MH-AGRI-2026-778899',
    submittedAt: '03/10/2026',
  },
  {
    fullNameEn: 'RAMESH KALU PATEL',
    fullNameMr: 'रमेश काळू पटेल',
    dobDay: '05',
    dobMonth: 'November',
    dobYear: '1984',
    gender: 'Male',
    whatsappNumber: '9423187654',
    photoUrl: sampleYoungFarmerPhoto,
    aadhaarNumber: '4321 8765 9012',
    farmerId: '803 72 19 44 85',
    addressEn: 'AT. NARAYANGAON TQ JUNNAR DIST.PUNE',
    villageEn: 'NARAYANGAON',
    subDistrictEn: 'JUNNAR',
    tehsilEn: 'JUNNAR',
    districtEn: 'PUNE',
    pincode: '410504',
    villageMr: 'नारायणगाव',
    tehsilMr: 'जुन्नर',
    districtMr: 'पुणे',
    lands: [
      {
        id: 'land-315',
        district: 'पुणे',
        taluka: 'जुन्नर',
        village: 'नारायणगाव',
        gatNo: '315/2',
        khateNo: '410',
        areaHaR: '1.75',
      },
    ],
    applicationNo: 'MH-AGRI-2026-665544',
    submittedAt: '03/10/2026',
  },
  {
    fullNameEn: 'SUNITA ASHOKRAO JADHAV',
    fullNameMr: 'सुनिता अशोकराव जाधव',
    dobDay: '28',
    dobMonth: 'September',
    dobYear: '1988',
    gender: 'Female',
    whatsappNumber: '9158334422',
    photoUrl: sampleFemaleFarmer2,
    aadhaarNumber: '8877 6655 4433',
    farmerId: '803 91 55 62 14',
    addressEn: 'AT. SHIRUR TQ SHIRUR DIST.BEED',
    villageEn: 'SHIRUR',
    subDistrictEn: 'KASAR',
    tehsilEn: 'SHIRUR',
    districtEn: 'BEED',
    pincode: '413249',
    villageMr: 'शिरूर',
    tehsilMr: 'शिरूर',
    districtMr: 'बीड',
    lands: [
      {
        id: 'land-98',
        district: 'बीड',
        taluka: 'शिरूर',
        village: 'शिरूर',
        gatNo: '98',
        khateNo: '215',
        areaHaR: '1.20',
      },
    ],
    applicationNo: 'MH-AGRI-2026-554433',
    submittedAt: '03/10/2026',
  },
];

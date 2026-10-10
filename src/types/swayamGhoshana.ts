export type SwayamGhoshanaFormatMode = 'both' | 'prapatra-a' | 'prapatra-b';
export type SwayamGhoshanaFontSize = 'normal' | 'large' | 'xl';
export type SwayamGhoshanaBorderStyle = 'single' | 'double' | 'none';
export type SwayamGhoshanaLineSpacing = 'normal' | 'relaxed' | 'loose';

export interface SwayamGhoshanaData {
  fullName: string;              // पूर्ण नाव (उदा. श्री./श्रीमती गणेश महादेव पाटील)
  relationType: 'मुलगा' | 'मुलगी' | 'पत्नी' | string; // मुलगा / मुलगी / पत्नी
  fatherOrHusbandName: string;   // वडिलांचे / पतीचे नाव (उदा. महादेव हरी पाटील)
  age: string;                   // वय (वर्ष)
  aadhaarNumber: string;         // आधार क्रमांक (१२ अंक)
  occupation: string;            // व्यवसाय (उदा. शेती / नोकरी / व्यवसाय / मजुरी)
  address: string;               // राहणार (उदा. मु. पो. खंडाळा, ता. मालेगाव, जि. वाशीम)
  date: string;                  // दिनांक (YYYY-MM-DD or DD/MM/YYYY)
  place: string;                 // ठिकाण (उदा. खंडाळा)
  photoUrl?: string;             // अर्जदाराचा फोटो
  signatureUrl?: string;         // अर्जदाराची सही
  showPhotoInBoth: boolean;      // दोन्ही प्रपत्रात फोटो दाखवायचा का
  showNameUnderSignature?: boolean; // प्रपत्र-ब मध्ये सही खाली नाव दाखवायचे का
  formatMode?: SwayamGhoshanaFormatMode; // 'both' | 'prapatra-a' | 'prapatra-b'
  fontSizeScale?: SwayamGhoshanaFontSize; // 'normal' | 'large' | 'xl'
  lineSpacing?: SwayamGhoshanaLineSpacing; // 'normal' | 'relaxed' | 'loose'
  borderStyle?: SwayamGhoshanaBorderStyle; // 'single' | 'double' | 'none'
  governmentResolutionNo?: string; // शासन निर्णय क्रमांक
  isBlankPrint?: boolean; // कोरा फॉर्म प्रिंट (हस्ताक्षरासाठी)
}

export const defaultSwayamGhoshanaData: SwayamGhoshanaData = {
  fullName: 'दिपक माधव खंदारे',
  relationType: 'मुलगा',
  fatherOrHusbandName: 'माधव खंदारे',
  age: '30',
  aadhaarNumber: '942047908747',
  occupation: 'शेती',
  address: 'मु. पो. सोमठाणा, ता. मालेगाव, जि. वाशीम',
  date: new Date().toISOString().split('T')[0],
  place: 'सोमठाणा',
  photoUrl: '',
  signatureUrl: '',
  showPhotoInBoth: true,
  showNameUnderSignature: true,
  formatMode: 'both',
  fontSizeScale: 'normal',
  lineSpacing: 'loose',
  borderStyle: 'single',
  governmentResolutionNo: 'शासन निर्णय क्रमांक: प्रसुता १६.१४/३४५/प्र.क्र.७१/१८-अ',
  isBlankPrint: false,
};

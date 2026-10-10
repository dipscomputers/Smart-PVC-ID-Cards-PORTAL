import { FarmerFormData } from './form';

export type CardTemplateId = 
  | 'agri-record'       // 1. स्मार्ट शेती परिचय पत्र
  | 'maha-govt'         // 2. महाराष्ट्र शासन कृषी विभाग अधिकृत ओळखपत्र
  | 'pm-kisan-kcc'      // 3. पीएम-किसान व किसान क्रेडिट कार्ड
  | 'organic-farmer'    // 4. सेंद्रिय व जैविक शेतकरी हरित कार्ड
  | 'apmc-vertical'     // 5. कृषी उत्पन्न बाजार समिती (मंडी) पास (Vertical Badge)
  | 'modern-gold-chip'; // 6. मॉडर्न डिजिटल गोल्ड चिप पीव्हीसी कार्ड

export type CardThemeId = 
  | 'emerald'   // कृषी हिरवा (Agri Emerald Green)
  | 'tricolor'  // शासकीय तिरंगा / केशरी (Saffron Gold Tricolor)
  | 'navy'      // राष्ट्रीय निळा (Royal Navy Blue)
  | 'forest'    // खोल वन सुवर्ण (Forest & Gold)
  | 'amber';    // माती व सोनेरी (Harvest Earth Amber)

export type CardLanguage = 'mr' | 'hi' | 'en';

export type CardViewMode = 'both' | 'front' | 'back' | 'flip3d';

export type PrintLayoutMode = 
  | 'single-a4'     // 1 Card (Front + Back) on A4 Top Center (Standard 2mm gap)
  | 'pvc-tray-5'    // 5 Cards PVC Tray Layout (CSC Standard for Epson/Canon)
  | 'sheet-8'       // 8 Cards on A4 (2 columns x 4 rows)
  | 'pvc-direct';   // Direct 85.6 x 54mm CR80 single card print

export interface CardCustomizationOptions {
  template: CardTemplateId;
  theme: CardThemeId;
  language: CardLanguage;
  viewMode: CardViewMode;
  printLayout: PrintLayoutMode;
  
  // Feature Toggles
  showGovtSeal: boolean;
  showHologram: boolean;
  showQrCode: boolean;
  showBarcode: boolean;
  showSignature: boolean;
  showLandDetails: boolean;
  showSoilHealth: boolean;
  showEmergencyContact: boolean;
  cardCornerRadius: 'rounded' | 'sharp' | 'extra-round';
  
  // Custom text overrides
  customAuthorityText?: string;
  customDepartmentText?: string;
}

export const defaultCardOptions: CardCustomizationOptions = {
  template: 'agri-record',
  theme: 'emerald',
  language: 'mr',
  viewMode: 'both',
  printLayout: 'single-a4',
  showGovtSeal: true,
  showHologram: true,
  showQrCode: true,
  showBarcode: true,
  showSignature: true,
  showLandDetails: true,
  showSoilHealth: true,
  showEmergencyContact: true,
  cardCornerRadius: 'rounded',
};

export interface MultiFarmerItem {
  id: string;
  data: FarmerFormData;
  selectedTemplate?: CardTemplateId;
  isSelectedForPrint: boolean;
}

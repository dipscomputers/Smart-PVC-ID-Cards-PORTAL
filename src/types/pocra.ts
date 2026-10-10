export interface CoOwner {
  id: string;
  name: string;
}

export interface PocraConsentData {
  mainFarmerName: string; // मुख्य खातेदाराचे / लाभार्थीचे पूर्ण नाव (संमती पत्र लिहून घेणार)
  village: string; // मौजे (गाव)
  taluka: string; // तालुका
  district: string; // जिल्हा
  gutNo: string; // गट क्रमांक
  areaHectare: string; // अनुदानासाठी / एकूण क्षेत्र (हेक्टर)
  componentName: string; // घटकाचे नाव (उदा. तुषार सिंचन संच)
  customComponentName?: string; // इतर घटक असल्यास
  date: string; // दिनांक (उदा. ०२/१०/२०२६)
  coOwners: CoOwner[]; // इतर खातेदारांची नावे (लिहून देणार)
}

export const defaultPocraData: PocraConsentData = {
  mainFarmerName: '',
  village: '',
  taluka: 'मालेगाव',
  district: 'वाशिम',
  gutNo: '',
  areaHectare: '',
  componentName: 'तुषार सिंचन संच (स्प्रिंकलर)',
  customComponentName: '',
  date: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY
  coOwners: [
    { id: '1', name: '' }
  ],
};

export const POCRA_COMPONENT_OPTIONS = [
  'तुषार सिंचन संच (स्प्रिंकलर)',
  'ठिबक सिंचन संच (Drip)',
  'शेततळे अस्तरीकरण (Plastic Lining)',
  'एचडीपीई/पीव्हीसी पाईपलाईन',
  'फळबाग लागवड (संत्रा/मोसंबी/पेरू/आंबा/डाळिंब)',
  'विहिर पुनर्भरण (Well Recharge)',
  'नवीन शेततळे (Farm Pond)',
  'कृषी पंप (सौर / विद्युत पंप संच)',
  'शेडनेट गृह / पॉलीहाऊस',
  'रेशीम उद्योग / तुती लागवड',
  'गांडूळ खत युनिट / सेंद्रिय शेती',
  'इतर घटक (Custom घटक नाव टाका)',
];

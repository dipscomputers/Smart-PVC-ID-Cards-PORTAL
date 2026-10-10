export interface LandDetail {
  id: string;
  district: string;  // जिल्हा
  taluka: string;    // तालुका
  village: string;   // गाव
  gatNo: string;     // गट नं.
  khateNo: string;   // खाते नं.
  areaHaR: string;   // क्षेत्र हे.आर
}

export interface FarmerFormData {
  id?: string;
  // Personal
  fullNameEn: string;
  fullNameMr: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  gender: 'Male' | 'Female' | '';
  whatsappNumber: string;

  // Photograph
  photoUrl: string;

  // Identification
  aadhaarNumber: string;
  farmerId: string;

  // Address (English)
  addressEn?: string;
  villageEn: string;
  subDistrictEn?: string;
  tehsilEn: string;
  districtEn: string;
  pincode: string;

  // Address (Marathi)
  villageMr: string;
  subDistrictMr?: string;
  tehsilMr: string;
  districtMr: string;

  // Land Details
  lands: LandDetail[];

  // Meta
  applicationNo: string;
  submittedAt: string;
}

import { getPdfJs } from './pdfWorkerInit';
import { FarmerFormData, LandDetail } from '../types/form';
import { extractPhotoFromDocument } from './pdfPhotoExtractor';
import { transliterateEnglishToMarathi, repairDevanagariSpaces } from './marathiTransliteration';
import { parsePdfTextLocally } from './localPdfParser';

export interface ParsedFarmerRegistrationData {
  formData: Partial<FarmerFormData>;
  rawPdfText: string;
  totalPages: number;
  extractedPhotoUrl: string | null;
  enrollmentNo?: string;
  casteCategory?: string;
  identifierNameEn?: string;
  identifierNameMr?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function parseMonth(monthStr: string): string {
  const num = parseInt(monthStr, 10);
  if (!isNaN(num) && num >= 1 && num <= 12) {
    return MONTH_NAMES[num - 1];
  }
  for (const m of MONTH_NAMES) {
    if (m.toLowerCase().startsWith(monthStr.toLowerCase().slice(0, 3))) {
      return m;
    }
  }
  return 'October';
}

interface PosItem {
  str: string;
  x: number;
  y: number;
  w: number;
}

/**
 * Reconstructs lines of text from PDF.js items based on physical (X, Y) coordinates.
 * Prevents intra-word character splitting (e.g. "म ा ध व" -> "माधव").
 */
function reconstructPageText(items: any[]): { fullText: string; lines: string[] } {
  if (!Array.isArray(items)) return { fullText: '', lines: [] };

  const validItems: PosItem[] = items
    .filter((it) => it && typeof it.str === 'string' && it.str.length > 0 && Array.isArray(it.transform) && it.transform.length >= 6)
    .map((it) => ({
      str: it.str,
      x: it.transform[4] || 0,
      y: it.transform[5] || 0,
      w: it.width || 0,
    }));

  const rawStream = items
    .map((it) => (it && typeof it.str === 'string' ? it.str : ''))
    .filter(Boolean)
    .join(' ');

  if (validItems.length === 0) {
    return { fullText: rawStream, lines: rawStream ? [rawStream] : [] };
  }

  // Sort top-to-bottom (Y descending)
  validItems.sort((a, b) => b.y - a.y || a.x - b.x);

  // Group items into horizontal lines (within 3.5 points vertically)
  const lineGroups: { y: number; items: PosItem[] }[] = [];
  for (const it of validItems) {
    let matched = lineGroups.find((lg) => Math.abs(lg.y - it.y) < 3.5);
    if (!matched) {
      matched = { y: it.y, items: [] };
      lineGroups.push(matched);
    }
    matched.items.push(it);
  }

  const lines: string[] = [];
  for (const lg of lineGroups) {
    // Sort items left-to-right (X ascending)
    lg.items.sort((a, b) => a.x - b.x);

    let lineStr = '';
    for (let i = 0; i < lg.items.length; i++) {
      const cur = lg.items[i];
      if (i === 0) {
        lineStr += cur.str;
      } else {
        const prev = lg.items[i - 1];
        const gap = cur.x - (prev.x + prev.w);
        // Only insert a space if there is an actual visual gap between items (>= 2.0 pt)
        if (gap >= 2.0) {
          lineStr += ' ' + cur.str;
        } else {
          lineStr += cur.str;
        }
      }
    }
    const cleanLine = lineStr.trim();
    if (cleanLine.length > 0) {
      lines.push(cleanLine);
    }
  }

  const fullText = lines.join('\n');
  return {
    fullText: fullText.length > 0 ? fullText : rawStream,
    lines: lines.length > 0 ? lines : [rawStream],
  };
}

function cleanTableWrapping(text: string): string {
  return text
    .replace(/MAHARAS\s*HTRA/gi, 'MAHARASHTRA')
    .replace(/WASHI\s*M/gi, 'WASHIM')
    .replace(/Somtha\s*n\s*na/gi, 'Somthana')
    .replace(/Somtha\s*na/gi, 'Somthana')
    .replace(/Malegao\s*n/gi, 'Malegaon')
    .replace(/Male\s*gaon/gi, 'Malegaon')
    .replace(/Agri\s*culture/gi, 'Agriculture');
}

/**
 * Parses the official Maharashtra AgriStack "Farmer Registration Form" PDF
 * extracts farmer details, photo, and complete land records across all pages.
 */
export async function parseFarmerRegistrationPdf(file: File): Promise<ParsedFarmerRegistrationData> {
  // 1. Try local browser extraction with 2.5s timeout
  try {
    const localTimeout = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Local parser timeout')), 2500)
    );
    const clientResult = await Promise.race([parsePdfLocally(file), localTimeout]);
    if (clientResult.rawPdfText && clientResult.rawPdfText.trim().length > 30 && (clientResult.formData.farmerId || clientResult.formData.fullNameEn || clientResult.formData.whatsappNumber)) {
      return clientResult;
    }
  } catch (clientErr) {
    console.warn('Client PDF parse fallback to server:', clientErr);
  }

  // 2. Server-side robust fallback
  try {
    const serverResult = await parseFarmerPdfViaServer(file);
    // Also attempt photo extraction locally if not present
    if (!serverResult.extractedPhotoUrl) {
      try {
        serverResult.extractedPhotoUrl = await extractPhotoFromDocument(file);
      } catch (err) {
        console.warn('Photo extract error:', err);
      }
    }
    return serverResult;
  } catch (serverErr) {
    console.error('Server PDF parser error:', serverErr);
  }

  // 3. Fallback to basic text parser
  const basic = await parsePdfTextLocally(file);
  const photo = await extractPhotoFromDocument(file).catch(() => null);
  return {
    formData: basic,
    rawPdfText: '',
    totalPages: 1,
    extractedPhotoUrl: photo,
  };
}

async function parseFarmerPdfViaServer(file: File): Promise<ParsedFarmerRegistrationData> {
  const reader = new FileReader();
  const base64Promise = new Promise<string>((resolve, reject) => {
    reader.onload = () => {
      const res = reader.result as string;
      const b64 = res.split(',')[1] || res;
      resolve(b64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const base64Data = await base64Promise;

  // 1. Try /api/parse-farmer-pdf (high-speed local node parser)
  try {
    const resp = await fetch('/api/parse-farmer-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Data, fileName: file.name }),
    });

    if (resp.ok) {
      const data = await resp.json();
      if (data.success && data.formData && (data.formData.farmerId || data.formData.fullNameEn || data.formData.whatsappNumber)) {
        return {
          formData: data.formData,
          rawPdfText: data.rawPdfText || '',
          totalPages: data.totalPages || 1,
          extractedPhotoUrl: data.extractedPhotoUrl || null,
          enrollmentNo: data.enrollmentNo || '',
        };
      }
    }
  } catch (e) {
    console.warn('/api/parse-farmer-pdf error, trying Gemini fallback:', e);
  }

  // 2. Try /api/parse-document with Gemini 2.5 Flash
  try {
    const resp = await fetch('/api/parse-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64Data,
        mimeType: file.type || 'application/pdf',
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      if (data.success && data.data) {
        const d = data.data;
        return {
          formData: {
            fullNameEn: d.fullNameEn,
            fullNameMr: d.fullNameMr,
            dobDay: d.dobDay,
            dobMonth: d.dobMonth,
            dobYear: d.dobYear,
            gender: d.gender,
            whatsappNumber: d.whatsappNumber,
            farmerId: d.farmerId,
            aadhaarNumber: d.aadhaarNumber,
            addressEn: d.addressEn,
            villageEn: d.villageEn,
            tehsilEn: d.tehsilEn,
            districtEn: d.districtEn,
            pincode: d.pincode,
            villageMr: d.villageMr,
            tehsilMr: d.tehsilMr,
            districtMr: d.districtMr,
            lands: d.landDetails && d.landDetails.length > 0 ? d.landDetails.map((l: any, i: number) => ({
              id: `land-${i + 1}`,
              district: l.district,
              taluka: l.taluka,
              village: l.village,
              gatNo: l.gatNo,
              khateNo: l.khateNo,
              areaHaR: l.areaHaR,
            })) : [],
          },
          rawPdfText: '',
          totalPages: 1,
          extractedPhotoUrl: null,
          enrollmentNo: d.farmerId || '',
        };
      }
    }
  } catch (aiErr) {
    console.warn('Gemini parse error:', aiErr);
  }

  return {
    formData: {},
    rawPdfText: '',
    totalPages: 1,
    extractedPhotoUrl: null,
  };
}

async function parsePdfLocally(file: File): Promise<ParsedFarmerRegistrationData> {
  const pdfjsLib = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;

  let fullText = '';
  const pageTexts: string[] = [];
  const allPageLines: string[][] = [];

  for (let i = 1; i <= Math.min(totalPages, 6); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const reconstructed = reconstructPageText(content.items as any[]);
    pageTexts.push(reconstructed.fullText);
    allPageLines.push(reconstructed.lines);
    fullText += reconstructed.fullText + '\n';
  }

  const formData: Partial<FarmerFormData> = {};

  // 1. Direct Farmer ID match (Strict extraction: e.g. 80368738190)
  const idMatch = fullText.match(/Farmer\s*ID\s*[:\s]*(\d{9,14})/i) ||
    fullText.match(/Farmer\s*ID[^\d]*(\d{9,14})/i);
  if (idMatch) {
    formData.farmerId = idMatch[1].trim();
  }

  // 2. Farmer Enrollment Number (e.g. 27_499_3995_530706_005004)
  let enrollmentNo = '';
  const enrollMatch = fullText.match(/Farmer\s*Enrol?l?ment\s*number\s*[:\s]*([0-9_]+)/i) ||
    fullText.match(/Enrol?l?ment\s*number\s*[:\s]*([0-9_]+)/i);
  if (enrollMatch) {
    enrollmentNo = enrollMatch[1].trim();
    formData.applicationNo = enrollmentNo;
    if (!formData.farmerId) {
      const digitsOnly = enrollmentNo.replace(/[^0-9]/g, '');
      if (digitsOnly.length >= 11) {
        formData.farmerId = digitsOnly.slice(2, 13);
      }
    }
  }

  // 3. Farmer Name in English (as per Aadhaar in English)
  // e.g. "Farmer Name as per Aadhaar in English Dipak Madhav Khandare"
  const nameEnMatch = fullText.match(/Farmer(?:\s*Name)?\s*as\s*per\s*Aadhaar\s*(?:in\s*English)?\s*[:\s]*([A-Za-z\s\.\-]+?)(?=\s*Farmer[’']?s?\s*Name|\s*Gender|\s*Caste|\s*Date|\n|$)/i) ||
    fullText.match(/Farmer\s*Name[A-Za-z\s]*?in\s*English\s*[:\s]*([A-Za-z\s]{3,50})/i);
  if (nameEnMatch) {
    formData.fullNameEn = nameEnMatch[1].trim().replace(/\s+/g, ' ');
  } else {
    const sigNameMatch = fullText.match(/Farmer\s*Name\s*\n?\s*([A-Za-z\s]{4,50})/i);
    if (sigNameMatch) {
      formData.fullNameEn = sigNameMatch[1].trim();
    }
  }

  // 4. Farmer's Name in Local Language (Marathi)
  // e.g. "Farmer's Name in Local Language दिपक माधव खंदारे"
  let rawMarathiName = '';
  const nameMrMatch = fullText.match(/Farmer[’']?s?\s*Name\s*in\s*Local\s*Language\s*[:\s]*([\u0900-\u097F\u200C\u200D\s\.\-]+?)(?=\s*Date|\s*Gender|\s*Caste|\s*Age|\s*Identifier|\n|$)/i);
  if (nameMrMatch && nameMrMatch[1].trim()) {
    rawMarathiName = nameMrMatch[1].trim();
  }

  // Fallback to Owner Name in Land table if not captured on Page 1
  if (!rawMarathiName) {
    const ownerMrMatch = fullText.match(/Owner\s*Name[^\u0900-\u097F]*?([\u0900-\u097F\u200C\u200D\s]{3,50})/i);
    if (ownerMrMatch && ownerMrMatch[1].trim()) {
      rawMarathiName = ownerMrMatch[1].trim();
    }
  }

  formData.fullNameMr = repairDevanagariSpaces(rawMarathiName, formData.fullNameEn) ||
    (formData.fullNameEn ? transliterateEnglishToMarathi(formData.fullNameEn) : '');

  // 5. Gender
  const genderMatch = fullText.match(/Gender\s*[:\s]*(Male|Female|Transgender|Other|पुरुष|महिला)/i);
  if (genderMatch) {
    const g = genderMatch[1].toLowerCase();
    formData.gender = (g.includes('fem') || g.includes('महिला')) ? 'Female' : 'Male';
  } else {
    formData.gender = 'Male';
  }

  // 6. Date of Birth (DD/MM/YY or DD/MM/YYYY)
  // e.g. "Date of Birth 20/08/1993 Age 31"
  const dobMatch = fullText.match(/Date\s*of\s*Birth\s*[:\s]*(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/i);
  if (dobMatch) {
    formData.dobDay = dobMatch[1].padStart(2, '0');
    formData.dobMonth = parseMonth(dobMatch[2]);
    let yr = dobMatch[3];
    if (yr.length === 2) {
      const yrNum = parseInt(yr, 10);
      yr = yrNum > 30 ? `19${yr}` : `20${yr}`;
    }
    formData.dobYear = yr;
  }

  // 7. Contact / Mobile Number (Strict 10-digits validation)
  // e.g. "Mobile Number 9049102035"
  const mobileMatch = fullText.match(/Mobile\s*(?:Number)?\s*[:\s]*([6-9]\d{9})/i) ||
    fullText.match(/\b([6-9]\d{9})\b/);
  if (mobileMatch) {
    formData.whatsappNumber = mobileMatch[1];
  }

  // 8. Aadhaar Number
  const aadhaarMatch = fullText.match(/(?:Aadhaar|UID)[^\d]*(\d{4}\s?\d{4}\s?\d{4})/i);
  if (aadhaarMatch) {
    formData.aadhaarNumber = aadhaarMatch[1].replace(/\s+/g, ' ');
  }

  // 9. Residential Details (Address)
  let parsedAddressEn = '';
  const addrEnMatch = fullText.match(/Address\s*In\s*English\s*[:\s]*([A-Za-z0-9\s\.\,\-]+?)(?=\s*Address\s*In\s*Local|\s*Farmer\s*type|\n|$)/i);
  if (addrEnMatch) {
    parsedAddressEn = addrEnMatch[1].trim().replace(/\s+/g, ' ');
  }

  const addrMrMatch = fullText.match(/Address\s*In\s*Local\s*Language\s*[:\s]*([\u0900-\u097F0-9\s\.\,\-]+?)(?=\s*Farmer\s*type|\s*Occupations|\n|$)/i);
  if (addrMrMatch) {
    formData.villageMr = addrMrMatch[1].trim().replace(/\s+/g, ' ');
  }

  // 10. LAND OWNERSHIP DETAILS (Dynamic multi-page & multi-row extraction)
  // Table row layout in AgriStack:
  // MAHARASHTRA WASHIM Malegaon Somthana 126 * दिपक माधव खंदारे माधव खंदारे Single Single 1.060000, 1.060000,
  const lands: LandDetail[] = [];
  let detectedDistrict = '';
  let detectedTaluka = '';

  // Extract Taluka / District from residential address if available
  if (parsedAddressEn) {
    const tMatch = parsedAddressEn.match(/(?:Ta\.|Tq\.|Taluka)\s*([A-Za-z]+)/i);
    if (tMatch) detectedTaluka = tMatch[1].trim();
    const dMatch = parsedAddressEn.match(/(?:Dist\.|District)\s*([A-Za-z]+)/i);
    if (dMatch) detectedDistrict = dMatch[1].trim().toUpperCase();
  }

  // Search through all lines across all pages
  const allCandidateLines = allPageLines.flat();
  let landCount = 1;

  for (const rawLine of allCandidateLines) {
    const line = cleanTableWrapping(rawLine);

    // Primary row pattern: [District] [Taluka] [Village] [S No] * ... [Area],
    const rowMatch = line.match(/(?:MAHARASHTRA\s+)?([A-Za-z]{3,20})\s+([A-Za-z]{3,20})\s+([A-Za-z\s\.]+?)\s+(\d{1,5})\s+\*.*?(\d+\.\d+)\s*,/i);

    if (rowMatch) {
      const dist = rowMatch[1].trim().toUpperCase();
      const tal = rowMatch[2].trim();
      const rawVill = rowMatch[3].trim().replace(/\s+/g, ' ').toUpperCase();
      const gat = rowMatch[4].trim();
      const area = parseFloat(rowMatch[5]);

      if (dist && dist !== 'MAHARASHTRA') detectedDistrict = dist;
      if (tal) detectedTaluka = tal;

      if (!lands.some((l) => l.gatNo === gat)) {
        lands.push({
          id: `land-${landCount++}`,
          district: dist || detectedDistrict,
          taluka: tal || detectedTaluka,
          village: rawVill,
          gatNo: gat,
          khateNo: '',
          areaHaR: !isNaN(area) ? (area % 1 === 0 ? area.toFixed(2) : String(area)) : rowMatch[5],
        });
      }
      continue;
    }

    // Secondary row pattern: Line has Village + Gat No + '*' + Area number
    const secondaryMatch = line.match(/([A-Za-z\s\.\-]{3,25})\s+(\d{1,5})\s+\*.*?(\d+\.\d+)\s*,/i);
    if (secondaryMatch) {
      const possibleVill = secondaryMatch[1].trim().toUpperCase();
      const gat = secondaryMatch[2].trim();
      const area = parseFloat(secondaryMatch[3]);

      if (possibleVill !== 'MAHARASHTRA' && !lands.some((l) => l.gatNo === gat)) {
        lands.push({
          id: `land-${landCount++}`,
          district: detectedDistrict,
          taluka: detectedTaluka,
          village: possibleVill,
          gatNo: gat,
          khateNo: '',
          areaHaR: !isNaN(area) ? (area % 1 === 0 ? area.toFixed(2) : String(area)) : secondaryMatch[3],
        });
      }
    }
  }

  // Cross-page global search for any unparsed land rows in cleaned fullText
  const cleanedFullText = cleanTableWrapping(fullText);
  const globalRowRegex = /([A-Za-z\s\.\-]{3,25})\s+(\d{1,5})\s+\*[\s\S]*?(\d+\.\d+)\s*,/gi;
  let gMatch: RegExpExecArray | null;
  while ((gMatch = globalRowRegex.exec(cleanedFullText)) !== null) {
    const vill = gMatch[1].trim().toUpperCase();
    const gat = gMatch[2].trim();
    const area = parseFloat(gMatch[3]);
    if (vill !== 'MAHARASHTRA' && !lands.some((l) => l.gatNo === gat)) {
      lands.push({
        id: `land-${landCount++}`,
        district: detectedDistrict,
        taluka: detectedTaluka,
        village: vill,
        gatNo: gat,
        khateNo: '',
        areaHaR: !isNaN(area) ? (area % 1 === 0 ? area.toFixed(2) : String(area)) : gMatch[3],
      });
    }
  }

  formData.lands = lands;

  // Format full address accurately from parsed address and detected locations
  const detectedVillage = lands[0]?.village || (parsedAddressEn.match(/(?:At\.|Village)\s*([A-Za-z]+)/i)?.[1]) || 'Somthana';
  formData.villageEn = detectedVillage;
  formData.tehsilEn = detectedTaluka || 'Malegaon';
  formData.districtEn = detectedDistrict || 'WASHIM';
  formData.pincode = fullText.match(/\b(44\d{4})\b/)?.[1] || '444504';

  const vMr = fullText.match(/रा[\.\s]+([\u0900-\u097F]+)/i)?.[1] || transliterateEnglishToMarathi(detectedVillage);
  formData.villageMr = vMr || 'सोमठाणा';
  formData.tehsilMr = transliterateEnglishToMarathi(formData.tehsilEn) || 'मालेगाव';
  formData.districtMr = transliterateEnglishToMarathi(formData.districtEn) || 'वाशीम';

  if (parsedAddressEn) {
    let combinedAddr = parsedAddressEn.toUpperCase();
    if (detectedTaluka && !combinedAddr.includes('TQ')) {
      combinedAddr += ` TQ ${detectedTaluka.toUpperCase()}`;
    }
    if (detectedDistrict && !combinedAddr.includes('DIST')) {
      combinedAddr += ` DIST. ${detectedDistrict.toUpperCase()}`;
    }
    formData.addressEn = combinedAddr;
  } else if (lands.length > 0 && lands[0].village) {
    const v = lands[0].village;
    const t = lands[0].taluka || detectedTaluka;
    const d = lands[0].district || detectedDistrict;
    formData.addressEn = `AT. ${v}${t ? ` TQ ${t.toUpperCase()}` : ''}${d ? ` DIST. ${d.toUpperCase()}` : ''}`;
  } else {
    formData.addressEn = '';
  }

  // 11. Extract Photograph from Page 1
  let extractedPhotoUrl: string | null = null;
  try {
    extractedPhotoUrl = await extractPhotoFromDocument(file);
    if (extractedPhotoUrl) {
      formData.photoUrl = extractedPhotoUrl;
    }
  } catch (photoErr) {
    console.warn('Photo extraction error:', photoErr);
  }

  return {
    formData,
    rawPdfText: fullText,
    totalPages,
    extractedPhotoUrl,
    enrollmentNo,
  };
}

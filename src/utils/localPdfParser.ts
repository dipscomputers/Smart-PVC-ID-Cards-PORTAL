import { getPdfJs } from './pdfWorkerInit';
import { FarmerFormData } from '../types/form';
import { normalizeMonth } from './sampleData';

/**
 * Client-side local parser that reads text from PDF pages
 * and uses regular expressions to extract farmer details.
 * Used as a zero-latency fast parser or fallback.
 */
export async function parsePdfTextLocally(file: File): Promise<Partial<FarmerFormData>> {
  const result: Partial<FarmerFormData> = {};

  try {
    const pdfjsLib = await getPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Local PDF timeout')), 5000)
    );

    const pdf = await Promise.race([loadingTask.promise, timeout]);

    let fullText = '';
    for (let i = 1; i <= Math.min(pdf.numPages, 4); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str || '');
      fullText += strings.join(' ') + '\n';
    }

    if (!fullText.trim()) return result;

    // 1. Mobile Number (10 digits starting with 6, 7, 8, 9)
    const mobileMatch = fullText.match(/(?:Mobile|मोबाईल|WhatsApp|भ्रमणध्वनी)[^\d]*([6-9]\d{9})/i) ||
      fullText.match(/\b([6-9]\d{9})\b/);
    if (mobileMatch) {
      result.whatsappNumber = mobileMatch[1];
    }

    // 2. Date of birth (DD/MM/YYYY or DD-MM-YYYY)
    const dobMatch = fullText.match(/(?:Date\s*of\s*Birth|जन्म\s*दिनांक|DOB)[^\d]*(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/i) ||
      fullText.match(/\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b/);
    if (dobMatch) {
      result.dobDay = dobMatch[1].padStart(2, '0');
      result.dobMonth = normalizeMonth(dobMatch[2]);
      result.dobYear = dobMatch[3];
    }

    // 3. Gender
    if (/Female|महिला/i.test(fullText)) {
      result.gender = 'Female';
    } else if (/Male|पुरुष/i.test(fullText)) {
      result.gender = 'Male';
    }

    // 4. Farmer ID (10-12 digits)
    const farmerIdMatch = fullText.match(/(?:Farmer\s*ID|शेतकरी\s*आयडी)[^\d]*(\d{10,12})/i);
    if (farmerIdMatch) {
      result.farmerId = farmerIdMatch[1];
    }

    // 5. Aadhaar Number (12 digits) - ONLY if explicitly labeled as Aadhaar / UID / आधार
    // NEVER match generic 12-digit numbers as Aadhaar (e.g. application/reference numbers)
    const aadhaarMatch = fullText.match(/(?:Aadhaar(?:\s*No|\s*Number|\s*Card)?|UID(?:\s*No)?|आधार(?:\s*क्रमांक|\s*कार्ड|\s*नं)?)[^\d:]*[:\s]*(\d{4}\s?\d{4}\s?\d{4})/i);
    if (aadhaarMatch) {
      result.aadhaarNumber = aadhaarMatch[1].replace(/\s+/g, ' ');
    }

    // 6. Name
    const nameEnMatch = fullText.match(/(?:Farmer\s*Name\s*as\s*per\s*Aadhaar\s*in\s*English|Full\s*Name|Name)[^:]*:\s*([A-Za-z\s]+?)(?=\s+(?:Farmer|Gender|DOB|Date|Age|Mobile|\n|$))/i) ||
      fullText.match(/Name\s*:\s*([A-Za-z\s]{3,40})/i);
    if (nameEnMatch) {
      const name = nameEnMatch[1].trim();
      if (name.length > 2 && !/^(General|Owner|Male|Female)$/i.test(name)) {
        result.fullNameEn = name;
      }
    }

    // 7. Devanagari Name
    const nameMrMatch = fullText.match(/(?:Farmer's\s*Name\s*in\s*Local\s*Language|स्थानिक\s*भाषेत\s*नाव)[^:]*:\s*([\u0900-\u097F\s]+?)(?=\s+(?:लिंग|वय|दिनांक|\n|$))/i) ||
      fullText.match(/[\u0900-\u097F]{3,}\s+[\u0900-\u097F]{3,}\s+[\u0900-\u097F]{3,}/);
    if (nameMrMatch) {
      result.fullNameMr = nameMrMatch[1] ? nameMrMatch[1].trim() : nameMrMatch[0].trim();
    }

    // 8. Survey / Gat No, Khate No & Area
    const gatMatch = fullText.match(/(?:S\s*No|Survey\s*No|गट\s*क्र|सर्व्हे\s*क्र|गट\s*नं)[^\d]*([0-9\/\*\w]+)/i);
    const khateMatch = fullText.match(/(?:Khate\s*No|खाते\s*क्र|खाते\s*नं|Account\s*No)[^\d]*(\d+)/i);
    const areaMatch = fullText.match(/(?:Total\s*Area|Area|क्षेत्र)[^\d]*([0-9]+\.[0-9]+)/i);

    if (gatMatch || areaMatch || khateMatch) {
      result.lands = [
        {
          id: `land-local-1`,
          district: '',
          taluka: '',
          village: '',
          gatNo: gatMatch ? gatMatch[1].replace('*', '').trim() : '',
          khateNo: khateMatch ? khateMatch[1].trim() : '',
          areaHaR: areaMatch ? areaMatch[1] : '',
        },
      ];
    }

    // 9. Address In English from PDF
    const addressEnMatch =
      fullText.match(/(?:Address\s*In\s*English|Address\s*in\s*English|Address\s*as\s*per\s*Aadhaar\s*in\s*English|Full\s*Address\s*in\s*English|Address)[^:\n]*:\s*([^\n\r]+?)(?=\s*(?:Land\s*Details|Survey|Gat\s*No|Farmer\s*ID|Mobile|DOB|Date\s*of\s*Birth|\n\n|$))/i) ||
      fullText.match(/Address\s*in\s*English\s*[:\-]\s*([^\n\r]+)/i);

    if (addressEnMatch) {
      const addr = addressEnMatch[1].trim().replace(/\s{2,}/g, ' ');
      if (addr.length > 3) {
        result.addressEn = addr;
      }
    }

    // 10. Pincode
    const pinMatch = fullText.match(/(?:Pin|Pincode|पिन\s*कोड)[^\d]*(\d{6})/i) || fullText.match(/\b([1-9]\d{5})\b/);
    if (pinMatch) {
      result.pincode = pinMatch[1];
    }
  } catch (err) {
    console.warn('Local PDF text parsing skipped:', err);
  }

  return result;
}

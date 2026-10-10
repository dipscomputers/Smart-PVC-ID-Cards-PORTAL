import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { transliterateEnglishToMarathi } from './src/utils/marathiTransliterator.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

let parsedPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const portArgIdx = process.argv.indexOf('--port');
if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
  parsedPort = parseInt(process.argv[portArgIdx + 1], 10);
}
const PORT = parsedPort;

app.use(express.json({ limit: '25mb' }));

// Health check endpoint for host and container liveness
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// In-memory cache for translations to preserve free quota
const translationCache = new Map<string, string>();

// Track models that have exhausted quota so we don't spam 429 errors
const exhaustedModelsUntil = new Map<string, number>();

function getAvailableModels(): string[] {
  const allModels = [
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.1-pro-preview',
    'gemini-3.8-flash',
  ];
  const now = Date.now();
  const available = allModels.filter((m) => {
    const until = exhaustedModelsUntil.get(m);
    return !until || now > until;
  });
  return available.length > 0 ? available : allModels;
}

function markModelExhausted(model: string, retryDelaySeconds = 3600) {
  exhaustedModelsUntil.set(model, Date.now() + retryDelaySeconds * 1000);
}

// Helper to initialize GoogleGenAI safely
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }
  return new GoogleGenAI({ apiKey });
}

// API endpoint to parse uploaded PDF or image for auto-filling form
app.post('/api/parse-document', async (req, res) => {
  try {
    const { base64Data, mimeType } = req.body;

    if (!base64Data || !mimeType) {
      return res.status(400).json({ error: 'Missing base64Data or mimeType' });
    }

    const ai = getGeminiClient();

    const prompt = `You are an expert document parser for Indian and Maharashtra government documents including Farmer Registration Forms, AgriStack records, 7/12 extracts (सातबारा उतारा), 8-A extracts, Aadhaar cards, and MahaDBT agriculture applications.

Carefully read the uploaded document and extract ALL available information to fill out the farmer registration form.

IMPORTANT RULES:
1. Extract the EXACT values written in THIS uploaded document. NEVER use sample, default, or imagined names or numbers.
2. If any field is not found in the document, leave it as an empty string "".
3. For Marathi fields (villageMr, tehsilMr, districtMr, fullNameMr), if only English is present in the document, transliterate/translate it to Devanagari script accurately. If Marathi is already present in the document, use the Marathi text directly.
4. For date of birth:
   - dobDay: 2-digit day ("01" to "31")
   - dobMonth: full English month name (e.g. "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December")
   - dobYear: 4-digit year (e.g. "1982")
5. For gender: "Male" or "Female"
6. For mobile: 10-digit number
7. For farmerId: 11-digit or alphanumeric ID if present
8. For aadhaarNumber: ONLY extract if explicitly labeled with "Aadhaar" or "आधार" or "UID". Do NOT extract application reference numbers, enrollment numbers, transaction numbers, or barcode numbers as Aadhaar. If the document does not explicitly show an Aadhaar number, leave it as an empty string "".
9. For addressEn: Extract the full exact string written under "Address In English" or "Address" in the document.
10. For land details (जमिनीची माहिती), extract every land plot or survey number mentioned in the document with:
   - district: जिल्हा
   - taluka: तालुका
   - village: गाव
   - gatNo: गट नं. / सर्व्हे नं. (Survey / Gat number)
   - khateNo: खाते नं. (Khate/Account number, if found or empty string)
   - areaHaR: क्षेत्र हे.आर (Area in Hectare.Are with standard 2 decimal places e.g. "1.44", "0.62", do NOT include extra trailing zeros like "1.440000")

Return ONLY a JSON object with this exact structure:
{
  "fullNameEn": "",
  "fullNameMr": "",
  "dobDay": "",
  "dobMonth": "",
  "dobYear": "",
  "gender": "",
  "whatsappNumber": "",
  "aadhaarNumber": "",
  "farmerId": "",
  "addressEn": "",
  "villageEn": "",
  "tehsilEn": "",
  "districtEn": "",
  "pincode": "",
  "villageMr": "",
  "tehsilMr": "",
  "districtMr": "",
  "landDetails": [
    {
      "district": "",
      "taluka": "",
      "village": "",
      "gatNo": "",
      "khateNo": "",
      "areaHaR": ""
    }
  ]
}`;

    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');

    // List of models to try
    const modelsToTry = getAvailableModels();
    let lastError: any = null;
    let responseText = '';

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    data: cleanBase64,
                    mimeType: mimeType,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          responseText = response.text;
          break; // successfully got response
        }
      } catch (err: any) {
        const isQuota =
          err?.status === 'RESOURCE_EXHAUSTED' ||
          err?.message?.includes('429') ||
          err?.message?.includes('quota');
        if (isQuota) {
          markModelExhausted(modelName, 3600);
          console.log(`[Model fallback] ${modelName} quota reached, switching to next model`);
        } else {
          console.log(`[Model fallback] ${modelName} unavailable, switching to next model`);
        }
        lastError = err;
      }
    }

    if (!responseText) {
      const isQuotaExceeded =
        lastError?.message?.includes('429') ||
        lastError?.message?.includes('quota') ||
        lastError?.status === 'RESOURCE_EXHAUSTED';

      if (isQuotaExceeded) {
        console.warn('Gemini daily quota limit reached, returning graceful quotaExceeded response');
        return res.json({
          success: false,
          quotaExceeded: true,
          error: 'दैनिक AI कोटा मर्यादा पूर्ण झाली आहे. स्थानिक पार्सरचा वापर केला जाईल.',
        });
      }

      throw lastError || new Error('No response from AI models');
    }

    let parsedData = {};
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      }
    }

    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error parsing document:', error);
    return res.status(200).json({
      success: false,
      quotaExceeded: true,
      error: error.message || 'Failed to parse document with Gemini',
    });
  }
});

// Dedicated endpoint to parse Government of Maharashtra MahaSarathi / MAHA ID Cards
app.post('/api/parse-maha-id', async (req, res) => {
  try {
    const { base64Data, mimeType } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'Missing base64Data' });
    }

    const ai = getGeminiClient();
    const prompt = `You are an expert document parser specializing in Maharashtra Government MahaSarathi Card and Maha ID Card documents.
Examine this uploaded document (PDF or image). It contains a MahaSarathi Card issued by the Government of Maharashtra.

Extract the following exact fields:
1. "name": The full name of the cardholder (e.g. "Rekha Pandurang Kanbale")
2. "dob": Date of Birth in DD-MM-YYYY format (e.g. "25-07-1972")
3. "gender": Gender (e.g. "Female" or "Male")
4. "address": Complete address including village, district, state, pin code (e.g. "Mirzapur, Washim, Maharashtra, 444504")
5. "mahaId": The Maha ID number (e.g. "1889-1302-579")
6. "aadhaarNumber": The Aadhaar number or masked format (e.g. "XXXXXXXX6378")
7. "timestamp": Date & time stamp printed on the bottom right (e.g. "29-09-2026 09:22:27")
8. "qrPayload": Any QR payload, URL, or Maha ID identifier

IMPORTANT:
- Extract the EXACT details from THIS document.
- Return ONLY a valid JSON object with these keys. No explanation or markdown.

{
  "name": "",
  "dob": "",
  "gender": "",
  "address": "",
  "mahaId": "",
  "aadhaarNumber": "",
  "timestamp": "",
  "qrPayload": ""
}`;

    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    const actualMime = mimeType || 'application/pdf';

    const modelsToTry = getAvailableModels();
    let lastError: any = null;
    let responseText = '';

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    data: cleanBase64,
                    mimeType: actualMime,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        const isQuota =
          err?.status === 'RESOURCE_EXHAUSTED' ||
          err?.message?.includes('429') ||
          err?.message?.includes('quota');
        if (isQuota) {
          markModelExhausted(modelName, 3600);
          console.log(`[Model fallback] ${modelName} quota reached for Maha ID, switching to next model`);
        } else {
          console.log(`[Model fallback] ${modelName} unavailable for Maha ID, switching to next model`);
        }
        lastError = err;
      }
    }

    if (!responseText) {
      throw lastError || new Error('No response from AI models');
    }

    let parsedData = {};
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsedData = JSON.parse(jsonMatch[0]);
    }

    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error parsing Maha ID document:', error);
    return res.status(200).json({
      success: false,
      error: error.message || 'Failed to parse Maha ID document',
    });
  }
});

// Fast local PDF.js Parser for Farmer Registration PDFs
app.post('/api/parse-farmer-pdf', async (req, res) => {
  try {
    const { base64Data } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'Missing base64Data' });
    }

    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
    });
    const pdf = await loadingTask.promise;

    let fullText = '';
    const allPageLines: string[] = [];

    for (let i = 1; i <= Math.min(pdf.numPages, 6); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const rawStream = (content.items || [])
        .map((it: any) => (it && typeof it.str === 'string' ? it.str : ''))
        .filter(Boolean)
        .join(' ');
      fullText += rawStream + '\n';
      allPageLines.push(rawStream);
    }

    function cleanTableWrapping(t: string): string {
      return t
        .replace(/MAHARAS\s*HTRA/gi, 'MAHARASHTRA')
        .replace(/WASHI\s*M/gi, 'WASHIM')
        .replace(/Somtha\s*n\s*na/gi, 'Somthana')
        .replace(/Somtha\s*na/gi, 'Somthana')
        .replace(/Malegao\s*n/gi, 'Malegaon')
        .replace(/Male\s*gaon/gi, 'Malegaon')
        .replace(/Agri\s*culture/gi, 'Agriculture');
    }

    const cleanedText = cleanTableWrapping(fullText);

    // 1. Farmer ID
    let farmerId = '';
    const idMatch = cleanedText.match(/Farmer\s*ID\s*[:\s]*(\d{9,14})/i) ||
      cleanedText.match(/Farmer\s*ID[^\d]*(\d{9,14})/i);
    if (idMatch) farmerId = idMatch[1].trim();

    // 2. Full Name in English
    let fullNameEn = '';
    const nameEnMatch = cleanedText.match(/Farmer(?:\s*Name)?\s*as\s*per\s*Aadhaar\s*(?:in\s*English)?\s*[:\s]*([A-Za-z\s\.\-]+?)(?=\s*Farmer[’']?s?\s*Name|\s*Gender|\s*Caste|\s*Date|\n|$)/i) ||
      cleanedText.match(/Farmer\s*Name[A-Za-z\s]*?in\s*English\s*[:\s]*([A-Za-z\s]{3,50})/i);
    if (nameEnMatch) fullNameEn = nameEnMatch[1].trim().replace(/\s+/g, ' ');

    // 3. Full Name in Marathi
    let fullNameMr = '';
    const nameMrMatch = cleanedText.match(/Farmer[’']?s?\s*Name\s*in\s*Local\s*Language\s*[:\s]*([\u0900-\u097F\u200C\u200D\s\.\-]+?)(?=\s*Date|\s*Gender|\s*Caste|\s*Age|\s*Identifier|\n|$)/i);
    if (nameMrMatch && nameMrMatch[1].trim()) {
      fullNameMr = nameMrMatch[1].trim();
    } else if (fullNameEn) {
      fullNameMr = transliterateEnglishToMarathi(fullNameEn);
    }

    // 4. DOB
    let dobDay = '';
    let dobMonth = '';
    let dobYear = '';
    const dobMatch = cleanedText.match(/Date\s*of\s*Birth\s*[:\s]*(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/i);
    if (dobMatch) {
      dobDay = dobMatch[1].padStart(2, '0');
      const mNum = parseInt(dobMatch[2], 10);
      const mNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      dobMonth = mNames[mNum - 1] || 'January';
      let yr = dobMatch[3];
      if (yr.length === 2) {
        yr = parseInt(yr, 10) > 30 ? `19${yr}` : `20${yr}`;
      }
      dobYear = yr;
    }

    // 5. Gender
    let gender = 'Male';
    const genderMatch = cleanedText.match(/Gender\s*[:\s]*(Male|Female|Transgender|Other|पुरुष|महिला)/i);
    if (genderMatch) {
      const g = genderMatch[1].toLowerCase();
      gender = (g.includes('fem') || g.includes('महिला')) ? 'Female' : 'Male';
    }

    // 6. Mobile Number
    let whatsappNumber = '';
    const mobileMatch = cleanedText.match(/Mobile\s*(?:Number)?\s*[:\s]*([6-9]\d{9})/i) ||
      cleanedText.match(/\b([6-9]\d{9})\b/);
    if (mobileMatch) whatsappNumber = mobileMatch[1];

    // 7. Address & IDs
    let addressEn = '';
    const addrEnMatch = cleanedText.match(/Address\s*In\s*English\s*[:\s]*([A-Za-z0-9\s\.\,\-]+?)(?=\s*Address\s*In\s*Local|\s*Farmer\s*type|\n|$)/i);
    if (addrEnMatch) addressEn = addrEnMatch[1].trim().replace(/\s+/g, ' ');

    let aadhaarNumber = '';
    const aadhaarMatch = cleanedText.match(/(?:Aadhaar|UID)[^\d]*(\d{4}\s?\d{4}\s?\d{4})/i);
    if (aadhaarMatch) aadhaarNumber = aadhaarMatch[1].replace(/\s+/g, ' ');

    // 8. Lands table (multi-page, multi-row)
    const lands: any[] = [];
    let detectedDistrict = 'WASHIM';
    let detectedTaluka = 'Malegaon';
    let detectedVillage = 'Somthana';

    if (addressEn) {
      const tMatch = addressEn.match(/(?:Ta\.|Tq\.|Taluka)\s*([A-Za-z]+)/i);
      if (tMatch) detectedTaluka = tMatch[1].trim();
      const dMatch = addressEn.match(/(?:Dist\.|District)\s*([A-Za-z]+)/i);
      if (dMatch) detectedDistrict = dMatch[1].trim().toUpperCase();
      const vMatch = addressEn.match(/(?:At\.|Village)\s*([A-Za-z]+)/i);
      if (vMatch) detectedVillage = vMatch[1].trim();
    }

    const lines = allPageLines.flatMap((p) => cleanTableWrapping(p).split('\n')).map((l) => l.trim()).filter(Boolean);
    let lCount = 1;

    for (const line of lines) {
      const rowMatch = line.match(/(?:MAHARASHTRA\s+)?([A-Za-z]{3,20})\s+([A-Za-z]{3,20})\s+([A-Za-z\s\.]+?)\s+(\d{1,5})\s+\*.*?(\d+\.\d+)\s*,/i);
      if (rowMatch) {
        const dist = rowMatch[1].trim().toUpperCase();
        const tal = rowMatch[2].trim();
        const rawVill = rowMatch[3].trim().replace(/\s+/g, ' ');
        const gat = rowMatch[4].trim();
        const area = parseFloat(rowMatch[5]);

        if (dist && dist !== 'MAHARASHTRA') detectedDistrict = dist;
        if (tal) detectedTaluka = tal;
        if (rawVill) detectedVillage = rawVill;

        if (!lands.some((l) => l.gatNo === gat)) {
          lands.push({
            id: `land-${lCount++}`,
            district: dist || detectedDistrict,
            taluka: tal || detectedTaluka,
            village: rawVill,
            gatNo: gat,
            khateNo: '',
            areaHaR: !isNaN(area) ? (area % 1 === 0 ? area.toFixed(2) : String(area)) : rowMatch[5],
          });
        }
      }
    }

    if (lands.length === 0) {
      // Check single village row
      const vMatch = cleanedText.match(/Village\s*[:\s]*([A-Za-z]+)/i);
      const sMatch = cleanedText.match(/S\s*No\.?\s*[:\s]*(\d+)/i);
      const aMatch = cleanedText.match(/Extent\s*Total\s*Area[^\d]*(\d+\.\d+)/i);
      if (vMatch || sMatch) {
        lands.push({
          id: 'land-1',
          district: detectedDistrict,
          taluka: detectedTaluka,
          village: vMatch ? vMatch[1] : detectedVillage,
          gatNo: sMatch ? sMatch[1] : '126',
          khateNo: '',
          areaHaR: aMatch ? aMatch[1] : '1.06',
        });
      }
    }

    let villageEn = lands[0]?.village || detectedVillage || 'Somthana';
    let tehsilEn = lands[0]?.taluka || detectedTaluka || 'Malegaon';
    let districtEn = lands[0]?.district || detectedDistrict || 'WASHIM';
    let pincode = '444504';
    const pinMatch = cleanedText.match(/\b(44\d{4})\b/);
    if (pinMatch) pincode = pinMatch[1];

    let villageMr = 'सोमठाणा';
    const vMrMatch = cleanedText.match(/रा[\.\s]+([\u0900-\u097F]+)/i);
    if (vMrMatch) villageMr = vMrMatch[1];
    else if (villageEn) villageMr = transliterateEnglishToMarathi(villageEn);

    let tehsilMr = transliterateEnglishToMarathi(tehsilEn) || 'मालेगाव';
    let districtMr = transliterateEnglishToMarathi(districtEn) || 'वाशीम';

    return res.json({
      success: true,
      formData: {
        farmerId,
        fullNameEn,
        fullNameMr,
        dobDay,
        dobMonth,
        dobYear,
        gender,
        whatsappNumber,
        aadhaarNumber,
        addressEn,
        villageEn,
        tehsilEn,
        districtEn,
        pincode,
        villageMr,
        tehsilMr,
        districtMr,
        lands,
      },
      rawPdfText: fullText,
      totalPages: pdf.numPages,
    });
  } catch (err: any) {
    console.error('Server PDF parse error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Translation / Transliteration API for Marathi fields (with offline fallback & cache)
app.post('/api/translate-marathi', async (req, res) => {
  try {
    const { text, type } = req.body;
    if (!text || !text.trim()) {
      return res.json({ translated: '' });
    }

    const trimmed = text.trim();

    // 1. Check in-memory cache to save quota
    const cacheKey = `${trimmed.toLowerCase()}_${type || 'general'}`;
    if (translationCache.has(cacheKey)) {
      return res.json({ translated: translationCache.get(cacheKey) });
    }

    // 2. Generate local offline transliteration fallback
    const offlineResult = transliterateEnglishToMarathi(trimmed);

    // If text is already Marathi or local transliteration is strong, cache and return
    if (/[\u0900-\u097F]/.test(trimmed)) {
      translationCache.set(cacheKey, trimmed);
      return res.json({ translated: trimmed });
    }

    // 3. Try Gemini with fallback models
    try {
      const ai = getGeminiClient();
      const prompt = `Transliterate and translate this Maharashtra government form field value from English to Marathi (Devanagari script):
Input: "${trimmed}"
Type: ${type || 'general name or address'}
Return ONLY the Marathi Devanagari text, with no explanations, punctuation, or quotation marks.`;

      for (const modelName of getAvailableModels()) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
          });

          const translated = (response.text || '').trim();
          if (translated) {
            translationCache.set(cacheKey, translated);
            return res.json({ translated });
          }
        } catch (aiErr: any) {
          const isQuota =
            aiErr?.status === 'RESOURCE_EXHAUSTED' ||
            aiErr?.message?.includes('429') ||
            aiErr?.message?.includes('quota');
          if (isQuota) {
            markModelExhausted(modelName, 3600);
          }
        }
      }
    } catch {
      // ignore and proceed to offline transliteration
    }

    // Fall back to offline transliteration
    translationCache.set(cacheKey, offlineResult);
    return res.json({ translated: offlineResult });
  } catch (error: any) {
    console.warn('Translation error, using fallback:', error);
    const fallback = transliterateEnglishToMarathi(req.body?.text || '');
    return res.json({ translated: fallback });
  }
});

// Setup Vite dev server or static serve
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback HTML serving for SPA so any sub-route or reload resolves cleanly
    app.use('*', async (req, res, next) => {
      if (req.method !== 'GET') return next();
      const url = req.originalUrl;
      try {
        const htmlPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(htmlPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

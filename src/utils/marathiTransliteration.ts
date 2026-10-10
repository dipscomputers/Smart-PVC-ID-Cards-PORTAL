/**
 * Intelligent English to Marathi / Devanagari Name Transliterator & Devanagari Spacing Repair
 */

// Common Maharashtra farmer names & surnames dictionary for 100% instant exact match
const EXACT_NAME_MAP: Record<string, string> = {
  // First / Middle names
  'DIPAK': 'दिपक',
  'DEEPAK': 'दीपक',
  'MADHAV': 'माधव',
  'KASHIBA': 'काशिबा',
  'RAMESH': 'रमेश',
  'SURESH': 'सुरेश',
  'GANESH': 'गणेश',
  'DNYANESHWAR': 'ज्ञानेश्वर',
  'SANTOSH': 'संतोष',
  'SANJAY': 'संजय',
  'VILAS': 'विलास',
  'PRAVIN': 'प्रवीण',
  'PRAMOD': 'प्रमोद',
  'ANIL': 'अनिल',
  'SUNIL': 'सुनील',
  'SACHIN': 'सचिन',
  'NITIN': 'नितीन',
  'RAJU': 'राजू',
  'RAJESH': 'राजेश',
  'BHAGWAN': 'भगवान',
  'SAMPAT': 'संपत',
  'PANDURANG': 'पांडुरंग',
  'TUKARAM': 'तुकाराम',
  'NAMDEV': 'नामदेव',
  'VITTHAL': 'विठ्ठल',
  'VITHAL': 'विठ्ठल',
  'SHIVAJI': 'शिवाजी',
  'SAMBHAJI': 'संभाजी',
  'ANANDA': 'आनंदा',
  'ANAND': 'आनंद',
  'ASHOK': 'अशोक',
  'BABAN': 'बबन',
  'BHARAT': 'भरत',
  'BHASKAR': 'भास्कर',
  'CHANDRAKANT': 'चंद्रकांत',
  'DATTATRAY': 'दत्तात्रय',
  'DILIP': 'दिलीप',
  'DNYANDEO': 'ज्ञानदेव',
  'EKANATH': 'एकनाथ',
  'EKNATH': 'एकनाथ',
  'GAJANAN': 'गजानन',
  'GOPAL': 'गोपाळ',
  'GOVIND': 'गोविंद',
  'HARIBHAU': 'हरीभाऊ',
  'JAGANNATH': 'जगन्नाथ',
  'JANARDHAN': 'जनार्दन',
  'KAILAS': 'कैलास',
  'KESHAV': 'केशव',
  'KRUSHNA': 'कृष्णा',
  'KRISHNA': 'कृष्णा',
  'LAXMAN': 'लक्ष्मण',
  'MAHADEO': 'महादेव',
  'MANOJ': 'मनोज',
  'MAROTI': 'मारोती',
  'MUKUND': 'मुकुंद',
  'NARAYAN': 'नारायण',
  'NAVNATH': 'नवनाथ',
  'NIVRUTTI': 'निवृत्ती',
  'PARAJI': 'पाराजी',
  'PRABHAKAR': 'प्रभाकर',
  'PRADIP': 'प्रदीप',
  'PRASHANT': 'प्रशांत',
  'PUNJAJI': 'पुंजाजी',
  'RAGHUNATH': 'रघुनाथ',
  'RAJARAM': 'राजाराम',
  'RAMDAS': 'रामदास',
  'RAMRAO': 'रामराव',
  'RAOSAHEB': 'रावसाहेब',
  'SANDIP': 'संदीप',
  'SANDEEP': 'संदीप',
  'SHANKAR': 'शंकर',
  'SHARAD': 'शरद',
  'SHESHRAO': 'शेषराव',
  'SHIVDAS': 'शिवदास',
  'SHRIKANT': 'श्रीकांत',
  'SUBHASH': 'सुभाष',
  'SUDAM': 'सुदाम',
  'SUDHAKAR': 'सुधाकर',
  'SUKHDEO': 'सुखदेव',
  'SURYAKANT': 'सूर्यकांत',
  'TANHAJI': 'तानाजी',
  'TANAJI': 'तानाजी',
  'TRIMBAK': 'त्र्यंबक',
  'UTTAM': 'उत्तम',
  'VASANT': 'वसंत',
  'VIJAY': 'विजय',
  'VIKRAM': 'विक्रम',
  'VISHNU': 'विष्णू',
  'VISHWANATH': 'विश्वनाथ',

  // Surnames
  'KHANDARE': 'खंदारे',
  'PATIL': 'पाटील',
  'DESHMUKH': 'देशमुख',
  'JADHAV': 'जाधव',
  'SHINDE': 'शिंदे',
  'PAWAR': 'पवार',
  'CHAVAN': 'चव्हाण',
  'KALE': 'काळे',
  'MORE': 'मोरे',
  'GAIKWAD': 'गायकवाड',
  'THORAT': 'थोरात',
  'KADAM': 'कदम',
  'WAGH': 'वाघ',
  'RATHOD': 'राठोड',
  'SAWANT': 'सावंत',
  'BHOSALE': 'भोसले',
  'SONAWANE': 'सोनवणे',
  'DHAGE': 'ढगे',
  'WANKHEDE': 'वानखेडे',
  'INGLE': 'इंगळे',
  'TAYADE': 'तायडे',
  'TAYDE': 'तायडे',
  'SOLANKE': 'सोळंके',
  'SABLE': 'साबळे',
  'KHATKE': 'खटके',
  'GITE': 'गिते',
  'AUTE': 'औते',
  'SANAP': 'सानप',
  'BODKHE': 'बोडखे',
  'NAIK': 'नाईक',
  'GHUGE': 'घुगे',
  'WARKAD': 'वरकड',
  'MANE': 'माने',
  'KAMBLE': 'कांबळे',
  'SHELKE': 'शेळके',
  'GORE': 'गोरे',
  'MUNDE': 'मुंडे',
  'KAKADE': 'काकडे',
  'KHARAT': 'खरात',
  'RAUT': 'राऊत',
  'SHARMA': 'शर्मा',
  'MAGAR': 'मगर',
  'DHANWATE': 'धनवटे',
  'KOLHE': 'कोल्हे',
  'BORSE': 'बोरसे',
  'NIKAM': 'निकम',
  'CHAUDHARI': 'चौधरी',
  'BHAGAT': 'भगत',
  'KUTE': 'कुटे',
  'SALVE': 'साळवे',
  'MHASKE': 'म्हस्के',
  'AWARE': 'आवारे',
  'TAMBE': 'तांबे',
  'SURVE': 'सुर्वे',
  'GHULE': 'घुले',
};

const CONSONANT_MAP: [string, string][] = [
  ['shri', 'श्री'],
  ['dny', 'ज्ञ'],
  ['kshr', 'क्षर'],
  ['ksh', 'क्ष'],
  ['tra', 'त्र'],
  ['shr', 'श्र'],
  ['kh', 'ख'],
  ['gh', 'घ'],
  ['ch', 'च'],
  ['chh', 'छ'],
  ['jh', 'झ'],
  ['th', 'थ'],
  ['dh', 'ध'],
  ['ph', 'फ'],
  ['bh', 'भ'],
  ['sh', 'श'],
  ['zh', 'झ'],
  ['ng', 'ंग'],
  ['k', 'क'],
  ['g', 'ग'],
  ['j', 'ज'],
  ['t', 'त'],
  ['d', 'द'],
  ['n', 'न'],
  ['p', 'प'],
  ['f', 'फ'],
  ['b', 'ब'],
  ['m', 'म'],
  ['y', 'य'],
  ['r', 'र'],
  ['l', 'ल'],
  ['v', 'व'],
  ['w', 'व'],
  ['s', 'स'],
  ['h', 'ह'],
];

const VOWEL_MATRA: [string, string][] = [
  ['aa', 'ा'],
  ['ee', 'ी'],
  ['oo', 'ू'],
  ['ai', 'ै'],
  ['au', 'ौ'],
  ['a', ''],
  ['i', 'ि'],
  ['u', 'ु'],
  ['e', 'े'],
  ['o', 'ो'],
];

const INITIAL_VOWELS: [string, string][] = [
  ['aa', 'आ'],
  ['ee', 'ई'],
  ['oo', 'ऊ'],
  ['ai', 'ऐ'],
  ['au', 'औ'],
  ['a', 'अ'],
  ['i', 'इ'],
  ['u', 'उ'],
  ['e', 'ए'],
  ['o', 'ओ'],
];

function transliterateWord(word: string): string {
  const upper = word.toUpperCase();
  if (EXACT_NAME_MAP[upper]) {
    return EXACT_NAME_MAP[upper];
  }

  let str = word.toLowerCase();
  let result = '';
  let i = 0;

  while (i < str.length) {
    if (i === 0 || str[i - 1] === ' ') {
      let matchedVowel = false;
      for (const [enV, mrV] of INITIAL_VOWELS) {
        if (str.startsWith(enV, i)) {
          result += mrV;
          i += enV.length;
          matchedVowel = true;
          break;
        }
      }
      if (matchedVowel) continue;
    }

    let matchedConsonant = false;
    for (const [enC, mrC] of CONSONANT_MAP) {
      if (str.startsWith(enC, i)) {
        i += enC.length;
        let matra = '';
        let matchedMatra = false;
        for (const [enV, mrV] of VOWEL_MATRA) {
          if (str.startsWith(enV, i)) {
            matra = mrV;
            i += enV.length;
            matchedMatra = true;
            break;
          }
        }
        if (!matchedMatra) {
          if (i < str.length && !'aeiou'.includes(str[i])) {
            matra = '्';
          }
        }
        result += mrC + matra;
        matchedConsonant = true;
        break;
      }
    }

    if (!matchedConsonant) {
      result += str[i];
      i++;
    }
  }

  return result;
}

/**
 * Transliterates an English full name to Marathi Devanagari script.
 * e.g. "MADHAV KASHIBA KHANDARE" -> "माधव काशिबा खंदारे"
 */
export function transliterateEnglishToMarathi(fullNameEn: string): string {
  if (!fullNameEn || !fullNameEn.trim()) return '';

  const words = fullNameEn.trim().split(/\s+/);
  const mrWords = words.map((w) => transliterateWord(w));
  return mrWords.join(' ');
}

/**
 * Cleans, repairs spaced Devanagari artifacts from PDF text streams,
 * and fixes broken matras like "मा धव क िश बा खं दा रे" -> "माधव काशिबा खंदारे".
 */
export function repairDevanagariSpaces(rawMr: string, fullNameEn?: string): string {
  if (!rawMr || !rawMr.trim()) {
    return fullNameEn ? transliterateEnglishToMarathi(fullNameEn) : '';
  }

  const trimmed = rawMr.trim();

  // If text has spaced out letters (e.g. "मा धव क िश बा" or "म ा ध व"), count short tokens
  const tokens = trimmed.split(/\s+/);
  const shortTokens = tokens.filter((t) => t.length <= 2);

  // If more than 2 short tokens and English name is available, use perfect transliteration
  if (shortTokens.length >= 2 && fullNameEn) {
    return transliterateEnglishToMarathi(fullNameEn);
  }

  // Strip zero-width & non-printable Unicode
  let cleaned = trimmed.replace(/[\u200B-\u200D\uFEFF\u00AD\u25CC]/g, '');

  // Remove space before Devanagari matras & signs (ा, ि, ी, ु, ू, े, ै, ो, ौ, ं, ः, ्)
  cleaned = cleaned.replace(/\s+([\u093E-\u094C\u0901-\u0903\u094D])/g, '$1');

  // Fix detached matra before consonant (e.g. "ि श" or "िश")
  cleaned = cleaned.replace(/ि\s*([क-ह])/g, '$1ि');

  // Remove space after matras if next is a consonant
  cleaned = cleaned.replace(/([\u093E-\u094C])\s+([क-ह])/g, '$1$2');

  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Check if string still looks fragmented and English is available
  if (cleaned.split(/\s+/).some((w) => w.length === 1 && !'व'.includes(w)) && fullNameEn) {
    return transliterateEnglishToMarathi(fullNameEn);
  }

  return cleaned;
}

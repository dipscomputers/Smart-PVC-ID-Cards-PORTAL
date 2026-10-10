/**
 * Offline Marathi (Devanagari) Transliterator and Dictionary
 * Provides zero-latency, quota-free transliteration for Maharashtra
 * farmer names, districts, talukas, villages, and general text.
 */

// Well-known Maharashtra districts mapping
const DISTRICT_MAP: Record<string, string> = {
  washim: 'वाशिम',
  akola: 'अकोला',
  amravati: 'अमरावती',
  yavatmal: 'यवतमाळ',
  buldhana: 'बुलढाणा',
  buldana: 'बुलढाणा',
  nagpur: 'नागपूर',
  wardha: 'वर्धा',
  bhandara: 'भंडारा',
  gondia: 'गोंदिया',
  chandrapur: 'चंद्रपूर',
  gadchiroli: 'गडचिरोली',
  nanded: 'नांदेड',
  hingoli: 'हिंगोली',
  parbhani: 'परभणी',
  jalna: 'जालना',
  aurangabad: 'छत्रपती संभाजीनगर',
  'chhatrapati sambhajinagar': 'छत्रपती संभाजीनगर',
  sambhajinagar: 'छत्रपती संभाजीनगर',
  beed: 'बीड',
  latur: 'लातूर',
  dharashiv: 'धाराशिव',
  osmanabad: 'धाराशिव',
  nashik: 'नाशिक',
  dhule: 'धुळे',
  nandurbar: 'नंदुरबार',
  jalgaon: 'जळगाव',
  ahmednagar: 'अहिल्यानगर',
  ahilyanagar: 'अहिल्यानगर',
  pune: 'पुणे',
  satara: 'सातारा',
  sangli: 'सांगली',
  solapur: 'सोलापूर',
  kolhapur: 'कोल्हापूर',
  thane: 'ठाणे',
  palghar: 'पालघर',
  raigad: 'रायगड',
  ratnagiri: 'रत्नागिरी',
  sindhudurg: 'सिंधुदुर्ग',
  mumbai: 'मुंबई',
  'mumbai suburban': 'मुंबई उपनगर',
};

// Common Talukas and places
const PLACE_MAP: Record<string, string> = {
  malegaon: 'मालेगाव',
  risod: 'रिसोड',
  mangrulpir: 'मंगरूळपीर',
  manora: 'मनोरा',
  karanja: 'कारंजा',
  somthana: 'सोमठाणा',
  gopalpur: 'गोपाळपूर',
  tandali: 'तांदळी',
  'tandali bk': 'तांदळी बु.',
  baramati: 'बारामती',
  haveli: 'हवेली',
  shirur: 'शिरूर',
  junnar: 'जुन्नर',
  khed: 'खेड',
  ambegaon: 'आंबेगाव',
  maval: 'मावळ',
  mulshi: 'मुळशी',
  daund: 'दौंड',
  purandar: 'पुरंदर',
  bhor: 'भोर',
  velhe: 'वेल्हे',
  indapur: 'इंदापूर',
};

// Common Marathi Names & Surnames
const NAME_MAP: Record<string, string> = {
  jyoti: 'ज्योती',
  pandhari: 'पंढरी',
  khandare: 'खंदारे',
  dwarakabai: 'द्वारकाबाई',
  dwaraka: 'द्वारका',
  dwarka: 'द्वारका',
  sakharam: 'सखाराम',
  mapari: 'मापारी',
  patil: 'पाटील',
  shinde: 'शिंदे',
  deshmukh: 'देशमुख',
  jadhav: 'जाधव',
  pawar: 'पवार',
  kadam: 'कदम',
  gaikwad: 'गायकवाड',
  more: 'मोरे',
  chavan: 'चव्हाण',
  kale: 'काळे',
  rathod: 'राठोड',
  bhosale: 'भोसले',
  sawant: 'सावंत',
  joshi: 'जोशी',
  kulkarni: 'कुलकर्णी',
  thakur: 'ठाकूर',
  sheikh: 'शेख',
  sayyad: 'सय्यद',
  khan: 'खान',
  sharma: 'शर्मा',
  gupta: 'गुप्ता',
  verma: 'वर्मा',
  ramesh: 'रमेश',
  suresh: 'सुरेश',
  ganesh: 'गणेश',
  santosh: 'संतोष',
  sachin: 'सचिन',
  sunil: 'सुनील',
  anil: 'अनिल',
  vinod: 'विनोद',
  vijay: 'विजय',
  sanjay: 'संजय',
  prakash: 'प्रकाश',
  vilas: 'विलास',
  dilip: 'दिलीप',
  dipak: 'दीपक',
  deepak: 'दीपक',
  ashok: 'अशोक',
  dattatray: 'दत्तात्रय',
  dattatraya: 'दत्तात्रय',
  balasaheb: 'बाळासाहेब',
  subhash: 'सुभाष',
  madhav: 'माधव',
  sunita: 'सुनिता',
  sita: 'सीता',
  gita: 'गीता',
  shobha: 'शोभा',
  anita: 'अनिता',
  sangita: 'संगीता',
  manisha: 'मनीषा',
  pooja: 'पूजा',
  priyanka: 'प्रियंका',
  asha: 'आशा',
  kamal: 'कमल',
  laxmi: 'लक्ष्मी',
  sharda: 'शारदा',
  parvati: 'पार्वती',
};

// General English-to-Marathi phonetic transliteration mapping
const CONSONANTS: [string, string][] = [
  ['ksha', 'क्ष'], ['gya', 'ज्ञ'], ['dny', 'ज्ञ'],
  ['kh', 'ख'], ['gh', 'घ'], ['ch', 'च'], ['chh', 'छ'], ['jh', 'झ'],
  ['th', 'थ'], ['dh', 'ध'], ['ph', 'फ'], ['bh', 'भ'], ['sh', 'श'], ['shh', 'ष'],
  ['k', 'क'], ['g', 'ग'], ['c', 'क'], ['j', 'ज'], ['t', 'त'], ['d', 'द'],
  ['n', 'न'], ['p', 'प'], ['b', 'ब'], ['m', 'म'], ['y', 'य'], ['r', 'र'],
  ['l', 'ल'], ['v', 'व'], ['w', 'व'], ['s', 'स'], ['h', 'ह'],
];

const VOWEL_SIGNS: [string, string][] = [
  ['aa', 'ा'], ['ai', 'ै'], ['au', 'ौ'], ['ee', 'ी'], ['oo', 'ू'],
  ['a', ''], ['i', 'ि'], ['u', 'ु'], ['e', 'े'], ['o', 'ो'],
];

const INITIAL_VOWELS: [string, string][] = [
  ['aa', 'आ'], ['ai', 'ऐ'], ['au', 'औ'], ['ee', 'ई'], ['oo', 'ऊ'],
  ['a', 'अ'], ['i', 'इ'], ['u', 'उ'], ['e', 'ए'], ['o', 'ओ'],
];

/**
 * Phonetically transliterate an individual word
 */
function transliterateWord(word: string): string {
  const lower = word.toLowerCase().trim();
  if (!lower) return '';

  // 1. Direct dictionary matches
  if (DISTRICT_MAP[lower]) return DISTRICT_MAP[lower];
  if (PLACE_MAP[lower]) return PLACE_MAP[lower];
  if (NAME_MAP[lower]) return NAME_MAP[lower];

  // 2. Rule-based phonetic conversion
  let rem = lower;
  let out = '';

  // Initial vowel check
  for (const [en, mr] of INITIAL_VOWELS) {
    if (rem.startsWith(en)) {
      out += mr;
      rem = rem.slice(en.length);
      break;
    }
  }

  while (rem.length > 0) {
    let matchedConsonant = false;

    for (const [cEn, cMr] of CONSONANTS) {
      if (rem.startsWith(cEn)) {
        out += cMr;
        rem = rem.slice(cEn.length);
        matchedConsonant = true;

        // Check for attached vowel sign
        let matchedVowel = false;
        for (const [vEn, vMr] of VOWEL_SIGNS) {
          if (rem.startsWith(vEn)) {
            out += vMr;
            rem = rem.slice(vEn.length);
            matchedVowel = true;
            break;
          }
        }

        // Halant if another consonant immediately follows and it's not the end
        if (!matchedVowel && rem.length > 0) {
          // If consonant is followed directly by another consonant, add halant or conjunct
          out += '्';
        }
        break;
      }
    }

    if (!matchedConsonant) {
      // Single character fallback
      out += rem[0];
      rem = rem.slice(1);
    }
  }

  // Remove trailing halant if any
  return out.replace(/्$/, '');
}

/**
 * Transliterates an English phrase or sentence to Marathi Devanagari script.
 */
export function transliterateEnglishToMarathi(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  // If already Devanagari, return as is
  if (/[\u0900-\u097F]/.test(trimmed)) {
    return trimmed;
  }

  const words = trimmed.split(/(\s+|,|\.|\/|-)/);
  return words
    .map((w) => {
      if (/^(\s+|,|\.|\/|-)$/.test(w)) return w;
      return transliterateWord(w);
    })
    .join('');
}

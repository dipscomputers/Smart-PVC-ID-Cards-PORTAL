/**
 * Helper utility to convert a numeric amount into Marathi words (अक्षरी रक्कम).
 * Example: 4000 -> "चार हजार रुपये"
 * Example: 2550 -> "दोन हजार पाचशे पन्नास रुपये"
 */

const onesAndTwos: Record<number, string> = {
  0: '',
  1: 'एक',
  2: 'दोन',
  3: 'तीन',
  4: 'चार',
  5: 'पाच',
  6: 'सहा',
  7: 'सात',
  8: 'आठ',
  9: 'नऊ',
  10: 'दहा',
  11: 'अकरा',
  12: 'बारा',
  13: 'तेरा',
  14: 'चौदा',
  15: 'पंधरा',
  16: 'सोळा',
  17: 'सतरा',
  18: 'अठरा',
  19: 'एकोणीस',
  20: 'वीस',
  21: 'एकवीस',
  22: 'बावीस',
  23: 'तेवीस',
  24: 'चौवीस',
  25: 'पंचवीस',
  26: 'सव्वीस',
  27: 'सत्तावीस',
  28: 'अठ्ठावीस',
  29: 'एकोणतीस',
  30: 'तीस',
  31: 'एकतीस',
  32: 'बत्तीस',
  33: 'तेत्तीस',
  34: 'चौतीस',
  35: 'पस्तीस',
  36: 'छत्तीस',
  37: 'सदतीस',
  38: 'अडतीस',
  39: 'एकोणचाळीस',
  40: 'चाळीस',
  41: 'एकताळीस',
  42: 'बेचाळीस',
  43: 'त्रेचाळीस',
  44: 'चव्वेचाळीस',
  45: 'पंचेचाळीस',
  46: 'शेचाळीस',
  47: 'सत्तेचाळीस',
  48: 'अठ्ठेचाळीस',
  49: 'एकोणपन्नास',
  50: 'पन्नास',
  51: 'एक्यावन्न',
  52: 'बावन्न',
  53: 'त्रिपन्न',
  54: 'चौपन्न',
  55: 'पंचावन्न',
  56: 'छप्पन्न',
  57: 'सत्तावन्न',
  58: 'अठ्ठावन्न',
  59: 'एकोणसाठ',
  60: 'साठ',
  61: 'एकसष्ठ',
  62: 'बासष्ठ',
  63: 'त्रेसष्ठ',
  64: 'चौसष्ठ',
  65: 'पासष्ठ',
  66: 'सहासाठ',
  67: 'सदुसष्ठ',
  68: 'अडसष्ठ',
  69: 'एकोणसत्तर',
  70: 'सत्तर',
  71: 'एकहत्तर',
  72: 'बाहत्तर',
  73: 'त्र्याहत्तर',
  74: 'चौऱ्याहत्तर',
  75: 'पंच्याहत्तर',
  76: 'शहात्तर',
  77: 'सत्त्याहत्तर',
  78: 'अठ्ठ्याहत्तर',
  79: 'एकोणऐंशी',
  80: 'ऐंशी',
  81: 'एक्याऐंशी',
  82: 'ब्याऐंशी',
  83: 'त्र्याऐंशी',
  84: 'चौऱ्याऐंशी',
  85: 'पंच्याऐंशी',
  86: 'शहाऐंशी',
  87: 'सत्त्याऐंशी',
  88: 'अठ्ठ्याऐंशी',
  89: 'एकोणनवी',
  90: 'नव्वद',
  91: 'एक्याण्णव',
  92: 'ब्याण्णव',
  93: 'त्र्याण्णव',
  94: 'चौऱ्याण्णव',
  95: 'पंच्याण्णव',
  96: 'शहाण्णव',
  97: 'सत्त्याण्णव',
  98: 'अठ्ठाण्णव',
  99: 'नव्व्याण्णव',
};

const hundredWords: Record<number, string> = {
  1: 'एकशे',
  2: 'दोनशे',
  3: 'तीनशे',
  4: 'चारशे',
  5: 'पाचशे',
  6: 'सहाशे',
  7: 'सातशे',
  8: 'आठशे',
  9: 'नऊशे',
};

function convertLessThanThousand(num: number): string {
  if (num === 0) return '';
  
  const parts: string[] = [];
  const hundredDigit = Math.floor(num / 100);
  const remainder = num % 100;

  if (hundredDigit > 0) {
    parts.push(hundredWords[hundredDigit] || `${onesAndTwos[hundredDigit]} शे`);
  }

  if (remainder > 0) {
    parts.push(onesAndTwos[remainder] || '');
  }

  return parts.join(' ').trim();
}

export function numberToMarathiWords(amount: number): string {
  if (!amount || isNaN(amount) || amount <= 0) {
    return 'शून्य रुपये';
  }

  const num = Math.floor(amount);
  const parts: string[] = [];

  // Crores
  const crore = Math.floor(num / 10000000);
  let rem = num % 10000000;

  if (crore > 0) {
    const croreText = convertLessThanThousand(crore);
    parts.push(`${croreText} कोटी`);
  }

  // Lakhs
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;

  if (lakh > 0) {
    const lakhText = onesAndTwos[lakh] || convertLessThanThousand(lakh);
    parts.push(`${lakhText} लाख`);
  }

  // Thousands
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;

  if (thousand > 0) {
    const thousandText = onesAndTwos[thousand] || convertLessThanThousand(thousand);
    parts.push(`${thousandText} हजार`);
  }

  // Hundreds & Tens
  if (rem > 0) {
    const remText = convertLessThanThousand(rem);
    if (remText) {
      parts.push(remText);
    }
  }

  const result = parts.join(' ').trim();
  return result ? `${result} रुपये` : 'शून्य रुपये';
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Coins, 
  Copy, 
  Check, 
  Sparkles, 
  RotateCcw, 
  Clock, 
  CheckCircle2, 
  Share2, 
  ArrowRight, 
  Banknote, 
  Delete, 
  Smartphone, 
  Building2, 
  Printer, 
  Zap,
  Volume2,
  VolumeX,
  Settings
} from 'lucide-react';
import { numberToMarathiWords } from '../utils/marathiNumbers';
import { playClickSound, playQrGeneratedChime, playSuccessChime } from '../utils/soundEffects';

interface NoteItem {
  value: number;
  label: string;
  icon: string;
  color: string;
}

const DENOMINATIONS: NoteItem[] = [
  { value: 500, label: '₹500', icon: '💵', color: 'from-stone-700 to-stone-900 border-stone-600' },
  { value: 200, label: '₹200', icon: '💵', color: 'from-amber-700 to-orange-900 border-amber-600' },
  { value: 100, label: '₹100', icon: '💵', color: 'from-indigo-700 to-purple-900 border-indigo-600' },
  { value: 50, label: '₹50', icon: '💵', color: 'from-cyan-700 to-blue-900 border-cyan-600' },
  { value: 20, label: '₹20', icon: '💵', color: 'from-emerald-700 to-teal-900 border-emerald-600' },
  { value: 10, label: '₹10', icon: '🪙', color: 'from-amber-800 to-yellow-950 border-amber-700' },
];

export const MyQrPaymentSection: React.FC = () => {
  // Active Main Tab ('upi' vs 'cash')
  const [activeSubTab, setActiveSubTab] = useState<'upi' | 'cash'>('upi');

  // Sound toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Merchant & UPI Settings
  const [upiId, setUpiId] = useState<string>('dipscomputers@upi');
  const [merchantName] = useState<string>('दिप्स कॉम्पुटर्स');
  const [showUpiSettings, setShowUpiSettings] = useState<boolean>(false);

  // --- TAB 1: CALCULATOR STATE ---
  const [equation, setEquation] = useState<string>('');
  const [displayAmount, setDisplayAmount] = useState<string>('0');
  const [lastCalculatedTotal, setLastCalculatedTotal] = useState<number>(0);

  // --- TAB 2: CASH COUNTER STATE ---
  const [noteCounts, setNoteCounts] = useState<Record<number, number>>({
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
  });

  // Refs for Cash inputs keyboard navigation
  const noteInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // --- PAYMENT QR MODAL / FLOW STATE ---
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [qrAmount, setQrAmount] = useState<number>(0);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [timerSeconds, setTimerSeconds] = useState<number>(120); // 2 minutes
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success'>('pending');
  const [transactionId, setTransactionId] = useState<string>('');
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);

  // Play sound wrapper
  const playSound = useCallback((fn: () => void) => {
    if (soundEnabled) {
      fn();
    }
  }, [soundEnabled]);

  // Evaluate Calculator Equation
  const evaluateEquation = useCallback((eq: string): number => {
    if (!eq.trim()) return 0;
    try {
      // Replace visual operators with JS operators
      const cleaned = eq
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/%/g, '/100');
      
      // Safe numeric expression evaluation
      // eslint-disable-next-line no-eval
      const result = eval(cleaned);
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return Math.max(0, Math.round(result * 100) / 100);
      }
      return 0;
    } catch {
      return 0;
    }
  }, []);

  // Update calculated total when equation changes
  useEffect(() => {
    if (!equation) {
      setDisplayAmount('0');
      setLastCalculatedTotal(0);
      return;
    }

    // If equation ends with an operator, evaluate prefix
    const safeEq = equation.replace(/[+\-×÷%]+$/, '');
    const evaluated = evaluateEquation(safeEq || equation);
    setLastCalculatedTotal(evaluated);
    setDisplayAmount(evaluated.toLocaleString('en-IN', { maximumFractionDigits: 2 }));
  }, [equation, evaluateEquation]);

  // Calculator Button Click
  const handleCalcKeyPress = useCallback((key: string) => {
    playSound(playClickSound);

    if (key === 'C') {
      setEquation('');
      setDisplayAmount('0');
      setLastCalculatedTotal(0);
      return;
    }

    if (key === 'BACKSPACE') {
      setEquation((prev) => prev.slice(0, -1));
      return;
    }

    if (key === '=') {
      const finalVal = evaluateEquation(equation);
      setEquation(finalVal.toString());
      setDisplayAmount(finalVal.toLocaleString('en-IN'));
      setLastCalculatedTotal(finalVal);
      return;
    }

    // Prevent duplicate operators
    const isOperator = ['+', '-', '×', '÷', '%'].includes(key);
    const lastChar = equation.slice(-1);
    const isLastOperator = ['+', '-', '×', '÷', '%'].includes(lastChar);

    if (isOperator && isLastOperator) {
      setEquation((prev) => prev.slice(0, -1) + key);
      return;
    }

    if (isOperator && !equation) {
      return;
    }

    setEquation((prev) => prev + key);
  }, [equation, evaluateEquation, playSound]);

  // Generate QR Code Action
  const triggerQrGeneration = useCallback((amount: number) => {
    if (amount <= 0) {
      alert('कृपया वैध रक्कम प्रविष्ट करा (Please enter a valid amount > 0)');
      return;
    }

    playSound(playQrGeneratedChime);

    const upiString = `upi://pay?pa=${upiId.trim()}&pn=${encodeURIComponent(merchantName)}&am=${amount.toFixed(2)}&cu=INR`;
    
    QRCode.toDataURL(upiString, {
      width: 380,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        setQrDataUrl(url);
        setQrAmount(amount);
        setTimerSeconds(120);
        setPaymentStatus('pending');
        setTransactionId(`TXN${Date.now().toString().slice(-8)}${Math.floor(100 + Math.random() * 900)}`);
        setShowQrModal(true);
      })
      .catch((err) => {
        console.error('Error generating QR code:', err);
      });
  }, [upiId, merchantName, playSound]);

  // Countdown timer for active QR Code
  useEffect(() => {
    if (!showQrModal || paymentStatus !== 'pending') return;

    if (timerSeconds <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimerSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [showQrModal, timerSeconds, paymentStatus]);

  // Simulate Payment Success
  const handleSimulateSuccess = () => {
    playSound(playSuccessChime);
    setPaymentStatus('success');
  };

  // --- CASH COUNTER CALCULATIONS ---
  const calculateCashGrandTotal = useCallback(() => {
    return DENOMINATIONS.reduce((acc, note) => {
      const count = noteCounts[note.value] || 0;
      return acc + note.value * count;
    }, 0);
  }, [noteCounts]);

  const calculateTotalNotesCount = useCallback(() => {
    return Object.values(noteCounts).reduce((acc, curr) => acc + (curr || 0), 0);
  }, [noteCounts]);

  const cashGrandTotal = calculateCashGrandTotal();
  const totalNotesCount = calculateTotalNotesCount();
  const marathiWords = numberToMarathiWords(cashGrandTotal);

  // Update Note Count
  const handleNoteCountChange = (value: number, inputStr: string) => {
    const num = parseInt(inputStr.replace(/\D/g, '')) || 0;
    setNoteCounts((prev) => ({
      ...prev,
      [value]: Math.max(0, num),
    }));
  };

  // Clear All Notes
  const handleResetCashCounter = () => {
    playSound(playClickSound);
    setNoteCounts({
      500: 0,
      200: 0,
      100: 0,
      50: 0,
      20: 0,
      10: 0,
    });
  };

  // Copy Summary to Clipboard (MANDATORY FORMAT EXPLOIT)
  const handleCopyCashSummary = () => {
    playSound(playClickSound);

    const now = new Date();
    
    // Format English date: DD/MM/YYYY
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateStr = `${day}/${month}/${year}`;

    // Format English time: 12:18:25 PM
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const timeStr = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;

    // Build non-zero denomination lines
    const lines: string[] = [];
    DENOMINATIONS.forEach((note) => {
      const count = noteCounts[note.value] || 0;
      if (count > 0) {
        lines.push(`• ₹${note.value} x ${count} = ₹${note.value * count}`);
      }
    });

    const breakdownText = lines.length > 0 ? lines.join('\n') : '• (कोणतीही नोंद नाही)';

    const summaryText = `🖥️ *दिप्स कॉम्पुटर्स*

 *कॅश मोजणी*
तारीख: ${dateStr} वेळ: ${timeStr}

${breakdownText}

-------------------------
एकूण नोटा: *${totalNotesCount}*
एकूण कॅश रक्कम: *₹${cashGrandTotal}/-*
अक्षरी रक्कम: *${marathiWords}*`;

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    });
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept keyboard when typing in text inputs except Arrow Up/Down
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // F2: Toggle Tab
      if (e.key === 'F2') {
        e.preventDefault();
        playSound(playClickSound);
        setActiveSubTab((prev) => (prev === 'upi' ? 'cash' : 'upi'));
        return;
      }

      // Alt + 1: Switch to UPI
      if (e.altKey && e.key === '1') {
        e.preventDefault();
        playSound(playClickSound);
        setActiveSubTab('upi');
        return;
      }

      // Alt + 2: Switch to Cash
      if (e.altKey && e.key === '2') {
        e.preventDefault();
        playSound(playClickSound);
        setActiveSubTab('cash');
        return;
      }

      // ArrowLeft / ArrowRight when no text input focused
      if (!isInput) {
        if (e.key === 'ArrowLeft' && activeSubTab === 'cash') {
          playSound(playClickSound);
          setActiveSubTab('upi');
          return;
        }
        if (e.key === 'ArrowRight' && activeSubTab === 'upi') {
          playSound(playClickSound);
          setActiveSubTab('cash');
          return;
        }
      }

      // Escape: Close Modal or Clear
      if (e.key === 'Escape') {
        if (showQrModal) {
          setShowQrModal(false);
          return;
        }
        if (activeSubTab === 'upi') {
          handleCalcKeyPress('C');
        }
        return;
      }

      // Calculator Keys (when on UPI tab and not typing in modal/setting)
      if (activeSubTab === 'upi' && !showQrModal && !showUpiSettings) {
        if (e.key >= '0' && e.key <= '9') {
          handleCalcKeyPress(e.key);
          return;
        }
        if (e.key === '.') {
          handleCalcKeyPress('.');
          return;
        }
        if (e.key === '+' || e.key === '-') {
          handleCalcKeyPress(e.key);
          return;
        }
        if (e.key === '*') {
          handleCalcKeyPress('×');
          return;
        }
        if (e.key === '/') {
          e.preventDefault();
          handleCalcKeyPress('÷');
          return;
        }
        if (e.key === '%') {
          handleCalcKeyPress('%');
          return;
        }
        if (e.key === 'Backspace') {
          handleCalcKeyPress('BACKSPACE');
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          if (lastCalculatedTotal > 0) {
            triggerQrGeneration(lastCalculatedTotal);
          }
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSubTab, showQrModal, showUpiSettings, lastCalculatedTotal, triggerQrGeneration, handleCalcKeyPress, playSound]);

  // Handle Note Input Navigation with Up/Down Arrow Keys
  const handleNoteInputKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextRef = noteInputRefs.current[index + 1];
      if (nextRef) {
        nextRef.focus();
        nextRef.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevRef = noteInputRefs.current[index - 1];
      if (prevRef) {
        prevRef.focus();
        prevRef.select();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (cashGrandTotal > 0) {
        triggerQrGeneration(cashGrandTotal);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-3.5 py-2 text-slate-100 select-none">
      
      {/* 1. APP BAR HEADER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-xl shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/30">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                दिप्स कॉम्पुटर्स (DIPs Computers POS)
              </h1>
              {/* LIVE INDICATOR BADGE */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>POS ACTIVE</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              डायनामिक UPI क्युआर कोड आणि कॅश काउंटर • [F2/Alt+1/Alt+2 ने टॅब बदला]
            </p>
          </div>
        </div>

        {/* TOP RIGHT CONTROLS: SOUND TOGGLE & UPI ID SETTING */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700'
                : 'bg-slate-800/50 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
            title={soundEnabled ? 'साऊंड चालू (Sound On)' : 'साऊंड बंद (Sound Off)'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowUpiSettings(!showUpiSettings)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
            title="UPI आयडी बदला"
          >
            <Settings className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline font-mono">{upiId}</span>
          </button>
        </div>
      </div>

      {/* UPI SETTINGS DROPDOWN POPUP */}
      {showUpiSettings && (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 shadow-2xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>⚙️ UPI आयडी कॉन्फिगरेशन (UPI Merchant Settings)</span>
            <button onClick={() => setShowUpiSettings(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-[11px] text-slate-400 mb-1">मर्चंट UPI ID (Payee VPA):</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. dipscomputers@upi"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setShowUpiSettings(false)}
                className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                सेव्ह करा
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. DUAL TAB SELECTOR (UPI QR vs CASH COUNTER) */}
      <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-2 shadow-inner">
        <button
          onClick={() => {
            playSound(playClickSound);
            setActiveSubTab('upi');
          }}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            activeSubTab === 'upi'
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <QrCode className="w-4 h-4 text-emerald-300" />
          <span>1. UPI क्युआर (UPI QR)</span>
          <span className="hidden md:inline text-[10px] opacity-60 font-mono px-1.5 py-0.5 bg-black/30 rounded">Alt+1</span>
        </button>

        <button
          onClick={() => {
            playSound(playClickSound);
            setActiveSubTab('cash');
          }}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            activeSubTab === 'cash'
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Coins className="w-4 h-4 text-blue-300" />
          <span>2. कॅश मोजणी (Cash)</span>
          <span className="hidden md:inline text-[10px] opacity-60 font-mono px-1.5 py-0.5 bg-black/30 rounded">Alt+2</span>
        </button>
      </div>

      {/* ---------------- TAB 1: UPI QR CALCULATOR ---------------- */}
      {activeSubTab === 'upi' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-5 animate-fadeIn">
          
          {/* HIGH CONTRAST LED DIGITAL DISPLAY */}
          <div className="bg-slate-950 border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-6 text-right shadow-inner relative overflow-hidden group">
            <div className="absolute top-2 left-3 flex items-center gap-2 text-[11px] font-mono font-bold text-emerald-500/70 uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>DIGITAL CALCULATION DISPLAY</span>
            </div>

            {/* Live equation string */}
            <div className="min-h-[28px] text-slate-400 text-sm sm:text-base font-mono tracking-wider overflow-x-auto whitespace-nowrap pt-3">
              {equation || '0'}
            </div>

            {/* Formatted INR Amount */}
            <div className="text-3xl sm:text-5xl font-black font-mono text-emerald-400 tracking-tight pt-1">
              ₹{displayAmount}
            </div>
          </div>

          {/* CALCULATOR KEYPAD GRID */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {/* ROW 1 */}
            <button
              onClick={() => handleCalcKeyPress('C')}
              className="py-3 sm:py-4 bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-black text-sm sm:text-base rounded-2xl border border-rose-800/50 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              C
            </button>
            <button
              onClick={() => handleCalcKeyPress('%')}
              className="py-3 sm:py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-sm sm:text-base rounded-2xl border border-slate-700 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              %
            </button>
            <button
              onClick={() => handleCalcKeyPress('÷')}
              className="py-3 sm:py-4 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 font-black text-sm sm:text-base rounded-2xl border border-indigo-700/50 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              ÷
            </button>
            <button
              onClick={() => handleCalcKeyPress('BACKSPACE')}
              className="py-3 sm:py-4 bg-amber-950/80 hover:bg-amber-900 text-amber-300 font-black text-sm sm:text-base rounded-2xl border border-amber-800/50 shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center"
              title="मागे घ्या (Backspace)"
            >
              <Delete className="w-5 h-5" />
            </button>

            {/* ROW 2 */}
            <button
              onClick={() => handleCalcKeyPress('7')}
              className="py-3 sm:py-4 bg-slate-950 hover:bg-slate-800 text-white font-black text-lg sm:text-2xl rounded-2xl border border-slate-800 shadow-md active:scale-95 transition-all cursor-pointer font-mono"
            >
              7
            </button>
            <button
              onClick={() => handleCalcKeyPress('8')}
              className="py-3 sm:py-4 bg-slate-950 hover:bg-slate-800 text-white font-black text-lg sm:text-2xl rounded-2xl border border-slate-800 shadow-md active:scale-95 transition-all cursor-pointer font-mono"
            >
              8
            </button>
            <button
              onClick={() => handleCalcKeyPress('9')}
              className="py-3 sm:py-4 bg-slate-950 hover:bg-slate-800 text-white font-black text-lg sm:text-2xl rounded-2xl border border-slate-800 shadow-md active:scale-95 transition-all cursor-pointer font-mono"
            >
              9
            </button>
            <button
              onClick={() => handleCalcKeyPress('×')}
              className="py-3 sm:py-4 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 font-black text-sm sm:text-base rounded-2xl border border-indigo-700/50 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              ×
            </button>

            {/* ROW 3 */}
            <button
              onClick={() => handleCalcKeyPress('4')}
              className="py-3 sm:py-4 bg-slate-950 hover:bg-slate-800 text-white font-black text-lg sm:text-2xl rounded-2xl border border-slate-800 shadow-md active:scale-95 transition-all cursor-pointer font-mono"
            >
              4
            </button>
            <button
              onClick={() => handleCalcKeyPress('5')}
              className="py-3 sm:py-4 bg-slate-950 hover:bg-slate-800 text-white font-black text-lg sm:text-2xl rounded-2xl border border-slate-800 shadow-md active:scale-95 transition-all cursor-pointer font-mono"
            >
              5
            </button>
            <button
              onClick={() => handleCalcKeyPress('6')}
              className="py-3 sm:py-4 bg-slate-950 hover:bg-slate-800 text-white font-black text-lg sm:text-2xl rounded-2xl border border-slate-800 shadow-md active:scale-95 transition-all cursor-pointer font-mono"
            >
              6
            </button>
            <button
              onClick={() => handleCalcKeyPress('-')}
              className="py-3 sm:py-4 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 font-black text-sm sm:text-base rounded-2xl border border-indigo-700/50 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              -
            </button>

            {/* ROW 4 */}
            <button
              onClick={() => handleCalcKeyPress('1')}
              className="py-3 sm:py-4 bg-slate-950 hover:bg-slate-800 text-white font-black text-lg sm:text-2xl rounded-2xl border border-slate-800 shadow-md active:scale-95 transition-all cursor-pointer font-mono"
            >
              1
            </button>
            <button
              onClick={() => handleCalcKeyPress('2')}
              className="py-3 sm:py-4 bg-slate-950 hover:bg-slate-800 text-white font-black text-lg sm:text-2xl rounded-2xl border border-slate-800 shadow-md active:scale-95 transition-all cursor-pointer font-mono"
            >
              2
            </button>
            <button
              onClick={() => handleCalcKeyPress('3')}
              className="py-3 sm:py-4 bg-slate-950 hover:bg-slate-800 text-white font-black text-lg sm:text-2xl rounded-2xl border border-slate-800 shadow-md active:scale-95 transition-all cursor-pointer font-mono"
            >
              3
            </button>
            <button
              onClick={() => handleCalcKeyPress('+')}
              className="py-3 sm:py-4 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 font-black text-sm sm:text-base rounded-2xl border border-indigo-700/50 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              +
            </button>

            {/* ROW 5 */}
            <button
              onClick={() => handleCalcKeyPress('0')}
              className="py-3 sm:py-4 bg-slate-950 hover:bg-slate-800 text-white font-black text-lg sm:text-2xl rounded-2xl border border-slate-800 shadow-md active:scale-95 transition-all cursor-pointer font-mono"
            >
              0
            </button>
            <button
              onClick={() => handleCalcKeyPress('.')}
              className="py-3 sm:py-4 bg-slate-950 hover:bg-slate-800 text-white font-black text-lg sm:text-2xl rounded-2xl border border-slate-800 shadow-md active:scale-95 transition-all cursor-pointer font-mono"
            >
              .
            </button>
            <button
              onClick={() => handleCalcKeyPress('=')}
              className="col-span-2 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-base sm:text-lg rounded-2xl border border-blue-400/30 shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              = (हिशोब)
            </button>
          </div>

          {/* PRIMARY ACTION CTA: GENERATE QR */}
          <button
            onClick={() => triggerQrGeneration(lastCalculatedTotal)}
            disabled={lastCalculatedTotal <= 0}
            className={`w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xl ${
              lastCalculatedTotal > 0
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25 ring-2 ring-emerald-400/50 active:scale-98'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
            }`}
          >
            <QrCode className="w-6 h-6" />
            <span>QR कोड तयार करा (Generate QR Code)</span>
            <span className="font-mono text-sm bg-black/20 px-2.5 py-1 rounded-lg">
              ₹{lastCalculatedTotal.toLocaleString('en-IN')}
            </span>
          </button>
        </div>
      )}

      {/* ---------------- TAB 2: CASH DENOMINATION COUNTER ---------------- */}
      {activeSubTab === 'cash' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-5 animate-fadeIn">
          
          {/* HEADER BAR FOR CASH COUNTER */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm sm:text-base font-extrabold text-white">
                कॅश मोजणी आणि लेजर (Cash Denomination Counter)
              </h2>
            </div>
            <button
              onClick={handleResetCashCounter}
              className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="सर्व नोटा शून्य करा"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>रिफ्रेश / रिसेट</span>
            </button>
          </div>

          {/* INTERACTIVE LEDGER GRID */}
          <div className="space-y-2.5">
            {DENOMINATIONS.map((note, index) => {
              const count = noteCounts[note.value] || 0;
              const subtotal = note.value * count;

              return (
                <div
                  key={note.value}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-3 transition-all"
                >
                  {/* Column 1: Denomination Label */}
                  <div className="w-24 sm:w-32 flex items-center gap-2 shrink-0">
                    <span className="text-lg">{note.icon}</span>
                    <span className="font-mono font-black text-base sm:text-lg text-white">
                      {note.label}
                    </span>
                  </div>

                  {/* Column 2: Interactive Numeric Input Box */}
                  <div className="flex items-center gap-2 flex-1 max-w-[160px] sm:max-w-[200px]">
                    <span className="text-slate-500 font-mono text-xs">×</span>
                    <input
                      ref={(el) => { noteInputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      value={count === 0 ? '' : count}
                      onChange={(e) => handleNoteCountChange(note.value, e.target.value)}
                      onKeyDown={(e) => handleNoteInputKeyDown(index, e)}
                      placeholder="0"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 rounded-xl px-3 py-2 text-center text-emerald-400 font-mono font-black text-base sm:text-lg focus:outline-none transition-all"
                    />
                    <span className="text-slate-500 text-xs hidden sm:inline">नोटा</span>
                  </div>

                  {/* Column 3: Calculated Subtotal */}
                  <div className="w-28 sm:w-36 text-right font-mono font-black text-base sm:text-xl text-emerald-400 tabular-nums">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* MARATHI AMOUNT IN WORDS GRADIENT BANNER */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-950 to-emerald-950 border border-emerald-500/30 rounded-2xl p-4 shadow-lg text-center space-y-1">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest block">
              अक्षरी रक्कम (AMOUNT IN MARATHI WORDS)
            </span>
            <div className="text-base sm:text-xl font-black text-white tracking-wide">
              {marathiWords}
            </div>
          </div>

          {/* LIVE TOTALS DASHBOARD */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-xs text-slate-400 font-bold block mb-1">एकूण नोटा (Total Notes)</span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                {totalNotesCount}
              </div>
            </div>

            <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-4 text-center">
              <span className="text-xs text-emerald-400 font-bold block mb-1">एकूण कॅश रक्कम (Grand Total)</span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                ₹{cashGrandTotal.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* CASH ACTIONS (COPY SUMMARY & GENERATE QR) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleCopyCashSummary}
              className="py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-black text-xs sm:text-sm rounded-2xl border border-slate-700 shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">कॉपी झाले (Copied!)</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-emerald-400" />
                  <span>तपशील कॉपी करा (Copy Summary)</span>
                </>
              )}
            </button>

            <button
              onClick={() => triggerQrGeneration(cashGrandTotal)}
              disabled={cashGrandTotal <= 0}
              className={`py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                cashGrandTotal > 0
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-emerald-500/20 active:scale-95'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>रक्कमेचा QR बनवा (Generate QR)</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------------- PAYMENT QR & SUCCESS MODAL ---------------- */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative">
            
            {/* MODAL HEADER */}
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {merchantName} POS
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    UPI: {upiId}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-6 text-center space-y-5">
              {paymentStatus === 'pending' ? (
                <>
                  {/* EXACT AMOUNT BANNER */}
                  <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-3">
                    <span className="text-xs text-slate-400 block mb-0.5">पेमेंटची रक्कम (Pay Amount):</span>
                    <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400">
                      ₹{qrAmount.toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* DYNAMIC QR CODE CONTAINER */}
                  <div className="bg-white p-4 rounded-2xl shadow-xl inline-block border-4 border-slate-800 relative group">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="UPI Payment QR Code"
                        className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto"
                      />
                    ) : (
                      <div className="w-56 h-56 flex items-center justify-center text-slate-400 font-bold text-xs">
                        QR लोड होत आहे...
                      </div>
                    )}
                  </div>

                  {/* COUNTDOWN TIMER */}
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400 bg-amber-950/40 border border-amber-800/40 py-2 px-4 rounded-xl max-w-xs mx-auto">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>
                      QR कालावधी: {Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, '0')} मिनिटे
                    </span>
                  </div>

                  {/* PAYMENT SIMULATOR BUTTON */}
                  <button
                    onClick={handleSimulateSuccess}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                    <span>पेमेंट तपासा / सिम्युलेट यश (Simulate Payment Success)</span>
                  </button>
                </>
              ) : (
                /* PAYMENT SUCCESS SCREEN */
                <div className="space-y-5 py-4 animate-scaleUp">
                  <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
                  </div>

                  <div>
                    <h4 className="text-xl font-black text-emerald-400">
                      पेमेंट यशस्वी झाले! (Payment Successful)
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      ट्रांसझॅक्शन ID: {transactionId}
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">व्यापारी:</span>
                      <span className="font-bold text-white">{merchantName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">रक्कम:</span>
                      <span className="font-bold text-emerald-400 text-sm">₹{qrAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">तारीख व वेळ:</span>
                      <span className="text-slate-200">{new Date().toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const text = `🖥️ *${merchantName} POS*\n\n✅ *पेमेंट पावती*\nरक्कम: ₹${qrAmount}/-\nTXN ID: ${transactionId}\nवेळ: ${new Date().toLocaleString()}\n\nधन्यवाद!`;
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                      }}
                      className="flex-1 py-3 px-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>WhatsApp पावती</span>
                    </button>

                    <button
                      onClick={() => setShowQrModal(false)}
                      className="flex-1 py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      नवीन पेमेंट
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

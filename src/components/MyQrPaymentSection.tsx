import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Coins, 
  Copy, 
  Check, 
  RotateCcw, 
  Clock, 
  CheckCircle2, 
  Share2, 
  Banknote, 
  Delete, 
  Volume2, 
  VolumeX, 
  Settings, 
  X,
  ArrowLeft,
  RefreshCw,
  Monitor
} from 'lucide-react';
import { numberToMarathiWords } from '../utils/marathiNumbers';
import { playClickSound, playQrGeneratedChime, playSuccessChime } from '../utils/soundEffects';

interface NoteItem {
  value: number;
  label: string;
  icon: string;
}

const DENOMINATIONS: NoteItem[] = [
  { value: 500, label: '₹500', icon: '💵' },
  { value: 200, label: '₹200', icon: '💵' },
  { value: 100, label: '₹100', icon: '💵' },
  { value: 50, label: '₹50', icon: '💵' },
  { value: 20, label: '₹20', icon: '💵' },
  { value: 10, label: '₹10', icon: '🪙' },
];

export const MyQrPaymentSection: React.FC = () => {
  // Active Main Tab ('upi' vs 'cash')
  const [activeSubTab, setActiveSubTab] = useState<'upi' | 'cash'>('upi');

  // Sound toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Merchant & UPI Settings
  const [upiId, setUpiId] = useState<string>('dipscomputers@upi');
  const [merchantName] = useState<string>('DIPS COMPUTERS');
  const [merchantPhone] = useState<string>('+91 90491 02035');
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
      margin: 1,
      color: {
        dark: '#000000',
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
  const handleSimulateSuccess = useCallback(() => {
    playSound(playSuccessChime);
    setPaymentStatus('success');
  }, [playSound]);

  // Reset all amounts, calculations, and cash counts to 0
  const resetAllAmounts = useCallback(() => {
    setEquation('');
    setDisplayAmount('0');
    setLastCalculatedTotal(0);
    setNoteCounts({
      500: 0,
      200: 0,
      100: 0,
      50: 0,
      20: 0,
      10: 0,
    });
    setPaymentStatus('pending');
  }, []);

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

  // Copy Summary to Clipboard
  const handleCopyCashSummary = () => {
    playSound(playClickSound);

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateStr = `${day}/${month}/${year}`;

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const timeStr = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;

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
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // Space key inside QR Modal triggers Confirm Payment Done
      if (showQrModal && paymentStatus === 'pending' && e.code === 'Space') {
        e.preventDefault();
        handleSimulateSuccess();
        return;
      }

      if (e.key === 'F2') {
        e.preventDefault();
        playSound(playClickSound);
        setActiveSubTab((prev) => (prev === 'upi' ? 'cash' : 'upi'));
        return;
      }

      if (e.altKey && e.key === '1') {
        e.preventDefault();
        playSound(playClickSound);
        setActiveSubTab('upi');
        return;
      }

      if (e.altKey && e.key === '2') {
        e.preventDefault();
        playSound(playClickSound);
        setActiveSubTab('cash');
        return;
      }

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

      if (e.key === 'Escape') {
        if (showQrModal) {
          resetAllAmounts();
          setShowQrModal(false);
          return;
        }
        if (activeSubTab === 'upi') {
          handleCalcKeyPress('C');
        }
        return;
      }

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
  }, [activeSubTab, showQrModal, paymentStatus, showUpiSettings, lastCalculatedTotal, triggerQrGeneration, handleCalcKeyPress, handleSimulateSuccess, playSound]);

  // Handle Note Input Navigation
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
    <div className="py-2 flex justify-center items-center select-none font-sans">
      
      {/* HIGH-TECH POS DEVICE FRAME MATCHING REFERENCE IMAGES */}
      <div className="w-full max-w-[430px] bg-[#070913] border-2 border-slate-800/90 rounded-[38px] p-4 sm:p-5 shadow-2xl relative space-y-4 overflow-hidden">
        
        {/* IF QR MODAL IS ACTIVE (SHOW QR PAYMENT VIEW MATCHING REFERENCE) */}
        {showQrModal ? (
          <div className="space-y-3.5 animate-fadeIn text-white">
            
            {/* TOP BAR HEADER */}
            <div className="bg-[#0a0e1c] p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  playSound(playClickSound);
                  resetAllAmounts();
                  setShowQrModal(false);
                }}
                className="p-2 bg-[#131b2e] hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
                title="मागे जा (Back & Clear)"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <h2 className="text-xs sm:text-sm font-extrabold tracking-wide text-white">
                UPI QR पेमेंट (PAY MERCHANT)
              </h2>

              <button
                onClick={() => {
                  playSound(playClickSound);
                  resetAllAmounts();
                  setShowQrModal(false);
                }}
                className="p-2 bg-[#131b2e] hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
                title="रिसेट व नवीन हिशोब"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {paymentStatus === 'pending' ? (
              <>
                {/* TIMER CAPSULE BAR */}
                <div className="bg-[#0d1222] border border-slate-800 p-2.5 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-200">
                  <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>QR कालमर्यादा (EXPIRES IN)</span>
                  </div>
                  <div className="bg-[#070b14] text-[#00d294] font-mono font-black text-xs px-2.5 py-1 rounded-lg tracking-wider border border-[#00d294]/30">
                    {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{String(timerSeconds % 60).padStart(2, '0')}
                  </div>
                </div>

                {/* CENTRAL WHITE PAYMENT STANDEE CARD */}
                <div className="bg-white rounded-[28px] p-5 pt-6 shadow-2xl border border-slate-200 text-slate-900 relative space-y-3.5 text-center overflow-hidden">
                  
                  {/* Top Gradient Accent Bar Seamless Overflow */}
                  <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-400 w-full absolute top-0 left-0 right-0" />

                  {/* Merchant Logo / Monitor Icon */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md flex items-center justify-center mx-auto mt-1">
                    <Monitor className="w-6 h-6 text-white" />
                  </div>

                  {/* Merchant Name & Phone */}
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                      {merchantName}
                    </h3>
                    <p className="text-xs font-bold text-indigo-600 font-mono mt-0.5">
                      {merchantPhone}
                    </p>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1.5">
                      SCAN & PAY
                    </p>
                  </div>

                  {/* Square High-Res QR Code Image */}
                  <div className="p-2 border border-slate-200 rounded-2xl bg-white shadow-inner inline-block">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="UPI QR Code"
                        className="w-56 h-56 object-contain mx-auto"
                      />
                    ) : (
                      <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs font-bold">
                        QR लोड होत आहे...
                      </div>
                    )}
                  </div>

                  {/* Payable Amount Banner */}
                  <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500 text-white p-3.5 rounded-2xl shadow-lg font-mono text-center space-y-0.5">
                    <div className="text-[10px] font-extrabold text-teal-100 tracking-wider flex items-center justify-center gap-1.5 uppercase">
                      <span className="w-2 h-2 rounded-full bg-teal-200 animate-pulse" />
                      <span>देय रक्कम • PAYABLE AMOUNT</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-baseline justify-center gap-1">
                      <span>₹</span>
                      <span>{qrAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Supported Payment App Logos Row */}
                  <div className="flex items-center justify-center gap-3 pt-1 text-[11px] font-bold text-slate-600">
                    <span className="font-extrabold tracking-tight text-slate-700">
                      <span className="text-blue-500">G</span>
                      <span className="text-red-500">P</span>
                      <span className="text-yellow-500">a</span>
                      <span className="text-emerald-500">y</span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-black italic text-sky-500">paytm</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-extrabold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-md text-[10px]">
                      पे PhonePe
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-bold text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-md">
                      amazon pay
                    </span>
                  </div>
                </div>

                {/* BOTTOM CONFIRM PAYMENT DONE BUTTON */}
                <div className="bg-[#0d1222] p-2 rounded-2xl border border-slate-800">
                  <button
                    onClick={handleSimulateSuccess}
                    className="w-full py-3.5 px-4 bg-[#00c9a7] hover:bg-[#00b395] text-slate-950 font-black text-sm rounded-xl shadow-md flex items-center justify-between transition-all cursor-pointer active:scale-98"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-slate-950 stroke-[2.5]" />
                      <span>Confirm Payment Done</span>
                    </div>
                    <span className="bg-black/20 text-slate-950 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                      Space
                    </span>
                  </button>
                </div>
              </>
            ) : (
              /* PAYMENT SUCCESS CELEBRATION RECEIPT VIEW MATCHING REFERENCE IMAGE */
              <div className="space-y-4 py-2 animate-scaleUp">
                {/* DOUBLE RING GLOWING TEAL CHECKMARK */}
                <div className="w-16 h-16 rounded-full bg-[#00c9a7]/15 border-2 border-[#00c9a7]/40 flex items-center justify-center mx-auto shadow-lg shadow-[#00c9a7]/20 my-2">
                  <div className="w-10 h-10 rounded-full bg-[#00c9a7] text-[#070913] flex items-center justify-center font-bold shadow-md">
                    <Check className="w-6 h-6 stroke-[3] text-[#070913]" />
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h4 className="text-base sm:text-lg font-black text-[#00c9a7] tracking-tight">
                    पेमेंट यशस्वी झाले! (Successful)
                  </h4>
                  <p className="text-xs text-slate-400 font-mono tracking-wider">
                    TXN: {transactionId}
                  </p>
                </div>

                {/* RECEIPT TABLE SUMMARY */}
                <div className="bg-[#0a0e1c] border border-slate-800/90 rounded-2xl p-4 text-xs font-mono space-y-2 text-slate-300 shadow-inner my-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-sans font-bold">व्यापारी:</span>
                    <span className="font-extrabold text-white tracking-wide">{merchantName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-sans font-bold">रक्कम:</span>
                    <span className="font-extrabold text-[#00c9a7] text-base font-mono">₹{qrAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-sans font-bold">वेळ:</span>
                    <span className="text-slate-200 font-mono text-[11px]">
                      {new Date().toLocaleDateString('en-GB')}, {new Date().toLocaleTimeString('en-US', { hour12: false })}
                    </span>
                  </div>
                </div>

                {/* ACTION BUTTONS ROW */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={() => {
                      const text = `🖥️ *${merchantName}*\n\n✅ *पेमेंट पावती*\nरक्कम: ₹${qrAmount}/-\nTXN ID: ${transactionId}\nवेळ: ${new Date().toLocaleString()}\n\nधन्यवाद!`;
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="py-3 px-3 bg-[#056846] hover:bg-[#045438] text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all"
                  >
                    <Share2 className="w-4 h-4 text-white" />
                    <span>WhatsApp पावती</span>
                  </button>

                  <button
                    onClick={() => {
                      playSound(playClickSound);
                      resetAllAmounts();
                      setShowQrModal(false);
                    }}
                    className="py-3 px-3 bg-[#131b2e] hover:bg-[#1a253e] text-slate-200 border border-slate-800 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-95 transition-all"
                  >
                    <span>नवीन पेमेंट</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* REGULAR CALCULATOR / CASH COUNTER VIEW */
          <>
            {/* 1. TOP DEVICE HEADER */}
            <div className="flex items-center justify-between px-1 pt-1">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-wider text-slate-100 uppercase">
                  DIPS COMPUTERS POS
                </h1>
              </div>

              <div className="flex items-center gap-2">
                {/* SOUND TOGGLE */}
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                  title={soundEnabled ? 'साऊंड चालू' : 'साऊंड बंद'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
                </button>

                {/* SETTINGS GEAR */}
                <button
                  onClick={() => setShowUpiSettings(!showUpiSettings)}
                  className="p-1 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                  title="UPI मर्चंट सेटिंग्स"
                >
                  <Settings className="w-4 h-4 text-slate-300" />
                </button>

                {/* LIVE STATUS BADGE */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#10192d] border border-[#1c2c4e] rounded-full text-[11px] font-bold text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE</span>
                </div>
              </div>
            </div>

            {/* UPI SETTINGS MODAL DROPDOWN */}
            {showUpiSettings && (
              <div className="bg-[#0f1527] border border-slate-700/80 rounded-2xl p-3 shadow-2xl space-y-2 animate-fadeIn text-xs">
                <div className="flex items-center justify-between font-bold text-slate-200">
                  <span>⚙️ मर्चंट UPI VPA आयडी</span>
                  <button onClick={() => setShowUpiSettings(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. dipscomputers@upi"
                  className="w-full bg-[#070913] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* 2. DUAL SEGMENTED TAB SELECTOR (TEAL ACTIVE / DARK INACTIVE) */}
            <div className="bg-[#0e1424] border border-slate-800/80 p-1.5 rounded-2xl flex items-center justify-between gap-1 shadow-inner">
              <button
                onClick={() => {
                  playSound(playClickSound);
                  setActiveSubTab('upi');
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeSubTab === 'upi'
                    ? 'bg-[#00c9a7] text-slate-950 shadow-md ring-1 ring-teal-400/30 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className={`w-4 h-4 ${activeSubTab === 'upi' ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>UPI क्युआर (UPI QR)</span>
              </button>

              <button
                onClick={() => {
                  playSound(playClickSound);
                  setActiveSubTab('cash');
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeSubTab === 'cash'
                    ? 'bg-[#00c9a7] text-slate-950 shadow-md ring-1 ring-teal-400/30 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Banknote className={`w-4 h-4 ${activeSubTab === 'cash' ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>कॅश मोजणी (Cash)</span>
              </button>
            </div>

            {/* ---------------- TAB 1: UPI QR CALCULATOR ---------------- */}
            {activeSubTab === 'upi' && (
              <div className="space-y-3.5 animate-fadeIn">
                
                {/* DIGITAL LED CALCULATION DISPLAY */}
                <div className="bg-[#0a0e1c] border border-slate-800/80 rounded-2xl p-4 sm:p-5 min-h-[135px] flex flex-col justify-between text-right relative overflow-hidden shadow-inner">
                  {/* Equation line */}
                  <div className="min-h-[22px] text-slate-400 text-xs sm:text-sm font-mono tracking-wider overflow-x-auto whitespace-nowrap">
                    {equation}
                  </div>

                  {/* Amount Display with Emerald Currency Symbol and Bold White Digits */}
                  <div className="flex items-baseline justify-end gap-1.5 font-mono font-black pt-2">
                    <span className="text-2xl sm:text-3xl text-[#00c9a7] font-extrabold">₹</span>
                    <span className="text-4xl sm:text-5xl tracking-tight text-white">{displayAmount}</span>
                  </div>
                </div>

                {/* 5x4 KEYPAD GRID */}
                <div className="grid grid-cols-4 gap-2.5">
                  {/* ROW 1 */}
                  <button
                    onClick={() => handleCalcKeyPress('C')}
                    className="bg-[#240b17] hover:bg-[#330e20] border border-[#421429] text-rose-500 font-black text-lg py-3.5 sm:py-4 rounded-2xl active:scale-95 transition-all cursor-pointer shadow-xs"
                  >
                    C
                  </button>
                  <button
                    onClick={() => handleCalcKeyPress('BACKSPACE')}
                    className="bg-[#131b2e] hover:bg-[#1a253e] border border-slate-800 text-slate-300 py-3.5 sm:py-4 rounded-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-xs"
                    title="Backspace"
                  >
                    <Delete className="w-5 h-5 text-slate-300" />
                  </button>
                  <button
                    onClick={() => handleCalcKeyPress('%')}
                    className="bg-[#131b2e] hover:bg-[#1a253e] border border-slate-800 text-slate-300 font-bold text-base py-3.5 sm:py-4 rounded-2xl active:scale-95 transition-all cursor-pointer shadow-xs"
                  >
                    %
                  </button>
                  <button
                    onClick={() => handleCalcKeyPress('÷')}
                    className="bg-[#131b2e] hover:bg-[#1a253e] border border-slate-800 text-[#00c9a7] font-black text-xl py-3.5 sm:py-4 rounded-2xl active:scale-95 transition-all cursor-pointer shadow-xs"
                  >
                    ÷
                  </button>

                  {/* ROW 2 */}
                  <button
                    onClick={() => handleCalcKeyPress('7')}
                    className="bg-[#131b2e] hover:bg-[#1a253e] border border-slate-800 text-white font-extrabold text-xl py-3.5 sm:py-4 rounded-2xl active:scale-95 transition-all cursor-pointer shadow-xs font-mono"
                  >
                    7
                  </button>
                  <button
                    onClick={() => handleCalcKeyPress('8')}
                    className="bg-[#131b2e] hover:bg-[#1a253e] border border-slate-800 text-white font-extrabold text-xl py-3.5 sm:py-4 rounded-2xl active:scale-95 transition-all cursor-pointer shadow-xs font-mono"
                  >
                    8
                  </button>
                  <button
                    onClick={() => handleCalcKeyPress('9')}
                    className="bg-[#131b2e] hover:bg-[#1a253e] border border-slate-800 text-white font-extrabold text-xl py-3.5 sm:py-4 rounded-2xl active:scale-95 transition-all cursor-pointer shadow-xs font-mono"
                  >
                    9
                  </button>
                  <button
                    onClick={() => handleCalcKeyPress('×')}
                    className="bg-[#131b2e] hover:bg-[#1a253e] border border-slate-800 text-[#00c9a7] font-black text-xl py-3.5 sm:py-4 rounded-2xl active:scale-95 transition-all cursor-pointer shadow-xs"
                  >
                    ×
                  </button>

                  {/* ROW 3 */}
                  <button
                    onClick={() => handleCalcKeyPress('4')}
                    className="bg-[#131b2e] hover:bg-[#1a253e] border border-slate-800 text-white font-extrabold text-xl py-3.5 sm:py-4 rounded-2xl active:scale-95 transition-all cursor-pointer shadow-xs font-mono"
                  >
                    4
                  </button>
                  <button
                    onClick={() => handleCalcKeyPress('5')}
                    className="bg-[#131b2e] hover:bg-[#1a253e] border border-slate-800 text-white font-extrabold text-xl py-3.5 sm:py-4 rounded-2xl active:scale-95 transition-all cursor-pointer shadow-xs font-mono"
                  >
                    5
                  </button>
                  <button
                    onClick={() => handleCalcKeyPress('6')}
                    className="bg-[#131b2e] hover:bg-[#1a253e] border border-slate-800 text-white font-extrabold text-xl py-3.5 sm:py-4 rounded-2xl active:scale-95 transition-all cursor-pointer shadow-xs font-mono"
                  >
                    6
                  </button>
                  <button
                    onClick={() => handleCalcKeyPress('-')}
                    className="bg-[#131b2e] hover:bg-[#1a253e] border border-slate-800 text-[#00c9a7] font-black text-xl py-3.5 sm:py-4 rounded-2xl active:scale-95 transition-all cursor-pointer shadow-xs"
                  >
                    -
                  </button>

                  {/* ROW 4 */}
                  <button
                    onClick={() => handleCalcKeyPress('1')}
                    className="bg-[#131b2e] hover:bg-[#1a253e] border border-slate-800 text-white font-extrabold text-xl py-3.5 sm:py-4 rounded-2xl active:scale-95 transition-all cursor-pointer shadow-xs font-mono"
                  >
                    1
                  </button>
                  <button
                    onClick={() => handleCalcKeyPress('2')}
                    className="bg-[#131b2e] hover:bg-[#1a253e] border border-slate-800 text-white font-extrabold text-xl py-3.5 sm:py-4 rounded-2xl active:scale-95 transition-all cursor-pointer shadow-xs font-mono"
                  >
                    2
                  </button>
                  <button
                    onClick={() => handleCalcKeyPress('3')}
                    className="bg-[#131b2e] hover:bg-[#1a253e] border border-slate-800 text-white font-extrabold text-xl py-3.5 sm:py-4 rounded-2xl active:scale-95 transition-all cursor-pointer shadow-xs font-mono"
                  >
                    3
                  </button>
                  <button
                    onClick={() => handleCalcKeyPress('+')}
                    className="bg-[#131b2e] hover:bg-[#1a253e] border border-slate-800 text-[#00c9a7] font-black text-xl py-3.5 sm:py-4 rounded-2xl active:scale-95 transition-all cursor-pointer shadow-xs"
                  >
                    +
                  </button>

                  {/* ROW 5 */}
                  <button
                    onClick={() => handleCalcKeyPress('0')}
                    className="col-span-2 bg-[#131b2e] hover:bg-[#1a253e] border border-slate-800 text-white font-extrabold text-xl py-3.5 sm:py-4 rounded-2xl active:scale-95 transition-all cursor-pointer shadow-xs font-mono text-center"
                  >
                    0
                  </button>
                  <button
                    onClick={() => handleCalcKeyPress('.')}
                    className="bg-[#131b2e] hover:bg-[#1a253e] border border-slate-800 text-white font-extrabold text-xl py-3.5 sm:py-4 rounded-2xl active:scale-95 transition-all cursor-pointer shadow-xs font-mono"
                  >
                    .
                  </button>
                  <button
                    onClick={() => handleCalcKeyPress('=')}
                    className="bg-[#0e2752] hover:bg-[#143267] border border-[#194082] text-sky-300 font-extrabold text-xl py-3.5 sm:py-4 rounded-2xl active:scale-95 transition-all cursor-pointer shadow-xs"
                  >
                    =
                  </button>
                </div>

                {/* BOTTOM PRIMARY BUTTON (TEAL VIBRANT PILL) */}
                <button
                  onClick={() => triggerQrGeneration(lastCalculatedTotal)}
                  disabled={lastCalculatedTotal <= 0}
                  className={`w-full py-4 px-4 bg-[#00c9a7] hover:bg-[#00b395] text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-lg shadow-[#00c9a7]/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 mt-2 ${
                    lastCalculatedTotal <= 0 ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  <Check className="w-5 h-5 stroke-[2.5]" />
                  <span>QR कोड तयार करा (Generate QR)</span>
                </button>
              </div>
            )}

            {/* ---------------- TAB 2: CASH DENOMINATION COUNTER ---------------- */}
            {activeSubTab === 'cash' && (
              <div className="space-y-3.5 animate-fadeIn">
                
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-[#00c9a7]" />
                    <span>कॅश मोजणी व लेजर (Cash Counter)</span>
                  </span>
                  <button
                    onClick={handleResetCashCounter}
                    className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-[#1d1017] border border-[#3e1b2b] px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>रिसेट</span>
                  </button>
                </div>

                {/* LEDGER GRID */}
                <div className="space-y-2">
                  {DENOMINATIONS.map((note, index) => {
                    const count = noteCounts[note.value] || 0;
                    const subtotal = note.value * count;

                    return (
                      <div
                        key={note.value}
                        className="bg-[#0a0e1c] border border-slate-800/80 rounded-2xl p-2.5 flex items-center justify-between gap-2"
                      >
                        <div className="w-20 flex items-center gap-1.5">
                          <span className="text-base">{note.icon}</span>
                          <span className="font-mono font-extrabold text-sm text-white">{note.label}</span>
                        </div>

                        <div className="flex items-center gap-1 flex-1 max-w-[130px]">
                          <span className="text-slate-500 font-mono text-xs">×</span>
                          <input
                            ref={(el) => { noteInputRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            value={count === 0 ? '' : count}
                            onChange={(e) => handleNoteCountChange(note.value, e.target.value)}
                            onKeyDown={(e) => handleNoteInputKeyDown(index, e)}
                            placeholder="0"
                            className="w-full bg-[#131b2e] border border-slate-700/80 focus:border-[#00c9a7] rounded-xl px-2 py-1.5 text-center text-[#00c9a7] font-mono font-extrabold text-sm focus:outline-none"
                          />
                        </div>

                        <div className="w-24 text-right font-mono font-extrabold text-sm text-[#00c9a7] tabular-nums">
                          ₹{subtotal.toLocaleString('en-IN')}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* MARATHI WORDS BANNER */}
                <div className="bg-[#0a0e1c] border border-emerald-500/30 rounded-2xl p-3 text-center space-y-0.5">
                  <span className="text-[10px] font-bold text-[#00c9a7] uppercase tracking-widest block">
                    अक्षरी रक्कम (AMOUNT IN WORDS)
                  </span>
                  <div className="text-sm font-extrabold text-white">
                    {marathiWords}
                  </div>
                </div>

                {/* DASHBOARD TOTALS */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#0a0e1c] border border-slate-800/80 rounded-2xl p-3 text-center">
                    <span className="text-[11px] text-slate-400 font-bold block">एकूण नोटा</span>
                    <div className="text-xl font-extrabold font-mono text-white mt-0.5">{totalNotesCount}</div>
                  </div>

                  <div className="bg-[#0a0e1c] border border-emerald-500/30 rounded-2xl p-3 text-center">
                    <span className="text-[11px] text-[#00c9a7] font-bold block">एकूण रक्कम</span>
                    <div className="text-xl font-extrabold font-mono text-[#00c9a7] mt-0.5">
                      ₹{cashGrandTotal.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleCopyCashSummary}
                    className="py-3 px-3 bg-[#131b2e] hover:bg-[#1a253e] border border-slate-700/80 text-slate-200 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    {copiedSummary ? <Check className="w-4 h-4 text-[#00c9a7]" /> : <Copy className="w-4 h-4 text-[#00c9a7]" />}
                    <span>{copiedSummary ? 'कॉपी झाले!' : 'तपशील कॉपी करा'}</span>
                  </button>

                  <button
                    onClick={() => triggerQrGeneration(cashGrandTotal)}
                    disabled={cashGrandTotal <= 0}
                    className={`py-3 px-3 bg-[#00c9a7] hover:bg-[#00b395] text-slate-950 font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all ${
                      cashGrandTotal <= 0 ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-slate-950" />
                    <span>रक्कमेचा QR बनवा</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* BOTTOM SMARTPHONE HOME INDICATOR BAR */}
        <div className="w-24 h-1 bg-slate-800/80 rounded-full mx-auto my-1" />
      </div>

    </div>
  );
};

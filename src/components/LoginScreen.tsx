import React, { useState, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, Phone, Sparkles, KeyRound, ArrowLeft, CheckCircle2, ShieldAlert, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playClickSound, playSuccessChime } from '../utils/soundEffects';

export const USER_LOGO_URL = 'https://blogger.googleusercontent.com/img/a/AVvXsEgnbNMNM_EqpDyQSqW9ncSuuuTWPL4O3qTCxY6bRvfwp5r83CtUsP0FYf19hveo9KcTlvujYd5Wobnjz1nRO0-ZolOim5gRImhZQmhKHIWcrqKf6RDoQVoYwrgUxT0a6SPdBs975K3dLArV9nocqTXzCaJ92561kvcyQXbbvUSh5TwkHp7wSixT1fs-kDAR=s1600';

export const LoginScreen: React.FC = () => {
  const { validateCredentials, verifyOTPAndLogin } = useAuth();

  // Step 1 or Step 2 state
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [otpInput, setOtpInput] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Live Current Date and Time State
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentDateTime.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const formattedTime = currentDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  // Handle Step 1: Credential Submission
  const handleCredentialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    setErrorMsg('');

    if (!usernameInput.trim()) {
      setErrorMsg('कृपया युझर आयडी प्रविष्ट करा!');
      return;
    }
    if (!passwordInput.trim()) {
      setErrorMsg('कृपया पासवर्ड प्रविष्ट करा!');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = validateCredentials(usernameInput, passwordInput);
      setIsLoading(false);
      if (res.success) {
        setStep('otp');
        setErrorMsg('');
        setOtpInput('');
      } else {
        setErrorMsg(res.message);
      }
    }, 350);
  };

  // Handle Step 2: OTP Submission
  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    setErrorMsg('');

    if (!otpInput.trim() || otpInput.trim().length < 4) {
      setErrorMsg('कृपया ४ अंकी सुरक्षा OTP टाका!');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = verifyOTPAndLogin(usernameInput, passwordInput, otpInput);
      setIsLoading(false);
      if (res.success) {
        playSuccessChime();
      } else {
        setErrorMsg(res.message);
      }
    }, 350);
  };

  return (
    <div className="min-h-screen bg-slate-900 bg-gradient-to-br from-slate-950 via-[#0a1e38] to-[#0d281e] flex items-center justify-center p-3 sm:p-6 relative overflow-hidden select-none font-sans text-slate-100">
      
      {/* Background Animated Glowing Ambient Orbs */}
      <div className="absolute -top-40 -left-40 w-[32rem] h-[32rem] bg-blue-600/25 rounded-full animate-pulse-glow pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[32rem] h-[32rem] bg-emerald-500/25 rounded-full animate-pulse-glow pointer-events-none" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-cyan-500/15 rounded-full animate-float pointer-events-none" />

      {/* Main Split Professional Container with Entry Animation */}
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-700/60 grid grid-cols-1 lg:grid-cols-12 relative z-10 transition-all duration-300 animate-card-appear">
        
        {/* LEFT COLUMN: Brand Graphic Section with English Branding & Smooth Animations */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#0284c7] via-[#0369a1] to-[#0f172a] p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          
          {/* Animated Decorative Overlay Spheres */}
          <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-blue-400/20 blur-xl animate-float pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-blue-500/30 backdrop-blur-3xl animate-pulse pointer-events-none" />
          <div className="absolute top-1/2 -right-20 w-64 h-64 rounded-full bg-emerald-400/20 blur-2xl animate-float pointer-events-none" style={{ animationDelay: '3s' }} />

          {/* Top Brand Header with Floating Logo & English Name */}
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3.5 group">
              <img
                src={USER_LOGO_URL}
                alt="DIPs Computers Logo"
                className="w-14 h-14 rounded-2xl object-contain bg-white p-1 shadow-xl border-2 border-white/40 shrink-0 transform group-hover:scale-105 transition-transform duration-300"
              />
              <div>
                <h2 className="text-xl font-black text-white leading-tight tracking-tight">DIPs Computers</h2>
                <p className="text-xs text-blue-100 font-semibold opacity-90">Shirpur Jain, Malegaon</p>
              </div>
            </div>

            <div className="pt-6 space-y-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-300 shadow-sm animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                DIPs Official Smart Portal
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-snug">
                WELCOME TO <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-400">
                  DIPs Computers
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed pt-1">
                Online Smart PVC ID Cards & Citizen Services Portal, Shirpur Jain.
              </p>
            </div>
          </div>

          {/* Bottom Bullet Highlights & Phone Contact */}
          <div className="relative z-10 pt-8 space-y-4 border-t border-white/15">
            <div className="space-y-2.5 text-xs font-medium text-blue-50">
              <div className="flex items-center gap-2.5 transform hover:translate-x-1 transition-transform cursor-default">
                <div className="w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-400/30">
                  ✓
                </div>
                <span>Farmer ID Card Generator</span>
              </div>
              <div className="flex items-center gap-2.5 transform hover:translate-x-1 transition-transform cursor-default">
                <div className="w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-400/30">
                  ✓
                </div>
                <span>Live POS Payment QR Code</span>
              </div>
              <div className="flex items-center gap-2.5 transform hover:translate-x-1 transition-transform cursor-default">
                <div className="w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-400/30">
                  ✓
                </div>
                <span>2-Step Security OTP Authentication</span>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="tel:9049102035"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition-all transform hover:scale-[1.02] active:scale-95"
              >
                <Phone className="w-3.5 h-3.5 text-amber-300" />
                <span>Contact: Dipak Khandare - 9049102035</span>
              </a>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Form Card */}
        <div className="lg:col-span-7 p-8 sm:p-12 bg-white dark:bg-slate-900 flex flex-col justify-center space-y-6">
          
          {/* Header Title with Conditional Badges */}
          <div className="flex items-start justify-between gap-4">
            <div>
              {/* Conditional Badges:
                  Step 1 (credentials): 'DIPs Computers, Shirpur Jain' badge
                  Step 2 (otp): Prominent LARGER Real-time Date and Time badge */}
              {step === 'credentials' ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[11px] font-bold text-blue-700 dark:text-blue-300 mb-2 shadow-2xs">
                  <span>DIPs Computers, Shirpur Jain</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/80 border-2 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200 mb-2 shadow-sm animate-pulse">
                  <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-sm font-black tracking-wide">{formattedDate}</span>
                  <span className="text-amber-400 dark:text-amber-600 font-bold">•</span>
                  <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-mono text-slate-900 dark:text-white text-sm font-black">{formattedTime}</span>
                </div>
              )}

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {step === 'credentials' ? 'Sign In' : 'Security OTP Verification'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {step === 'credentials'
                  ? 'पोर्टलमध्ये प्रवेश करण्यासाठी तुमचा युझर आयडी व पासवर्ड प्रविष्ट करा.'
                  : 'लॉगिन पूर्ण करण्यासाठी आजचा ४-अंकी सुरक्षा OTP प्रविष्ट करा.'}
              </p>
            </div>

            <img
              src={USER_LOGO_URL}
              alt="DIPs Computers"
              className="w-12 h-12 object-contain rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 shadow-xs shrink-0 hover:rotate-3 transition-transform duration-300"
            />
          </div>

          {/* Error Message Display with Shake Animation */}
          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-950/80 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2 animate-shake shadow-xs">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: USER ID & PASSWORD FORM */}
          {step === 'credentials' && (
            <form onSubmit={handleCredentialSubmit} className="space-y-5">
              {/* User ID Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  User Name / ID
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="युझर आयडी प्रविष्ट करा"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="पासवर्ड प्रविष्ट करा"
                    className="w-full pl-11 pr-20 py-3.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 cursor-pointer transition-transform active:scale-95"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <span className="flex items-center gap-1">
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>HIDE</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>SHOW</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="font-medium">Remember me</span>
                </label>
              </div>

              {/* Next Step Button with Animated Shine Effect */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-4 bg-[#0369a1] hover:bg-[#0284c7] text-white font-black text-sm rounded-xl shadow-lg shadow-blue-900/20 transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-60 overflow-hidden relative group"
              >
                <div className="absolute inset-0 w-1/2 bg-white/20 skew-x-12 opacity-0 group-hover:opacity-100 group-hover:animate-shine pointer-events-none" />
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>तपासत आहे...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-amber-300" />
                    <span>पुढील पायरी (NEXT STEP)</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: PRIVATIZED OTP VERIFICATION FORM WITH PROMINENT DATE & TIME BADGE */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Back to Credentials Link (No line box) */}
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>युझर आयडी/पासवर्ड बदला</span>
                </button>
              </div>

              {/* OTP Numeric Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  ४ अंकी ओटीपी (4-Digit Security OTP)
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                    <KeyRound className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <input
                    type="password"
                    required
                    autoFocus
                    maxLength={4}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="४-अंकी OTP टाका"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-mono font-bold tracking-widest text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Verify OTP Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-900/20 transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-60 relative overflow-hidden group"
              >
                <div className="absolute inset-0 w-1/2 bg-white/20 skew-x-12 opacity-0 group-hover:opacity-100 group-hover:animate-shine pointer-events-none" />
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>पडताळणी करत आहे...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-amber-300" />
                    <span>OTP व्हेरीफाय व लॉगिन करा</span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

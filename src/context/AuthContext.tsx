import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthUser {
  id: string;
  name: string;
  shopName: string;
  mobile: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  username: string;
  login: (u: string, p: string) => { success: boolean; message: string };
  validateCredentials: (u: string, p: string) => { success: boolean; message: string };
  verifyOTPAndLogin: (u: string, p: string, otp: string) => { success: boolean; message: string };
  logout: () => void;
  changePassword: (oldP: string, newP: string) => { success: boolean; message: string };
  resetDefaultCredentials: () => void;
  getTodaysOTP: () => string;
  autoLogoutNotice: string | null;
  clearAutoLogoutNotice: () => void;
}

const DEFAULT_USERNAME = 'dips';
const DEFAULT_PASSWORD = 'Shree@123';
const DEFAULT_USER: AuthUser = {
  id: 'dips-01',
  name: 'दिपक खंदारे (पाटील)',
  shopName: 'DIPs Computers',
  mobile: '9049102035',
  role: 'Admin / Operator',
};

// 30 Minutes Inactivity Auto-Logout Duration
const AUTO_LOGOUT_TIMEOUT_MS = 30 * 60 * 1000; // 30 Minutes = 1,800,000 ms

// Allowed default credentials requested by user
export const ALLOWED_USER_IDS = ['dips', 'dipscom', '9049102035', 'admin'];
export const ALLOWED_PASSWORDS = ['Shree@123', 'Dips@123', 'dips123'];

/**
 * Calculates Today's Security OTP based on DDMM date format:
 * Example: 21/01/2026 -> '2101'
 * Example: 22/01/2026 -> '2201'
 * Example: 23/01/2026 -> '2301'
 */
export function getTodaysOTP(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${day}${month}`;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('dips_is_authenticated') === 'true';
  });

  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem('dips_saved_username') || DEFAULT_USERNAME;
  });

  const [password, setPassword] = useState<string>(() => {
    return localStorage.getItem('dips_saved_password') || DEFAULT_PASSWORD;
  });

  const [autoLogoutNotice, setAutoLogoutNotice] = useState<string | null>(null);

  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('dips_user_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_USER;
      }
    }
    return DEFAULT_USER;
  });

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('dips_is_authenticated', 'true');
    } else {
      localStorage.removeItem('dips_is_authenticated');
    }
  }, [isAuthenticated]);

  // 30 Minutes Inactivity Timer & Event Listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId: NodeJS.Timeout;

    const performAutoLogout = () => {
      setIsAuthenticated(false);
      localStorage.removeItem('dips_is_authenticated');
      localStorage.removeItem('dips_last_activity_timestamp');
      setAutoLogoutNotice('३० मिनिटांच्या निष्क्रियतेमुळे सुरक्षा कारणास्तव ऑटो-लॉगआउट झाले आहे! (Auto Logged Out after 30 mins)');
    };

    const resetTimer = () => {
      localStorage.setItem('dips_last_activity_timestamp', String(Date.now()));
      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        performAutoLogout();
      }, AUTO_LOGOUT_TIMEOUT_MS);
    };

    // Check on initial mount or tab resume
    const savedLastActivity = localStorage.getItem('dips_last_activity_timestamp');
    if (savedLastActivity) {
      const elapsed = Date.now() - Number(savedLastActivity);
      if (elapsed >= AUTO_LOGOUT_TIMEOUT_MS) {
        performAutoLogout();
        return;
      }
    }

    resetTimer();

    // Throttled activity listener
    let lastResetTime = Date.now();
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastResetTime > 2000) {
        lastResetTime = now;
        resetTimer();
      }
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    activityEvents.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));

    // Periodic heartbeat check every 15 seconds
    const intervalId = setInterval(() => {
      const lastAct = Number(localStorage.getItem('dips_last_activity_timestamp') || Date.now());
      if (Date.now() - lastAct >= AUTO_LOGOUT_TIMEOUT_MS) {
        performAutoLogout();
      }
    }, 15000);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
      activityEvents.forEach((evt) => window.removeEventListener(evt, handleActivity));
    };
  }, [isAuthenticated]);

  const validateCredentials = (u: string, p: string) => {
    const trimmedUser = u.trim().toLowerCase();
    const trimmedPass = p.trim();

    const validUsernames = [
      ...ALLOWED_USER_IDS,
      username.toLowerCase(),
    ];

    const validPasswords = [
      ...ALLOWED_PASSWORDS,
      password,
    ];

    const isUserValid = validUsernames.some((id) => id.toLowerCase() === trimmedUser);
    const isPassValid = validPasswords.some(
      (pass) => pass === trimmedPass || pass.toLowerCase() === trimmedPass.toLowerCase()
    );

    if (isUserValid && isPassValid) {
      return { success: true, message: 'क्रेडेंशियल्स बरोबर आहेत!' };
    }

    return {
      success: false,
      message: 'चुकीचा युझर आयडी किंवा पासवर्ड! कृपया योग्य माहिती टाका.',
    };
  };

  const verifyOTPAndLogin = (u: string, p: string, otp: string) => {
    const trimmedOtp = otp.trim();
    const todaysOtp = getTodaysOTP();

    // Check if OTP matches today's DDMM OTP (or master emergency OTP '1234')
    if (trimmedOtp !== todaysOtp && trimmedOtp !== '1234') {
      return {
        success: false,
        message: 'चुकीचा किंवा अमान्य OTP! कृपया योग्य ४-अंकी सुरक्षा ओटीपी प्रविष्ट करा.',
      };
    }

    // Step 1 check
    const credRes = validateCredentials(u, p);
    if (!credRes.success) {
      return credRes;
    }

    setIsAuthenticated(true);
    setUser(DEFAULT_USER);
    setAutoLogoutNotice(null);
    localStorage.setItem('dips_is_authenticated', 'true');
    localStorage.setItem('dips_user_data', JSON.stringify(DEFAULT_USER));
    localStorage.setItem('dips_last_activity_timestamp', String(Date.now()));
    return { success: true, message: 'लॉगिन आणि OTP पडताळणी यशस्वी झाली!' };
  };

  const login = (u: string, p: string) => {
    const credRes = validateCredentials(u, p);
    if (credRes.success) {
      setIsAuthenticated(true);
      setUser(DEFAULT_USER);
      setAutoLogoutNotice(null);
      localStorage.setItem('dips_is_authenticated', 'true');
      localStorage.setItem('dips_user_data', JSON.stringify(DEFAULT_USER));
      localStorage.setItem('dips_last_activity_timestamp', String(Date.now()));
      return { success: true, message: 'लॉगिन यशस्वी झाले!' };
    }
    return credRes;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('dips_is_authenticated');
    localStorage.removeItem('dips_last_activity_timestamp');
  };

  const changePassword = (oldP: string, newP: string) => {
    const trimmedOld = oldP.trim();
    const isOldValid = ALLOWED_PASSWORDS.some(
      (pass) => pass === trimmedOld || pass.toLowerCase() === trimmedOld.toLowerCase()
    ) || trimmedOld === password;

    if (!isOldValid) {
      return { success: false, message: 'सध्याचा पासवर्ड चुकीचा आहे!' };
    }
    if (!newP || newP.trim().length < 4) {
      return { success: false, message: 'नवीन पासवर्ड किमान ४ अक्षरांचा असावा!' };
    }

    const updatedP = newP.trim();
    setPassword(updatedP);
    localStorage.setItem('dips_saved_password', updatedP);
    return { success: true, message: 'पासवर्ड यशस्वीरीत्या बदलला गेला आहे!' };
  };

  const resetDefaultCredentials = () => {
    setUsername(DEFAULT_USERNAME);
    setPassword(DEFAULT_PASSWORD);
    localStorage.setItem('dips_saved_username', DEFAULT_USERNAME);
    localStorage.setItem('dips_saved_password', DEFAULT_PASSWORD);
  };

  const clearAutoLogoutNotice = () => {
    setAutoLogoutNotice(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user: isAuthenticated ? user : null,
        username,
        login,
        validateCredentials,
        verifyOTPAndLogin,
        logout,
        changePassword,
        resetDefaultCredentials,
        getTodaysOTP,
        autoLogoutNotice,
        clearAutoLogoutNotice,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


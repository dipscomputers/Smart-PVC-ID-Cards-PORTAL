import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { PortalTab } from '../components/Sidebar';

export interface ShortcutHandlers {
  onPrint?: () => void | Promise<void>;
  onSave?: () => void | Promise<void>;
  onNewCard?: () => void | Promise<void>;
  onDownloadPdf?: () => void | Promise<void>;
  onToggleView?: () => void;
  onNextCard?: () => void;
  onPrevCard?: () => void;
}

export interface ToastMessage {
  id: string;
  badge: string;
  text: string;
  type?: 'success' | 'info' | 'warning';
}

interface ShortcutsContextType {
  registerHandlers: (handlers: ShortcutHandlers) => () => void;
  showToast: (badge: string, text: string, type?: 'success' | 'info' | 'warning') => void;
  isHelpOpen: boolean;
  openHelp: () => void;
  closeHelp: () => void;
  activeTab: PortalTab;
  onTabChange: (tab: PortalTab) => void;
}

const ShortcutsContext = createContext<ShortcutsContextType | undefined>(undefined);

export const useShortcuts = () => {
  const context = useContext(ShortcutsContext);
  if (!context) {
    throw new Error('useShortcuts must be used within a ShortcutsProvider');
  }
  return context;
};

/**
 * Hook to register page-level shortcut actions (Print, Save, New, etc.)
 */
export const useRegisterShortcuts = (handlers: ShortcutHandlers) => {
  const { registerHandlers } = useShortcuts();
  
  useEffect(() => {
    const unregister = registerHandlers(handlers);
    return unregister;
  }, [registerHandlers, handlers]);
};

interface ShortcutsProviderProps {
  children: React.ReactNode;
  activeTab: PortalTab;
  onTabChange: (tab: PortalTab) => void;
  onToggleTheme?: () => void;
}

const TAB_INDEX_MAP: Record<string, PortalTab> = {
  '1': 'dashboard',
  '2': 'farmer-id',
  'p': 'passport-photo',
  '3': 'maha-id',
  '4': 'adhar-card',
  '5': 'pan-card',
  '6': 'electoral-card',
  '7': 'mera-rashan-card',
  '8': 'ayushman-card',
  '9': 'abha-card',
  'e': 'eshram-card',
  '0': 'pocra-consent',
};

export const ShortcutsProvider: React.FC<ShortcutsProviderProps> = ({
  children,
  activeTab,
  onTabChange,
  onToggleTheme,
}) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const activeHandlersRef = useRef<ShortcutHandlers>({});

  const showToast = useCallback((badge: string, text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev.slice(-2), { id, badge, text, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  const registerHandlers = useCallback((handlers: ShortcutHandlers) => {
    activeHandlersRef.current = handlers;
    return () => {
      activeHandlersRef.current = {};
    };
  }, []);

  const openHelp = useCallback(() => setIsHelpOpen(true), []);
  const closeHelp = useCallback(() => setIsHelpOpen(false), []);

  // Global keydown event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept typing in inputs or textareas for plain characters,
      // but DO intercept Ctrl+P, Ctrl+S, Alt+number everywhere so cyber cafe users never get blocked!
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // 1. HELP MODAL: '?' key (when not typing) or F1
      if ((e.key === '?' && !isInput && !isCtrlOrCmd) || e.key === 'F1') {
        e.preventDefault();
        setIsHelpOpen((prev) => !prev);
        return;
      }

      // 2. ESC: Close help modal
      if (e.key === 'Escape' && isHelpOpen) {
        e.preventDefault();
        setIsHelpOpen(false);
        return;
      }

      // 3. CTRL + P: PRINT ACTION
      if (isCtrlOrCmd && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        e.stopPropagation();

        if (activeHandlersRef.current.onPrint) {
          showToast('Ctrl+P', 'कार्ड प्रिंट कमांड सुरू करत आहे...', 'info');
          activeHandlersRef.current.onPrint();
        } else {
          // Fallback: trigger normal print or notify
          showToast('Ctrl+P', 'प्रिंट पृष्ठ उघडत आहे...', 'info');
          window.print();
        }
        return;
      }

      // 4. CTRL + S: SAVE DATA / DOWNLOAD DRAFT
      if (isCtrlOrCmd && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();

        if (activeHandlersRef.current.onSave) {
          showToast('Ctrl+S', 'डेटा / कार्ड यशस्वीरित्या सेव्ह केले!', 'success');
          activeHandlersRef.current.onSave();
        } else {
          showToast('Ctrl+S', 'सध्याचा डेटा सुरक्षित ठेवला आहे.', 'success');
        }
        return;
      }

      // 5. CTRL + D or ALT + D: DOWNLOAD PDF
      if ((isCtrlOrCmd && (e.key === 'd' || e.key === 'D')) || (e.altKey && (e.key === 'd' || e.key === 'D'))) {
        if (!isInput || e.altKey) {
          e.preventDefault();
          e.stopPropagation();

          if (activeHandlersRef.current.onDownloadPdf) {
            showToast('Ctrl+D', 'HD PDF डाऊनलोड तयार होत आहे...', 'info');
            activeHandlersRef.current.onDownloadPdf();
          } else {
            showToast('Ctrl+D', 'PDF डाऊनलोड उपलब्ध नाही', 'warning');
          }
          return;
        }
      }

      // 6. CTRL + N or ALT + N: NEW CARD / RESET
      if ((isCtrlOrCmd && (e.key === 'n' || e.key === 'N')) || (e.altKey && (e.key === 'n' || e.key === 'N'))) {
        // Prevent default browser new window if Alt+N or not in input
        if (e.altKey || (!isInput && e.key.toLowerCase() === 'n')) {
          e.preventDefault();
          e.stopPropagation();

          if (activeHandlersRef.current.onNewCard) {
            showToast('Alt+N', 'नवीन कार्ड तयार करण्यासाठी फॉर्म तयार केला.', 'success');
            activeHandlersRef.current.onNewCard();
          }
          return;
        }
      }

      // 7. CTRL + B or ALT + V: TOGGLE FRONT / BACK VIEW
      if ((isCtrlOrCmd && (e.key === 'b' || e.key === 'B')) || (e.altKey && (e.key === 'v' || e.key === 'V'))) {
        if (!isInput) {
          e.preventDefault();
          e.stopPropagation();

          if (activeHandlersRef.current.onToggleView) {
            showToast('Ctrl+B', 'कार्ड बाजू स्विच केली (Front/Back)', 'info');
            activeHandlersRef.current.onToggleView();
          }
          return;
        }
      }

      // 8. CTRL + LEFT / RIGHT ARROWS: PREVIOUS / NEXT CARD IN BATCH
      if (isCtrlOrCmd && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        if (!isInput) {
          e.preventDefault();
          e.stopPropagation();

          if (e.key === 'ArrowRight' && activeHandlersRef.current.onNextCard) {
            showToast('Ctrl+→', 'पुढील कार्ड निवडले', 'info');
            activeHandlersRef.current.onNextCard();
          } else if (e.key === 'ArrowLeft' && activeHandlersRef.current.onPrevCard) {
            showToast('Ctrl+←', 'मागील कार्ड निवडले', 'info');
            activeHandlersRef.current.onPrevCard();
          }
          return;
        }
      }

      // 9. ALT + 1 to 8: FAST TAB NAVIGATION
      if (e.altKey && !isCtrlOrCmd && TAB_INDEX_MAP[e.key]) {
        e.preventDefault();
        e.stopPropagation();
        const targetTab = TAB_INDEX_MAP[e.key];
        onTabChange(targetTab);
        showToast(`Alt+${e.key}`, `विभाग बदलला: ${targetTab.toUpperCase()}`, 'info');
        return;
      }

      // 10. ALT + T: TOGGLE THEME
      if (e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        e.stopPropagation();
        if (onToggleTheme) {
          onToggleTheme();
          showToast('Alt+T', 'थीम बदलली (Light/Dark Mode)', 'info');
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isHelpOpen, onTabChange, onToggleTheme, showToast]);

  return (
    <ShortcutsContext.Provider
      value={{
        registerHandlers,
        showToast,
        isHelpOpen,
        openHelp,
        closeHelp,
        activeTab,
        onTabChange,
      }}
    >
      {children}

      {/* Floating Tactical Toast Notifications for High-Volume Users */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none no-print">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-2xl border text-xs sm:text-sm font-bold backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200 pointer-events-auto ${
                toast.type === 'info'
                  ? 'bg-slate-900/90 text-white border-blue-500/40'
                  : toast.type === 'warning'
                  ? 'bg-amber-950/90 text-amber-200 border-amber-500/40'
                  : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
              }`}
            >
              <span className="px-2 py-0.5 rounded-lg bg-white/20 text-white font-mono text-[11px] font-black border border-white/20">
                {toast.badge}
              </span>
              <span>{toast.text}</span>
            </div>
          ))}
        </div>
      )}
    </ShortcutsContext.Provider>
  );
};

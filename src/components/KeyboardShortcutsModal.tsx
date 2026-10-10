import React from 'react';
import { X, Keyboard, Printer, Save, Download, Plus, Layers, ArrowLeftRight, Moon, Sparkles } from 'lucide-react';
import { useShortcuts } from '../context/ShortcutsContext';

export const KeyboardShortcutsModal: React.FC = () => {
  const { isHelpOpen, closeHelp } = useShortcuts();

  if (!isHelpOpen) return null;

  const shortcutGroups = [
    {
      title: 'प्रिंटिंग आणि सेव्हिंग (Printing & Saving)',
      items: [
        {
          keys: ['Ctrl', 'P'],
          desc: 'थेट कार्ड किंवा दस्तऐवज प्रिंट करा (Direct PVC / A4 Print)',
          icon: Printer,
          badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        },
        {
          keys: ['Ctrl', 'S'],
          desc: 'शेतकरी डेटा / कार्ड मसुदा सेव्ह करा (Save Data / Draft)',
          icon: Save,
          badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
        },
        {
          keys: ['Ctrl', 'D'],
          desc: 'HD PDF फाईल त्वरित डाऊनलोड करा (Download PDF)',
          icon: Download,
          badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        },
      ],
    },
    {
      title: 'कार्ड व्यवस्थापन व नेव्हिगेशन (Card Workflow & View)',
      items: [
        {
          keys: ['Alt', 'N'],
          desc: 'नवीन कार्ड / फॉर्म रिसेट करा (New Card / Clear Form)',
          icon: Plus,
          badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
        },
        {
          keys: ['Ctrl', 'B'],
          desc: 'कार्ड बाजू बदला (Toggle Front / Back Side View)',
          icon: Layers,
          badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30',
        },
        {
          keys: ['Ctrl', '← / →'],
          desc: 'बॅचमधील मागील / पुढील कार्ड निवडा (Prev / Next Card)',
          icon: ArrowLeftRight,
          badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        },
      ],
    },
    {
      title: 'जलद विभाग निवड (Fast Section Switcher)',
      items: [
        { keys: ['Alt', '1'], desc: 'डॅशबोर्ड (Dashboard)' },
        { keys: ['Alt', '2'], desc: 'फार्मर आयडी कार्ड (Farmer ID Card)' },
        { keys: ['Alt', 'P'], desc: 'पासपोर्ट फोटो (Passport Photo)' },
        { keys: ['Alt', '3'], desc: 'महा आयडी कार्ड (Maha ID Card)' },
        { keys: ['Alt', '4'], desc: 'आधार कार्ड (Adhar Card)' },
        { keys: ['Alt', '5'], desc: 'पॅन कार्ड (Pan Card)' },
        { keys: ['Alt', '6'], desc: 'मतदार ओळखपत्र (Electoral Card)' },
        { keys: ['Alt', '7'], desc: 'रेशन कार्ड (Rashan Card)' },
        { keys: ['Alt', '8'], desc: 'आयुष्मान कार्ड (Ayushman Card)' },
        { keys: ['Alt', '9'], desc: 'आभा कार्ड (Abha Card)' },
        { keys: ['Alt', 'E'], desc: 'ई-श्रम कार्ड (E Shram Card)' },
        { keys: ['Alt', '0'], desc: 'पोक्रा संमतीपत्र (PoCRA Consent)' },
      ],
    },
    {
      title: 'इतर शॉर्टकट्स (General)',
      items: [
        {
          keys: ['?'],
          desc: 'हा शॉर्टकट मार्गदर्शक उघडा / बंद करा (Toggle Shortcuts Guide)',
          icon: Keyboard,
        },
        {
          keys: ['Alt', 'T'],
          desc: 'डार्क / लाईट थीम बदला (Toggle Dark/Light Mode)',
          icon: Moon,
        },
        {
          keys: ['Esc'],
          desc: 'कोणताही पॉपअप किंवा मॉडेल बंद करा (Close Modal)',
        },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200 no-print"
      onClick={closeHelp}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#064e3b] via-[#094d28] to-[#047857] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-300/30">
              <Keyboard className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>कीबोर्ड शॉर्टकट्स (Keyboard Shortcuts)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold uppercase tracking-wider">
                  Super Fast
                </span>
              </h3>
              <p className="text-xs text-emerald-100/80 font-medium">
                सायबर कॅफे व सेतू केंद्र ऑपरेटरसाठी अतिवेगवान काम करण्याचे शॉर्टकट्स
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeHelp}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
          {/* Tip Banner */}
          <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-emerald-950 dark:text-emerald-200">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold leading-relaxed">
              <strong>टीप:</strong> कार्ड तयार करताना थेट <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-emerald-300 dark:border-emerald-700 font-mono font-bold text-emerald-900 dark:text-emerald-300">Ctrl + P</kbd> दाबून प्रिंट करता येते आणि <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-emerald-300 dark:border-emerald-700 font-mono font-bold text-emerald-900 dark:text-emerald-300">Ctrl + S</kbd> ने डेटा त्वरित सेव्ह होतो.
            </p>
          </div>

          <div className="space-y-5">
            {shortcutGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  {group.title}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {group.items.map((item, iIdx) => (
                    <div
                      key={iIdx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2 pr-2">
                        {item.icon && (
                          <item.icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                        )}
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 line-clamp-1">
                          {item.desc}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {item.keys.map((k, kIdx) => (
                          <kbd
                            key={kIdx}
                            className="px-2 py-1 text-[11px] font-mono font-black bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs min-w-[26px] text-center"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>कधीही हा मेनू पाहण्यासाठी कीबोर्डवर <strong>?</strong> किंवा <strong>F1</strong> दाबा.</span>
          <button
            type="button"
            onClick={closeHelp}
            className="px-4 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs cursor-pointer transition-colors"
          >
            समजले (Got it)
          </button>
        </div>
      </div>
    </div>
  );
};

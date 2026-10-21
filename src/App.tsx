import React, { useState, useEffect } from 'react';
import { initialFormData, screenshotFarmersList } from './utils/sampleData';
import { FarmerFormData } from './types/form';
import { useTheme } from './context/ThemeContext';
import { ShortcutsProvider } from './context/ShortcutsContext';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { TopNavbar } from './components/TopNavbar';
import { Sidebar, PortalTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { FarmerIdCardSection } from './components/FarmerIdCardSection';
import { PassportPhotoSection } from './components/PassportPhotoSection';
import { PhotoResizerSection } from './components/PhotoResizerSection';
import { WhatsAppPrintSection } from './components/WhatsAppPrintSection';
import { MyQrPaymentSection } from './components/MyQrPaymentSection';
import { MahaIdCardSection } from './components/MahaIdCardSection';
import { AadhaarCardSection } from './components/AadhaarCardSection';
import { PanCardSection } from './components/PanCardSection';
import { MeraRashanCardSection } from './components/MeraRashanCardSection';
import { AyushmanCardSection } from './components/AyushmanCardSection';
import { AbhaCardSection } from './components/AbhaCardSection';
import { EShramCardSection } from './components/EShramCardSection';
import { ElectoralCardSection } from './components/ElectoralCardSection';
import { PocraConsentSection } from './components/PocraConsentSection';
import { SwayamGhoshanaSection } from './components/SwayamGhoshanaSection';

export default function App() {
  const [activeTab, setActiveTab] = useState<PortalTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toggleTheme } = useTheme();

  // Farmers state (used by SwayamGhoshanaSection)
  const [farmerList] = useState<FarmerFormData[]>(() => {
    return screenshotFarmersList.map((f, i) => ({
      ...f,
      id: `farmer-${Date.now()}-${i + 1}`,
    }));
  });
  const [activeFarmerIndex] = useState<number>(0);

  // Active farmer data
  const formData = farmerList[activeFarmerIndex] || farmerList[0] || initialFormData;

  // Clean up any residual print portal from document body
  useEffect(() => {
    document.getElementById('app-print-portal')?.remove();
  }, []);

  return (
    <ShortcutsProvider
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onToggleTheme={toggleTheme}
    >
      <div className="min-h-screen bg-[#f4f6f8] dark:bg-slate-950 flex flex-col font-sans text-gray-900 dark:text-slate-100 transition-colors duration-200">
        {/* 1. TOP HEADER */}
        <TopNavbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* 2. BODY: LEFT SIDEBAR + MAIN CONTENT AREA */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <Sidebar
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setIsSidebarOpen(false);
            }}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
              {/* TAB 1: DASHBOARD */}
              {activeTab === 'dashboard' && (
                <DashboardView onNavigate={(tab) => setActiveTab(tab)} />
              )}

              {/* TAB 2: FARMER ID CARD */}
              {activeTab === 'farmer-id' && (
                <FarmerIdCardSection />
              )}

              {/* TAB 2.5: PASSPORT PHOTO */}
              {activeTab === 'passport-photo' && (
                <PassportPhotoSection />
              )}

              {/* TAB 2.55: PHOTO RESIZER */}
              {activeTab === 'photo-resizes' && (
                <PhotoResizerSection />
              )}

              {/* TAB 2.6: WHATSAPP PRINT */}
              {activeTab === 'whatsapp-print' && (
                <WhatsAppPrintSection />
              )}

              {/* TAB 2.7: MY QR PAYMENT (POS) */}
              {activeTab === 'my-qr-payment' && (
                <MyQrPaymentSection />
              )}

              {/* TAB 3: MAHA ID CARD */}
              {activeTab === 'maha-id' && (
                <MahaIdCardSection />
              )}

              {/* TAB 4: ADHAR CARD */}
              {activeTab === 'adhar-card' && (
                <AadhaarCardSection />
              )}

              {/* TAB 5: PAN CARD */}
              {activeTab === 'pan-card' && (
                <PanCardSection />
              )}

              {/* TAB 5.1: ELECTORAL CARD (मतदार ओळखपत्र) */}
              {activeTab === 'electoral-card' && (
                <ElectoralCardSection />
              )}

              {/* TAB 5.2: RASHAN CARD (रेशन कार्ड) */}
              {activeTab === 'mera-rashan-card' && (
                <MeraRashanCardSection />
              )}

              {/* TAB 5.3: AYUSHMAN CARD (आयुष्मान भारत कार्ड) */}
              {activeTab === 'ayushman-card' && (
                <AyushmanCardSection />
              )}

              {/* TAB 5.4: ABHA CARD (आयुष्मान भारत हेल्थ कार्ड) */}
              {activeTab === 'abha-card' && (
                <AbhaCardSection />
              )}

              {/* TAB 5.5: E SHRAM CARD (ई-श्रम कार्ड) */}
              {activeTab === 'eshram-card' && (
                <EShramCardSection />
              )}

              {/* TAB 6: POCRA CONSENT LETTER */}
              {activeTab === 'pocra-consent' && (
                <PocraConsentSection />
              )}

              {/* TAB 7: SWAYAM GHOSHANA PATRA (स्वयंघोषणापत्र) */}
              {activeTab === 'swayam-ghoshana' && (
                <SwayamGhoshanaSection farmerFormData={formData} />
              )}
            </div>
          </main>
        </div>

        {/* Global Keyboard Shortcuts Reference Modal */}
        <KeyboardShortcutsModal />
      </div>
    </ShortcutsProvider>
  );
}

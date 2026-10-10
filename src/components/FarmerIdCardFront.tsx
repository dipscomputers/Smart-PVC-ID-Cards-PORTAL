import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { FarmerCardData } from '../types/farmerCard';
import { FARMER_ID_BANK1_TEMPLATE } from '../assets/farmerTemplateData';

interface CardFrontProps {
  card: FarmerCardData;
  isPrintMode?: boolean;
  photoFitMode?: 'cover' | 'contain' | 'fill';
}

// Format Aadhaar number as "XXXX XXXX XXXX"
function formatAadhaar(val?: string): string {
  if (!val) return '-';
  const clean = val.replace(/\s+/g, '');
  if (clean.length === 12) {
    return `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8, 12)}`;
  }
  return val;
}

// Format Farmer ID without spaces
function formatFarmerId(val?: string): string {
  if (!val) return '49488379429';
  return val.replace(/\s+/g, '');
}

/**
 * FarmerIdCardFront: Official AgriStack "शेती परिचय पत्र" PVC Front Card
 * Perfectly Balanced Alignment & Sizing:
 * - Reduced compact passport photo on left (height 36.5%, width 17.5%, crisp 1.5px black border)
 * - Clear bilingual name block (Marathi + English with "Name :" label) spanning full width (never cut off)
 * - Dedicated detail rows column with perfectly uniform line spacing (DOB, Gender, Mobile, Aadhaar)
 * - Square QR code on right, neatly positioned without overlapping any text
 * - Dark forest green footer with centered yellow "फार्मर आयडी :" label and bold white ID
 */
export const FarmerIdCardFront: React.FC<CardFrontProps> = ({ 
  card, 
  isPrintMode = false,
  photoFitMode = 'cover' 
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const displayNameMr = (card.fullNameMr || card.fullNameEn || '').trim();
  const displayNameEn = (card.fullNameEn || card.fullNameMr || '').trim().toUpperCase();
  const displayDob = (card.dob || '').trim();
  const displayGender = (card.gender || '').trim();
  const displayMobile = (card.mobile || '').trim();
  const displayAadhaar = formatAadhaar(card.aadhaarNo);
  const displayFarmerId = formatFarmerId(card.farmerId);

  const isEnLong = displayNameEn.length > 22;
  const isEnVeryLong = displayNameEn.length > 28;
  const isMrLong = displayNameMr.length > 24;

  useEffect(() => {
    if (!card.farmerId && !card.fullNameEn && !card.fullNameMr && !card.mobile) {
      setQrCodeDataUrl('');
      return;
    }

    const qrPayload = JSON.stringify({
      id: card.farmerId || '',
      name: displayNameEn,
      dob: displayDob,
      mobile: displayMobile,
      aadhaar: card.aadhaarNo || '',
      auth: 'AgriStack-MH-VERIFIED',
    });

    QRCode.toDataURL(qrPayload, {
      margin: 1,
      width: 260,
      color: {
        dark: '#014728',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.warn('QR Code generation error:', err));
  }, [card, displayNameEn, displayDob, displayMobile]);

  return (
    <div
      style={{
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
        borderRadius: isPrintMode ? '3mm' : '10px',
        border: '1.5px solid #014728',
        width: isPrintMode ? '85.6mm' : '100%',
        maxWidth: isPrintMode ? '85.6mm' : '420px',
        height: isPrintMode ? '54.0mm' : '100%',
        aspectRatio: isPrintMode ? 'unset' : '85.6 / 54',
        backgroundColor: '#d5ebd6',
        backgroundImage: `url(${FARMER_ID_BANK1_TEMPLATE})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* 1. LEFT: PASSPORT PHOTOGRAPH (Compact, exact 3:4 passport ratio, crisp 1.5px border, zero gap, perfect center fit) */}
      <div
        style={{
          position: 'absolute',
          left: '3.2%',
          top: '23.5%',
          width: '18.0%',
          height: '38.0%',
          backgroundColor: '#ffffff',
          borderRadius: '1.5px',
          border: '1.5px solid #000000',
          padding: '0px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
          zIndex: 2,
        }}
      >
        {card.photoUrl && card.photoUrl.trim() !== '' ? (
          <img
            src={card.photoUrl}
            alt="Farmer Photo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: photoFitMode === 'contain' ? 'contain' : (photoFitMode === 'cover' ? 'cover' : 'fill'),
              objectPosition: 'center center',
              backgroundColor: '#ffffff',
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#e6f4ea',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#065f46',
              fontSize: isPrintMode ? '2.1mm' : '8.5px',
              fontWeight: 800,
              textAlign: 'center',
              lineHeight: 1.2,
            }}
          >
            <span>फोटो</span>
            <span>(Photo)</span>
          </div>
        )}
      </div>

      {/* 2. CENTER: ALL 6 DETAIL ROWS (Uniform, perfectly balanced line spacing across all rows, 74% full width) */}
      <div
        style={{
          position: 'absolute',
          left: '23.5%',
          top: '24.0%',
          bottom: '18.5%',
          right: '2.5%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#014728',
          textAlign: 'left',
          zIndex: 2,
        }}
      >
        {/* Row 1: Marathi Name */}
        <div
          style={{
            fontSize: isPrintMode ? (isMrLong ? '2.5mm' : '2.85mm') : (isMrLong ? '10.5px' : '12px'),
            fontWeight: 900,
            color: '#014728',
            whiteSpace: 'nowrap',
            lineHeight: 1.2,
          }}
        >
          नाव : <span style={{ color: '#014728' }}>{displayNameMr}</span>
        </div>

        {/* Row 2: English Name - Full width without truncation */}
        <div
          style={{
            fontSize: isPrintMode 
              ? (isEnVeryLong ? '2.0mm' : isEnLong ? '2.2mm' : '2.4mm') 
              : (isEnVeryLong ? '9px' : isEnLong ? '9.8px' : '10.6px'),
            fontWeight: 900,
            color: '#014728',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            letterSpacing: '0.2px',
            lineHeight: 1.2,
          }}
        >
          NAME : <span style={{ color: '#014728' }}>{displayNameEn}</span>
        </div>

        {/* Row 3: Date of Birth */}
        <div
          style={{
            fontSize: isPrintMode ? '2.25mm' : '9.6px',
            fontWeight: 800,
            color: '#014728',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
          }}
        >
          जन्म दिनांक / DOB : <span style={{ fontWeight: 900 }}>{displayDob}</span>
        </div>

        {/* Row 4: Gender */}
        <div
          style={{
            fontSize: isPrintMode ? '2.25mm' : '9.6px',
            fontWeight: 800,
            color: '#014728',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
          }}
        >
          लिंग / Gender : <span style={{ fontWeight: 900 }}>{displayGender}</span>
        </div>

        {/* Row 5: Mobile */}
        <div
          style={{
            fontSize: isPrintMode ? '2.25mm' : '9.6px',
            fontWeight: 800,
            color: '#014728',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
          }}
        >
          मोबाईल / Mobile : <span style={{ fontWeight: 900 }}>{displayMobile}</span>
        </div>

        {/* Row 6: Aadhaar Number */}
        <div
          style={{
            fontSize: isPrintMode ? '2.25mm' : '9.6px',
            fontWeight: 800,
            color: '#014728',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
          }}
        >
          आधार नं / Aadhaar No :{' '}
          <span style={{ fontWeight: 900, letterSpacing: '0.4px' }}>
            {displayAadhaar}
          </span>
        </div>
      </div>

      {/* 3. RIGHT: SQUARE QR CODE (Positioned next to middle-bottom details) */}
      <div
        style={{
          position: 'absolute',
          right: '2.5%',
          top: '46.0%',
          width: '17.5%',
          aspectRatio: '1 / 1',
          backgroundColor: '#ffffff',
          borderRadius: '3px',
          border: '1px solid rgba(1, 71, 40, 0.25)',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
          zIndex: 3,
        }}
      >
        {qrCodeDataUrl && qrCodeDataUrl.trim() !== '' ? (
          <img
            src={qrCodeDataUrl}
            alt="AgriStack QR"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', backgroundColor: '#f3f4f6', borderRadius: '3px' }} />
        )}
      </div>

      {/* 5. BOTTOM FOOTER BAR: Centered Yellow Label "फार्मर आयडी :" + Bold White ID */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: '100%',
          height: '14.8%',
          backgroundColor: '#014728',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isPrintMode ? '2.5mm' : '10px',
          color: '#ffffff',
          userSelect: 'none',
          zIndex: 3,
        }}
      >
        <span
          style={{
            color: '#FAF119',
            fontWeight: 900,
            fontSize: isPrintMode ? '3.5mm' : '14px',
            letterSpacing: '0.5px',
          }}
        >
          फार्मर आयडी :
        </span>
        <span
          style={{
            color: '#ffffff',
            fontWeight: 900,
            letterSpacing: isPrintMode ? '0.5mm' : '2px',
            fontSize: isPrintMode ? '3.6mm' : '14.5px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {displayFarmerId}
        </span>
      </div>
    </div>
  );
};

import React from 'react';
import { FarmerCardData } from '../types/farmerCard';
import { FarmerIdCardFront } from './FarmerIdCardFront';
import { FarmerIdCardBack } from './FarmerIdCardBack';

interface FarmerIdPrintPortalProps {
  activeCard: FarmerCardData;
  cards: FarmerCardData[];
  photoFitMode?: 'cover' | 'contain' | 'fill';
}

export const FarmerIdPrintPortal: React.FC<FarmerIdPrintPortalProps> = ({
  activeCard,
  cards,
  photoFitMode = 'cover',
}) => {
  return (
    <div
      id="farmer-print-portal-root"
      style={{
        position: 'fixed',
        left: '0px',
        top: '0px',
        width: '210mm',
        zIndex: -9999,
        opacity: 1,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {/* 1. SINGLE PVC CARD PRINT CONTAINER (Direct 85.6mm × 54.0mm) */}
      <div id="printable-farmer-pvc-direct" style={{ width: '85.6mm', overflow: 'hidden' }}>
        <style
          dangerouslySetInnerHTML={{
            __html: `
            @page {
              size: 85.6mm 54.0mm landscape;
              margin: 0 !important;
            }
            @media print {
              html, body {
                width: 85.6mm !important;
                height: 54.0mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: transparent !important;
              }
              .pvc-page-break {
                page-break-after: always !important;
                break-after: page !important;
              }
            }
          `,
          }}
        />
        <div className="pvc-page-break" style={{ width: '85.6mm', height: '54.0mm' }}>
          <FarmerIdCardFront card={activeCard} isPrintMode={true} photoFitMode={photoFitMode} />
        </div>
        <div style={{ width: '85.6mm', height: '54.0mm' }}>
          <FarmerIdCardBack card={activeCard} isPrintMode={true} />
        </div>
      </div>

      {/* 2. SINGLE CARD A4 SHEET (Front & Back Side-by-Side on A4 - Exact 10mm Top Margin) */}
      {activeCard && (
        <div
          id="printable-farmer-a4-sheet"
          className="a4-print-sheet farmer-id-a4-sheet"
          style={{
            width: '210mm',
            minHeight: '297mm',
            height: '297mm',
            paddingTop: '0mm',
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          {/* Exact 10mm Top Margin Spacer for A4 Print */}
          <div
            className="a4-top-spacer-10mm"
            style={{
              width: '100%',
              height: '10mm',
              minHeight: '10mm',
              maxHeight: '10mm',
              flexShrink: 0,
            }}
          />
          <div
            className="a4-cards-row"
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'center',
              gap: '2mm',
              width: '100%',
            }}
          >
            <div className="card-scaled-box">
              <FarmerIdCardFront card={activeCard} isPrintMode={true} photoFitMode={photoFitMode} />
            </div>
            <div className="card-scaled-box">
              <FarmerIdCardBack card={activeCard} isPrintMode={true} />
            </div>
          </div>
        </div>
      )}

      {/* 3. MULTI-CARD A4 SHEET (All Cards on 1 A4 Page - Exact 10mm Top Margin) */}
      {cards.length > 0 && (
        <div
          id="printable-farmer-all-a4-sheet"
          className="a4-print-sheet farmer-id-a4-sheet"
          style={{
            width: '210mm',
            minHeight: '297mm',
            height: '297mm',
            paddingTop: '0mm',
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          {/* Exact 10mm Top Margin Spacer for A4 Print */}
          <div
            className="a4-top-spacer-10mm"
            style={{
              width: '100%',
              height: '10mm',
              minHeight: '10mm',
              maxHeight: '10mm',
              flexShrink: 0,
            }}
          />
          <div
            className="a4-cards-grid"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '2.5mm',
              width: '100%',
            }}
          >
            {cards.slice(0, 5).map((c, idx) => (
              <div
                key={c.id || idx}
                className="a4-cards-row"
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  gap: '2mm',
                  width: '100%',
                }}
              >
                <div className="card-scaled-box">
                  <FarmerIdCardFront card={c} isPrintMode={true} photoFitMode={photoFitMode} />
                </div>
                <div className="card-scaled-box">
                  <FarmerIdCardBack card={c} isPrintMode={true} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

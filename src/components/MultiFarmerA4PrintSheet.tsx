import React, { useRef, useState, useEffect } from 'react';
import { FarmerFormData } from '../types/form';
import { AgriRecordCardFront, AgriRecordCardBack } from './AgriRecordCard';
import { generateFarmerQrCode } from '../utils/qrHelper';

interface MultiFarmerA4PrintSheetProps {
  farmers: FarmerFormData[];
  id?: string;
  className?: string;
  isResponsivePreview?: boolean;
  isMirrorPrint?: boolean;
  showCropMarks?: boolean;
  showHeader?: boolean;
}

/**
 * Standard A4 Multi-Card Page Layout (5-Card PVC Sheet / Dragon Sheet)
 * Exact CR80 standard specifications matching Indian CSC / Cyber Cafe 5-PVC sheet:
 * - Up to 5 complete Farmer ID Cards per A4 sheet (210 mm x 297 mm)
 * - Front Card (85.6 mm x 54.0 mm) on Left Column
 * - Back Card (85.6 mm x 54.0 mm) on Right Column
 * - Horizontal Gap between Front & Back: 2.5 mm
 * - Row width: 85.6 + 2.5 + 85.6 = 173.7 mm (Centered on 210 mm sheet => 18.15 mm left/right margin)
 * - Height: 54.0 mm each, with 3.5 mm vertical spacing between rows
 * - Top margin: 7.0 mm
 * - Header at top right: "A4 5-PVC शीट लेआउट (X/5 कार्ड)"
 */
export const MultiFarmerA4PrintSheet: React.FC<MultiFarmerA4PrintSheetProps> = ({
  farmers,
  id = 'printable-multi-farmer-a4-sheet',
  className = '',
  isResponsivePreview = false,
  isMirrorPrint = false,
  showCropMarks = false,
  showHeader = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sheetWidth, setSheetWidth] = useState<number>(580);
  const [qrCodes, setQrCodes] = useState<Record<number, string>>({});

  // Generate QR codes for all farmers
  useEffect(() => {
    let isMounted = true;
    Promise.all(farmers.map((f) => generateFarmerQrCode(f))).then((results) => {
      if (!isMounted) return;
      const map: Record<number, string> = {};
      results.forEach((qr, idx) => {
        map[idx] = qr;
      });
      setQrCodes(map);
    });
    return () => {
      isMounted = false;
    };
  }, [farmers]);

  // Responsive scaling observer
  useEffect(() => {
    if (!isResponsivePreview || !containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        if (w > 100) setSheetWidth(w);
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [isResponsivePreview]);

  // Limit up to 5 cards per page (standard 5-card PVC sheet)
  const displayFarmers = farmers.slice(0, 5);

  if (isResponsivePreview) {
    const pxPerMm = sheetWidth / 210;
    const cardWidth = 85.6 * pxPerMm;
    const cardHeight = 54.0 * pxPerMm;
    const gap = 2.5 * pxPerMm;
    const rowGap = 3.5 * pxPerMm;
    const topMargin = 7.0 * pxPerMm;
    const scale = cardWidth / 600;

    return (
      <div className={`flex flex-col items-center w-full ${className}`}>
        <div
          ref={containerRef}
          className="relative bg-white shadow-2xl rounded-sm border border-gray-300 overflow-hidden mx-auto transition-all select-none"
          style={{
            width: '100%',
            maxWidth: '640px',
            aspectRatio: '210 / 297',
            backgroundColor: '#ffffff',
            boxSizing: 'border-box',
          }}
        >
          {/* Header indicator matching exact screenshot top-right placement */}
          {showHeader && (
            <div
              className="absolute top-2 right-4 text-[11px] sm:text-[12px] font-bold text-gray-500 tracking-wide font-sans select-none"
              style={{ letterSpacing: '0.02em' }}
            >
              A4 5-PVC शीट लेआउट ({displayFarmers.length}/5 कार्ड)
            </div>
          )}

          {/* Cards Rows */}
          <div
            className="w-full flex flex-col items-center"
            style={{
              paddingTop: `${topMargin + (showHeader ? 18 : 6)}px`,
              gap: `${rowGap}px`,
            }}
          >
            {displayFarmers.map((farmer, idx) => (
              <div
                key={farmer.id || idx}
                className="flex flex-row items-center justify-center relative"
                style={{ gap: `${gap}px` }}
              >
                {/* FRONT CARD */}
                <div
                  className="relative group transition-all"
                  style={{
                    width: `${cardWidth}px`,
                    height: `${cardHeight}px`,
                    minWidth: `${cardWidth}px`,
                    minHeight: `${cardHeight}px`,
                    maxWidth: `${cardWidth}px`,
                    maxHeight: `${cardHeight}px`,
                    overflow: 'hidden',
                    borderRadius: `${2.8 * pxPerMm}px`,
                    border: '1px solid #1e5631',
                    boxSizing: 'border-box',
                    transform: isMirrorPrint ? 'scaleX(-1)' : 'none',
                    transformOrigin: 'center center',
                  }}
                >
                  <div
                    style={{
                      width: '600px',
                      height: '378px',
                      transform: `scale(${scale})`,
                      transformOrigin: '0 0',
                    }}
                  >
                    <AgriRecordCardFront
                      data={farmer}
                      qrCodeUrl={qrCodes[idx] || ''}
                      isPrintMode={true}
                    />
                  </div>
                </div>

                {/* BACK CARD */}
                <div
                  className="relative group transition-all"
                  style={{
                    width: `${cardWidth}px`,
                    height: `${cardHeight}px`,
                    minWidth: `${cardWidth}px`,
                    minHeight: `${cardHeight}px`,
                    maxWidth: `${cardWidth}px`,
                    maxHeight: `${cardHeight}px`,
                    overflow: 'hidden',
                    borderRadius: `${2.8 * pxPerMm}px`,
                    border: '1px solid #1e5631',
                    boxSizing: 'border-box',
                    transform: isMirrorPrint ? 'scaleX(-1)' : 'none',
                    transformOrigin: 'center center',
                  }}
                >
                  <div
                    style={{
                      width: '600px',
                      height: '378px',
                      transform: `scale(${scale})`,
                      transformOrigin: '0 0',
                    }}
                  >
                    <AgriRecordCardBack
                      data={farmer}
                      isPrintMode={true}
                    />
                  </div>
                </div>

                {/* Subtle crop guides indicator if enabled */}
                {showCropMarks && (
                  <div className="absolute -inset-1 border border-dashed border-gray-400 pointer-events-none opacity-40 rounded" />
                )}
              </div>
            ))}
          </div>

          {/* Footer note in preview */}
          <div className="absolute bottom-2 inset-x-0 flex flex-col items-center text-center px-4 select-none opacity-40 pointer-events-none">
            <span className="text-[10px] font-bold text-gray-500 tracking-wider">
              A4 PVC शीट (210 mm × 297 mm) • 85.6 × 54.0 mm CR80 कार्ड्स
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 1:1 Physical Print Sheet for Browser Printing & High-DPI PDF Capture
  return (
    <div
      id={id}
      className={`multi-farmer-a4-sheet a4-print-sheet bg-white mx-auto ${className}`}
      style={{
        width: '210mm',
        minHeight: '297mm',
        height: '297mm',
        maxHeight: '297mm',
        backgroundColor: '#ffffff',
        paddingTop: '6.0mm',
        paddingLeft: '0mm',
        paddingRight: '0mm',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top right header matching user screenshot: "A4 5-PVC शीट लेआउट (X/5 कार्ड)" */}
      {showHeader && (
        <div
          className="a4-sheet-top-header"
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-end',
            paddingRight: '14mm',
            paddingBottom: '2.5mm',
            fontSize: '11px',
            fontWeight: 700,
            color: '#64748b',
            letterSpacing: '0.02em',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            boxSizing: 'border-box',
          }}
        >
          A4 5-PVC शीट लेआउट ({displayFarmers.length}/5 कार्ड)
        </div>
      )}

      <div
        className="a4-cards-grid"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3.5mm',
          width: '100%',
        }}
      >
        {displayFarmers.map((farmer, idx) => (
          <div
            key={farmer.id || idx}
            className="a4-cards-row"
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2.5mm',
              width: '100%',
            }}
          >
            {/* FRONT CARD */}
            <div
              className="card-scaled-box"
              style={{
                width: '85.6mm',
                height: '54.0mm',
                minWidth: '85.6mm',
                minHeight: '54.0mm',
                maxWidth: '85.6mm',
                maxHeight: '54.0mm',
                overflow: 'hidden',
                position: 'relative',
                borderRadius: '3.0mm',
                border: '0.3mm solid #1e5631',
                boxSizing: 'border-box',
                transform: isMirrorPrint ? 'scaleX(-1)' : 'none',
                transformOrigin: 'center center',
              }}
            >
              <div
                style={{
                  width: '600px',
                  height: '378px',
                  minWidth: '600px',
                  minHeight: '378px',
                  maxWidth: '600px',
                  maxHeight: '378px',
                  transform: 'scale(0.5392125)',
                  transformOrigin: '0 0',
                }}
              >
                <AgriRecordCardFront
                  data={farmer}
                  id={`multi-front-${idx}`}
                  qrCodeUrl={qrCodes[idx] || ''}
                  isPrintMode={true}
                />
              </div>
            </div>

            {/* BACK CARD */}
            <div
              className="card-scaled-box"
              style={{
                width: '85.6mm',
                height: '54.0mm',
                minWidth: '85.6mm',
                minHeight: '54.0mm',
                maxWidth: '85.6mm',
                maxHeight: '54.0mm',
                overflow: 'hidden',
                position: 'relative',
                borderRadius: '3.0mm',
                border: '0.3mm solid #1e5631',
                boxSizing: 'border-box',
                transform: isMirrorPrint ? 'scaleX(-1)' : 'none',
                transformOrigin: 'center center',
              }}
            >
              <div
                style={{
                  width: '600px',
                  height: '378px',
                  minWidth: '600px',
                  minHeight: '378px',
                  maxWidth: '600px',
                  maxHeight: '378px',
                  transform: 'scale(0.5392125)',
                  transformOrigin: '0 0',
                }}
              >
                <AgriRecordCardBack
                  data={farmer}
                  id={`multi-back-${idx}`}
                  isPrintMode={true}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

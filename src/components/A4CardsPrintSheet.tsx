import React, { useRef, useState, useEffect } from 'react';
import { FarmerFormData } from '../types/form';
import { AgriRecordCardFront, AgriRecordCardBack } from './AgriRecordCard';

interface A4CardsPrintSheetProps {
  data: FarmerFormData;
  qrCodeUrl: string;
  id?: string;
  className?: string;
  isResponsivePreview?: boolean;
}

/**
 * Standard A4 Page Layout with Front and Back cards side-by-side at the top.
 * - Front Card: 85.6 mm x 54.0 mm
 * - Back Card: 85.6 mm x 54.0 mm
 * - Gap: 2.0 mm
 * - Alignment: Horizontal at top center of A4 sheet (210 mm x 297 mm)
 * - Remaining page: Pure White (#FFFFFF)
 */
export const A4CardsPrintSheet: React.FC<A4CardsPrintSheetProps> = ({
  data,
  qrCodeUrl,
  id = 'printable-a4-cards-sheet',
  className = '',
  isResponsivePreview = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sheetWidth, setSheetWidth] = useState<number>(560);

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

  if (isResponsivePreview) {
    // 1. Precise responsive calculations based on 210mm A4 width
    const pxPerMm = sheetWidth / 210;
    const cardWidth = 85.6 * pxPerMm;
    const cardHeight = 54.0 * pxPerMm;
    const gap = 2.0 * pxPerMm;
    const scale = cardWidth / 600; // Exact numerical scale factor, edge-to-edge

    return (
      <div className={`flex flex-col items-center w-full ${className}`}>
        {/* A4 Sheet Mockup Container: 210 x 297 mm ratio with 10mm top margin */}
        <div
          ref={containerRef}
          className="relative bg-white shadow-2xl rounded-sm border border-gray-300 overflow-hidden mx-auto transition-all flex flex-col items-center justify-start"
          style={{
            width: '100%',
            maxWidth: '620px',
            aspectRatio: '210 / 297',
            backgroundColor: '#ffffff',
            boxSizing: 'border-box',
            paddingTop: `${10 * pxPerMm}px`,
          }}
        >
          {/* Centered Cards Row: Centered horizontally with exact 2mm gap and 10mm top margin */}
          <div
            className="w-full flex flex-row items-center justify-center"
            style={{
              gap: `${gap}px`,
            }}
          >
            {/* FRONT CARD: Exact 85.6 mm x 54.0 mm, scaled edge-to-edge */}
            <div
              style={{
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                minWidth: `${cardWidth}px`,
                minHeight: `${cardHeight}px`,
                maxWidth: `${cardWidth}px`,
                maxHeight: `${cardHeight}px`,
                overflow: 'hidden',
                position: 'relative',
                borderRadius: `${3.2 * pxPerMm}px`,
                border: '1px solid #1e5631',
                boxSizing: 'border-box',
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
                  data={data}
                  qrCodeUrl={qrCodeUrl}
                  isPrintMode={true}
                />
              </div>
            </div>

            {/* BACK CARD: Exact 85.6 mm x 54.0 mm, scaled edge-to-edge */}
            <div
              style={{
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                minWidth: `${cardWidth}px`,
                minHeight: `${cardHeight}px`,
                maxWidth: `${cardWidth}px`,
                maxHeight: `${cardHeight}px`,
                overflow: 'hidden',
                position: 'relative',
                borderRadius: `${3.2 * pxPerMm}px`,
                border: '1px solid #1e5631',
                boxSizing: 'border-box',
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
                  data={data}
                  isPrintMode={true}
                />
              </div>
            </div>
          </div>

          {/* Clean footer indicator inside preview */}
          <div className="absolute bottom-6 inset-x-0 flex flex-col items-center text-center px-4 select-none opacity-40">
            <span className="text-[11px] font-bold text-gray-500 tracking-wider">
              A4 PORTRAIT SHEET (210 mm × 297 mm)
            </span>
            <span className="text-[9.5px] text-gray-400 mt-0.5">
              Front & Back: 85.6 mm × 54.0 mm • २ मिमी अंतर • वरून १० मिमी अंतर (Top Margin: 10 mm)
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Exact 1:1 Physical Print Sheet for Browser Printing & PDF Capture
  return (
    <div
      id={id}
      className={`farmer-id-a4-sheet a4-print-sheet bg-white mx-auto ${className}`}
      style={{
        width: '210mm',
        minHeight: '297mm',
        height: '297mm',
        maxHeight: '297mm',
        backgroundColor: '#ffffff',
        paddingTop: '0mm',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Exact 10mm Top Margin Spacer */}
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

      {/* Both cards placed side-by-side horizontally in the center of A4 */}
      <div
        className="a4-cards-row"
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2mm',
          width: '100%',
        }}
      >
        {/* 1. FRONT CARD (85.6 mm x 54.0 mm) */}
        <div
          className="farmer-card-scaled-box card-scaled-box"
          style={{
            width: '85.6mm',
            height: '54.0mm',
            minWidth: '85.6mm',
            minHeight: '54.0mm',
            maxWidth: '85.6mm',
            maxHeight: '54.0mm',
            overflow: 'hidden',
            position: 'relative',
            borderRadius: '3.2mm',
            border: '0.3mm solid #1e5631',
            boxSizing: 'border-box',
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
              data={data}
              id="sheet-card-front-print"
              qrCodeUrl={qrCodeUrl}
              isPrintMode={true}
            />
          </div>
        </div>

        {/* 2. BACK CARD (85.6 mm x 54.0 mm) */}
        <div
          className="farmer-card-scaled-box card-scaled-box"
          style={{
            width: '85.6mm',
            height: '54.0mm',
            minWidth: '85.6mm',
            minHeight: '54.0mm',
            maxWidth: '85.6mm',
            maxHeight: '54.0mm',
            overflow: 'hidden',
            position: 'relative',
            borderRadius: '3.2mm',
            border: '0.3mm solid #1e5631',
            boxSizing: 'border-box',
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
              data={data}
              id="sheet-card-back-print"
              isPrintMode={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

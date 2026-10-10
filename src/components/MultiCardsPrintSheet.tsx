import React from 'react';
import { FarmerFormData } from '../types/form';
import { CardTemplateId, CardThemeId, CardLanguage, CardCustomizationOptions, PrintLayoutMode } from '../types/cardOptions';
import { FarmerCard } from './FarmerCardDesigns';

interface MultiCardsPrintSheetProps {
  layoutMode: PrintLayoutMode;
  currentFarmer: FarmerFormData;
  farmersList: FarmerFormData[];
  template: CardTemplateId;
  theme: CardThemeId;
  language: CardLanguage;
  options: CardCustomizationOptions;
  id?: string;
  isResponsivePreview?: boolean;
}

export const MultiCardsPrintSheet: React.FC<MultiCardsPrintSheetProps> = ({
  layoutMode,
  currentFarmer,
  farmersList,
  template,
  theme,
  language,
  options,
  id = 'printable-multi-cards-sheet',
  isResponsivePreview = false,
}) => {
  // If in interactive responsive preview mode, scale down nicely to fit modal/screen
  // But when printing, it renders at true 210mm x 297mm (A4) dimensions!

  // Prepare list of farmers to render based on layout
  const farmersToRender = farmersList.length > 0 ? farmersList : [currentFarmer];

  return (
    <div
      id={id}
      className={`bg-white font-sans ${
        isResponsivePreview
          ? 'w-full max-w-[640px] aspect-[210/297] border border-gray-300 shadow-xl rounded-sm p-4 overflow-hidden mx-auto flex flex-col items-center'
          : 'a4-print-sheet'
      }`}
      style={{
        backgroundColor: '#ffffff',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. SINGLE A4 CARD (Front & Back side by side at top center) */}
      {layoutMode === 'single-a4' && (
        <div className="w-full flex flex-col items-center pt-2">
          {/* Top subtle CSC Operator Header (visible only on sheet, optional cut guide) */}
          <div className="w-full flex items-center justify-between text-[9px] text-gray-400 font-mono pb-1 border-b border-gray-200 mb-2 px-2">
            <span>DIPs Computers • Smart PVC ID Card Print</span>
            <span>CR80 Size (85.6 mm x 54 mm) • Cut along dashed line</span>
            <span>Date: {new Date().toLocaleDateString('en-GB')}</span>
          </div>

          {/* Cards Row: Front & Back with 2mm gap */}
          <div
            className="flex items-center justify-center gap-[2mm] scale-[0.9] sm:scale-100 origin-top"
            id="sheet-card-pair"
          >
            {/* Front Card */}
            <div className="relative border border-dashed border-gray-300 rounded-2xl p-[1px]">
              <FarmerCard
                id="sheet-card-front-print"
                data={currentFarmer}
                template={template}
                theme={theme}
                language={language}
                options={options}
                side="front"
                isPrintMode={true}
              />
              <span className="absolute -bottom-4 left-2 text-[8px] font-mono text-gray-400">
                ▲ FRONT (पुढील बाजू)
              </span>
            </div>

            {/* Back Card */}
            <div className="relative border border-dashed border-gray-300 rounded-2xl p-[1px]">
              <FarmerCard
                id="sheet-card-back-print"
                data={currentFarmer}
                template={template}
                theme={theme}
                language={language}
                options={options}
                side="back"
                isPrintMode={true}
              />
              <span className="absolute -bottom-4 left-2 text-[8px] font-mono text-gray-400">
                ▲ BACK (मागील बाजू)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. 5-CARDS PVC TRAY LAYOUT (CSC Standard Epson L805 / Canon Tray) */}
      {layoutMode === 'pvc-tray-5' && (
        <div className="w-full flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-[9px] text-emerald-800 font-mono bg-emerald-50 px-2 py-1 rounded border border-emerald-200 mb-3">
            <span className="font-bold">PVC TRAY 5-CARD BATCH LAYOUT (5 शेतकरी कार्डे)</span>
            <span>EPSON / CANON PVC TRAY COMPATIBLE</span>
          </div>

          {/* Grid of 5 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full justify-items-center scale-[0.72] sm:scale-[0.82] lg:scale-[0.9] origin-top">
            {Array.from({ length: 5 }).map((_, idx) => {
              const farmer = farmersToRender[idx % farmersToRender.length];
              return (
                <div key={idx} className="relative border border-dashed border-gray-400 rounded-2xl p-0.5 bg-gray-50/50">
                  <FarmerCard
                    data={farmer}
                    template={template}
                    theme={theme}
                    language={language}
                    options={options}
                    side="front"
                    isPrintMode={true}
                  />
                  <div className="absolute top-1 right-2 bg-black/60 text-white font-mono text-[9px] px-1.5 rounded">
                    CARD #{idx + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. 8-CARDS SHEET (2 columns x 4 rows for A4 Lamination cutting) */}
      {layoutMode === 'sheet-8' && (
        <div className="w-full flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-[9px] text-blue-900 font-mono bg-blue-50 px-2 py-1 rounded border border-blue-200 mb-2">
            <span className="font-bold">A4 8-CARDS BULK PRINT & LAMINATION SHEET</span>
            <span>2 COLUMNS x 4 ROWS</span>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full justify-items-center scale-[0.55] sm:scale-[0.65] origin-top">
            {Array.from({ length: 8 }).map((_, idx) => {
              const farmer = farmersToRender[idx % farmersToRender.length];
              const sideToRender = idx % 2 === 0 ? 'front' : 'back';
              return (
                <div key={idx} className="relative border border-dashed border-gray-400 rounded-2xl p-0.5">
                  <FarmerCard
                    data={farmer}
                    template={template}
                    theme={theme}
                    language={language}
                    options={options}
                    side={sideToRender}
                    isPrintMode={true}
                  />
                  <div className="absolute top-1 left-2 bg-black/60 text-white font-mono text-[9px] px-1.5 rounded">
                    #{idx + 1} ({sideToRender.toUpperCase()})
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

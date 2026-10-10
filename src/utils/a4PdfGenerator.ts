import { FarmerFormData } from '../types/form';
import { printComponent } from './printHelper';
import { safeHtml2Canvas } from './safeHtml2Canvas';

/**
 * Direct print of the single farmer A4 sheet with Front and Back Farmer ID Cards
 */
export async function printA4CardDirect(data?: FarmerFormData): Promise<boolean> {
  const name = data ? (data.fullNameEn || data.fullNameMr || 'Farmer') : 'Farmer';
  const title = `Farmer ID Card A4 Print - ${name}`;
  return await printComponent('printable-a4-cards-sheet', title);
}

/**
 * Direct print of the Multi-Farmer (1-5 Cards) A4 5-PVC sheet
 */
export async function printMultiFarmerA4Direct(count = 2): Promise<boolean> {
  const title = `Farmer_ID_Cards_A4_5PVC_Sheet_${count}_Cards`;
  return await printComponent('printable-multi-farmer-a4-sheet', title);
}

/**
 * Downloads a professional 300 DPI A4 portrait PDF with Front and Back
 * Farmer ID Cards placed side-by-side at the top center with a 2 mm gap.
 * Dimensions: 85.6 mm x 54.0 mm each, on a 210 mm x 297 mm A4 sheet.
 */
export async function downloadA4CardPdf(data: FarmerFormData): Promise<void> {
  const { default: jsPDF } = await import('jspdf');

  const frontEl =
    document.getElementById('export-card-front') ||
    document.getElementById('sheet-card-front-print') ||
    document.getElementById('printable-card-front') ||
    document.querySelector('#farmer-id-card');
  const backEl =
    document.getElementById('export-card-back') ||
    document.getElementById('sheet-card-back-print') ||
    document.getElementById('printable-card-back') ||
    document.querySelector('#farmer-id-card-back');

  if (!frontEl || !backEl) {
    console.error('Card elements not found for PDF export');
    return;
  }

  // Exact A4 portrait size: 210 mm x 297 mm
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // Render cards with 2.8 scale factor on 600px width (yields 1680px, crystal-sharp 300+ DPI)
  const [frontCanvas, backCanvas] = await Promise.all([
    safeHtml2Canvas(frontEl as HTMLElement, {
      scale: 2.8,
      backgroundColor: '#ffffff',
      imageTimeout: 10000,
    }),
    safeHtml2Canvas(backEl as HTMLElement, {
      scale: 2.8,
      backgroundColor: '#edf6ee',
      imageTimeout: 10000,
    }),
  ]);

  const cardW = 85.6;     // exact mm
  const cardH = 54.0;     // exact mm
  const gap = 2.0;        // exact 2 mm gap
  const topMargin = 10.0; // Exactly 10 mm from top (requested standard)
  const leftMargin = (210 - (cardW * 2 + gap)) / 2; // 18.4 mm (perfect horizontal center)

  const frontImg = frontCanvas.toDataURL('image/jpeg', 0.98);
  const backImg = backCanvas.toDataURL('image/jpeg', 0.98);

  pdf.addImage(frontImg, 'JPEG', leftMargin, topMargin, cardW, cardH, undefined, 'FAST');
  pdf.addImage(backImg, 'JPEG', leftMargin + cardW + gap, topMargin, cardW, cardH, undefined, 'FAST');

  const farmerName = (data.fullNameEn || data.fullNameMr || 'Farmer').replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_');
  pdf.save(`Farmer_ID_Card_A4_${farmerName}.pdf`);
}

/**
 * Downloads the full A4 5-PVC Sheet PDF (containing 1 to 5 Farmer ID Cards with Front & Back)
 * Exactly matching the user's uploaded screenshot with high-resolution 300 DPI vector-sharp quality.
 */
export async function downloadMultiFarmerA4Pdf(farmers: FarmerFormData[]): Promise<void> {
  const { default: jsPDF } = await import('jspdf');

  const targetEl = document.getElementById('printable-multi-farmer-a4-sheet');
  if (!targetEl) {
    throw new Error('Multi-farmer sheet element not found (#printable-multi-farmer-a4-sheet)');
  }

  const canvas = await safeHtml2Canvas(targetEl, {
    scale: 3.0, // Ultra-high resolution 300 DPI for professional PVC card printing
    backgroundColor: '#ffffff',
    imageTimeout: 10000,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.98);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  const filename = `Farmer_ID_Cards_A4_5PVC_Sheet_${farmers.length}_Cards.pdf`;
  pdf.save(filename);
}

/**
 * Export high-resolution PNG image for direct photo printing or graphic software editing
 */
export async function downloadA4SheetAsPng(elementId = 'printable-multi-farmer-a4-sheet', filename = 'Farmer_ID_Cards_A4_Sheet.png'): Promise<void> {
  const targetEl = document.getElementById(elementId);
  if (!targetEl) return;

  const canvas = await safeHtml2Canvas(targetEl, {
    scale: 3.0,
    backgroundColor: '#ffffff',
    imageTimeout: 10000,
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Export high-resolution JPG image for direct printing or local storage
 */
export async function downloadA4SheetAsJpg(elementId = 'printable-farmer-a4-sheet', filename = 'Farmer_ID_Card.jpg'): Promise<void> {
  const targetEl = document.getElementById(elementId) || document.getElementById('printable-multi-farmer-a4-sheet') || document.getElementById('printable-farmer-all-a4-sheet');
  if (!targetEl) return;

  const canvas = await safeHtml2Canvas(targetEl, {
    scale: 3.0,
    backgroundColor: '#ffffff',
    imageTimeout: 10000,
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/jpeg', 0.98);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Upload, 
  Printer, 
  Download, 
  RotateCw, 
  Crop, 
  Image as ImageIcon, 
  Sun, 
  Contrast, 
  CheckCircle2, 
  Trash2, 
  FileText,
  Plus,
  Wand2,
  Zap,
  Target,
  Move,
  CreditCard,
  User,
  Lock,
  Unlock,
  Scissors,
  Copy,
  Layers,
  LayoutGrid,
  RotateCcw,
  Sparkles,
  Maximize2,
  ZoomIn,
  ZoomOut,
  FolderOpen
} from 'lucide-react';
import { printComponent } from '../utils/printHelper';
import { safeHtml2Canvas } from '../utils/safeHtml2Canvas';
import { WhatsAppCardCropModal } from './WhatsAppCardCropModal';

export interface WhatsAppImageItem {
  id: string;
  src: string;
  label: string;
  rotation: number;        // 0, 90, 180, 270
  brightness: number;      // 70 to 140, default 100
  contrast: number;        // 70 to 140, default 100
  widthMm: number;         // e.g. 85.6mm (PVC) or 195mm (A4)
  heightMm: number;        // e.g. 54.0mm (PVC) or 277mm (A4)
  posX: number;            // X position on A4 (0 to 210mm)
  posY: number;            // Y position on A4 (0 to 297mm)
  borderWidth: number;     // 0 (none), 0.5 (thin), 1 (normal)
  showCutLines: boolean;   // true = show dashed cutting guidelines
}

export const WhatsAppPrintSection: React.FC = () => {
  // Initial default: Card 1 (Front) & Card 2 (Back) positioned nicely for Aadhaar / PAN
  const [images, setImages] = useState<WhatsAppImageItem[]>([
    {
      id: 'wa-card-1',
      src: '',
      label: 'कार्ड १ (समोर / Front)',
      rotation: 0,
      brightness: 100,
      contrast: 100,
      widthMm: 85.6,
      heightMm: 54.0,
      posX: 62.2,
      posY: 20,
      borderWidth: 0.5,
      showCutLines: true,
    },
    {
      id: 'wa-card-2',
      src: '',
      label: 'कार्ड २ (मागे / Back)',
      rotation: 0,
      brightness: 100,
      contrast: 100,
      widthMm: 85.6,
      heightMm: 54.0,
      posX: 62.2,
      posY: 84,
      borderWidth: 0.5,
      showCutLines: true,
    },
  ]);

  const [activeImageId, setActiveImageId] = useState<string>('wa-card-1');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropModalInitialMode, setCropModalInitialMode] = useState<'perspective' | 'standard'>('perspective');
  const [lockAspectRatio, setLockAspectRatio] = useState(true);

  // Global print & export states
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingJpg, setIsExportingJpg] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dragging & Resizing directly on the A4 Paper Canvas
  const [dragMode, setDragMode] = useState<'move' | 'resize' | null>(null);
  const [dragStartData, setDragStartData] = useState<{
    mouseX: number;
    mouseY: number;
    initX: number;
    initY: number;
    initW: number;
    initH: number;
    cardId: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewSheetRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const activeItem = images.find((img) => img.id === activeImageId) || images[0];

  const updateActiveItem = useCallback(
    (updates: Partial<WhatsAppImageItem>) => {
      setImages((prev) =>
        prev.map((img) => (img.id === activeImageId ? { ...img, ...updates } : img))
      );
    },
    [activeImageId]
  );

  const updateItemById = useCallback(
    (id: string, updates: Partial<WhatsAppImageItem>) => {
      setImages((prev) =>
        prev.map((img) => (img.id === id ? { ...img, ...updates } : img))
      );
    },
    []
  );

  // Global Clipboard Paste (Ctrl+V directly from WhatsApp Web)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const src = ev.target?.result as string;
              if (src) {
                // If current slot is empty, fill it
                if (!activeItem.src) {
                  updateActiveItem({ src });
                  showToast('फोटो व्हॉट्सॲपवरून पेस्ट झाला!');
                } else {
                  // Find next empty slot
                  const emptySlot = images.find((img) => !img.src);
                  if (emptySlot) {
                    updateItemById(emptySlot.id, { src });
                    setActiveImageId(emptySlot.id);
                    showToast(`${emptySlot.label} मध्ये फोटो पेस्ट झाला!`);
                  } else {
                    // Create new slot
                    const newSlot: WhatsAppImageItem = {
                      id: `wa-${Date.now()}-${images.length}`,
                      src,
                      label: `डॉक्युमेंट ${images.length + 1}`,
                      rotation: 0,
                      brightness: 100,
                      contrast: 100,
                      widthMm: 85.6,
                      heightMm: 54.0,
                      posX: 62.2,
                      posY: Math.min(220, 20 + images.length * 64),
                      borderWidth: 0.5,
                      showCutLines: true,
                    };
                    setImages((prev) => [...prev, newSlot]);
                    setActiveImageId(newSlot.id);
                    showToast('नवीन फोटो स्लॉट तयार करून पेस्ट झाला!');
                  }
                }
              }
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeItem, images, updateActiveItem, updateItemById]);

  // Multiple File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);

    fileList.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        if (!src) return;

        setImages((prev) => {
          // If first uploaded file and active slot is empty
          if (index === 0 && !activeItem.src) {
            return prev.map((img) => (img.id === activeImageId ? { ...img, src } : img));
          }

          // Look for an unfilled slot
          const emptySlotIndex = prev.findIndex((img) => !img.src);
          if (emptySlotIndex !== -1) {
            const updated = [...prev];
            updated[emptySlotIndex] = { ...updated[emptySlotIndex], src };
            return updated;
          }

          // Otherwise append a new slot
          const newSlot: WhatsAppImageItem = {
            id: `wa-${Date.now()}-${index}`,
            src,
            label: `डॉक्युमेंट ${prev.length + 1}`,
            rotation: 0,
            brightness: 100,
            contrast: 100,
            widthMm: 85.6,
            heightMm: 54.0,
            posX: 62.2,
            posY: Math.min(220, 20 + prev.length * 64),
            borderWidth: 0.5,
            showCutLines: true,
          };
          return [...prev, newSlot];
        });
      };
      reader.readAsDataURL(file);
    });

    showToast(`${files.length} फोटो अपलोड झाले!`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Add a new empty document card
  const handleAddNewCard = () => {
    const newSlot: WhatsAppImageItem = {
      id: `wa-${Date.now()}-${images.length}`,
      src: '',
      label: `डॉक्युमेंट ${images.length + 1}`,
      rotation: 0,
      brightness: 100,
      contrast: 100,
      widthMm: 85.6,
      heightMm: 54.0,
      posX: 62.2,
      posY: Math.min(220, 20 + images.length * 64),
      borderWidth: 0.5,
      showCutLines: true,
    };
    setImages((prev) => [...prev, newSlot]);
    setActiveImageId(newSlot.id);
    showToast('नवीन कार्ड स्लॉट जोडला!');
  };

  // Duplicate active card
  const handleDuplicateCard = () => {
    if (!activeItem.src) return;
    const newSlot: WhatsAppImageItem = {
      ...activeItem,
      id: `wa-${Date.now()}`,
      label: `${activeItem.label} (प्रत)`,
      posX: Math.min(120, activeItem.posX + 10),
      posY: Math.min(230, activeItem.posY + 10),
    };
    setImages((prev) => [...prev, newSlot]);
    setActiveImageId(newSlot.id);
    showToast('कार्डची नवीन प्रत तयार झाली!');
  };

  // Delete card slot
  const handleRemoveCard = (id: string) => {
    if (images.length <= 1) {
      // Clear instead of deleting if only 1 exists
      updateActiveItem({ src: '', rotation: 0, brightness: 100, contrast: 100 });
      showToast('फोटो काढण्यात आला!');
      return;
    }
    const remaining = images.filter((img) => img.id !== id);
    setImages(remaining);
    setActiveImageId(remaining[0].id);
    showToast('कार्ड हटवले!');
  };

  // Quick 1-Click Layout Presets
  const applyLayoutPreset = (type: 'stacked' | 'side-by-side' | 'center-single' | 'full-a4') => {
    switch (type) {
      case 'stacked': {
        // Aadhaar / PAN Standard Front & Back Stacked
        setImages((prev) =>
          prev.map((img, idx) => {
            if (idx === 0) {
              return {
                ...img,
                widthMm: 85.6,
                heightMm: 54.0,
                posX: 62.2, // perfectly centered horizontally on 210mm
                posY: 20,
              };
            }
            if (idx === 1) {
              return {
                ...img,
                widthMm: 85.6,
                heightMm: 54.0,
                posX: 62.2,
                posY: 84, // 10mm gap below front card
              };
            }
            return img;
          })
        );
        showToast('🪪 फ्रंट व बॅक (उभे) लेआउट सेट झाले!');
        break;
      }
      case 'side-by-side': {
        // Front & Back Side by Side (Horizontal)
        setImages((prev) =>
          prev.map((img, idx) => {
            if (idx === 0) {
              return {
                ...img,
                widthMm: 85.6,
                heightMm: 54.0,
                posX: 14.4,
                posY: 30,
              };
            }
            if (idx === 1) {
              return {
                ...img,
                widthMm: 85.6,
                heightMm: 54.0,
                posX: 110.0,
                posY: 30,
              };
            }
            return img;
          })
        );
        showToast('🪪 शेजारी-शेजारी (Side-by-side) लेआउट सेट झाले!');
        break;
      }
      case 'center-single': {
        // Center the active card on A4
        updateActiveItem({
          widthMm: 85.6,
          heightMm: 54.0,
          posX: 62.2,
          posY: 121.5,
        });
        showToast('📄 कार्ड कागदाच्या मध्यभागी सेट झाले!');
        break;
      }
      case 'full-a4': {
        // Fit active document to full printable A4 page
        updateActiveItem({
          widthMm: 195.0,
          heightMm: 277.0,
          posX: 7.5,
          posY: 10.0,
        });
        showToast('📑 संपूर्ण A4 पानावर फिट झाले!');
        break;
      }
    }
  };

  // Size Presets
  const applySizePreset = (w: number, h: number) => {
    updateActiveItem({ widthMm: w, heightMm: h });
    showToast(`साईज बदलली: ${w} × ${h} mm`);
  };

  // Quick Size Scaling (+5mm / -5mm)
  const adjustSize = (deltaMm: number) => {
    const currentW = activeItem.widthMm;
    const currentH = activeItem.heightMm;
    const ratio = currentW / (currentH || 1);

    const newW = Math.max(25, Math.min(200, Math.round(currentW + deltaMm)));
    const newH = lockAspectRatio ? Math.round(newW / ratio) : Math.max(20, Math.min(285, currentH + deltaMm));

    updateActiveItem({ widthMm: newW, heightMm: newH });
  };

  // Position Presets
  const applyPositionPreset = (pos: 'top' | 'center' | 'bottom' | 'left' | 'right') => {
    const w = activeItem.widthMm;
    const h = activeItem.heightMm;
    const centerX = Math.round((210 - w) / 2);
    const centerY = Math.round((297 - h) / 2);

    switch (pos) {
      case 'top':
        updateActiveItem({ posX: centerX, posY: 15 });
        break;
      case 'center':
        updateActiveItem({ posX: centerX, posY: centerY });
        break;
      case 'bottom':
        updateActiveItem({ posX: centerX, posY: Math.round(297 - h - 15) });
        break;
      case 'left':
        updateActiveItem({ posX: 15 });
        break;
      case 'right':
        updateActiveItem({ posX: Math.round(210 - w - 15) });
        break;
    }
  };

  // Drag on A4 Canvas Handling (Move & Resize)
  const handlePaperPointerDown = (
    item: WhatsAppImageItem,
    e: React.PointerEvent,
    mode: 'move' | 'resize'
  ) => {
    e.stopPropagation();
    setActiveImageId(item.id);
    setDragMode(mode);

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}

    setDragStartData({
      mouseX: e.clientX,
      mouseY: e.clientY,
      initX: item.posX,
      initY: item.posY,
      initW: item.widthMm,
      initH: item.heightMm,
      cardId: item.id,
    });
  };

  const handlePaperPointerMove = (e: React.PointerEvent) => {
    if (!dragMode || !dragStartData || !previewSheetRef.current) return;

    const sheetRect = previewSheetRef.current.getBoundingClientRect();
    const mmPerPixelX = 210 / sheetRect.width;
    const mmPerPixelY = 297 / sheetRect.height;

    const deltaX = (e.clientX - dragStartData.mouseX) * mmPerPixelX;
    const deltaY = (e.clientY - dragStartData.mouseY) * mmPerPixelY;

    if (dragMode === 'move') {
      const nextX = Math.round(
        Math.max(0, Math.min(210 - dragStartData.initW, dragStartData.initX + deltaX))
      );
      const nextY = Math.round(
        Math.max(0, Math.min(297 - dragStartData.initH, dragStartData.initY + deltaY))
      );
      updateItemById(dragStartData.cardId, { posX: nextX, posY: nextY });
    } else if (dragMode === 'resize') {
      const newW = Math.round(Math.max(25, Math.min(210 - dragStartData.initX, dragStartData.initW + deltaX)));
      const ratio = dragStartData.initW / (dragStartData.initH || 1);
      const newH = lockAspectRatio
        ? Math.round(newW / ratio)
        : Math.round(Math.max(20, Math.min(297 - dragStartData.initY, dragStartData.initH + deltaY)));

      updateItemById(dragStartData.cardId, { widthMm: newW, heightMm: newH });
    }
  };

  const handlePaperPointerUp = (e: React.PointerEvent) => {
    if (dragMode) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
      setDragMode(null);
      setDragStartData(null);
    }
  };

  // High-Resolution Print Handler
  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const res = await printComponent('whatsapp-print-preview', 'WhatsApp_A4_Print');
      if (!res) {
        // In iframe environment: auto download high-DPI sheet for user to print
        await handleDownloadPdf();
      }
    } catch (err) {
      console.error('Print error:', err);
    } finally {
      setIsPrinting(false);
    }
  };

  // High-Resolution PDF Download
  const handleDownloadPdf = async () => {
    if (!previewSheetRef.current) return;
    setIsExportingPdf(true);
    try {
      const canvas = await safeHtml2Canvas(previewSheetRef.current, {
        scale: 3.0,
        backgroundColor: '#ffffff',
      });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.99);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `WhatsApp_Document_Print_300DPI_${Date.now()}.jpg`;
      link.click();
      showToast('300 DPI HD A4 प्रिंट डाऊनलोड झाले!');
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // High-Resolution JPG Download
  const handleDownloadJpg = async () => {
    if (!previewSheetRef.current) return;
    setIsExportingJpg(true);
    try {
      const canvas = await safeHtml2Canvas(previewSheetRef.current, {
        scale: 3.0,
        backgroundColor: '#ffffff',
      });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.99);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `WhatsApp_Card_Print_${Date.now()}.jpg`;
      link.click();
      showToast('HD प्रिंट फोटो डाऊनलोड झाला!');
    } catch (err) {
      console.error('JPG export error:', err);
    } finally {
      setIsExportingJpg(false);
    }
  };

  const uploadedCount = images.filter((img) => img.src).length;

  return (
    <div className="space-y-4 font-sans text-slate-800 dark:text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-800 text-white px-4 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-in slide-in-from-top-2 border border-emerald-600">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP COMMAND BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                WhatsApp Print Studio
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                A4 Clear Print
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ctrl+V ने फोटो पेस्ट करा • Photoshop Crop ने सरळ करा • हव्या त्या जागी ठेवा व HD प्रिंट काढा
            </p>
          </div>
        </div>

        {/* 1-Click Quick Layout Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto w-full lg:w-auto">
          <button
            type="button"
            onClick={() => applyLayoutPreset('stacked')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            title="Aadhaar / PAN फ्रंट व बॅक उभे सेट करा"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>🪪 फ्रंट + बॅक (उभे)</span>
          </button>

          <button
            type="button"
            onClick={() => applyLayoutPreset('side-by-side')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            title="फ्रंट व बॅक शेजारी-शेजारी सेट करा"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>🪪 शेजारी-शेजारी</span>
          </button>

          <button
            type="button"
            onClick={() => applyLayoutPreset('center-single')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            title="मध्यभागी सेट करा"
          >
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            <span>सिंगल कार्ड</span>
          </button>

          <button
            type="button"
            onClick={() => applyLayoutPreset('full-a4')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            title="संपूर्ण A4 कागदावर फिट करा"
          >
            <Maximize2 className="w-3.5 h-3.5 text-purple-600" />
            <span>फुल A4 फिट</span>
          </button>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>अपलोड</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting || uploadedCount === 0}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-40"
          >
            <Printer className="w-4 h-4" />
            <span>🖨️ A4 प्रिंट करा</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf || uploadedCount === 0}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-40"
            title="300 DPI HD इमेज किंवा प्रिंट फाईल डाऊनलोड करा"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF/इमेज</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* WORKSPACE: TWO COLUMNS (Deck Controls + Live WYSIWYG A4 Canvas) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: CONTROL & SETTINGS DECK (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* 1. DOCUMENT LIST / SLOTS (कार्ड निवड) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-wide text-slate-900 dark:text-slate-100 uppercase">
                डॉक्युमेंट्स (Cards List)
              </span>
              <button
                type="button"
                onClick={handleAddNewCard}
                className="text-emerald-600 hover:text-emerald-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ नवीन कार्ड</span>
              </button>
            </div>

            {/* Document Thumbnail Cards Grid */}
            <div className="grid grid-cols-2 gap-2">
              {images.map((item, idx) => {
                const isSelected = activeImageId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveImageId(item.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold truncate max-w-[100px] text-slate-800 dark:text-slate-200">
                        {item.label}
                      </span>
                      {images.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCard(item.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-0.5 rounded cursor-pointer transition-opacity"
                          title="कार्ड हटवा"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Thumbnail Box */}
                    <div className="w-full h-20 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-700 relative">
                      {item.src ? (
                        <img
                          src={item.src}
                          alt={item.label}
                          className="w-full h-full object-cover"
                          style={{
                            transform: `rotate(${item.rotation}deg)`,
                            filter: `brightness(${item.brightness}%) contrast(${item.contrast}%)`,
                          }}
                        />
                      ) : (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageId(item.id);
                            fileInputRef.current?.click();
                          }}
                          className="flex flex-col items-center justify-center text-slate-400 p-1 text-center hover:text-emerald-600 transition-colors"
                        >
                          <Upload className="w-4 h-4 mb-0.5" />
                          <span className="text-[9px] font-bold">फोटो टाका</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{item.widthMm}×{item.heightMm}mm</span>
                      {item.src && isSelected && (
                        <span className="text-emerald-600 font-bold">सक्रिय</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. ACTIVE CARD CONTROLS (क्रॉप व सरळ करा, साईज, पोझिशन) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                {activeItem.label} सेटिंग्ज
              </span>
              <div className="flex items-center gap-1.5">
                {activeItem.src && (
                  <button
                    type="button"
                    onClick={handleDuplicateCard}
                    className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                    title="प्रत तयार करा"
                  >
                    <Copy className="w-3 h-3" />
                    <span>डुप्लिकेट</span>
                  </button>
                )}
              </div>
            </div>

            {/* PROMINENT CROP BUTTONS */}
            {activeItem.src ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCropModalInitialMode('perspective');
                      setIsCropModalOpen(true);
                    }}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Target className="w-4 h-4 text-emerald-200" />
                    <span>🎯 ४-कॉर्नर सरळ करा</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCropModalInitialMode('standard');
                      setIsCropModalOpen(true);
                    }}
                    className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Crop className="w-4 h-4 text-blue-200" />
                    <span>✂️ फोटोशॉप क्रॉप</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateActiveItem({ rotation: (activeItem.rotation + 90) % 360 })}
                    className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>९०° फिरवा ({activeItem.rotation}°)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="दुसरा फोटो निवडा"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>बदला</span>
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 transition-all"
              >
                <Upload className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {activeItem.label} मध्ये फोटो टाका
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  किंवा किबोर्डवर थेट Ctrl + V दाबून पेस्ट करा
                </p>
              </div>
            )}

            {/* FULLY ADJUSTABLE PRINT SIZE */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                  प्रिंट साईज (Size Adjustment):
                </span>
                <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                  {activeItem.widthMm} × {activeItem.heightMm} mm
                </span>
              </div>

              {/* Quick +/- Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustSize(-5)}
                  className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  ➖ साईज कमी (-5mm)
                </button>
                <button
                  type="button"
                  onClick={() => adjustSize(5)}
                  className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  ➕ साईज जास्त (+5mm)
                </button>
              </div>

              {/* Exact Millimeters Inputs */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">रुंदी (Width mm):</label>
                  <input
                    type="number"
                    min={20}
                    max={200}
                    value={activeItem.widthMm}
                    onChange={(e) => {
                      const newW = parseFloat(e.target.value) || 20;
                      if (lockAspectRatio) {
                        const ratio = activeItem.widthMm / (activeItem.heightMm || 1);
                        updateActiveItem({ widthMm: newW, heightMm: Math.round(newW / ratio) });
                      } else {
                        updateActiveItem({ widthMm: newW });
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                  />
                </div>

                <div className="col-span-2 flex justify-center pt-4">
                  <button
                    type="button"
                    onClick={() => setLockAspectRatio(!lockAspectRatio)}
                    className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                      lockAspectRatio
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                    title={lockAspectRatio ? 'गुणोत्तर लॉक आहे (Aspect Ratio Locked)' : 'फ्री साईज (Unlocked)'}
                  >
                    {lockAspectRatio ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="col-span-5">
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">उंची (Height mm):</label>
                  <input
                    type="number"
                    min={15}
                    max={285}
                    value={activeItem.heightMm}
                    onChange={(e) => {
                      const newH = parseFloat(e.target.value) || 15;
                      if (lockAspectRatio) {
                        const ratio = activeItem.widthMm / (activeItem.heightMm || 1);
                        updateActiveItem({ heightMm: newH, widthMm: Math.round(newH * ratio) });
                      } else {
                        updateActiveItem({ heightMm: newH });
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Standard Document Presets Chips */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => applySizePreset(85.6, 54.0)}
                  className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CreditCard className="w-3 h-3 text-emerald-600" />
                  <span>🪪 PVC (85.6×54)</span>
                </button>

                <button
                  type="button"
                  onClick={() => applySizePreset(35.0, 45.0)}
                  className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <User className="w-3 h-3 text-blue-600" />
                  <span>👤 पासपोर्ट (35×45)</span>
                </button>

                <button
                  type="button"
                  onClick={() => applySizePreset(148, 205)}
                  className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3 h-3 text-amber-600" />
                  <span>📄 हाफ A5 (148×205)</span>
                </button>

                <button
                  type="button"
                  onClick={() => applySizePreset(195, 275)}
                  className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3 h-3 text-purple-600" />
                  <span>📑 फुल A4 (195×275)</span>
                </button>
              </div>
            </div>

            {/* POSITION ON SHEET */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                  कागदावर पोझिशन (Position):
                </span>
                <span className="font-mono text-[11px] font-bold text-slate-500">
                  X: {activeItem.posX}mm • Y: {activeItem.posY}mm
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPositionPreset('top')}
                  className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold rounded-lg cursor-pointer"
                >
                  ⬆️ वर मध्यभागी
                </button>
                <button
                  type="button"
                  onClick={() => applyPositionPreset('center')}
                  className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold rounded-lg cursor-pointer"
                >
                  ⏺️ मध्यभागी
                </button>
                <button
                  type="button"
                  onClick={() => applyPositionPreset('bottom')}
                  className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold rounded-lg cursor-pointer"
                >
                  ⬇️ खाली मध्यभागी
                </button>
              </div>
            </div>

            {/* PRINT CUTTING GUIDELINES & FINISH */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
                फिनिशिंग व कटिंग रेषा (Finishing):
              </span>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeItem.showCutLines}
                    onChange={(e) => updateActiveItem({ showCutLines: e.target.checked })}
                    className="accent-emerald-600 rounded"
                  />
                  <div className="text-[11px] font-bold flex items-center gap-1">
                    <Scissors className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                    <span>कात्रीने कापण्यासाठी रेषा</span>
                  </div>
                </label>

                <div className="flex items-center gap-1 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-500">बॉर्डर:</span>
                  <select
                    value={activeItem.borderWidth}
                    onChange={(e) => updateActiveItem({ borderWidth: parseFloat(e.target.value) })}
                    className="bg-transparent text-[11px] font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer flex-1"
                  >
                    <option value={0}>बॉर्डर नाही</option>
                    <option value={0.5}>बारीक (0.5pt)</option>
                    <option value={1}>ठळक (1pt)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* BRIGHTNESS & CONTRAST (Default 100% Original) */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                  मूळ रंग व लाईट (Original 100% Clarity)
                </span>
                {(activeItem.brightness !== 100 || activeItem.contrast !== 100) && (
                  <button
                    type="button"
                    onClick={() => updateActiveItem({ brightness: 100, contrast: 100 })}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-0.5"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>१००% मूळ रंग रीसेट</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                    <span className="flex items-center gap-1">
                      <Sun className="w-3 h-3 text-amber-500" />
                      <span>ब्राईटनेस</span>
                    </span>
                    <span className="font-mono">{activeItem.brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min={70}
                    max={140}
                    value={activeItem.brightness}
                    onChange={(e) => updateActiveItem({ brightness: parseInt(e.target.value, 10) })}
                    className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                    <span className="flex items-center gap-1">
                      <Contrast className="w-3 h-3 text-indigo-500" />
                      <span>कॉन्ट्रास्ट</span>
                    </span>
                    <span className="font-mono">{activeItem.contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min={70}
                    max={140}
                    value={activeItem.contrast}
                    onChange={(e) => updateActiveItem({ contrast: parseInt(e.target.value, 10) })}
                    className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: TRUE WYSIWYG A4 PAPER PREVIEW (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          
          {/* Canvas Sub-header */}
          <div className="bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>A4 शीट थेट प्रिव्ह्यू (210 × 297 mm)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                • फोटो ड्रॅग करून हव्या त्या जागी ठेवा
              </span>
            </div>

            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
              ✨ 300 DPI Clear Print
            </div>
          </div>

          {/* PHYSICAL A4 PAPER CANVAS BOARD */}
          <div 
            className="bg-slate-200 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-300 dark:border-slate-800 flex justify-center items-center overflow-x-auto shadow-inner relative select-none"
            onPointerMove={handlePaperPointerMove}
            onPointerUp={handlePaperPointerUp}
          >
            {/* Real A4 Paper Sheet (Exact 210 x 297 mm aspect ratio) */}
            <div
              id="whatsapp-print-preview"
              ref={previewSheetRef}
              className="bg-white text-slate-900 shadow-2xl rounded-xs relative transition-all w-full max-w-[520px] overflow-hidden"
              style={{ aspectRatio: '210 / 297' }}
            >
              {/* Millimeter Guidelines / 5mm Margin */}
              <div className="absolute inset-2 border border-dashed border-emerald-400/30 pointer-events-none rounded flex flex-col justify-between p-1 z-0">
                <div className="flex justify-between text-[7px] font-mono font-bold text-emerald-600/40 select-none">
                  <span>┌ 0 mm (A4 Print Area)</span>
                  <span>210 mm ┐</span>
                </div>
                <div className="flex justify-between text-[7px] font-mono font-bold text-emerald-600/40 select-none">
                  <span>└ 0 mm</span>
                  <span>210 × 297 mm ┘</span>
                </div>
              </div>

              {/* Render Cards onto the A4 Paper Sheet */}
              {uploadedCount > 0 ? (
                images.map((item) => {
                  if (!item.src) return null;

                  const isSelected = activeImageId === item.id;

                  // Percentage of A4 (210mm x 297mm)
                  const leftPercent = (item.posX / 210) * 100;
                  const topPercent = (item.posY / 297) * 100;
                  const widthPercent = (item.widthMm / 210) * 100;
                  const heightPercent = (item.heightMm / 297) * 100;

                  return (
                    <div
                      key={item.id}
                      onPointerDown={(e) => handlePaperPointerDown(item, e, 'move')}
                      className={`absolute select-none group transition-shadow cursor-move ${
                        isSelected 
                          ? 'ring-2 ring-emerald-600 z-30 shadow-2xl' 
                          : 'z-10 shadow-md hover:ring-1 hover:ring-blue-400'
                      }`}
                      style={{
                        left: `${leftPercent}%`,
                        top: `${topPercent}%`,
                        width: `${widthPercent}%`,
                        height: `${heightPercent}%`,
                        touchAction: 'none',
                      }}
                    >
                      {/* Floating Mini Action Bar for Selected Card */}
                      {isSelected && (
                        <div className="absolute -top-7 left-0 bg-slate-900 text-white rounded-t-md px-2 py-0.5 text-[9px] font-mono font-bold flex items-center gap-2 pointer-events-auto z-40 shadow-lg whitespace-nowrap">
                          <span className="text-emerald-400">{item.label}</span>
                          <span className="text-slate-400">({item.widthMm}×{item.heightMm}mm)</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCropModalInitialMode('perspective');
                              setIsCropModalOpen(true);
                            }}
                            className="text-amber-300 hover:text-white underline cursor-pointer ml-1"
                          >
                            📐 क्रॉप
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateItemById(item.id, { rotation: (item.rotation + 90) % 360 });
                            }}
                            className="text-slate-300 hover:text-white cursor-pointer"
                          >
                            🔄 ९०°
                          </button>
                        </div>
                      )}

                      {/* Optional Cutting Guide Dashed Outline */}
                      {item.showCutLines && (
                        <div className="absolute -inset-1 border border-dashed border-slate-400 pointer-events-none rounded flex items-start justify-end p-0.5">
                          <Scissors className="w-2.5 h-2.5 text-slate-500/80 transform rotate-45" />
                        </div>
                      )}

                      {/* Card Content & Image */}
                      <div 
                        className="w-full h-full bg-white overflow-hidden flex items-center justify-center"
                        style={{
                          border: item.borderWidth > 0 ? `${item.borderWidth}px solid #334155` : 'none',
                        }}
                      >
                        <img
                          src={item.src}
                          alt={item.label}
                          className="w-full h-full object-fill pointer-events-none"
                          style={{
                            transform: `rotate(${item.rotation}deg)`,
                            filter: `brightness(${item.brightness}%) contrast(${item.contrast}%)`,
                            imageRendering: 'crisp-edges',
                          }}
                        />
                      </div>

                      {/* Corner Resize Handle on Selected Card */}
                      {isSelected && (
                        <div
                          onPointerDown={(e) => handlePaperPointerDown(item, e, 'resize')}
                          className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-emerald-600 rounded-full border-2 border-white shadow-md cursor-se-resize z-50 hover:scale-125 transition-transform"
                          title="साईज बदलण्यासाठी ड्रॅग करा"
                        />
                      )}
                    </div>
                  );
                })
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-center p-8 select-none cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <FileText className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-black text-slate-800">A4 पेपर प्रिव्ह्यू येथे दिसेल</p>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    डावीकडून फोटो अपलोड करा किंवा किबोर्डवर <span className="font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">Ctrl + V</span> दाबून थेट व्हॉट्सॲपवरून फोटो पेस्ट करा!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Help Tip */}
          <div className="text-center text-[11px] text-slate-500 font-medium">
            💡 टिप: कागदावरील कोणत्याही कार्डवर क्लिक करून ड्रॅग करा • कोपऱ्यातील हिरव्या बिंदूने साईज कमी/जास्त करा
          </div>

        </div>
      </div>

      {/* CROP MODAL (PHOTOSHOP & 4-CORNER PERSPECTIVE UNWARP) */}
      {isCropModalOpen && activeItem.src && (
        <WhatsAppCardCropModal
          isOpen={isCropModalOpen}
          imageSrc={activeItem.src}
          cardLabel={activeItem.label}
          initialMode={cropModalInitialMode}
          onClose={() => setIsCropModalOpen(false)}
          onCropSave={(croppedUrl: string) => {
            updateActiveItem({ src: croppedUrl, rotation: 0, brightness: 100, contrast: 100 });
            showToast('क्रॉप यशस्वी! १००% ओरिजिनल HD क्वालिटी सेव्ह झाली.');
          }}
        />
      )}
    </div>
  );
};

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
  FolderOpen,
  ArrowUp,
  ArrowRight,
  RefreshCw,
  Eye,
  Check
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

type EasyPresetType = 'aadhaar' | 'a4-document' | 'custom-cards';

export const WhatsAppPrintSection: React.FC = () => {
  // Mode selector state
  const [activePreset, setActivePreset] = useState<EasyPresetType>('aadhaar');

  // Initial default: Card 1 (Front) & Card 2 (Back) positioned nicely for Aadhaar / PAN
  const [images, setImages] = useState<WhatsAppImageItem[]>([
    {
      id: 'wa-card-1',
      src: '',
      label: 'कार्ड १: समोरील बाजू (Front)',
      rotation: 0,
      brightness: 100,
      contrast: 100,
      widthMm: 85.6,
      heightMm: 54.0,
      posX: 62.2, // Perfectly centered on 210mm wide A4 sheet
      posY: 25,
      borderWidth: 0.5,
      showCutLines: true,
    },
    {
      id: 'wa-card-2',
      src: '',
      label: 'कार्ड २: मागील बाजू (Back)',
      rotation: 0,
      brightness: 100,
      contrast: 100,
      widthMm: 85.6,
      heightMm: 54.0,
      posX: 62.2,
      posY: 89, // 10mm gap below front card
      borderWidth: 0.5,
      showCutLines: true,
    },
  ]);

  const [activeImageId, setActiveImageId] = useState<string>('wa-card-1');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropModalInitialMode, setCropModalInitialMode] = useState<'perspective' | 'standard'>('standard');
  const [lockAspectRatio, setLockAspectRatio] = useState(true);

  // Global print & export states
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
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

  // Switch Quick Document Presets (Aadhaar, PAN, A4 Doc, Custom)
  const handleSelectPreset = (preset: EasyPresetType) => {
    setActivePreset(preset);

    if (preset === 'aadhaar') {
      setImages([
        {
          id: 'wa-card-1',
          src: images[0]?.src || '',
          label: 'आधार समोरील बाजू (Front)',
          rotation: 0,
          brightness: 100,
          contrast: 100,
          widthMm: 85.6,
          heightMm: 54.0,
          posX: 62.2,
          posY: 25,
          borderWidth: 0.5,
          showCutLines: true,
        },
        {
          id: 'wa-card-2',
          src: images[1]?.src || '',
          label: 'आधार मागील बाजू (Back)',
          rotation: 0,
          brightness: 100,
          contrast: 100,
          widthMm: 85.6,
          heightMm: 54.0,
          posX: 62.2,
          posY: 89,
          borderWidth: 0.5,
          showCutLines: true,
        },
      ]);
      setActiveImageId('wa-card-1');
      showToast('🪪 आधार कार्ड (फ्रंट व बॅक) मोड सेट झाला!');
    } else if (preset === 'a4-document') {
      setImages([
        {
          id: 'wa-card-1',
          src: images[0]?.src || '',
          label: 'व्हॉट्सॲप A4 डॉक्युमेंट',
          rotation: 0,
          brightness: 100,
          contrast: 100,
          widthMm: 195.0,
          heightMm: 275.0,
          posX: 7.5,
          posY: 11.0,
          borderWidth: 0,
          showCutLines: false,
        },
      ]);
      setActiveImageId('wa-card-1');
      showToast('📄 व्हॉट्सॲप A4 डॉक्युमेंट मोड सेट झाला!');
    } else if (preset === 'custom-cards') {
      if (images.length === 0) {
        setImages([
          {
            id: 'wa-card-1',
            src: '',
            label: 'डॉक्युमेंट १',
            rotation: 0,
            brightness: 100,
            contrast: 100,
            widthMm: 85.6,
            heightMm: 54.0,
            posX: 62.2,
            posY: 25,
            borderWidth: 0.5,
            showCutLines: true,
          },
        ]);
        setActiveImageId('wa-card-1');
      }
      showToast('🖼️ मल्टिपल कार्ड्स मोड');
    }
  };

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
                      posY: Math.min(220, 25 + images.length * 64),
                      borderWidth: 0.5,
                      showCutLines: true,
                    };
                    setImages((prev) => [...prev, newSlot]);
                    setActiveImageId(newSlot.id);
                    showToast('नवीन फोटो स्लॉट तयार करून पेस्ट झाला!');
                  }
                }
                // Automatically open Photoshop crop modal on image paste!
                setCropModalInitialMode('standard');
                setIsCropModalOpen(true);
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
            posY: Math.min(220, 25 + prev.length * 64),
            borderWidth: 0.5,
            showCutLines: true,
          };
          return [...prev, newSlot];
        });

        // Automatically open Photoshop crop modal on image upload!
        setCropModalInitialMode('standard');
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    });

    showToast(`${files.length} फोटो अपलोड झाले!`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Upload photo into a SPECIFIC slot by slot ID
  const triggerSlotUpload = (slotId: string) => {
    setActiveImageId(slotId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Add a new empty document card
  const handleAddNewCard = () => {
    const newSlot: WhatsAppImageItem = {
      id: `wa-${Date.now()}-${images.length}`,
      src: '',
      label: `कार्ड ${images.length + 1}`,
      rotation: 0,
      brightness: 100,
      contrast: 100,
      widthMm: 85.6,
      heightMm: 54.0,
      posX: 62.2,
      posY: Math.min(220, 25 + images.length * 64),
      borderWidth: 0.5,
      showCutLines: true,
    };
    setImages((prev) => [...prev, newSlot]);
    setActiveImageId(newSlot.id);
    showToast('नवीन कार्ड स्लॉट जोडला!');
  };

  // Delete/Clear photo or slot
  const handleRemovePhoto = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Check if slot has image
    const item = images.find((i) => i.id === id);
    if (!item) return;

    if (item.src) {
      // Clear image from slot
      updateItemById(id, { src: '', rotation: 0, brightness: 100, contrast: 100 });
      showToast('फोटो डिलीट केला!');
    } else if (images.length > 1) {
      // If slot is empty and we have multiple slots, remove slot completely
      const remaining = images.filter((img) => img.id !== id);
      setImages(remaining);
      setActiveImageId(remaining[0].id);
      showToast('कार्ड स्लॉट हटवला!');
    } else {
      showToast('फोटो काढून टाकला!');
    }
  };

  // Auto Magic Enhance Photo (Sharpen & contrast for WhatsApp camera photo)
  const handleMagicEnhance = (id: string) => {
    updateItemById(id, { brightness: 108, contrast: 115 });
    showToast('✨ ऑटो मॅजिक क्लिअर! फोटोचा स्पष्टपणा वाढवला.');
  };

  // Quick 1-Click Layout Presets
  const applyLayoutPreset = (type: 'stacked' | 'side-by-side' | 'center-single' | 'full-a4') => {
    switch (type) {
      case 'stacked': {
        setImages((prev) =>
          prev.map((img, idx) => {
            if (idx === 0) {
              return {
                ...img,
                widthMm: 85.6,
                heightMm: 54.0,
                posX: 62.2, // centered on 210mm
                posY: 25,
              };
            }
            if (idx === 1) {
              return {
                ...img,
                widthMm: 85.6,
                heightMm: 54.0,
                posX: 62.2,
                posY: 89, // gap below front card
              };
            }
            return img;
          })
        );
        showToast('🪪 उभे (Stacked) लेआउट सेट झाले!');
        break;
      }
      case 'side-by-side': {
        setImages((prev) =>
          prev.map((img, idx) => {
            if (idx === 0) {
              return {
                ...img,
                widthMm: 85.6,
                heightMm: 54.0,
                posX: 14.4,
                posY: 35,
              };
            }
            if (idx === 1) {
              return {
                ...img,
                widthMm: 85.6,
                heightMm: 54.0,
                posX: 110.0,
                posY: 35,
              };
            }
            return img;
          })
        );
        showToast('🪪 शेजारी-शेजारी लेआउट सेट झाले!');
        break;
      }
      case 'center-single': {
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
        updateActiveItem({
          widthMm: 195.0,
          heightMm: 275.0,
          posX: 7.5,
          posY: 11.0,
        });
        showToast('📑 संपूर्ण A4 पानावर फिट झाले!');
        break;
      }
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
    const prevActiveId = activeImageId;
    setActiveImageId('');
    await new Promise((r) => setTimeout(r, 60));

    try {
      const res = await printComponent('whatsapp-print-preview', 'WhatsApp_A4_Print');
      if (!res) {
        // In iframe environment: auto download high-DPI sheet for user to print
        await handleDownloadPdf();
      }
    } catch (err) {
      console.error('Print error:', err);
    } finally {
      setActiveImageId(prevActiveId);
      setIsPrinting(false);
    }
  };

  // High-Resolution PDF Download
  const handleDownloadPdf = async () => {
    if (!previewSheetRef.current) return;
    setIsExportingPdf(true);
    const prevActiveId = activeImageId;
    setActiveImageId('');
    await new Promise((r) => setTimeout(r, 60));

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
      showToast('300 DPI HD A4 फाईल डाऊनलोड झाली!');
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setActiveImageId(prevActiveId);
      setIsExportingPdf(false);
    }
  };

  const uploadedCount = images.filter((img) => img.src).length;

  return (
    <div className="space-y-4 font-sans text-slate-800 dark:text-slate-100 pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-800 text-white px-4 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-in slide-in-from-top-2 border border-emerald-600">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER BAR WITH MAIN ACTION BUTTONS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shrink-0">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                WhatsApp Print (व्हॉट्सॲप प्रिंट)
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                A4 Clear HD Print
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              आधार कार्ड व व्हॉट्सॲप डॉक्युमेंट्स - फोटो निवडा, क्रॉप करा व 1-क्लिक मध्ये HD प्रिंट काढा
            </p>
          </div>
        </div>

        {/* PROMINENT ACTION BUTTONS: UPLOAD & PRINT */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 dark:from-slate-800 dark:to-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm border border-slate-300 dark:border-slate-600 transition-all cursor-pointer active:scale-95"
          >
            <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>📁 फोटो अपलोड करा</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting || uploadedCount === 0}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-40"
          >
            <Printer className="w-4.5 h-4.5" />
            <span>🖨️ A4 प्रिंट काढा</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf || uploadedCount === 0}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-40"
            title="300 DPI HD A4 फाईल डाऊनलोड करा"
          >
            <Download className="w-4 h-4" />
            <span>📥 HD डाऊनलोड</span>
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

      {/* EASY DOCUMENT TYPE PRESET TABS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-2.5 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-black text-slate-500 uppercase px-2 shrink-0">
          प्रकार निवडा (A4 1 Page Sheet):
        </span>

        <button
          type="button"
          onClick={() => handleSelectPreset('aadhaar')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activePreset === 'aadhaar'
              ? 'bg-emerald-600 text-white shadow-md font-black ring-2 ring-emerald-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4 text-amber-300" />
          <span>🪪 ID कार्ड (आधार / पॅन / स्मार्ट कार्ड - A4 1 Page)</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectPreset('a4-document')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activePreset === 'a4-document'
              ? 'bg-emerald-600 text-white shadow-md font-black ring-2 ring-emerald-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-300" />
          <span>📄 फुल A4 डॉक्युमेंट (Full A4 Page)</span>
        </button>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE: LEFT CONTROL CARDS, RIGHT WYSIWYG A4 SHEET */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: EASY DOCUMENT CARDS DECK & CONTROLS (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* EASY DOCUMENT PHOTO SLOTS DECK */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-black tracking-wide text-slate-900 dark:text-slate-100 uppercase flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>अपलोड केलेले फोटो ({uploadedCount}/{images.length})</span>
              </span>

              {activePreset === 'custom-cards' && (
                <button
                  type="button"
                  onClick={handleAddNewCard}
                  className="text-emerald-600 hover:text-emerald-700 text-xs font-bold flex items-center gap-1 cursor-pointer bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ कार्ड जोडा</span>
                </button>
              )}
            </div>

            {/* Individual Card Slots */}
            <div className="space-y-3">
              {images.map((item) => {
                const isSelected = activeImageId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveImageId(item.id)}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    {/* Slot Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                          {item.label}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300 px-1.5 py-0.2 rounded">
                            सक्रिय
                          </span>
                        )}
                      </div>

                      {/* Delete Option Button (Always Available) */}
                      <button
                        type="button"
                        onClick={(e) => handleRemovePhoto(item.id, e)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                        title="हा फोटो किंवा स्लॉट डिलीट करा"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>डिलीट</span>
                      </button>
                    </div>

                    {/* Image Preview Box or Big Upload Box */}
                    {item.src ? (
                      <div className="space-y-2">
                        {/* Thumbnail View - CLICK TO CROP DIRECTLY */}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageId(item.id);
                            setCropModalInitialMode('standard');
                            setIsCropModalOpen(true);
                          }}
                          className="w-full h-32 bg-slate-950 rounded-lg overflow-hidden relative flex items-center justify-center border border-slate-700 cursor-pointer group"
                          title="क्रॉप करण्यासाठी फोटोवर क्लिक करा"
                        >
                          <img
                            src={item.src}
                            alt={item.label}
                            className="w-full h-full object-contain"
                            style={{
                              transform: `rotate(${item.rotation}deg)`,
                              filter: `brightness(${item.brightness}%) contrast(${item.contrast}%)`,
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                            <Crop className="w-4 h-4 text-amber-300" />
                            <span>क्रॉप करा</span>
                          </div>
                        </div>

                        {/* Quick Slot Action Buttons */}
                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveImageId(item.id);
                              setCropModalInitialMode('standard');
                              setIsCropModalOpen(true);
                            }}
                            className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            title="फोटो क्रॉप करा"
                          >
                            <Crop className="w-3.5 h-3.5 text-amber-300" />
                            <span>📐 क्रॉप करा</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateItemById(item.id, { rotation: (item.rotation + 90) % 360 });
                            }}
                            className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            title="९० अंश फिरवा"
                          >
                            <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                            <span>🔄 ९०°</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMagicEnhance(item.id);
                            }}
                            className="py-1.5 px-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            title="व्हॉट्सॲप कॅमेरा फोटो ऑटो क्लिअर करा"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>✨ क्लिअर</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Big Friendly Upload Button inside Empty Slot */
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerSlotUpload(item.id);
                          }}
                          className="py-4 px-3 border-2 border-dashed border-emerald-500/60 bg-emerald-50/50 hover:bg-emerald-100/60 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1"
                        >
                          <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            📁 फोटो निवडा
                          </span>
                        </button>

                        <div className="py-4 px-3 border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center flex flex-col items-center justify-center gap-1">
                          <Copy className="w-4 h-4 text-slate-500" />
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            किंवा Ctrl+V
                          </span>
                          <span className="text-[9px] text-slate-400">
                            पेस्ट करा
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 1-CLICK EASY LAYOUT ALIGNMENT BUTTONS */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-2.5">
            <span className="text-xs font-black tracking-wide text-slate-900 dark:text-slate-100 uppercase block">
              1-क्लिक लेआउट सेटिंग (Quick Layout):
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => applyLayoutPreset('stacked')}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <ArrowUp className="w-4 h-4 text-emerald-600" />
                <span>🪪 उभे (Stacked Front & Back)</span>
              </button>

              <button
                type="button"
                onClick={() => applyLayoutPreset('side-by-side')}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <ArrowRight className="w-4 h-4 text-blue-600" />
                <span>🪪 शेजारी-शेजारी (Side-by-side)</span>
              </button>

              <button
                type="button"
                onClick={() => applyLayoutPreset('center-single')}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <FileText className="w-4 h-4 text-amber-600" />
                <span>📄 मध्यभागी सिंगल कार्ड</span>
              </button>

              <button
                type="button"
                onClick={() => applyLayoutPreset('full-a4')}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Maximize2 className="w-4 h-4 text-purple-600" />
                <span>📑 फुल A4 फिट</span>
              </button>
            </div>
          </div>

          {/* ADVANCED PRINT & FINISHING SETTINGS */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
              फिनिशिंग व कात्रीने कापण्यासाठी कटिंग रेषा:
            </span>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeItem?.showCutLines ?? true}
                  onChange={(e) => updateActiveItem({ showCutLines: e.target.checked })}
                  className="accent-emerald-600 rounded w-4 h-4"
                />
                <div className="text-[11px] font-bold flex items-center gap-1">
                  <Scissors className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span>कात्रीने कापण्यासाठी डॅश्ड रेषा</span>
                </div>
              </label>

              <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-500">बॉर्डर:</span>
                <select
                  value={activeItem?.borderWidth ?? 0.5}
                  onChange={(e) => updateActiveItem({ borderWidth: parseFloat(e.target.value) })}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer flex-1"
                >
                  <option value={0}>बॉर्डर नाही</option>
                  <option value={0.5}>बारीक (0.5pt)</option>
                  <option value={1}>ठळक (1pt)</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: TRUE WYSIWYG A4 PAPER SHEET PREVIEW (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          
          {/* Canvas Header */}
          <div className="bg-white dark:bg-slate-900 rounded-xl px-4 py-3 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>A4 कागद थेट प्रिव्ह्यू (210 × 297 mm)</span>
              </span>
            </div>

            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>300 DPI Clear Print</span>
            </div>
          </div>

          {/* PHYSICAL A4 PAPER SHEET BOARD */}
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
              {/* Millimeter Guidelines / Margin (Hidden on print) */}
              <div className="absolute inset-2 border border-dashed border-emerald-400/30 pointer-events-none rounded flex flex-col justify-between p-1 z-0 no-print print:hidden">
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
                      className={`absolute select-none group transition-shadow cursor-move print:ring-0 print:shadow-none print:border-none ${
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
                      {/* Floating Mini Action Bar for Selected Card (Hidden on print) */}
                      {isSelected && (
                        <div className="absolute -top-7 left-0 bg-slate-900 text-white rounded-t-md px-2 py-0.5 text-[9px] font-mono font-bold flex items-center gap-2 pointer-events-auto z-40 shadow-lg whitespace-nowrap no-print print:hidden">
                          <span className="text-emerald-400">{item.label}</span>
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
                          <button
                            type="button"
                            onClick={(e) => handleRemovePhoto(item.id, e)}
                            className="text-red-400 hover:text-red-200 cursor-pointer ml-1"
                            title="डिलीट करा"
                          >
                            🗑️
                          </button>
                        </div>
                      )}

                      {/* Optional Cutting Guide Dashed Outline */}
                      {item.showCutLines && (
                        <div className="absolute -inset-1 border border-dashed border-slate-400 pointer-events-none rounded flex items-start justify-end p-0.5">
                          <Scissors className="w-2.5 h-2.5 text-slate-500/80 transform rotate-45 no-print print:hidden" />
                        </div>
                      )}

                      {/* Card Content & Image - SELECT & MOVE ONLY (Resizing will not trigger Crop) */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageId(item.id);
                        }}
                        className="w-full h-full bg-white overflow-hidden flex items-center justify-center cursor-move relative"
                        style={{
                          border: item.borderWidth > 0 ? `${item.borderWidth}px solid #334155` : 'none',
                        }}
                        title="कार्ड सेलेक्ट व साईज बदलण्यासाठी ओढा (Drag to move or resize)"
                      >
                        <img
                          src={item.src}
                          alt={item.label}
                          className="w-full h-full object-fill pointer-events-none select-none"
                          style={{
                            transform: `rotate(${item.rotation}deg)`,
                            filter: `brightness(${item.brightness}%) contrast(${item.contrast}%)`,
                            imageRendering: 'crisp-edges',
                          }}
                        />
                      </div>

                      {/* Corner Resize Handle on Selected Card (Hidden on print) */}
                      {isSelected && (
                        <div
                          onPointerDown={(e) => handlePaperPointerDown(item, e, 'resize')}
                          className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-emerald-600 rounded-full border-2 border-white shadow-md cursor-se-resize z-50 hover:scale-125 transition-transform no-print print:hidden"
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
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shadow-inner">
                    <Printer className="w-8 h-8" />
                  </div>
                  <p className="text-base font-black text-slate-800">A4 कागद प्रिव्ह्यू (300 DPI)</p>
                  <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed">
                    डावीकडून फोटो निवडा किंवा संगणकावर <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Ctrl + V</span> दाबून थेट व्हॉट्सॲपवरून फोटो पेस्ट करा!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Help Tip */}
          <div className="text-center text-[11px] text-slate-500 font-medium bg-slate-100 dark:bg-slate-800/60 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800">
            💡 टिप: कागदावरील कार्ड्स आपोआप योग्य आकारात लावले जातात • हवे असल्यास कार्ड माऊसने ओढून (Drag) फिरवू शकता
          </div>

        </div>
      </div>

      {/* CROP MODAL (PHOTOSHOP & 4-CORNER PERSPECTIVE UNWARP) */}
      {isCropModalOpen && activeItem?.src && (
        <WhatsAppCardCropModal
          isOpen={isCropModalOpen}
          imageSrc={activeItem.src}
          cardLabel={activeItem.label}
          initialMode={cropModalInitialMode}
          onClose={() => setIsCropModalOpen(false)}
          onCropSave={(croppedUrl: string) => {
            if (activePreset === 'a4-document') {
              // Full A4 page document mode (matches screenshot 3)
              updateActiveItem({
                src: croppedUrl,
                rotation: 0,
                brightness: 100,
                contrast: 100,
                widthMm: 195.0,
                heightMm: 275.0,
                posX: 7.5,
                posY: 11.0,
              });
              showToast('क्रॉप यशस्वी! संपूर्ण A4 पानावर फिट झाले.');
            } else {
              // ID Card mode (matches screenshot 1 and 2)
              if (activeImageId === 'wa-card-1') {
                // Card 1 (Front) -> Centered top on A4 (Screenshot 1)
                updateActiveItem({
                  src: croppedUrl,
                  rotation: 0,
                  brightness: 100,
                  contrast: 100,
                  widthMm: 85.6,
                  heightMm: 54.0,
                  posX: 62.2,
                  posY: 25.0,
                });
                // Auto switch active slot to Card 2 if available and empty
                const card2 = images.find((i) => i.id === 'wa-card-2');
                if (card2 && !card2.src) {
                  setActiveImageId('wa-card-2');
                }
                showToast('क्रॉप यशस्वी! कार्ड १ (Front) A4 वर १ नंबरला सेट झाले.');
              } else if (activeImageId === 'wa-card-2') {
                // Card 2 (Back) -> Stacked directly below Card 1 on A4 (Screenshot 2)
                updateActiveItem({
                  src: croppedUrl,
                  rotation: 0,
                  brightness: 100,
                  contrast: 100,
                  widthMm: 85.6,
                  heightMm: 54.0,
                  posX: 62.2,
                  posY: 89.0,
                });
                showToast('क्रॉप यशस्वी! कार्ड २ (Back) A4 वर कार्ड १ च्या खाली सेट झाले.');
              } else {
                updateActiveItem({ src: croppedUrl, rotation: 0, brightness: 100, contrast: 100 });
                showToast('क्रॉप यशस्वी! ओरिजिनल HD क्वालिटी सेव्ह झाली.');
              }
            }
          }}
        />
      )}
    </div>
  );
};

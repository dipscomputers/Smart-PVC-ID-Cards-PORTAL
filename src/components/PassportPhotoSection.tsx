import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Camera, 
  Upload, 
  Printer, 
  Download, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Image as ImageIcon, 
  CheckCircle2, 
  X, 
  Trash2, 
  User, 
  Eye,
  Check,
  Copy,
  Maximize2,
  Sliders,
  Type,
  Square,
  Sun,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FlipHorizontal,
  Contrast,
  Palette,
  Wand2,
  Focus,
  ShieldCheck,
  Layers,
  ArrowUpToLine
} from 'lucide-react';
import jsPDF from 'jspdf';
import { useRegisterShortcuts } from '../context/ShortcutsContext';

// Default sample photos
const SAMPLE_MALE_PHOTO = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80';
const SAMPLE_FEMALE_PHOTO = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80';

export type PageSize = '4x6' | 'a4';

export interface PassportPhotoItem {
  id: string;
  label: string; // e.g. "फोटो १", "फोटो २"
  src: string;
  zoom: number;
  rotation: number;
  pan: { x: number; y: number };
  copies: number;
  enableNameDate: boolean;
  candidateName: string;
  photoDate: string;
  // Name & Date Customizations:
  nameDateFontColor?: string;
  nameDateBgColor?: string;
  nameDateFontSize?: number; // 10 to 24px (default 15)
  nameDateUnderlineStyle?: 'none' | 'solid' | 'double' | 'dashed';
  nameDateUnderlineColor?: string;
  nameDateBorder?: boolean;
  nameDateBorderColor?: string;
  nameDateBorderWidth?: number;
  // Photo Edition & Filters:
  brightness?: number; // 50 to 150 (default 100)
  contrast?: number; // 50 to 150 (default 100)
  saturation?: number; // 0 to 200 (default 100)
  isGrayscale?: boolean; // B&W
  isSepia?: boolean; // Sepia
  flipH?: boolean; // Horizontal flip / mirror
}

interface PageConfig {
  id: PageSize;
  title: string;
  badge: string;
  subtitle: string;
  widthMm: number;
  heightMm: number;
  maxPhotos: number;
  cols: number;
  rows: number;
  photoWidthMm: number;
  photoHeightMm: number;
  gapMm: number;
  marginMm: number; // 4 mm fixed margin for 4x6, 6 mm for A4
  cssPageSize: string;
}

// Fixed standard configurations with exactly 5mm margin on all sides:
// 4x6 has 12 slots (3 cols x 4 rows) with 5 mm margin
// A4 has 30 slots (5 cols x 6 rows) with 5 mm margin
const PAGE_CONFIGS: Record<PageSize, PageConfig> = {
  '4x6': {
    id: '4x6',
    title: '4 × 6 Inch',
    badge: '12 फोटो सेट (5mm ऑल मार्जिन)',
    subtitle: '4R स्टँडर्ड फोटो पेपरवर सर्व बाजूंनी 5 mm सुरक्षित मार्जिनसह 12 पासपोर्ट फोटो (3×4 ग्रिड)',
    widthMm: 101.6, // 4 inches = 101.6 mm
    heightMm: 152.4, // 6 inches = 152.4 mm
    maxPhotos: 12,
    cols: 3,
    rows: 4,
    photoWidthMm: 28.87,
    photoHeightMm: 33.725,
    gapMm: 2.5,
    marginMm: 5, // Exact 5 mm margin on all sides (Top, Bottom, Left, Right)
    cssPageSize: '101.6mm 152.4mm',
  },
  'a4': {
    id: 'a4',
    title: 'A4 साईझ',
    badge: '30 फोटो सेट (5mm ऑल मार्जिन)',
    subtitle: 'स्टँडर्ड A4 फोटो पेपरवर सर्व बाजूंनी 5 mm सुरक्षित मार्जिनसह 30 पासपोर्ट फोटो (5×6 ग्रिड)',
    widthMm: 210, // A4 width
    heightMm: 297, // A4 height
    maxPhotos: 30,
    cols: 5,
    rows: 6,
    photoWidthMm: 37.2,
    photoHeightMm: 44.92,
    gapMm: 3.5,
    marginMm: 5, // Exact 5 mm margin on all sides (Top, Bottom, Left, Right)
    cssPageSize: 'A4 portrait',
  },
};

const getDefaultDate = () => {
  const today = new Date();
  return `DOP: ${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
};

export const PassportPhotoSection: React.FC = () => {
  // Page Size: 4x6 (default 12 photos) or A4 (30 photos)
  const [pageSize, setPageSize] = useState<PageSize>('4x6');

  // Multiple Photos state - start empty or with clean initial slot
  const [photos, setPhotos] = useState<PassportPhotoItem[]>([
    {
      id: 'p1',
      label: 'व्यक्ती १',
      src: '', // Empty initially so user sees prominent "Add Photo / फोटो निवडा"
      zoom: 1.0,
      rotation: 0,
      pan: { x: 0, y: 0 },
      copies: 12, // Default 12 copies on 4x6
      enableNameDate: false,
      candidateName: '',
      photoDate: getDefaultDate(),
      nameDateFontColor: '#000000',
      nameDateBgColor: '#ffffff',
      nameDateFontSize: 15,
      nameDateUnderlineStyle: 'none',
      nameDateUnderlineColor: '#000000',
      nameDateBorder: true,
      nameDateBorderColor: '#000000',
      nameDateBorderWidth: 1.5,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      isGrayscale: false,
      isSepia: false,
      flipH: false,
    },
  ]);

  // Currently active selected photo ID
  const [activePhotoId, setActivePhotoId] = useState<string>('p1');

  // Dragging/pan state inside crop box
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Border options & customizations
  const [hasBorder, setHasBorder] = useState<boolean>(true);
  const [borderColor, setBorderColor] = useState<string>('#000000');
  const [borderWidth, setBorderWidth] = useState<number>(1.5);
  const [borderStyle, setBorderStyle] = useState<'solid' | 'dashed'>('solid');

  // Collapsible Settings Panel (Hidden by default for super clean UI: "he sarv hide pahijet")
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'namedate' | 'border' | 'edit'>('namedate');

  // Camera modal state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isFullScreenPreview, setIsFullScreenPreview] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const currentConfig = PAGE_CONFIGS[pageSize];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Active Photo helper
  const activePhoto = useMemo(() => {
    return photos.find((p) => p.id === activePhotoId) || photos[0];
  }, [photos, activePhotoId]);

  // Pre-load images into cache
  useEffect(() => {
    photos.forEach((photo) => {
      if (!photo.src) return;
      if (!imageCacheRef.current.has(photo.src)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = photo.src;
        img.onload = () => {
          imageCacheRef.current.set(photo.src, img);
        };
      }
    });
  }, [photos]);

  // Update active photo
  const updateActivePhoto = useCallback((updates: Partial<PassportPhotoItem>) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === activePhotoId ? { ...p, ...updates } : p))
    );
  }, [activePhotoId]);

  // Apply active photo's editing effects & styles to all photos on sheet
  const applyActiveSettingsToAll = () => {
    if (!activePhoto) return;
    setPhotos((prev) =>
      prev.map((p) => ({
        ...p,
        brightness: activePhoto.brightness,
        contrast: activePhoto.contrast,
        saturation: activePhoto.saturation,
        isGrayscale: activePhoto.isGrayscale,
        isSepia: activePhoto.isSepia,
        nameDateFontSize: activePhoto.nameDateFontSize,
        nameDateFontColor: activePhoto.nameDateFontColor,
        nameDateBgColor: activePhoto.nameDateBgColor,
      }))
    );
    showToast('सध्याच्या एडिटिंग सेटिंग्ज सर्व फोटोंना लागू केल्या! ✨');
  };

  // Handle Page Size Change (4x6 or A4)
  const handlePageSizeChange = (size: PageSize) => {
    setPageSize(size);
    const maxPhotos = PAGE_CONFIGS[size].maxPhotos;
    if (photos.length === 1) {
      setPhotos([{ ...photos[0], copies: maxPhotos }]);
    } else {
      const perPhoto = Math.floor(maxPhotos / photos.length);
      const remainder = maxPhotos % photos.length;
      setPhotos(
        photos.map((p, idx) => ({
          ...p,
          copies: perPhoto + (idx === 0 ? remainder : 0),
        }))
      );
    }
  };

  // Intelligent Photo Fitting Helper (Prevents top head cropping)
  const computePhotoFit = useCallback(
    (imgW: number, imgH: number, photoW = 35, photoH = 45) => {
      if (!imgW || !imgH) return { zoom: 1.0, pan: { x: 0, y: 0 } };
      const imgAspect = imgW / imgH;
      const targetAspect = photoW / photoH;
      const refH = 240;

      if (imgAspect < targetAspect) {
        // Tall portrait photo (3:4, 9:16 mobile click)
        // Shift pan.y down so the top of head/hair is fully inside the frame with breathing room
        const overflowFraction = (targetAspect / imgAspect - 1) / 2;
        const panY = Math.round(overflowFraction * 0.95 * refH);
        return { zoom: 1.0, pan: { x: 0, y: panY } };
      }
      return { zoom: 1.0, pan: { x: 0, y: 0 } };
    },
    []
  );

  const loadImageFit = useCallback(
    (src: string): Promise<{ zoom: number; pan: { x: number; y: number } }> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve(computePhotoFit(img.naturalWidth, img.naturalHeight));
        };
        img.onerror = () => {
          resolve({ zoom: 1.0, pan: { x: 0, y: 0 } });
        };
        img.src = src;
      });
    },
    [computePhotoFit]
  );

  const alignPhotoTop = () => {
    if (!activePhoto.src) return;
    const cached = imageCacheRef.current.get(activePhoto.src);
    const photoW = 35;
    const photoH = 45;
    const imgAspect = (cached && cached.naturalWidth && cached.naturalHeight)
      ? cached.naturalWidth / cached.naturalHeight
      : (photoW / photoH);
    const targetAspect = photoW / photoH;

    const refH = 240;
    const refW = Math.round(refH * targetAspect);

    const effectiveH = imgAspect < targetAspect 
      ? (refW / imgAspect) * activePhoto.zoom 
      : refH * activePhoto.zoom;

    const neededPanY = Math.round(Math.max(0, (effectiveH - refH) / 2 - 2));
    updateActivePhoto({ pan: { x: activePhoto.pan.x, y: neededPanY } });
    showToast('डोके व केस फ्रेममध्ये पूर्णपणे सुरक्षित केले!');
  };

  const resetPhotoTransform = () => {
    if (!activePhoto.src) {
      updateActivePhoto({ zoom: 1.0, rotation: 0, pan: { x: 0, y: 0 } });
      return;
    }
    loadImageFit(activePhoto.src).then((fit) => {
      updateActivePhoto({ zoom: fit.zoom, rotation: 0, pan: fit.pan });
      showToast('फोटो रीसेट झाला (१००% झूम व डोके सुरक्षित)');
    });
  };

  // Helper to add a new person/photo to the page without deleting previous photos
  const addNewPhotoWithSrc = async (src: string, customLabel?: string) => {
    if (photos.length >= 6) {
      showToast('एका पानावर जास्तीत जास्त ६ वेगवेगळे फोटो जोडता येतील.');
      return;
    }

    const fit = await loadImageFit(src);
    const newIndex = photos.length + 1;
    const newId = `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const maxSlots = currentConfig.maxPhotos;
    const newCount = photos.length + 1;
    const perPhoto = Math.floor(maxSlots / newCount);
    const remainder = maxSlots % newCount;

    const updated = photos.map((p, idx) => ({
      ...p,
      copies: perPhoto + (idx < remainder ? 1 : 0),
    }));

    const newPhoto: PassportPhotoItem = {
      id: newId,
      label: customLabel || `व्यक्ती ${newIndex}`,
      src,
      zoom: fit.zoom,
      rotation: 0,
      pan: fit.pan,
      copies: perPhoto,
      enableNameDate: false,
      candidateName: '',
      photoDate: getDefaultDate(),
      nameDateFontColor: '#000000',
      nameDateBgColor: '#ffffff',
      nameDateFontSize: 15,
      nameDateUnderlineStyle: 'none',
      nameDateUnderlineColor: '#000000',
      nameDateBorder: true,
      nameDateBorderColor: '#000000',
      nameDateBorderWidth: 1.5,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      isGrayscale: false,
      isSepia: false,
      flipH: false,
    };

    setPhotos([...updated, newPhoto]);
    setActivePhotoId(newId);
    showToast(`व्यक्ती ${newIndex} चा फोटो जोडला! पहिला फोटो सुरक्षित आहे (प्रत्येकी ${perPhoto} पासपोर्ट).`);
  };

  // Remove photo
  const handleRemovePhoto = (id: string) => {
    if (photos.length <= 1) {
      showToast('किमान १ फोटो आवश्यक आहे.');
      return;
    }

    const remaining = photos.filter((p) => p.id !== id);
    const totalSlots = currentConfig.maxPhotos;
    const perPhoto = Math.floor(totalSlots / remaining.length);
    const remainder = totalSlots % remaining.length;

    const redistributed = remaining.map((p, idx) => ({
      ...p,
      copies: perPhoto + (idx === 0 ? remainder : 0),
    }));

    setPhotos(redistributed);
    if (activePhotoId === id) {
      setActivePhotoId(redistributed[0].id);
    }
    showToast('फोटो काढून टाकला.');
  };

  // Reset all to initial state
  const handleReset = () => {
    const initialPhoto: PassportPhotoItem = {
      id: 'p1',
      label: 'फोटो १',
      src: SAMPLE_MALE_PHOTO,
      zoom: 1.0,
      rotation: 0,
      pan: { x: 0, y: 0 },
      copies: currentConfig.maxPhotos,
      enableNameDate: false,
      candidateName: 'AMOL R. JADHAV',
      photoDate: getDefaultDate(),
      nameDateFontColor: '#000000',
      nameDateBgColor: '#ffffff',
      nameDateFontSize: 15,
      nameDateUnderlineStyle: 'none',
      nameDateUnderlineColor: '#000000',
      nameDateBorder: true,
      nameDateBorderColor: '#000000',
      nameDateBorderWidth: 1.5,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      isGrayscale: false,
      isSepia: false,
      flipH: false,
    };
    setPhotos([initialPhoto]);
    setActivePhotoId('p1');
    showToast('सर्व फोटो रीसेट झाले.');
  };

  // Fixed Layout calculations: ALWAYS FIXED GRID (3x4 for 4x6, 5x6 for A4)
  const layout = useMemo(() => {
    const pageW = currentConfig.widthMm;
    const pageH = currentConfig.heightMm;
    const gap = currentConfig.gapMm;

    const cols = currentConfig.cols;
    const rows = currentConfig.rows;

    const margin = currentConfig.marginMm; // 4 mm for 4x6
    const topM = margin;
    const botM = margin;
    const leftM = margin;
    const rightM = margin;

    const availW = Math.max(20, pageW - (leftM + rightM));
    const availH = Math.max(20, pageH - (topM + botM));

    const photoW = (availW - (cols - 1) * gap) / cols;
    const photoH = (availH - (rows - 1) * gap) / rows;

    const startX = leftM;
    const startY = topM;

    return {
      cols,
      rows,
      photoW,
      photoH,
      gap,
      startX,
      startY,
      pageW,
      pageH,
      margin,
    };
  }, [currentConfig]);

  // Construct sheet slots (12 slots for 4x6, 30 for A4)
  const sheetSlots = useMemo(() => {
    const maxSlots = currentConfig.maxPhotos;
    const slots: Array<{ slotIndex: number; photo: PassportPhotoItem | null }> = [];

    let currentSlot = 0;
    for (const photo of photos) {
      for (let c = 0; c < photo.copies; c++) {
        if (currentSlot < maxSlots) {
          slots.push({ slotIndex: currentSlot, photo });
          currentSlot++;
        }
      }
    }

    // Remaining slots are empty (null)
    while (currentSlot < maxSlots) {
      slots.push({ slotIndex: currentSlot, photo: null });
      currentSlot++;
    }

    return slots;
  }, [photos, currentConfig.maxPhotos]);

  const filledSlotsCount = useMemo(() => {
    return sheetSlots.filter((s) => s.photo !== null).length;
  }, [sheetSlots]);

  // Render a specific PassportPhotoItem to high-res data URL
  const renderPhotoItemToDataUrl = useCallback((
    photo: PassportPhotoItem,
    targetWidthMm: number,
    targetHeightMm: number,
    drawBorder: boolean
  ): string | null => {
    let img = imageCacheRef.current.get(photo.src);
    if (!img || !img.complete) {
      const tempImg = new Image();
      tempImg.crossOrigin = 'anonymous';
      tempImg.src = photo.src;
      imageCacheRef.current.set(photo.src, tempImg);
      img = tempImg;
    }

    if (!img || !img.complete || img.naturalWidth === 0) return null;

    const canvas = document.createElement('canvas');
    const targetAspect = targetWidthMm / targetHeightMm;
    const baseW = 420;
    const baseH = Math.round(baseW / targetAspect);
    canvas.width = baseW;
    canvas.height = baseH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, baseW, baseH);

    ctx.save();
    // Proportional pan calculation matching editor box
    const refEditorW = Math.round(240 * targetAspect);
    const refEditorH = 240;
    const panXCanvas = (photo.pan.x / refEditorW) * baseW;
    const panYCanvas = (photo.pan.y / refEditorH) * baseH;
    ctx.translate(baseW / 2 + panXCanvas, baseH / 2 + panYCanvas);
    ctx.rotate((photo.rotation * Math.PI) / 180);
    ctx.scale(photo.zoom * (photo.flipH ? -1 : 1), photo.zoom);

    // Apply photo filters (Brightness, Contrast, Saturation, B&W, Sepia)
    const b = photo.brightness ?? 100;
    const c = photo.contrast ?? 100;
    const s = photo.saturation ?? 100;
    const g = photo.isGrayscale ? 100 : 0;
    const sep = photo.isSepia ? 100 : 0;
    ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%) grayscale(${g}%) sepia(${sep}%)`;

    const imgAspect = img.naturalWidth / img.naturalHeight;
    let renderW = baseW;
    let renderH = baseH;

    if (imgAspect > targetAspect) {
      renderH = baseH;
      renderW = baseH * imgAspect;
    } else {
      renderW = baseW;
      renderH = baseW / imgAspect;
    }

    ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);
    ctx.restore();

    // Name & Date Stamp with custom styles & border
    if (photo.enableNameDate && (photo.candidateName?.trim() || photo.photoDate?.trim())) {
      const stampH = Math.round(baseH * 0.18);
      const stampY = baseH - stampH;
      const fontColor = photo.nameDateFontColor || '#000000';
      const bgColor = photo.nameDateBgColor || '#ffffff';
      const fontSize = photo.nameDateFontSize || 15;

      // Fill background of strip
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, stampY, baseW, stampH);

      // Clean standard border on Name & Date strip
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0.75, stampY + 0.75, baseW - 1.5, stampH - 1.5);

      ctx.fillStyle = fontColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const candName = (photo.candidateName || '').trim().toUpperCase();
      const pDate = (photo.photoDate || '').trim();
      const dateFontSize = Math.max(10, Math.round(fontSize * 0.8));

      if (candName && pDate) {
        ctx.font = `bold ${fontSize}px sans-serif`;
        const nameY = stampY + stampH * 0.35;
        ctx.fillText(candName, baseW / 2, nameY);

        ctx.font = `bold ${dateFontSize}px monospace`;
        ctx.fillStyle = fontColor === '#ffffff' ? '#e2e8f0' : (fontColor === '#000000' ? '#334155' : fontColor);
        ctx.fillText(pDate, baseW / 2, stampY + stampH * 0.74);
      } else {
        const text = candName || pDate;
        ctx.font = `bold ${fontSize + 1}px sans-serif`;
        const textY = stampY + stampH * 0.5;
        ctx.fillText(text, baseW / 2, textY);
      }
    }

    // Border (No dotted cut lines!)
    if (drawBorder) {
      const bWidth = borderWidth || 1.5;
      ctx.strokeStyle = borderColor || '#000000';
      ctx.lineWidth = bWidth;
      if (borderStyle === 'dashed') {
        ctx.setLineDash([4, 3]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.strokeRect(bWidth / 2, bWidth / 2, baseW - bWidth, baseH - bWidth);
      ctx.setLineDash([]);
    }

    return canvas.toDataURL('image/jpeg', 0.95);
  }, [borderWidth, borderColor, borderStyle]);

  // Pre-load all photo items before print/PDF
  const prepareAllPhotoDataUrls = useCallback(async (): Promise<Record<string, string>> => {
    const urls: Record<string, string> = {};
    const { photoW, photoH } = layout;

    for (const photo of photos) {
      if (!imageCacheRef.current.has(photo.src) || !imageCacheRef.current.get(photo.src)?.complete) {
        await new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            imageCacheRef.current.set(photo.src, img);
            resolve(true);
          };
          img.onerror = () => resolve(false);
          img.src = photo.src;
        });
      }

      const dataUrl = renderPhotoItemToDataUrl(photo, photoW, photoH, hasBorder);
      if (dataUrl) {
        urls[photo.id] = dataUrl;
      }
    }

    return urls;
  }, [photos, layout, hasBorder, renderPhotoItemToDataUrl]);

  // Upload handler for 1 or multiple photos from the single upload button
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;

    if (files.length === 1) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const src = event.target?.result as string;
        const fit = await loadImageFit(src);
        if (!activePhoto.src) {
          updateActivePhoto({
            src,
            zoom: fit.zoom,
            rotation: 0,
            pan: fit.pan,
          });
          showToast('व्यक्ती १ चा फोटो जोडला! (टॉप कट न होता पूर्ण डोके व केस सुरक्षित)');
        } else {
          addNewPhotoWithSrc(src);
        }
      };
      reader.readAsDataURL(files[0]);
    } else {
      // Multiple photos (2 or more) selected simultaneously in the file picker!
      const selectedFiles = files.slice(0, 6);
      const readPromises = selectedFiles.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readPromises).then(async (dataUrls) => {
        const maxSlots = currentConfig.maxPhotos;
        const totalCount = dataUrls.length;
        const perPhoto = Math.floor(maxSlots / totalCount);
        const remainder = maxSlots % totalCount;

        const fits = await Promise.all(dataUrls.map((s) => loadImageFit(s)));

        const newItems: PassportPhotoItem[] = dataUrls.map((src, index) => {
          const copies = perPhoto + (index < remainder ? 1 : 0);
          return {
            id: `p_multi_${Date.now()}_${index}`,
            label: `व्यक्ती ${index + 1}`,
            src,
            zoom: fits[index].zoom,
            rotation: 0,
            pan: fits[index].pan,
            copies,
            enableNameDate: false,
            candidateName: '',
            photoDate: getDefaultDate(),
            nameDateFontColor: '#000000',
            nameDateBgColor: '#ffffff',
            nameDateFontSize: 15,
            nameDateUnderlineStyle: 'none',
            nameDateUnderlineColor: '#000000',
            nameDateBorder: true,
            nameDateBorderColor: '#000000',
            nameDateBorderWidth: 1.5,
            brightness: 100,
            contrast: 100,
            saturation: 100,
            isGrayscale: false,
            isSepia: false,
            flipH: false,
          };
        });

        setPhotos(newItems);
        setActivePhotoId(newItems[0].id);
        showToast(`${newItems.length} व्यक्तींचे फोटो जोडले! (टॉप कट न होता डोके सुरक्षित)`);
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Camera Handlers
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      showToast('कॅमेरा चालू करताना अडचण आली.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureCameraPhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth || 640;
    tempCanvas.height = video.videoHeight || 480;
    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.95);
      const fit = computePhotoFit(tempCanvas.width, tempCanvas.height);
      updateActivePhoto({
        src: dataUrl,
        zoom: fit.zoom,
        rotation: 0,
        pan: fit.pan,
      });
      stopCamera();
      showToast('कॅमेरा फोटो यशस्वीरित्या कॅप्चर झाला!');
    }
  };

  // Pan / Drag inside active crop box
  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX - activePhoto.pan.x, y: clientY - activePhoto.pan.y });
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    updateActivePhoto({
      pan: {
        x: clientX - dragStart.x,
        y: clientY - dragStart.y,
      },
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Direct Browser Print (No dotted cut lines!)
  const handleDirectPrint = async () => {
    setIsExporting(true);
    try {
      const photoDataUrls = await prepareAllPhotoDataUrls();

      document.getElementById('passport-print-portal')?.remove();
      document.getElementById('passport-print-style')?.remove();

      const portal = document.createElement('div');
      portal.id = 'passport-print-portal';

      const { photoW, photoH, gap, startX, startY, pageW, pageH } = layout;

      let itemsHtml = '';
      sheetSlots.forEach((slot, index) => {
        if (!slot.photo) return; // Leave empty slots blank
        const dataUrl = photoDataUrls[slot.photo.id];
        if (!dataUrl) return;

        const col = index % currentConfig.cols;
        const row = Math.floor(index / currentConfig.cols);
        const x = startX + col * (photoW + gap);
        const y = startY + row * (photoH + gap);

        itemsHtml += `
          <div style="position: absolute; left: ${x}mm; top: ${y}mm; width: ${photoW}mm; height: ${photoH}mm; box-sizing: border-box;">
            <img src="${dataUrl}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
          </div>
        `;
      });

      portal.innerHTML = `
        <div style="width: ${pageW}mm; height: ${pageH}mm; position: relative; background: #ffffff; margin: 0; padding: 0; box-sizing: border-box; overflow: hidden;">
          ${itemsHtml}
        </div>
      `;

      document.body.appendChild(portal);

      const styleEl = document.createElement('style');
      styleEl.id = 'passport-print-style';
      styleEl.innerHTML = `
        #passport-print-portal {
          display: none !important;
        }
        @media print {
          @page {
            size: ${currentConfig.cssPageSize};
            margin: 0 !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: ${pageW}mm !important;
            height: ${pageH}mm !important;
            overflow: hidden !important;
          }
          body > *:not(#passport-print-portal) {
            display: none !important;
          }
          #passport-print-portal {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${pageW}mm !important;
            height: ${pageH}mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            z-index: 999999 !important;
          }
        }
      `;
      document.head.appendChild(styleEl);

      setTimeout(() => {
        window.print();
        setIsExporting(false);
      }, 150);
    } catch (err) {
      console.error(err);
      setIsExporting(false);
      showToast('प्रिंट तयार करताना त्रुटी आली.');
    }
  };

  // Export to PDF (No dotted cut lines!)
  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      const photoDataUrls = await prepareAllPhotoDataUrls();
      const { photoW, photoH, gap, startX, startY, pageW, pageH, margin } = layout;

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: pageSize === 'a4' ? 'a4' : [pageW, pageH],
      });

      for (let i = 0; i < sheetSlots.length; i++) {
        const slot = sheetSlots[i];
        if (!slot.photo) continue; // Skip empty slots
        const dataUrl = photoDataUrls[slot.photo.id];
        if (!dataUrl) continue;

        const col = i % currentConfig.cols;
        const row = Math.floor(i / currentConfig.cols);
        const x = startX + col * (photoW + gap);
        const y = startY + row * (photoH + gap);

        doc.addImage(dataUrl, 'JPEG', x, y, photoW, photoH);
      }

      const fileName = `Passport_Photos_${pageSize.toUpperCase()}_${margin}mm_Margin_${filledSlotsCount}pcs.pdf`;
      doc.save(fileName);
      showToast(`PDF सेव्ह झाली: ${fileName}`);
    } catch (err) {
      console.error('PDF error:', err);
      showToast('PDF डाऊनलोड करताना त्रुटी आली.');
    } finally {
      setIsExporting(false);
    }
  };

  // Register Shortcuts (Ctrl+P)
  useRegisterShortcuts({
    onPrint: handleDirectPrint,
    onDownloadPdf: handleDownloadPdf,
  });

  // Set 300 DPI resolution in JPEG JFIF APP0 header
  const setJpegDpi = (dataUrl: string, dpi = 300): Blob => {
    const binary = atob(dataUrl.split(',')[1]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    if (bytes[0] === 0xff && bytes[1] === 0xd8) {
      if (bytes[2] === 0xff && bytes[3] === 0xe0) {
        // Overwrite existing APP0 JFIF density
        bytes[13] = 1; // 1 = Dots Per Inch (DPI)
        bytes[14] = (dpi >> 8) & 0xff;
        bytes[15] = dpi & 0xff;
        bytes[16] = (dpi >> 8) & 0xff;
        bytes[17] = dpi & 0xff;
        return new Blob([bytes], { type: 'image/jpeg' });
      } else {
        // Insert standard JFIF APP0 header right after SOI (0xFF 0xD8)
        const jfifHeader = new Uint8Array([
          0xff, 0xe0, // APP0 marker
          0x00, 0x10, // Length: 16 bytes
          0x4a, 0x46, 0x49, 0x46, 0x00, // "JFIF\0"
          0x01, 0x01, // Version 1.1
          0x01, // Units: 1 = DPI
          (dpi >> 8) & 0xff, dpi & 0xff, // X density
          (dpi >> 8) & 0xff, dpi & 0xff, // Y density
          0x00, 0x00 // Thumbnail 0x0
        ]);
        const newBytes = new Uint8Array(bytes.length + jfifHeader.length);
        newBytes[0] = 0xff;
        newBytes[1] = 0xd8;
        newBytes.set(jfifHeader, 2);
        newBytes.set(bytes.subarray(2), 2 + jfifHeader.length);
        return new Blob([newBytes], { type: 'image/jpeg' });
      }
    }

    return new Blob([bytes], { type: 'image/jpeg' });
  };

  // Download 300 DPI high-res sheet image (JPG, No dotted lines!) with exact 5mm margins
  const handleDownloadSheetJpg = async () => {
    setIsExporting(true);
    try {
      const photoDataUrls = await prepareAllPhotoDataUrls();
      const { photoW, photoH, gap, startX, startY, pageW, pageH } = layout;

      const DPI = 300;
      const MM_TO_INCH = 25.4;
      const scale = DPI / MM_TO_INCH; // 300 DPI: exact ~11.81102 px/mm
      const canvasW = Math.round(pageW * scale); // 4x6: 1200 px, A4: 2480 px
      const canvasH = Math.round(pageH * scale); // 4x6: 1800 px, A4: 3508 px

      const sheetCanvas = document.createElement('canvas');
      sheetCanvas.width = canvasW;
      sheetCanvas.height = canvasH;
      const ctx = sheetCanvas.getContext('2d');
      if (!ctx) return;

      // Pure white paper background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasW, canvasH);

      const promises = sheetSlots.map((slot, index) => {
        return new Promise<void>((resolve) => {
          if (!slot.photo) {
            resolve();
            return;
          }
          const dataUrl = photoDataUrls[slot.photo.id];
          if (!dataUrl) {
            resolve();
            return;
          }

          const col = index % currentConfig.cols;
          const row = Math.floor(index / currentConfig.cols);
          const xMm = startX + col * (photoW + gap);
          const yMm = startY + row * (photoH + gap);

          const pxX = Math.round(xMm * scale);
          const pxY = Math.round(yMm * scale);
          const pxW = Math.round(photoW * scale);
          const pxH = Math.round(photoH * scale);

          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, pxX, pxY, pxW, pxH);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = dataUrl;
        });
      });

      await Promise.all(promises);

      const rawDataUrl = sheetCanvas.toDataURL('image/jpeg', 0.98);
      const blob = setJpegDpi(rawDataUrl, 300);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Passport_Sheet_${pageSize.toUpperCase()}_5mm_Margin_300DPI.jpg`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(`300 DPI परफेक्ट साईझ (${pageSize === '4x6' ? '4×6' : 'A4'}, 5mm ऑल मार्जिन) JPG सेव्ह झाली!`);
    } catch (err) {
      console.error(err);
      showToast('इमेज डाऊनलोड करताना त्रुटी आली.');
    } finally {
      setIsExporting(false);
    }
  };

  // Preview pixel scaling
  const previewScale = pageSize === '4x6' ? 2.8 : 1.5;
  const padPx = Math.max(4, Math.round(layout.margin * previewScale));

  // Reference Editor Dimensions dynamically matching the current photo aspect ratio
  const editorAspect = layout.photoW / layout.photoH;
  const editorHeight = 240;
  const editorWidth = Math.round(editorHeight * editorAspect);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* Hidden File Input (Supports 1 or multiple photo uploads) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl animate-fade-in font-medium text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Camera Modal */}
      {isCameraActive && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-800">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-gray-900 dark:text-slate-100">
                  {activePhoto.label}: कॅमेरामधून फोटो काढा
                </h3>
              </div>
              <button 
                onClick={stopCamera}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex flex-col items-center">
              <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-inner">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center gap-3 mt-4 w-full">
                <button
                  onClick={stopCamera}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-200 font-bold hover:bg-gray-50 dark:hover:bg-slate-800 text-sm cursor-pointer"
                >
                  रद्द करा
                </button>
                <button
                  onClick={captureCameraPhoto}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 shadow-md text-sm cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  फोटो कॅप्चर करा
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL SCREEN / BIG PREVIEW MODAL (फुल / मोठा प्रिव्ह्यू) */}
      {isFullScreenPreview && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[96vh] flex flex-col shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden">
            {/* Modal Header */}
            <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-gray-50/90 dark:bg-slate-800/90">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-slate-100">
                  {pageSize === '4x6' ? '4×6 शीट मोठा प्रिव्ह्यू (12 फोटो)' : 'A4 शीट मोठा प्रिव्ह्यू (30 फोटो)'}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDirectPrint}
                  disabled={isExporting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer active:scale-95"
                  title="5mm मार्जिनसह थेट प्रिंट करा"
                >
                  <span className="text-sm">🖨️</span>
                  <span>प्रिंट ({pageSize === '4x6' ? '4X6' : 'A4'})</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isExporting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer active:scale-95"
                  title="5mm मार्जिनसह PDF डाऊनलोड करा"
                >
                  <span className="text-sm">📥</span>
                  <span>PDF डाऊनलोड</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSheetJpg}
                  disabled={isExporting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer active:scale-95"
                  title="300 DPI परफेक्ट साईझ व 5mm मार्जिनसह JPG डाऊनलोड करा"
                >
                  <span className="text-sm">🖼️</span>
                  <span>JPG इमेज डाऊनलोड</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsFullScreenPreview(false)}
                  className="p-1.5 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 transition-colors cursor-pointer ml-1"
                  title="प्रिव्ह्यू बंद करा"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: High Resolution Sheet */}
            <div className="flex-1 overflow-auto p-3 sm:p-6 flex items-center justify-center bg-slate-200/90 dark:bg-slate-950">
              <div
                className="bg-white text-black shadow-2xl relative select-none border-2 border-gray-300 rounded-sm w-full"
                style={{
                  maxWidth: pageSize === '4x6' ? '460px' : '520px',
                  aspectRatio: pageSize === '4x6' ? '101.6 / 152.4' : '210 / 297',
                  padding: pageSize === '4x6' ? '4.92%' : '2.38%',
                  boxSizing: 'border-box',
                }}
              >
                <div 
                  className="w-full h-full grid gap-1.5 sm:gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${currentConfig.cols}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${currentConfig.rows}, minmax(0, 1fr))`,
                  }}
                >
                  {sheetSlots.map((slot, index) => {
                    const photo = slot.photo;
                    if (!photo) {
                      return (
                        <div
                          key={`modal-empty-${index}`}
                          className="w-full h-full rounded border border-dashed border-gray-300 bg-gray-50/50 flex flex-col items-center justify-center text-gray-400 p-1"
                        >
                          <span className="text-xs font-bold opacity-60">#{index + 1}</span>
                          <span className="text-[10px] font-semibold opacity-40">रिकामा</span>
                        </div>
                      );
                    }

                    const panXPercent = (photo.pan.x / editorWidth) * 100;
                    const panYPercent = (photo.pan.y / editorHeight) * 100;

                    return (
                      <div
                        key={`modal-slot-${index}`}
                        className="relative w-full h-full overflow-hidden bg-white"
                      >
                        <div
                          className="w-full h-full relative"
                          style={{
                            transform: photo.src 
                              ? `translate(${panXPercent}%, ${panYPercent}%) rotate(${photo.rotation}deg) scale(${photo.zoom})` 
                              : 'none',
                            transformOrigin: 'center center',
                          }}
                        >
                          {photo.src ? (
                            <img
                              src={photo.src}
                              alt=""
                              className="w-full h-full object-cover pointer-events-none"
                              style={{
                                filter: `brightness(${photo.brightness ?? 100}%) contrast(${photo.contrast ?? 100}%) saturate(${photo.saturation ?? 100}%) ${photo.isGrayscale ? 'grayscale(100%)' : ''} ${photo.isSepia ? 'sepia(100%)' : ''}`,
                                transform: photo.flipH ? 'scaleX(-1)' : 'none',
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-gray-400 p-1 text-center select-none">
                              <User className="w-4 h-4 text-gray-300 mb-0.5" />
                              <span className="text-[8px] font-bold text-gray-400">फोटो</span>
                            </div>
                          )}
                        </div>

                        {/* Custom Photo Border */}
                        {hasBorder && photo.src && (
                          <div 
                            className="absolute inset-0 pointer-events-none z-10" 
                            style={{
                              borderWidth: `${borderWidth}px`,
                              borderColor: borderColor,
                              borderStyle: borderStyle,
                            }}
                          />
                        )}

                        {/* Name Date bottom strip on photo */}
                        {photo.enableNameDate && (photo.candidateName || photo.photoDate) && (
                          <div 
                            className="absolute bottom-0 inset-x-0 py-0.5 text-center leading-none pointer-events-none z-20 border-t-2 border-black"
                            style={{
                              backgroundColor: photo.nameDateBgColor || '#ffffff',
                            }}
                          >
                            {photo.candidateName && (
                              <div 
                                className="font-black truncate px-0.5 leading-tight"
                                style={{
                                  color: photo.nameDateFontColor || '#000000',
                                  fontSize: `${Math.max(7.5, (photo.nameDateFontSize || 15) * 0.62)}px`,
                                }}
                              >
                                {photo.candidateName.toUpperCase()}
                              </div>
                            )}
                            {photo.photoDate && (
                              <div 
                                className="font-mono font-bold mt-0.5 leading-tight"
                                style={{
                                  color: photo.nameDateFontColor || '#475569',
                                  fontSize: `${Math.max(6.5, (photo.nameDateFontSize || 15) * 0.52)}px`,
                                }}
                              >
                                {photo.photoDate}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ⚙️ नाव, तारीख, बॉर्डर व फोटो एडिटिंग - POPUP WINDOW MODAL */}
      {/* ========================================================= */}
      {showSettings && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSettings(false);
            }
          }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-3.5 sm:p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-blue-50/90 via-white to-indigo-50/90 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <span>✨ Advanced Editting</span>
                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100/90 dark:bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                      पॉपअप विंडो
                    </span>
                  </h3>
                  <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                    नाव, तारीख, फॉन्ट साईज, काळी बॉर्डर, ब्राईटनेस व स्टुडिओ एडिटिंग (लाइव्ह प्रिव्ह्यूसह)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Person switcher if multiple photos */}
                {photos.length > 1 && (
                  <div className="hidden sm:flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                    {photos.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setActivePhotoId(p.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                          p.id === activePhotoId
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-gray-600 dark:text-slate-300 hover:text-gray-900'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/60 text-gray-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                  title="पॉपअप बंद करा (Close)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body - 2 Columns on Tablet/Desktop, Stacked on Mobile */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* LEFT COLUMN: LIVE PHOTO STUDIO PREVIEW (5 cols) */}
              <div className="md:col-span-5 flex flex-col items-center justify-start space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-200 dark:border-slate-700/80">
                <div className="w-full flex items-center justify-between">
                  <span className="text-xs font-black text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>थेट प्रिव्ह्यू: {activePhoto.label}</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 animate-pulse">
                    लाइव्ह अपडेट
                  </span>
                </div>

                {/* If multiple persons on mobile, show switcher here */}
                {photos.length > 1 && (
                  <div className="flex sm:hidden items-center gap-1 w-full overflow-x-auto pb-1 scrollbar-none">
                    {photos.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setActivePhotoId(p.id)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer shrink-0 transition-all ${
                          p.id === activePhotoId
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Passport Frame */}
                <div
                  style={{
                    width: `${Math.round(200 * editorAspect)}px`,
                    height: '200px',
                  }}
                  className="relative bg-white rounded-sm shadow-lg border-2 border-blue-600 overflow-hidden shrink-0 select-none group"
                >
                  {activePhoto.src ? (
                    <div
                      className="w-full h-full relative"
                      style={{
                        transform: `translate(${(activePhoto.pan.x / editorWidth) * 100}%, ${(activePhoto.pan.y / editorHeight) * 100}%) rotate(${activePhoto.rotation}deg) scale(${activePhoto.zoom})`,
                        transformOrigin: 'center center',
                      }}
                    >
                      <img
                        src={activePhoto.src}
                        alt={activePhoto.label}
                        className="w-full h-full object-cover pointer-events-none"
                        style={{
                          filter: `brightness(${activePhoto.brightness ?? 100}%) contrast(${activePhoto.contrast ?? 100}%) saturate(${activePhoto.saturation ?? 100}%) ${activePhoto.isGrayscale ? 'grayscale(100%)' : ''} ${activePhoto.isSepia ? 'sepia(100%)' : ''}`,
                          transform: activePhoto.flipH ? 'scaleX(-1)' : 'none',
                        }}
                      />
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-full flex flex-col items-center justify-center bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 p-3 text-center cursor-pointer transition-colors"
                      title="फोटो अपलोड करण्यासाठी क्लिक करा"
                    >
                      <Upload className="w-7 h-7 mb-1.5 text-blue-500" />
                      <span className="text-[11px] font-bold">फोटो निवडा / अपलोड करा</span>
                    </div>
                  )}

                  {/* Custom Photo Border if enabled */}
                  {hasBorder && activePhoto.src && (
                    <div 
                      className="absolute inset-0 pointer-events-none z-10" 
                      style={{
                        borderWidth: `${borderWidth}px`,
                        borderColor: borderColor,
                        borderStyle: borderStyle,
                      }}
                    />
                  )}

                  {/* Name & date preview strip */}
                  {activePhoto.enableNameDate && (activePhoto.candidateName || activePhoto.photoDate) && (
                    <div 
                      className="absolute bottom-0 inset-x-0 py-1 text-center pointer-events-none z-20 border-t-2 border-black"
                      style={{
                        backgroundColor: activePhoto.nameDateBgColor || '#ffffff',
                      }}
                    >
                      {activePhoto.candidateName && (
                        <div 
                          className="font-black truncate px-1 leading-tight"
                          style={{
                            color: activePhoto.nameDateFontColor || '#000000',
                            fontSize: `${Math.max(8, (activePhoto.nameDateFontSize || 15) * 0.65)}px`,
                          }}
                        >
                          {activePhoto.candidateName.toUpperCase()}
                        </div>
                      )}
                      {activePhoto.photoDate && (
                        <div 
                          className="font-mono font-bold mt-0.5 leading-tight"
                          style={{
                            color: activePhoto.nameDateFontColor || '#475569',
                            fontSize: `${Math.max(7, (activePhoto.nameDateFontSize || 15) * 0.54)}px`,
                          }}
                        >
                          {activePhoto.photoDate}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Frame Controls Under Photo */}
                <div className="flex items-center gap-1.5 w-full max-w-[220px]">
                  <button
                    type="button"
                    onClick={() => updateActivePhoto({ rotation: (activePhoto.rotation + 90) % 360 })}
                    className="flex-1 py-1.5 px-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-blue-50 text-[11px] font-bold text-gray-700 dark:text-slate-200 flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                    title="९०° फिरवा"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                    <span>फिरवा</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateActivePhoto({ zoom: Math.min(2.5, Number((activePhoto.zoom + 0.1).toFixed(2))) })}
                    className="py-1.5 px-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-blue-50 text-[11px] font-bold text-gray-700 dark:text-slate-200 flex items-center justify-center cursor-pointer shadow-2xs"
                    title="झूम वाढवा"
                  >
                    <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateActivePhoto({ zoom: Math.max(0.6, Number((activePhoto.zoom - 0.1).toFixed(2))) })}
                    className="py-1.5 px-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-blue-50 text-[11px] font-bold text-gray-700 dark:text-slate-200 flex items-center justify-center cursor-pointer shadow-2xs"
                    title="झूम कमी करा"
                  >
                    <ZoomOut className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                  <button
                    type="button"
                    onClick={resetPhotoTransform}
                    className="py-1.5 px-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-red-50 text-[11px] font-bold text-gray-600 hover:text-red-600 dark:text-slate-300 flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                    title="सेंटर रीसेट"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Upload or Change button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-[220px] py-1.5 px-3 rounded-xl border border-dashed border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-blue-50 hover:border-blue-400 text-xs font-bold text-gray-700 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>{activePhoto.src ? 'दुसरा फोटो निवडा (Replace)' : 'फोटो अपलोड करा'}</span>
                </button>

                {/* Active Status Box */}
                <div className="w-full max-w-[220px] p-2.5 rounded-xl bg-blue-50/70 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 space-y-1 text-[10px]">
                  <div className="font-black text-blue-900 dark:text-blue-300">
                    📋 सक्रिय इफेक्ट्स:
                  </div>
                  <div className="text-gray-600 dark:text-slate-300 space-y-0.5">
                    <div>• नाव/तारीख: <span className="font-bold text-gray-900 dark:text-slate-100">{activePhoto.enableNameDate ? 'चालू ✅' : 'बंद'}</span></div>
                    <div>• बॉर्डर: <span className="font-bold text-gray-900 dark:text-slate-100">{hasBorder ? `${borderWidth}px (${borderStyle})` : 'बंद'}</span></div>
                    <div>• ब्राइटनेस: <span className="font-bold text-gray-900 dark:text-slate-100">{activePhoto.brightness ?? 100}%</span></div>
                    <div>• कॉन्ट्रास्ट: <span className="font-bold text-gray-900 dark:text-slate-100">{activePhoto.contrast ?? 100}%</span></div>
                    {activePhoto.isGrayscale && <div className="text-purple-700 dark:text-purple-300 font-bold">• इफेक्ट: Black & White</div>}
                    {activePhoto.isSepia && <div className="text-amber-700 dark:text-amber-300 font-bold">• इफेक्ट: सेपिया</div>}
                    {activePhoto.flipH && <div className="text-blue-700 dark:text-blue-300 font-bold">• मिरर: उलटवला</div>}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: 3 TABS WITH RICH OPTIONS (7 cols) */}
              <div className="md:col-span-7 flex flex-col space-y-3.5">
                {/* 3 Sub-tabs for Settings */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 dark:bg-slate-800 rounded-2xl text-xs font-bold border border-gray-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setActiveSettingsTab('namedate')}
                    className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeSettingsTab === 'namedate'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
                    }`}
                  >
                    <Type className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">नाव व तारीख</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSettingsTab('border')}
                    className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeSettingsTab === 'border'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
                    }`}
                  >
                    <Square className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">फोटो बॉर्डर</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSettingsTab('edit')}
                    className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeSettingsTab === 'edit'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">फोटो एडिटिंग</span>
                  </button>
                </div>

                {/* TAB 1: NAME & DATE CUSTOMIZATIONS */}
                {activeSettingsTab === 'namedate' && (
                  <div className="space-y-3.5 p-3.5 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-gray-200/80 dark:border-slate-700">
                    <label className="flex items-center gap-2.5 text-xs font-black text-gray-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activePhoto.enableNameDate}
                        onChange={(e) => updateActivePhoto({ enableNameDate: e.target.checked })}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                      />
                      <span>या फोटोवर नाव व तारीख टाका ({activePhoto.label})</span>
                    </label>

                    {activePhoto.enableNameDate && (
                      <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-slate-700 animate-in fade-in duration-150">
                        {/* Candidate Name Input */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-1">
                            उमेदवाराचे नाव (Candidate Name):
                          </label>
                          <input
                            type="text"
                            value={activePhoto.candidateName}
                            onChange={(e) => updateActivePhoto({ candidateName: e.target.value })}
                            placeholder="उदा. AMOL R. JADHAV"
                            className="w-full px-3 py-1.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:ring-2 focus:ring-blue-200 focus:border-blue-600"
                          />
                        </div>

                        {/* DOP Date Input + Today Shortcut */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-bold text-gray-700 dark:text-slate-300">
                              फोटो तारीख (DOP):
                            </label>
                            <button
                              type="button"
                              onClick={() => updateActivePhoto({ photoDate: getDefaultDate() })}
                              className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                            >
                              आजची तारीख वापरा
                            </button>
                          </div>
                          <input
                            type="text"
                            value={activePhoto.photoDate}
                            onChange={(e) => updateActivePhoto({ photoDate: e.target.value })}
                            placeholder="उदा. DOP: 15/08/2024"
                            className="w-full px-3 py-1.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:ring-2 focus:ring-blue-200 focus:border-blue-600"
                          />
                        </div>

                        {/* Font Size Option (लहान, मध्यम, मोठा, खूप मोठा) */}
                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-gray-700 dark:text-slate-300">
                              Font size (अक्षरांचा आकार):
                            </label>
                            <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                              {activePhoto.nameDateFontSize || 15}px
                            </span>
                          </div>

                          {/* Quick Size Chips */}
                          <div className="grid grid-cols-4 gap-1.5">
                            {[
                              { size: 12, label: 'लहान', code: 'S' },
                              { size: 15, label: 'मध्यम', code: 'M' },
                              { size: 18, label: 'मोठा', code: 'L' },
                              { size: 21, label: 'खूप मोठा', code: 'XL' }
                            ].map((item) => (
                              <button
                                key={item.size}
                                type="button"
                                onClick={() => updateActivePhoto({ nameDateFontSize: item.size })}
                                className={`py-1.5 px-1 rounded-xl text-[10px] font-bold border text-center transition-all cursor-pointer ${
                                  (activePhoto.nameDateFontSize || 15) === item.size
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-black scale-[1.02]'
                                    : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700'
                                }`}
                              >
                                <div>{item.label}</div>
                                <div className={`text-[9px] ${
                                  (activePhoto.nameDateFontSize || 15) === item.size ? 'text-blue-100' : 'text-gray-400'
                                }`}>{item.size}px</div>
                              </button>
                            ))}
                          </div>

                          {/* Slider for precision */}
                          <div className="pt-1">
                            <input
                              type="range"
                              min={10}
                              max={24}
                              step={1}
                              value={activePhoto.nameDateFontSize || 15}
                              onChange={(e) => updateActivePhoto({ nameDateFontSize: Number(e.target.value) })}
                              className="w-full accent-blue-600 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                            />
                            <div className="flex justify-between text-[9px] font-bold text-gray-400 pt-0.5">
                              <span>10px (बारीक)</span>
                              <span>15px (स्टँडर्ड)</span>
                              <span>24px (ठळक)</span>
                            </div>
                          </div>
                        </div>

                        {/* Font Color Option */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-1">
                            Font color (अक्षरांचा रंग):
                          </label>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {[
                              { name: 'काळा', col: '#000000' },
                              { name: 'निळा', col: '#1e3a8a' },
                              { name: 'लाल', col: '#b91c1c' },
                              { name: 'हिरवा', col: '#047857' },
                              { name: 'पांढरा', col: '#ffffff' }
                            ].map(({ name, col }) => (
                              <button
                                key={col}
                                type="button"
                                onClick={() => updateActivePhoto({ nameDateFontColor: col })}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                  (activePhoto.nameDateFontColor || '#000000') === col
                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-2xs'
                                    : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300'
                                }`}
                              >
                                <span className="w-2.5 h-2.5 rounded-full border border-gray-400" style={{ backgroundColor: col }} />
                                <span>{name}</span>
                              </button>
                            ))}
                            <input
                              type="color"
                              value={activePhoto.nameDateFontColor || '#000000'}
                              onChange={(e) => updateActivePhoto({ nameDateFontColor: e.target.value })}
                              className="w-6 h-6 rounded-lg border border-gray-300 p-0 cursor-pointer"
                              title="कस्टम फॉन्ट रंग"
                            />
                          </div>
                        </div>

                        {/* Background Color Option */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-1">
                            बॅकग्राउंड रंग (Strip Background):
                          </label>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {[
                              { name: 'पांढरा', col: '#ffffff' },
                              { name: 'हलका राखाडी', col: '#f3f4f6' },
                              { name: 'फिकट पिवळा', col: '#fef9c3' },
                              { name: 'हलका निळा', col: '#e0f2fe' }
                            ].map(({ name, col }) => (
                              <button
                                key={col}
                                type="button"
                                onClick={() => updateActivePhoto({ nameDateBgColor: col })}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                  (activePhoto.nameDateBgColor || '#ffffff') === col
                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                    : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300'
                                }`}
                              >
                                <span className="w-2.5 h-2.5 rounded-full border border-gray-300" style={{ backgroundColor: col }} />
                                <span>{name}</span>
                              </button>
                            ))}
                            <input
                              type="color"
                              value={activePhoto.nameDateBgColor || '#ffffff'}
                              onChange={(e) => updateActivePhoto({ nameDateBgColor: e.target.value })}
                              className="w-6 h-6 rounded-lg border border-gray-300 p-0 cursor-pointer"
                              title="कस्टम बॅकग्राउंड रंग"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: PHOTO BORDER CUSTOMIZATIONS */}
                {activeSettingsTab === 'border' && (
                  <div className="space-y-3.5 p-3.5 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-gray-200/80 dark:border-slate-700">
                    <label className="flex items-center justify-between text-xs font-black text-gray-800 dark:text-slate-200 cursor-pointer">
                      <span>फोटोला काळी/रंगीत बॉर्डर द्या (Thin Border):</span>
                      <input
                        type="checkbox"
                        checked={hasBorder}
                        onChange={(e) => setHasBorder(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                      />
                    </label>

                    {hasBorder && (
                      <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-slate-700 animate-in fade-in duration-150">
                        {/* Border Color */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-1">
                            Border Color (बॉर्डर रंग):
                          </label>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {[
                              { name: 'काळा', col: '#000000' },
                              { name: 'राखाडी', col: '#4b5563' },
                              { name: 'निळा', col: '#1e40af' },
                              { name: 'लाल', col: '#b91c1c' },
                              { name: 'पांढरा', col: '#ffffff' }
                            ].map(({ name, col }) => (
                              <button
                                key={col}
                                type="button"
                                onClick={() => setBorderColor(col)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                  borderColor === col
                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-2xs'
                                    : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300'
                                }`}
                              >
                                <span className="w-2.5 h-2.5 rounded-full border border-gray-400" style={{ backgroundColor: col }} />
                                <span>{name}</span>
                              </button>
                            ))}
                            <input
                              type="color"
                              value={borderColor}
                              onChange={(e) => setBorderColor(e.target.value)}
                              className="w-6 h-6 rounded-lg border border-gray-300 p-0 cursor-pointer"
                              title="कस्टम बॉर्डर रंग"
                            />
                          </div>
                        </div>

                        {/* Border Width */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-1">
                            बॉर्डर जाडी (Thickness):
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { width: 1, label: 'पातळ (1px)' },
                              { width: 1.5, label: 'मध्यम (1.5px)' },
                              { width: 3, label: 'जाड (3px)' }
                            ].map(({ width, label }) => (
                              <button
                                key={width}
                                type="button"
                                onClick={() => setBorderWidth(width)}
                                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                  borderWidth === width
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                    : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Border Style */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-1">
                            बॉर्डर प्रकार (Style):
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { style: 'solid', label: 'सॉलिड (Solid)' },
                              { style: 'dashed', label: 'डॅश (Dashed)' }
                            ].map(({ style, label }) => (
                              <button
                                key={style}
                                type="button"
                                onClick={() => setBorderStyle(style as any)}
                                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                  borderStyle === style
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                    : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: PHOTO EDITION & FILTERS (Professional Passport Studio Tools) */}
                {activeSettingsTab === 'edit' && (
                  <div className="space-y-3.5 p-3.5 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-gray-200/80 dark:border-slate-700">
                    
                    {/* 1. Studio 1-Click Presets */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Wand2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>१-क्लिक स्टुडिओ प्रीसेट्स (Quick Presets):</span>
                        </label>
                        <span className="text-[10px] text-gray-500 font-medium">क्लिक करून त्वरित लागू करा</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {/* Auto Studio Enhance */}
                        <button
                          type="button"
                          onClick={() => updateActivePhoto({
                            brightness: 106,
                            contrast: 112,
                            saturation: 106,
                            isGrayscale: false,
                            isSepia: false,
                          })}
                          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 text-left transition-all cursor-pointer shadow-2xs group"
                        >
                          <div className="text-[11px] font-black text-blue-700 dark:text-blue-300 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-yellow-500" />
                            <span>Auto Studio ✨</span>
                          </div>
                          <div className="text-[9px] text-gray-500 dark:text-slate-400 leading-tight mt-0.5">
                            मोबाईल फोटोसाठी ब्राईट & शार्प
                          </div>
                        </button>

                        {/* Official ID */}
                        <button
                          type="button"
                          onClick={() => updateActivePhoto({
                            brightness: 102,
                            contrast: 108,
                            saturation: 100,
                            isGrayscale: false,
                            isSepia: false,
                          })}
                          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40 text-left transition-all cursor-pointer shadow-2xs group"
                        >
                          <div className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                            <span>🪪 शासकीय ID</span>
                          </div>
                          <div className="text-[9px] text-gray-500 dark:text-slate-400 leading-tight mt-0.5">
                            पॅन / आधार / पासपोर्ट टोन
                          </div>
                        </button>

                        {/* Vivid Print Mode */}
                        <button
                          type="button"
                          onClick={() => updateActivePhoto({
                            brightness: 108,
                            contrast: 120,
                            saturation: 112,
                            isGrayscale: false,
                            isSepia: false,
                          })}
                          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/40 text-left transition-all cursor-pointer shadow-2xs group"
                        >
                          <div className="text-[11px] font-black text-purple-700 dark:text-purple-300 flex items-center gap-1">
                            <Printer className="w-3 h-3 text-purple-600" />
                            <span>Vivid Print 🖨️</span>
                          </div>
                          <div className="text-[9px] text-gray-500 dark:text-slate-400 leading-tight mt-0.5">
                            हाय-कॉन्ट्रास्ट प्रिंट मोड
                          </div>
                        </button>

                        {/* Classic B&W */}
                        <button
                          type="button"
                          onClick={() => updateActivePhoto({
                            brightness: 106,
                            contrast: 115,
                            saturation: 100,
                            isGrayscale: true,
                            isSepia: false,
                          })}
                          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 hover:border-gray-500 text-left transition-all cursor-pointer shadow-2xs group"
                        >
                          <div className="text-[11px] font-black text-gray-800 dark:text-slate-200 flex items-center gap-1">
                            <span>🖤 B&W Studio</span>
                          </div>
                          <div className="text-[9px] text-gray-500 dark:text-slate-400 leading-tight mt-0.5">
                            कृष्णधवल अधिकृत फोटो
                          </div>
                        </button>

                        {/* Vintage Sepia */}
                        <button
                          type="button"
                          onClick={() => updateActivePhoto({
                            brightness: 102,
                            contrast: 105,
                            saturation: 100,
                            isGrayscale: false,
                            isSepia: true,
                          })}
                          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 hover:border-amber-500 text-left transition-all cursor-pointer shadow-2xs group"
                        >
                          <div className="text-[11px] font-black text-amber-700 dark:text-amber-300 flex items-center gap-1">
                            <span>📜 सेपिया टोन</span>
                          </div>
                          <div className="text-[9px] text-gray-500 dark:text-slate-400 leading-tight mt-0.5">
                            क्लासिक विंटेज इफेक्ट
                          </div>
                        </button>

                        {/* Reset to Original */}
                        <button
                          type="button"
                          onClick={() => updateActivePhoto({
                            brightness: 100,
                            contrast: 100,
                            saturation: 100,
                            isGrayscale: false,
                            isSepia: false,
                          })}
                          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:border-red-400 text-left transition-all cursor-pointer shadow-2xs group"
                        >
                          <div className="text-[11px] font-black text-gray-700 dark:text-slate-300 flex items-center gap-1">
                            <RotateCcw className="w-3 h-3 text-red-500" />
                            <span>मूळ फोटो (Normal)</span>
                          </div>
                          <div className="text-[9px] text-gray-500 dark:text-slate-400 leading-tight mt-0.5">
                            सर्व फिल्टर्स रीसेट करा
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* 2. Precision Adjustment Sliders with Stepper buttons */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3 shadow-2xs">
                      {/* Brightness */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-1">
                          <span className="flex items-center gap-1.5">
                            <Sun className="w-3.5 h-3.5 text-amber-500" />
                            ब्राइटनेस (Brightness):
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-blue-600 dark:text-blue-400 font-bold text-xs">
                              {activePhoto.brightness ?? 100}%
                            </span>
                            {(activePhoto.brightness ?? 100) !== 100 && (
                              <button
                                type="button"
                                onClick={() => updateActivePhoto({ brightness: 100 })}
                                className="text-[9px] text-gray-400 hover:text-red-500 font-semibold cursor-pointer underline"
                                title="100% वर रीसेट करा"
                              >
                                रीसेट
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateActivePhoto({ brightness: Math.max(50, (activePhoto.brightness ?? 100) - 5) })}
                            className="w-6 h-6 rounded-md bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-slate-200 text-xs font-black flex items-center justify-center shrink-0 cursor-pointer shadow-2xs"
                            title="-5% कमी करा"
                          >
                            -
                          </button>
                          <input
                            type="range"
                            min="50"
                            max="150"
                            value={activePhoto.brightness ?? 100}
                            onChange={(e) => updateActivePhoto({ brightness: Number(e.target.value) })}
                            className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <button
                            type="button"
                            onClick={() => updateActivePhoto({ brightness: Math.min(150, (activePhoto.brightness ?? 100) + 5) })}
                            className="w-6 h-6 rounded-md bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-slate-200 text-xs font-black flex items-center justify-center shrink-0 cursor-pointer shadow-2xs"
                            title="+5% वाढवा"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Contrast */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-1">
                          <span className="flex items-center gap-1.5">
                            <Contrast className="w-3.5 h-3.5 text-indigo-500" />
                            कॉन्ट्रास्ट (Contrast):
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-blue-600 dark:text-blue-400 font-bold text-xs">
                              {activePhoto.contrast ?? 100}%
                            </span>
                            {(activePhoto.contrast ?? 100) !== 100 && (
                              <button
                                type="button"
                                onClick={() => updateActivePhoto({ contrast: 100 })}
                                className="text-[9px] text-gray-400 hover:text-red-500 font-semibold cursor-pointer underline"
                                title="100% वर रीसेट करा"
                              >
                                रीसेट
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateActivePhoto({ contrast: Math.max(50, (activePhoto.contrast ?? 100) - 5) })}
                            className="w-6 h-6 rounded-md bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-slate-200 text-xs font-black flex items-center justify-center shrink-0 cursor-pointer shadow-2xs"
                            title="-5% कमी करा"
                          >
                            -
                          </button>
                          <input
                            type="range"
                            min="50"
                            max="150"
                            value={activePhoto.contrast ?? 100}
                            onChange={(e) => updateActivePhoto({ contrast: Number(e.target.value) })}
                            className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <button
                            type="button"
                            onClick={() => updateActivePhoto({ contrast: Math.min(150, (activePhoto.contrast ?? 100) + 5) })}
                            className="w-6 h-6 rounded-md bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-slate-200 text-xs font-black flex items-center justify-center shrink-0 cursor-pointer shadow-2xs"
                            title="+5% वाढवा"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Saturation */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-1">
                          <span className="flex items-center gap-1.5">
                            <Palette className="w-3.5 h-3.5 text-emerald-500" />
                            सॅच्युरेशन / रंग (Color Saturation):
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-blue-600 dark:text-blue-400 font-bold text-xs">
                              {activePhoto.saturation ?? 100}%
                            </span>
                            {(activePhoto.saturation ?? 100) !== 100 && (
                              <button
                                type="button"
                                onClick={() => updateActivePhoto({ saturation: 100 })}
                                className="text-[9px] text-gray-400 hover:text-red-500 font-semibold cursor-pointer underline"
                                title="100% वर रीसेट करा"
                              >
                                रीसेट
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateActivePhoto({ saturation: Math.max(0, (activePhoto.saturation ?? 100) - 5) })}
                            className="w-6 h-6 rounded-md bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-slate-200 text-xs font-black flex items-center justify-center shrink-0 cursor-pointer shadow-2xs"
                            title="-5% कमी करा"
                          >
                            -
                          </button>
                          <input
                            type="range"
                            min="0"
                            max="200"
                            value={activePhoto.saturation ?? 100}
                            onChange={(e) => updateActivePhoto({ saturation: Number(e.target.value) })}
                            className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <button
                            type="button"
                            onClick={() => updateActivePhoto({ saturation: Math.min(200, (activePhoto.saturation ?? 100) + 5) })}
                            className="w-6 h-6 rounded-md bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-slate-200 text-xs font-black flex items-center justify-center shrink-0 cursor-pointer shadow-2xs"
                            title="+5% वाढवा"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 3. Orientation, Mirror & Quick Head Framing */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Focus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>ओरिएंटेशन व हेड-फिट (Framing & Rotation):</span>
                      </label>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {/* Rotate 90 CCW */}
                        <button
                          type="button"
                          onClick={() => updateActivePhoto({ rotation: (activePhoto.rotation - 90 + 360) % 360 })}
                          className="py-1.5 px-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:border-blue-400 text-gray-700 dark:text-slate-300 flex items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs"
                          title="डावीकडे ९० अंश फिरवा"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                          <span>↺ ९०° डावी</span>
                        </button>

                        {/* Rotate 90 CW */}
                        <button
                          type="button"
                          onClick={() => updateActivePhoto({ rotation: (activePhoto.rotation + 90) % 360 })}
                          className="py-1.5 px-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:border-blue-400 text-gray-700 dark:text-slate-300 flex items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs"
                          title="उजवीकडे ९० अंश फिरवा"
                        >
                          <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                          <span>↻ ९०° उजवी</span>
                        </button>

                        {/* Mirror / Flip Horizontal */}
                        <button
                          type="button"
                          onClick={() => updateActivePhoto({ flipH: !activePhoto.flipH })}
                          className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs ${
                            activePhoto.flipH
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-50'
                          }`}
                          title="फोटो आडवा उलटवा (मिरर)"
                        >
                          <FlipHorizontal className="w-3.5 h-3.5" />
                          <span>⇄ मिरर</span>
                        </button>

                        {/* Auto Head Fit / Align Top */}
                        <button
                          type="button"
                          onClick={alignPhotoTop}
                          className="py-1.5 px-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs"
                          title="डोके व केस कट न होता पूर्णपणे सुरक्षित करा"
                        >
                          <ArrowUpToLine className="w-3.5 h-3.5 text-indigo-600" />
                          <span>🔝 डोके सुरक्षित</span>
                        </button>
                      </div>
                    </div>

                    {/* 4. Apply to all photos button (if sheet has multiple photos) */}
                    {photos.length > 1 && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={applyActiveSettingsToAll}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99] transition-all"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>⚡ हे सर्व एडिटिंग इफेक्ट्स शीटवरील सर्व ({photos.length}) फोटोंना लागू करा</span>
                        </button>
                      </div>
                    )}

                    {/* 5. Passport Photo Official Guidelines & Tips Card */}
                    <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-slate-900/80 border border-blue-100 dark:border-slate-800 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-black text-blue-900 dark:text-blue-300">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>पासपोर्ट फोटो स्टुडिओ गाईडलाईन्स (Official ID Tips):</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-[10px] text-gray-600 dark:text-slate-300">
                        <div>✅ चेहरा मध्यभागी ७०-८०% व्यापलेला</div>
                        <div>✅ दोन्ही डोळे व कान स्पष्ट दिसावेत</div>
                        <div>✅ फिकट किंवा पांढरी बॅकग्राउंड असावी</div>
                      </div>
                    </div>

                    {/* Reset Button */}
                    <div className="pt-0.5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => updateActivePhoto({
                          brightness: 100,
                          contrast: 100,
                          saturation: 100,
                          isGrayscale: false,
                          isSepia: false,
                          flipH: false,
                        })}
                        className="text-[11px] font-bold text-gray-500 hover:text-red-600 dark:text-slate-400 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>फोटो एडिटिंग मूळ स्थितीवर रीसेट करा</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50/90 dark:bg-slate-900 flex items-center justify-between gap-3 shrink-0">
              <div className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                💡 केलेले सर्व बदल शीटवर आणि प्रिंटवर थेट लागू होतात.
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-xs font-bold text-gray-700 dark:text-slate-200 cursor-pointer transition-all"
                >
                  बंद करा
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSettings(false);
                    showToast('सेटिंग्ज यशस्वीरित्या लागू केल्या!');
                  }}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>पूर्ण झाले (Done)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MAIN 2-COLUMN GRID (Matching User's Screenshot Design) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: Input Form & Photo Studio Workspace (5 cols) */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-xl border border-gray-200/90 dark:border-slate-800 space-y-5">
            
            {/* Header: Badge '1', Title, and Reset Button */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                  1
                </div>
                <div>
                  <h2 className="text-base font-black text-gray-900 dark:text-slate-100 leading-tight">
                    फोटो निवडा व संपादन करा
                  </h2>
                  <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                    4×6 पानावर 12 किंवा अधिक व्यक्तींचे फोटो सेट करा
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:text-slate-400 transition-colors cursor-pointer"
                title="सर्व फोटो रीसेट करा"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>रीसेट</span>
              </button>
            </div>

            {/* ========================================================= */}
            {/* १. फोटो अपलोड पर्याय (Upload Photo & Camera Buttons)       */}
            {/* ========================================================= */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-2xl text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                title="Upload Photo (संगणकावरून फोटो निवडा)"
              >
                <Upload className="w-4 h-4 shrink-0" />
                <span>Upload Photo</span>
              </button>

              <button
                type="button"
                onClick={startCamera}
                className="py-3 px-3.5 border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                title="कॅमेरामधून थेट फोटो काढा"
              >
                <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="hidden sm:inline">कॅमेरा</span>
              </button>
            </div>

            {/* ========================================================= */}
            {/* २. मुख्य फोटो फ्रेम व १ ओळीत नियंत्रणे (Studio Frame & Controls) */}
            {/* ========================================================= */}
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const fileList = e.dataTransfer.files;
                if (!fileList || fileList.length === 0) return;

                const imageFiles = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
                if (imageFiles.length === 0) return;

                if (imageFiles.length === 1) {
                  const reader = new FileReader();
                  reader.onload = async (event) => {
                    const src = event.target?.result as string;
                    const fit = await loadImageFit(src);
                    if (!activePhoto.src) {
                      updateActivePhoto({ src, zoom: fit.zoom, rotation: 0, pan: fit.pan });
                      showToast('फोटो यशस्वीरित्या जोडला! (डोके व केस सुरक्षित)');
                    } else {
                      addNewPhotoWithSrc(src);
                    }
                  };
                  reader.readAsDataURL(imageFiles[0]);
                } else {
                  // Multiple dropped photos
                  const selectedFiles = imageFiles.slice(0, 6);
                  const readPromises = selectedFiles.map((file) => {
                    return new Promise<string>((resolve) => {
                      const reader = new FileReader();
                      reader.onload = (event) => resolve(event.target?.result as string);
                      reader.readAsDataURL(file);
                    });
                  });

                  Promise.all(readPromises).then(async (dataUrls) => {
                    const maxSlots = currentConfig.maxPhotos;
                    const totalCount = dataUrls.length;
                    const perPhoto = Math.floor(maxSlots / totalCount);
                    const remainder = maxSlots % totalCount;

                    const fits = await Promise.all(dataUrls.map((s) => loadImageFit(s)));

                    const newItems: PassportPhotoItem[] = dataUrls.map((src, index) => {
                      const copies = perPhoto + (index < remainder ? 1 : 0);
                      return {
                        id: `p_multi_${Date.now()}_${index}`,
                        label: `व्यक्ती ${index + 1}`,
                        src,
                        zoom: fits[index].zoom,
                        rotation: 0,
                        pan: fits[index].pan,
                        copies,
                        enableNameDate: false,
                        candidateName: '',
                        photoDate: getDefaultDate(),
                        nameDateFontColor: '#000000',
                        nameDateBgColor: '#ffffff',
                        nameDateFontSize: 15,
                        nameDateUnderlineStyle: 'none',
                        nameDateUnderlineColor: '#000000',
                        nameDateBorder: true,
                        nameDateBorderColor: '#000000',
                        nameDateBorderWidth: 1.5,
                        brightness: 100,
                        contrast: 100,
                        saturation: 100,
                        isGrayscale: false,
                        isSepia: false,
                        flipH: false,
                      };
                    });

                    setPhotos(newItems);
                    setActivePhotoId(newItems[0].id);
                    showToast(`${newItems.length} व्यक्तींचे फोटो जोडले!`);
                  });
                }
              }}
              className="bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-4 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-3 overflow-hidden"
            >
              {/* Studio Passport Frame */}
              <div className="flex flex-col items-center justify-center">
                <div
                  onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
                  onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
                  onMouseUp={handleDragEnd}
                  onTouchStart={(e) => {
                    if (e.touches.length === 1) {
                      handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
                    }
                  }}
                  onTouchMove={(e) => {
                    if (e.touches.length === 1) {
                      handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
                    }
                  }}
                  onTouchEnd={handleDragEnd}
                  onMouseLeave={handleDragEnd}
                  onClick={() => {
                    if (!activePhoto.src) {
                      fileInputRef.current?.click();
                    }
                  }}
                  style={{
                    width: `${editorWidth}px`,
                    height: `${editorHeight}px`,
                  }}
                  className={`relative bg-white rounded-sm shadow-md border-2 border-blue-500 overflow-hidden select-none group ${
                    activePhoto.src ? 'cursor-move' : 'cursor-pointer hover:border-blue-600'
                  }`}
                  title={activePhoto.src ? 'चेहरा मध्यभागी आणण्यासाठी ड्रॅग करा' : 'फोटो निवडण्यासाठी क्लिक करा'}
                >
                  {activePhoto.src ? (
                    <div
                      className="w-full h-full relative"
                      style={{
                        transform: `translate(${(activePhoto.pan.x / editorWidth) * 100}%, ${(activePhoto.pan.y / editorHeight) * 100}%) rotate(${activePhoto.rotation}deg) scale(${activePhoto.zoom})`,
                        transformOrigin: 'center center',
                      }}
                    >
                      <img
                        src={activePhoto.src}
                        alt=""
                        className="w-full h-full object-cover pointer-events-none"
                        style={{
                          filter: `brightness(${activePhoto.brightness ?? 100}%) contrast(${activePhoto.contrast ?? 100}%) saturate(${activePhoto.saturation ?? 100}%) ${activePhoto.isGrayscale ? 'grayscale(100%)' : ''} ${activePhoto.isSepia ? 'sepia(100%)' : ''}`,
                          transform: activePhoto.flipH ? 'scaleX(-1)' : 'none',
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-4 text-center">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <span className="text-xs font-bold text-gray-600">फोटो अपलोड करा</span>
                    </div>
                  )}

                  {/* Photo Border if enabled */}
                  {hasBorder && activePhoto.src && (
                    <div 
                      className="absolute inset-0 pointer-events-none z-10" 
                      style={{
                        borderWidth: `${borderWidth}px`,
                        borderColor: borderColor,
                        borderStyle: borderStyle,
                      }}
                    />
                  )}

                  {/* Name & date preview strip */}
                  {activePhoto.enableNameDate && (activePhoto.candidateName || activePhoto.photoDate) && (
                    <div 
                      className="absolute bottom-0 inset-x-0 py-1 text-center pointer-events-none z-20 border-t-2 border-black"
                      style={{
                        backgroundColor: activePhoto.nameDateBgColor || '#ffffff',
                      }}
                    >
                      {activePhoto.candidateName && (
                        <div 
                          className="font-black truncate px-1 leading-tight"
                          style={{
                            color: activePhoto.nameDateFontColor || '#000000',
                            fontSize: `${Math.max(8, (activePhoto.nameDateFontSize || 15) * 0.65)}px`,
                          }}
                        >
                          {activePhoto.candidateName.toUpperCase()}
                        </div>
                      )}
                      {activePhoto.photoDate && (
                        <div 
                          className="font-mono font-bold mt-0.5 leading-tight"
                          style={{
                            color: activePhoto.nameDateFontColor || '#475569',
                            fontSize: `${Math.max(7, (activePhoto.nameDateFontSize || 15) * 0.54)}px`,
                          }}
                        >
                          {activePhoto.photoDate}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* १ ओळीत सर्व नियंत्रणे (Single Row Icon Controls Bar - फ्रेमच्या लगेच खाली) */}
              <div className="w-full bg-white dark:bg-slate-900/90 rounded-2xl p-2 sm:p-2.5 border border-gray-200/90 dark:border-slate-700/80 shadow-2xs">
                <div className="flex items-center justify-between gap-1.5 sm:gap-2 w-full">
                  {/* १: ९०° फिरवा (RotateCw Icon) */}
                  <button
                    type="button"
                    onClick={() => updateActivePhoto({ rotation: (activePhoto.rotation + 90) % 360 })}
                    className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/90 hover:bg-blue-50 hover:border-blue-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-2xs shrink-0"
                    title="९०° फिरवा (Rotate 90°)"
                    aria-label="९०° फिरवा"
                  >
                    <RotateCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </button>

                  {/* २: झूम - (ZoomOut Icon) */}
                  <button
                    type="button"
                    onClick={() => updateActivePhoto({ zoom: Math.max(0.6, Number((activePhoto.zoom - 0.1).toFixed(2))) })}
                    className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/90 hover:bg-blue-50 hover:border-blue-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-2xs shrink-0"
                    title="झूम कमी करा (Zoom Out)"
                    aria-label="झूम कमी करा"
                  >
                    <ZoomOut className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </button>

                  {/* सूक्ष्म झूम स्लायडर */}
                  <input
                    type="range"
                    min="0.6"
                    max="2.5"
                    step="0.05"
                    value={activePhoto.zoom}
                    onChange={(e) => updateActivePhoto({ zoom: parseFloat(e.target.value) })}
                    className="flex-1 min-w-[50px] w-full accent-blue-600 h-2 bg-gray-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                    title="झूम स्लायडर"
                  />

                  {/* % इंडिकेटर */}
                  <span className="text-[11px] sm:text-xs text-blue-700 dark:text-blue-400 font-black bg-blue-50 dark:bg-blue-950/70 px-2 py-1 rounded-lg min-w-[42px] text-center shrink-0 tabular-nums border border-blue-200/50 dark:border-blue-900/50">
                    {Math.round(activePhoto.zoom * 100)}%
                  </span>

                  {/* ३: झूम + (ZoomIn Icon) */}
                  <button
                    type="button"
                    onClick={() => updateActivePhoto({ zoom: Math.min(2.5, Number((activePhoto.zoom + 0.1).toFixed(2))) })}
                    className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/90 hover:bg-blue-50 hover:border-blue-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-2xs shrink-0"
                    title="झूम वाढवा (Zoom In)"
                    aria-label="झूम वाढवा"
                  >
                    <ZoomIn className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </button>

                  {/* ४: डोके सुरक्षित / टॉप-फिट बटन */}
                  <button
                    type="button"
                    onClick={alignPhotoTop}
                    className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/90 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-2xs shrink-0"
                    title="डोके व केस फ्रेममध्ये सुरक्षित करा (Top Align)"
                    aria-label="डोके सुरक्षित"
                  >
                    <ArrowUpToLine className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </button>

                  {/* ५: सेंटर व झूम रीसेट (RotateCcw Icon) */}
                  <button
                    type="button"
                    onClick={resetPhotoTransform}
                    className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/90 hover:bg-red-50 hover:border-red-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 hover:text-red-600 dark:text-slate-300 flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-2xs shrink-0"
                    title="सेंटर व झूम रीसेट (100% Fit & Reset)"
                    aria-label="सेंटर रीसेट"
                  >
                    <RotateCcw className="w-4 h-4 text-gray-600 dark:text-slate-400 hover:text-red-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* ३. लहान फोटो कार्ड्स (Small Photo Cards with [12 प्रती] Badge) */}
            {/* ========================================================= */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>फोटो तपशील (Photo Details):</span>
                </span>
                <span className="text-[11px] font-black text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800/60 shadow-2xs">
                  {filledSlotsCount} / {currentConfig.maxPhotos} फोटो भरले
                </span>
              </div>

              {/* Tabs List / Thumbnails */}
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
                {photos.map((photo, index) => {
                  const isActive = photo.id === activePhotoId;

                  return (
                    <div
                      key={photo.id}
                      onClick={() => setActivePhotoId(photo.id)}
                      className={`group relative flex flex-col items-center gap-1.5 p-2 rounded-2xl cursor-pointer border-2 transition-all shrink-0 select-none ${
                        isActive
                          ? 'border-blue-600 bg-blue-50/90 dark:bg-blue-950/70 text-blue-950 dark:text-blue-100 shadow-sm ring-2 ring-blue-500/25'
                          : 'border-gray-200 dark:border-slate-800 hover:border-blue-300 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:shadow-2xs'
                      }`}
                      title={photos.length === 1 ? `सध्याचा फोटो (${photo.copies} प्रती)` : `फोटो ${index + 1} (${photo.copies} प्रती)`}
                    >
                      {/* Delete button if multiple photos */}
                      {photos.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePhoto(photo.id);
                          }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-xs z-30 transition-transform hover:scale-110 cursor-pointer"
                          title="हा फोटो काढून टाका"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}

                      {/* Photo Thumbnail */}
                      <div 
                        className={`relative w-14 sm:w-16 rounded-xl bg-gray-100 dark:bg-slate-800 border-2 overflow-hidden shrink-0 flex items-center justify-center shadow-xs transition-colors ${
                          isActive ? 'border-blue-500 ring-2 ring-blue-500/25' : 'border-gray-300 dark:border-slate-700'
                        }`}
                        style={{
                          aspectRatio: `${layout.photoW} / ${layout.photoH}`,
                        }}
                      >
                        {photo.src ? (
                          <div
                            className="w-full h-full relative"
                            style={{
                              transform: `translate(${(photo.pan.x / editorWidth) * 100}%, ${(photo.pan.y / editorHeight) * 100}%) rotate(${photo.rotation}deg) scale(${photo.zoom})`,
                              transformOrigin: 'center center',
                            }}
                          >
                            <img src={photo.src} alt={photo.label} className="w-full h-full object-cover pointer-events-none" />
                          </div>
                        ) : (
                          <User className="w-6 h-6 text-gray-400" />
                        )}
                        {/* Thin black border on thumbnail if enabled */}
                        {hasBorder && photo.src && (
                          <div className="absolute inset-0 pointer-events-none border border-black z-10" />
                        )}
                        {isActive && photo.src && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs z-30 pointer-events-none">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>

                      {/* [12 प्रती] Badge directly UNDER the Photo */}
                      <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg text-xs font-black shadow-xs ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700'
                      }`}>
                        {photo.copies} प्रती
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ========================================================= */}
            {/* ४. प्रती निवड बार (Copies / प्रती Selection Bar - Alignment Fixed) */}
            {/* ========================================================= */}
            <div className="flex items-center justify-center gap-2 p-2 bg-blue-50/90 dark:bg-slate-800/90 rounded-2xl border border-blue-200 dark:border-slate-700 shadow-2xs">
              <div 
                className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-100 dark:bg-slate-700 text-blue-700 dark:text-blue-300 shrink-0 shadow-2xs"
                title="प्रती संख्या (Copies)"
              >
                <Copy className="w-4 h-4" />
              </div>

              {/* Quick count chips (2, 3, 6, 9, 12) */}
              <div className="flex items-center gap-1.5">
                {(pageSize === '4x6' ? [2, 3, 6, 9, 12] : [2, 3, 6, 9, 12, 24]).map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => updateActivePhoto({ copies: cnt })}
                    className={`h-8 min-w-8 px-2.5 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center justify-center ${
                      activePhoto.copies === cnt
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200 hover:bg-gray-100 border border-gray-200 dark:border-slate-600'
                    }`}
                    title={`${cnt} पासपोर्ट`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>

              {/* Vertical Divider */}
              <div className="h-5 w-[1.5px] bg-gray-300 dark:bg-slate-600 mx-1 shrink-0" />

              {/* Stepper with Input */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => updateActivePhoto({ copies: Math.max(1, (activePhoto.copies || 1) - 1) })}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 hover:bg-gray-100 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-200 font-black flex items-center justify-center text-sm cursor-pointer shadow-2xs active:scale-95"
                  title="1 कमी करा (-)"
                >
                  -
                </button>

                {/* Editable input to directly type copies count */}
                <input
                  type="number"
                  min={1}
                  max={currentConfig.maxPhotos}
                  value={activePhoto.copies === 0 ? '' : activePhoto.copies}
                  onChange={(e) => {
                    const valStr = e.target.value;
                    if (valStr === '') {
                      updateActivePhoto({ copies: 0 });
                    } else {
                      const num = parseInt(valStr, 10);
                      if (!isNaN(num)) {
                        updateActivePhoto({ copies: Math.max(0, Math.min(currentConfig.maxPhotos, num)) });
                      }
                    }
                  }}
                  onBlur={() => {
                    if (!activePhoto.copies || activePhoto.copies < 1) {
                      updateActivePhoto({ copies: 1 });
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-12 h-8 text-center font-black text-xs text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-700 border border-blue-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  title="प्रतींची संख्या टाईप करा"
                />

                <button
                  type="button"
                  onClick={() => updateActivePhoto({ copies: Math.min(currentConfig.maxPhotos, (activePhoto.copies || 0) + 1) })}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 hover:bg-gray-100 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-200 font-black flex items-center justify-center text-sm cursor-pointer shadow-2xs active:scale-95"
                  title="1 वाढवा (+)"
                >
                  +
                </button>
              </div>
            </div>

            {/* ========================================================= */}
            {/* ५. कस्टमायझेशन व संपादन बटण (Studio Pro Editor Trigger)    */}
            {/* ========================================================= */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="relative w-full overflow-hidden rounded-2xl p-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-md hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer group text-left"
                title="Advanced Editting पॉपअप विंडो उघडा (Open Advanced Editing)"
              >
                {/* Glowing shine overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="relative rounded-[14px] bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-indigo-950/95 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-3 sm:p-3.5 flex items-center justify-between gap-2.5 text-white">
                  {/* Left: Icon with glow + Badge + Title */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-200">
                        <Sparkles className="w-5 h-5 text-yellow-300" />
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400"></span>
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] sm:text-sm font-black tracking-tight text-white group-hover:text-blue-200 transition-colors">
                          ✨ Advanced Editting
                        </span>
                      </div>
                      <p className="text-[11px] text-blue-200/80 font-medium truncate mt-0.5">
                        नाव • तारीख • फॉन्ट साईज • काळी बॉर्डर • स्टुडिओ एडिटिंग
                      </p>
                    </div>
                  </div>

                  {/* Right: Action Pill */}
                  <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-black text-white shadow-2xs group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-indigo-500 transition-all duration-200">
                    <Sliders className="w-3.5 h-3.5 text-blue-300 group-hover:text-white" />
                    <span>उघडा ↗</span>
                  </div>
                </div>
              </button>
            </div>

          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Live Authentic Document / Sheet Preview     */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Top Bar with Title, 2 Page Sizes, Fullscreen Preview, and Print/Download buttons */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
            
            {/* Left: Eye Icon + Title + 2 Page Sizes toggle + Full Preview button */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-slate-200">
                <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>
                  {pageSize === '4x6' ? '4×6 शीट प्रिव्ह्यू (12 फोटो)' : 'A4 शीट प्रिव्ह्यू (30 फोटो)'}
                </span>
              </div>

              {/* 2 Page Sizes: 4x6 and A4 Toggle Pills */}
              <div className="inline-flex rounded-lg p-0.5 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => handlePageSizeChange('4x6')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    pageSize === '4x6'
                      ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
                  }`}
                >
                  4×6 Inch (12 फोटो)
                </button>
                <button
                  type="button"
                  onClick={() => handlePageSizeChange('a4')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    pageSize === 'a4'
                      ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
                  }`}
                >
                  A4 साईझ (30 फोटो)
                </button>
              </div>

              {/* Fullscreen Big Preview Trigger Button */}
              <button
                type="button"
                onClick={() => setIsFullScreenPreview(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                title="पूर्ण स्क्रीनवर मोठा प्रिव्ह्यू पहा"
              >
                <Maximize2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>फुल प्रिव्ह्यू</span>
              </button>
            </div>

            {/* Right: [ 🖨️ प्रिंट ], [ 📥 PDF ], [ 🖼️ JPG ] */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDirectPrint}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60 shrink-0"
                title={`A4 प्रिंट काढा - ${pageSize === '4x6' ? '4X6' : 'A4'} साईझ`}
              >
                <Printer className="w-4 h-4 text-blue-100" />
                <span>प्रिंट</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60 shrink-0"
                title="HD PDF डाऊनलोड करा"
              >
                <Download className="w-4 h-4 text-emerald-100" />
                <span>PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSheetJpg}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60 shrink-0"
                title="HD JPG फोटो डाऊनलोड करा"
              >
                <ImageIcon className="w-4 h-4 text-purple-100" />
                <span>JPG</span>
              </button>
            </div>
          </div>

          {/* Sheet Container with Realistic Paper Shadow & Full/Big Preview Size */}
          <div className="w-full flex justify-center overflow-x-auto p-4 sm:p-6 bg-slate-200/80 dark:bg-slate-950 rounded-3xl border border-slate-300/80 dark:border-slate-800">
            <div
              className="bg-white text-black shadow-2xl relative transition-all duration-200 select-none border-2 border-gray-300 rounded-sm w-full"
              style={{
                maxWidth: pageSize === '4x6' ? '460px' : '520px',
                aspectRatio: pageSize === '4x6' ? '101.6 / 152.4' : '210 / 297',
                padding: pageSize === '4x6' ? '4.92%' : '2.38%',
                boxSizing: 'border-box',
              }}
            >
              {/* 
                CRITICAL REQUIREMENT:
                Grid columns & rows are ALWAYS FIXED (3x4 for 4x6, 5x6 for A4).
                Photo dimensions DO NOT STRETCH OR CHANGE if only 1, 2, or 6 photos are present!
                NO DOTTED CUT LINES!
              */}
              <div 
                className="w-full h-full grid gap-1.5 sm:gap-2"
                style={{
                  gridTemplateColumns: `repeat(${currentConfig.cols}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${currentConfig.rows}, minmax(0, 1fr))`,
                }}
              >
                {sheetSlots.map((slot, index) => {
                  const photo = slot.photo;
                  if (!photo) {
                    // Empty slot: clean light dashed box, remains blank paper on print/PDF!
                    return (
                      <div
                        key={`empty-${index}`}
                        onClick={() => updateActivePhoto({ copies: activePhoto.copies + 1 })}
                        className="w-full h-full rounded border border-dashed border-gray-300 bg-gray-50/50 flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/30 cursor-pointer transition-all group p-1"
                        title="क्लिक करून सक्रिय फोटोची प्रत जोडा"
                      >
                        <span className="text-[11px] sm:text-xs font-bold opacity-60 group-hover:opacity-100">#{index + 1}</span>
                        <span className="text-[9px] sm:text-[10px] font-semibold opacity-40 group-hover:opacity-100">+ रिकामा</span>
                      </div>
                    );
                  }

                  const photoIndex = photos.findIndex((p) => p.id === photo.id) + 1;
                  const isSelected = photo.id === activePhotoId;
                  const panXPercent = (photo.pan.x / editorWidth) * 100;
                  const panYPercent = (photo.pan.y / editorHeight) * 100;

                  return (
                    <div
                      key={`slot-${index}`}
                      onClick={() => setActivePhotoId(photo.id)}
                      className={`relative w-full h-full overflow-hidden transition-all cursor-pointer bg-white ${
                        photos.length > 1 && isSelected ? 'ring-2 ring-blue-500 shadow-xs' : ''
                      }`}
                      title={`${photo.label} (क्लिक करून संपादन करा)`}
                    >
                      <div
                        className="w-full h-full relative"
                        style={{
                          transform: photo.src 
                            ? `translate(${panXPercent}%, ${panYPercent}%) rotate(${photo.rotation}deg) scale(${photo.zoom})` 
                            : 'none',
                          transformOrigin: 'center center',
                        }}
                      >
                        {photo.src ? (
                          <img
                            src={photo.src}
                            alt=""
                            className="w-full h-full object-cover pointer-events-none"
                            style={{
                              filter: `brightness(${photo.brightness ?? 100}%) contrast(${photo.contrast ?? 100}%) saturate(${photo.saturation ?? 100}%) ${photo.isGrayscale ? 'grayscale(100%)' : ''} ${photo.isSepia ? 'sepia(100%)' : ''}`,
                              transform: photo.flipH ? 'scaleX(-1)' : 'none',
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-gray-400 p-1 text-center select-none">
                            <User className="w-5 h-5 text-gray-300 mb-0.5" />
                            <span className="text-[8px] sm:text-[9px] font-bold text-gray-400 leading-tight">फोटो निवडा</span>
                          </div>
                        )}
                      </div>

                      {/* Custom Photo Border */}
                      {hasBorder && photo.src && (
                        <div 
                          className="absolute inset-0 pointer-events-none z-10" 
                          style={{
                            borderWidth: `${borderWidth}px`,
                            borderColor: borderColor,
                            borderStyle: borderStyle,
                          }}
                        />
                      )}

                      {/* Name Date bottom strip on photo */}
                      {photo.enableNameDate && (photo.candidateName || photo.photoDate) && (
                        <div 
                          className="absolute bottom-0 inset-x-0 py-0.5 sm:py-1 text-center leading-none pointer-events-none z-20 border-t border-black"
                          style={{
                            backgroundColor: photo.nameDateBgColor || '#ffffff',
                          }}
                        >
                          {photo.candidateName && (
                            <div 
                              className="font-black truncate px-0.5 leading-tight"
                              style={{
                                color: photo.nameDateFontColor || '#000000',
                                fontSize: `${Math.max(7, (photo.nameDateFontSize || 15) * 0.58)}px`,
                              }}
                            >
                              {photo.candidateName.toUpperCase()}
                            </div>
                          )}
                          {photo.photoDate && (
                            <div 
                              className="font-mono font-bold mt-0.5 leading-tight"
                              style={{
                                color: photo.nameDateFontColor || '#475569',
                                fontSize: `${Math.max(6, (photo.nameDateFontSize || 15) * 0.48)}px`,
                              }}
                            >
                              {photo.photoDate}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Secondary Actions & Tips */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <button
              type="button"
              onClick={handleDownloadSheetJpg}
              disabled={isExporting}
              className="font-bold text-gray-600 dark:text-slate-300 hover:text-blue-600 flex items-center gap-1.5 cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-blue-600" />
              <span>300 DPI हाय-क्वालिटी JPG इमेज डाऊनलोड</span>
            </button>

            <span className="text-[11px] text-gray-500 dark:text-slate-400">
              प्रिंट शॉर्टकट: <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-800 border rounded font-mono font-bold text-gray-700 dark:text-slate-300">Ctrl + P</kbd>
            </span>
          </div>

          {/* Guarantee Note */}
          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 rounded-2xl text-xs text-blue-900 dark:text-blue-300 leading-relaxed space-y-1">
            <p>
              <strong>✅ ५ mm ऑल मार्जिन गॅरंटी (Exact 5mm Margins on All Sides):</strong> 4×6 आणि A4 दोन्ही शीटवर सर्व ४ बाजूंनी (Top, Bottom, Left, Right) अचूक 5 mm सुरक्षित मार्जिन सेट केले आहे. <strong>[ 🖨️ प्रिंट ({pageSize === '4x6' ? '4X6' : 'A4'}) ]</strong>, <strong>[ 📥 PDF डाऊनलोड ]</strong>, आणि <strong>[ 🖼️ JPG इमेज डाऊनलोड ]</strong> या तिन्ही बटणांवर क्लिक केल्यावर परफेक्ट साईझ (4×6 किंवा A4) व 5mm ऑल मार्जिनसह मिळतात.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

import React, { useRef, useState } from 'react';
import { Camera, X, Crop, RefreshCw, CheckCircle2, Sparkles } from 'lucide-react';
import { PhotoCropModal } from './PhotoCropModal';
import { extractPhotoFromDocument } from '../utils/pdfPhotoExtractor';

interface PhotographSectionProps {
  photoUrl: string;
  onChange: (url: string) => void;
  compact?: boolean;
  isError?: boolean;
  isShaking?: boolean;
}

export const PhotographSection: React.FC<PhotographSectionProps> = ({
  photoUrl,
  onChange,
  compact = false,
  isError = false,
  isShaking = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const photo = await extractPhotoFromDocument(file);
        if (photo) {
          setImageToCrop(photo);
          setIsCropModalOpen(true);
        }
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const rawData = event.target.result as string;
            setImageToCrop(rawData);
            setIsCropModalOpen(true);
          }
        };
        reader.readAsDataURL(file);
      }
      e.target.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const photo = await extractPhotoFromDocument(file);
        if (photo) {
          setImageToCrop(photo);
          setIsCropModalOpen(true);
        }
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const rawData = event.target.result as string;
            setImageToCrop(rawData);
            setIsCropModalOpen(true);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleOpenCropper = () => {
    if (photoUrl) {
      setImageToCrop(photoUrl);
      setIsCropModalOpen(true);
    }
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    onChange(croppedDataUrl);
  };

  if (compact) {
    return (
      <div className="flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-1.5">
          <label className="block text-sm font-semibold text-gray-800">
            Photograph <span className="text-xs text-gray-500 font-normal">(पासपोर्ट फोटो)</span> <span className="text-red-500">*</span>
          </label>
          {photoUrl && (
            <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200 flex items-center gap-0.5 shadow-2xs">
              <Sparkles className="w-2.5 h-2.5 text-yellow-500" />
              HD Fit
            </span>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`w-full rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all min-h-[178px] border-2 border-dashed ${
            isShaking ? 'animate-shake' : ''
          } ${
            isError
              ? 'border-red-500 bg-red-50/40 ring-2 ring-red-200'
              : 'border-emerald-300 hover:border-emerald-500 bg-[#f4fbf5]'
          }`}
        >
          {photoUrl ? (
            <div className="flex flex-col items-center gap-2">
              <div className="relative group">
                {/* 4:5 Passport Frame: 124x155px perfectly fitted with crisp border */}
                <div className="w-[124px] h-[155px] rounded-xl overflow-hidden border-2 border-emerald-700 shadow-md bg-white flex items-center justify-center">
                  <img
                    src={photoUrl}
                    alt="Farmer Passport Photo"
                    className="w-full h-full object-cover object-center"
                    style={{ imageRendering: '-webkit-optimize-contrast' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md transition-colors cursor-pointer"
                  title="फोटो काढा (Remove photo)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded text-xs font-semibold cursor-pointer shadow-2xs"
                  title="फोटो बदला"
                >
                  बदला
                </button>
                <button
                  type="button"
                  onClick={handleOpenCropper}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-400 rounded text-xs font-semibold cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="फोटो क्रॉप व चेहरा सेंटर करा"
                >
                  <Crop className="w-3 h-3 text-emerald-700" />
                  फोटो क्रॉप
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center py-4 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform shadow-xs">
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-emerald-900 group-hover:text-emerald-700">
                + फोटो जोडा (Add Photo)
              </span>
              <span className="text-[11px] text-gray-500 mt-0.5 font-medium">
                HD Quality • ४:५ फ्रेम
              </span>
            </button>
          )}
        </div>

        {/* Interactive Photo Crop Modal */}
        <PhotoCropModal
          isOpen={isCropModalOpen}
          imageSrc={imageToCrop}
          onClose={() => setIsCropModalOpen(false)}
          onCropComplete={handleCropComplete}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-2 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#2e7d32]">
          छायाचित्र / Photograph
        </h2>
        {photoUrl && (
          <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            HD फोटो जोडला आहे
          </span>
        )}
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="bg-[#edf8ee] border border-green-200/80 rounded-xl p-5 sm:p-7 flex flex-col items-center justify-center text-center transition-all"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {photoUrl ? (
          <div className="relative group mb-4">
            <div className="w-[160px] h-[200px] rounded-xl overflow-hidden border-2 border-emerald-700 shadow-md bg-white flex items-center justify-center">
              <img
                src={photoUrl}
                alt="Farmer Passport Photo"
                className="w-full h-full object-cover object-center"
                style={{ imageRendering: '-webkit-optimize-contrast' }}
              />
            </div>
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute -top-2.5 -right-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-md transition-colors cursor-pointer"
              title="फोटो काढा (Remove photo)"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="mt-2 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
              <Sparkles className="w-3 h-3 text-yellow-600" />
              HD Frame Fit
            </div>
          </div>
        ) : (
          <div className="w-[160px] h-[200px] bg-white rounded-xl border border-dashed border-gray-300 shadow-xs flex flex-col items-center justify-center mb-4 text-gray-400">
            <div className="p-3 bg-gray-50 rounded-full mb-2">
              <Camera className="w-10 h-10 text-gray-400" />
            </div>
            <span className="text-xs text-gray-500 font-medium">४:५ पासपोर्ट फ्रेम</span>
          </div>
        )}

        {/* Buttons Row: Choose Photo & Crop Option */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 bg-[#3fa857] hover:bg-[#329249] text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition-colors text-sm cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            {photoUrl ? 'नवीन फोटो निवडा (Change Photo)' : 'फोटो निवडा (Choose Photo)'}
          </button>

          {photoUrl && (
            <button
              type="button"
              onClick={handleOpenCropper}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-500 font-semibold px-4 py-2.5 rounded-lg shadow-2xs transition-colors text-sm cursor-pointer"
              title="फोटो क्रॉप व चेहरा मध्यभागी आणा"
            >
              <Crop className="w-4 h-4 text-emerald-700" />
              फोटो क्रॉप करा (Crop Photo)
            </button>
          )}
        </div>

        <p className="text-xs text-gray-600 max-w-sm">
          पासपोर्ट फोटो आकार • Ultra HD गुणवत्ता • फोटो निवडून फ्रेममध्ये अचूक फिट करा.
        </p>
      </div>

      {/* Interactive Photo Crop Modal */}
      <PhotoCropModal
        isOpen={isCropModalOpen}
        imageSrc={imageToCrop}
        onClose={() => setIsCropModalOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

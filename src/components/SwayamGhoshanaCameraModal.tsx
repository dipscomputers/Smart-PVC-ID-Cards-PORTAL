import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface SwayamGhoshanaCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoDataUrl: string) => void;
}

export const SwayamGhoshanaCameraModal: React.FC<SwayamGhoshanaCameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);

  // Start webcam
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsStarting(true);
    setCameraError(null);
    setCapturedImage(null);

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setIsStarting(false);
      } catch (err) {
        console.warn('Camera access error:', err);
        if (isMounted) {
          setCameraError('कॅमेरा चालू करता आला नाही. कृपया ब्राउझरमध्ये कॅमेरा परवानगी (Permission) तपासा.');
          setIsStarting(false);
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = 450;
    canvas.height = 550;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Crop center 3:4 passport aspect ratio from video feed
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;

    const targetRatio = 450 / 550;
    let sx = 0;
    let sy = 0;
    let sWidth = vw;
    let sHeight = vh;

    if (vw / vh > targetRatio) {
      sWidth = vh * targetRatio;
      sx = (vw - sWidth) / 2;
    } else {
      sHeight = vw / targetRatio;
      sy = (vh - sHeight) / 2;
    }

    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleSave = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-lg">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                थेट फोटो काढा (Webcam Photo)
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                अर्जदाराचा पासपोर्ट आकाराचा फोटो
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewfinder */}
        <div className="p-6 flex flex-col items-center">
          {cameraError ? (
            <div className="w-full py-8 px-4 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900 flex flex-col items-center text-center gap-2">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              <p className="text-xs font-bold text-red-700 dark:text-red-300">{cameraError}</p>
            </div>
          ) : capturedImage ? (
            <div className="w-64 h-80 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-md relative bg-black">
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-64 h-80 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-slate-700 shadow-md relative bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isStarting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-xs font-semibold">
                  कॅमेरा सुरू होत आहे...
                </div>
              )}
              {/* Passport Guide Overlay */}
              <div className="absolute inset-4 border border-white/40 rounded-lg pointer-events-none flex items-center justify-center">
                <div className="w-36 h-48 border border-white/60 rounded-full pointer-events-none"></div>
              </div>
            </div>
          )}

          {/* Capture / Retake Controls */}
          <div className="mt-6 flex items-center justify-center gap-3 w-full">
            {capturedImage ? (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex-1 py-2.5 px-4 text-xs font-bold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>पुन्हा काढा (Retake)</span>
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>हा फोटो वापरा (Use Photo)</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleCapture}
                disabled={isStarting || Boolean(cameraError)}
                className="w-full py-3 px-6 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>फोटो काढा (Capture Photo)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

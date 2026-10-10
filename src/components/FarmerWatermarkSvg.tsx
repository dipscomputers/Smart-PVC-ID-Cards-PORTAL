import React from 'react';

interface FarmerWatermarkSvgProps {
  className?: string;
  opacity?: number;
}

/**
 * Authentic Maharashtrian Farmer with Orange Turban holding green crop stalks
 * Exactly matching user's reference illustration.
 */
export const FarmerWatermarkSvg: React.FC<FarmerWatermarkSvgProps> = ({
  className = 'w-full h-full',
  opacity = 0.05,
}) => {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity }}
    >
      <g stroke="#1c1917" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        {/* === SHIRT BODY === */}
        {/* Main Kurta Body */}
        <path
          d="M130 380 L135 240 C140 180 160 145 195 145 C230 145 250 180 255 240 L260 380 Z"
          fill="#f4eed7"
        />

        {/* Sleeves */}
        {/* Right Arm (Viewer's Left) */}
        <path
          d="M135 240 C105 250 90 280 90 320 L130 380 L170 340 L160 280 Z"
          fill="#f4eed7"
        />
        {/* Left Arm (Viewer's Right) */}
        <path
          d="M255 240 C285 250 305 280 305 320 L265 380 L230 340 L235 280 Z"
          fill="#f4eed7"
        />

        {/* Kurta Collar & Placket */}
        <path d="M175 155 L195 185 L215 155" fill="#ebe4c8" />
        <path d="M195 185 L195 270" />
        <circle cx="195" cy="210" r="2" fill="#1c1917" />
        <circle cx="195" cy="235" r="2" fill="#1c1917" />
        <circle cx="195" cy="260" r="2" fill="#1c1917" />

        {/* === TURBAN TAIL (Pallu over shoulder) === */}
        <path
          d="M152 145 C145 170 140 200 135 230 C132 245 138 255 148 250 C158 245 162 230 165 210 C168 185 170 165 172 150 Z"
          fill="#f97316"
        />
        <path d="M140 235 C145 242 152 240 156 235" />

        {/* === NECK === */}
        <path d="M178 140 L178 165 C178 178 212 178 212 165 L212 140 Z" fill="#e8b18a" />

        {/* === FACE === */}
        <path
          d="M165 105 C165 145 225 145 225 105 C225 80 165 80 165 105 Z"
          fill="#f5c29a"
        />

        {/* Ears */}
        <ellipse cx="163" cy="115" rx="5" ry="8" fill="#e8b18a" />
        <ellipse cx="227" cy="115" rx="5" ry="8" fill="#e8b18a" />

        {/* Eyes & Eyebrows */}
        <path d="M174 105 Q182 101 190 105" strokeWidth="2.5" fill="none" />
        <path d="M200 105 Q208 101 216 105" strokeWidth="2.5" fill="none" />
        <ellipse cx="182" cy="110" rx="3.5" ry="3.5" fill="#1c1917" />
        <ellipse cx="208" cy="110" rx="3.5" ry="3.5" fill="#1c1917" />
        <circle cx="183.5" cy="108.5" r="1" fill="#ffffff" stroke="none" />
        <circle cx="209.5" cy="108.5" r="1" fill="#ffffff" stroke="none" />

        {/* Red Vermilion Tilak on Forehead */}
        <path d="M195 95 L195 103" stroke="#dc2626" strokeWidth="3" />

        {/* Nose */}
        <path d="M195 108 L191 118 L199 118" strokeWidth="2" strokeLinejoin="round" fill="none" />

        {/* Traditional Mustache & Smile */}
        <path
          d="M178 126 C188 121 194 125 195 127 C196 125 202 121 212 126 C216 128 214 133 210 132 C202 130 197 131 195 133 C193 131 188 130 180 132 C176 133 174 128 178 126 Z"
          fill="#1c1917"
        />
        <path d="M188 136 Q195 140 202 136" strokeWidth="2" fill="none" />

        {/* === ORANGE PHETA (Turban) === */}
        {/* Main Turban Dome & Folds */}
        <path
          d="M150 100 C145 60 170 35 200 35 C235 35 255 60 245 105 C240 120 230 125 220 120 C205 115 185 115 170 120 C155 125 148 115 150 100 Z"
          fill="#f97316"
        />
        {/* Inner Folds */}
        <path d="M152 90 C165 65 190 55 235 60" fill="none" stroke="#ea580c" strokeWidth="3.5" />
        <path d="M155 105 C175 80 205 75 240 85" fill="none" stroke="#ea580c" strokeWidth="3.5" />
        <path d="M165 115 C185 98 215 95 232 108" fill="none" stroke="#ea580c" strokeWidth="3" />
        <path d="M185 45 C195 38 210 38 220 48" fill="none" stroke="#c2410c" strokeWidth="3" />

        {/* === GREEN CROP SHEAF (In farmer's hands) === */}
        {/* Crop Stalks Behind Hands */}
        <g stroke="#15803d" strokeWidth="3">
          <path d="M200 290 Q220 220 270 160" />
          <path d="M205 290 Q230 215 285 155" />
          <path d="M198 290 Q215 210 260 150" />
          <path d="M202 290 Q240 225 295 165" />
          <path d="M206 290 Q245 230 305 175" />
          <path d="M195 290 Q210 205 250 145" />
        </g>

        {/* Lush Green Crop Leaf Tips */}
        <path
          d="M210 280 C240 230 260 170 300 135 C290 155 310 140 315 150 C295 165 310 160 310 175 C290 185 300 190 295 205 C270 235 240 270 210 290 Z"
          fill="#22c55e"
        />
        <path
          d="M230 250 C250 200 275 160 305 130 C295 150 315 145 320 160 C295 180 305 195 290 220 C270 240 250 260 230 275 Z"
          fill="#16a34a"
        />
        {/* Grain heads / Spikes */}
        <g stroke="#4ade80" strokeWidth="2.5">
          <path d="M290 140 L295 130" />
          <path d="M300 145 L310 135" />
          <path d="M305 155 L318 145" />
          <path d="M308 170 L322 160" />
          <path d="M280 150 L285 138" />
        </g>

        {/* === HANDS HOLDING THE CROP === */}
        {/* Farmer's Right Hand (Viewer's Left) */}
        <path
          d="M178 275 C185 260 205 260 215 270 C218 278 215 292 205 298 C195 304 182 298 178 285 Z"
          fill="#f5c29a"
        />
        {/* Fingers holding stalks */}
        <path d="M190 268 C198 266 210 268 214 275" strokeWidth="2" />
        <path d="M188 276 C196 274 208 276 212 283" strokeWidth="2" />
        <path d="M186 284 C194 282 206 284 210 291" strokeWidth="2" />

        {/* Farmer's Left Hand (Viewer's Right) */}
        <path
          d="M210 265 C218 252 235 255 240 268 C242 278 238 290 228 294 C218 298 208 288 210 275 Z"
          fill="#e8b18a"
        />
        <path d="M220 262 C228 262 236 268 238 274" strokeWidth="2" />
        <path d="M218 270 C226 270 234 276 236 282" strokeWidth="2" />

        {/* Crop Stalks bottom end */}
        <path d="M195 295 L190 325 M205 295 L202 325 M215 295 L212 325" stroke="#15803d" strokeWidth="3" />
      </g>
    </svg>
  );
};

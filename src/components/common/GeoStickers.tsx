import React from 'react';

interface StickerProps {
  className?: string;
  size?: number;
}

/**
 * 1. Quả Địa Cầu 3D (3D Globe Sticker)
 * Tượng trưng cho Trái Đất, kinh tuyến vĩ tuyến, chuyển động vũ trụ
 */
export const GeoGlobeSticker: React.FC<StickerProps> = ({ className = 'w-10 h-10', size }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block drop-shadow-md select-none shrink-0 ${className}`}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Vòng hào quang mềm */}
    <circle cx="50" cy="50" r="44" fill="url(#globeGlow)" opacity="0.4" />
    
    {/* Quả cầu chính - Gradient Xanh Ngọc Mint */}
    <circle cx="50" cy="50" r="38" fill="url(#globeOcean)" stroke="#2C9C95" strokeWidth="2.5" />
    
    {/* Lục địa / Đất liền - Màu Vàng Kem Nắng */}
    <path
      d="M34 26C38 24 45 28 47 33C49 38 43 42 41 46C39 50 44 54 42 58C40 62 31 66 27 60C23 54 26 44 28 38C30 32 30 28 34 26Z"
      fill="#FDE68A"
      stroke="#F59E0B"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M58 24C64 25 68 31 72 35C76 39 71 45 68 47C65 49 66 55 63 58C60 61 55 57 56 52C57 47 62 44 59 38C56 32 52 23 58 24Z"
      fill="#FDE68A"
      stroke="#F59E0B"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M48 68C53 66 59 70 60 74C61 78 54 81 49 80C44 79 43 70 48 68Z"
      fill="#FDE68A"
      stroke="#F59E0B"
      strokeWidth="1.2"
    />

    {/* Đường Kinh Tuyến & Vĩ Tuyến */}
    <ellipse cx="50" cy="50" rx="38" ry="14" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.65" />
    <ellipse cx="50" cy="50" rx="16" ry="38" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.65" />
    <line x1="12" y1="50" x2="88" y2="50" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.75" />

    {/* Vòng quỹ đạo vàng nghiêng 3D */}
    <ellipse
      cx="50"
      cy="50"
      rx="48"
      ry="18"
      stroke="url(#orbitGold)"
      strokeWidth="3.5"
      strokeLinecap="round"
      transform="rotate(-24 50 50)"
    />
    {/* Vệ tinh nhỏ / Ngôi sao lấp lánh */}
    <circle cx="86" cy="34" r="4.5" fill="#FDC24F" stroke="#FFFFFF" strokeWidth="1.5" />
    <circle cx="16" cy="64" r="3" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1" />

    {/* Đốm sáng phản chiếu bóng kính */}
    <ellipse cx="36" cy="30" rx="10" ry="6" fill="#FFFFFF" opacity="0.45" transform="rotate(-30 36 30)" />

    <defs>
      <radialGradient id="globeGlow" cx="50%" cy="50%" r="50%">
        <stop offset="60%" stopColor="#48C6B9" />
        <stop offset="100%" stopColor="#48C6B9" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="globeOcean" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
        <stop stopColor="#5FE3D6" />
        <stop offset="60%" stopColor="#3AAFA7" />
        <stop offset="100%" stopColor="#258A83" />
      </linearGradient>
      <linearGradient id="orbitGold" x1="5" y1="50" x2="95" y2="50" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDC24F" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#FBBF24" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * 2. La Bàn Thám Hiểm (Adventure Compass Sticker)
 * Tượng trưng cho phương hướng, định vị địa lí
 */
export const GeoCompassSticker: React.FC<StickerProps> = ({ className = 'w-10 h-10', size }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block drop-shadow-md select-none shrink-0 ${className}`}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Vòng móc treo la bàn */}
    <circle cx="50" cy="11" r="7" stroke="#F59E0B" strokeWidth="3" fill="none" />
    <rect x="47" y="17" width="6" height="4" rx="1" fill="#F59E0B" />

    {/* Vỏ ngoài mạ vàng */}
    <circle cx="50" cy="54" r="40" fill="url(#compassCase)" stroke="#D97706" strokeWidth="2.5" />
    {/* Vòng số bên trong */}
    <circle cx="50" cy="54" r="33" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />

    {/* Các vạch chia độ */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
      <line
        key={deg}
        x1="50"
        y1="24"
        x2="50"
        y2="28"
        stroke="#94A3B8"
        strokeWidth={deg % 90 === 0 ? "2" : "1"}
        strokeLinecap="round"
        transform={`rotate(${deg} 50 54)`}
      />
    ))}

    {/* Các chữ cái 4 phương: N, S, E, W */}
    <text x="50" y="32" fill="#EF4444" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">B</text>
    <text x="50" y="82" fill="#0284C7" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">N</text>
    <text x="75" y="57" fill="#64748B" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">Đ</text>
    <text x="25" y="57" fill="#64748B" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">T</text>

    {/* Kim la bàn (Đỏ Cam chỉ Bắc, Xanh Ngọc chỉ Nam) */}
    <polygon points="50,26 55,54 50,50" fill="#EF4444" />
    <polygon points="50,26 45,54 50,50" fill="#F87171" />
    <polygon points="50,82 55,54 50,58" fill="#0284C7" />
    <polygon points="50,82 45,54 50,58" fill="#38BDF8" />

    {/* Trục tâm la bàn */}
    <circle cx="50" cy="54" r="4.5" fill="#FDC24F" stroke="#D97706" strokeWidth="1.5" />
    <circle cx="50" cy="54" r="1.5" fill="#FFFFFF" />

    <defs>
      <linearGradient id="compassCase" x1="15" y1="20" x2="85" y2="90" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FEF08A" />
        <stop offset="50%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * 3. Cuộn Bản Đồ Thế Giới (Treasure / World Map Scroll Sticker)
 * Tượng trưng cho Atlat, lược đồ, tư liệu bản đồ
 */
export const GeoMapSticker: React.FC<StickerProps> = ({ className = 'w-10 h-10', size }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block drop-shadow-md select-none shrink-0 ${className}`}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Thân bản đồ mở cong */}
    <path
      d="M16 28C24 24 32 30 40 27C48 24 56 30 64 27C72 24 80 29 86 26V74C80 77 72 72 64 75C56 78 48 72 40 75C32 78 24 72 16 76V28Z"
      fill="#FEF9C3"
      stroke="#EAB308"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Vùng gấp nếp đổ bóng */}
    <path d="M40 27V75" stroke="#E2E8F0" strokeWidth="1.5" opacity="0.6" />
    <path d="M64 27V75" stroke="#E2E8F0" strokeWidth="1.5" opacity="0.6" />

    {/* Đường bờ biển minh họa */}
    <path
      d="M24 38C28 36 34 38 36 44C38 50 33 56 28 58C25 59 23 54 24 50Z"
      fill="#A7F3D0"
      stroke="#10B981"
      strokeWidth="1.2"
    />
    <path
      d="M48 40C54 38 60 41 62 46C64 51 58 57 52 56C47 55 45 44 48 40Z"
      fill="#A7F3D0"
      stroke="#10B981"
      strokeWidth="1.2"
    />

    {/* Đường nét đứt hành trình thám hiểm */}
    <path
      d="M32 50C40 54 46 48 54 53C62 58 68 52 74 58"
      stroke="#EF4444"
      strokeWidth="2"
      strokeDasharray="3 3"
      strokeLinecap="round"
    />

    {/* Điểm đích đến chữ X đỏ */}
    <path d="M72 56L78 62M78 56L72 62" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />

    {/* Nơ buộc hoặc ghim la bàn nhỏ góc */}
    <circle cx="26" cy="34" r="4" fill="#FDC24F" stroke="#D97706" strokeWidth="1.2" />
  </svg>
);

/**
 * 4. Đỉnh Núi Hùng Vĩ Fansipan (Mountain Peak Sticker)
 * Tượng trưng cho địa hình, địa mạo Tây Bắc Sì Lở Lầu
 */
export const GeoMountainSticker: React.FC<StickerProps> = ({ className = 'w-10 h-10', size }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block drop-shadow-md select-none shrink-0 ${className}`}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Mặt trời mọc sau núi */}
    <circle cx="68" cy="36" r="16" fill="url(#sunWarm)" stroke="#F59E0B" strokeWidth="1.5" />

    {/* Đỉnh núi sau */}
    <polygon points="46,30 22,78 70,78" fill="#64748B" stroke="#475569" strokeWidth="2" strokeLinejoin="round" />
    <polygon points="46,30 38,46 46,42 54,48 58,42" fill="#F1F5F9" />

    {/* Núi chính hùng vĩ phía trước */}
    <polygon points="50,22 14,84 86,84" fill="url(#mountainGrad)" stroke="#1F5552" strokeWidth="2.5" strokeLinejoin="round" />
    
    {/* Mỏm tuyết trắng trên đỉnh */}
    <polygon points="50,22 38,42 45,39 50,45 56,38 62,44" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
    
    {/* Rặng cây thông chân núi */}
    <polygon points="26,76 22,84 30,84" fill="#047857" />
    <polygon points="36,74 31,84 41,84" fill="#059669" />
    <polygon points="72,75 67,84 77,84" fill="#047857" />

    <defs>
      <linearGradient id="mountainGrad" x1="50" y1="22" x2="50" y2="84" gradientUnits="userSpaceOnUse">
        <stop stopColor="#48C6B9" />
        <stop offset="60%" stopColor="#2F8C86" />
        <stop offset="100%" stopColor="#1B5B57" />
      </linearGradient>
      <radialGradient id="sunWarm" cx="68" cy="36" r="16" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FEF08A" />
        <stop offset="70%" stopColor="#FDC24F" />
        <stop offset="100%" stopColor="#F59E0B" />
      </radialGradient>
    </defs>
  </svg>
);

/**
 * 5. Khí Tượng Mây & Nắng (Weather Sun & Cloud Sticker)
 * Tượng trưng cho khí hậu, lượng mưa, thời tiết
 */
export const GeoWeatherSticker: React.FC<StickerProps> = ({ className = 'w-10 h-10', size }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block drop-shadow-md select-none shrink-0 ${className}`}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Mặt trời vàng rạng rỡ */}
    <circle cx="40" cy="40" r="18" fill="#FDC24F" stroke="#F59E0B" strokeWidth="2.5" />
    {/* Tia nắng */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
      <line
        key={deg}
        x1="40"
        y1="16"
        x2="40"
        y2="10"
        stroke="#F59E0B"
        strokeWidth="3"
        strokeLinecap="round"
        transform={`rotate(${deg} 40 40)`}
      />
    ))}

    {/* Đám mây trắng bồng bềnh */}
    <path
      d="M36 68H72C78 68 83 63 83 57C83 51 78 46 72 46C71.5 46 71 46.2 70.5 46.4C69 39 63 34 55 34C48 34 42 38 40 44C39 43.5 37.5 43 36 43C29 43 24 49 24 56C24 63 29 68 36 68Z"
      fill="#FFFFFF"
      stroke="#94A3B8"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    
    {/* Giọt nước mưa xanh ngọc */}
    <path d="M42 76C42 78.5 40 81 38 81C36 81 34 78.5 34 76C34 74 38 71 38 71C38 71 42 74 42 76Z" fill="#38BDF8" />
    <path d="M56 76C56 78.5 54 81 52 81C50 81 48 78.5 48 76C48 74 52 71 52 71C52 71 56 74 56 76Z" fill="#38BDF8" />
    <path d="M70 76C70 78.5 68 81 66 81C64 81 62 78.5 62 76C62 74 66 71 66 71C66 71 70 74 70 76Z" fill="#38BDF8" />
  </svg>
);

/**
 * 6. Thuyền Buồm Biển Đảo (Exploration Sailboat Sticker)
 * Tượng trưng cho địa lí biển đảo, đại dương
 */
export const GeoSailboatSticker: React.FC<StickerProps> = ({ className = 'w-10 h-10', size }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block drop-shadow-md select-none shrink-0 ${className}`}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Thân thuyền gỗ */}
    <path
      d="M20 66C26 78 74 78 80 66H20Z"
      fill="#F59E0B"
      stroke="#D97706"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <line x1="50" y1="20" x2="50" y2="66" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />

    {/* Cánh buồm chính bên phải (Xanh ngọc Vitality) */}
    <path
      d="M52 24C66 38 72 54 72 60H52V24Z"
      fill="#48C6B9"
      stroke="#2C9C95"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Cánh buồm phụ bên trái (Vàng cam) */}
    <path
      d="M48 30C36 40 32 54 32 60H48V30Z"
      fill="#FDC24F"
      stroke="#F59E0B"
      strokeWidth="2"
      strokeLinejoin="round"
    />

    {/* Cờ đuôi nheo đỏ trên đỉnh cột */}
    <polygon points="50,20 40,24 50,28" fill="#EF4444" />

    {/* Làn sóng biển dập dềnh */}
    <path
      d="M12 76C18 73 24 79 30 76C36 73 42 79 48 76C54 73 60 79 66 76C72 73 78 79 84 76C90 73 94 76 96 76"
      stroke="#38BDF8"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * 7. Ghim Tọa Độ GPS Vàng (3D Location Pin Sticker)
 * Tượng trưng cho điểm đến, tọa độ, bản đồ hành chính
 */
export const GeoPinSticker: React.FC<StickerProps> = ({ className = 'w-10 h-10', size }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block drop-shadow-md select-none shrink-0 ${className}`}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Bóng đổ ghim dưới đất */}
    <ellipse cx="50" cy="85" rx="18" ry="6" fill="#000000" opacity="0.18" />

    {/* Thân ghim màu Đỏ San Hô & Vàng */}
    <path
      d="M50 82C50 82 74 54 74 38C74 24.7 63.3 14 50 14C36.7 14 26 24.7 26 38C26 54 50 82 50 82Z"
      fill="url(#pinGrad)"
      stroke="#DC2626"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />

    {/* Tâm điểm ngọc xanh */}
    <circle cx="50" cy="38" r="12" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.5" />
    <circle cx="50" cy="38" r="7" fill="#48C6B9" />
    <circle cx="48" cy="36" r="2" fill="#FFFFFF" />

    <defs>
      <linearGradient id="pinGrad" x1="26" y1="14" x2="74" y2="82" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F87171" />
        <stop offset="60%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#B91C1C" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * 8. Kính Viễn Vọng Khám Phá (Telescope Sticker)
 * Tượng trưng cho thiên văn, vũ trụ, khám phá khoa học
 */
export const GeoTelescopeSticker: React.FC<StickerProps> = ({ className = 'w-10 h-10', size }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block drop-shadow-md select-none shrink-0 ${className}`}
    style={size ? { width: size, height: size } : undefined}
  >
    {/* Chân giá 3 chân */}
    <line x1="50" y1="56" x2="28" y2="86" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
    <line x1="50" y1="56" x2="72" y2="86" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
    <line x1="50" y1="56" x2="50" y2="88" stroke="#334155" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="50" cy="56" r="5" fill="#FDC24F" stroke="#D97706" strokeWidth="1.5" />

    {/* Ống kính viễn vọng chéo */}
    <g transform="rotate(-30 50 46)">
      {/* Ống lớn */}
      <rect x="36" y="40" width="36" height="14" rx="2" fill="#48C6B9" stroke="#2C9C95" strokeWidth="2" />
      {/* Ống nhỏ phía sau */}
      <rect x="22" y="43" width="16" height="8" rx="1" fill="#3B97CE" stroke="#2563EB" strokeWidth="1.5" />
      {/* Thị kính */}
      <rect x="18" y="41.5" width="5" height="11" rx="1" fill="#1E293B" />
      {/* Viền thấu kính trước mạ vàng */}
      <rect x="71" y="38" width="5" height="18" rx="1.5" fill="#FDC24F" stroke="#D97706" strokeWidth="1.5" />
    </g>

    {/* Ngôi sao lấp lánh ở góc ngắm */}
    <path
      d="M80 18L82 23L87 25L82 27L80 32L78 27L73 25L78 23Z"
      fill="#FDC24F"
    />
    <circle cx="86" cy="14" r="1.5" fill="#FFFFFF" />
  </svg>
);

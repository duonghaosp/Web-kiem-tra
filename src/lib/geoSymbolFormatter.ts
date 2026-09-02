/**
 * Bộ chuyển đổi và chuẩn hóa ký hiệu Địa lí & Toán học chuyên dụng:
 * - Ký hiệu Độ (°), Phút (′), Giây (″) trong tọa độ địa lí
 * - Ký hiệu Nhiệt độ (℃), Độ muối phần nghìn (‰), Diện tích (km², m²), Thể tích (m³)
 * - Tự động nhận diện và chuyển đổi các mã LaTeX như ^\circ, \circ, ^o thành ký hiệu trực quan
 */

export const formatGeoMathSymbols = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  return text
    // 1. Chuyển đổi mã LaTeX độ sang ký hiệu độ chuẩn °
    .replace(/\^\\circ/g, '°')
    .replace(/\\circ/g, '°')
    .replace(/\\degree/g, '°')
    .replace(/\^\{o\}/g, '°')
    .replace(/\^\{O\}/g, '°')
    .replace(/\^\{0\}/g, '°')
    .replace(/(\d+)\^o\b/g, '$1°')
    .replace(/(\d+)\^O\b/g, '$1°')

    // 2. Chuyển đổi phút, giây trong tọa độ địa lí (21°01' B -> 21°01′ B)
    .replace(/(\d+)['’]/g, '$1′')
    .replace(/(\d+)["”]/g, '$1″')

    // 3. Chuyển đổi đơn vị diện tích và thể tích (km^2 -> km², m^3 -> m³)
    .replace(/km\^2/gi, 'km²')
    .replace(/m\^2/gi, 'm²')
    .replace(/cm\^2/gi, 'cm²')
    .replace(/mm\^2/gi, 'mm²')
    .replace(/ha\^2/gi, 'ha')
    .replace(/km\^3/gi, 'km³')
    .replace(/m\^3/gi, 'm³')
    .replace(/cm\^3/gi, 'cm³')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')

    // 4. Chuyển đổi độ C và phần nghìn độ muối
    .replace(/(\d+)\s*°\s*C\b/gi, '$1℃')
    .replace(/(\d+)\s*oC\b/gi, '$1℃')
    .replace(/\\permil/g, '‰')
    .replace(/\\pm/g, '±')

    // 5. Mũi tên và hướng
    .replace(/\\rightarrow/g, '→')
    .replace(/\\leftarrow/g, '←')
    .replace(/\\uparrow/g, '↑')
    .replace(/\\downarrow/g, '↓');
};

export interface GeoSymbol {
  symbol: string;
  label: string;
  category: 'coor' | 'unit' | 'math' | 'dir';
}

export const COMMON_GEO_SYMBOLS: GeoSymbol[] = [
  { symbol: '°', label: 'Độ (°)', category: 'coor' },
  { symbol: '′', label: 'Phút (′)', category: 'coor' },
  { symbol: '″', label: 'Giây (″)', category: 'coor' },
  { symbol: '℃', label: 'Độ C (℃)', category: 'unit' },
  { symbol: 'km²', label: 'km²', category: 'unit' },
  { symbol: 'm²', label: 'm²', category: 'unit' },
  { symbol: 'm³', label: 'm³', category: 'unit' },
  { symbol: '‰', label: 'Phần nghìn (‰)', category: 'unit' },
  { symbol: '°B', label: 'Vĩ độ Bắc (°B)', category: 'coor' },
  { symbol: '°N', label: 'Vĩ độ Nam (°N)', category: 'coor' },
  { symbol: '°Đ', label: 'Kinh độ Đông (°Đ)', category: 'coor' },
  { symbol: '°T', label: 'Kinh độ Tây (°T)', category: 'coor' },
  { symbol: '±', label: 'Sai số (±)', category: 'math' },
  { symbol: '→', label: 'Mũi tên (→)', category: 'dir' },
];

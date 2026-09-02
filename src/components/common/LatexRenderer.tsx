import React, { useMemo } from 'react';
import katex from 'katex';
import { formatGeoMathSymbols } from '../../lib/geoSymbolFormatter';

interface LatexRendererProps {
  content: string;
  className?: string;
  isPoetry?: boolean;
}

function formatRichText(text: string): string {
  if (!text) return '';

  // 1. Chuyển đổi Markdown:
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<u>$1</u>');

  // 2. Chuyển đổi BBCode (nếu giáo viên gõ cú pháp thẻ đóng mở)
  formatted = formatted
    .replace(/\[color=(#[a-fA-F0-9]{3,6}|[a-zA-Z]+)\]([\s\S]*?)\[\/color\]/g, '<span style="color: $1">$2</span>')
    .replace(/\[bg=(#[a-fA-F0-9]{3,6}|[a-zA-Z]+)\]([\s\S]*?)\[\/bg\]/g, '<mark style="background-color: $1; padding: 0.1em 0.3em; border-radius: 4px;">$2</mark>')
    .replace(/\[b\]([\s\S]*?)\[\/b\]/g, '<strong>$1</strong>')
    .replace(/\[i\]([\s\S]*?)\[\/i\]/g, '<em>$1</em>')
    .replace(/\[u\]([\s\S]*?)\[\/u\]/g, '<u>$1</u>');

  // 3. Chuẩn hóa xuống dòng \n -> <br/>
  formatted = formatted.replace(/\n/g, '<br/>');

  return formatted;
}

/**
 * Hiển thị văn bản kèm công thức Toán/Hóa/Tọa độ Địa lí (độ °, phút ′, giây ″, diện tích km², nhiệt độ ℃)
 * Hỗ trợ đầy đủ định dạng văn bản: In đậm, in nghiêng, gạch chân, đổi màu chữ, tô màu nền highlight.
 */
export const LatexRenderer: React.FC<LatexRendererProps> = ({
  content,
  className = '',
  isPoetry = false,
}) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    // 1. Chuẩn hóa tất cả ký hiệu Địa lí & Toán học thô trước
    const normalized = formatGeoMathSymbols(content);

    // 2. Regex tìm các khối LaTeX nếu có: $$formula$$ (display) hoặc $formula$ (inline)
    const regex = /(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g;

    return normalized.split(regex).map((part) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const formula = part.slice(2, -2);
        try {
          return katex.renderToString(formula, { displayMode: true, throwOnError: false });
        } catch (e) {
          return part;
        }
      } else if (part.startsWith('$') && part.endsWith('$')) {
        const formula = part.slice(1, -1);
        try {
          return katex.renderToString(formula, { displayMode: false, throwOnError: false });
        } catch (e) {
          return part;
        }
      } else {
        return formatRichText(part);
      }
    }).join('');
  }, [content]);

  return (
    <div
      className={`leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5 [&_font[size='2']]:text-xs [&_font[size='3']]:text-sm [&_font[size='4']]:text-base [&_font[size='5']]:text-lg [&_font[size='6']]:text-xl [&_font[size='6']]:font-bold ${isPoetry ? 'italic font-serif pl-3 border-l-2 border-ocean-400 bg-ocean-50/40 py-2 rounded-r' : ''} ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};

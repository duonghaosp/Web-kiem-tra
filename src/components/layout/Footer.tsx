import React, { useState, useEffect } from 'react';
import { Globe, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const [schoolName, setSchoolName] = useState(() => {
    let stored = localStorage.getItem('geo_school_name');
    if (stored && stored.includes('Sì Lờ Lầu')) {
      stored = stored.replace(/Sì Lờ Lầu/g, 'Sì Lở Lầu');
      localStorage.setItem('geo_school_name', stored);
    }
    return stored || 'Trường PTDTBT TH&THCS Sì Lở Lầu';
  });
  const [schoolLogo, setSchoolLogo] = useState(
    () => localStorage.getItem('geo_school_logo') || ''
  );

  useEffect(() => {
    const handleUpdate = () => {
      let stored = localStorage.getItem('geo_school_name');
      if (stored && stored.includes('Sì Lờ Lầu')) {
        stored = stored.replace(/Sì Lờ Lầu/g, 'Sì Lở Lầu');
        localStorage.setItem('geo_school_name', stored);
      }
      setSchoolName(stored || 'Trường PTDTBT TH&THCS Sì Lở Lầu');
      const storedLogo = localStorage.getItem('geo_school_logo');
      setSchoolLogo(storedLogo || '');
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('geo_settings_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('geo_settings_updated', handleUpdate);
    };
  }, []);

  return (
    <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-semibold text-slate-700">
          {schoolLogo ? (
            <img
              src={schoolLogo}
              alt="Logo Trường"
              className="w-5 h-5 rounded-md object-contain border border-slate-200 bg-white"
            />
          ) : (
            <Globe className="w-4 h-4 text-ocean-600" />
          )}
          <span>Hệ Thống Kiểm Tra Đánh Giá Môn Địa Lí THCS • {schoolName}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <span>Được thiết kế tận tâm dành cho</span>
          <span className="font-bold text-ocean-700">Cô Dương Thu Hảo & Các Em Học Sinh</span>
          <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 inline ml-0.5" />
        </div>
      </div>
    </footer>
  );
};

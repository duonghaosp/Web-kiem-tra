import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, X, ArrowRight, Award, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { playSubmissionNotificationSound, isSoundEnabled, toggleSoundEnabled } from '../../utils/soundEffects';
import { fetchStudentSubmissionsFromCloud } from '../../lib/assignmentCloudSync';

export const TeacherSubmissionLiveAlert: React.FC = () => {
  const { role } = useAuth();
  const isTeacher = role === 'teacher' || role === 'admin';

  const [currentAlert, setCurrentAlert] = useState<any | null>(null);
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const knownSubmissionsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);

  // Khởi tạo danh sách các bài nộp đã biết để không phát chuông cho các bài cũ
  useEffect(() => {
    if (!isTeacher) return;

    try {
      const raw = localStorage.getItem('geo_student_submissions');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach((s: any) => {
            const key = `${s.assignment_id}_${s.student_code || s.student_name}_${s.submitted_at || ''}`;
            knownSubmissionsRef.current.add(key);
          });
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc submissions ban đầu:', e);
    }

    // Sau 2 giây đầu nạp dữ liệu xong mới bắt đầu bật cờ đón nhận bài nộp mới
    const timer = setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 2000);

    return () => clearTimeout(timer);
  }, [isTeacher]);

  // Quét thời gian thực kiểm tra bài nộp mới từ Supabase Cloud
  useEffect(() => {
    if (!isTeacher) return;

    let isSubscribed = true;

    const checkNewSubmissions = async () => {
      try {
        const cloudSubs = await fetchStudentSubmissionsFromCloud();
        if (!isSubscribed || !cloudSubs || !Array.isArray(cloudSubs)) return;

        // Tìm các bài nộp mới chưa từng thấy
        const newSubs = cloudSubs.filter((s: any) => {
          const key = `${s.assignment_id}_${s.student_code || s.student_name}_${s.submitted_at || ''}`;
          if (!knownSubmissionsRef.current.has(key)) {
            knownSubmissionsRef.current.add(key);
            return true;
          }
          return false;
        });

        // Nếu có bài nộp mới và không phải lần tải đầu tiên
        if (newSubs.length > 0 && !isInitialLoadRef.current) {
          const latest = newSubs[0];
          setCurrentAlert(latest);

          // Phát âm thanh chuông thông báo êm dịu
          playSubmissionNotificationSound();

          // Kích hoạt sự kiện để các trang tự động cập nhật số lượng nộp bài
          window.dispatchEvent(new Event('geo_student_submissions_updated'));
          window.dispatchEvent(new Event('geo_assignments_updated'));
        }
      } catch (err) {
        console.debug('Lỗi kiểm tra bài nộp realtime:', err);
      }
    };

    // Kiểm tra định kỳ mỗi 4 giây
    const interval = setInterval(checkNewSubmissions, 4000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [isTeacher]);

  // Tự động tắt popup thông báo sau 8 giây
  useEffect(() => {
    if (!currentAlert) return;
    const dismissTimer = setTimeout(() => {
      setCurrentAlert(null);
    }, 8000);
    return () => clearTimeout(dismissTimer);
  }, [currentAlert]);

  const handleToggleSound = () => {
    const next = toggleSoundEnabled();
    setSoundOn(next);
    if (next) {
      playSubmissionNotificationSound();
    }
  };

  if (!isTeacher || !currentAlert) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm sm:max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 sm:p-5 shadow-2xl border-2 border-emerald-400/80 shadow-emerald-500/20 text-slate-800 space-y-3">
        {/* Header thông báo */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-emerald-100">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              🔔 Học sinh vừa nộp bài
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleToggleSound}
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                soundOn
                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                  : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
              }`}
              title={soundOn ? 'Âm thanh thông báo đang BẬT (Bấm để tắt)' : 'Âm thanh đang TẮT (Bấm để bật)'}
            >
              {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setCurrentAlert(null)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nội dung bài nộp */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30">
            <BellRing className="w-5 h-5 animate-bounce" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-black text-slate-900 truncate">
              {currentAlert.student_name || 'Học sinh'}
              {currentAlert.class_name && (
                <span className="text-xs font-bold text-slate-500 ml-1.5">
                  ({currentAlert.class_name})
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-600 truncate mt-0.5">
              Đề thi: <strong>{currentAlert.assignment_title || 'Bài kiểm tra Địa lí'}</strong>
            </p>
            <div className="flex items-center gap-2 text-xs mt-1 text-slate-500">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>
                Điểm trắc nghiệm:{' '}
                <strong className="text-emerald-700 font-black">
                  {currentAlert.score_tn ?? currentAlert.score ?? 0}
                  {currentAlert.max_score_tn ? `/${currentAlert.max_score_tn}` : '/10'}đ
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Nút xem bài chấm */}
        <div className="pt-1 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => playSubmissionNotificationSound()}
            className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold cursor-pointer underline"
          >
            Phát lại chuông
          </button>

          <Link
            to={`/grading?assignmentId=${currentAlert.assignment_id}`}
            onClick={() => setCurrentAlert(null)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
          >
            <span>Mở Chấm Bài Ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

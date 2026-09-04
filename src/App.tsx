import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { autoSyncStudentsWithCloud } from './lib/studentCloudSync';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { TeacherDashboardPage } from './pages/TeacherDashboardPage';
import { ClassesManagementPage } from './pages/ClassesManagementPage';
import { QuestionBankPage } from './pages/QuestionBankPage';
import { ExamCreateEditPage } from './pages/ExamCreateEditPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { ExamTakingPage } from './pages/ExamTakingPage';
import { ExamGradingPage } from './pages/ExamGradingPage';
import { StudentResultDetailPage } from './pages/StudentResultDetailPage';
import { AnalyticsReportPage } from './pages/AnalyticsReportPage';
import { GeneralSettingsPage } from './pages/GeneralSettingsPage';

// Live Game Pages (Đấu trường trực tiếp Kahoot-style)
import { LiveGameHostPage } from './pages/live/LiveGameHostPage';
import { LiveGameJoinPage } from './pages/live/LiveGameJoinPage';
import { LiveGamePlayerPage } from './pages/live/LiveGamePlayerPage';
import { TeacherSubmissionLiveAlert } from './components/teacher/TeacherSubmissionLiveAlert';

// 1. Bảo vệ trang bắt buộc đăng nhập (cả học sinh và giáo viên)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#DFE7E5]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#C9942C] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-[#2D4441]">Đang tải hệ thống...</p>
        </div>
      </div>
    );
  }

  if (!user && !profile) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// 2. Bảo vệ phân quyền Giáo Viên: Chưa đăng nhập -> về /login, Học sinh -> về /student-dashboard
const TeacherRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#DFE7E5]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#C9942C] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-[#2D4441]">Đang tải hệ thống...</p>
        </div>
      </div>
    );
  }

  if (!user && !profile) {
    return <Navigate to="/login" replace />;
  }

  const isTeacher = role === 'teacher' || role === 'admin';

  if (!isTeacher) {
    // Học sinh cố tình vào trang giáo viên/admin sẽ tự động bị chặn và chuyển về góc học tập
    return <Navigate to="/student-dashboard" replace />;
  }

  return <>{children}</>;
};

// 3. Định tuyến Trang Gốc (/) - Đáp ứng chính xác yêu cầu của Cô Hảo:
// "Tôi muốn khi vào trang web, đầu tiên xuất hiện là phần đăng nhập"
const RootRoute: React.FC = () => {
  const { user, profile, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#DFE7E5]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#C9942C] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-[#2D4441]">Đang tải hệ thống...</p>
        </div>
      </div>
    );
  }

  // 🛑 NẾU CHƯA ĐĂNG NHẬP: LẬP TỨC CHUYỂN VÀO TRANG ĐĂNG NHẬP
  if (!user && !profile) {
    return <Navigate to="/login" replace />;
  }

  // NẾU ĐÃ ĐĂNG NHẬP:
  if (role === 'teacher' || role === 'admin') {
    return (
      <MainLayout>
        <HomePage />
      </MainLayout>
    );
  }

  // Học sinh đã đăng nhập: Chuyển thẳng về Góc học tập học sinh
  return <Navigate to="/student-dashboard" replace />;
};

// Layout bọc chung theo phong cách Scandinavian Forest & Golden Ochre (Ảnh mẫu mới)
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#DFE7E5] p-2 sm:p-4 lg:p-6 transition-colors duration-300">
      {/* Khung thẻ bo góc lớn đặt trên nền sage slate có độ tương phản cao tuyệt đối */}
      <div className="w-full max-w-[1720px] mx-auto flex-1 flex flex-col rounded-[28px] sm:rounded-[36px] bg-white shadow-2xl shadow-[#1E2D2B]/15 border border-[#CFDCD9] overflow-hidden">
        <Navbar />
        <div className="flex-1 flex flex-col md:flex-row min-w-0">
          <Sidebar />
          <main className="flex-1 p-3 sm:p-5 lg:p-7 min-w-0 bg-[#EEF4F2] overflow-y-auto">
            {children}
          </main>
        </div>
        <Footer />
        {/* Chuông & Thông báo nộp bài thời gian thực dành cho bàn làm việc Giáo viên */}
        <TeacherSubmissionLiveAlert />
      </div>
    </div>
  );
};

// Layout riêng cho màn hình làm bài kiểm tra cá nhân
const ExamLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#DFE7E5] p-2 sm:p-4 lg:p-6 transition-colors duration-300">
      <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col rounded-[28px] sm:rounded-[36px] bg-white shadow-2xl shadow-[#1E2D2B]/15 border border-[#CFDCD9] overflow-hidden">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full mx-auto bg-[#EEF4F2] overflow-y-auto">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  useEffect(() => {
    autoSyncStudentsWithCloud();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Trang Đăng Nhập */}
          <Route path="/login" element={<LoginPage />} />

          {/* ĐẤU TRƯỜNG TRỰC TIẾP (LIVE KAHOOT-STYLE GAME) */}
          {/* Máy chủ tạo phòng thi chỉ dành cho Giáo Viên (Cô Hảo) */}
          <Route
            path="/live"
            element={
              <TeacherRoute>
                <LiveGameHostPage />
              </TeacherRoute>
            }
          />
          <Route
            path="/live/host/:roomId"
            element={
              <TeacherRoute>
                <LiveGameHostPage />
              </TeacherRoute>
            }
          />

          {/* Học sinh tham gia phòng thi bằng PIN */}
          <Route path="/live/join" element={<LiveGameJoinPage />} />
          <Route path="/live/play/:roomId" element={<LiveGamePlayerPage />} />

          {/* Màn hình làm bài kiểm tra cá nhân */}
          <Route
            path="/take-exam/:id"
            element={
              <ExamLayout>
                <ExamTakingPage />
              </ExamLayout>
            }
          />

          {/* Trang Gốc (Root): Chưa đăng nhập -> Tự động chuyển vào /login */}
          <Route path="/" element={<RootRoute />} />

          {/* Trang Chủ (khi đã đăng nhập) */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <HomePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* GÓC HỌC TẬP DÀNH CHO HỌC SINH */}
          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <StudentDashboardPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* BÀN LÀM VIỆC & QUẢN TRỊ DÀNH RIÊNG CHO GIÁO VIÊN (ĐÃ BẢO VỆ PHÂN QUYỀN) */}
          <Route
            path="/teacher-dashboard"
            element={
              <TeacherRoute>
                <MainLayout>
                  <TeacherDashboardPage />
                </MainLayout>
              </TeacherRoute>
            }
          />

          <Route
            path="/classes"
            element={
              <TeacherRoute>
                <MainLayout>
                  <ClassesManagementPage />
                </MainLayout>
              </TeacherRoute>
            }
          />

          <Route
            path="/questions"
            element={
              <TeacherRoute>
                <MainLayout>
                  <QuestionBankPage />
                </MainLayout>
              </TeacherRoute>
            }
          />

          <Route
            path="/questions/new"
            element={
              <TeacherRoute>
                <MainLayout>
                  <ExamCreateEditPage />
                </MainLayout>
              </TeacherRoute>
            }
          />

          <Route
            path="/exams/edit/:id"
            element={
              <TeacherRoute>
                <MainLayout>
                  <ExamCreateEditPage />
                </MainLayout>
              </TeacherRoute>
            }
          />

          <Route
            path="/assignments"
            element={
              <TeacherRoute>
                <MainLayout>
                  <AssignmentsPage />
                </MainLayout>
              </TeacherRoute>
            }
          />

          <Route
            path="/assignments/new"
            element={
              <TeacherRoute>
                <MainLayout>
                  <AssignmentsPage />
                </MainLayout>
              </TeacherRoute>
            }
          />

          <Route
            path="/grading"
            element={
              <TeacherRoute>
                <MainLayout>
                  <ExamGradingPage />
                </MainLayout>
              </TeacherRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <TeacherRoute>
                <MainLayout>
                  <GeneralSettingsPage />
                </MainLayout>
              </TeacherRoute>
            }
          />

          {/* Trang kết quả bài thi cá nhân của học sinh */}
          <Route
            path="/results/:id"
            element={
              <MainLayout>
                <StudentResultDetailPage />
              </MainLayout>
            }
          />

          {/* Báo cáo thống kê & Cảnh báo học lực toàn trường - CHỈ DÀNH CHO GIÁO VIÊN */}
          <Route
            path="/reports"
            element={
              <TeacherRoute>
                <MainLayout>
                  <AnalyticsReportPage />
                </MainLayout>
              </TeacherRoute>
            }
          />

          {/* Điều hướng mặc định */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

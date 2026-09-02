# 🌍 HỆ THỐNG WEB APP KIỂM TRA & ĐÁNH GIÁ MÔN ĐỊA LÍ CẤP THCS
> **Dành riêng cho Cô Hảo & Học sinh Khối 6, 7, 8, 9**  
> *Hệ thống Full-stack chạy thực tế (Production-Ready), không dùng dữ liệu giả (No Mock Data), tích hợp Supabase (Auth, DB, RLS, Storage Voice Note), Đấu Trường Live Game Kahoot-style và triển khai trên Vercel.*

---

## 📑 MỤC LỤC HƯỚNG DẪN TỪNG BƯỚC

1. [Tổng quan Các Tính Năng Nổi Bật](#1-tổng-quan-các-tính-năng-nổi-bật)
2. [Hướng Dẫn Chơi Đấu Trường Địa Lí Trực Tiếp Trên Lớp (Live Game)](#2-hướng-dẫn-chơi-đấu-trường-địa-lí-trực-tiếp-trên-lớp-live-game)
3. [Bước 1: Chạy Thử Ứng Dụng Trên Máy Tính Của Cô](#bước-1-chạy-thử-ứng-dụng-trên-máy-tính-của-cô)
4. [Bước 2: Cài Đặt Cơ Sở Dữ Liệu & Lưu Trữ Supabase (1-Click SQL)](#bước-2-cài-đặt-cơ-sở-dữ-liệu--lưu-trữ-supabase-1-click-sql)
5. [Bước 3: Hướng Dẫn Soạn Đề & Import Từ File Word / Excel Chuẩn](#bước-3-hướng-dẫn-soạn-đề--import-từ-file-word--excel-chuẩn)
6. [Bước 4: Hướng Dẫn Đưa Trang Web Lên Mạng (Deploy Vercel Miễn Phí)](#bước-4-hướng-dẫn-đưa-trang-web-lên-mạng-deploy-vercel-miễn-phí)

---

## 1. TỔNG QUAN CÁC TÍNH NĂNG NỔI BẬT

- **🎮 Đấu Trường Địa Lí Trực Tiếp (Live Kahoot-style Game):** 
  - Máy chiếu hiện mã PIN và câu hỏi kèm đồng hồ đếm ngược 20 giây.
  - Cả lớp dùng điện thoại chọn 4 nút màu (Đỏ ▲, Xanh lam ◆, Vàng ●, Xanh lục ■).
  - Tính điểm tốc độ: bấm càng nhanh điểm càng cao (tối đa 1000đ/câu) + thưởng chuỗi trả lời đúng liên tiếp (Streak bonus).
  - Bục vinh quang Top 1, Top 2, Top 3 bùng nổ pháo hoa và cộng điểm thưởng XP trực tiếp.
- **Hệ thống 6 dạng câu hỏi Địa lí chuyên sâu:**
  1. *Trắc nghiệm 1 đáp án (Single Choice):* Hỗ trợ công thức và tọa độ KaTeX ($21^\circ 01' \text{ B}$).
  2. *Trắc nghiệm nhiều đáp án (Multiple Choice):* Cơ chế tính điểm phần trăm (%) theo ý đúng.
  3. *Đúng / Sai theo từng mệnh đề (True/False).*
  4. *Điền từ / số còn thiếu vào chỗ trống (Fill in Blanks).*
  5. *Kéo thả ghép nối Cột A - Cột B (Drag & Drop).*
  6. *Tự luận (Essay):* Khung gõ bài làm dài kèm bộ đếm số từ.
- **Khung câu đố thơ lục bát Địa lí:** Bảo tồn nguyên vẹn ngắt dòng và nhịp điệu ca dao tục ngữ.
- **Chấm điểm & Ghi âm nhận xét bằng Giọng nói (Voice Note):** Giáo viên thu âm trực tiếp lời dặn dò lưu lên Supabase Storage.
- **Hệ thống Cảnh báo Học sinh Yếu:** Đánh nhãn đỏ nổi bật học sinh điểm $< 5.0$ hoặc chưa làm bài.
- **Gamification Level 1-100:** Bảng xếp hạng và nút tặng thưởng XP trực tiếp kèm lời khen.

---

## 2. HƯỚNG DẪN CHƠI ĐẤU TRƯỜNG ĐỊA LÍ TRỰC TIẾP TRÊN LỚP (LIVE GAME)

### Dành cho Cô Hảo (Trên Máy Chiếu):
1. Cô vào mục **"Đấu Trường Trực Tiếp"** trên thanh menu (hoặc mở đường link `/live`).
2. Màn hình sẽ hiện **MÃ PIN 6 SỐ** to rõ (ví dụ: `PIN: 849 203`).
3. Khi học sinh nhập mã PIN vào phòng, tên của các em sẽ tự động xuất hiện trên màn hình máy chiếu.
4. Khi cả lớp đã vào đông đủ, cô bấm nút **"Bắt Đầu Cuộc Thi Ngay!"**.
5. Màn hình máy chiếu sẽ lần lượt hiện từng câu hỏi, đồng hồ đếm ngược 20 giây và 4 ô màu đáp án.
6. Hết giờ, hệ thống hiện ngay biểu đồ cột tỷ lệ chọn của cả lớp và Bảng xếp hạng Top 5 học sinh dẫn đầu.
7. Kết thúc cuộc thi, Bục Vinh Quang Top 1, Top 2, Top 3 sẽ hiện ra cùng hiệu ứng pháo hoa rực rỡ và nút tặng thưởng XP cho các em thắng giải!

### Dành cho Học sinh (Trên Điện Thoại):
1. Học sinh truy cập vào đường link: `/live/join`.
2. Nhập mã PIN 6 số hiển thị trên máy chiếu của cô và Tên của em -> Bấm **"Vào Phòng Thi Ngay"**.
3. Khi câu hỏi bắt đầu, điện thoại của học sinh sẽ hiện 4 nút màu lớn (Đỏ ▲, Xanh lam ◆, Vàng ●, Xanh lục ■). Học sinh đọc câu hỏi trên máy chiếu và bấm nút màu tương ứng thật nhanh để nhận điểm tối đa!

---

## BƯỚC 1: CHẠY THỬ ỨNG DỤNG TRÊN MÁY TÍNH CỦA CÔ

```bash
npm install
npm run dev
```
Mở trình duyệt truy cập: `http://localhost:5173`.

---

## BƯỚC 2: CÀI ĐẶT CƠ SỞ DỮ LIỆU & LƯU TRỮ SUPABASE (1-CLICK SQL)

1. Đăng ký tài khoản miễn phí tại: [https://supabase.com](https://supabase.com).
2. Tạo dự án mới: `Web-Kiem-Tra-Dia-Li-THCS`.
3. Vào mục **SQL Editor** -> Dán toàn bộ nội dung file `supabase/schema.sql` (và `supabase/schema_live_game.sql`) -> Bấm **"Run"**.
4. Vào mục **Project Settings** -> **API** -> Sao chép **Project URL** và **Anon Key** dán vào file `.env`:
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## BƯỚC 3: HƯỚNG DẪN SOẠN ĐỀ & IMPORT TỪ FILE WORD / EXCEL CHUẨN

Cô có thể bấm vào nút **"Mẫu Excel Đề Thi"** trên trang web để tải về file Excel mẫu đã định dạng sẵn cho 6 dạng câu hỏi.

---

## BƯỚC 4: HƯỚNG DẪN ĐƯA TRANG WEB LÊN MẠNG (DEPLOY VERCEL MIỄN PHÍ)

1. Đăng ký tài khoản miễn phí tại: [https://vercel.com](https://vercel.com).
2. Kết nối với kho mã nguồn trên GitHub.
3. Thêm 2 biến môi trường `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` trong mục Environment Variables trên Vercel.
4. Bấm **"Deploy"** và nhận đường link công khai để chia sẻ cho cả trường!

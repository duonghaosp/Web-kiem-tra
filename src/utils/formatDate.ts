/**
 * Hàm định dạng thời gian nộp bài của học sinh
 * Tự động chuyển đổi chuỗi ISO, timestamp từ sub.id (đối với các bài cũ bị lưu 'Vừa xong')
 * thành định dạng thân thiện chuẩn Tiếng Việt: HH:mm DD/MM/YYYY
 */
export function formatSubmissionDisplayTime(sub: any): string {
  if (!sub) return 'Vừa xong';
  const rawTime = sub.submitted_at;

  // 1. Nếu đã là định dạng chuẩn ngày giờ (ví dụ "11:19 17/09/2026")
  if (
    typeof rawTime === 'string' &&
    rawTime !== 'Vừa xong' &&
    rawTime.includes('/') &&
    rawTime.includes(':')
  ) {
    return rawTime;
  }

  // 2. Nếu là chuỗi ISO datetime (ví dụ "2026-09-17T04:19:00.000Z")
  if (typeof rawTime === 'string' && rawTime.includes('T') && !isNaN(Date.parse(rawTime))) {
    const d = new Date(rawTime);
    return formatToVietnameseDate(d);
  }

  // 3. Khôi phục từ Timestamp trong sub.id (ví dụ: sub_1789568340000 hoặc sub_1726546740000)
  // Giúp các bài nộp cũ trước đây từng bị lưu là "Vừa xong" hiển thị lại chính xác ngày giờ làm bài
  if (typeof sub.id === 'string' && sub.id.startsWith('sub_')) {
    const numPart = sub.id.replace('sub_', '').split('_')[0];
    const ts = parseInt(numPart, 10);
    if (!isNaN(ts) && ts > 1000000000000) {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        return formatToVietnameseDate(d);
      }
    }
  }

  // 4. Nếu có trường created_at
  if (sub.created_at && !isNaN(Date.parse(sub.created_at))) {
    const d = new Date(sub.created_at);
    return formatToVietnameseDate(d);
  }

  return rawTime || 'Vừa xong';
}

function formatToVietnameseDate(d: Date): string {
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  const MM = (d.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${hh}:${mm} ${dd}/${MM}/${yyyy}`;
}




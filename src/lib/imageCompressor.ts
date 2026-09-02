/**
 * Tự động nén và tối ưu hóa dung lượng hình ảnh tư liệu (bản đồ, biểu đồ, hình ảnh trắc nghiệm)
 * Giúp hình ảnh tải siêu nhanh, hiển thị sắc nét nhưng dung lượng giảm 80-95%, chống tràn hạn mức LocalStorage.
 */
export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8
): Promise<string> {
  // Đối với file SVG hoặc ảnh rất nhẹ (< 50KB), giữ nguyên
  if (file.type === 'image/svg+xml' || file.size < 50 * 1024) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Giữ tỷ lệ khung hình
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Đổ nền trắng cho ảnh transparent để tránh bị đen nền khi nén sang JPEG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Thử nén sang WebP trước (định dạng hiện đại siêu nhẹ), nếu không hỗ trợ thì sang JPEG
        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData && webpData.startsWith('data:image/webp')) {
            resolve(webpData);
            return;
          }
        } catch {
          // Bỏ qua nếu trình duyệt không hỗ trợ WebP
        }

        const jpegData = canvas.toDataURL('image/jpeg', quality);
        resolve(jpegData);
      };
      img.onerror = () => reject(new Error('Không thể đọc dữ liệu ảnh để nén'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Lỗi đọc file ảnh'));
    reader.readAsDataURL(file);
  });
}

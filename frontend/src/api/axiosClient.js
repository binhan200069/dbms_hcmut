/**
 * axiosClient.js
 * ─────────────────────────────────────────────────────────────────────
 * Axios instance dùng chung cho toàn bộ ứng dụng.
 *
 * Cơ chế Mock Auth:
 *   Backend middleware `requireRole` đọc header `x-user-role`.
 *   Request interceptor tự động đính kèm role hiện tại từ localStorage.
 *
 * Xử lý lỗi:
 *   Response interceptor bắt lỗi nghiệp vụ từ DB (HTTP 400/403/500)
 *   và ném lại để component tự xử lý bằng react-hot-toast.
 */

import axios from 'axios';

// ── Tạo Axios instance với base URL trỏ vào Backend ──────────────────
const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 giây timeout
});

// ── REQUEST INTERCEPTOR ───────────────────────────────────────────────
// Backend middleware đọc: x-mock-role và x-mock-user-id
// Map role → userId mặc định (khớp với ROLE_DEFAULTS trong mockAuth.middleware.js)
const ROLE_USER_ID = { STAFF: 1, CUSTOMER: 6, DRIVER: 11 };

axiosClient.interceptors.request.use(
  (config) => {
    const role   = localStorage.getItem('userRole') || 'STAFF';
    const userId = ROLE_USER_ID[role] ?? 1;
    // Đúng tên header mà backend đọc
    config.headers['x-mock-role']    = role;
    config.headers['x-mock-user-id'] = String(userId);
    return config;
  },
  (error) => Promise.reject(error)
);

// ── RESPONSE INTERCEPTOR ──────────────────────────────────────────────
// Bắt lỗi từ server và chuẩn hóa thành một object lỗi nhất quán.
// Component sử dụng: try { ... } catch(err) { toast.error(err.message) }
axiosClient.interceptors.response.use(
  // Thành công: trả thẳng data (bỏ qua lớp bọc axios)
  (response) => response.data,

  // Thất bại: chuẩn hóa lỗi
  (error) => {
    // Lỗi nghiệp vụ từ DB — Backend trả về { error: "Câu báo lỗi tiếng Việt" }
    const serverMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      null;

    // Lỗi kết nối / timeout
    if (!error.response) {
      const networkErr = new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend.');
      networkErr.isNetworkError = true;
      return Promise.reject(networkErr);
    }

    // Tạo Error object với message từ server (tiếng Việt từ DB Trigger)
    const customError = new Error(serverMessage || `Lỗi máy chủ (${error.response.status})`);
    customError.statusCode = error.response.status;
    customError.serverData = error.response.data;
    customError.isServerError = true;

    return Promise.reject(customError);
  }
);

export default axiosClient;

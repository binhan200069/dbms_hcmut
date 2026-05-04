/**
 * vehicleApi.js
 * ─────────────────────────────────────────────────────────────────────
 * Tất cả API call liên quan đến Phương tiện (Vehicle).
 * Mỗi hàm throw lỗi để component bắt bằng try...catch + toast.
 */

import axiosClient from './axiosClient';

const vehicleApi = {
  // Lấy toàn bộ danh sách xe
  getAll: () => axiosClient.get('/vehicles'),

  // Tìm kiếm xe theo biển số hoặc loại xe
  search: (query) => axiosClient.get('/vehicles/search', { params: { q: query } }),

  // Lấy thông tin 1 xe theo ID
  getById: (id) => axiosClient.get(`/vehicles/${id}`),

  // Thêm xe mới — Trigger DB có thể từ chối nếu biển số trùng
  create: (data) => axiosClient.post('/vehicles', data),

  // Cập nhật thông tin xe — Trigger có thể từ chối nếu xe đang chạy
  update: (id, data) => axiosClient.put(`/vehicles/${id}`, data),

  /**
   * Xóa xe — ĐÂY LÀ NƠI TRIGGER DB HOẠT ĐỘNG
   * Nếu xe đã có chuyến vận chuyển, DB sẽ ném lỗi và
   * Backend trả về HTTP 400: { error: "Xe đã có chuyến..." }
   * Component phải bắt lỗi này và hiển thị toast.error(err.message)
   */
  delete: (id) => axiosClient.delete(`/vehicles/${id}`),
};

export default vehicleApi;

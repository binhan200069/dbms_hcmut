/**
 * staffManagementApi.js
 * ─────────────────────────────────────────────────────────────────────
 * API calls cho quản lý nhân viên (Staff).
 * Sử dụng staff API backend.
 */

import axiosClient from './axiosClient';

const staffManagementApi = {
  // Lấy tất cả staff
  getAll: () => axiosClient.get('/staff'),

  // Lấy thông tin 1 staff theo ID
  getById: (id) => axiosClient.get(`/staff/${id}`),

  // Tạo staff mới
  create: (data) => axiosClient.post('/staff', data),

  // Cập nhật thông tin staff
  update: (id, data) => axiosClient.put(`/staff/${id}`, data),

  // Xóa staff
  delete: (id) => axiosClient.delete(`/staff/${id}`),
};

export default staffManagementApi;
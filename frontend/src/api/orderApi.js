/**
 * orderApi.js
 * ─────────────────────────────────────────────────────────────────────
 * API call cho Đơn hàng (Order).
 */

import axiosClient from './axiosClient';

const orderApi = {
  getAll: (params) => axiosClient.get('/orders', { params }),

  search: (query) => axiosClient.get('/orders/search', { params: { q: query } }),

  getById: (id) => axiosClient.get(`/orders/${id}`),

  // Tạo đơn hàng — CUSTOMER hoặc STAFF đều được
  create: (data) => axiosClient.post('/orders', data),

  update: (id, data) => axiosClient.put(`/orders/${id}`, data),

  delete: (id) => axiosClient.delete(`/orders/${id}`),

  // Hủy đơn — Trigger DB có thể từ chối nếu hàng đã đang giao
  cancel: (id) => axiosClient.patch(`/orders/${id}/cancel`),

  // Thêm mặt hàng (item) vào đơn hàng
  addItem: (orderId, itemData) => axiosClient.post(`/orders/${orderId}/items`, itemData),
};

export default orderApi;

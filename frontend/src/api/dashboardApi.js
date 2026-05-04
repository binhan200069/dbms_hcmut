/**
 * dashboardApi.js
 * ─────────────────────────────────────────────────────────────────────
 * API call cho màn hình Dashboard (chỉ STAFF).
 */

import axiosClient from './axiosClient';

const dashboardApi = {
  // Thống kê tổng quan: số đơn, số xe, doanh thu tháng...
  getStats: () => axiosClient.get('/dashboard/stats'),

  // Biểu đồ doanh thu theo tháng
  getMonthlyRevenue: () => axiosClient.get('/dashboard/revenue'),

  // Thưởng tài xế theo tháng
  getDriverBonus: (driverId) => axiosClient.get(`/dashboard/driver-bonus/${driverId}`),
};

export default dashboardApi;

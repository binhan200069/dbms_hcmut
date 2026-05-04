/**
 * shipmentApi.js
 * ─────────────────────────────────────────────────────────────────────
 * API call cho Chuyến vận chuyển (Shipment) & Phân công (Assignment).
 *
 * Lưu ý quan trọng về Trigger DB:
 *  - createAssignment(): Trigger kiểm tra "Vượt tải trọng" sẽ ném lỗi
 *    nếu tổng khối lượng hàng > tải trọng xe. Backend trả HTTP 400.
 *  - Component phải bắt lỗi và hiển thị toast.error(err.message)
 */

import axiosClient from './axiosClient';

const shipmentApi = {
  // ── Shipments ───────────────────────────────────────────────────────
  getAll: (params) => axiosClient.get('/shipments', { params }),

  create: (data) => axiosClient.post('/shipments', data),

  // Thêm đơn hàng vào chuyến — Trigger kiểm tra tải trọng ngay tại đây
  addOrder: (shipmentId, orderId) =>
    axiosClient.post(`/shipments/${shipmentId}/orders`, { order_id: orderId }),

  removeOrder: (shipmentId, orderId) =>
    axiosClient.delete(`/shipments/${shipmentId}/orders/${orderId}`),

  // ── Assignments ─────────────────────────────────────────────────────
  getAllAssignments: (params) => axiosClient.get('/shipments/assignments', { params }),

  /**
   * Tạo phân công xe & tài xế cho chuyến
   * TRIGGER "Vượt tải trọng" sẽ ném lỗi tại đây.
   * data = { shipment_id, vehicle_id, driver_id }
   */
  /**
   * Tạo phân công — payload phải khớp với backend controller:
   * { shipmentId, vehicleId, driverId, assignDate }
   * TRIGGER trg_before_assignment_insert sẽ kiểm tra tải trọng & GPLX
   */
  createAssignment: ({ shipmentId, vehicleId, driverId, assignDate }) =>
    axiosClient.post('/shipments/assignments', {
      shipmentId,
      vehicleId,
      driverId,
      assignDate: assignDate || null,
    }),

  // Tài xế / Staff cập nhật trạng thái chuyến
  updateAssignmentStatus: (assignmentId, status) =>
    axiosClient.patch(`/shipments/assignments/${assignmentId}/status`, { status }),
};

export default shipmentApi;

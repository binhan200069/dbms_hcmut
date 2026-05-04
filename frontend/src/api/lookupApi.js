/**
 * lookupApi.js
 * ─────────────────────────────────────────────────────────────────────
 * API call cho các endpoint tra cứu (dùng populate dropdown trong form).
 * Tất cả đều public (không cần kiểm tra role).
 */

import axiosClient from './axiosClient';

const lookupApi = {
  getLocations:  () => axiosClient.get('/lookup/locations'),
  getRoutes:     () => axiosClient.get('/lookup/routes'),
  getItems:      () => axiosClient.get('/lookup/items'),
  getDrivers:    () => axiosClient.get('/lookup/drivers'),
  getCustomers:  () => axiosClient.get('/lookup/customers'),
  getStaff:      () => axiosClient.get('/lookup/staff'),
  getWarehouses: () => axiosClient.get('/lookup/warehouses'),
};

export default lookupApi;

/**
 * VehicleManagement.jsx
 * ─────────────────────────────────────────────────────────────────────
 * Trang Quản lý Phương tiện — dành cho STAFF.
 *
 * Tính năng:
 *  ✅ Hiển thị danh sách xe dạng bảng với trạng thái đẹp
 *  ✅ Tìm kiếm real-time theo biển số / loại xe
 *  ✅ Thêm xe mới (Modal form)
 *  ✅ Chỉnh sửa xe (Modal form, data pre-filled)
 *  ✅ Xóa xe với confirm dialog
 *  ✅ BẮT LỖI DB TRIGGER: Nếu DB từ chối xóa (xe đang có chuyến),
 *     hiển thị toast.error() với thông báo tiếng Việt từ DB.
 *
 * Quy tắc xử lý lỗi (QUAN TRỌNG):
 *  try {
 *    await vehicleApi.delete(id)
 *    toast.success(...)
 *  } catch (err) {
 *    toast.error(err.message) // ← Câu lỗi từ DB Trigger
 *  }
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Truck, Plus, Search, Edit2, Trash2, X, RefreshCw,
  AlertTriangle, ChevronDown, Loader2, Package, Gauge,
  CheckCircle, Clock, XCircle, Filter,
} from 'lucide-react';
import vehicleApi from '../../api/vehicleApi';

// ── Cấu hình loại xe (cho dropdown) ──────────────────────────────────
const VEHICLE_TYPES = [
  'Xe tải nhỏ',
  'Xe tải trung',
  'Xe tải lớn',
  'Xe container',
  'Xe đông lạnh',
  'Xe chuyên dụng',
];

// ── Map trạng thái xe → style badge ──────────────────────────────────
const STATUS_MAP = {
  'Sẵn sàng':      { badge: 'badge-success', icon: CheckCircle, label: 'Sẵn sàng' },
  'Đang chạy':     { badge: 'badge-info',    icon: Clock,       label: 'Đang chạy' },
  'Bảo dưỡng':     { badge: 'badge-warning', icon: AlertTriangle, label: 'Bảo dưỡng' },
  'Hỏng':          { badge: 'badge-danger',  icon: XCircle,     label: 'Hỏng' },
};

const ALL_STATUSES = Object.keys(STATUS_MAP);

// ─────────────────────────────────────────────────────────────────────
// VEHICLE FORM MODAL
// ─────────────────────────────────────────────────────────────────────
function VehicleFormModal({ vehicle, onClose, onSuccess }) {
  const isEdit = !!vehicle;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    license_plate: vehicle?.license_plate || '',
    vehicle_type:  vehicle?.vehicle_type  || VEHICLE_TYPES[0],
    capacity_kg:   vehicle?.capacity_kg   || '',
    status:        vehicle?.status        || 'Sẵn sàng',
    notes:         vehicle?.notes         || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    // 🛑 CHỐT CHẶN QUAN TRỌNG NHẤT: Ngăn HTML tự động F5 trang
    e.preventDefault(); 

    // Validation cơ bản phía client
    if (!form.license_plate.trim()) {
      toast.error('Vui lòng nhập biển số xe');
      return;
    }
    if (!form.capacity_kg || Number(form.capacity_kg) <= 0) {
      toast.error('Tải trọng phải lớn hơn 0');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        capacity_kg: Number(form.capacity_kg),
      };

      if (isEdit) {
        await vehicleApi.update(vehicle.vehicle_id, payload);
        toast.success(`✅ Đã cập nhật xe ${form.license_plate}`);
        onSuccess({ ...vehicle, ...payload }); // Update local state
      } else {
        await vehicleApi.create(payload);
        toast.success(`✅ Đã thêm xe ${form.license_plate} vào hệ thống`);
        onSuccess(null); // Báo hiệu thêm mới để fetch lại
      }

      onClose();
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 560 }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Truck size={20} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="modal-title">
                {isEdit ? 'Chỉnh sửa phương tiện' : 'Thêm phương tiện mới'}
              </h2>
              <p className="modal-subtitle" style={{ marginBottom: 0 }}>
                {isEdit
                  ? `Đang sửa: ${vehicle.license_plate}`
                  : 'Điền thông tin xe cần thêm vào hệ thống'}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            {/* Biển số */}
            <div className="form-group col-span-2">
              <label className="form-label">
                Biển số xe <span className="text-red-500">*</span>
              </label>
              <input
                className="form-input"
                name="license_plate"
                value={form.license_plate}
                onChange={handleChange}
                placeholder="VD: 51G-123.45"
                disabled={isEdit} // Không đổi biển số khi edit
              />
              {isEdit && (
                <p className="text-xs text-slate-400 mt-1">
                  Biển số không thể thay đổi sau khi tạo
                </p>
              )}
            </div>

            {/* Loại xe */}
            <div className="form-group">
              <label className="form-label">Loại xe <span className="text-red-500">*</span></label>
              <select
                className="form-select"
                name="vehicle_type"
                value={form.vehicle_type}
                onChange={handleChange}
              >
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Tải trọng */}
            <div className="form-group">
              <label className="form-label">
                Tải trọng (kg) <span className="text-red-500">*</span>
              </label>
              <input
                className="form-input"
                name="capacity_kg"
                type="number"
                min="1"
                value={form.capacity_kg}
                onChange={handleChange}
                placeholder="VD: 5000"
              />
            </div>

            {/* Trạng thái */}
            <div className="form-group col-span-2">
              <label className="form-label">Trạng thái</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ALL_STATUSES.map((s) => {
                  const meta = STATUS_MAP[s];
                  const isSelected = form.status === s;
                  return (
                    <label
                      key={s}
                      className={`
                        flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium
                        ${isSelected
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={s}
                        checked={isSelected}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <meta.icon size={14} />
                      {s}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Ghi chú */}
            <div className="form-group col-span-2" style={{ marginBottom: 0 }}>
              <label className="form-label">Ghi chú</label>
              <textarea
                className="form-textarea"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Ghi chú thêm về phương tiện..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  {isEdit ? <Edit2 size={15} /> : <Plus size={15} />}
                  {isEdit ? 'Lưu thay đổi' : 'Thêm xe'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// DELETE CONFIRM DIALOG
// ─────────────────────────────────────────────────────────────────────
function DeleteConfirmDialog({ vehicle, onClose, onConfirm, loading }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 420 }}>
        {/* Warning icon */}
        <div className="flex flex-col items-center text-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <div>
            <h2 className="modal-title">Xác nhận xóa phương tiện?</h2>
            <p className="modal-subtitle" style={{ marginBottom: 0 }}>
              Xe <span className="font-bold text-slate-800">{vehicle.license_plate}</span> sẽ bị
              xóa khỏi hệ thống.
            </p>
          </div>
        </div>

        {/* Cảnh báo DB Trigger */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 mb-6">
          <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Lưu ý:</strong> Nếu xe này đã có chuyến vận chuyển, hệ thống DB sẽ tự động từ
            chối và hiển thị lý do cụ thể.
          </p>
        </div>

        <div className="modal-footer" style={{ paddingTop: 0, marginTop: 0, border: 'none' }}>
          <button className="btn btn-secondary flex-1" onClick={onClose} disabled={loading}>
            Hủy bỏ
          </button>
          <button className="btn btn-danger flex-1" onClick={onConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 size={15} />
                Xóa phương tiện
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// STATS CARD
// ─────────────────────────────────────────────────────────────────────
function StatsCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: bg }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────
export default function VehicleManagement() {
  const [vehicles, setVehicles]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deletingVehicle, setDeletingVehicle] = useState(null);
  const [deleteLoading, setDeleteLoading]     = useState(false);

  // ── Fetch danh sách xe ──────────────────────────────────────────────
  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await vehicleApi.getAll();
      
      // ĐẶT CONSOLE LOG Ở ĐÂY:
      console.log("1. Dữ liệu thô từ vehicleApi trả về:", response);

      const rawList = Array.isArray(response) ? response : response.data || [];
      console.log("2. Danh sách (rawList) sau khi bóc tách:", rawList);

      const formattedList = rawList.map((v) => ({
        vehicle_id: v.VehicleId || v.vehicleId || v.vehicle_id || v.id, // Bổ sung bắt chữ V viết hoa
        license_plate: v.LicensePlate || v.licensePlate || v.license_plate,
        vehicle_type: v.VehicleType || v.vehicleType || v.vehicle_type,
        capacity_kg: v.MaxWeightCapacity || v.maxWeightCapacity || v.capacity_kg,
        status: v.Status || v.status || 'Sẵn sàng',
        notes: v.Notes || v.notes || ''
      }));

      console.log("3. Dữ liệu sau khi Mapping:", formattedList);
      setVehicles(formattedList);
    } catch (err) {
      toast.error(err.message || 'Không thể tải danh sách phương tiện');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // ── Tìm kiếm & lọc (client-side) ───────────────────────────────────
  const filtered = useMemo(() => {
    let list = vehicles;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (v) =>
          v.license_plate?.toLowerCase().includes(q) ||
          v.vehicle_type?.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'Tất cả') {
      list = list.filter((v) => v.status === filterStatus);
    }
    return list;
  }, [vehicles, searchQuery, filterStatus]);

  // ── Stats tính từ data ──────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:   vehicles.length,
    ready:   vehicles.filter((v) => v.status === 'Sẵn sàng').length,
    running: vehicles.filter((v) => v.status === 'Đang chạy').length,
    broken:  vehicles.filter((v) => ['Bảo dưỡng', 'Hỏng'].includes(v.status)).length,
  }), [vehicles]);

  // ── Xử lý XÓA xe — BẮT LỖI DB TRIGGER ────────────────────────────
  const handleDelete = async () => {
    if (!deletingVehicle) return;
    setDeleteLoading(true);
    try {
      await vehicleApi.delete(deletingVehicle.vehicle_id);
      toast.success(
        `✅ Đã xóa xe ${deletingVehicle.license_plate} khỏi hệ thống`
      );
      setDeletingVehicle(null);
      fetchVehicles(); // Reload danh sách
    } catch (err) {
      /**
       * ⭐ ĐÂY LÀ NƠI XỬ LÝ LỖI TRIGGER DB
       * Khi DB từ chối xóa (vd: "Xe đã có chuyến vận chuyển, không thể xóa"),
       * Backend trả HTTP 400 + { error: "..." }
       * axiosClient.interceptors đã chuẩn hóa thành err.message
       * → Hiển thị toast màu đỏ với đúng câu lỗi từ DB
       */
      toast.error(err.message || 'Không thể xóa phương tiện');
      // Không đóng dialog để user thấy lỗi và hiểu lý do
      setDeletingVehicle(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Truck size={26} className="text-indigo-600" />
            Vehicle Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Quản lý toàn bộ đội xe vận tải trong hệ thống
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={17} />
          Thêm xe mới
        </button>
      </div>

      {/* ── Stats Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Tổng phương tiện"  value={stats.total}   icon={Truck}        color="#6366f1" bg="#e0e7ff" />
        <StatsCard label="Sẵn sàng hoạt động" value={stats.ready}  icon={CheckCircle}  color="#10b981" bg="#d1fae5" />
        <StatsCard label="Đang vận chuyển"    value={stats.running} icon={Package}      color="#3b82f6" bg="#dbeafe" />
        <StatsCard label="Cần chú ý"          value={stats.broken}  icon={AlertTriangle} color="#f59e0b" bg="#fef3c7" />
      </div>

      {/* ── Search & Filter Bar ──────────────────────────────────────── */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            className="form-input pl-10"
            placeholder="Tìm biển số hoặc loại xe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="relative min-w-[160px]">
          <Filter size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            className="form-select pl-9 pr-8 appearance-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="Tất cả">Tất cả trạng thái</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Refresh */}
        <button
          onClick={fetchVehicles}
          className="btn btn-secondary shrink-0"
          disabled={loading}
          title="Tải lại danh sách"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Làm mới</span>
        </button>
      </div>

      {/* ── Data Table ───────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        {/* Table header meta */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">
            Danh sách phương tiện
            {!loading && (
              <span className="ml-2 text-slate-400 font-normal">
                ({filtered.length} / {vehicles.length} xe)
              </span>
            )}
          </p>
          {filtered.length === 0 && !loading && searchQuery && (
            <p className="text-xs text-slate-400">
              Không tìm thấy kết quả cho &ldquo;{searchQuery}&rdquo;
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Biển số xe</th>
                <th>Loại xe</th>
                <th>Tải trọng</th>
                <th>Trạng thái</th>
                <th>Ghi chú</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {/* Loading skeleton */}
              {loading && (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j}>
                        <div
                          className="skeleton h-4"
                          style={{ width: j === 5 ? 80 : `${60 + j * 10}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              )}

              {/* Empty state */}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center py-12 gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <Truck size={26} className="text-slate-400" />
                      </div>
                      <p className="font-semibold text-slate-500">
                        {searchQuery ? 'Không tìm thấy phương tiện' : 'Chưa có phương tiện nào'}
                      </p>
                      <p className="text-sm text-slate-400">
                        {searchQuery
                          ? 'Thử từ khóa khác hoặc xóa bộ lọc'
                          : 'Nhấn "Thêm xe mới" để bắt đầu'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {!loading && filtered.map((v) => {
                const statusMeta = STATUS_MAP[v.status] || STATUS_MAP['Sẵn sàng'];
                const StatusIcon = statusMeta.icon;
                return (
                  <tr key={v.vehicle_id} className="animate-fade-in-up">
                    {/* Biển số */}
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                          <Truck size={14} className="text-indigo-600" />
                        </div>
                        <span className="font-mono font-bold text-slate-800">
                          {v.license_plate}
                        </span>
                      </div>
                    </td>

                    {/* Loại xe */}
                    <td className="text-slate-600">{v.vehicle_type}</td>

                    {/* Tải trọng */}
                    <td>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Gauge size={14} className="text-slate-400" />
                        <span className="font-semibold">{Number(v.capacity_kg).toLocaleString()}</span>
                        <span className="text-slate-400 text-xs">kg</span>
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td>
                      <span className={`badge ${statusMeta.badge}`}>
                        <StatusIcon size={11} />
                        {v.status}
                      </span>
                    </td>

                    {/* Ghi chú */}
                    <td className="text-slate-500 text-sm max-w-xs truncate">
                      {v.notes || <span className="text-slate-300 italic">Không có</span>}
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Edit */}
                        <button
                          className="btn-icon btn-icon-primary"
                          onClick={() => setEditingVehicle(v)}
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={15} />
                        </button>

                        {/* Delete — trigger DB sẽ chặn nếu xe có chuyến */}
                        <button
                          className="btn-icon btn-icon-danger"
                          onClick={() => setDeletingVehicle(v)}
                          title="Xóa xe"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────── */}

      {/* Add modal */}
      {showAddModal && (
        <VehicleFormModal
          vehicle={null}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchVehicles}
        />
      )}

      {/* Edit modal */}
      {editingVehicle && (
        <VehicleFormModal
          vehicle={editingVehicle}
          onClose={() => setEditingVehicle(null)}
          onSuccess={fetchVehicles}
        />
      )}

      {/* Delete confirm */}
      {deletingVehicle && (
        <DeleteConfirmDialog
          vehicle={deletingVehicle}
          onClose={() => setDeletingVehicle(null)}
          onConfirm={handleDelete}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}

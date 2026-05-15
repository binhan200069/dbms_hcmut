/**
 * DispatchPanel.jsx — Phân công chuyến vận chuyển (STAFF only)
 *
 * Layout 2 cột:
 *  - Trái: Danh sách Shipments đang chờ phân công
 *  - Phải: Form chọn Vehicle + Driver → Phân công
 *
 * ⭐ TRIGGER DB "Vượt tải trọng": khi POST /assignments,
 *    nếu tổng KG hàng > capacity xe → DB ném lỗi → toast.error()
 */

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  ClipboardList, Truck, User, Calendar, AlertTriangle,
  CheckCircle, Clock, Package, Loader2, RefreshCw,
  ChevronRight, Gauge, BadgeCheck, XCircle, Plus,
} from 'lucide-react';
import shipmentApi from '../../api/shipmentApi';
import vehicleApi   from '../../api/vehicleApi';
import lookupApi    from '../../api/lookupApi';

// ── helpers ──────────────────────────────────────────────────────────
const normalize = (res) => (Array.isArray(res) ? res : res?.data ?? []);

const SHIPMENT_STATUS_MAP = {
  'Chờ xử lý':   { badge: 'badge-warning', icon: Clock },
  'Đang vận chuyển': { badge: 'badge-info', icon: Truck },
  'Đã giao':     { badge: 'badge-success', icon: CheckCircle },
  'Đã hủy':      { badge: 'badge-danger',  icon: XCircle },
};

const ASSIGN_STATUS = ['Đã lên kế hoạch', 'Đang thực hiện', 'Hoàn thành', 'Hủy'];

// ── Shipment Card ─────────────────────────────────────────────────────
function ShipmentCard({ shipment, selected, onClick }) {
  const meta = SHIPMENT_STATUS_MAP[shipment.Status] ?? SHIPMENT_STATUS_MAP['Chờ xử lý'];
  const Icon = meta.icon;
  const isSelected = selected?.ShipmentId === shipment.ShipmentId;

  return (
    <button
      onClick={() => onClick(shipment)}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 hover:shadow-md ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-indigo-100' : 'bg-slate-100'}`}>
            <Package size={15} className={isSelected ? 'text-indigo-600' : 'text-slate-500'} />
          </div>
          <div>
            <p className="font-bold text-sm text-slate-800">
              #{shipment.ShipmentId}
            </p>
            <p className="text-xs text-slate-400">{shipment.RouteName ?? '—'}</p>
          </div>
        </div>
        <span className={`badge ${meta.badge} shrink-0`}>
          <Icon size={11} />{shipment.Status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Calendar size={11} />
          {shipment.DepartureDate
            ? new Date(shipment.DepartureDate).toLocaleDateString('vi-VN')
            : 'Chưa có'}
        </span>
        <span className="flex items-center gap-1">
          <Gauge size={11} />
          {shipment.TotalWeight ? `${Number(shipment.TotalWeight).toLocaleString()} kg` : '0 kg'}
        </span>
      </div>

      {isSelected && (
        <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-indigo-600">
          <ChevronRight size={13} />
          Đang chọn để phân công
        </div>
      )}
    </button>
  );
}

// ── Assignment History Row ────────────────────────────────────────────
function AssignmentRow({ a }) {
  return (
    <tr>
      <td>
        <span className="font-mono text-xs font-bold text-slate-600">#{a.AssignmentId}</span>
      </td>
      <td className="text-sm text-slate-700">Chuyến #{a.ShipmentId}</td>
      <td>
        <div className="flex items-center gap-1.5 text-sm">
          <Truck size={13} className="text-indigo-400" />
          {a.LicensePlate ?? '—'}
        </div>
      </td>
      <td>
        <div className="flex items-center gap-1.5 text-sm">
          <User size={13} className="text-emerald-500" />
          {a.DriverName ?? '—'}
        </div>
      </td>
      <td>
        <span className={`badge ${
          a.Status === 'Hoàn thành' ? 'badge-success' :
          a.Status === 'Đang thực hiện' ? 'badge-info' :
          a.Status === 'Hủy' ? 'badge-danger' : 'badge-warning'
        }`}>
          {a.Status}
        </span>
      </td>
      <td className="text-xs text-slate-400">
        {a.AssignDate ? new Date(a.AssignDate).toLocaleDateString('vi-VN') : '—'}
      </td>
    </tr>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════
export default function DispatchPanel() {
  // ── Data state ──────────────────────────────────────────────────────
  const [shipments,    setShipments]    = useState([]);
  const [vehicles,     setVehicles]     = useState([]);
  const [drivers,      setDrivers]      = useState([]);
  const [assignments,  setAssignments]  = useState([]);

  // ── UI state ────────────────────────────────────────────────────────
  const [loadingPage,  setLoadingPage]  = useState(true);
  const [submitting,   setSubmitting]   = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);

  // ── Form state ──────────────────────────────────────────────────────
  const [form, setForm] = useState({
    vehicleId:  '',
    driverId:   '',
    assignDate: new Date().toISOString().slice(0, 10),
    status:     'Đã lên kế hoạch',
  });

  // ── Load all data in parallel ───────────────────────────────────────
  // ── Load all data in parallel ───────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoadingPage(true);
    try {
      const [sRes, vRes, dRes, aRes] = await Promise.all([
        shipmentApi.getAll(),
        vehicleApi.getAll(),
        lookupApi.getDrivers(),
        shipmentApi.getAllAssignments(),
      ]);

      const rawShipments = normalize(sRes);
      const rawVehicles = normalize(vRes);
      const rawDrivers = normalize(dRes);
      const rawAssignments = normalize(aRes);

      // 🛠️ MAPPING LẠI CHO CHUẨN VỚI TÊN CỘT DATABASE
      setShipments(rawShipments.map(s => ({
        ...s,
        ShipmentId: s.ShipmentId || s.shipment_id || s.id,
        RouteName: s.RouteName || s.route_name || 'Tuyến chưa đặt tên',
        // Dưới DB không có cột Status cho Shipment, nên đọc từ OrderStatus hoặc Assignment
        Status: s.Status || s.ShipmentStatus || s.OrderStatus || 'Chờ xử lý',
        TotalWeight: s.TotalWeight || s.total_weight || 0,
      })));

      setVehicles(rawVehicles);
      setDrivers(rawDrivers);

      // MAPPING BẢNG LỊCH SỬ PHÂN CÔNG
      setAssignments(rawAssignments.map(a => ({
        ...a,
        AssignmentId: a.AssignmentId || a.assignment_id || a.id,
        ShipmentId: a.ShipmentId || a.shipment_id,
        LicensePlate: a.LicensePlate || a.license_plate,
        // Dưới DB tài xế dùng cột Name, UI lại dùng DriverName
        DriverName: a.DriverName || a.Name || a.driver_name || 'Chưa rõ',
        // DB dùng AssignmentStatus, UI dùng Status
        Status: a.AssignmentStatus || a.Status || a.assignment_status || 'Đã lên kế hoạch',
        AssignDate: a.AssignDate || a.assign_date,
      })));

    } catch (err) {
      toast.error(err.message || 'Không thể tải dữ liệu');
    } finally {
      setLoadingPage(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Xe đang chọn (để hiển thị tải trọng)
  const selectedVehicle = vehicles.find(
    (v) => String(v.VehicleId ?? v.vehicle_id) === String(form.vehicleId)
  );

  // Tính tổng khối lượng của chuyến đang chọn
  const shipmentWeight = selectedShipment
    ? Number(selectedShipment.TotalWeight ?? 0)
    : 0;

  // Cảnh báo vượt tải (phía client — DB sẽ chặn thật sự)
  const vehicleCapacity = Number(
    selectedVehicle?.MaxWeightCapacity ?? selectedVehicle?.capacity_kg ?? 0
  );
  const isOverload = vehicleCapacity > 0 && shipmentWeight > vehicleCapacity;

  // ── Submit phân công ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedShipment) {
      toast.error('Vui lòng chọn một chuyến từ danh sách bên trái');
      return;
    }
    if (!form.vehicleId) {
      toast.error('Vui lòng chọn phương tiện');
      return;
    }
    if (!form.driverId) {
      toast.error('Vui lòng chọn tài xế');
      return;
    }

    setSubmitting(true);
    try {
      /**
       * ⭐ ĐÂY LÀ NƠI TRIGGER DB KIỂM TRA
       * Backend gọi CALL sp_CreateAssignment(...)
       * Trigger trg_before_assignment_insert chạy và có thể ném:
       *   - "Tổng khối lượng hàng vượt quá tải trọng xe..."
       *   - "Xe đã được phân công trong chuyến này..."
       *   - "GPLX tài xế không phù hợp..."
       * Backend bắt lỗi → trả HTTP 400 { error: "..." }
       * axiosClient chuẩn hóa → err.message
       * → toast.error() hiển thị chính xác câu lỗi từ DB
       */
      await shipmentApi.createAssignment({
        shipmentId: selectedShipment.ShipmentId,
        vehicleId:  form.vehicleId,
        driverId:   form.driverId,
        assignDate: form.assignDate || null,
      });

      toast.success(
        `✅ Đã phân công xe & tài xế cho Chuyến #${selectedShipment.ShipmentId}`
      );

      // Reset form và reload
      setSelectedShipment(null);
      setForm({ vehicleId: '', driverId: '', assignDate: new Date().toISOString().slice(0, 10), status: 'Đã lên kế hoạch' });
      await loadAll();
    } catch (err) {
      /**
       * Hiển thị lỗi từ DB Trigger bằng toast màu đỏ.
       * err.message đã được chuẩn hóa bởi axiosClient interceptor.
       */
      toast.error(err.message || 'Phân công thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingShipments = shipments.filter((s) =>
    ['Chờ xử lý', 'Chờ phân công'].includes(s.Status) || !s.Status
  );

  // ── Loading screen ───────────────────────────────────────────────────
  if (loadingPage) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Đang tải dữ liệu phân công...</p>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <ClipboardList size={26} className="text-indigo-600" />
            Phân công Chuyến vận chuyển
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Chọn chuyến → chọn xe & tài xế → bấm Phân công. DB Trigger sẽ kiểm tra tải trọng tự động.
          </p>
        </div>
        <button
          onClick={loadAll}
          className="btn btn-secondary"
          disabled={loadingPage}
        >
          <RefreshCw size={15} className={loadingPage ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {/* ── Trigger Demo Banner ────────────────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-amber-800">🔥 Demo DB Trigger: Kiểm tra tải trọng</p>
          <p className="text-amber-700 mt-0.5">
            Chọn một chuyến có nhiều hàng nặng, sau đó chọn xe nhỏ (tải trọng thấp) rồi bấm Phân công.
            Trigger <code className="bg-amber-100 px-1 rounded text-xs">trg_before_assignment_insert</code> sẽ
            từ chối và toast đỏ sẽ hiện câu lỗi tiếng Việt từ DB.
          </p>
        </div>
      </div>

      {/* ── Main 2-column layout ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ══ CỘT TRÁI: Danh sách chuyến đang chờ ══ */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Package size={17} className="text-indigo-500" />
                Chuyến đang chờ phân công
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {pendingShipments.length} chuyến • Bấm để chọn
              </p>
            </div>
            {selectedShipment && (
              <button
                onClick={() => setSelectedShipment(null)}
                className="text-xs text-slate-400 hover:text-slate-600 underline"
              >
                Bỏ chọn
              </button>
            )}
          </div>

          <div className="p-4 space-y-3 max-h-[520px] overflow-y-auto">
            {pendingShipments.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                  <CheckCircle size={24} className="text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-slate-500">Không có chuyến nào đang chờ</p>
                <p className="text-xs text-slate-400">Tất cả chuyến đã được phân công hoặc chưa tạo</p>
              </div>
            ) : (
              /* Hiển thị tất cả shipments nếu không có pending */
              (pendingShipments.length > 0 ? pendingShipments : shipments.slice(0, 10)).map((s) => (
                <ShipmentCard
                  key={s.ShipmentId}
                  shipment={s}
                  selected={selectedShipment}
                  onClick={setSelectedShipment}
                />
              ))
            )}

            {/* Nếu không có pending, hiển thị tất cả để demo */}
            {pendingShipments.length === 0 && shipments.length > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-400 text-center mb-3">
                  Hiển thị tất cả chuyến để demo
                </p>
                {shipments.slice(0, 8).map((s) => (
                  <ShipmentCard
                    key={s.ShipmentId}
                    shipment={s}
                    selected={selectedShipment}
                    onClick={setSelectedShipment}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ══ CỘT PHẢI: Form phân công ══ */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList size={17} className="text-indigo-500" />
              Tạo phân công
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedShipment
                ? `Đang phân công cho Chuyến #${selectedShipment.ShipmentId}`
                : 'Chọn một chuyến từ cột bên trái trước'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-5">

            {/* Selected shipment preview */}
            {selectedShipment ? (
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
                <div className="flex items-center gap-2 mb-3">
                  <BadgeCheck size={16} className="text-indigo-600" />
                  <span className="text-sm font-bold text-indigo-800">
                    Chuyến #{selectedShipment.ShipmentId} đã chọn
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-indigo-700">
                  <span>🗺️ Tuyến: {selectedShipment.RouteName ?? 'N/A'}</span>
                  <span>📦 Tổng khối lượng: <strong>{shipmentWeight.toLocaleString()} kg</strong></span>
                  <span>📅 Khởi hành: {selectedShipment.DepartureDate
                    ? new Date(selectedShipment.DepartureDate).toLocaleDateString('vi-VN')
                    : 'Chưa có'}</span>
                  <span>🔖 Trạng thái: {selectedShipment.Status ?? 'N/A'}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center min-h-[80px]">
                <p className="text-sm text-slate-400 text-center">
                  ← Bấm vào một chuyến ở cột trái để bắt đầu
                </p>
              </div>
            )}

            {/* Chọn phương tiện */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <Truck size={14} className="inline mr-1.5 text-indigo-500" />
                Phương tiện <span className="text-red-500">*</span>
              </label>
              <select
                className="form-select"
                value={form.vehicleId}
                onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
              >
                <option value="">-- Chọn phương tiện --</option>
                {vehicles.map((v) => {
                  const cap = Number(v.MaxWeightCapacity ?? v.capacity_kg ?? 0);
                  return (
                    <option key={v.VehicleId ?? v.vehicle_id} value={v.VehicleId ?? v.vehicle_id}>
                      {v.LicensePlate ?? v.license_plate} — {v.VehicleType ?? v.vehicle_type}
                      {cap > 0 ? ` (${cap.toLocaleString()} kg)` : ''}
                    </option>
                  );
                })}
              </select>

              {/* Cảnh báo vượt tải (client-side preview — DB sẽ chặn thật) */}
              {selectedVehicle && vehicleCapacity > 0 && (
                <div className={`mt-2 flex items-center gap-2 p-2.5 rounded-lg text-xs ${
                  isOverload
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                }`}>
                  {isOverload ? (
                    <>
                      <AlertTriangle size={13} />
                      <span>
                        <strong>Cảnh báo vượt tải!</strong> Hàng {shipmentWeight.toLocaleString()} kg &gt; Tải trọng {vehicleCapacity.toLocaleString()} kg.
                        DB Trigger sẽ từ chối phân công này!
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={13} />
                      <span>
                        Tải trọng phù hợp ({shipmentWeight.toLocaleString()}/{vehicleCapacity.toLocaleString()} kg)
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Chọn tài xế */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <User size={14} className="inline mr-1.5 text-emerald-500" />
                Tài xế <span className="text-red-500">*</span>
              </label>
              <select
                className="form-select"
                value={form.driverId}
                onChange={(e) => setForm((f) => ({ ...f, driverId: e.target.value }))}
              >
                <option value="">-- Chọn tài xế --</option>
                {drivers.map((d) => (
                  <option key={d.UserId} value={d.UserId}>
                    {d.Name} — GPLX: {d.LicenseClass ?? 'N/A'}
                    {d.LicenseStatus === 'Hết hạn' ? ' ⚠️ Hết hạn' : ''}
                  </option>
                ))}
              </select>
              {form.driverId && (() => {
                const drv = drivers.find((d) => String(d.UserId) === String(form.driverId));
                if (!drv) return null;
                const expired = drv.LicenseStatus === 'Hết hạn';
                return (
                  <div className={`mt-2 flex items-center gap-2 p-2.5 rounded-lg text-xs ${
                    expired
                      ? 'bg-red-50 border border-red-200 text-red-700'
                      : 'bg-slate-50 border border-slate-200 text-slate-600'
                  }`}>
                    {expired
                      ? <><AlertTriangle size={13} /><span><strong>GPLX hết hạn</strong> — DB Trigger sẽ từ chối!</span></>
                      : <><BadgeCheck size={13} /><span>GPLX hạng {drv.LicenseClass} • {drv.LicenseStatus}</span></>
                    }
                  </div>
                );
              })()}
            </div>

            {/* Ngày phân công */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <Calendar size={14} className="inline mr-1.5 text-slate-500" />
                Ngày phân công
              </label>
              <input
                type="date"
                className="form-input"
                value={form.assignDate}
                onChange={(e) => setForm((f) => ({ ...f, assignDate: e.target.value }))}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !selectedShipment}
              className={`btn w-full justify-center text-base py-3 ${
                isOverload ? 'btn-danger' : 'btn-primary'
              }`}
            >
              {submitting ? (
                <><Loader2 size={17} className="animate-spin" />Đang phân công...</>
              ) : (
                <><Plus size={17} />{isOverload ? '⚠️ Phân công (sẽ bị DB từ chối)' : 'Xác nhận Phân công'}</>
              )}
            </button>

            {isOverload && (
              <p className="text-xs text-center text-red-500">
                Nhấn để xem DB Trigger hoạt động — toast đỏ sẽ xuất hiện với lý do từ DB
              </p>
            )}
          </form>
        </div>
      </div>

      {/* ── Bảng lịch sử phân công ──────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList size={17} className="text-slate-500" />
              Lịch sử phân công
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {assignments.length} bản ghi
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã PC</th>
                <th>Chuyến</th>
                <th>Phương tiện</th>
                <th>Tài xế</th>
                <th>Trạng thái</th>
                <th>Ngày PC</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center py-10 gap-2">
                      <ClipboardList size={28} className="text-slate-300" />
                      <p className="text-sm text-slate-400">Chưa có phân công nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                assignments.map((a) => (
                  <AssignmentRow key={a.AssignmentId} a={a} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

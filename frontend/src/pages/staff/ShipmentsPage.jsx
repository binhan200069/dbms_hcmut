/**
 * ShipmentsPage.jsx — Quản lý Chuyến hàng (STAFF only)
 * Route: /admin/shipments
 *
 * Trang này hiển thị toàn bộ danh sách chuyến hàng (SHIPMENT) với thông tin
 * chi tiết về tuyến đường, khối lượng, ngày giờ xuất phát và phân công.
 * Khác với DispatchPanel (/admin/dispatch) — nơi THỰC HIỆN phân công,
 * trang này tập trung vào XEM & THEO DÕI trạng thái chuyến hàng.
 */
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Package, Truck, Calendar, RefreshCw, Search,
  Gauge, MapPin, Clock, CheckCircle, XCircle, Loader2,
  Plus, ChevronDown, ChevronUp,
} from 'lucide-react';
import shipmentApi from '../../api/shipmentApi';

const normalize = (res) => (Array.isArray(res) ? res : res?.data ?? []);

const STATUS_CFG = {
  'Chờ xử lý':       { badge: 'badge-warning', icon: Clock },
  'Đang vận chuyển': { badge: 'badge-info',    icon: Truck },
  'Đã giao':         { badge: 'badge-success', icon: CheckCircle },
  'Đã hủy':          { badge: 'badge-danger',  icon: XCircle },
};

function ShipmentRow({ s, expanded, onToggle }) {
  const statusKey = s.Status ?? s.ShipmentStatus ?? 'Chờ xử lý';
  const cfg  = STATUS_CFG[statusKey] ?? STATUS_CFG['Chờ xử lý'];
  const Icon = cfg.icon;

  return (
    <>
      <tr
        className="cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={onToggle}
      >
        <td>
          <span className="font-mono text-xs font-bold text-slate-600">
            #{s.ShipmentId}
          </span>
        </td>
        <td>
          <div className="flex items-center gap-1.5 text-sm text-slate-700">
            <MapPin size={13} className="text-indigo-400 shrink-0" />
            {s.RouteName ?? '—'}
          </div>
        </td>
        <td>
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <Gauge size={13} className="text-slate-400 shrink-0" />
            {s.TotalWeight ? `${Number(s.TotalWeight).toLocaleString()} kg` : '0 kg'}
          </div>
        </td>
        <td className="text-sm text-slate-600">
          {s.DepartureDate
            ? new Date(s.DepartureDate).toLocaleDateString('vi-VN')
            : <span className="text-slate-400 italic">Chưa có</span>}
        </td>
        <td className="text-sm text-slate-600">
          {s.ActualArrivalTime
            ? new Date(s.ActualArrivalTime).toLocaleDateString('vi-VN')
            : <span className="text-slate-400 italic">—</span>}
        </td>
        <td>
          <span className={`badge ${cfg.badge}`}>
            <Icon size={11} />{statusKey}
          </span>
        </td>
        <td>
          {expanded
            ? <ChevronUp size={15} className="text-slate-400" />
            : <ChevronDown size={15} className="text-slate-400" />}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-indigo-50/60">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Mã chuyến</p>
                <p className="font-bold text-slate-700">#{s.ShipmentId}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Tuyến đường</p>
                <p className="text-slate-700">{s.RouteName ?? 'Chưa có'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Tổng khối lượng</p>
                <p className="text-slate-700">
                  {s.TotalWeight ? `${Number(s.TotalWeight).toLocaleString()} kg` : '0 kg'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Trạng thái</p>
                <span className={`badge ${cfg.badge}`}>
                  <Icon size={11} />{statusKey}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Ngày xuất phát</p>
                <p className="text-slate-700">
                  {s.DepartureDate
                    ? new Date(s.DepartureDate).toLocaleString('vi-VN')
                    : 'Chưa xác định'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Đến nơi thực tế</p>
                <p className="text-slate-700">
                  {s.ActualArrivalTime
                    ? new Date(s.ActualArrivalTime).toLocaleString('vi-VN')
                    : 'Chưa ghi nhận'}
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [expanded,  setExpanded]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await shipmentApi.getAll();
      const raw = normalize(res);
      setShipments(raw.map(s => ({
        ...s,
        ShipmentId: s.ShipmentId ?? s.shipment_id ?? s.id,
        RouteName:  s.RouteName  ?? s.route_name  ?? 'Chưa có tuyến',
        Status:     s.Status     ?? s.ShipmentStatus ?? 'Chờ xử lý',
        TotalWeight: s.TotalWeight ?? s.total_weight ?? 0,
      })));
    } catch (err) {
      toast.error(err.message || 'Không thể tải danh sách chuyến hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = shipments.filter(s => {
    const q = search.toLowerCase();
    return (
      String(s.ShipmentId).includes(q) ||
      (s.RouteName ?? '').toLowerCase().includes(q) ||
      (s.Status    ?? '').toLowerCase().includes(q)
    );
  });

  const stats = {
    total:      shipments.length,
    pending:    shipments.filter(s => s.Status === 'Chờ xử lý').length,
    inTransit:  shipments.filter(s => s.Status === 'Đang vận chuyển').length,
    delivered:  shipments.filter(s => s.Status === 'Đã giao').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Package size={26} className="text-violet-600" />
            Quản lý Chuyến hàng
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Theo dõi toàn bộ chuyến hàng trong hệ thống. Để phân công xe & tài xế, vào{' '}
            <a href="/admin/dispatch" className="text-indigo-600 underline hover:no-underline">
              Điều phối
            </a>.
          </p>
        </div>
        <button onClick={load} className="btn btn-secondary">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng chuyến', value: stats.total,     color: 'bg-violet-50 text-violet-700 border-violet-200' },
          { label: 'Chờ xử lý',   value: stats.pending,   color: 'bg-amber-50 text-amber-700 border-amber-200' },
          { label: 'Đang vận chuyển', value: stats.inTransit, color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: 'Đã giao',     value: stats.delivered, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`card p-4 border ${color}`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
            <p className="text-3xl font-bold mt-1">{loading ? '—' : value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã, tuyến, trạng thái..."
            className="form-input pl-9 py-2 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Truck size={17} className="text-violet-500" />
            Danh sách chuyến hàng
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {loading ? 'Đang tải...' : `${filtered.length} chuyến`}
            {search && ` (lọc từ ${shipments.length})`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã chuyến</th>
                <th>Tuyến đường</th>
                <th>Khối lượng</th>
                <th>Ngày xuất phát</th>
                <th>Đến nơi</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j}><div className="skeleton h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center py-12 gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <Package size={28} className="text-slate-400" />
                      </div>
                      <p className="font-semibold text-slate-500">
                        {search ? 'Không tìm thấy chuyến hàng nào' : 'Chưa có chuyến hàng nào'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(s => (
                  <ShipmentRow
                    key={s.ShipmentId}
                    s={s}
                    expanded={expanded === s.ShipmentId}
                    onToggle={() => setExpanded(prev =>
                      prev === s.ShipmentId ? null : s.ShipmentId
                    )}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

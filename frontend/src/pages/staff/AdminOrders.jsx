/**
 * AdminOrders.jsx — Quản lý toàn bộ đơn hàng (STAFF only)
 * Route: /admin/orders
 *
 * Hiển thị TẤT CẢ đơn hàng trong hệ thống (không lọc theo customer).
 * Tính năng: Xem chi tiết, Hủy đơn, Tìm kiếm, Lọc trạng thái.
 */
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  ShoppingCart, Package, Search, X, RefreshCw,
  Clock, CheckCircle, XCircle, Truck, Filter,
  ChevronDown, Loader2, Eye, Ban, User, MapPin,
} from 'lucide-react';
import orderApi from '../../api/orderApi';

const normalize = (r) => {
  if (Array.isArray(r)) return r;
  const data = r?.data?.data || r?.data || r;
  return Array.isArray(data) ? data : [];
};

const STATUS_MAP = {
  'Chờ xử lý':       { badge: 'badge-warning', icon: Clock },
  'Đang xử lý':      { badge: 'badge-info',    icon: Package },
  'Đang vận chuyển': { badge: 'badge-info',    icon: Truck },
  'Đã giao':         { badge: 'badge-success', icon: CheckCircle },
  'Đã hủy':          { badge: 'badge-danger',  icon: XCircle },
};
const ALL_STATUSES = Object.keys(STATUS_MAP);

// ── Order Detail Modal ─────────────────────────────────────────────────────
function OrderDetailModal({ orderId, onClose }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi.getById(orderId)
      .then((r) => setData(r?.data ?? r))
      .catch((e) => toast.error(e.message || 'Không thể tải chi tiết đơn hàng'))
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 620 }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="modal-title flex items-center gap-2">
            <Package size={18} className="text-indigo-500" />
            Chi tiết đơn hàng #{orderId}
          </h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={30} className="animate-spin text-indigo-500" />
          </div>
        ) : !data ? (
          <p className="text-center text-slate-400 py-8">Không tìm thấy đơn hàng</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Khách hàng',  data.order?.CustomerName        ?? '—'],
                ['Nhân viên',   data.order?.StaffName           ?? 'Chưa phân công'],
                ['Trạng thái',  data.order?.OrderStatus         ?? '—'],
                ['Chi phí',     data.order?.FreightCost != null ? `${Number(data.order.FreightCost).toLocaleString()}₫` : '—'],
                ['Lấy hàng tại',data.order?.PickupLocationName  ?? '—'],
                ['Giao đến',    data.order?.DeliveryLocationName ?? '—'],
                ['Ngày tạo',    data.order?.OrderDate ? new Date(data.order.OrderDate).toLocaleDateString('vi-VN') : '—'],
                ['Ngày giao',   data.order?.DeliveredDate ? new Date(data.order.DeliveredDate).toLocaleDateString('vi-VN') : 'Chưa giao'],
              ].map(([k, v]) => (
                <div key={k} className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-400 mb-0.5">{k}</p>
                  <p className="font-semibold text-slate-800 text-sm truncate">{v}</p>
                </div>
              ))}
            </div>

            {data.items?.length > 0 && (
              <div>
                <p className="font-semibold text-slate-700 mb-2 text-sm flex items-center gap-1.5">
                  <Package size={14} className="text-indigo-400" />
                  Danh sách hàng hóa ({data.items.length} mặt hàng)
                </p>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Mặt hàng</th>
                      <th>Số lượng</th>
                      <th>Khối lượng/đv</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((it, i) => (
                      <tr key={i}>
                        <td>{it.Description ?? it.ItemName ?? '—'}</td>
                        <td className="font-bold">{it.OrderQuantity ?? it.Quantity ?? '—'}</td>
                        <td className="text-slate-500">{it.Weight ? `${it.Weight} kg` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AdminOrders() {
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [filterSt,   setFilterSt]   = useState('Tất cả');
  const [viewId,     setViewId]     = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderApi.getAll();
      setOrders(normalize(res));
    } catch (err) {
      toast.error(err.message || 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async (id) => {
    setCancelling(id);
    try {
      await orderApi.cancel(id);
      toast.success('✅ Đã hủy đơn hàng');
      await load();
    } catch (err) {
      toast.error(err.message || 'Không thể hủy đơn hàng');
    } finally {
      setCancelling(null);
    }
  };

  const filtered = orders.filter((o) => {
    const matchSt = filterSt === 'Tất cả' || o.OrderStatus === filterSt;
    const q = search.toLowerCase();
    const matchSr = !search ||
      String(o.OrderId).includes(q) ||
      (o.CustomerName   ?? '').toLowerCase().includes(q) ||
      (o.StaffName      ?? '').toLowerCase().includes(q) ||
      (o.OrderStatus    ?? '').toLowerCase().includes(q);
    return matchSt && matchSr;
  });

  // Summary stats
  const stats = {
    total:      orders.length,
    pending:    orders.filter(o => o.OrderStatus === 'Chờ xử lý').length,
    inTransit:  orders.filter(o => o.OrderStatus === 'Đang vận chuyển').length,
    delivered:  orders.filter(o => o.OrderStatus === 'Đã giao').length,
    cancelled:  orders.filter(o => o.OrderStatus === 'Đã hủy').length,
  };

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <ShoppingCart size={26} className="text-emerald-600" />
            Quản lý Đơn hàng
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Toàn bộ đơn hàng trong hệ thống — Staff có thể xem chi tiết và hủy đơn hàng.
          </p>
        </div>
        <button onClick={load} className="btn btn-secondary" disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Tổng đơn',      value: stats.total,     color: 'bg-slate-50   text-slate-700  border-slate-200'  },
          { label: 'Chờ xử lý',     value: stats.pending,   color: 'bg-amber-50   text-amber-700  border-amber-200'  },
          { label: 'Đang vận chuyển',value: stats.inTransit, color: 'bg-blue-50    text-blue-700   border-blue-200'   },
          { label: 'Đã giao',        value: stats.delivered, color: 'bg-emerald-50 text-emerald-700 border-emerald-200'},
          { label: 'Đã hủy',         value: stats.cancelled, color: 'bg-red-50     text-red-700    border-red-200'    },
        ].map(({ label, value, color }) => (
          <div key={label} className={`card p-4 border ${color}`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
            <p className="text-3xl font-bold mt-1">{loading ? '—' : value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="form-input pl-9 py-2 text-sm"
            placeholder="Tìm mã đơn, tên KH, nhân viên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="relative min-w-[180px]">
          <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            className="form-select pl-8 appearance-none pr-8"
            value={filterSt}
            onChange={(e) => setFilterSt(e.target.value)}
          >
            <option value="Tất cả">Tất cả trạng thái</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Package size={16} className="text-emerald-500" />
            Danh sách đơn hàng
          </h2>
          <p className="text-xs text-slate-400">
            {loading ? 'Đang tải...' : `${filtered.length} đơn hàng`}
            {search && ` (lọc từ ${orders.length})`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Lấy hàng</th>
                <th>Giao đến</th>
                <th>Chi phí</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j}><div className="skeleton h-4 w-3/4" /></td>
                  ))}
                </tr>
              ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center py-14 gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <ShoppingCart size={26} className="text-slate-400" />
                      </div>
                      <p className="font-semibold text-slate-500">
                        {search || filterSt !== 'Tất cả' ? 'Không tìm thấy đơn hàng nào' : 'Chưa có đơn hàng nào'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filtered.map((o) => {
                const meta = STATUS_MAP[o.OrderStatus] ?? { badge: 'badge-default', icon: Package };
                const StatusIcon = meta.icon;
                return (
                  <tr key={o.OrderId}>
                    <td>
                      <span className="font-bold font-mono text-indigo-600">#{o.OrderId}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-sm text-slate-700">
                        <User size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate max-w-[120px]">{o.CustomerName ?? '—'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-sm text-slate-600 max-w-[140px]">
                        <MapPin size={12} className="text-indigo-400 shrink-0" />
                        <span className="truncate">{o.PickupLocationName ?? '—'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-sm text-slate-600 max-w-[140px]">
                        <MapPin size={12} className="text-emerald-400 shrink-0" />
                        <span className="truncate">{o.DeliveryLocationName ?? '—'}</span>
                      </div>
                    </td>
                    <td className="font-semibold text-slate-800">
                      {o.FreightCost != null
                        ? `${Number(o.FreightCost).toLocaleString()}₫`
                        : o.TotalFreightCost != null
                          ? `${Number(o.TotalFreightCost).toLocaleString()}₫`
                          : '—'}
                    </td>
                    <td>
                      <span className={`badge ${meta.badge}`}>
                        <StatusIcon size={11} />{o.OrderStatus}
                      </span>
                    </td>
                    <td className="text-xs text-slate-400">
                      {o.OrderDate ? new Date(o.OrderDate).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          className="btn-icon btn-icon-primary"
                          onClick={() => setViewId(o.OrderId)}
                          title="Xem chi tiết"
                        >
                          <Eye size={14} />
                        </button>
                        {o.OrderStatus === 'Chờ xử lý' && (
                          <button
                            className="btn-icon btn-icon-danger"
                            title="Hủy đơn hàng"
                            disabled={cancelling === o.OrderId}
                            onClick={() => handleCancel(o.OrderId)}
                          >
                            {cancelling === o.OrderId
                              ? <Loader2 size={14} className="animate-spin" />
                              : <Ban size={14} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {viewId && <OrderDetailModal orderId={viewId} onClose={() => setViewId(null)} />}
    </div>
  );
}

/**
 * OrderHistory.jsx — Lịch sử đơn hàng (CUSTOMER)
 */
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  History, Package, Search, X, RefreshCw,
  Clock, CheckCircle, XCircle, Truck, AlertTriangle,
  ChevronDown, Loader2, Eye, Ban,
} from 'lucide-react';
import orderApi from '../../api/orderApi';

const normalize = (r) => (Array.isArray(r) ? r : r?.data ?? []);

const STATUS_MAP = {
  'Chờ xử lý':       { badge: 'badge-warning', icon: Clock },
  'Đang vận chuyển': { badge: 'badge-info',    icon: Truck },
  'Đã giao':         { badge: 'badge-success',  icon: CheckCircle },
  'Đã hủy':          { badge: 'badge-danger',   icon: XCircle },
};
const ALL_STATUSES = Object.keys(STATUS_MAP);

// ── Order Detail Modal ────────────────────────────────────────────────
function OrderDetailModal({ orderId, onClose }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi.getById(orderId)
      .then((r) => setData(r?.data ?? r))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 580 }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="modal-title">Chi tiết đơn hàng #{orderId}</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>
        ) : !data ? (
          <p className="text-center text-slate-400 py-6">Không tìm thấy đơn hàng</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Khách hàng', data.order?.CustomerName ?? '—'],
                ['Trạng thái', data.order?.Status ?? '—'],
                ['Lấy hàng tại', data.order?.PickupLocation ?? '—'],
                ['Giao đến', data.order?.DeliveryLocation ?? '—'],
                ['Chi phí', data.order?.FreightCost != null ? `${Number(data.order.FreightCost).toLocaleString()}₫` : '—'],
                ['Ngày tạo', data.order?.CreatedAt ? new Date(data.order.CreatedAt).toLocaleDateString('vi-VN') : '—'],
              ].map(([k, v]) => (
                <div key={k} className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-400 mb-0.5">{k}</p>
                  <p className="font-semibold text-slate-800 text-sm">{v}</p>
                </div>
              ))}
            </div>
            {data.items?.length > 0 && (
              <div>
                <p className="font-semibold text-slate-700 mb-2 text-sm">Danh sách hàng hóa</p>
                <table className="data-table">
                  <thead><tr><th>Mặt hàng</th><th>SL</th><th>Khối lượng</th></tr></thead>
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
        <div className="modal-footer"><button className="btn btn-secondary" onClick={onClose}>Đóng</button></div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────
export default function OrderHistory() {
  const [orders,    setOrders]   = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [search,    setSearch]   = useState('');
  const [filterSt,  setFilterSt] = useState('Tất cả');
  const [viewId,    setViewId]   = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderApi.getAll();
      setOrders(normalize(res));
    } catch (err) {
      toast.error(err.message || 'Không thể tải đơn hàng');
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
      load();
    } catch (err) {
      // Lỗi từ DB Trigger (đơn đang giao không thể hủy)
      toast.error(err.message || 'Không thể hủy đơn hàng');
    } finally {
      setCancelling(null);
    }
  };

  const filtered = orders.filter((o) => {
    const matchSt = filterSt === 'Tất cả' || o.Status === filterSt;
    const matchSr = !search || String(o.OrderId).includes(search) ||
      (o.CustomerName ?? '').toLowerCase().includes(search.toLowerCase());
    return matchSt && matchSr;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <History size={24} className="text-emerald-600" />Lịch sử đơn hàng
          </h1>
          <p className="text-slate-500 text-sm mt-1">Tất cả đơn hàng của bạn</p>
        </div>
        <button onClick={load} className="btn btn-secondary">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="form-input pl-10" placeholder="Tìm mã đơn hoặc tên KH..." value={search}
            onChange={(e) => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={14} /></button>}
        </div>
        <div className="relative min-w-[160px]">
          <select className="form-select appearance-none pr-8" value={filterSt} onChange={(e) => setFilterSt(e.target.value)}>
            <option value="Tất cả">Tất cả trạng thái</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-700">
            {filtered.length} đơn hàng
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>Mã đơn</th><th>Lấy hàng</th><th>Giao đến</th><th>Chi phí</th><th>Trạng thái</th><th>Ngày tạo</th><th style={{ textAlign: 'center' }}>Thao tác</th></tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                  <td key={j}><div className="skeleton h-4 w-3/4" /></td>
                ))}</tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7}>
                  <div className="flex flex-col items-center py-10 gap-2">
                    <Package size={28} className="text-slate-300" />
                    <p className="text-slate-400 text-sm">Không có đơn hàng nào</p>
                  </div>
                </td></tr>
              )}
              {!loading && filtered.map((o) => {
                const meta = STATUS_MAP[o.Status] ?? { badge: 'badge-default', icon: Package };
                return (
                  <tr key={o.OrderId}>
                    <td><span className="font-bold font-mono text-indigo-600">#{o.OrderId}</span></td>
                    <td className="text-sm text-slate-600 max-w-[150px] truncate">{o.PickupLocation ?? '—'}</td>
                    <td className="text-sm text-slate-600 max-w-[150px] truncate">{o.DeliveryLocation ?? '—'}</td>
                    <td className="font-semibold">{o.FreightCost != null ? `${Number(o.FreightCost).toLocaleString()}₫` : '—'}</td>
                    <td>
                      <span className={`badge ${meta.badge}`}>
                        <meta.icon size={11} />{o.Status}
                      </span>
                    </td>
                    <td className="text-xs text-slate-400">{o.CreatedAt ? new Date(o.CreatedAt).toLocaleDateString('vi-VN') : '—'}</td>
                    <td>
                      <div className="flex items-center justify-center gap-1.5">
                        <button className="btn-icon btn-icon-primary" onClick={() => setViewId(o.OrderId)} title="Xem chi tiết"><Eye size={14} /></button>
                        {o.Status === 'Chờ xử lý' && (
                          <button
                            className="btn-icon btn-icon-danger"
                            title="Hủy đơn"
                            disabled={cancelling === o.OrderId}
                            onClick={() => handleCancel(o.OrderId)}
                          >
                            {cancelling === o.OrderId ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
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

      {viewId && <OrderDetailModal orderId={viewId} onClose={() => setViewId(null)} />}
    </div>
  );
}

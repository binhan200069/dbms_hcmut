/**
 * CustomerTracking.jsx — Theo dõi hành trình đơn hàng (CUSTOMER)
 * Route: /customer/tracking
 *
 * Hiển thị lịch sử tracking log của đơn hàng khách hàng.
 * Khác với OrderHistory (/customer/history) — nơi xem danh sách đơn hàng.
 */
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Navigation, MapPin, Clock, RefreshCw, Package,
  CheckCircle, Truck, Search, X, AlertCircle,
  ChevronDown, History,
} from 'lucide-react';
import orderApi from '../../api/orderApi';
import axiosClient from '../../api/axiosClient';

const normalize = (r) => {
  if (Array.isArray(r)) return r;
  const data = r?.data?.data || r?.data || r;
  return Array.isArray(data) ? data : [];
};

const STATUS_MAP = {
  'Chờ xử lý':       { color: 'bg-amber-500',   icon: Clock,        label: 'Chờ xử lý'       },
  'Đang xử lý':      { color: 'bg-blue-500',     icon: Package,      label: 'Đang xử lý'      },
  'Đang vận chuyển': { color: 'bg-indigo-500',   icon: Truck,        label: 'Đang vận chuyển' },
  'Đã giao':         { color: 'bg-emerald-500',  icon: CheckCircle,  label: 'Đã giao'          },
  'Đã hủy đơn hàng': { color: 'bg-red-500',      icon: X,            label: 'Đã hủy'           },
};

// ── Timeline step component ────────────────────────────────────────────────
function TimelineStep({ log, isLast }) {
  const cfg = STATUS_MAP[log.CurrentStatus] ?? { color: 'bg-slate-400', icon: Clock };
  const Icon = cfg.icon;

  return (
    <div className="flex gap-4">
      {/* Line + dot */}
      <div className="flex flex-col items-center">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${cfg.color} shadow-sm`}>
          <Icon size={16} className="text-white" />
        </div>
        {!isLast && <div className="w-0.5 bg-slate-200 flex-1 mt-1" />}
      </div>

      {/* Content */}
      <div className={`pb-6 flex-1 ${isLast ? '' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-slate-800 text-sm">{log.CurrentStatus}</p>
            {(log.LocationName || log.LogLocation) && (
              <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500">
                <MapPin size={11} className="text-indigo-400 shrink-0" />
                <span>{log.LocationName || log.LogLocation}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 whitespace-nowrap shrink-0">
            {log.Timestamp ? new Date(log.Timestamp).toLocaleString('vi-VN') : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function CustomerTracking() {
  const [orders,   setOrders]   = useState([]);
  const [logs,     setLogs]     = useState([]);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [loading,  setLoading]  = useState(true);
  const [logLoading, setLogLoading] = useState(false);
  const [search,   setSearch]   = useState('');

  // Load all orders for the dropdown
  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderApi.getAll();
      const data = normalize(res);
      setOrders(data);
      // Auto-select the first order
      if (data.length > 0 && !selectedOrder) {
        setSelectedOrder(String(data[0].OrderId));
      }
    } catch (err) {
      toast.error(err.message || 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load tracking logs for selected order
  const loadLogs = useCallback(async (orderId) => {
    if (!orderId) return;
    setLogLoading(true);
    try {
      const res = await axiosClient.get(`/tracking?orderId=${orderId}&limit=50`);
      const data = normalize(res?.data);
      setLogs(data);
    } catch (err) {
      toast.error(err.message || 'Không thể tải lịch sử theo dõi');
      setLogs([]);
    } finally {
      setLogLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  useEffect(() => {
    if (selectedOrder) loadLogs(selectedOrder);
  }, [selectedOrder, loadLogs]);

  // Selected order info
  const currentOrder = orders.find(o => String(o.OrderId) === String(selectedOrder));

  const filteredOrders = orders.filter(o => {
    const q = search.toLowerCase();
    return !search ||
      String(o.OrderId).includes(q) ||
      (o.OrderStatus ?? '').toLowerCase().includes(q);
  });

  const statusCfg = currentOrder ? (STATUS_MAP[currentOrder.OrderStatus] ?? STATUS_MAP['Chờ xử lý']) : null;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Navigation size={26} className="text-teal-500" />
            Theo dõi đơn hàng
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Xem hành trình và trạng thái vận chuyển của đơn hàng của bạn.
          </p>
        </div>
        <button
          onClick={() => { loadOrders(); if (selectedOrder) loadLogs(selectedOrder); }}
          className="btn btn-secondary"
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-teal-50 border border-teal-200">
        <AlertCircle size={18} className="text-teal-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-teal-800">Cập nhật theo thời gian thực</p>
          <p className="text-teal-700 mt-0.5">
            Nhật ký hành trình được ghi lại khi tài xế cập nhật trạng thái chuyến hàng.
            Chọn đơn hàng bên dưới để xem lịch sử vận chuyển chi tiết.
          </p>
        </div>
      </div>

      {/* Order selector */}
      <div className="card p-4 space-y-3">
        <label className="form-label flex items-center gap-1.5">
          <Package size={14} className="text-indigo-500" />
          Chọn đơn hàng để theo dõi
        </label>
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="form-input pl-9 py-2 text-sm"
              placeholder="Tìm theo mã đơn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="relative min-w-[220px]">
            <select
              className="form-select appearance-none pr-8"
              value={selectedOrder}
              onChange={(e) => setSelectedOrder(e.target.value)}
              disabled={loading}
            >
              <option value="">-- Chọn đơn hàng --</option>
              {filteredOrders.map((o) => (
                <option key={o.OrderId} value={o.OrderId}>
                  #{o.OrderId} — {o.OrderStatus} — {o.DeliveryLocationName ?? 'Chưa có điểm giao'}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Current order status card */}
      {currentOrder && statusCfg && (
        <div className={`card p-5 border-l-4 ${statusCfg.color.replace('bg-', 'border-')}`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Đơn hàng #{currentOrder.OrderId}</p>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full ${statusCfg.color} flex items-center justify-center`}>
                  <statusCfg.icon size={16} className="text-white" />
                </div>
                <p className="text-lg font-bold text-slate-800">{currentOrder.OrderStatus}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-400">Điểm giao hàng</p>
                <p className="font-semibold text-slate-700 mt-0.5">
                  {currentOrder.DeliveryLocationName ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Chi phí vận chuyển</p>
                <p className="font-semibold text-slate-700 mt-0.5">
                  {currentOrder.FreightCost != null
                    ? `${Number(currentOrder.FreightCost).toLocaleString()}₫`
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tracking timeline */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <History size={17} className="text-teal-500" />
            Nhật ký hành trình
          </h2>
          <p className="text-xs text-slate-400">
            {logLoading ? 'Đang tải...' : `${logs.length} sự kiện`}
          </p>
        </div>

        <div className="p-5">
          {!selectedOrder ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Navigation size={30} className="text-slate-400" />
              </div>
              <p className="font-semibold text-slate-500">Chọn đơn hàng để xem hành trình</p>
              <p className="text-sm text-slate-400 text-center max-w-xs">
                Chọn một đơn hàng từ danh sách bên trên để xem toàn bộ lịch sử vận chuyển.
              </p>
            </div>
          ) : logLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="skeleton w-9 h-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="skeleton h-4 w-1/3" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Clock size={26} className="text-slate-400" />
              </div>
              <p className="font-semibold text-slate-500">Chưa có nhật ký hành trình</p>
              <p className="text-sm text-slate-400 text-center max-w-xs">
                Đơn hàng này chưa có bản ghi vận chuyển nào.
                Nhật ký sẽ được cập nhật khi đơn bắt đầu được vận chuyển.
              </p>
            </div>
          ) : (
            <div>
              {logs.map((log, idx) => (
                <TimelineStep
                  key={log.TrackingId ?? idx}
                  log={log}
                  isLast={idx === logs.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

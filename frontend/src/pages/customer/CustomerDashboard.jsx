/**
 * CustomerDashboard.jsx — Tổng quan cho Khách hàng
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Package, Plus, History, MapPin, Clock, CheckCircle, Truck, XCircle, ArrowRight } from 'lucide-react';
import orderApi from '../../api/orderApi';

const normalize = (r) => (Array.isArray(r) ? r : r?.data ?? []);

const STATUS_MAP = {
  'Chờ xử lý':       { badge: 'badge-warning', icon: Clock },
  'Đang vận chuyển': { badge: 'badge-info',    icon: Truck },
  'Đã giao':         { badge: 'badge-success',  icon: CheckCircle },
  'Đã hủy':          { badge: 'badge-danger',   icon: XCircle },
};

export default function CustomerDashboard() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi.getAll()
      .then((r) => setOrders(normalize(r).slice(0, 5)))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total:   orders.length,
    pending: orders.filter((o) => o.Status === 'Chờ xử lý').length,
    transit: orders.filter((o) => o.Status === 'Đang vận chuyển').length,
    done:    orders.filter((o) => o.Status === 'Đã giao').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">👋 Xin chào, Khách hàng!</h1>
        <p className="text-slate-500 text-sm mt-1">Quản lý đơn hàng và theo dõi hàng hóa của bạn</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/customer/create" className="card p-5 flex items-center gap-4 hover:shadow-md hover:border-emerald-300 transition-all group border-2 border-transparent">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
            <Plus size={22} className="text-emerald-600 group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="font-bold text-slate-800">Tạo đơn hàng mới</p>
            <p className="text-sm text-slate-500">Đặt vận chuyển hàng hóa</p>
          </div>
          <ArrowRight size={18} className="ml-auto text-slate-300 group-hover:text-emerald-500 transition-colors" />
        </Link>
        <Link to="/customer/history" className="card p-5 flex items-center gap-4 hover:shadow-md hover:border-indigo-300 transition-all group border-2 border-transparent">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
            <History size={22} className="text-indigo-600 group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="font-bold text-slate-800">Lịch sử đơn hàng</p>
            <p className="text-sm text-slate-500">Xem tất cả đơn đã đặt</p>
          </div>
          <ArrowRight size={18} className="ml-auto text-slate-300 group-hover:text-indigo-500 transition-colors" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tổng đơn', value: stats.total, color: '#6366f1', bg: '#e0e7ff', icon: Package },
          { label: 'Chờ xử lý', value: stats.pending, color: '#f59e0b', bg: '#fef3c7', icon: Clock },
          { label: 'Đang giao', value: stats.transit, color: '#3b82f6', bg: '#dbeafe', icon: Truck },
          { label: 'Đã giao', value: stats.done, color: '#10b981', bg: '#d1fae5', icon: CheckCircle },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{loading ? '—' : value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Đơn hàng gần đây</h2>
          <Link to="/customer/history" className="text-sm text-indigo-600 hover:underline font-medium">Xem tất cả</Link>
        </div>
        <table className="data-table">
          <thead><tr><th>Mã đơn</th><th>Giao đến</th><th>Chi phí</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {loading && Array.from({ length: 3 }).map((_, i) => (
              <tr key={i}>{[1,2,3,4].map((j) => <td key={j}><div className="skeleton h-4 w-3/4" /></td>)}</tr>
            ))}
            {!loading && orders.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-slate-400">Chưa có đơn hàng</td></tr>
            )}
            {!loading && orders.map((o) => {
              const meta = STATUS_MAP[o.Status] ?? { badge: 'badge-default', icon: Package };
              return (
                <tr key={o.OrderId}>
                  <td><span className="font-bold font-mono text-indigo-600">#{o.OrderId}</span></td>
                  <td className="text-sm text-slate-600 max-w-[180px] truncate">{o.DeliveryLocation ?? '—'}</td>
                  <td className="font-semibold">{o.FreightCost != null ? `${Number(o.FreightCost).toLocaleString()}₫` : '—'}</td>
                  <td><span className={`badge ${meta.badge}`}><meta.icon size={11} />{o.Status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

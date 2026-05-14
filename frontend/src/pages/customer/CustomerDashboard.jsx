/**
 * CustomerDashboard.jsx — Tổng quan cho Khách hàng
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Package, Plus, History, Clock, 
  CheckCircle, Truck, XCircle, ArrowRight 
} from 'lucide-react';
import orderApi from '../../api/orderApi';

const normalize = (r) => (Array.isArray(r) ? r : r?.data ?? []);

// Cấu hình hiển thị trạng thái
const STATUS_MAP = {
  'Chờ xử lý':       { badge: 'badge-warning', icon: Clock },
  'Đang vận chuyển': { badge: 'badge-info',    icon: Truck },
  'Đã giao':         { badge: 'badge-success', icon: CheckCircle },
  'Đã hủy':          { badge: 'badge-danger',  icon: XCircle },
};

export default function CustomerDashboard() {
  const [allOrders, setAllOrders] = useState([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi.getAll()
      .then((r) => {
        setAllOrders(normalize(r));
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  // ĐÃ SỬA: Dùng o.OrderStatus thay vì o.Status
  const stats = {
    total:   allOrders.length,
    pending: allOrders.filter((o) => o.OrderStatus === 'Chờ xử lý').length,
    transit: allOrders.filter((o) => o.OrderStatus === 'Đang vận chuyển').length,
    done:    allOrders.filter((o) => o.OrderStatus === 'Đã giao').length,
  };

  // ĐÃ SỬA: Dùng o.OrderStatus thay vì o.Status
  const recentActiveOrders = allOrders
    .filter((o) => o.OrderStatus !== 'Đã hủy')
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">👋 Xin chào, Khách hàng!</h1>
        <p className="text-slate-500 text-sm mt-1">Theo dõi trạng thái vận chuyển các đơn hàng đang hoạt động</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/customer/create" className="card p-5 flex items-center gap-4 hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
            <Plus size={22} className="text-emerald-600 group-hover:text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-800">Tạo đơn hàng mới</p>
            <p className="text-sm text-slate-500">Đặt vận chuyển ngay</p>
          </div>
          <ArrowRight size={18} className="ml-auto text-slate-300" />
        </Link>
        <Link to="/customer/history" className="card p-5 flex items-center gap-4 hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
            <History size={22} className="text-indigo-600 group-hover:text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-800">Lịch sử đơn hàng</p>
            <p className="text-sm text-slate-500">Xem lại tất cả đơn (bao gồm đơn đã hủy)</p>
          </div>
          <ArrowRight size={18} className="ml-auto text-slate-300" />
        </Link>
      </div>

      {/* Stats Cards */}
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

      {/* Recent Orders Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Đơn hàng đang xử lý & vận chuyển</h2>
          <Link to="/customer/history" className="text-sm text-indigo-600 hover:underline">Tất cả đơn hàng</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Điểm giao</th>
                <th>Tổng chi phí</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {[1, 2, 3, 4].map((j) => <td key={j}><div className="skeleton h-4 w-3/4" /></td>)}
                  </tr>
                ))
              ) : recentActiveOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">Không có đơn hàng nào đang hoạt động</td>
                </tr>
              ) : (
                recentActiveOrders.map((o) => {
                  // ĐÃ SỬA: Đọc o.OrderStatus để map màu/icon
                  const currentStatus = o.OrderStatus;
                  const meta = STATUS_MAP[currentStatus] ?? { badge: 'badge-default', icon: Package };
                  
                  return (
                    <tr key={o.OrderId}>
                      <td><span className="font-bold font-mono text-indigo-600">#{o.OrderId}</span></td>
                      <td className="text-sm text-slate-600 truncate max-w-[200px]">
                        {o.DeliveryLocationName || o.DeliveryLocation || '—'}
                      </td>
                      <td className="font-semibold text-slate-900">
                        {Number(o.TotalFreightCost || o.totalfreightcost || 0).toLocaleString('vi-VN')}₫
                      </td>
                      <td>
                        <span className={`badge ${meta.badge} flex items-center gap-1 w-fit`}>
                          <meta.icon size={11} />
                          {currentStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
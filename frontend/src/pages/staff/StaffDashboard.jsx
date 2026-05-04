/**
 * StaffDashboard.jsx — Tổng quan cho Nhân viên điều phối
 * Hiển thị KPI cards, biểu đồ doanh thu, top khách hàng, đơn gần đây
 */
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Package, Truck, Users, TrendingUp, RefreshCw,
  ArrowUpRight, Clock, CheckCircle, XCircle, BarChart3,
  AlertTriangle, Star,
} from 'lucide-react';
import dashboardApi from '../../api/dashboardApi';

const normalize = (v) => (Array.isArray(v) ? v : v?.data ?? []);

// ── Mini Bar Chart (pure CSS/SVG) ─────────────────────────────────────
function RevenueChart({ data }) {
  if (!data || data.length === 0) return (
    <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Không có dữ liệu</div>
  );
  const max = Math.max(...data.map((d) => Number(d.Revenue ?? d.revenue ?? 0)), 1);
  return (
    <div className="flex items-end justify-between gap-2 h-48 pt-4">
      {data.map((d, i) => {
        const val = Number(d.Revenue ?? d.revenue ?? 0);
        const pct = (val / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="relative w-full flex items-end justify-center" style={{ height: '150px' }}>
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all duration-500 group-hover:from-indigo-500 group-hover:to-indigo-300 cursor-pointer"
                style={{ height: `${Math.max(pct, 3)}%` }}
                title={`${(val / 1e6).toFixed(1)}M₫`}
              />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap transition-opacity pointer-events-none">
                {(val / 1e6).toFixed(1)}M₫
              </div>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              T{d.Month ?? d.month ?? (i + 1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color, bg, suffix = '', trend }) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: bg }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend != null && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            <ArrowUpRight size={13} className={trend < 0 ? 'rotate-90' : ''} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">
          {typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}{suffix}
        </p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────
function OrderStatusBadge({ status }) {
  const map = {
    'Chờ xử lý':        { cls: 'badge-warning', icon: Clock },
    'Đang vận chuyển':  { cls: 'badge-info',    icon: Truck },
    'Đã giao':          { cls: 'badge-success',  icon: CheckCircle },
    'Đã hủy':           { cls: 'badge-danger',   icon: XCircle },
  };
  const m = map[status] ?? { cls: 'badge-default', icon: Package };
  return (
    <span className={`badge ${m.cls}`}>
      <m.icon size={11} />{status ?? 'N/A'}
    </span>
  );
}

// ── Main ──────────────────────────────────────────────────────────────
export default function StaffDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.getStats();
      setStats(res?.data ?? res);
    } catch (err) {
      toast.error(err.message || 'Không thể tải dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const kpis          = stats?.kpis          ?? {};
  const revenueChart  = normalize(stats?.revenueChart);
  const topCustomers  = normalize(stats?.topCustomers);
  const recentOrders  = normalize(stats?.recentOrders);
  const statusChart   = normalize(stats?.statusChart);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        <p className="text-slate-400 text-sm">Đang tải dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">📊 Dashboard Tổng quan</h1>
          <p className="text-slate-500 text-sm mt-1">Thống kê hoạt động logistics theo thời gian thực</p>
        </div>
        <button onClick={load} className="btn btn-secondary">
          <RefreshCw size={15} /><span className="hidden sm:inline">Làm mới</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Tổng đơn hàng"      value={kpis.TotalOrders}    icon={Package}    color="#6366f1" bg="#e0e7ff" trend={12} />
        <KpiCard label="Đơn đang xử lý"     value={kpis.PendingOrders}  icon={Clock}      color="#f59e0b" bg="#fef3c7" />
        <KpiCard label="Phương tiện sẵn sàng" value={kpis.ReadyVehicles} icon={Truck}      color="#10b981" bg="#d1fae5" />
        <KpiCard label="Doanh thu tháng"     value={kpis.MonthlyRevenue != null ? `${(Number(kpis.MonthlyRevenue)/1e6).toFixed(1)}M` : '—'} icon={TrendingUp} color="#3b82f6" bg="#dbeafe" />
      </div>

      {/* Revenue Chart + Status Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 size={18} className="text-indigo-500" />
                Doanh thu theo tháng
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Đơn vị: triệu đồng (VNĐ)</p>
            </div>
          </div>
          <RevenueChart data={revenueChart} />
        </div>

        {/* Status distribution */}
        <div className="card p-5">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Package size={17} className="text-slate-500" />
            Phân phối trạng thái
          </h2>
          {statusChart.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Không có dữ liệu</p>
          ) : (
            <div className="space-y-3">
              {statusChart.map((s, i) => {
                const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];
                const total = statusChart.reduce((acc, x) => acc + Number(x.Count ?? x.count ?? 0), 0);
                const count = Number(s.Count ?? s.count ?? 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{s.Status ?? s.status}</span>
                      <span className="text-slate-400">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: colors[i % colors.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top Customers + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top customers */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Star size={16} className="text-amber-500" />Top 5 Khách hàng
            </h2>
          </div>
          <div className="divide-y divide-slate-50">
            {topCustomers.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-sm">Không có dữ liệu</p>
            ) : topCustomers.map((c, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-orange-400' : 'bg-slate-200'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{c.CustomerName ?? c.Name ?? '—'}</p>
                  <p className="text-xs text-slate-400">{c.TotalOrders ?? 0} đơn hàng</p>
                </div>
                <span className="text-sm font-bold text-indigo-600">
                  {c.TotalRevenue != null ? `${(Number(c.TotalRevenue)/1e6).toFixed(1)}M₫` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock size={16} className="text-slate-500" />Đơn hàng gần đây
            </h2>
          </div>
          <div className="divide-y divide-slate-50">
            {recentOrders.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-sm">Không có đơn hàng</p>
            ) : recentOrders.map((o, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                  <Package size={14} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">Đơn #{o.OrderId}</p>
                  <p className="text-xs text-slate-400 truncate">{o.CustomerName ?? '—'}</p>
                </div>
                <OrderStatusBadge status={o.Status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

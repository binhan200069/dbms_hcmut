/**
 * DriverDashboard.jsx — Tổng quan cho Tài xế
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Truck, Navigation, Clock, CheckCircle, ArrowRight, Star, Package } from 'lucide-react';
import shipmentApi from '../../api/shipmentApi';
import dashboardApi from '../../api/dashboardApi';
import { useAuth } from '../../context/AuthContext';

const normalize = (r) => (Array.isArray(r) ? r : r?.data ?? []);

export default function DriverDashboard() {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [bonus,       setBonus]       = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      shipmentApi.getAllAssignments(),
      dashboardApi.getDriverBonus(currentUser?.id ?? 'DRV001').catch(() => null),
    ]).then(([aRes, bRes]) => {
      setAssignments(normalize(aRes).slice(0, 5));
      setBonus(bRes?.data?.Bonus ?? bRes?.Bonus ?? null);
    }).catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [currentUser]);

  const stats = {
    total:   assignments.length,
    active:  assignments.filter((a) => a.Status === 'Đang thực hiện').length,
    done:    assignments.filter((a) => a.Status === 'Hoàn thành').length,
    planned: assignments.filter((a) => a.Status === 'Đã lên kế hoạch').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">🚛 Xin chào, Tài xế!</h1>
        <p className="text-slate-500 text-sm mt-1">Quản lý chuyến vận chuyển và cập nhật hành trình</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tổng chuyến', value: stats.total,   color: '#6366f1', bg: '#e0e7ff', icon: Truck },
          { label: 'Đang chạy',   value: stats.active,  color: '#3b82f6', bg: '#dbeafe', icon: Navigation },
          { label: 'Đã hoàn thành', value: stats.done,  color: '#10b981', bg: '#d1fae5', icon: CheckCircle },
          { label: 'Thưởng tháng', value: bonus != null ? `${Number(bonus).toLocaleString()}₫` : '—', color: '#f59e0b', bg: '#fef3c7', icon: Star },
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

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/driver/trips" className="card p-5 flex items-center gap-4 hover:shadow-md hover:border-amber-300 transition-all group border-2 border-transparent">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-500 transition-colors">
            <Truck size={22} className="text-amber-600 group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="font-bold text-slate-800">Chuyến của tôi</p>
            <p className="text-sm text-slate-500">{stats.active} chuyến đang thực hiện</p>
          </div>
          <ArrowRight size={18} className="ml-auto text-slate-300 group-hover:text-amber-500 transition-colors" />
        </Link>
        <Link to="/driver/tracking" className="card p-5 flex items-center gap-4 hover:shadow-md hover:border-indigo-300 transition-all group border-2 border-transparent">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
            <Navigation size={22} className="text-indigo-600 group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="font-bold text-slate-800">Cập nhật hành trình</p>
            <p className="text-sm text-slate-500">Cập nhật trạng thái chuyến</p>
          </div>
          <ArrowRight size={18} className="ml-auto text-slate-300 group-hover:text-indigo-500 transition-colors" />
        </Link>
      </div>

      {/* Recent assignments */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-bold text-slate-800">Chuyến gần đây</h2>
          <Link to="/driver/trips" className="text-sm text-indigo-600 hover:underline font-medium">Xem tất cả</Link>
        </div>
        <table className="data-table">
          <thead><tr><th>Mã PC</th><th>Chuyến</th><th>Phương tiện</th><th>Trạng thái</th><th>Ngày</th></tr></thead>
          <tbody>
            {loading && Array.from({ length: 3 }).map((_, i) => (
              <tr key={i}>{[1,2,3,4,5].map((j) => <td key={j}><div className="skeleton h-4 w-3/4" /></td>)}</tr>
            ))}
            {!loading && assignments.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-slate-400">Chưa có chuyến nào</td></tr>
            )}
            {!loading && assignments.map((a) => (
              <tr key={a.AssignmentId}>
                <td className="font-mono font-bold text-xs text-slate-600">#{a.AssignmentId}</td>
                <td><span className="font-semibold text-indigo-600">#{a.ShipmentId}</span></td>
                <td className="text-sm">{a.LicensePlate ?? '—'}</td>
                <td>
                  <span className={`badge ${
                    a.Status === 'Hoàn thành' ? 'badge-success' :
                    a.Status === 'Đang thực hiện' ? 'badge-info' :
                    a.Status === 'Hủy' ? 'badge-danger' : 'badge-default'
                  }`}>{a.Status}</span>
                </td>
                <td className="text-xs text-slate-400">{a.AssignDate ? new Date(a.AssignDate).toLocaleDateString('vi-VN') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

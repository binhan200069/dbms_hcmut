/**
 * DriverTracking.jsx — Theo dõi hành trình thực tế (DRIVER)
 * Route: /driver/tracking
 *
 * Trang này cho tài xế xem tracking log (nhật ký hành trình) của các đơn hàng
 * trong chuyến đang được phân công.
 * Khác với MyTrips (/driver/trips) — nơi xem danh sách chuyến & cập nhật trạng thái.
 */
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Navigation, MapPin, Clock, RefreshCw, Package,
  CheckCircle, Truck, Loader2, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import shipmentApi from '../../api/shipmentApi';

const normalize = (res) => (Array.isArray(res) ? res : res?.data ?? []);

const STATUS_ICON = {
  'Đang vận chuyển': Truck,
  'Đã giao':         CheckCircle,
  'Chờ xử lý':       Clock,
  'Đang xử lý':      Package,
};

function TrackingCard({ assignment }) {
  const Icon = STATUS_ICON[assignment.Status] ?? Clock;

  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
            <Navigation size={18} className="text-teal-600" />
          </div>
          <div>
            <p className="font-bold text-slate-800">
              Chuyến #{assignment.ShipmentId}
            </p>
            <p className="text-xs text-slate-400">
              PC #{assignment.AssignmentId} · {assignment.LicensePlate ?? '—'}
            </p>
          </div>
        </div>
        <span className={`badge ${
          assignment.Status === 'Hoàn thành' ? 'badge-success' :
          assignment.Status === 'Đang thực hiện' ? 'badge-info' :
          'badge-warning'
        } shrink-0`}>
          <Icon size={11} />{assignment.AssignmentStatus ?? assignment.Status}
        </span>
      </div>

      {/* Route info */}
      <div className="flex items-start gap-2 text-sm text-slate-600">
        <MapPin size={14} className="text-teal-400 mt-0.5 shrink-0" />
        <span>{assignment.RouteName ?? 'Chưa có thông tin tuyến đường'}</span>
      </div>

      {/* Timeline placeholder */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
          <Clock size={12} />
          Nhật ký hành trình
        </p>
        <div className="space-y-2">
          {[
            { time: assignment.AssignDate, label: 'Lệnh phân công được tạo', done: true },
            { time: null, label: 'Xuất phát', done: assignment.Status === 'Đang thực hiện' || assignment.Status === 'Hoàn thành' },
            { time: null, label: 'Đến nơi giao hàng', done: assignment.Status === 'Hoàn thành' },
          ].map(({ time, label, done }, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                done ? 'bg-teal-500' : 'bg-slate-200'
              }`}>
                {done
                  ? <CheckCircle size={11} className="text-white" />
                  : <span className="w-2 h-2 rounded-full bg-slate-400" />}
              </div>
              <div className="text-sm">
                <p className={done ? 'text-slate-700 font-medium' : 'text-slate-400'}>{label}</p>
                {time && (
                  <p className="text-xs text-slate-400">
                    {new Date(time).toLocaleDateString('vi-VN')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DriverTracking() {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading,     setLoading]     = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await shipmentApi.getAllAssignments();
      setAssignments(normalize(res));
    } catch (err) {
      toast.error(err.message || 'Không thể tải dữ liệu hành trình');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Chỉ hiển thị các chuyến đang thực hiện hoặc đã lên kế hoạch
  const activeAssignments = assignments.filter(a =>
    ['Đang thực hiện', 'Đã lên kế hoạch', 'Chờ xác nhận'].includes(
      a.AssignmentStatus ?? a.Status
    )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Navigation size={24} className="text-teal-500" />
            Theo dõi hành trình
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Trạng thái & nhật ký các chuyến đang thực hiện.{' '}
            Để cập nhật trạng thái chuyến, vào{' '}
            <a href="/driver/trips" className="text-indigo-600 underline hover:no-underline">
              Chuyến của tôi
            </a>.
          </p>
        </div>
        <button onClick={load} className="btn btn-secondary">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-teal-50 border border-teal-200">
        <AlertCircle size={18} className="text-teal-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-teal-800">Theo dõi thời gian thực</p>
          <p className="text-teal-700 mt-0.5">
            Nhật ký hành trình được cập nhật khi trạng thái chuyến thay đổi.
            Tài xế có thể cập nhật trạng thái tại trang{' '}
            <strong>Chuyến của tôi</strong>.
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="skeleton h-5 w-1/2" />
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-24 w-full" />
            </div>
          ))}
        </div>
      ) : activeAssignments.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Navigation size={30} className="text-slate-400" />
          </div>
          <p className="font-semibold text-slate-600 text-lg">Không có chuyến đang thực hiện</p>
          <p className="text-sm text-slate-400 text-center max-w-xs">
            Hiện tại bạn không có chuyến nào đang chạy.
            Khi được phân công chuyến mới, thông tin sẽ hiển thị tại đây.
          </p>
          <a href="/driver/trips" className="btn btn-secondary mt-2">
            <Truck size={15} />
            Xem tất cả chuyến
          </a>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            {activeAssignments.length} chuyến đang hoạt động
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAssignments.map(a => (
              <TrackingCard key={a.AssignmentId} assignment={a} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

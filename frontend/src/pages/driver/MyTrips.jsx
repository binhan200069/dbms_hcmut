/**
 * MyTrips.jsx — Danh sách chuyến của Tài xế
 */
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Truck, Clock, CheckCircle, XCircle, RefreshCw,
  MapPin, Calendar, Package, Loader2, Navigation,
} from 'lucide-react';
import shipmentApi from '../../api/shipmentApi';
import { useAuth } from '../../context/AuthContext';

const normalize = (r) => (Array.isArray(r) ? r : r?.data ?? []);

const STATUS_CFG = {
  'Đã lên kế hoạch': { badge: 'badge-default',  icon: Clock,        next: 'Đang thực hiện' },
  'Đang thực hiện':  { badge: 'badge-info',      icon: Truck,        next: 'Hoàn thành'     },
  'Hoàn thành':      { badge: 'badge-success',   icon: CheckCircle,  next: null             },
  'Hủy':             { badge: 'badge-danger',    icon: XCircle,      next: null             },
};

function TripCard({ assignment, onUpdateStatus }) {
  const cfg   = STATUS_CFG[assignment.Status] ?? STATUS_CFG['Đã lên kế hoạch'];
  const Icon  = cfg.icon;
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!cfg.next) return;
    setLoading(true);
    try {
      await onUpdateStatus(assignment.AssignmentId, cfg.next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <Truck size={18} className="text-indigo-600" />
          </div>
          <div>
            <p className="font-bold text-slate-800">Chuyến #{assignment.ShipmentId}</p>
            <p className="text-xs text-slate-400">PC #{assignment.AssignmentId}</p>
          </div>
        </div>
        <span className={`badge ${cfg.badge} shrink-0`}>
          <Icon size={11} />{assignment.Status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <Truck size={14} className="text-indigo-400 shrink-0" />
          <span className="truncate">{assignment.LicensePlate ?? '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <Calendar size={14} className="text-slate-400 shrink-0" />
          <span>{assignment.AssignDate ? new Date(assignment.AssignDate).toLocaleDateString('vi-VN') : '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 col-span-2">
          <MapPin size={14} className="text-slate-400 shrink-0" />
          <span className="truncate">{assignment.RouteName ?? 'Chưa có tuyến đường'}</span>
        </div>
      </div>

      {cfg.next && (
        <button
          onClick={handleNext}
          disabled={loading}
          className="btn btn-primary w-full justify-center"
        >
          {loading
            ? <><Loader2 size={15} className="animate-spin" />Đang cập nhật...</>
            : <><Navigation size={15} />Chuyển sang: {cfg.next}</>
          }
        </button>
      )}
    </div>
  );
}

export default function MyTrips() {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter,  setFilter]          = useState('Tất cả');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await shipmentApi.getAllAssignments();
      setAssignments(normalize(res));
    } catch (err) {
      toast.error(err.message || 'Không thể tải danh sách chuyến');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await shipmentApi.updateAssignmentStatus(id, status);
      toast.success(`✅ Đã cập nhật trạng thái: ${status}`);
      load();
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật trạng thái');
    }
  };

  const tabs = ['Tất cả', 'Đã lên kế hoạch', 'Đang thực hiện', 'Hoàn thành'];
  const filtered = filter === 'Tất cả'
    ? assignments
    : assignments.filter((a) => a.Status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Truck size={24} className="text-amber-500" />Chuyến được phân công
          </h1>
          <p className="text-slate-500 text-sm mt-1">Tất cả chuyến vận chuyển của bạn</p>
        </div>
        <button onClick={load} className="btn btn-secondary">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Làm mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === t
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-200'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
            }`}
          >
            {t}
            {t !== 'Tất cả' && (
              <span className="ml-1.5 text-xs opacity-75">
                ({assignments.filter((a) => a.Status === t).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="skeleton h-5 w-1/2" />
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-9 w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Package size={30} className="text-slate-400" />
          </div>
          <p className="font-semibold text-slate-500">Không có chuyến nào</p>
          <p className="text-sm text-slate-400">{filter !== 'Tất cả' ? `Không có chuyến "${filter}"` : 'Bạn chưa được phân công chuyến nào'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <TripCard key={a.AssignmentId} assignment={a} onUpdateStatus={handleUpdateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

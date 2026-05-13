/**
 * StaffManagement.jsx
 * ─────────────────────────────────────────────────────────────────────
 * Trang Quản lý Nhân viên — dành cho STAFF.
 *
 * Tính năng:
 *  ✅ Hiển thị danh sách nhân viên dạng bảng
 *  ✅ Tìm kiếm real-time theo tên hoặc email
 *  ✅ Thêm nhân viên mới (Modal form)
 *  ✅ Chỉnh sửa nhân viên (Modal form, data pre-filled)
 *  ✅ Xóa nhân viên với confirm dialog
 *
 * Quy tắc xử lý lỗi (QUAN TRỌNG):
 *  try {
 *    await staffManagementApi.delete(id)
 *    toast.success(...)
 *  } catch (err) {
 *    toast.error(err.message) // ← Câu lỗi từ backend
 *  }
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Users, Plus, Search, Edit2, Trash2, X, RefreshCw,
  AlertTriangle, Loader2, Shield, User,
  CheckCircle, Mail, Phone, MapPin, Filter, UserStar, CircleUser, ChevronDown, ChevronUp,
} from 'lucide-react';
import staffManagementApi from '../../api/staffManagementApi';

// ── Cấu hình vị trí/chức vụ ──────────────────────────────────
const STAFF_POSITIONS = [
  'Staff',
  'Manager',
  'Supervisor',
  'Coordinator',
  'Warehouse Keeper',
];

const DEPARTMENT = [
  'Planning',
  'Logistics',
  'Warehouse',
];

// ── Map role → style badge ──────────────────────────────────
const ROLE_MAP = {
  'Manager':     { badge: 'badge-purple', icon: Shield,     label: 'Manager' },
  'Supervisor':  { badge: 'badge-blue',  icon: Shield,     label: 'Supervisor' },
  'Dispatcher':  { badge: 'badge-green', icon: User,       label: 'Dispatcher' },
  'Coordinator': { badge: 'badge-orange', icon: User,      label: 'Coordinator' },
  'Admin':       { badge: 'badge-red',   icon: Shield,     label: 'Admin' },
  'Support':     { badge: 'badge-gray',  icon: User,       label: 'Support' },
  'Customer':    { badge: 'badge-info',  icon: User,       label: 'Customer' },
  'Driver':      { badge: 'badge-warning', icon: User,     label: 'Driver' },
};

const ALL_ROLES = Object.keys(ROLE_MAP);

// ─────────────────────────────────────────────────────────────────────
// STAFF FORM MODAL
// ─────────────────────────────────────────────────────────────────────
function StaffFormModal({ staff, onClose, onSuccess }) {
  const isEdit = !!staff;
  const [loading, setLoading] = useState(false);
  const [AddForm, setForm] = useState({
    name:       '',
    account:    '',
    email:      '',
    address:    '',
    position:   STAFF_POSITIONS[0],
    department: DEPARTMENT[0],
    phone:      '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const newForm = { ...prev, [name]: value};
      if (name === 'name'){
        const emailPrefix = value
          .trim()
          .toLowerCase();
        newForm.email = emailPrefix;  
      }
      return newForm;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation cơ bản phía client
    if (!AddForm.name.trim()) {
      toast.error('Please enter name');
      return;
    }
    if (!AddForm.email.trim()) {
      toast.error('Please enter email');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name:       AddForm.name.trim(),
        account:    AddForm.email.trim(),
        email:      AddForm.email.trim() + '@logistics.vn',
        address:    AddForm.address.trim() || null,
        position:   AddForm.position,
        department: AddForm.department.trim() || null,
        phone:      AddForm.phone.trim() || null,
      };

      if (isEdit) {
        await staffManagementApi.update(staff.UserId, payload);
        toast.success(`Đã cập nhật thông tin ${AddForm.name}`);
      } else {
        await staffManagementApi.create(payload);
        toast.success(`Added ${AddForm.name} successfully`);
      }

      onSuccess(); // Reload danh sách
      onClose();
    } catch (err) {
      // Lỗi từ backend
      toast.error(err.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Users size={20} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="modal-title">
                {isEdit ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
              </h2>
              <p className="modal-subtitle" style={{ marginBottom: 0 }}>
                {isEdit
                  ? `Đang sửa: ${staff.Name}`
                  : 'Fill in the form to add a new staff'}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Form New*/}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[60vh] pr-2">

            {/* Tên */}
            <div className="form-group">
              <label className="form-label">Name <span className="text-red-500">*</span></label>
              <input
                className="form-input"
                name="name"
                value={AddForm.name}
                onChange={handleChange}
                placeholder="Example: Nguyen Van A"
              />
            </div>

            {/* Email */}
            <div className="form-group">
                <label className="form-label">Email <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name = "email"
                  value={AddForm.email}
                  onChange={handleChange}
                  placeholder='Account Name'
                />
                <span className="domain">@logistics.vn </span>
            </div>

            {/* Địa chỉ */}
            <div className="form-group">
              <label className="form-label">Address</label>
              <input
                className="form-input"
                name="address"
                value={AddForm.address}
                onChange={handleChange}
                placeholder="Example: 268 Lu Gia, Phu Tho, Ho Chi Minh City"
              />
            </div>

            {/* Chức vụ */}
            <div className="form-group">
              <label className="form-label">Position</label>
              <select
                className="form-select"
                name="position"
                value={AddForm.position}
                onChange={handleChange}
              >
                {STAFF_POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>

            {/* Phòng ban */}
            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                className="form-select"
                name="department"
                value={AddForm.department}
                onChange={handleChange}
              >
                {DEPARTMENT.map((pos) => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
            

            {/* Số điện thoại */}
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                className="form-input"
                name="phone"
                value={AddForm.phone}
                onChange={handleChange}
                placeholder="Example: 0123456789"
              />
            </div>          
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  {isEdit ? <Edit2 size={15} /> : <Plus size={15} />}
                  {isEdit ? 'Lưu thay đổi' : 'Thêm nhân viên'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StaffEditModal({ staff, onClose, onSuccess}) {
  console.log('staff data:', staff);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name:       staff?.Name       ?? '',
    address:    staff?.Address    ?? '',
    position:   staff?.Position   ?? '',
    department: staff?.Department ?? '',
    phone:      staff?.Phone      ?? '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev => ({ ...prev, [name]: value})));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await staffManagementApi.update(staff.UserId, form);
      toast.success('Updated Information Successfully');
      onSuccess();
      onClose();
    }
    catch (err) {
      toast.error(err.message || 'Updated Failed, please try again');
    }
    finally{
      setLoading(false);
    }
  };

  return (
     <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Users size={20} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="modal-title">Modify information</h2>
              <p className="modal-subtitle" style={{ marginBottom: 0 }}>
                Editing: {staff.Name}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Form New*/}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[60vh] pr-2">

            {/* Tên */}
            <div className="form-group">
              <label className="form-label">Name <span className="text-red-500">*</span></label>
              <input
                className="form-input"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Example: Nguyen Van A"
              />
            </div>

            {/* Địa chỉ */}
            <div className="form-group">
              <label className="form-label">Address</label>
              <input
                className="form-input"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Example: 268 Lu Gia, Phu Tho, Ho Chi Minh City"
              />
            </div>

            {/* Chức vụ */}
            <div className="form-group">
              <label className="form-label">Position</label>
              <select
                className="form-select"
                name="position"
                value={form.position}
                onChange={handleChange}
              >
                {STAFF_POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>

            {/* Phòng ban */}
            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                className="form-select"
                name="department"
                value={form.department}
                onChange={handleChange}
              >
                {DEPARTMENT.map((pos) => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
            
            {/* Số điện thoại */}
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                className="form-input"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Example: 0123456789"
              />
            </div>          
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <><Loader2 size={15} className="animate-spin" />Đang lưu...</>
              ) : (
                <><Edit2 size={15} />Modify</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────
// DELETE CONFIRM DIALOG
// ─────────────────────────────────────────────────────────────────────
function DeleteConfirmDialog({ staff, onClose, onConfirm, loading }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 420 }}>
        {/* Warning icon */}
        <div className="flex flex-col items-center text-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <div>
            <h2 className="modal-title">Confirm Delete?</h2>
            <p className="modal-subtitle" style={{ marginBottom: 0 }}>
              Staff <span className="font-bold text-slate-800">{staff.Name}</span> will be removed from the system permanently.
            </p>
          </div>
        </div>

        {/* Cảnh báo */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 mb-6">
          <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Notice:</strong> This action can not be undone.
          </p>
        </div>

        <div className="modal-footer" style={{ paddingTop: 0, marginTop: 0, border: 'none' }}>
          <button className="btn btn-secondary flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-danger flex-1" onClick={onConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 size={15} />
                Delete Staff
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// STATS CARD
// ─────────────────────────────────────────────────────────────────────
    {/* Helper component cho sortable header */}
    const SortTh = ({ field, sortField, sortDir, onSort, children }) => (
      <th className="px-4 py-2 cursor-pointer select-none hover:bg-slate-50"
      onClick={() => onSort(field)}>
        <div className="flex items-center gap-1">
            {children}
            {sortField === field
                ? sortDir === 'asc'
                ? <ChevronUp size={13} className="text-indigo-500" />
                : <ChevronDown size={13} className="text-indigo-500" />
                : <ChevronDown size={13} className="text-slate-300" />
            }
        </div>
    </th>
  );
function StatsCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: bg }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
    

}
// ─────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────
export default function StaffManagement() {
  const [staff, setStaff]                   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [searchQuery, setSearchQuery]       = useState('');
  const [filterRole, setFilterRole]         = useState('Tất cả');
  const [showAddModal, setShowAddModal]     = useState(false);
  const [editingStaff, setEditingStaff]     = useState(null);
  const [deletingStaff, setDeletingStaff]   = useState(null);
  const [deleteLoading, setDeleteLoading]   = useState(false);
  const [sortField, setSortField]           = useState('Name');
  const [sortDir, setSortDir]               = useState('asc');

  // ── Fetch danh sách nhân viên ──────────────────────────────────────────────
  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const response = await staffManagementApi.getAll();
      console.log('raw response:', response);      
        console.log('response.data:', response.data); 
      // Backend trả về { success: true, data: [...] }
      const staffList = response.data || [];
      console.log('staffList:', staffList);
      setStaff(staffList);
    } catch (err) {
      toast.error(err.message || 'Không thể tải danh sách nhân viên');
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // ── Tìm kiếm & lọc (client-side) ───────────────────────────────────
 // Gộp filter + sort vào 1 useMemo, xóa cái cũ
const filtered = useMemo(() => {
    let list = staff;
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        list = list.filter(s =>
            s.Name?.toLowerCase().includes(q) ||
            s.email?.toLowerCase().includes(q)
        );
    }
    if (filterRole !== 'Tất cả') {
        list = list.filter(s => s.Position === filterRole);
    }

    list = [...list].sort((a, b) => {
        const valA = a[sortField] ?? '';
        const valB = b[sortField] ?? '';
        return sortDir === 'asc'
            ? valA.toString().localeCompare(valB.toString())
            : valB.toString().localeCompare(valA.toString());
    });
    return list;
}, [staff, searchQuery, filterRole, sortField, sortDir]);

const handleSort = (field) => {
    if (sortField === field) {
        setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
        setSortField(field);
        setSortDir('asc');
    }
};

  // ── Stats tính từ data ──────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:       staff.length,
    managers:    staff.filter((s) => s.Position === 'Manager').length,
    supervisors: staff.filter((s) => s.Position === 'Supervisor').length,
    staffs:      staff.filter((s) => s.Position === 'Staff').length,
    coordinator: staff.filter((s) => s.Position === 'Coordinator').length,
    storekeeper: staff.filter((s) => s.Position === 'Warehouse Keeper').length
  }), [staff]);

  // ── Xử lý XÓA nhân viên ────────────────────────────
  const handleDelete = async () => {
    if (!deletingStaff) return;
    setDeleteLoading(true);
    try {
      await staffManagementApi.delete(deletingStaff.UserId);
      toast.success(
        `Delete Staff ${deletingStaff.Name} from system successfully`
      );
      setDeletingStaff(null);
      fetchStaff(); // Reload danh sách
    } catch (err) {
      toast.error(err.message || 'Không thể xóa nhân viên');
      setDeletingStaff(null);
    } finally {
      setDeleteLoading(false);
    }
  };





  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Users size={26} className="text-indigo-600" />
            Staff Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage Staff Information
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={17} />
          Add New Staff
        </button>
      </div>

      {/* ── Stats Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Staff"  value={stats.total}         icon={Users}          color="#6366f1" bg="#e0e7ff" />
        <StatsCard label="Managers"     value={stats.managers}      icon={CircleUser}     color="#7c3aed" bg="#ede9fe" />
        <StatsCard label="Supervisors"   value={stats.supervisors}  icon={UserStar}       color="#059669" bg="#d1fae5" />
        <StatsCard label="Staffs"        value={stats.staffs}       icon={User}           color="#dc2626" bg="#fee2e2" />
      </div>

      {/* ── Search & Filter Bar ──────────────────────────────────────── */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            className="form-input pl-10"
            placeholder="Tìm tên hoặc email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Role filter */}
        <div className="relative min-w-[160px]">
          <Filter size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            className="form-select pl-9 pr-8 appearance-none"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="Tất cả">All</option>
            {STAFF_POSITIONS.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Refresh */}
        <button
          onClick={fetchStaff}
          className="btn btn-secondary shrink-0"
          disabled={loading}
          title="Tải lại danh sách"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>


      {/* ── Data Table ───────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        {/* Table header meta */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Staff List</p>
          {filtered.length === 0 && !loading && searchQuery && (
            <p className="text-xs text-slate-400">
              Không tìm thấy kết quả cho &ldquo;{searchQuery}&rdquo;
            </p>
          )}
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[500px] border border-gray-200 rounded-lg">
          <table className="data-table">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr>
                  <SortTh field="Name" sortField={sortField} sortDir={sortDir} onSort={handleSort}>
                      <User size={14} className="text-indigo-400" /> Name
                  </SortTh>
                  <SortTh field="email" sortField={sortField} sortDir={sortDir} onSort={handleSort}>
                      <Mail size={14} className="text-indigo-400" /> Email
                  </SortTh>
                  <SortTh field="Phone" sortField={sortField} sortDir={sortDir} onSort={handleSort}>
                      <Phone size={14} className="text-indigo-400" /> Phone
                  </SortTh>
                  <SortTh field="Position"      sortField={sortField} sortDir={sortDir} onSort={handleSort}>Position</SortTh>
                  <SortTh field="Department"    sortField={sortField} sortDir={sortDir} onSort={handleSort}>Department</SortTh>
                  <SortTh field="Supervisor_Id" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Supervisor_Id</SortTh>
                  <SortTh field="ManageDate"    sortField={sortField} sortDir={sortDir} onSort={handleSort}>ManageDate</SortTh>
                  <th>Modify</th>
              </tr>
            </thead>
            <tbody>
              {/* Loading skeleton */}
              {loading && (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j}>
                        <div
                          className="skeleton h-4"
                          style={{ width: `${60 + j * 10}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              )}

              {/* Empty state */}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center py-12 gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <Users size={26} className="text-slate-400" />
                      </div>
                      <p className="font-semibold text-slate-500">
                        {searchQuery ? 'Không tìm thấy nhân viên' : 'Chưa có nhân viên nào'}
                      </p>
                      <p className="text-sm text-slate-400">
                        {searchQuery
                          ? 'Thử từ khóa khác hoặc xóa bộ lọc'
                          : 'Nhấn "Thêm nhân viên" để bắt đầu'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {!loading && filtered.map((s) => {
                const roleMeta = ROLE_MAP[s.Position] || ROLE_MAP['Support'];
                const RoleIcon = roleMeta.icon;
                return (
                  <tr key={s.UserId} className="animate-fade-in-up">
                    {/* Họ tên */}
                    <td><span className="font-semibold text-slate-800">{s.Name}</span></td>

                    {/* Email */}
                    <td className="text-slate-600">
                        <span className="text-sm">{s.email}</span>
                    </td>

                    {/* Số điện thoại */}
                    <td className="text-slate-600">
                        <span className="text-sm">{s.Phone}</span>
                    </td>

                    {/* Chức vụ */}
                    <td className="text-slate-600 text-sm">
                        {s.Position || <span className="text-slate-300 italic">N/A</span>}
                    </td>

                    {/* Phòng ban */}
                    <td className="text-slate-600 text-sm">
                      {s.Department || <span className="text-slate-300 italic">N/A</span>}
                    </td>

                    {/* SupervisorId */}
                    <td className="text-slate-600 text-sm">
                      {s.SupervisorId || <span className="text-slate-300 italic">N/A</span>}
                    </td>

                    {/* ManageDate */}
                    <td className="text-slate-600 text-sm">
                        {s.ManageDate ? (
                            new Date(s.ManageDate).toLocaleDateString()
                        ) : (
                            <span className="text-slate-300 italic">N/A</span>
                        )}
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Edit */}
                        <button
                          className="btn-icon btn-icon-primary"
                          onClick={() => setEditingStaff(s)}
                          title="Modify information"
                        >
                          <Edit2 size={15} />
                        </button>

                        {/* Delete */}
                        <button
                          className="btn-icon btn-icon-danger"
                          onClick={() => setDeletingStaff(s)}
                          title="Delete information"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────── */}

      {/* Add modal */}
      {showAddModal && (
        <StaffFormModal
          staff={null}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchStaff}
        />
      )}

      {/* Edit modal */}
      {editingStaff && (
        <StaffEditModal
          staff={editingStaff}
          onClose={() => setEditingStaff(null)}
          onSuccess={fetchStaff}
        />
      )}

      {/* Delete confirm */}
      {deletingStaff && (
        <DeleteConfirmDialog
          staff={deletingStaff}
          onClose={() => setDeletingStaff(null)}
          onConfirm={handleDelete}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}

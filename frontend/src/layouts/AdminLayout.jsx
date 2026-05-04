/**
 * AdminLayout.jsx
 * ─────────────────────────────────────────────────────────────────────
 * Layout chính của toàn bộ Dashboard.
 * Bao gồm:
 *   - Sidebar: Menu điều hướng thay đổi theo Role
 *   - Topbar:  RoleSwitcher dropdown + thông tin user hiện tại
 *   - <Outlet>: Nơi render các trang con (từ React Router)
 *
 * Thiết kế: Dark sidebar + Light content area
 */

import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth, ROLE_META } from '../context/AuthContext';
import {
  LayoutDashboard,
  Truck,
  Package,
  ClipboardList,
  MapPin,
  History,
  Navigation,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Shield,
  User,
  HardHat,
  Bell,
  Settings,
  Activity,
} from 'lucide-react';

// ── Menu cấu hình theo từng Role ──────────────────────────────────────
const MENU_CONFIG = {
  STAFF: [
    {
      section: 'Tổng quan',
      items: [
        { to: '/admin',          icon: LayoutDashboard, label: 'Dashboard',         exact: true },
      ],
    },
    {
      section: 'Vận hành',
      items: [
        { to: '/admin/vehicles',  icon: Truck,           label: 'Phương tiện'   },
        { to: '/admin/dispatch',  icon: ClipboardList,   label: 'Phân công chuyến' },
        { to: '/admin/shipments', icon: Package,         label: 'Chuyến vận chuyển' },
      ],
    },
    {
      section: 'Quản lý đơn hàng',
      items: [
        { to: '/admin/orders',    icon: Package,         label: 'Tất cả đơn hàng' },
      ],
    },
  ],
  CUSTOMER: [
    {
      section: 'Đơn hàng',
      items: [
        { to: '/customer',         icon: LayoutDashboard, label: 'Tổng quan',        exact: true },
        { to: '/customer/create',  icon: Package,         label: 'Tạo đơn mới'  },
        { to: '/customer/history', icon: History,         label: 'Lịch sử đơn hàng' },
      ],
    },
    {
      section: 'Theo dõi',
      items: [
        { to: '/customer/tracking', icon: MapPin,         label: 'Theo dõi hàng' },
      ],
    },
  ],
  DRIVER: [
    {
      section: 'Chuyến của tôi',
      items: [
        { to: '/driver',           icon: LayoutDashboard, label: 'Tổng quan',        exact: true },
        { to: '/driver/trips',     icon: Truck,           label: 'Chuyến được phân'  },
        { to: '/driver/tracking',  icon: Navigation,      label: 'Cập nhật hành trình' },
      ],
    },
  ],
};

// ── Role Icon Map ─────────────────────────────────────────────────────
const RoleIcon = ({ icon, size = 16 }) => {
  if (icon === 'staff')    return <Shield    size={size} />;
  if (icon === 'customer') return <User      size={size} />;
  if (icon === 'driver')   return <HardHat   size={size} />;
  return null;
};

// ── Role color map ────────────────────────────────────────────────────
const ROLE_COLORS = {
  STAFF:    { bg: 'bg-indigo-500', ring: 'ring-indigo-400', text: 'text-indigo-400', badge: '#6366f1' },
  CUSTOMER: { bg: 'bg-emerald-500', ring: 'ring-emerald-400', text: 'text-emerald-400', badge: '#10b981' },
  DRIVER:   { bg: 'bg-amber-500', ring: 'ring-amber-400', text: 'text-amber-400', badge: '#f59e0b' },
};

// ═══════════════════════════════════════════════════════════════════════
// SIDEBAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════
function Sidebar({ isOpen, onClose }) {
  const { currentUser, currentRole } = useAuth();
  const menuItems = MENU_CONFIG[currentRole] || MENU_CONFIG.STAFF;
  const roleColor = ROLE_COLORS[currentRole];

  return (
    <>
      {/* Overlay cho mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        style={{ width: 'var(--sidebar-width)', background: 'var(--sidebar-bg)' }}
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* ── Logo ─────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--sidebar-border)' }}
        >
          <div className="flex items-center gap-3">
            {/* Logo icon */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg">
              <Activity size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">LogiChain</p>
              <p className="text-xs" style={{ color: 'var(--sidebar-text)' }}>
                Quản lý vận chuyển
              </p>
            </div>
          </div>
          {/* Close button (mobile) */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── User Info Card ────────────────────────────────── */}
        <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/60">
            {/* Avatar */}
            <div
              className={`w-9 h-9 rounded-full ${roleColor.bg} flex items-center justify-center ring-2 ${roleColor.ring} ring-offset-2 ring-offset-slate-900 shrink-0`}
            >
              <span className="text-white font-bold text-xs">{currentUser?.avatar}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">
                {currentUser?.name}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--sidebar-text)' }}>
                {currentUser?.email}
              </p>
            </div>
          </div>
        </div>

        {/* ── Navigation Menu ───────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 sidebar-scroll">
          {menuItems.map((section) => (
            <div key={section.section} className="mb-5">
              {/* Section header */}
              <p
                className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest"
                style={{ color: '#475569' }}
              >
                {section.section}
              </p>

              {/* Nav items */}
              <ul className="space-y-1">
                {section.items.map(({ to, icon: Icon, label, exact }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={exact}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                        ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            size={17}
                            className={`shrink-0 transition-transform duration-150 ${
                              isActive ? '' : 'group-hover:scale-110'
                            }`}
                          />
                          <span>{label}</span>
                          {isActive && (
                            <ChevronRight size={14} className="ml-auto opacity-70" />
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* ── Footer ───────────────────────────────────────── */}
        <div className="p-3" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
          <div className="px-3 py-2 rounded-lg flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
              title="Backend đang kết nối"
            />
            <span className="text-xs" style={{ color: '#475569' }}>
              Backend: localhost:5000
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ROLE SWITCHER DROPDOWN
// ═══════════════════════════════════════════════════════════════════════
function RoleSwitcher() {
  const { currentRole, currentUser, switchRole, ROLE_META: roleMeta } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentMeta = roleMeta.find((m) => m.role === currentRole);
  const roleColor = ROLE_COLORS[currentRole];

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
      >
        {/* Role color dot */}
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: roleColor.badge }}
        />
        <span className="text-sm font-semibold text-slate-700 hidden sm:block">
          {currentMeta?.label}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-scale-in">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Giả lập vai trò
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Chọn vai trò để xem giao diện tương ứng
            </p>
          </div>

          {/* Role list */}
          <div className="p-2">
            {roleMeta.map((meta) => {
              const isActive = meta.role === currentRole;
              const color = ROLE_COLORS[meta.role];
              return (
                <button
                  key={meta.role}
                  onClick={() => {
                    if (!isActive) {
                      switchRole(meta.role);
                      setOpen(false);
                    }
                  }}
                  disabled={isActive}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-150
                    ${isActive
                      ? 'bg-slate-50 cursor-default'
                      : 'hover:bg-slate-50 cursor-pointer'
                    }
                  `}
                >
                  {/* Icon circle */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color.bg}`}
                  >
                    <RoleIcon icon={meta.icon} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{meta.label}</p>
                    <p className="text-xs text-slate-500 truncate">{meta.description}</p>
                  </div>
                  {/* Active check */}
                  {isActive && (
                    <span
                      className="shrink-0 px-2 py-0.5 rounded-full text-xs font-bold text-white"
                      style={{ background: roleColor.badge }}
                    >
                      Đang dùng
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-slate-100">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <RefreshCw size={11} />
              Đổi vai trò sẽ điều hướng sang trang tương ứng
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TOPBAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════
function Topbar({ onMenuToggle, pageTitle }) {
  return (
    <header
      className="fixed top-0 right-0 left-0 lg:left-[260px] bg-white/80 backdrop-blur-md border-b border-slate-200 z-30"
      style={{ height: 'var(--topbar-height)' }}
    >
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        {/* Left: Hamburger (mobile) + Page title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-800 leading-tight">
              {pageTitle || 'Dashboard'}
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              Hệ thống Quản lý Logistics & Chuỗi Cung Ứng
            </p>
          </div>
        </div>

        {/* Right: Role Switcher + Notifications + Avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Role Switcher — Component quan trọng để demo */}
          <RoleSwitcher />

          {/* Notification bell (decorative) */}
          <button className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <Bell size={19} />
            {/* Badge */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>

          {/* Settings (decorative) */}
          <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors hidden sm:flex">
            <Settings size={19} />
          </button>
        </div>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ADMIN LAYOUT — ROOT COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-page)' }}>
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Topbar */}
        <Topbar
          onMenuToggle={() => setSidebarOpen((v) => !v)}
        />

        {/* Page content */}
        <main
          className="flex-1 overflow-auto p-4 sm:p-6"
          style={{ paddingTop: 'calc(var(--topbar-height) + 1.5rem)' }}
        >
          {/* Animate khi chuyển trang */}
          <div className="animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

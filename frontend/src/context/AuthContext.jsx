/**
 * AuthContext.jsx
 * ─────────────────────────────────────────────────────────────────────
 * Quản lý trạng thái "Giả lập vai trò" (Mock Role) cho toàn bộ app.
 *
 * Cơ chế hoạt động:
 *  1. Role được lưu vào localStorage để persist qua refresh.
 *  2. axiosClient.js tự đọc localStorage để gắn header `x-user-role`.
 *  3. Sidebar và menu thay đổi theo role từ Context này.
 *
 * Các role: STAFF | CUSTOMER | DRIVER
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

// ── Constants ─────────────────────────────────────────────────────────
export const ROLES = {
  STAFF:    'STAFF',
  CUSTOMER: 'CUSTOMER',
  DRIVER:   'DRIVER',
};

// Map role → đường dẫn trang chủ tương ứng
const ROLE_HOME_PATH = {
  [ROLES.STAFF]:    '/admin',
  [ROLES.CUSTOMER]: '/customer',
  [ROLES.DRIVER]:   '/driver',
};

// Mock users: mỗi role tương ứng với 1 người dùng giả lập
const MOCK_USERS = {
  [ROLES.STAFF]: {
    id:     'STF001',
    name:   'Nguyễn Điều Phối',
    role:   ROLES.STAFF,
    email:  'staff@logistics.vn',
    avatar: 'NĐ',
  },
  [ROLES.CUSTOMER]: {
    id:     'CUS001',
    name:   'Trần Thị Khách Hàng',
    role:   ROLES.CUSTOMER,
    email:  'customer@logistics.vn',
    avatar: 'TK',
  },
  [ROLES.DRIVER]: {
    id:     'DRV001',
    name:   'Lê Văn Tài Xế',
    role:   ROLES.DRIVER,
    email:  'driver@logistics.vn',
    avatar: 'LX',
  },
};

// Thông tin hiển thị cho từng role (dùng trong RoleSwitcher)
export const ROLE_META = [
  {
    role:        ROLES.STAFF,
    label:       'Nhân viên điều phối',
    description: 'Quản lý xe, đơn hàng, phân công',
    color:       'indigo',
    icon:        'staff',
  },
  {
    role:        ROLES.CUSTOMER,
    label:       'Khách hàng',
    description: 'Tạo đơn hàng, theo dõi vận chuyển',
    color:       'emerald',
    icon:        'customer',
  },
  {
    role:        ROLES.DRIVER,
    label:       'Tài xế',
    description: 'Xem chuyến phân công, cập nhật trạng thái',
    color:       'amber',
    icon:        'driver',
  },
];

// ── Context ───────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Lấy role đã lưu từ lần trước, mặc định STAFF
  const [currentRole, setCurrentRole] = useState(() => {
    const saved = localStorage.getItem('userRole');
    return Object.values(ROLES).includes(saved) ? saved : ROLES.STAFF;
  });

  // currentUser được tính từ currentRole
  const currentUser = useMemo(() => MOCK_USERS[currentRole], [currentRole]);

  // Đồng bộ localStorage mỗi khi role thay đổi
  useEffect(() => {
    localStorage.setItem('userRole', currentRole);
  }, [currentRole]);

  /**
   * switchRole — Chuyển đổi vai trò và điều hướng sang trang tương ứng.
   * Dùng window.location.href để đảm bảo reset toàn bộ state của app.
   */
  const switchRole = (newRole) => {
    if (!MOCK_USERS[newRole]) return;
    localStorage.setItem('userRole', newRole);
    setCurrentRole(newRole);
    // Hard navigate để đảm bảo tất cả state được reset hoàn toàn
    window.location.href = ROLE_HOME_PATH[newRole];
  };

  /** Trả về đường dẫn home của một role cụ thể */
  const getHomePath = (role = currentRole) => ROLE_HOME_PATH[role] || '/admin';

  /** Kiểm tra xem user hiện tại có role được phép không */
  const hasRole = (...allowedRoles) => allowedRoles.includes(currentRole);

  const value = useMemo(
    () => ({
      currentUser,
      currentRole,
      switchRole,
      getHomePath,
      hasRole,
      ROLES,
      ROLE_META,
      // Backward compat
      getPathByRole: getHomePath,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser, currentRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth — Hook để sử dụng AuthContext trong bất kỳ component nào.
 * Ném lỗi nếu dùng ngoài AuthProvider.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() phải được dùng bên trong <AuthProvider>');
  return ctx;
}

export default AuthContext;

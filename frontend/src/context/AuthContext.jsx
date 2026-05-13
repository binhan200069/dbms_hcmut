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
import { fetchUsers } from '../services/userApi';

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
  // Helper: map role string to category (STAFF/CUSTOMER/DRIVER)
  const getRoleCategory = (role) => {
    if (!role) return ROLES.STAFF;
    const roleStr = String(role).toLowerCase();
    if (roleStr.includes('customer') || roleStr.includes('khách hàng') || roleStr.includes('b2b') || roleStr.includes('b2c') ||
        roleStr.includes('wholesaler') || roleStr.includes('retailer')) {
      return ROLES.CUSTOMER;
    } else if (roleStr.includes('driver') || roleStr.includes('tài xế')) {
      return ROLES.DRIVER;
    }
    return ROLES.STAFF;
  };

  const normalizeUser = (user) => {
    if (!user) return null;
    return {
      ...user,
      id: typeof user.id === 'string' && !Number.isNaN(Number(user.id)) ? Number(user.id) : user.id,
    };
  };

  const savedCurrentUser = useMemo(() => {
    const saved = localStorage.getItem('currentUser');
    if (!saved) return null;
    try {
      return normalizeUser(JSON.parse(saved));
    } catch {
      return null;
    }
  }, []);

  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => savedCurrentUser || MOCK_USERS[ROLES.STAFF]);

  const currentRole = getRoleCategory(currentUser?.role);

  useEffect(() => {
    fetchUsers()
      .then((data) => {
        const normalized = data.map((user) => ({
          ...user,
          id: typeof user.id === 'string' && !Number.isNaN(Number(user.id)) ? Number(user.id) : user.id,
        }));
        setUsers(normalized);
        if (!savedCurrentUser && normalized.length > 0) {
          setCurrentUser(normalized[0]);
        }
      })
      .catch(() => {
        // Không quan trọng nếu không tải được user list, vẫn dùng mock fallback
      });
  }, [savedCurrentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      localStorage.setItem('userRole', currentUser.role);
    }
  }, [currentUser]);

  const switchRole = (newRole) => {
    const nextUser = users.find((user) => user.role === newRole) || MOCK_USERS[newRole];
    if (!nextUser) return;

    setCurrentUser(nextUser);
    localStorage.setItem('userRole', newRole);
    window.location.href = ROLE_HOME_PATH[newRole];
  };

  const switchUser = (newUser) => {
    if (!newUser || !newUser.role) return;
    const normalized = normalizeUser(newUser);
    setCurrentUser(normalized);
    localStorage.setItem('userRole', normalized.role);
    localStorage.setItem('currentUser', JSON.stringify(normalized));
    // No redirect - let the router handle navigation based on updated role
  };

  const getHomePath = (role = currentRole) => {
    // If role is already a category (STAFF/CUSTOMER/DRIVER), use it directly
    if (Object.values(ROLES).includes(role)) {
      return ROLE_HOME_PATH[role] || '/admin';
    }
    // Otherwise map it from role string
    const category = getRoleCategory(role);
    return ROLE_HOME_PATH[category] || '/admin';
  };

  const hasRole = (...allowedRoles) => allowedRoles.includes(currentRole);

  const value = useMemo(
    () => ({
      currentUser,
      currentRole,
      users,
      mockUsers: users,
      switchRole,
      switchUser,
      getHomePath,
      hasRole,
      getRoleCategory,
      ROLES,
      ROLE_META,
      // Backward compat
      getPathByRole: getHomePath,
    }),
    [currentUser, currentRole, users, getRoleCategory]
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

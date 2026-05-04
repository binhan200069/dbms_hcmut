import { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE = 'http://localhost:3001/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    totalShipments: 0,
    pendingShipments: 0,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const [vehiclesRes, shipmentsRes] = await Promise.all([
        axios.get(`${API_BASE}/vehicles`),
        axios.get(`${API_BASE}/shipments`),
      ])

      const vehicles = vehiclesRes.data.data || []
      const shipments = shipmentsRes.data.data || []

      setStats({
        totalVehicles: vehicles.length,
        activeVehicles: vehicles.filter((v) => v.status === 'active').length,
        totalShipments: shipments.length,
        pendingShipments: shipments.filter((s) => s.status === 'pending').length,
      })

      toast.success('Tải thống kê thành công')
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error('Lỗi khi tải thống kê', { duration: 5000 })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">📊 Tổng quan Admin</h1>
        <p className="mt-2 text-gray-600">Thống kê tổng quát hệ thống logistics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-6 border border-blue-200 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng Phương tiện</p>
              <p className="mt-2 text-3xl font-bold text-blue-600">{stats.totalVehicles}</p>
            </div>
            <div className="text-4xl">🚗</div>
          </div>
        </div>

        <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-6 border border-green-200 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Xe Hoạt động</p>
              <p className="mt-2 text-3xl font-bold text-green-600">{stats.activeVehicles}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        <div className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-6 border border-purple-200 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng Đơn hàng</p>
              <p className="mt-2 text-3xl font-bold text-purple-600">{stats.totalShipments}</p>
            </div>
            <div className="text-4xl">📦</div>
          </div>
        </div>

        <div className="rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 border border-yellow-200 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Chờ Phân công</p>
              <p className="mt-2 text-3xl font-bold text-yellow-600">{stats.pendingShipments}</p>
            </div>
            <div className="text-4xl">⏳</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold text-gray-900">⚡ Hành động nhanh</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <a
            href="/admin/vehicles"
            className="rounded-lg bg-blue-500 px-6 py-3 text-center text-white font-semibold hover:bg-blue-600 transition"
          >
            🚗 Quản lý Phương tiện
          </a>
          <a
            href="/admin/assignments"
            className="rounded-lg bg-green-500 px-6 py-3 text-center text-white font-semibold hover:bg-green-600 transition"
          >
            📦 Phân công Chuyến hàng
          </a>
          <button
            onClick={fetchStats}
            className="rounded-lg bg-purple-500 px-6 py-3 text-white font-semibold hover:bg-purple-600 transition"
          >
            🔄 Làm mới Thống kê
          </button>
        </div>
      </div>

      {/* Welcome Info */}
      <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border border-blue-200">
        <h3 className="text-lg font-bold text-gray-900 mb-3">👋 Chào mừng Admin</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✅ Bạn có thể quản lý các phương tiện trong hệ thống</li>
          <li>✅ Phân công chuyến hàng cho tài xế và phương tiện phù hợp</li>
          <li>✅ Hệ thống sẽ tự động kiểm tra tải trọng (Trigger Database)</li>
          <li>✅ Bạn có thể đóng vai CUSTOMER hoặc DRIVER bằng RoleSwitcher trên topbar</li>
        </ul>
      </div>
    </div>
  )
}

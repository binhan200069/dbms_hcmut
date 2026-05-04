import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import axios from 'axios'

const API_BASE = 'http://localhost:3001/api'

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    plate: '',
    type: '',
    capacity: '',
    status: 'active',
  })

  // Fetch danh sách vehicles khi component mount
  useEffect(() => {
    fetchVehicles()
  }, [])

  // ============ API CALLS ============

  /**
   * Lấy danh sách tất cả phương tiện
   */
  const fetchVehicles = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_BASE}/vehicles`)
      setVehicles(response.data.data || [])
      toast.success('Tải danh sách phương tiện thành công')
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      // Bắt lỗi từ server (Trigger/Procedure)
      const errorMessage = error.response?.data?.message || 'Không thể tải danh sách phương tiện'
      toast.error(errorMessage, { duration: 5000 })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Thêm phương tiện mới
   * try...catch: Bắt lỗi từ MySQL Trigger (VD: duplicate plate, invalid capacity)
   */
  const handleAddVehicle = async () => {
    if (!formData.plate || !formData.type || !formData.capacity) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }

    try {
      const response = await axios.post(`${API_BASE}/vehicles`, {
        plate: formData.plate.toUpperCase(),
        type: formData.type,
        capacity: parseInt(formData.capacity),
        status: formData.status,
      })

      toast.success('✅ Thêm phương tiện thành công')
      setVehicles([...vehicles, response.data.data])
      resetForm()
      setShowModal(false)
    } catch (error) {
      console.error('Error adding vehicle:', error)
      // Trích xuất message từ Database/Trigger
      const errorMessage =
        error.response?.data?.message || 'Lỗi khi thêm phương tiện. Vui lòng thử lại.'
      toast.error(errorMessage, { duration: 5000 })
    }
  }

  /**
   * Cập nhật phương tiện
   * try...catch: Bắt các lỗi từ Trigger (VD: không được sửa nếu xe đang được sử dụng)
   */
  const handleUpdateVehicle = async () => {
    if (!editingId) return

    try {
      const response = await axios.put(`${API_BASE}/vehicles/${editingId}`, {
        plate: formData.plate.toUpperCase(),
        type: formData.type,
        capacity: parseInt(formData.capacity),
        status: formData.status,
      })

      // Cập nhật lại list
      setVehicles(
        vehicles.map((v) =>
          v.id === editingId ? response.data.data : v
        )
      )

      toast.success('✅ Cập nhật phương tiện thành công')
      resetForm()
      setShowModal(false)
    } catch (error) {
      console.error('Error updating vehicle:', error)
      // Bắt lỗi từ server
      const errorMessage =
        error.response?.data?.message || 'Lỗi khi cập nhật phương tiện. Vui lòng thử lại.'
      toast.error(errorMessage, { duration: 5000 })
    }
  }

  /**
   * Xóa phương tiện
   * QUAN TRỌNG: Bắt lỗi từ Trigger - "Không được xóa xe nếu đã có dữ liệu phân công"
   * try...catch: Mandatory để catch lỗi nghiệp vụ từ database
   */
  const handleDeleteVehicle = async (id) => {
    if (!confirm('Bạn chắc chắn muốn xóa phương tiện này?')) return

    try {
      await axios.delete(`${API_BASE}/vehicles/${id}`)

      setVehicles(vehicles.filter((v) => v.id !== id))
      toast.success('✅ Xóa phương tiện thành công')
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      // ⚠️ QUAN TRỌNG: Đây là chỗ bắt lỗi từ Trigger
      // Server sẽ trả về message như: "Từ chối xóa: Xe này đã có dữ liệu phân công..."
      const errorMessage =
        error.response?.data?.message || 'Lỗi khi xóa phương tiện. Vui lòng thử lại.'

      // Hiển thị lỗi lâu để Giảng viên kịp đọc (5 giây)
      toast.error(errorMessage, { duration: 5000 })
    }
  }

  // ============ FORM HANDLERS ============

  const resetForm = () => {
    setFormData({
      plate: '',
      type: '',
      capacity: '',
      status: 'active',
    })
    setEditingId(null)
  }

  const handleOpenAddModal = () => {
    resetForm()
    setShowModal(true)
  }

  const handleOpenEditModal = (vehicle) => {
    setFormData({
      plate: vehicle.plate,
      type: vehicle.type,
      capacity: vehicle.capacity.toString(),
      status: vehicle.status,
    })
    setEditingId(vehicle.id)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    resetForm()
  }

  // ============ FILTER & SEARCH ============

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // ============ RENDER ============

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-gray-900">🚗 Quản lý Phương tiện</h1>
      </div>

      {/* Search & Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <input
            type="text"
            placeholder="🔍 Tìm theo Biển số hoặc Loại xe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <button
          onClick={handleOpenAddModal}
          className="rounded-lg bg-green-600 px-4 py-2 text-white font-semibold hover:bg-green-700 transition"
        >
          + Thêm Xe Mới
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Biển số
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Loại xe
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Tải trọng (kg)
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  ⏳ Đang tải...
                </td>
              </tr>
            ) : filteredVehicles.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  📭 Không có phương tiện nào
                </td>
              </tr>
            ) : (
              filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono font-semibold text-gray-900">
                    {vehicle.plate}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{vehicle.type}</td>
                  <td className="px-6 py-4 text-gray-700">{vehicle.capacity}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${vehicle.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      {vehicle.status === 'active' ? '✅ Hoạt động' : '⏸️ Không hoạt động'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditModal(vehicle)}
                        className="rounded px-3 py-1 text-sm bg-blue-500 text-white hover:bg-blue-600 transition"
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        className="rounded px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 transition"
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              {editingId ? '✏️ Sửa Phương tiện' : '➕ Thêm Phương tiện Mới'}
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                editingId ? handleUpdateVehicle() : handleAddVehicle()
              }}
              className="space-y-4"
            >
              {/* Biển số */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biển số xe
                </label>
                <input
                  type="text"
                  value={formData.plate}
                  onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                  placeholder="VD: 29B12345"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Loại xe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại xe
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">-- Chọn loại xe --</option>
                  <option value="Xe tải nhỏ">Xe tải nhỏ</option>
                  <option value="Xe tải trung">Xe tải trung</option>
                  <option value="Xe tải lớn">Xe tải lớn</option>
                </select>
              </div>

              {/* Tải trọng */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tải trọng (kg)
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="VD: 5000"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Trạng thái */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="active">✅ Hoạt động</option>
                  <option value="inactive">⏸️ Không hoạt động</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 transition"
                >
                  {editingId ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

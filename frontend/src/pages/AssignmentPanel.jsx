import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import axios from 'axios'

const API_BASE = 'http://localhost:3001/api'

export default function AssignmentPanel() {
  const [shipments, setShipments] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(false)

  // Form state
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [selectedDriver, setSelectedDriver] = useState('')

  // Fetch dữ liệu khi component mount
  useEffect(() => {
    loadData()
  }, [])

  // ============ API CALLS ============

  /**
   * Tải danh sách Shipments, Vehicles, Drivers
   */
  const loadData = async () => {
    setLoading(true)
    try {
      const [shipmentsRes, vehiclesRes, driversRes] = await Promise.all([
        axios.get(`${API_BASE}/shipments`),
        axios.get(`${API_BASE}/vehicles`),
        axios.get(`${API_BASE}/drivers`),
      ])

      setShipments(shipmentsRes.data.data || [])
      setVehicles(vehiclesRes.data.data || [])
      setDrivers(driversRes.data.data || [])

      toast.success('Tải dữ liệu thành công')
    } catch (error) {
      console.error('Error loading data:', error)
      const errorMessage = error.response?.data?.message || 'Lỗi khi tải dữ liệu'
      toast.error(errorMessage, { duration: 5000 })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Phân công chuyến hàng (gán xe + tài xế)
   * try...catch: QUAN TRỌNG - Bắt lỗi từ Trigger "Vượt quá tải trọng"
   * Nếu tổng trọng lượng vượt quá tải trọng xe, server sẽ trả về error message
   */
  const handleAssignShipment = async () => {
    if (!selectedShipment || !selectedVehicle || !selectedDriver) {
      toast.error('Vui lòng chọn đầy đủ thông tin')
      return
    }

    try {
      await axios.post(`${API_BASE}/assignments`, {
        shipment_id: selectedShipment.id,
        vehicle_id: selectedVehicle,
        driver_id: selectedDriver,
      })

      toast.success('✅ Phân công chuyến hàng thành công')

      // Cập nhật lại list (remove shipment đã phân công)
      setShipments(shipments.filter((s) => s.id !== selectedShipment.id))

      // Reset form
      setSelectedShipment(null)
      setSelectedVehicle('')
      setSelectedDriver('')
    } catch (error) {
      console.error('Error assigning shipment:', error)

      // ⚠️ QUAN TRỌNG: Đây là chỗ bắt lỗi từ Trigger
      // Ví dụ: "Lỗi Nghiệp Vụ: Tổng trọng lượng đơn hàng vượt quá tải trọng..."
      const errorMessage =
        error.response?.data?.message ||
        'Lỗi khi phân công chuyến hàng. Vui lòng thử lại.'

      // Hiển thị lỗi lâu (5 giây) để Giảng viên kịp đọc
      toast.error(errorMessage, { duration: 5000 })
    }
  }

  // ============ HELPER FUNCTIONS ============

  /**
   * Tính toán thông tin chuyến hàng được chọn
   */
  const getShipmentInfo = () => {
    if (!selectedShipment) return null

    return {
      weight: selectedShipment.weight || 0,
      items: selectedShipment.items || 0,
    }
  }

  /**
   * Lấy thông tin xe được chọn
   */
  const getVehicleInfo = () => {
    if (!selectedVehicle) return null

    const vehicle = vehicles.find((v) => v.id === parseInt(selectedVehicle))
    return vehicle || null
  }

  const shipmentInfo = getShipmentInfo()
  const vehicleInfo = getVehicleInfo()

  // ============ RENDER ============

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">📦 Phân công Chuyến hàng</h1>
        <p className="mt-2 text-gray-600">Chọn đơn hàng, phương tiện, và tài xế để thực hiện phân công</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Cột 1: Danh sách Shipments */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold text-gray-900">📋 Đơn hàng chờ phân công</h2>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <p className="py-4 text-center text-gray-500">⏳ Đang tải...</p>
            ) : shipments.length === 0 ? (
              <p className="py-4 text-center text-gray-500">✅ Không có đơn hàng chờ phân công</p>
            ) : (
              shipments.map((shipment) => (
                <button
                  key={shipment.id}
                  onClick={() => setSelectedShipment(shipment)}
                  className={`w-full rounded-lg border-2 p-3 text-left transition ${selectedShipment?.id === shipment.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        #{shipment.id} - {shipment.origin} → {shipment.destination}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        📦 Trọng lượng: <span className="font-medium">{shipment.weight}kg</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        📍 Từ: <span className="font-medium">{shipment.origin}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        📍 Đến: <span className="font-medium">{shipment.destination}</span>
                      </p>
                    </div>
                    <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                      Chờ phân công
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Cột 2: Form Phân công */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold text-gray-900">⚙️ Chi tiết phân công</h2>

          {selectedShipment ? (
            <div className="space-y-4">
              {/* Thông tin Shipment */}
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="font-semibold text-gray-900">📦 Đơn hàng được chọn</p>
                <p className="text-sm text-gray-600 mt-1">#{selectedShipment.id}</p>
                <p className="text-sm text-gray-600">
                  {selectedShipment.origin} → {selectedShipment.destination}
                </p>
                <p className="text-sm font-semibold text-red-600 mt-2">
                  Trọng lượng: {shipmentInfo?.weight}kg
                </p>
              </div>

              {/* Chọn Phương tiện */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🚗 Chọn Phương tiện
                </label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">-- Chọn xe --</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate} ({vehicle.type}) - Tải: {vehicle.capacity}kg
                    </option>
                  ))}
                </select>

                {vehicleInfo && shipmentInfo && (
                  <div className="mt-2 rounded-lg bg-gray-50 p-3 text-sm">
                    <p className="text-gray-700">
                      <span className="font-medium">Tải trọng xe:</span> {vehicleInfo.capacity}kg
                    </p>
                    <p className={`${shipmentInfo.weight > vehicleInfo.capacity
                        ? 'text-red-600 font-semibold'
                        : 'text-green-600'
                      }`}>
                      <span className="font-medium">Trọng lượng còn lại:</span>{' '}
                      {vehicleInfo.capacity - shipmentInfo.weight}kg
                      {shipmentInfo.weight > vehicleInfo.capacity && (
                        <span className="ml-2">⚠️ VƯỢT TẢI!</span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Chọn Tài xế */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  👨‍💼 Chọn Tài xế
                </label>
                <select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">-- Chọn tài xế --</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} ({driver.license_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Button Phân công */}
              <button
                onClick={handleAssignShipment}
                disabled={!selectedVehicle || !selectedDriver}
                className={`w-full rounded-lg px-4 py-3 font-semibold text-white transition ${!selectedVehicle || !selectedDriver
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                  }`}
              >
                ✅ Thực hiện Phân công
              </button>

              {/* Cảnh báo */}
              {vehicleInfo && shipmentInfo && shipmentInfo.weight > vehicleInfo.capacity && (
                <div className="rounded-lg bg-red-50 p-3 border border-red-200">
                  <p className="text-sm text-red-700 font-semibold">
                    ⚠️ Lưu ý: Trọng lượng đơn hàng vượt quá tải trọng xe!
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Hệ thống sẽ từ chối nếu bạn cố gắng phân công.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <p className="text-lg">📭 Chọn một đơn hàng từ bên trái</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">💡 Hướng dẫn:</span> Chọn một đơn hàng chờ phân công,
          sau đó chọn phương tiện và tài xế. Hệ thống sẽ kiểm tra tải trọng trước khi phân công.
          Nếu vượt quá tải trọng, sẽ có thông báo lỗi từ database.
        </p>
      </div>
    </div>
  )
}

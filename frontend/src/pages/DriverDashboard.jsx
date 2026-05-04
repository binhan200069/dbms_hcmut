import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import axios from 'axios'

const API_BASE = 'http://localhost:3001/api'

export default function DriverDashboard() {
    const [trips, setTrips] = useState([])
    const [selectedTrip, setSelectedTrip] = useState(null)
    const [newStatus, setNewStatus] = useState('')
    const [loading, setLoading] = useState(false)

    // Fetch trips khi component mount
    useEffect(() => {
        fetchTrips()
    }, [])

    // ============ API CALLS ============

    /**
     * Lấy danh sách chuyến xe của tài xế
     */
    const fetchTrips = async () => {
        setLoading(true)
        try {
            // API này sẽ lấy assignments của driver hiện tại
            const response = await axios.get(`${API_BASE}/assignments`)
            setTrips(response.data.data || [])
            if (response.data.data.length > 0) {
                setSelectedTrip(response.data.data[0])
                setNewStatus(response.data.data[0].status || 'pending')
            }
            toast.success('Tải danh sách chuyến xe thành công')
        } catch (error) {
            console.error('Error fetching trips:', error)
            const errorMessage = error.response?.data?.message || 'Không thể tải danh sách chuyến xe'
            toast.error(errorMessage, { duration: 5000 })
        } finally {
            setLoading(false)
        }
    }

    /**
     * Cập nhật trạng thái chuyến xe
     */
    const handleUpdateStatus = async () => {
        if (!selectedTrip || !newStatus) {
            toast.error('Vui lòng chọn trạng thái')
            return
        }

        try {
            await axios.put(`${API_BASE}/assignments/${selectedTrip.id}`, {
                status: newStatus,
            })

            // Cập nhật local state
            const updatedTrips = trips.map((trip) =>
                trip.id === selectedTrip.id ? { ...trip, status: newStatus } : trip
            )
            setTrips(updatedTrips)
            setSelectedTrip({ ...selectedTrip, status: newStatus })

            toast.success('✅ Cập nhật trạng thái thành công')
        } catch (error) {
            console.error('Error updating status:', error)
            const errorMessage = error.response?.data?.message || 'Lỗi khi cập nhật trạng thái'
            toast.error(errorMessage, { duration: 5000 })
        }
    }

    // ============ RENDER ============

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">🚚 Dashboard Tài xế</h1>
                <p className="mt-2 text-gray-600">Quản lý các chuyến xe của bạn</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Cột 1: Danh sách chuyến xe */}
                <div className="lg:col-span-2 rounded-lg bg-white p-6 shadow">
                    <h2 className="mb-4 text-xl font-bold text-gray-900">📍 Chuyến xe của tôi</h2>

                    {loading ? (
                        <p className="py-8 text-center text-gray-500">⏳ Đang tải...</p>
                    ) : trips.length === 0 ? (
                        <p className="py-8 text-center text-gray-500">📭 Bạn chưa có chuyến xe nào</p>
                    ) : (
                        <div className="space-y-3">
                            {trips.map((trip) => (
                                <button
                                    key={trip.id}
                                    onClick={() => {
                                        setSelectedTrip(trip)
                                        setNewStatus(trip.status)
                                    }}
                                    className={`w-full rounded-lg border-2 p-4 text-left transition ${selectedTrip?.id === trip.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                Chuyến #{trip.id}
                                            </p>
                                            <p className="mt-1 text-sm text-gray-600">
                                                Xe: {trip.vehicle_id}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Đơn hàng: {trip.shipment_id}
                                            </p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${trip.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                trip.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                    trip.status === 'in_delivery' ? 'bg-purple-100 text-purple-800' :
                                                        'bg-green-100 text-green-800'
                                            }`}>
                                            {trip.status === 'pending' ? '⏳ Chờ bắt đầu' :
                                                trip.status === 'in_progress' ? '🚗 Đang đi' :
                                                    trip.status === 'in_delivery' ? '📦 Đang giao' :
                                                        '✅ Hoàn thành'}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Cột 2: Form cập nhật trạng thái */}
                <div className="rounded-lg bg-white p-6 shadow h-fit">
                    <h2 className="mb-4 text-xl font-bold text-gray-900">🔄 Cập nhật Trạng thái</h2>

                    {selectedTrip ? (
                        <div className="space-y-4">
                            {/* Thông tin chuyến */}
                            <div className="rounded-lg bg-gray-50 p-3">
                                <p className="text-sm font-semibold text-gray-700">Chuyến #{selectedTrip.id}</p>
                                <p className="text-xs text-gray-600 mt-1">Trạng thái hiện tại:</p>
                                <p className="font-semibold text-blue-600">
                                    {selectedTrip.status === 'pending' ? '⏳ Chờ bắt đầu' :
                                        selectedTrip.status === 'in_progress' ? '🚗 Đang đi' :
                                            selectedTrip.status === 'in_delivery' ? '📦 Đang giao' :
                                                '✅ Hoàn thành'}
                                </p>
                            </div>

                            {/* Dropdown chọn trạng thái */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Chọn trạng thái mới
                                </label>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                >
                                    <option value="pending">⏳ Chờ bắt đầu</option>
                                    <option value="in_progress">🚗 Đang đi</option>
                                    <option value="in_delivery">📦 Đang giao</option>
                                    <option value="completed">✅ Hoàn thành</option>
                                </select>
                            </div>

                            {/* Button cập nhật */}
                            <button
                                onClick={handleUpdateStatus}
                                className="w-full rounded-lg bg-green-600 px-4 py-2 text-white font-semibold hover:bg-green-700 transition"
                            >
                                ✅ Cập nhật Trạng thái
                            </button>

                            {/* Info */}
                            <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
                                <p className="font-semibold">💡 Gợi ý:</p>
                                <p className="mt-1">Cập nhật trạng thái khi bạn bắt đầu giao hàng</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                            <p>📭 Chọn một chuyến từ bên trái</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Thông tin bổ sung */}
            <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                <p className="text-sm text-blue-800">
                    <span className="font-semibold">📍 Hướng dẫn cập nhật hành trình:</span> Chọn
                    một chuyến từ danh sách, cập nhật trạng thái của chuyến, sau đó bấm "Cập nhật Trạng thái".
                    Hệ thống sẽ lưu thay đổi và gửi thông báo cho khách hàng.
                </p>
            </div>
        </div>
    )
}

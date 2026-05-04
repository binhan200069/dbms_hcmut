import { useState } from 'react'
import toast from 'react-hot-toast'
import axios from 'axios'

const API_BASE = 'http://localhost:3001/api'

export default function CustomerDashboard() {
    const [orders, setOrders] = useState([])
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [formData, setFormData] = useState({
        origin: '',
        destination: '',
        items: '',
        weight: '',
        description: '',
    })
    const [loading, setLoading] = useState(false)

    // ============ API CALLS ============

    /**
     * Tạo đơn hàng mới
     */
    const handleCreateOrder = async () => {
        if (!formData.origin || !formData.destination || !formData.weight) {
            toast.error('Vui lòng điền đầy đủ thông tin')
            return
        }

        try {
            setLoading(true)

            const response = await axios.post(`${API_BASE}/shipments`, {
                origin: formData.origin,
                destination: formData.destination,
                weight: parseInt(formData.weight),
                items: formData.items || '1',
                description: formData.description,
                status: 'pending',
            })

            toast.success('✅ Tạo đơn hàng thành công! Đơn hàng của bạn: #' + response.data.data.id)
            setOrders([response.data.data, ...orders])

            // Reset form
            setFormData({
                origin: '',
                destination: '',
                items: '',
                weight: '',
                description: '',
            })
            setShowCreateForm(false)
        } catch (error) {
            console.error('Error creating order:', error)
            const errorMessage = error.response?.data?.message || 'Lỗi khi tạo đơn hàng'
            toast.error(errorMessage, { duration: 5000 })
        } finally {
            setLoading(false)
        }
    }

    // ============ RENDER ============

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="sm:flex sm:items-center sm:justify-between">
                <h1 className="text-3xl font-bold text-gray-900">🏢 Dashboard Khách hàng</h1>
            </div>

            {/* Thống kê */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                    <p className="text-sm text-gray-600">Tổng đơn hàng</p>
                    <p className="text-2xl font-bold text-blue-600">{orders.length}</p>
                </div>
                <div className="rounded-lg bg-green-50 p-4 border border-green-200">
                    <p className="text-sm text-gray-600">Đang giao</p>
                    <p className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'in_progress').length}</p>
                </div>
                <div className="rounded-lg bg-purple-50 p-4 border border-purple-200">
                    <p className="text-sm text-gray-600">Hoàn thành</p>
                    <p className="text-2xl font-bold text-purple-600">{orders.filter(o => o.status === 'completed').length}</p>
                </div>
            </div>

            {/* Button Tạo đơn */}
            <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="inline-block rounded-lg bg-green-600 px-6 py-2 text-white font-semibold hover:bg-green-700 transition"
            >
                ➕ Tạo Đơn hàng Mới
            </button>

            {/* Form Tạo đơn (Collapse) */}
            {showCreateForm && (
                <div className="rounded-lg bg-white p-6 shadow border border-gray-200">
                    <h2 className="mb-4 text-xl font-bold text-gray-900">➕ Tạo Đơn hàng Mới</h2>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Điểm đi */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                📍 Điểm đi
                            </label>
                            <input
                                type="text"
                                value={formData.origin}
                                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                                placeholder="VD: 123 Đường Nguyễn Huệ, Quận 1"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* Điểm đến */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                📍 Điểm đến
                            </label>
                            <input
                                type="text"
                                value={formData.destination}
                                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                placeholder="VD: 456 Đường Lê Lợi, Quận 5"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* Trọng lượng */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ⚖️ Trọng lượng (kg)
                            </label>
                            <input
                                type="number"
                                value={formData.weight}
                                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                placeholder="VD: 50"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* Số lượng */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                📦 Số lượng hàng
                            </label>
                            <input
                                type="number"
                                value={formData.items}
                                onChange={(e) => setFormData({ ...formData, items: e.target.value })}
                                placeholder="VD: 10"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        {/* Mô tả */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                📝 Mô tả hàng hóa
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Mô tả loại hàng hóa, tính chất, yêu cầu đặc biệt..."
                                rows="3"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={handleCreateOrder}
                            disabled={loading}
                            className={`flex-1 rounded-lg px-4 py-2 text-white font-semibold transition ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                                }`}
                        >
                            {loading ? 'Đang tạo...' : '✅ Tạo đơn hàng'}
                        </button>
                        <button
                            onClick={() => setShowCreateForm(false)}
                            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 transition"
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            )}

            {/* Danh sách đơn hàng */}
            <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-bold text-gray-900">📋 Đơn hàng của bạn</h2>

                {orders.length === 0 ? (
                    <p className="py-8 text-center text-gray-500">📭 Bạn chưa có đơn hàng nào</p>
                ) : (
                    <div className="space-y-3">
                        {orders.map((order) => (
                            <div key={order.id} className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900">#{order.id}</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {order.origin} → {order.destination}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Trọng lượng: {order.weight}kg
                                        </p>
                                    </div>
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                'bg-green-100 text-green-800'
                                        }`}>
                                        {order.status === 'pending' ? '⏳ Chờ phân công' :
                                            order.status === 'in_progress' ? '🚚 Đang giao' :
                                                '✅ Hoàn thành'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import axios from 'axios'

// Base URL kết nối tới Backend
const API_BASE = 'http://localhost:5000/api'

export default function WarehousePage() {
  const [warehouses, setWarehouses] = useState([])
  const [inventoryMap, setInventoryMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchInitialData()
  }, [])

  /**
   * Lấy danh sách kho và hàng hóa trong từng kho
   */
  const fetchInitialData = async () => {
    setLoading(true)
    try {
      // 1. Lấy danh sách tất cả các kho
      const resWarehouses = await axios.get(`${API_BASE}/warehouses`)
      const warehouseList = resWarehouses.data.data || resWarehouses.data || []
      setWarehouses(warehouseList)

      // 2. Duyệt qua từng kho để lấy danh sách hàng hóa tương ứng
      const map = {}
      await Promise.all(
        warehouseList.map(async (wh) => {
          try {
            const resItems = await axios.get(`${API_BASE}/warehouses/${wh.WarehouseId}/items`)
            map[wh.WarehouseId] = resItems.data.data || resItems.data || []
          } catch (err) {
            console.error(`Lỗi tải hàng hóa cho kho ${wh.WarehouseId}:`, err)
            map[wh.WarehouseId] = []
          }
        })
      )
      setInventoryMap(map)
      toast.success('Dữ liệu kho đã được cập nhật!')
    } catch (error) {
      console.error('Error fetching warehouse data:', error)
      toast.error(error.response?.data?.message || 'Không thể kết nối đến máy chủ')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Bộ lọc: Tìm kiếm theo tên kho hoặc mô tả hàng hóa
   */
  const filteredWarehouses = warehouses.filter((wh) => {
    const searchLower = searchTerm.toLowerCase()
    const matchWarehouseName = wh.WarehouseName?.toLowerCase().includes(searchLower)
    
    const itemsInWh = inventoryMap[wh.WarehouseId] || []
    const matchItemDescription = itemsInWh.some(item => 
        item.Description?.toLowerCase().includes(searchLower)
    )

    return matchWarehouseName || matchItemDescription
  })

  return (
    <div className="space-y-6">
      {/* Header Trang */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <span className="p-2 bg-indigo-100 rounded-lg text-indigo-600">📦</span>
            Warehouse Inventory
          </h1>
          <p className="text-slate-500 text-sm mt-1">Tra cứu tồn kho thực tế tại các chi nhánh</p>
        </div>
        <button 
          onClick={fetchInitialData}
          disabled={loading}
          className="btn btn-secondary text-xs flex items-center gap-2"
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Data'}
        </button>
      </div>

      {/* Thanh tìm kiếm */}
      <div className="relative">
        <input
          type="text"
          placeholder="Tìm theo tên kho hoặc mô tả hàng hóa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input pl-10 py-2.5 w-full shadow-sm"
        />
        <span className="absolute left-3 top-3 text-slate-400">🔍</span>
      </div>

      {/* Trạng thái Loading */}
      {loading ? (
        <div className="card p-20 text-center text-slate-500">
          <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-indigo-600 rounded-full mb-4"></div>
          <p className="font-medium">Đang đồng bộ dữ liệu hệ thống...</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {filteredWarehouses.length > 0 ? (
            filteredWarehouses.map((wh) => (
              <div key={wh.WarehouseId} className="card overflow-hidden border-l-4 border-l-indigo-500 shadow-md">
                {/* Thông tin đầu kho */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">{wh.WarehouseName}</h2>
                    <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-widest mt-0.5">
                      Type: {wh.WarehouseType} | Capacity: {wh.Capacity} m³
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                      {inventoryMap[wh.WarehouseId]?.length || 0} SKUs
                    </span>
                  </div>
                </div>

                {/* Bảng hàng hóa */}
                <div className="overflow-x-auto">
                  <table className="data-table w-full">
                    <thead className="bg-white">
                      <tr>
                        <th className="w-24">ID</th>
                        <th>Description</th>
                        <th>Unit</th>
                        <th>Weight</th>
                        <th className="text-right">Stock Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryMap[wh.WarehouseId]?.length > 0 ? (
                        inventoryMap[wh.WarehouseId].map((item) => (
                          <tr key={item.ItemId} className="hover:bg-indigo-50/40 transition-colors">
                            <td className="font-mono text-xs text-slate-400">#{item.ItemId}</td>
                            <td className="font-semibold text-slate-700">
                              {item.Description || "N/A"}
                            </td>
                            <td className="text-slate-500">{item.Unit}</td>
                            <td className="text-slate-500">{item.Weight} kg</td>
                            <td className={`text-right font-bold ${item.Quantity < 10 ? 'text-red-500' : 'text-slate-800'}`}>
                              {item.Quantity?.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center py-10 text-slate-400 italic bg-slate-50/30">
                            Không có hàng hóa trong kho này
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <div className="card p-16 text-center border-dashed border-2 border-slate-200">
              <p className="text-slate-400">Không tìm thấy dữ liệu phù hợp với từ khóa "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
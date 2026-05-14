/**
 * CreateOrder.jsx — Tạo đơn hàng mới (CUSTOMER)
 * Bước 1: Thông tin đơn → Bước 2: Thêm hàng hóa
 */
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Package, MapPin, Plus, Trash2, Loader2,
  CheckCircle, ShoppingCart, ArrowRight, ArrowLeft, X,
} from 'lucide-react';
import orderApi  from '../../api/orderApi';
import lookupApi from '../../api/lookupApi';

const normalize = (r) => (Array.isArray(r) ? r : r?.data ?? []);

const ORDER_STATUS_CONFIG = [
  'Processing',
  'Error',
  'Completed',
  'Pending',
  'Canceled',
]

const PAYMENT_CONFIG = [
  'COD',
  'Net15',
  'EOM',
  'Net60',
  'Prepaid'
]


export default function CreateOrder() {
  const [step, setStep]       = useState(1); // 1=thông tin, 2=hàng hóa, 3=xong
  const [submitting, setSub]  = useState(false);
  const [locations, setLoc]   = useState([]);
  const [items,     setItems] = useState([]);
  const [createdOrderId, setCreatedId] = useState(null);

  const [form, setForm] = useState({
    orderDate:        new Date().toISOString().split('T')[0],
    orderStatus:      ORDER_STATUS_CONFIG[0] || '',
    pickupLocation:   '',
    freightFactor:    '1.0',
    freightCost:      '5000',
    deliveryLocation: '',
    deliveryDate:     '',
    paymentTerm: '' || PAYMENT_CONFIG[0],
    staffId: '', // random staff in planning deparment
    customerId: '',
  });

  // Danh sách hàng thêm vào đơn
  const [cart, setCart] = useState([]);
  const [itemForm, setItemForm] = useState({ itemId: '', quantity: 1 });

  useEffect(() => {
    Promise.all([lookupApi.getLocations(), lookupApi.getItems()]).then(([l, it]) => {
      setLoc(normalize(l));
      setItems(normalize(it));
    }).catch(() => {});
  }, []);

  const handleFormChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Bước 1: Tạo đơn
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!form.pickupLocation || !form.deliveryLocation) {
      toast.error('Please choose Pick up Location');
      return;
    }
    if (form.pickupLocation === form.deliveryLocation) {
      toast.error('Pick up Location and Delivery Location must be different');
      return;
    }
    setSub(true);
    try {
      const res = await orderApi.create({
        pickupLocation:   Number(form.pickupLocation),
        deliveryLocation: Number(form.deliveryLocation),
        freightFactor:    Number(form.freightFactor) || 1,
        freightCost:      Number(form.freightCost) || 5000,
      });
      const order = res?.data ?? res;
      setCreatedId(order?.OrderId ?? order?.orderId);
      toast.success('✅ Đã tạo đơn hàng! Bây giờ thêm hàng hóa vào đơn.');
      setStep(2);
    } catch (err) {
      toast.error(err.message || 'Không thể tạo đơn hàng');
    } finally {
      setSub(false);
    }
  };

  const handleChooseDate = (e) => {
    
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    const today = form.orderDate;
    if (value < today) {
      toast.error('Delivery Date must be greater than order date')
    }
  };

  // Bước 2: Thêm item
  const handleAddItem = async () => {
    if (!itemForm.itemId) { toast.error('Chọn mặt hàng'); return; }
    if (!createdOrderId)  { toast.error('Chưa có mã đơn hàng'); return; }
    setSub(true);
    try {
      await orderApi.addItem(createdOrderId, {
        itemId: Number(itemForm.itemId),
        orderQuantity: Number(itemForm.quantity),
      });
      const item = items.find((i) => String(i.ItemId) === String(itemForm.itemId));
      setCart((c) => [...c, { ...item, qty: itemForm.quantity }]);
      setItemForm({ itemId: '', quantity: 1 });
      toast.success('✅ Đã thêm hàng vào đơn');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể thêm hàng';
      toast.error(errorMessage);

      console.error("Lỗi khi thêm item:", err);
    } finally {
      setSub(false);
    }
  };

  const handleFinish = () => {
    setStep(3);
    toast.success(`🎉 Đơn hàng #${createdOrderId} đã hoàn tất!`);
  };

  const handleReset = () => {
    setStep(1); setCreatedId(null); setCart([]);
    setForm({ pickupLocation: '', deliveryLocation: '', freightFactor: '1.0', freightCost: '0' });
  };

  // ── Step 3: Success ───────────────────────────────────────────────
  if (step === 3) return (
    <div className="max-w-lg mx-auto">
      <div className="card p-10 flex flex-col items-center gap-5 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle size={40} className="text-emerald-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Đặt hàng thành công!</h2>
          <p className="text-slate-500 mt-2">
            Đơn hàng <strong className="text-indigo-600">#{createdOrderId}</strong> đã được tạo với {cart.length} mặt hàng.
          </p>
        </div>
        <div className="flex gap-3 w-full">
          <button onClick={handleReset} className="btn btn-primary flex-1 justify-center">
            <Plus size={15} />Tạo đơn mới
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
          <ShoppingCart size={24} className="text-emerald-600" />
          Create New Order
        </h1>
        <p className="text-slate-500 text-sm mt-1">Fill in transport and product information</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-3">
        {[{ n: 1, label: 'Fill in Information' }, { n: 2, label: 'Hàng hóa' }].map(({ n, label }) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              step >= n ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
            }`}>{n}</div>
            <span className={`text-sm font-medium hidden sm:block ${step >= n ? 'text-slate-700' : 'text-slate-400'}`}>{label}</span>
            {n < 2 && <ArrowRight size={16} className="text-slate-300 mx-1" />}
          </div>
        ))}
      </div>

      {/* ── STEP 1: Order info ──────────────────────────────────────── */}
      {step === 1 && (
        <div className="card p-6">
          <h2 className="font-bold text-slate-800 mb-5">Shopping Form</h2>
          <form onSubmit={handleCreateOrder} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Order Date: {form.orderDate}</label>
            </div>
            <div className="form-group">
              <label className="form-label">Delivery Date</label>
              <input
                className="form-input"
                type="date"
                name='deliveryDate'
                value={form.deliveryDate}
                min={form.orderDate}
                onChange={handleChooseDate}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <MapPin size={13} className="inline mr-1 text-emerald-500" />
                Pick Up Address <span className="text-red-500">*</span>
              </label>
              <select name="pickupLocation" className="form-select" value={form.pickupLocation} onChange={handleFormChange}>
                <option value="">-- From --</option>
                {locations.map((l) => (
                  <option key={l.LocationId} value={l.LocationId}>{l.LocationName} — {l.Address}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">
                <MapPin size={13} className="inline mr-1 text-red-500" />
                Delivery Address <span className="text-red-500">*</span>
              </label>
              <select name="deliveryLocation" className="form-select" value={form.deliveryLocation} onChange={handleFormChange}>
                <option value="">-- To --</option>
                {locations.map((l) => (
                  <option key={l.LocationId} value={l.LocationId}>{l.LocationName} — {l.Address}</option>
                ))}
              </select>
            </div>

            <div className='form-group'>
              <label className="form-label">Payment Term</label>
              <div className="flex gap-4 mt-1">
                {PAYMENT_CONFIG.map((term) => (
                  <label key={term} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentTerm"
                      value={term}
                      checked={form.paymentTerm === term}
                      onChange={handleFormChange}
                      className="accent-indigo-600"
                    />
                    <span className="text-sm text-slate-700">{term}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Hệ số vận chuyển</label>
                <input type="number" name="freightFactor" className="form-input" step="0.1" min="1" value={form.freightFactor} onChange={handleFormChange} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Chi phí vận chuyển (₫)</label>
                <input type="number" name="freightCost" className="form-input" min="0" value={form.freightCost} onChange={handleFormChange} />
              </div>
            </div>
            <button type="submit" disabled={submitting} className="btn btn-primary w-full justify-center py-3">
              {submitting ? <><Loader2 size={16} className="animate-spin" />Đang tạo...</> : <>Tiếp theo <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
      )}

      {/* ── STEP 2: Add items ───────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={16} className="text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-700">Đơn hàng #{createdOrderId} đã tạo</span>
            </div>
            <p className="text-xs text-slate-500">Thêm ít nhất một mặt hàng vào đơn rồi bấm Hoàn tất.</p>
          </div>

          {/* Add item form */}
          <div className="card p-5">
            <h3 className="font-bold text-slate-800 mb-4">Thêm mặt hàng</h3>
            <div className="flex gap-3 flex-wrap">
              <select
                className="form-select flex-1 min-w-[180px]"
                value={itemForm.itemId}
                onChange={(e) => setItemForm((f) => ({ ...f, itemId: e.target.value }))}
              >
                <option value="">-- Chọn mặt hàng --</option>
                {items.map((it) => (
                  <option key={it.ItemId} value={it.ItemId}>
                    {it.Description} ({it.Weight}kg/{it.Unit})
                  </option>
                ))}
              </select>
              <input
                type="number" min="1" className="form-input w-24"
                value={itemForm.quantity}
                onChange={(e) => setItemForm((f) => ({ ...f, quantity: e.target.value }))}
                placeholder="SL"
              />
              <button onClick={handleAddItem} disabled={submitting} className="btn btn-primary shrink-0">
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                Thêm
              </button>
            </div>
          </div>

          {/* Cart */}
          {cart.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">Giỏ hàng ({cart.length} mặt hàng)</h3>
              </div>
              <table className="data-table">
                <thead><tr><th>Mặt hàng</th><th>Khối lượng</th><th>SL</th><th></th></tr></thead>
                <tbody>
                  {cart.map((c, i) => (
                    <tr key={i}>
                      <td className="font-medium text-slate-800">{c.Description}</td>
                      <td className="text-slate-500">{c.Weight} kg/{c.Unit}</td>
                      <td className="font-bold">{c.qty}</td>
                      <td>
                        <button onClick={() => setCart((p) => p.filter((_, j) => j !== i))} className="btn-icon btn-icon-danger">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn btn-secondary">
              <ArrowLeft size={15} />Quay lại
            </button>
            <button onClick={handleFinish} disabled={cart.length === 0} className="btn btn-primary flex-1 justify-center">
              <CheckCircle size={15} />Hoàn tất đơn hàng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

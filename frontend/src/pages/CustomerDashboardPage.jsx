import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import CreateOrderForm from "../components/orders/CreateOrderForm";
import OrdersTable from "../components/orders/OrdersTable";
import StatsCards from "../components/orders/StatsCards";
import {
    createOrder,
    deleteOrder,
    fetchCustomerOrders,
    fetchCustomerStats,
    updateOrder
} from "../services/orderApi";

function CustomerDashboardPage() {
    const customerId = 1;

    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({
        CustomerId: customerId,
        TotalOrders: 0,
        TotalFreightCost: 0
    });
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [loadingStats, setLoadingStats] = useState(false);

    const [editingOrderId, setEditingOrderId] = useState(null);
    const [editPickupLocation, setEditPickupLocation] = useState("");
    const [editDeliveryLocation, setEditDeliveryLocation] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);
    const [deletingOrderId, setDeletingOrderId] = useState(null);

    async function loadOrders() {
        try {
            setLoadingOrders(true);
            const data = await fetchCustomerOrders(customerId, statusFilter);
            setOrders(data);
        } catch (err) {
            toast.error(err.response?.data?.message || "Khong tai duoc danh sach don hang.");
        } finally {
            setLoadingOrders(false);
        }
    }

    async function loadStats() {
        try {
            setLoadingStats(true);
            const data = await fetchCustomerStats(customerId);
            setStats(data);
        } catch (err) {
            toast.error(err.response?.data?.message || "Khong tai duoc thong ke khach hang.");
        } finally {
            setLoadingStats(false);
        }
    }

    useEffect(() => {
        loadOrders();
    }, [statusFilter]);

    useEffect(() => {
        loadStats();
    }, []);

    async function handleCreateOrder(values) {
        try {
            await createOrder({
                customerId,
                pickupLocation: values.pickupLocation,
                deliveryLocation: values.deliveryLocation,
                freightCost: values.freightCost
            });
            toast.success("Tao don hang thanh cong!");
            await Promise.all([loadOrders(), loadStats()]);
        } catch (err) {
            toast.error(err.response?.data?.message || "Khong the tao don hang.");
        }
    }

    function handleStartEdit(order) {
        setEditingOrderId(order.OrderId);
        setEditPickupLocation(order.PickupLocation);
        setEditDeliveryLocation(order.DeliveryLocation);
    }

    function handleCancelEdit() {
        setEditingOrderId(null);
        setEditPickupLocation("");
        setEditDeliveryLocation("");
    }

    async function handleSaveEdit() {
        if (!editingOrderId) {
            return;
        }

        try {
            setSavingEdit(true);
            await updateOrder(editingOrderId, {
                pickupLocation: editPickupLocation.trim(),
                deliveryLocation: editDeliveryLocation.trim()
            });
            toast.success("Cap nhat don hang thanh cong!");
            handleCancelEdit();
            await loadOrders();
        } catch (err) {
            toast.error(err.response?.data?.message || "Khong the cap nhat don hang.");
        } finally {
            setSavingEdit(false);
        }
    }

    async function handleDeleteOrder(orderId) {
        const confirmed = window.confirm("Ban co chac muon xoa don hang nay?");
        if (!confirmed) {
            return;
        }

        try {
            setDeletingOrderId(orderId);
            await deleteOrder(orderId);
            toast.success("Xoa don hang thanh cong!");
            await Promise.all([loadOrders(), loadStats()]);
        } catch (err) {
            toast.error(err.response?.data?.message || "Khong the xoa don hang.");
        } finally {
            setDeletingOrderId(null);
        }
    }

    return (
        <div className="dashboard-shell">
            <Toaster position="top-right" />

            <div className="container">
                <h1 className="page-title">Logistics Customer Dashboard</h1>

                <StatsCards
                    customerId={customerId}
                    stats={stats}
                    loadingStats={loadingStats}
                />

                <CreateOrderForm onSubmit={handleCreateOrder} />

                <OrdersTable
                    orders={orders}
                    loadingOrders={loadingOrders}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    editingOrderId={editingOrderId}
                    editPickupLocation={editPickupLocation}
                    setEditPickupLocation={setEditPickupLocation}
                    editDeliveryLocation={editDeliveryLocation}
                    setEditDeliveryLocation={setEditDeliveryLocation}
                    savingEdit={savingEdit}
                    deletingOrderId={deletingOrderId}
                    onStartEdit={handleStartEdit}
                    onCancelEdit={handleCancelEdit}
                    onSaveEdit={handleSaveEdit}
                    onDeleteOrder={handleDeleteOrder}
                />
            </div>
        </div>
    );
}

export default CustomerDashboardPage;

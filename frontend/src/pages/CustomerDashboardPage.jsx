import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import CreateOrderForm from "../components/orders/CreateOrderForm";
import OrdersTable from "../components/orders/OrdersTable";
import StatsCards from "../components/orders/StatsCards";
import { useAuth } from "../context/AuthContext";
import "../styles/dashboard.css";
import {
    createOrder,
    deleteOrder,
    fetchCustomerOrders,
    fetchCustomerStats,
    updateOrder
} from "../services/orderApi";

const VIEW_CONFIG = {
    CUSTOMER: {
        pageTitle: "Customer Order Management",
        allowedStatuses: ["ALL", "Pending", "Processing", "Delivered", "Cancelled"],
        allowCreate: true,
        allowMutate: true
    },
    DRIVER: {
        pageTitle: "Driver Order Board",
        allowedStatuses: ["ALL", "Processing", "Delivered"],
        allowCreate: false,
        allowMutate: false
    },
    ADMIN: {
        pageTitle: "Admin Order Overview",
        allowedStatuses: ["ALL", "Pending", "Processing", "Delivered", "Cancelled"],
        allowCreate: false,
        allowMutate: false
    }
};

const MOCK_CUSTOMER_IDS = [1, 2, 3, 4, 5];

function normalizeFilterByRole(filterValue, viewRole) {
    const config = VIEW_CONFIG[viewRole] || VIEW_CONFIG.CUSTOMER;
    if (config.allowedStatuses.includes(filterValue)) {
        return filterValue;
    }

    return config.allowedStatuses[0];
}

function buildRoleStats(role, userId, sourceOrders) {
    const totalOrders = sourceOrders.length;
    const totalFreightCost = sourceOrders.reduce(
        (sum, order) => sum + Number(order.FreightCost || 0),
        0
    );

    return {
        UserId: userId,
        TotalOrders: totalOrders,
        TotalFreightCost: totalFreightCost,
        Role: role
    };
}

async function fetchOrdersForCustomerIds(customerIds, statusFilter) {
    const orderLists = await Promise.all(
        customerIds.map((id) => fetchCustomerOrders(id, statusFilter))
    );

    return orderLists.flat();
}

function CustomerDashboardPage({ viewRole = "CUSTOMER", helperMessage = "" }) {
    const { currentUser } = useAuth();
    const resolvedConfig = VIEW_CONFIG[viewRole] || VIEW_CONFIG.CUSTOMER;
    const isCustomerView = viewRole === "CUSTOMER";
    const isDriverView = viewRole === "DRIVER";
    const activeCustomerId = currentUser.id;

    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({
        UserId: currentUser.id,
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

    useEffect(() => {
        setStatusFilter((prev) => normalizeFilterByRole(prev, viewRole));
    }, [viewRole]);

    async function loadOrders() {
        try {
            setLoadingOrders(true);

            const resolvedStatusFilter = normalizeFilterByRole(statusFilter, viewRole);
            const customerIds = isCustomerView ? [activeCustomerId] : MOCK_CUSTOMER_IDS;

            let data = await fetchOrdersForCustomerIds(customerIds, resolvedStatusFilter);

            if (isDriverView) {
                data = data.filter(
                    (order) => order.OrderStatus === "Processing" || order.OrderStatus === "Delivered"
                );
            }

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

            if (isCustomerView) {
                const data = await fetchCustomerStats(activeCustomerId);
                setStats({
                    ...data,
                    UserId: currentUser.id,
                    Role: viewRole
                });
                return;
            }

            let sourceOrders = await fetchOrdersForCustomerIds(MOCK_CUSTOMER_IDS, "ALL");

            if (isDriverView) {
                sourceOrders = sourceOrders.filter(
                    (order) => order.OrderStatus === "Processing" || order.OrderStatus === "Delivered"
                );
            }

            const data = buildRoleStats(viewRole, currentUser.id, sourceOrders);
            setStats(data);
        } catch (err) {
            toast.error(err.response?.data?.message || "Khong tai duoc thong ke khach hang.");
        } finally {
            setLoadingStats(false);
        }
    }

    useEffect(() => {
        loadOrders();
    }, [statusFilter, activeCustomerId, viewRole]);

    useEffect(() => {
        loadStats();
    }, [activeCustomerId, viewRole]);

    async function handleCreateOrder(values) {
        if (!resolvedConfig.allowCreate) {
            return;
        }

        try {
            await createOrder({
                customerId: activeCustomerId,
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
        if (!resolvedConfig.allowMutate) {
            return;
        }

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
        if (!resolvedConfig.allowMutate) {
            return;
        }

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
                <h1 className="page-title">{resolvedConfig.pageTitle} - {currentUser.name}</h1>

                {helperMessage ? (
                    <p style={{ margin: "0 0 16px 0", color: "#475569" }}>{helperMessage}</p>
                ) : null}

                <StatsCards
                    role={viewRole}
                    userId={currentUser.id}
                    stats={stats}
                    loadingStats={loadingStats}
                />

                {resolvedConfig.allowCreate ? (
                    <CreateOrderForm onSubmit={handleCreateOrder} />
                ) : null}

                <OrdersTable
                    viewRole={viewRole}
                    allowedStatuses={resolvedConfig.allowedStatuses}
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

import axios from "axios";

const ORDER_API_BASE_URL =
    import.meta.env.VITE_ORDER_API_BASE_URL || "http://localhost:5000/api/orders";

const orderApi = axios.create({
    baseURL: ORDER_API_BASE_URL
});

export async function fetchCustomerOrders(customerId, status) {
    const response = await orderApi.get("/", {
        params: {
            customerId,
            status
        }
    });

    return response.data?.data || [];
}

export async function fetchCustomerStats(customerId) {
    const response = await orderApi.get("/stats", {
        params: { customerId }
    });

    return (
        response.data?.data || {
            CustomerId: customerId,
            TotalOrders: 0,
            TotalFreightCost: 0
        }
    );
}

export async function createOrder(payload) {
    const response = await orderApi.post("/", payload);
    return response.data;
}

export async function updateOrder(orderId, payload) {
    const response = await orderApi.put(`/${orderId}`, payload);
    return response.data;
}

export async function deleteOrder(orderId) {
    const response = await orderApi.delete(`/${orderId}`);
    return response.data;
}

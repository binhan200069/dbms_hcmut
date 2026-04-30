import axios from "axios";

const USER_API_BASE_URL = import.meta.env.VITE_USER_API_BASE_URL || "http://localhost:5000/api/users";

const userApi = axios.create({
    baseURL: USER_API_BASE_URL
});

export async function fetchUsers() {
    const response = await userApi.get("/");
    return response.data?.data || [];
}

export async function fetchUserById(userId) {
    const response = await userApi.get(`/${userId}`);
    return response.data?.data || null;
}

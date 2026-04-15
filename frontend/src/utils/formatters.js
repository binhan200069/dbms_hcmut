export function formatDateTime(value) {
    const dt = new Date(value);

    if (Number.isNaN(dt.getTime())) {
        return String(value || "");
    }

    return dt.toLocaleString("vi-VN");
}

export function formatCurrencyVND(value) {
    const formatter = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    });

    return formatter.format(Number(value || 0));
}

export function getStatusBadgeClass(status) {
    if (status === "Pending") {
        return "badge badge-pending";
    }

    if (status === "Processing") {
        return "badge badge-processing";
    }

    if (status === "Delivered") {
        return "badge badge-delivered";
    }

    if (status === "Cancelled") {
        return "badge badge-cancelled";
    }

    return "badge badge-default";
}

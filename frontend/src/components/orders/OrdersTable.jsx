import { formatCurrencyVND, formatDateTime, getStatusBadgeClass } from "../../utils/formatters";

function OrdersTable({
    viewRole,
    allowedStatuses,
    orders,
    loadingOrders,
    statusFilter,
    setStatusFilter,
    editingOrderId,
    editPickupLocation,
    setEditPickupLocation,
    editDeliveryLocation,
    setEditDeliveryLocation,
    savingEdit,
    deletingOrderId,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onDeleteOrder
}) {
    const canMutate = viewRole === "CUSTOMER";
    const filterOptions = (allowedStatuses || [
        "ALL",
        "Pending",
        "Processing",
        "Delivered",
        "Cancelled"
    ]).map((status) => ({ value: status, label: status }));

    return (
        <section className="card">
            <div className="table-toolbar">
                <h2 className="section-title">Order List</h2>
                <div className="filter-row">
                    <label className="field-label">Loc theo trang thai:</label>
                    <select
                        className="field-input"
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                    >
                        {filterOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="table-wrap">
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>OrderId</th>
                            <th>OrderDate</th>
                            <th>Status</th>
                            <th>Pickup</th>
                            <th>Delivery</th>
                            <th className="align-right">FreightCost</th>
                            <th className="align-center">{canMutate ? "Actions" : "Scope"}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loadingOrders && (
                            <tr>
                                <td colSpan={7} className="empty-cell">
                                    Dang tai du lieu...
                                </td>
                            </tr>
                        )}

                        {!loadingOrders && orders.length === 0 && (
                            <tr>
                                <td colSpan={7} className="empty-cell">
                                    Khong co don hang nao.
                                </td>
                            </tr>
                        )}

                        {!loadingOrders &&
                            orders.map((order) => {
                                const isEditing = editingOrderId === order.OrderId;
                                const canMutateRow = canMutate && order.OrderStatus === "Pending";

                                return (
                                    <tr key={order.OrderId}>
                                        <td>{order.OrderId}</td>
                                        <td>{formatDateTime(order.OrderDate)}</td>
                                        <td>
                                            <span className={getStatusBadgeClass(order.OrderStatus)}>
                                                {order.OrderStatus}
                                            </span>
                                        </td>
                                        <td>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    className="field-input"
                                                    value={editPickupLocation}
                                                    onChange={(event) => setEditPickupLocation(event.target.value)}
                                                />
                                            ) : (
                                                order.PickupLocation
                                            )}
                                        </td>
                                        <td>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    className="field-input"
                                                    value={editDeliveryLocation}
                                                    onChange={(event) => setEditDeliveryLocation(event.target.value)}
                                                />
                                            ) : (
                                                order.DeliveryLocation
                                            )}
                                        </td>
                                        <td className="align-right">{formatCurrencyVND(order.FreightCost)}</td>
                                        <td className="align-center">
                                            {canMutate ? (
                                                isEditing ? (
                                                    <div className="action-row">
                                                        <button
                                                            type="button"
                                                            className="btn btn-success"
                                                            onClick={onSaveEdit}
                                                            disabled={savingEdit}
                                                        >
                                                            {savingEdit ? "Dang luu..." : "Luu"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-secondary"
                                                            onClick={onCancelEdit}
                                                        >
                                                            Huy
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="action-row">
                                                        <button
                                                            type="button"
                                                            className="btn btn-warning"
                                                            onClick={() => onStartEdit(order)}
                                                            disabled={!canMutateRow}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-danger"
                                                            onClick={() => onDeleteOrder(order.OrderId)}
                                                            disabled={!canMutateRow || deletingOrderId === order.OrderId}
                                                        >
                                                            {deletingOrderId === order.OrderId ? "Dang xoa..." : "Delete"}
                                                        </button>
                                                    </div>
                                                )
                                            ) : (
                                                <span className="badge badge-default">
                                                    {viewRole === "DRIVER" ? "Read only" : "Admin overview"}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default OrdersTable;

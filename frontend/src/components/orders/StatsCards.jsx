import { formatCurrencyVND } from "../../utils/formatters";

function StatsCards({ customerId, stats, loadingStats }) {
    return (
        <section className="stats-grid">
            <div className="card">
                <p className="card-label">Customer ID</p>
                <p className="card-value">{customerId}</p>
            </div>

            <div className="card">
                <p className="card-label">Total Orders</p>
                <p className="card-value">
                    {loadingStats ? "Dang tai..." : Number(stats.TotalOrders || 0)}
                </p>
            </div>

            <div className="card">
                <p className="card-label">Total Spent</p>
                <p className="card-value">
                    {loadingStats ? "Dang tai..." : formatCurrencyVND(stats.TotalFreightCost)}
                </p>
            </div>
        </section>
    );
}

export default StatsCards;

import { formatCurrencyVND } from "../../utils/formatters";

const ROLE_CARD_CONTENT = {
    CUSTOMER: {
        idLabel: "Customer ID",
        totalLabel: "Total Orders",
        amountLabel: "Total Spent"
    },
    DRIVER: {
        idLabel: "Driver ID",
        totalLabel: "Assigned Orders",
        amountLabel: "Freight In Charge"
    },
    ADMIN: {
        idLabel: "Admin ID",
        totalLabel: "System Orders",
        amountLabel: "System Freight Value"
    }
};

function StatsCards({ role = "CUSTOMER", userId, stats, loadingStats }) {
    const cardContent = ROLE_CARD_CONTENT[role] || ROLE_CARD_CONTENT.CUSTOMER;

    return (
        <section className="stats-grid">
            <div className="card">
                <p className="card-label">{cardContent.idLabel}</p>
                <p className="card-value">{userId}</p>
            </div>

            <div className="card">
                <p className="card-label">{cardContent.totalLabel}</p>
                <p className="card-value">
                    {loadingStats ? "Dang tai..." : Number(stats.TotalOrders || 0)}
                </p>
            </div>

            <div className="card">
                <p className="card-label">{cardContent.amountLabel}</p>
                <p className="card-value">
                    {loadingStats ? "Dang tai..." : formatCurrencyVND(stats.TotalFreightCost)}
                </p>
            </div>
        </section>
    );
}

export default StatsCards;

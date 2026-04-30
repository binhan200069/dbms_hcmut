import { formatCurrencyVND } from "../../utils/formatters";

const ROLE_CARD_CONTENT = {
    CUSTOMER: {
        idLabel: "Customer ID",
        customerTypeLabel: "Customer Type",
        totalLabel: "Total Orders",
        paymentTermLable: "Payment Term",
        creditLimit: "Credit Limit",
        amountLabel: "Total Spent"
    },
    DRIVER: {
        idLabel: "Driver ID",
        totalLabel: "Assigned Orders",
        amountLabel: "Freight In Charge"
    },
    ADMIN: {
        idLabel: "Admin ID",
        position: "Position",
        totalLabel: "System Orders",
        amountLabel: "System Freight Value"
    }
};

function StatsCards({ role = "CUSTOMER", userId, customerType, stats, loadingStats}) {
    const cardContent = ROLE_CARD_CONTENT[role] || ROLE_CARD_CONTENT.CUSTOMER;

    return (
        <section className="stats-grid">
            <div className="card card-row">
                <div className="stat-pair">
                    <p className="card-label">{cardContent.idLabel}</p>
                    <p className="card-value">{userId}</p>
                </div>
                <div className="stat-pair">
                    <p className="card-label">{cardContent.customerTypeLabel}</p>
                    <p className="card-value">{customerType}</p>
                </div>
            </div>
            <div className="card card-row">
                <div className="stat-pair">
                    <p className="card-label">{cardContent.paymentTermLable}</p>
                    <p className="card-value">{stats.PaymentTerm || "N/A"}</p>
                </div>
                <div className="stat-pair">
                    <p className="card-label">{cardContent.totalLabel}</p>
                    <p className="card-value">{loadingStats ? "Dang tai..." : Number(stats.TotalOrders || 0)}</p>
                </div>
            </div>

            <div className="card card-row">
                <div className="stat-pair">
                    <p className="card-label">{cardContent.creditLimit}</p>
                    <p className="card-value">{loadingStats ? "Dang tai..." : formatCurrencyVND(stats.CreditLimit)}</p>
                </div>
                <div className="stat-pair">
                    <p className="card-label">{cardContent.amountLabel}</p>
                    <p className="card-value">
                        {loadingStats ? "Dang tai..." : formatCurrencyVND(stats.TotalFreightCost)}
                    </p>
                </div>
            </div>
        </section>
    );
}

export default StatsCards;

-- Cập nhật stored procedure sp_DashboardStats để thêm AvailableVehicles
USE logistics_db;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_DashboardStats$$

CREATE PROCEDURE sp_DashboardStats()
BEGIN
    SELECT
        (SELECT COUNT(*) FROM `ORDER`) AS TotalOrders,
        (SELECT COUNT(*) FROM `ORDER` WHERE OrderStatus = 'Chờ xử lý') AS PendingOrders,
        (SELECT COUNT(*) FROM VEHICLE WHERE LicenseExpiryDate >= CURDATE()) AS AvailableVehicles,
        (SELECT COUNT(*) FROM SHIPMENT) AS TotalShipments,
        (SELECT COUNT(*) FROM ASSIGNMENT) AS TotalAssignments,
        (SELECT COUNT(*) FROM DRIVER) AS TotalDrivers,
        (SELECT COALESCE(SUM(FreightCost), 0) FROM `ORDER` WHERE OrderStatus = 'Đã giao') AS TotalRevenue;
END$$

DELIMITER ;

-- Test procedure
CALL sp_DashboardStats();
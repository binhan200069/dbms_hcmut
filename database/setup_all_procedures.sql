-- =============================================================================
-- ALL PROCEDURES FOR LOGISTICS SYSTEM
-- =============================================================================

USE logistics_db;

SET NAMES utf8mb4;

SET CHARACTER SET utf8mb4;

-- Drop all procedures first
DROP PROCEDURE IF EXISTS sp_GetAllVehicles;

DROP PROCEDURE IF EXISTS sp_GetVehicleById;

DROP PROCEDURE IF EXISTS sp_CreateVehicle;

DROP PROCEDURE IF EXISTS sp_GetAllOrders;

DROP PROCEDURE IF EXISTS sp_GetOrderById;

DROP PROCEDURE IF EXISTS sp_CreateOrder;

DROP PROCEDURE IF EXISTS sp_AddItemToOrder;

DROP PROCEDURE IF EXISTS sp_DashboardStats;

DROP PROCEDURE IF EXISTS sp_GetTrackingLogs;

DROP PROCEDURE IF EXISTS sp_GetAllAssignments;

DROP PROCEDURE IF EXISTS sp_CreateAssignment;

DROP PROCEDURE IF EXISTS sp_UpdateAssignmentStatus;

DROP PROCEDURE IF EXISTS sp_GetAllShipments;

DROP PROCEDURE IF EXISTS sp_CreateShipment;

DELIMITER $$

-- =============================================================================
-- VEHICLE PROCEDURES
-- =============================================================================

CREATE PROCEDURE sp_GetAllVehicles()
BEGIN
    SELECT * FROM VEHICLE;
END$$

CREATE PROCEDURE sp_GetVehicleById(IN p_VehicleId INT UNSIGNED)
BEGIN
    SELECT * FROM VEHICLE WHERE VehicleId = p_VehicleId;
END$$

CREATE PROCEDURE sp_CreateVehicle(
    IN p_LicensePlate VARCHAR(15),
    IN p_VehicleType VARCHAR(50),
    IN p_MaxWeightCapacity DECIMAL(10, 2),
    IN p_LicenseExpiryDate DATE
)
BEGIN
    INSERT INTO VEHICLE (LicensePlate, VehicleType, MaxWeightCapacity, LicenseExpiryDate)
    VALUES (p_LicensePlate, p_VehicleType, p_MaxWeightCapacity, p_LicenseExpiryDate);
    SELECT LAST_INSERT_ID() AS VehicleId;
END$$

-- =============================================================================
-- ORDER PROCEDURES
-- =============================================================================

CREATE PROCEDURE sp_GetAllOrders()
BEGIN
    SELECT o.*, u.Name AS CustomerName
    FROM `ORDER` o
    LEFT JOIN CUSTOMER c ON o.CustomerId = c.UserId
    LEFT JOIN `USER` u ON c.UserId = u.UserId;
END$$

CREATE PROCEDURE sp_GetOrderById(IN p_OrderId INT UNSIGNED)
BEGIN
    SELECT o.*, u.Name AS CustomerName
    FROM `ORDER` o
    LEFT JOIN CUSTOMER c ON o.CustomerId = c.UserId
    LEFT JOIN `USER` u ON c.UserId = u.UserId
    WHERE o.OrderId = p_OrderId;
END$$

CREATE PROCEDURE sp_CreateOrder(
    IN p_CustomerId INT UNSIGNED,
    IN p_PickupLocation VARCHAR(255),
    IN p_DeliveryLocation VARCHAR(255),
    IN p_FreightCost DECIMAL(12, 2),
    IN p_PaymentTerm VARCHAR(20)
)
BEGIN
    IF p_FreightCost <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Freight cost must be greater than 0!';
    END IF;

    IF p_PickupLocation IS NULL OR TRIM(p_PickupLocation) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pickup location cannot be empty!';
    END IF;

    IF p_DeliveryLocation IS NULL OR TRIM(p_DeliveryLocation) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Delivery location cannot be empty!';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM CUSTOMER WHERE UserId = p_CustomerId) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Customer does not exist!';
    END IF;

    INSERT INTO `ORDER` (OrderDate, OrderStatus, PickupLocation, DeliveryLocation, FreightCost, PaymentTerm, CustomerId)
    VALUES (NOW(), 'Pending', TRIM(p_PickupLocation), TRIM(p_DeliveryLocation), p_FreightCost, p_PaymentTerm, p_CustomerId);

    SELECT LAST_INSERT_ID() AS OrderId;
END$$

CREATE PROCEDURE sp_AddItemToOrder(
    IN p_OrderId INT UNSIGNED,
    IN p_ItemId INT UNSIGNED,
    IN p_Quantity INT UNSIGNED
)
BEGIN
    DECLARE v_ItemPrice DECIMAL(12, 2);
    
    SELECT UnitPrice INTO v_ItemPrice FROM ITEM WHERE ItemId = p_ItemId;
    
    IF v_ItemPrice IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Item does not exist!';
    END IF;
    
    INSERT INTO ITEM_ORDER (OrderId, ItemId, OrderQuantity, LineTotal)
    VALUES (p_OrderId, p_ItemId, p_Quantity, p_Quantity * v_ItemPrice);
    
    SELECT LAST_INSERT_ID() AS ItemOrderId;
END$$

-- =============================================================================
-- DASHBOARD PROCEDURES
-- =============================================================================

CREATE PROCEDURE sp_DashboardStats()
BEGIN
    SELECT
        (SELECT COUNT(*) FROM `ORDER`) AS TotalOrders,
        (SELECT COUNT(*) FROM `ORDER` WHERE OrderStatus = 'Pending') AS PendingOrders,
        (SELECT COUNT(*) FROM SHIPMENT) AS TotalShipments,
        (SELECT COUNT(*) FROM ASSIGNMENT) AS TotalAssignments,
        (SELECT COUNT(*) FROM DRIVER) AS TotalDrivers,
        (SELECT SUM(FreightCost) FROM `ORDER` WHERE OrderStatus = 'Completed') AS TotalRevenue;
END$$

CREATE PROCEDURE sp_GetTrackingLogs(IN p_OrderId INT UNSIGNED)
BEGIN
    SELECT tl.TrackingId, tl.ShipmentId, tl.CurrentStatus, tl.Timestamp, tl.Notes
    FROM TRACKING_LOG tl
    INNER JOIN SHIPMENT s ON tl.ShipmentId = s.ShipmentId
    INNER JOIN ORDER_SHIPMENT os ON s.ShipmentId = os.ShipmentId
    WHERE os.OrderId = p_OrderId
    ORDER BY tl.Timestamp DESC;
END$$

-- =============================================================================
-- ASSIGNMENT PROCEDURES
-- =============================================================================

CREATE PROCEDURE sp_GetAllAssignments()
BEGIN
    SELECT a.*, u.Name AS DriverName, v.LicensePlate, s.ShipmentId
    FROM ASSIGNMENT a
    LEFT JOIN DRIVER d ON a.UserId = d.UserId
    LEFT JOIN `USER` u ON d.UserId = u.UserId
    LEFT JOIN VEHICLE v ON a.VehicleId = v.VehicleId
    LEFT JOIN SHIPMENT s ON a.ShipmentId = s.ShipmentId;
END$$

CREATE PROCEDURE sp_CreateAssignment(
    IN p_ShipmentId INT UNSIGNED,
    IN p_DriverId INT UNSIGNED,
    IN p_VehicleId INT UNSIGNED
)
BEGIN
    INSERT INTO ASSIGNMENT (ShipmentId, UserId, VehicleId, AssignDate, AssignmentStatus)
    VALUES (p_ShipmentId, p_DriverId, p_VehicleId, NOW(), 'Assigned');
    
    SELECT LAST_INSERT_ID() AS AssignmentId;
END$$

CREATE PROCEDURE sp_UpdateAssignmentStatus(
    IN p_AssignmentId INT UNSIGNED,
    IN p_Status VARCHAR(20)
)
BEGIN
    UPDATE ASSIGNMENT
    SET AssignmentStatus = p_Status
    WHERE AssignmentId = p_AssignmentId;
    
    SELECT p_AssignmentId AS AssignmentId;
END$$

-- =============================================================================
-- SHIPMENT PROCEDURES
-- =============================================================================

CREATE PROCEDURE sp_GetAllShipments()
BEGIN
    SELECT s.*, GROUP_CONCAT(DISTINCT o.OrderId SEPARATOR ',') AS OrderIds
    FROM SHIPMENT s
    LEFT JOIN ORDER_SHIPMENT os ON s.ShipmentId = os.ShipmentId
    LEFT JOIN `ORDER` o ON os.OrderId = o.OrderId
    GROUP BY s.ShipmentId;
END$$

CREATE PROCEDURE sp_CreateShipment(
    IN p_DepartureDate DATETIME,
    IN p_RouteName VARCHAR(100)
)
BEGIN
    DECLARE v_RouteId INT;
    
    SELECT RouteId INTO v_RouteId FROM ROUTE WHERE RouteName = p_RouteName LIMIT 1;
    
    IF v_RouteId IS NULL THEN
        INSERT INTO ROUTE (RouteName) VALUES (p_RouteName);
        SET v_RouteId = LAST_INSERT_ID();
    END IF;
    
    INSERT INTO SHIPMENT (DepartureDate, RouteId, TotalWeight)
    VALUES (p_DepartureDate, v_RouteId, 0);
    
    SELECT LAST_INSERT_ID() AS ShipmentId;
END$$

DELIMITER;

-- =============================================================================
-- STATUS
-- =============================================================================

SELECT 'Procedures created successfully!' AS Status;

SELECT COUNT(*) AS TotalProcedures
FROM INFORMATION_SCHEMA.ROUTINES
WHERE
    ROUTINE_SCHEMA = 'logistics_db'
    AND ROUTINE_TYPE = 'PROCEDURE';
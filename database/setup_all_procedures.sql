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

DROP PROCEDURE IF EXISTS sp_DashboardStats;
DROP PROCEDURE IF EXISTS sp_GetTrackingLogs;
DROP PROCEDURE IF EXISTS sp_GetAllAssignments;

DROP PROCEDURE IF EXISTS sp_UpdateAssignmentStatus;
DROP PROCEDURE IF EXISTS sp_GetAllShipments;
DROP PROCEDURE IF EXISTS sp_CreateShipment;
DROP PROCEDURE IF EXISTS sp_CreateNewAccount;

-- =============================================================================
-- STAFF PROCEDURES
-- =============================================================================
DROP PROCEDURE IF EXISTS sp_GetAllStaff;
DELIMITER $$

CREATE PROCEDURE sp_GetAllStaff()
BEGIN
    SELECT u.UserId, u.Account, u.Name, u.email, u.Address,
            (SELECT p.Phone FROM user_phone p WHERE p.UserId = u.UserId LIMIT 1) AS Phone,
            s.Position, s.Department,
            sv.ManageDate, sv.SupervisorId
    FROM staff s
    LEFT JOIN `USER` u on u.UserId = s.UserId
    LEFT JOIN SUPERVISE sv on s.UserId = sv.SuperviseeId
    WHERE u.Status = 1;
END$$

DELIMITER;

DELIMITER $$

CREATE PROCEDURE sp_GetStaffById(IN p_UserId INT UNSIGNED)
BEGIN
    SELECT u.UserId, u.Account, u.Name, u.email,
            (SELECT p.Phone FROM user_phone p WHERE p.UserId = u.UserId LIMIT 1) AS Phone,
            s.Position, s.Department,
            sv.ManageDate, sv.SupervisorId
    FROM staff s
    LEFT JOIN `USER` u on u.UserId = s.UserId
    LEFT JOIN SUPERVISE sv on s.UserId = sv.SuperviseeId
    WHERE u.UserId = p_UserId AND u.Status = 1;
END$$

DROP PROCEDURE IF EXISTS sp_CreateStaff;
DELIMITER $$
CREATE PROCEDURE sp_CreateStaff(    
    IN v_Name       VARCHAR(100),
    IN v_Account    VARCHAR(50),
    In v_Email      VARCHAR(100),
    IN v_Address    VARCHAR(255),
    IN v_Position   VARCHAR(100),
    IN v_Department VARCHAR(100),
    IN v_Phone      VARCHAR(20)  
)
BEGIN
    DECLARE v_NewUser INT UNSIGNED;
    START TRANSACTION;
        INSERT INTO `USER` (Name, Email, Account, Address)
        VALUES (v_Name, v_Email, v_Account, v_Address);
        
        SET v_NewUser = LAST_INSERT_ID();
        INSERT INTO `STAFF` (UserId, Position, Department)
        VALUES (v_NewUser, v_Position, v_Department);
        INSERT INTO `USER_PHONE` (UserId, Phone)
        VALUES (v_NewUser, v_Phone);
    COMMIT;
END$$
DELIMITER;

DROP PROCEDURE IF EXISTS sp_UpdateStaff;
DELIMITER $$
CREATE PROCEDURE sp_UpdateStaff(
    IN v_UserId     VARCHAR(10),
    IN v_Name       VARCHAR(100),
    IN v_Address    VARCHAR(255),
    IN v_Position   VARCHAR(50),
    IN v_Department VARCHAR(100),
    IN v_Phone      VARCHAR(20)
)
BEGIN
    START TRANSACTION;
    UPDATE STAFF
    SET 
        Position    = v_Position, 
        Department  = v_Department
    WHERE UserId = v_UserId;
    
    UPDATE `USER`
    SET `Name`      = v_Name,
        `Address`   = v_Address
    WHERE UserId = v_UserId;

    DELETE FROM user_phone
    WHERE UserId = v_UserId
        AND Phone = (
            SELECT Phone FROM (
                SELECT Phone FROM user_phone
                WHERE UserId = v_UserId
                LIMIT 1
            ) AS tmp
        );
    INSERT INTO user_phone (UserId, Phone)
    VALUES(v_UserId, v_Phone);

    COMMIT;
END$$
DELIMITER;

DROP PROCEDURE IF EXISTS sp_DeleteStaff;
DELIMITER $$
CREATE PROCEDURE sp_DeleteStaff(IN p_UserId INT UNSIGNED)
BEGIN
    START TRANSACTION;
    DELETE FROM STAFF WHERE UserId = p_UserId;
    DELETE FROM user_phone WHERE UserId = p_UserId;
    DELETE FROM `USER` WHERE UserId = p_UserId;
    COMMIT;
END$$

DELIMITER ;




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

DROP PROCEDURE IF EXISTS sp_CreateOrder;
DELIMITER $$ 
CREATE PROCEDURE sp_CreateOrder(
    IN p_CustomerId INT UNSIGNED,
    IN p_PickupLocation VARCHAR(255),
    IN p_DeliveryLocation VARCHAR(255),
    IN p_FreightCost DECIMAL(12, 2),
    IN p_PaymentTerm VARCHAR(20)
)
BEGIN
    DECLARE v_StaffId INT UNSIGNED;
    
    SELECT UserId INTO v_StaffId
    FROM STAFF
    WHERE Department = 'Planning' AND Position != 'Manager'
    ORDER BY RAND()
    LIMIT 1;

    IF v_StaffId IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No Staff available in Planning Department';
    END IF;

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

    INSERT INTO `ORDER` (OrderDate, OrderStatus, PickupLocation, DeliveryLocation, FreightCost, StaffId, CustomerId)
    VALUES (NOW(), 'Processing', p_PickupLocation, p_DeliveryLocation, p_FreightCost, v_StaffId, p_CustomerId);


    SELECT LAST_INSERT_ID() AS OrderId;
END$$


DROP PROCEDURE IF EXISTS sp_AddItemToOrder;
DELIMITER $$
CREATE PROCEDURE sp_AddItemToOrder(
    IN p_OrderId INT UNSIGNED,
    IN p_ItemId INT UNSIGNED,
    IN p_Quantity INT UNSIGNED
)

BEGIN
    INSERT INTO ITEM_ORDER (OrderId, ItemId, OrderQuantity)
    VALUES (p_OrderId, p_ItemId, p_Quantity);
    
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
        (SELECT COUNT(*) FROM  VEHICLE WHERE LicenseExpiryDate > CURRENT_DATE()) AS AvailableVehicles,
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

DROP PROCEDURE IF EXISTS sp_CreateAssignment;
DELIMITER $$
CREATE PROCEDURE sp_CreateAssignment(
    IN p_ShipmentId INT UNSIGNED,
    IN p_DriverId INT UNSIGNED,
    IN p_VehicleId INT UNSIGNED,
    IN p_AssignDate DATE
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
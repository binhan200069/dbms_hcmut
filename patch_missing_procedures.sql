-- =============================================================================
-- PATCH FILE: Missing & Fixed Stored Procedures
-- Applied ON TOP of logistics_system_full.sql
-- Safe to run multiple times (idempotent via DROP IF EXISTS)
-- =============================================================================
USE logistics_db;

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- =============================================================================
-- FIX: ALTER TABLE VEHICLE — Add Status & Notes columns only if missing
-- =============================================================================
SET @col_status = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'VEHICLE'
      AND COLUMN_NAME  = 'Status'
);
SET @sql_status = IF(@col_status = 0,
    'ALTER TABLE VEHICLE ADD COLUMN Status VARCHAR(50) DEFAULT ''Sẵn sàng''',
    'SELECT ''Column Status already exists'' AS Info'
);
PREPARE stmt FROM @sql_status;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_notes = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'VEHICLE'
      AND COLUMN_NAME  = 'Notes'
);
SET @sql_notes = IF(@col_notes = 0,
    'ALTER TABLE VEHICLE ADD COLUMN Notes TEXT',
    'SELECT ''Column Notes already exists'' AS Info'
);
PREPARE stmt FROM @sql_notes;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =============================================================================
-- STAFF CRUD PROCEDURES
-- =============================================================================
DROP PROCEDURE IF EXISTS sp_GetStaffById;
DROP PROCEDURE IF EXISTS sp_CreateStaff;
DROP PROCEDURE IF EXISTS sp_UpdateStaff;
DROP PROCEDURE IF EXISTS sp_DeleteStaff;

DELIMITER $$

-- ─────────────────────────────────────────────────────────────────────────────
-- sp_GetStaffById — Lấy thông tin 1 nhân viên theo ID
-- ─────────────────────────────────────────────────────────────────────────────
CREATE PROCEDURE sp_GetStaffById(IN p_StaffId INT UNSIGNED)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM STAFF WHERE UserId = p_StaffId) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Nhân viên không tồn tại!';
    END IF;

    SELECT
        s.UserId,
        u.Account,
        u.Name,
        u.Email,
        u.Address,
        u.Status,
        s.Position,
        s.Department,
        GROUP_CONCAT(DISTINCT up.Phone ORDER BY up.Phone SEPARATOR ', ') AS Phone
    FROM STAFF s
    JOIN `USER`      u  ON s.UserId = u.UserId
    LEFT JOIN USER_PHONE up ON u.UserId = up.UserId
    WHERE s.UserId = p_StaffId
    GROUP BY s.UserId, u.Account, u.Name, u.Email, u.Address, u.Status, s.Position, s.Department;
END$$

-- ─────────────────────────────────────────────────────────────────────────────
-- sp_CreateStaff — Tạo nhân viên mới
-- Params: name, account, email, address, position, department, phone
-- ─────────────────────────────────────────────────────────────────────────────
CREATE PROCEDURE sp_CreateStaff(
    IN p_Name       VARCHAR(100),
    IN p_Account    VARCHAR(50),
    IN p_Email      VARCHAR(100),
    IN p_Address    TEXT,
    IN p_Position   VARCHAR(50),
    IN p_Department VARCHAR(50),
    IN p_Phone      VARCHAR(15)
)
BEGIN
    DECLARE v_new_id INT UNSIGNED;

    -- Validate bắt buộc
    IF p_Name IS NULL OR TRIM(p_Name) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Tên nhân viên không được để trống!';
    END IF;

    IF p_Email IS NULL OR TRIM(p_Email) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Email không được để trống!';
    END IF;

    -- Kiểm tra email trùng
    IF EXISTS (SELECT 1 FROM `USER` WHERE Email = p_Email) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Email đã được sử dụng bởi tài khoản khác!';
    END IF;

    -- Kiểm tra account trùng (nếu có)
    IF p_Account IS NOT NULL AND TRIM(p_Account) <> '' AND
       EXISTS (SELECT 1 FROM `USER` WHERE Account = p_Account) THEN
        SIGNAL SQLSTATE '23000' SET MESSAGE_TEXT = 'Lỗi: Tên tài khoản đã tồn tại!';
    END IF;

    -- Tạo USER trước
    INSERT INTO `USER` (Account, Name, Email, Address, Status, UserRole)
    VALUES (
        COALESCE(NULLIF(TRIM(p_Account), ''), LOWER(REPLACE(p_Name, ' ', ''))),
        p_Name,
        p_Email,
        p_Address,
        1,
        'STAFF'
    );

    SET v_new_id = LAST_INSERT_ID();

    -- Tạo STAFF record
    INSERT INTO STAFF (UserId, Position, Department)
    VALUES (v_new_id, p_Position, p_Department);

    -- Thêm SĐT nếu có
    IF p_Phone IS NOT NULL AND TRIM(p_Phone) <> '' THEN
        INSERT INTO USER_PHONE (UserId, Phone) VALUES (v_new_id, p_Phone);
    END IF;

    SELECT v_new_id AS UserId, 'Tạo nhân viên thành công!' AS Message;
END$$

-- ─────────────────────────────────────────────────────────────────────────────
-- sp_UpdateStaff — Cập nhật thông tin nhân viên
-- Params: staffId, name, address, position, department, phone
-- ─────────────────────────────────────────────────────────────────────────────
CREATE PROCEDURE sp_UpdateStaff(
    IN p_StaffId    INT UNSIGNED,
    IN p_Name       VARCHAR(100),
    IN p_Address    TEXT,
    IN p_Position   VARCHAR(50),
    IN p_Department VARCHAR(50),
    IN p_Phone      VARCHAR(15)
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM STAFF WHERE UserId = p_StaffId) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Nhân viên không tồn tại!';
    END IF;

    IF p_Name IS NULL OR TRIM(p_Name) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Tên nhân viên không được để trống!';
    END IF;

    -- Cập nhật bảng USER
    UPDATE `USER`
    SET Name    = p_Name,
        Address = p_Address
    WHERE UserId = p_StaffId;

    -- Cập nhật bảng STAFF
    UPDATE STAFF
    SET Position   = p_Position,
        Department = p_Department
    WHERE UserId = p_StaffId;

    -- Cập nhật SĐT: xóa cũ rồi chèn mới (nếu có)
    DELETE FROM USER_PHONE WHERE UserId = p_StaffId;
    IF p_Phone IS NOT NULL AND TRIM(p_Phone) <> '' THEN
        INSERT INTO USER_PHONE (UserId, Phone) VALUES (p_StaffId, p_Phone);
    END IF;

    SELECT p_StaffId AS UserId, 'Cập nhật nhân viên thành công!' AS Message;
END$$

-- ─────────────────────────────────────────────────────────────────────────────
-- sp_DeleteStaff — Xóa / vô hiệu hóa nhân viên
-- Soft-delete: đặt Status = 0 (không xóa cứng để giữ lịch sử)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE PROCEDURE sp_DeleteStaff(IN p_StaffId INT UNSIGNED)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM STAFF WHERE UserId = p_StaffId) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Nhân viên không tồn tại!';
    END IF;

    -- Soft delete — vô hiệu hóa tài khoản
    UPDATE `USER` SET Status = 0 WHERE UserId = p_StaffId;

    SELECT p_StaffId AS UserId, 'Đã vô hiệu hóa nhân viên thành công!' AS Message;
END$$

DELIMITER ;

SELECT 'PATCH: Staff CRUD Procedures — OK' AS Status;

-- =============================================================================
-- WAREHOUSE INVENTORY PROCEDURE
-- =============================================================================
DROP PROCEDURE IF EXISTS sp_GetItemsByWarehouse;

DELIMITER $$

-- ─────────────────────────────────────────────────────────────────────────────
-- sp_GetItemsByWarehouse — Lấy danh sách hàng hóa tồn kho trong 1 kho
-- ─────────────────────────────────────────────────────────────────────────────
CREATE PROCEDURE sp_GetItemsByWarehouse(IN p_WarehouseId INT UNSIGNED)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM WAREHOUSE WHERE WarehouseId = p_WarehouseId) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Kho hàng không tồn tại!';
    END IF;

    SELECT
        inv.InventoryId,
        inv.WarehouseId,
        inv.ItemId,
        i.Description     AS ItemName,
        i.Weight          AS WeightPerUnit,
        i.Unit,
        inv.Quantity,
        ROUND(inv.Quantity * i.Weight, 2) AS TotalWeightKg
    FROM INVENTORY inv
    JOIN ITEM i ON inv.ItemId = i.ItemId
    WHERE inv.WarehouseId = p_WarehouseId
    ORDER BY i.Description ASC;
END$$

DELIMITER ;

SELECT 'PATCH: sp_GetItemsByWarehouse — OK' AS Status;

-- =============================================================================
-- ENSURE sp_DashboardStats EXISTS WITH 0 PARAMS (final override)
-- =============================================================================
DROP PROCEDURE IF EXISTS sp_DashboardStats;

DELIMITER $$

CREATE PROCEDURE sp_DashboardStats()
BEGIN
    -- Result set 1: KPI tổng quan
    SELECT
        (SELECT COUNT(*)                       FROM `ORDER`)                                 AS TotalOrders,
        (SELECT COUNT(*)                       FROM `ORDER` WHERE OrderStatus = 'Chờ xử lý') AS PendingOrders,
        (SELECT COUNT(*)                       FROM VEHICLE WHERE LicenseExpiryDate >= CURDATE()) AS AvailableVehicles,
        (SELECT COUNT(*)                       FROM SHIPMENT)                                AS TotalShipments,
        (SELECT COUNT(*)                       FROM ASSIGNMENT)                              AS TotalAssignments,
        (SELECT COUNT(*)                       FROM DRIVER)                                  AS TotalDrivers,
        (SELECT COALESCE(SUM(FreightCost), 0)  FROM `ORDER` WHERE OrderStatus = 'Đã giao')  AS TotalRevenue,
        (SELECT COUNT(*)                       FROM `ORDER` WHERE OrderStatus = 'Đang vận chuyển') AS InTransitOrders,
        (SELECT COUNT(*)                       FROM ASSIGNMENT WHERE AssignmentStatus = 'Đang thực hiện') AS ActiveShipments,
        (SELECT COUNT(*)                       FROM DRIVER d JOIN `USER` u ON d.UserId = u.UserId WHERE u.Status = 1) AS ActiveDrivers,
        -- Doanh thu tháng hiện tại
        (SELECT COALESCE(SUM(o.FreightCost), 0)
            FROM `ORDER` o
            WHERE o.OrderStatus = 'Đã giao'
              AND MONTH(o.DeliveredDate) = MONTH(CURDATE())
              AND YEAR(o.DeliveredDate)  = YEAR(CURDATE()))  AS MonthlyRevenue,
        (SELECT COUNT(*) FROM `ORDER`
            WHERE MONTH(OrderDate) = MONTH(CURDATE())
              AND YEAR(OrderDate)  = YEAR(CURDATE()))         AS MonthlyOrders;

    -- Result set 2: Doanh thu 6 tháng gần nhất
    SELECT
        DATE_FORMAT(o.OrderDate, '%Y-%m') AS Month,
        COALESCE(SUM(o.FreightCost), 0)   AS Revenue,
        COUNT(o.OrderId)                  AS OrderCount
    FROM `ORDER` o
    WHERE o.OrderDate >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      AND o.OrderStatus = 'Đã giao'
    GROUP BY DATE_FORMAT(o.OrderDate, '%Y-%m')
    ORDER BY Month ASC;

    -- Result set 3: Phân phối trạng thái đơn hàng
    SELECT
        OrderStatus AS Status,
        COUNT(*)    AS Count
    FROM `ORDER`
    GROUP BY OrderStatus
    ORDER BY Count DESC;

    -- Result set 4: Top 5 khách hàng theo doanh thu
    SELECT
        u.UserId,
        u.Name                           AS CustomerName,
        COUNT(o.OrderId)                 AS TotalOrders,
        COALESCE(SUM(o.FreightCost), 0)  AS TotalRevenue
    FROM CUSTOMER c
    JOIN `USER`   u ON c.UserId = u.UserId
    LEFT JOIN `ORDER` o ON c.UserId = o.CustomerId AND o.OrderStatus = 'Đã giao'
    GROUP BY u.UserId, u.Name
    ORDER BY TotalRevenue DESC
    LIMIT 5;

    -- Result set 5: 5 đơn hàng mới nhất
    SELECT
        o.OrderId,
        o.OrderDate,
        o.OrderStatus,
        u.Name            AS CustomerName,
        o.FreightCost,
        ld.LocationName   AS DeliveryLocation
    FROM `ORDER` o
    JOIN `USER`     u  ON o.CustomerId      = u.UserId
    LEFT JOIN LOCATION ld ON o.DeliveryLocation = ld.LocationId
    ORDER BY o.OrderDate DESC
    LIMIT 5;
END$$

DELIMITER ;

SELECT 'PATCH: sp_DashboardStats (0 params) — OK' AS Status;

-- =============================================================================
-- ENSURE sp_GetAllStaff & sp_GetAllWarehouses EXIST
-- =============================================================================
DROP PROCEDURE IF EXISTS sp_GetAllStaff;
DROP PROCEDURE IF EXISTS sp_GetAllWarehouses;

DELIMITER $$

CREATE PROCEDURE sp_GetAllStaff()
BEGIN
    SELECT
        s.UserId,
        u.Account,
        u.Name,
        u.Email,
        u.Address,
        u.Status,
        s.Position,
        s.Department,
        GROUP_CONCAT(DISTINCT up.Phone ORDER BY up.Phone SEPARATOR ', ') AS Phone
    FROM STAFF s
    JOIN `USER`      u  ON s.UserId = u.UserId
    LEFT JOIN USER_PHONE up ON u.UserId = up.UserId
    GROUP BY s.UserId, u.Account, u.Name, u.Email, u.Address, u.Status, s.Position, s.Department
    ORDER BY s.UserId;
END$$

CREATE PROCEDURE sp_GetAllWarehouses()
BEGIN
    SELECT
        w.WarehouseId,
        w.WarehouseName,
        w.WarehouseType,
        w.Capacity,
        w.TakeoverDate,
        l.LocationName,
        l.Address,
        l.Latitude,
        l.Longitude,
        u.Name  AS ManagerName,
        u.Email AS ManagerEmail,
        COALESCE(inv_summary.TotalItems,    0) AS TotalItems,
        COALESCE(inv_summary.TotalQuantity, 0) AS TotalQuantity
    FROM WAREHOUSE w
    LEFT JOIN LOCATION l ON w.LocationId = l.LocationId
    LEFT JOIN STAFF    s ON w.StaffId    = s.UserId
    LEFT JOIN `USER`   u ON s.UserId     = u.UserId
    LEFT JOIN (
        SELECT WarehouseId,
               COUNT(DISTINCT ItemId) AS TotalItems,
               SUM(Quantity)          AS TotalQuantity
        FROM INVENTORY
        GROUP BY WarehouseId
    ) inv_summary ON w.WarehouseId = inv_summary.WarehouseId
    ORDER BY w.WarehouseId;
END$$

DELIMITER ;

SELECT 'PATCH: sp_GetAllStaff & sp_GetAllWarehouses — OK' AS Status;

-- =============================================================================
-- ENSURE sp_GetAllShipments RETURNS Status FIELD (frontend expects it)
-- =============================================================================
DROP PROCEDURE IF EXISTS sp_GetAllShipments;

DELIMITER $$

CREATE PROCEDURE sp_GetAllShipments()
BEGIN
    SELECT
        s.ShipmentId,
        s.TotalWeight,
        s.DepartureDate,
        s.ActualArrivalTime,
        r.RouteName,
        r.RouteType,
        r.TransitTime,
        COUNT(DISTINCT os.OrderId)      AS TotalOrders,
        COUNT(DISTINCT a.AssignmentId)  AS AssignmentCount,
        -- Tính Status từ trạng thái Assignment và thời gian
        CASE
            WHEN s.ActualArrivalTime IS NOT NULL            THEN 'Đã giao'
            WHEN EXISTS (
                SELECT 1 FROM ASSIGNMENT a2
                WHERE a2.ShipmentId = s.ShipmentId
                  AND a2.AssignmentStatus = 'Đang thực hiện'
            )                                               THEN 'Đang vận chuyển'
            WHEN EXISTS (
                SELECT 1 FROM ASSIGNMENT a3
                WHERE a3.ShipmentId = s.ShipmentId
                  AND a3.AssignmentStatus = 'Đã hủy'
            )                                               THEN 'Đã hủy'
            ELSE 'Chờ xử lý'
        END AS Status
    FROM SHIPMENT s
    LEFT JOIN ROUTE          r  ON s.RouteId    = r.RouteId
    LEFT JOIN ORDER_SHIPMENT os ON s.ShipmentId = os.ShipmentId
    LEFT JOIN ASSIGNMENT     a  ON s.ShipmentId = a.ShipmentId
    GROUP BY s.ShipmentId, s.TotalWeight, s.DepartureDate, s.ActualArrivalTime,
             r.RouteName, r.RouteType, r.TransitTime
    ORDER BY s.DepartureDate DESC;
END$$

DELIMITER ;

SELECT 'PATCH: sp_GetAllShipments (with Status) — OK' AS Status;

-- =============================================================================
-- ENSURE sp_GetAllAssignments USES CORRECT COLUMN ALIAS (Status not AssignmentStatus)
-- ─────────────────────────────────────────────────────────────────────────────
-- Frontend MyTrips.jsx reads: a.Status, a.AssignmentStatus
-- Both aliases are returned below.
-- =============================================================================
DROP PROCEDURE IF EXISTS sp_GetAllAssignments;

DELIMITER $$

CREATE PROCEDURE sp_GetAllAssignments()
BEGIN
    SELECT
        a.AssignmentId,
        a.AssignDate,
        a.AssignmentStatus,
        a.AssignmentStatus  AS Status,   -- alias for frontend compatibility
        s.ShipmentId,
        s.TotalWeight,
        s.DepartureDate,
        v.VehicleId,
        v.LicensePlate,
        v.VehicleType,
        v.MaxWeightCapacity,
        u.UserId  AS DriverId,
        u.Name    AS DriverName,
        d.LicenseClass,
        d.LicenseExpiryDate,
        r.RouteName
    FROM ASSIGNMENT a
    INNER JOIN SHIPMENT  s ON a.ShipmentId = s.ShipmentId
    INNER JOIN VEHICLE   v ON a.VehicleId  = v.VehicleId
    INNER JOIN DRIVER    d ON a.UserId     = d.UserId
    INNER JOIN `USER`    u ON a.UserId     = u.UserId
    LEFT  JOIN ROUTE     r ON s.RouteId    = r.RouteId
    ORDER BY a.AssignDate DESC;
END$$

DELIMITER ;

SELECT 'PATCH: sp_GetAllAssignments (dual Status alias) — OK' AS Status;

-- =============================================================================
-- FIX sp_UpdateAssignmentStatus — Accept both 'Hủy' and 'Đã hủy'
-- (Frontend MyTrips sends 'Hủy', DB enum may use 'Đã hủy')
-- =============================================================================
DROP PROCEDURE IF EXISTS sp_UpdateAssignmentStatus;

DELIMITER $$

CREATE PROCEDURE sp_UpdateAssignmentStatus(
    IN p_AssignmentId   INT UNSIGNED,
    IN p_NewStatus      VARCHAR(30)
)
BEGIN
    DECLARE v_current_status VARCHAR(30);
    DECLARE v_shipment_id    INT UNSIGNED;
    DECLARE v_mapped_status  VARCHAR(30);

    -- Chuẩn hóa status input (frontend dùng 'Hủy', DB lưu 'Đã hủy')
    SET v_mapped_status = CASE p_NewStatus
        WHEN 'Hủy'             THEN 'Đã hủy'
        WHEN 'Đã lên kế hoạch' THEN 'Chờ xác nhận'
        ELSE p_NewStatus
    END;

    SELECT AssignmentStatus, ShipmentId
    INTO v_current_status, v_shipment_id
    FROM ASSIGNMENT WHERE AssignmentId = p_AssignmentId;

    IF v_current_status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Phân công không tồn tại!';
    END IF;

    IF v_current_status IN ('Hoàn thành', 'Đã hủy') THEN
        BEGIN
            DECLARE v_msg VARCHAR(255);
            SET v_msg = CONCAT('Lỗi: Không thể thay đổi trạng thái của phân công đã ở trạng thái "', v_current_status, '"!');
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
        END;
    END IF;

    IF v_mapped_status NOT IN ('Chờ xác nhận', 'Đã lên kế hoạch', 'Đang thực hiện', 'Hoàn thành', 'Đã hủy', 'Hủy') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Trạng thái không hợp lệ!';
    END IF;

    UPDATE ASSIGNMENT
    SET AssignmentStatus = v_mapped_status
    WHERE AssignmentId = p_AssignmentId;

    -- Cascade: cập nhật trạng thái đơn hàng trong chuyến
    IF v_mapped_status = 'Đang thực hiện' THEN
        UPDATE `ORDER` o
        INNER JOIN ORDER_SHIPMENT os ON o.OrderId = os.OrderId
        SET o.OrderStatus = 'Đang vận chuyển'
        WHERE os.ShipmentId = v_shipment_id
          AND o.OrderStatus NOT IN ('Đã giao', 'Đã hủy');

    ELSEIF v_mapped_status = 'Hoàn thành' THEN
        UPDATE SHIPMENT SET ActualArrivalTime = NOW() WHERE ShipmentId = v_shipment_id;

        UPDATE `ORDER` o
        INNER JOIN ORDER_SHIPMENT os ON o.OrderId = os.OrderId
        SET o.OrderStatus   = 'Đã giao',
            o.DeliveredDate = NOW()
        WHERE os.ShipmentId = v_shipment_id
          AND o.OrderStatus = 'Đang vận chuyển';
    END IF;

    SELECT p_AssignmentId AS AssignmentId,
           CONCAT('Cập nhật trạng thái thành "', v_mapped_status, '" thành công!') AS Message;
END$$

DELIMITER ;

SELECT 'PATCH: sp_UpdateAssignmentStatus (normalized status) — OK' AS Status;

-- =============================================================================
-- ALL PATCHES APPLIED SUCCESSFULLY
-- =============================================================================
SELECT 'ALL PATCHES APPLIED — System should be fully operational' AS FinalStatus;

-- =============================================================================
-- Phase 2 — File 3: CRUD Procedures cho ORDER
-- =============================================================================
USE logistics_db;

SET NAMES utf8mb4;

SET CHARACTER SET utf8mb4;

DROP PROCEDURE IF EXISTS sp_GetAllOrders;

DROP PROCEDURE IF EXISTS sp_GetOrderById;

DROP PROCEDURE IF EXISTS sp_CreateOrder;

DROP PROCEDURE IF EXISTS sp_UpdateOrder;

DROP PROCEDURE IF EXISTS sp_DeleteOrder;

DROP PROCEDURE IF EXISTS sp_SearchOrders;

DROP PROCEDURE IF EXISTS sp_AddItemToOrder;

DROP PROCEDURE IF EXISTS sp_RemoveItemFromOrder;

DROP PROCEDURE IF EXISTS sp_CancelOrder;

DELIMITER $$

-- Lấy toàn bộ đơn hàng (join đầy đủ)
CREATE PROCEDURE sp_GetAllOrders()
BEGIN
    SELECT
        o.OrderId, o.OrderDate, o.OrderStatus,
        lp.LocationName AS PickupLocationName,
        ld.LocationName AS DeliveryLocationName,
        o.FreightFactor, o.FreightCost, o.DeliveredDate,
        uc.Name   AS CustomerName,
        us.Name   AS StaffName,
        COUNT(io.ItemId) AS TotalItems,
        COALESCE(SUM(io.OrderQuantity * i.Weight), 0) AS TotalWeightKg
    FROM `ORDER` o
    LEFT JOIN LOCATION lp  ON o.PickupLocation   = lp.LocationId
    LEFT JOIN LOCATION ld  ON o.DeliveryLocation = ld.LocationId
    LEFT JOIN `USER`   uc  ON o.CustomerId       = uc.UserId
    LEFT JOIN `USER`   us  ON o.StaffId          = us.UserId
    LEFT JOIN ITEM_ORDER io ON o.OrderId = io.OrderId
    LEFT JOIN ITEM i        ON io.ItemId = i.ItemId
    GROUP BY o.OrderId
    ORDER BY o.OrderDate DESC;
END$$

-- Lấy chi tiết 1 đơn hàng
CREATE PROCEDURE sp_GetOrderById(IN p_OrderId INT UNSIGNED)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM `ORDER` WHERE OrderId = p_OrderId) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Đơn hàng không tồn tại!';
    END IF;

    -- Thông tin đơn
    SELECT o.OrderId, o.OrderDate, o.OrderStatus,
           lp.LocationName AS PickupLocationName, lp.Address AS PickupAddress,
           ld.LocationName AS DeliveryLocationName, ld.Address AS DeliveryAddress,
           o.FreightFactor, o.FreightCost, o.DeliveredDate,
           uc.UserId AS CustomerId, uc.Name AS CustomerName,
           us.UserId AS StaffId,   us.Name AS StaffName
    FROM `ORDER` o
    LEFT JOIN LOCATION lp  ON o.PickupLocation   = lp.LocationId
    LEFT JOIN LOCATION ld  ON o.DeliveryLocation = ld.LocationId
    LEFT JOIN `USER`   uc  ON o.CustomerId       = uc.UserId
    LEFT JOIN `USER`   us  ON o.StaffId          = us.UserId
    WHERE o.OrderId = p_OrderId;

    -- Chi tiết hàng hóa
    SELECT i.ItemId, i.Description, i.Unit,
           io.OrderQuantity, i.Weight,
           io.OrderQuantity * i.Weight AS SubtotalWeight
    FROM ITEM_ORDER io
    INNER JOIN ITEM i ON io.ItemId = i.ItemId
    WHERE io.OrderId = p_OrderId;
END$$

-- Tạo đơn hàng mới
CREATE PROCEDURE sp_CreateOrder(
    IN p_CustomerId         INT UNSIGNED,
    IN p_PickupLocation     INT UNSIGNED,
    IN p_DeliveryLocation   INT UNSIGNED,
    IN p_FreightFactor      DECIMAL(8,4),
    IN p_FreightCost        DECIMAL(15,2),
    IN p_StaffId            INT UNSIGNED
)
BEGIN
    -- Validate khách hàng
    IF NOT EXISTS (
        SELECT 1 FROM CUSTOMER c INNER JOIN `USER` u ON c.UserId = u.UserId
        WHERE c.UserId = p_CustomerId AND u.Status = 1
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Khách hàng không tồn tại hoặc đã bị khóa tài khoản!';
    END IF;

    -- Validate địa điểm lấy hàng
    IF NOT EXISTS (SELECT 1 FROM LOCATION WHERE LocationId = p_PickupLocation) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Địa điểm lấy hàng không tồn tại trong hệ thống!';
    END IF;

    -- Validate địa điểm giao hàng
    IF NOT EXISTS (SELECT 1 FROM LOCATION WHERE LocationId = p_DeliveryLocation) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Địa điểm giao hàng không tồn tại trong hệ thống!';
    END IF;

    -- Địa điểm không được trùng (TRIGGER cũng kiểm tra, thêm lớp bảo vệ)
    IF p_PickupLocation = p_DeliveryLocation THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Địa điểm lấy hàng và giao hàng không được trùng nhau!';
    END IF;

    -- FreightCost không âm
    IF p_FreightCost < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Chi phí vận chuyển không được là số âm!';
    END IF;

    -- FreightFactor > 0
    IF p_FreightFactor IS NULL OR p_FreightFactor <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Hệ số cước phải lớn hơn 0!';
    END IF;

    INSERT INTO `ORDER` (OrderDate, OrderStatus, PickupLocation, FreightFactor,
                         FreightCost, DeliveryLocation, StaffId, CustomerId)
    VALUES (NOW(), 'Chờ xử lý', p_PickupLocation, p_FreightFactor,
            p_FreightCost, p_DeliveryLocation, p_StaffId, p_CustomerId);

    SELECT LAST_INSERT_ID() AS OrderId,
           'Tạo đơn hàng thành công!' AS Message;
END$$

-- Cập nhật đơn hàng
CREATE PROCEDURE sp_UpdateOrder(
    IN p_OrderId            INT UNSIGNED,
    IN p_PickupLocation     INT UNSIGNED,
    IN p_DeliveryLocation   INT UNSIGNED,
    IN p_FreightFactor      DECIMAL(8,4),
    IN p_FreightCost        DECIMAL(15,2),
    IN p_StaffId            INT UNSIGNED
)
BEGIN
    DECLARE v_status VARCHAR(30);

    SELECT OrderStatus INTO v_status
    FROM `ORDER` WHERE OrderId = p_OrderId;

    IF v_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Đơn hàng không tồn tại!';
    END IF;

    -- TRIGGER trg_before_order_update đã kiểm tra trạng thái Đã giao/Đã hủy
    -- Thêm validation ở procedure
    IF v_status IN ('Đã giao', 'Đã hủy') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = CONCAT('Lỗi: Không thể sửa đơn hàng ở trạng thái "', v_status, '"!');
    END IF;

    IF p_PickupLocation = p_DeliveryLocation THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Địa điểm lấy hàng và giao hàng không được trùng nhau!';
    END IF;

    IF p_FreightCost < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Chi phí vận chuyển không được là số âm!';
    END IF;

    UPDATE `ORDER`
    SET PickupLocation   = p_PickupLocation,
        DeliveryLocation = p_DeliveryLocation,
        FreightFactor    = p_FreightFactor,
        FreightCost      = p_FreightCost,
        StaffId          = p_StaffId
    WHERE OrderId = p_OrderId;

    SELECT p_OrderId AS OrderId, 'Cập nhật đơn hàng thành công!' AS Message;
END$$

-- Xóa đơn hàng (chỉ xóa Chờ xử lý)
CREATE PROCEDURE sp_DeleteOrder(IN p_OrderId INT UNSIGNED)
BEGIN
    DECLARE v_status VARCHAR(30);

    SELECT OrderStatus INTO v_status FROM `ORDER` WHERE OrderId = p_OrderId;

    IF v_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Đơn hàng không tồn tại!';
    END IF;

    IF v_status <> 'Chờ xử lý' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = CONCAT(
            'Lỗi: Chỉ có thể xóa đơn hàng ở trạng thái "Chờ xử lý". ',
            'Đơn hàng hiện tại đang ở trạng thái "', v_status, '".'
        );
    END IF;

    -- Xóa chi tiết hàng hóa trước
    DELETE FROM ITEM_ORDER WHERE OrderId = p_OrderId;
    DELETE FROM `ORDER`     WHERE OrderId = p_OrderId;

    SELECT p_OrderId AS OrderId, 'Xóa đơn hàng thành công!' AS Message;
END$$

-- Hủy đơn hàng
CREATE PROCEDURE sp_CancelOrder(IN p_OrderId INT UNSIGNED)
BEGIN
    DECLARE v_status VARCHAR(30);

    SELECT OrderStatus INTO v_status FROM `ORDER` WHERE OrderId = p_OrderId;

    IF v_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Đơn hàng không tồn tại!';
    END IF;

    IF v_status IN ('Đã giao', 'Đã hủy') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = CONCAT('Lỗi: Không thể hủy đơn hàng đã ở trạng thái "', v_status, '"!');
    END IF;

    UPDATE `ORDER` SET OrderStatus = 'Đã hủy' WHERE OrderId = p_OrderId;

    INSERT INTO TRACKING_LOG (OrderId, CurrentStatus, Timestamp, LogLocation)
    VALUES (p_OrderId, 'Đã hủy đơn hàng', NOW(), 'Hệ thống');

    SELECT p_OrderId AS OrderId, 'Hủy đơn hàng thành công!' AS Message;
END$$

-- Thêm hàng hóa vào đơn
CREATE PROCEDURE sp_AddItemToOrder(
    IN p_OrderId        INT UNSIGNED,
    IN p_ItemId         INT UNSIGNED,
    IN p_OrderQuantity  DECIMAL(12,2)
)
BEGIN
    DECLARE v_status VARCHAR(30);

    SELECT OrderStatus INTO v_status FROM `ORDER` WHERE OrderId = p_OrderId;

    IF v_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Đơn hàng không tồn tại!';
    END IF;

    IF v_status NOT IN ('Chờ xử lý', 'Đang xử lý') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Chỉ có thể thêm hàng hóa khi đơn hàng đang ở trạng thái Chờ xử lý hoặc Đang xử lý!';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM ITEM WHERE ItemId = p_ItemId) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Hàng hóa không tồn tại trong danh mục!';
    END IF;

    IF p_OrderQuantity <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Số lượng hàng hóa phải lớn hơn 0!';
    END IF;

    INSERT INTO ITEM_ORDER (ItemId, OrderId, OrderQuantity)
    VALUES (p_ItemId, p_OrderId, p_OrderQuantity)
    ON DUPLICATE KEY UPDATE OrderQuantity = OrderQuantity + p_OrderQuantity;

    SELECT p_OrderId AS OrderId, 'Thêm hàng hóa vào đơn thành công!' AS Message;
END$$

-- Tìm kiếm đơn hàng theo thời gian & trạng thái
CREATE PROCEDURE sp_SearchOrders(
    IN p_FromDate   DATE,
    IN p_ToDate     DATE,
    IN p_Status     VARCHAR(30),
    IN p_CustomerId INT UNSIGNED
)
BEGIN
    IF p_FromDate IS NOT NULL AND p_ToDate IS NOT NULL AND p_FromDate > p_ToDate THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Ngày bắt đầu không được lớn hơn ngày kết thúc!';
    END IF;

    SELECT
        o.OrderId, o.OrderDate, o.OrderStatus,
        lp.LocationName AS PickupLocationName,
        ld.LocationName AS DeliveryLocationName,
        o.FreightCost,
        uc.Name AS CustomerName,
        us.Name AS StaffName,
        COALESCE(SUM(io.OrderQuantity * i.Weight), 0) AS TotalWeightKg
    FROM `ORDER` o
    LEFT JOIN LOCATION   lp  ON o.PickupLocation   = lp.LocationId
    LEFT JOIN LOCATION   ld  ON o.DeliveryLocation = ld.LocationId
    LEFT JOIN `USER`     uc  ON o.CustomerId       = uc.UserId
    LEFT JOIN `USER`     us  ON o.StaffId          = us.UserId
    LEFT JOIN ITEM_ORDER io  ON o.OrderId          = io.OrderId
    LEFT JOIN ITEM       i   ON io.ItemId          = i.ItemId
    WHERE
        (p_FromDate   IS NULL OR DATE(o.OrderDate) >= p_FromDate)
      AND (p_ToDate   IS NULL OR DATE(o.OrderDate) <= p_ToDate)
      AND (p_Status   IS NULL OR p_Status = '' OR p_Status = 'Tất cả' OR o.OrderStatus = p_Status)
      AND (p_CustomerId IS NULL OR p_CustomerId = 0 OR o.CustomerId = p_CustomerId)
    GROUP BY o.OrderId
    ORDER BY o.OrderDate DESC;
END$$

DELIMITER;

SELECT 'Phase 2 — Order Procedures: OK' AS Status;
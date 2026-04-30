USE logistics_db;

DROP TRIGGER IF EXISTS trg_PreventSameLocation;

DROP PROCEDURE IF EXISTS sp_CreateOrder;

DROP PROCEDURE IF EXISTS sp_UpdateOrder;

DROP PROCEDURE IF EXISTS sp_DeleteOrder;

DROP PROCEDURE IF EXISTS sp_GetCustomerOrders;

DROP PROCEDURE IF EXISTS sp_GetCustomerStats;

DELIMITER / /

CREATE PROCEDURE sp_CreateOrder(
    IN p_CustomerId INT UNSIGNED,
    IN p_PickupLocation VARCHAR(255),
    IN p_DeliveryLocation VARCHAR(255),
    IN p_FreightCost DECIMAL(12,2),
    IN p_PaymentTerm VARCHAR(20)
)
BEGIN
    IF p_FreightCost <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Chi phí vận chuyển phải lớn hơn 0!';
    END IF;

    IF p_PickupLocation IS NULL OR TRIM(p_PickupLocation) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Điểm lấy hàng không được để trống!';
    END IF;

    IF p_DeliveryLocation IS NULL OR TRIM(p_DeliveryLocation) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Điểm giao hàng không được để trống!';
    END IF;

    IF p_PaymentTerm NOT IN ('cash', 'credit', 'cod') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Phương thức thanh toán không hợp lệ!';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM `CUSTOMER`
        WHERE UserId = p_CustomerId
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Khách hàng không tồn tại!';
    END IF;

    INSERT INTO `ORDER` (OrderDate, OrderStatus, PickupLocation, DeliveryLocation, FreightCost, PaymentTerm, CustomerId)
    VALUES (NOW(), 'Pending', TRIM(p_PickupLocation), TRIM(p_DeliveryLocation), p_FreightCost, p_PaymentTerm, p_CustomerId);

    SELECT LAST_INSERT_ID() AS OrderId;
END //

CREATE PROCEDURE sp_UpdateOrder(
    IN p_OrderId INT UNSIGNED,
    IN p_PickupLocation VARCHAR(255),
    IN p_DeliveryLocation VARCHAR(255)
)
BEGIN
    DECLARE v_OrderStatus VARCHAR(20);

    IF p_PickupLocation IS NULL OR TRIM(p_PickupLocation) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Điểm lấy hàng không được để trống!';
    END IF;

    IF p_DeliveryLocation IS NULL OR TRIM(p_DeliveryLocation) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Điểm giao hàng không được để trống!';
    END IF;

    SELECT OrderStatus
    INTO v_OrderStatus
    FROM `ORDER`
    WHERE OrderId = p_OrderId;

    IF v_OrderStatus IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Đơn hàng không tồn tại!';
    END IF;

    IF v_OrderStatus <> 'Pending' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Chỉ được phép sửa đơn hàng khi đang ở trạng thái Pending!';
    END IF;

    UPDATE `ORDER`
    SET PickupLocation = TRIM(p_PickupLocation),
        DeliveryLocation = TRIM(p_DeliveryLocation)
    WHERE OrderId = p_OrderId;

    SELECT p_OrderId AS UpdatedOrderId;
END //

CREATE PROCEDURE sp_DeleteOrder(
    IN p_OrderId INT UNSIGNED
)
BEGIN
    DECLARE v_OrderStatus VARCHAR(20);

    SELECT OrderStatus
    INTO v_OrderStatus
    FROM `ORDER`
    WHERE OrderId = p_OrderId;

    IF v_OrderStatus IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Đơn hàng không tồn tại!';
    END IF;

    IF v_OrderStatus <> 'Pending' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Không thể xóa đơn hàng đã được xử lý hoặc giao hàng!';
    END IF;

    DELETE FROM `ORDER`
    WHERE OrderId = p_OrderId;

    SELECT p_OrderId AS DeletedOrderId;
END //

CREATE PROCEDURE sp_GetCustomerOrders(
    IN p_CustomerId INT UNSIGNED,
    IN p_StatusFilter VARCHAR(20)
)
BEGIN
    SELECT
        o.OrderId,
        o.OrderDate,
        o.OrderStatus,
        o.PickupLocation,
        o.DeliveryLocation,
        o.FreightCost,
        u.UserId AS CustomerId,
        u.Name AS CustomerName
    FROM `ORDER` o
    INNER JOIN `USER` u
        ON o.CustomerId = u.UserId
    WHERE o.CustomerId = p_CustomerId
      AND (
          p_StatusFilter IS NULL
          OR p_StatusFilter = ''
          OR p_StatusFilter = 'ALL'
          OR o.OrderStatus = p_StatusFilter
      )
    ORDER BY o.OrderDate DESC;
END //

CREATE PROCEDURE sp_GetCustomerStats(
    IN p_CustomerId INT UNSIGNED
)
BEGIN
    SELECT
        c.UserId AS CustomerId,
        COUNT(o.OrderId) AS TotalOrders,
        SUM(o.FreightCost) AS TotalFreightCost
    FROM `ORDER` o
    INNER JOIN `CUSTOMER` c
        ON o.CustomerId = c.UserId
    WHERE c.UserId = p_CustomerId
    GROUP BY c.UserId
    HAVING COUNT(o.OrderId) > 0;
END //

CREATE TRIGGER trg_PreventSameLocation
BEFORE INSERT ON `ORDER`
FOR EACH ROW
BEGIN
    IF LOWER(TRIM(NEW.PickupLocation)) = LOWER(TRIM(NEW.DeliveryLocation)) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Điểm lấy hàng và giao hàng không được trùng nhau!';
    END IF;
END //

DELIMITER;
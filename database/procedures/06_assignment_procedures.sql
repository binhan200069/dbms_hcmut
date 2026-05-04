-- =============================================================================
-- Phase 2 — File 4: CRUD Procedures cho ASSIGNMENT & SHIPMENT
-- =============================================================================
USE logistics_db;

SET NAMES utf8mb4;

SET CHARACTER SET utf8mb4;

DROP PROCEDURE IF EXISTS sp_GetAllShipments;

DROP PROCEDURE IF EXISTS sp_CreateShipment;

DROP PROCEDURE IF EXISTS sp_AddOrderToShipment;

DROP PROCEDURE IF EXISTS sp_RemoveOrderFromShipment;

DROP PROCEDURE IF EXISTS sp_CreateAssignment;

DROP PROCEDURE IF EXISTS sp_UpdateAssignmentStatus;

DROP PROCEDURE IF EXISTS sp_GetAllAssignments;

DROP PROCEDURE IF EXISTS sp_GetAssignmentById;

DELIMITER $$

-- Lấy danh sách chuyến hàng
CREATE PROCEDURE sp_GetAllShipments()
BEGIN
    SELECT
        s.ShipmentId, s.TotalWeight, s.DepartureDate, s.ActualArrivalTime,
        r.RouteName, r.RouteType, r.TransitTime,
        COUNT(DISTINCT os.OrderId)   AS TotalOrders,
        COUNT(DISTINCT a.AssignmentId) AS AssignmentCount
    FROM SHIPMENT s
    LEFT JOIN ROUTE          r  ON s.RouteId    = r.RouteId
    LEFT JOIN ORDER_SHIPMENT os ON s.ShipmentId = os.ShipmentId
    LEFT JOIN ASSIGNMENT     a  ON s.ShipmentId = a.ShipmentId
    GROUP BY s.ShipmentId
    ORDER BY s.DepartureDate DESC;
END$$

-- Tạo chuyến hàng mới
CREATE PROCEDURE sp_CreateShipment(
    IN p_DepartureDate  DATETIME,
    IN p_RouteId        INT UNSIGNED
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM ROUTE WHERE RouteId = p_RouteId) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Tuyến đường không tồn tại trong hệ thống!';
    END IF;

    IF p_DepartureDate IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Ngày giờ xuất phát không được để trống!';
    END IF;

    IF p_DepartureDate < NOW() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Ngày giờ xuất phát phải sau thời điểm hiện tại!';
    END IF;

    INSERT INTO SHIPMENT (TotalWeight, DepartureDate, RouteId)
    VALUES (0.00, p_DepartureDate, p_RouteId);

    SELECT LAST_INSERT_ID() AS ShipmentId,
           'Tạo chuyến hàng thành công!' AS Message;
END$$

-- Gộp đơn hàng vào chuyến
CREATE PROCEDURE sp_AddOrderToShipment(
    IN p_OrderId                INT UNSIGNED,
    IN p_ShipmentId             INT UNSIGNED,
    IN p_ExpectedDeliveryDate   DATE
)
BEGIN
    DECLARE v_order_status  VARCHAR(30);
    DECLARE v_departure     DATETIME;

    SELECT OrderStatus INTO v_order_status
    FROM `ORDER` WHERE OrderId = p_OrderId;

    IF v_order_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Đơn hàng không tồn tại!';
    END IF;

    IF v_order_status IN ('Đã giao', 'Đã hủy', 'Đang vận chuyển') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = CONCAT(
            'Lỗi: Không thể gộp đơn hàng đang ở trạng thái "', v_order_status, '" vào chuyến!'
        );
    END IF;

    SELECT DepartureDate INTO v_departure
    FROM SHIPMENT WHERE ShipmentId = p_ShipmentId;

    IF v_departure IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Chuyến hàng không tồn tại!';
    END IF;

    -- Kiểm tra đơn đã có trong chuyến khác chưa
    IF EXISTS (SELECT 1 FROM ORDER_SHIPMENT WHERE OrderId = p_OrderId) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Đơn hàng đã được gộp vào một chuyến khác! Vui lòng tách ra trước.';
    END IF;

    IF p_ExpectedDeliveryDate IS NOT NULL AND p_ExpectedDeliveryDate < DATE(v_departure) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Ngày giao hàng dự kiến không thể trước ngày xuất phát!';
    END IF;

    -- TRIGGER trg_after_order_shipment_insert sẽ tự cập nhật TotalWeight
    INSERT INTO ORDER_SHIPMENT (OrderId, ShipmentId, RecordTime, ExpectedDeliveryDate)
    VALUES (p_OrderId, p_ShipmentId, NOW(), p_ExpectedDeliveryDate);

    SELECT p_ShipmentId AS ShipmentId, 'Gộp đơn hàng vào chuyến thành công!' AS Message;
END$$

-- Gỡ đơn hàng ra khỏi chuyến
CREATE PROCEDURE sp_RemoveOrderFromShipment(
    IN p_OrderId    INT UNSIGNED,
    IN p_ShipmentId INT UNSIGNED
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM ORDER_SHIPMENT
        WHERE OrderId = p_OrderId AND ShipmentId = p_ShipmentId
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Đơn hàng không thuộc chuyến hàng này!';
    END IF;

    -- Kiểm tra assignment đang chạy
    IF EXISTS (
        SELECT 1 FROM ASSIGNMENT
        WHERE ShipmentId = p_ShipmentId AND AssignmentStatus = 'Đang thực hiện'
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Không thể gỡ đơn hàng khi chuyến đang vận chuyển!';
    END IF;

    -- TRIGGER trg_after_order_shipment_delete sẽ cập nhật TotalWeight
    DELETE FROM ORDER_SHIPMENT
    WHERE OrderId = p_OrderId AND ShipmentId = p_ShipmentId;

    SELECT p_OrderId AS OrderId, 'Gỡ đơn hàng khỏi chuyến thành công!' AS Message;
END$$

-- Tạo phân công xe + tài xế cho chuyến hàng
CREATE PROCEDURE sp_CreateAssignment(
    IN p_ShipmentId     INT UNSIGNED,
    IN p_VehicleId      INT UNSIGNED,
    IN p_DriverId       INT UNSIGNED,
    IN p_AssignDate     DATE
)
BEGIN
    -- TRIGGER trg_before_assignment_insert thực hiện toàn bộ validation nghiệp vụ:
    -- - Kiểm tra xe, tài xế hợp lệ
    -- - Kiểm tra đăng kiểm, GPLX còn hạn
    -- - Kiểm tra tải trọng (TotalWeight <= MaxWeightCapacity)
    -- - Kiểm tra xe không đang được dùng
    -- Procedure chỉ cần CALL INSERT

    INSERT INTO ASSIGNMENT (AssignDate, AssignmentStatus, ShipmentId, VehicleId, UserId)
    VALUES (
        COALESCE(p_AssignDate, CURDATE()),
        'Chờ xác nhận',
        p_ShipmentId,
        p_VehicleId,
        p_DriverId
    );

    SELECT LAST_INSERT_ID() AS AssignmentId,
           'Phân công phương tiện và tài xế thành công!' AS Message;
END$$

-- Cập nhật trạng thái phân công
CREATE PROCEDURE sp_UpdateAssignmentStatus(
    IN p_AssignmentId   INT UNSIGNED,
    IN p_NewStatus      VARCHAR(30)
)
BEGIN
    DECLARE v_current_status VARCHAR(30);
    DECLARE v_shipment_id    INT UNSIGNED;

    SELECT AssignmentStatus, ShipmentId
    INTO v_current_status, v_shipment_id
    FROM ASSIGNMENT WHERE AssignmentId = p_AssignmentId;

    IF v_current_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Phân công không tồn tại!';
    END IF;

    -- Validate luồng trạng thái
    IF v_current_status = 'Hoàn thành' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Không thể thay đổi trạng thái của phân công đã hoàn thành!';
    END IF;

    IF v_current_status = 'Đã hủy' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Không thể thay đổi trạng thái của phân công đã hủy!';
    END IF;

    IF p_NewStatus NOT IN ('Chờ xác nhận', 'Đang thực hiện', 'Hoàn thành', 'Đã hủy') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Trạng thái không hợp lệ! Các giá trị cho phép: Chờ xác nhận, Đang thực hiện, Hoàn thành, Đã hủy.';
    END IF;

    UPDATE ASSIGNMENT
    SET AssignmentStatus = p_NewStatus
    WHERE AssignmentId = p_AssignmentId;

    -- Cập nhật trạng thái các đơn hàng trong chuyến
    IF p_NewStatus = 'Đang thực hiện' THEN
        UPDATE `ORDER` o
        INNER JOIN ORDER_SHIPMENT os ON o.OrderId = os.OrderId
        SET o.OrderStatus = 'Đang vận chuyển'
        WHERE os.ShipmentId = v_shipment_id
          AND o.OrderStatus NOT IN ('Đã giao', 'Đã hủy');
    ELSEIF p_NewStatus = 'Hoàn thành' THEN
        UPDATE SHIPMENT
        SET ActualArrivalTime = NOW()
        WHERE ShipmentId = v_shipment_id;

        UPDATE `ORDER` o
        INNER JOIN ORDER_SHIPMENT os ON o.OrderId = os.OrderId
        SET o.OrderStatus   = 'Đã giao',
            o.DeliveredDate = NOW()
        WHERE os.ShipmentId = v_shipment_id
          AND o.OrderStatus = 'Đang vận chuyển';
    END IF;

    SELECT p_AssignmentId AS AssignmentId,
           CONCAT('Cập nhật trạng thái thành "', p_NewStatus, '" thành công!') AS Message;
END$$

-- Lấy danh sách phân công
CREATE PROCEDURE sp_GetAllAssignments()
BEGIN
    SELECT
        a.AssignmentId, a.AssignDate, a.AssignmentStatus,
        s.ShipmentId, s.TotalWeight, s.DepartureDate,
        v.VehicleId, v.LicensePlate, v.VehicleType, v.MaxWeightCapacity,
        u.UserId AS DriverId, u.Name AS DriverName,
        d.LicenseClass, d.LicenseExpiryDate,
        r.RouteName
    FROM ASSIGNMENT a
    INNER JOIN SHIPMENT  s ON a.ShipmentId = s.ShipmentId
    INNER JOIN VEHICLE   v ON a.VehicleId  = v.VehicleId
    INNER JOIN DRIVER    d ON a.UserId     = d.UserId
    INNER JOIN `USER`    u ON a.UserId     = u.UserId
    LEFT JOIN  ROUTE     r ON s.RouteId    = r.RouteId
    ORDER BY a.AssignDate DESC;
END$$

DELIMITER;

SELECT 'Phase 2 — Assignment/Shipment Procedures: OK' AS Status;
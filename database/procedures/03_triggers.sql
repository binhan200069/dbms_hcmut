-- =============================================================================
-- LOGISTICS & SUPPLY CHAIN MANAGEMENT SYSTEM
-- Phase 2 — File 1: Triggers Nghiệp vụ
-- =============================================================================

USE logistics_db;

SET NAMES utf8mb4;

SET CHARACTER SET utf8mb4;

-- =============================================================================
-- DROP tất cả trigger cũ
-- =============================================================================
DROP TRIGGER IF EXISTS trg_before_assignment_insert;

DROP TRIGGER IF EXISTS trg_after_order_shipment_insert;

DROP TRIGGER IF EXISTS trg_after_order_shipment_delete;

DROP TRIGGER IF EXISTS trg_before_order_insert;

DROP TRIGGER IF EXISTS trg_before_order_update;

DROP TRIGGER IF EXISTS trg_after_tracking_insert;

DELIMITER $$

-- =============================================================================
-- TRIGGER 1: BEFORE INSERT on ASSIGNMENT
-- Chặn phân công nếu TotalWeight của Shipment > MaxWeightCapacity của Vehicle
-- =============================================================================
CREATE TRIGGER trg_before_assignment_insert
BEFORE INSERT ON ASSIGNMENT
FOR EACH ROW
BEGIN
    DECLARE v_total_weight      DECIMAL(12, 2) DEFAULT 0;
    DECLARE v_max_capacity      DECIMAL(10, 2) DEFAULT 0;
    DECLARE v_vehicle_plate     VARCHAR(15);
    DECLARE v_vehicle_type      VARCHAR(50);
    DECLARE v_license_expiry    DATE;
    DECLARE v_shipment_exists   TINYINT DEFAULT 0;
    DECLARE v_driver_exists     TINYINT DEFAULT 0;
    DECLARE v_driver_expiry     DATE;

    -- Kiểm tra Shipment tồn tại
    SELECT COUNT(*) INTO v_shipment_exists
    FROM SHIPMENT
    WHERE ShipmentId = NEW.ShipmentId;

    IF v_shipment_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Chuyến hàng không tồn tại trong hệ thống!';
    END IF;

    -- Kiểm tra Tài xế tồn tại và còn active
    SELECT d.LicenseExpiryDate INTO v_driver_expiry
    FROM DRIVER d
    INNER JOIN `USER` u ON d.UserId = u.UserId
    WHERE d.UserId = NEW.UserId AND u.Status = 1;

    IF v_driver_expiry IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Tài xế không tồn tại hoặc đã bị vô hiệu hóa!';
    END IF;

    -- Kiểm tra GPLX tài xế còn hạn
    IF v_driver_expiry < CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Giấy phép lái xe của tài xế đã hết hạn! Không thể phân công.';
    END IF;

    -- Lấy thông tin Vehicle
    SELECT LicensePlate, VehicleType, LicenseExpiryDate, MaxWeightCapacity
    INTO v_vehicle_plate, v_vehicle_type, v_license_expiry, v_max_capacity
    FROM VEHICLE
    WHERE VehicleId = NEW.VehicleId;

    IF v_vehicle_plate IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Phương tiện không tồn tại trong hệ thống!';
    END IF;

    -- Kiểm tra đăng kiểm xe còn hạn
    IF v_license_expiry < CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Đăng kiểm phương tiện đã hết hạn! Không thể phân công chuyến hàng.';
    END IF;

    -- Lấy TotalWeight của Shipment
    SELECT TotalWeight INTO v_total_weight
    FROM SHIPMENT
    WHERE ShipmentId = NEW.ShipmentId;

    -- Kiểm tra quá tải (ĐIỀU KIỆN TRỌNG TÂM)
    IF v_total_weight > v_max_capacity THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = CONCAT(
            'Lỗi: Phương tiện quá tải! ',
            'Tổng trọng lượng chuyến hàng: ', ROUND(v_total_weight, 2), ' kg — ',
            'Tải trọng tối đa của xe [', v_vehicle_plate, ' - ', v_vehicle_type, ']: ',
            ROUND(v_max_capacity, 2), ' kg. ',
            'Vui lòng chọn phương tiện có tải trọng lớn hơn hoặc tách chuyến hàng.'
        );
    END IF;

    -- Kiểm tra tài xế có được phép lái xe này không
    IF NOT EXISTS (
        SELECT 1 FROM DRIVER_VEHICLE
        WHERE VehicleId = NEW.VehicleId AND UserId = NEW.UserId
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Tài xế không được phép lái phương tiện này! Vui lòng kiểm tra lại danh sách phương tiện được phép lái.';
    END IF;

    -- Kiểm tra xe/tài xế không đang trong assignment chưa hoàn thành
    IF EXISTS (
        SELECT 1 FROM ASSIGNMENT
        WHERE VehicleId = NEW.VehicleId
          AND AssignmentStatus IN ('Chờ xác nhận', 'Đang thực hiện')
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Phương tiện đang được phân công cho chuyến hàng khác chưa hoàn thành! Không thể phân công thêm.';
    END IF;

END$$

-- =============================================================================
-- TRIGGER 2: AFTER INSERT on ORDER_SHIPMENT
-- Tự động tính và cộng dồn TotalWeight vào SHIPMENT
-- (JOIN ITEM_ORDER + ITEM để tính tổng kg)
-- =============================================================================
CREATE TRIGGER trg_after_order_shipment_insert
AFTER INSERT ON ORDER_SHIPMENT
FOR EACH ROW
BEGIN
    DECLARE v_order_weight DECIMAL(12, 2) DEFAULT 0;

    -- Tính trọng lượng của đơn hàng vừa gộp vào chuyến
    -- = SUM(OrderQuantity * Weight) của tất cả item trong order đó
    SELECT COALESCE(SUM(io.OrderQuantity * i.Weight), 0)
    INTO v_order_weight
    FROM ITEM_ORDER io
    INNER JOIN ITEM i ON io.ItemId = i.ItemId
    WHERE io.OrderId = NEW.OrderId;

    -- Cộng dồn vào TotalWeight của Shipment
    UPDATE SHIPMENT
    SET TotalWeight = TotalWeight + v_order_weight
    WHERE ShipmentId = NEW.ShipmentId;

    -- Tự động cập nhật trạng thái đơn hàng → Đang xử lý
    UPDATE `ORDER`
    SET OrderStatus = 'Đang xử lý'
    WHERE OrderId = NEW.OrderId
      AND OrderStatus = 'Chờ xử lý';
END$$

-- =============================================================================
-- TRIGGER 3: AFTER DELETE on ORDER_SHIPMENT
-- Khi xóa đơn ra khỏi chuyến → trừ trọng lượng tương ứng
-- =============================================================================
CREATE TRIGGER trg_after_order_shipment_delete
AFTER DELETE ON ORDER_SHIPMENT
FOR EACH ROW
BEGIN
    DECLARE v_order_weight DECIMAL(12, 2) DEFAULT 0;

    SELECT COALESCE(SUM(io.OrderQuantity * i.Weight), 0)
    INTO v_order_weight
    FROM ITEM_ORDER io
    INNER JOIN ITEM i ON io.ItemId = i.ItemId
    WHERE io.OrderId = OLD.OrderId;

    UPDATE SHIPMENT
    SET TotalWeight = GREATEST(0, TotalWeight - v_order_weight)
    WHERE ShipmentId = OLD.ShipmentId;

    -- Trả đơn hàng về trạng thái Chờ xử lý
    UPDATE `ORDER`
    SET OrderStatus = 'Chờ xử lý'
    WHERE OrderId = OLD.OrderId
      AND OrderStatus = 'Đang xử lý';
END$$

-- =============================================================================
-- TRIGGER 4: BEFORE INSERT on ORDER
-- Validate dữ liệu đơn hàng tại tầng DB
-- =============================================================================
CREATE TRIGGER trg_before_order_insert
BEFORE INSERT ON `ORDER`
FOR EACH ROW
BEGIN
    -- Không cho phép địa điểm lấy hàng trùng địa điểm giao hàng
    IF NEW.PickupLocation = NEW.DeliveryLocation THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Địa điểm lấy hàng và địa điểm giao hàng không được trùng nhau!';
    END IF;

    -- FreightCost không âm
    IF NEW.FreightCost < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Chi phí vận chuyển không được là số âm!';
    END IF;

    -- FreightFactor phải > 0
    IF NEW.FreightFactor <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Hệ số cước phải lớn hơn 0!';
    END IF;

    -- Khách hàng phải đang Active
    IF NOT EXISTS (
        SELECT 1 FROM `USER` u
        INNER JOIN CUSTOMER c ON u.UserId = c.UserId
        WHERE c.UserId = NEW.CustomerId AND u.Status = 1
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Khách hàng không tồn tại hoặc tài khoản đã bị khóa!';
    END IF;
END$$

-- =============================================================================
-- TRIGGER 5: BEFORE UPDATE on ORDER
-- Không cho phép sửa đơn hàng đã giao hoặc đã hủy
-- =============================================================================
CREATE TRIGGER trg_before_order_update
BEFORE UPDATE ON `ORDER`
FOR EACH ROW
BEGIN
    IF OLD.OrderStatus IN ('Đã giao', 'Đã hủy') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = CONCAT(
            'Lỗi: Không thể chỉnh sửa đơn hàng đã ở trạng thái "',
            OLD.OrderStatus,
            '"! Chỉ có thể cập nhật đơn hàng ở trạng thái Chờ xử lý hoặc Đang xử lý.'
        );
    END IF;

    -- Không cho phép thay đổi địa điểm khi đang vận chuyển
    IF OLD.OrderStatus = 'Đang vận chuyển'
       AND (NEW.PickupLocation <> OLD.PickupLocation OR NEW.DeliveryLocation <> OLD.DeliveryLocation) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Không thể thay đổi địa điểm khi đơn hàng đang vận chuyển!';
    END IF;
END$$

-- =============================================================================
-- TRIGGER 6: AFTER INSERT on TRACKING_LOG
-- Tự động đồng bộ OrderStatus theo log mới nhất
-- =============================================================================
CREATE TRIGGER trg_after_tracking_insert
AFTER INSERT ON TRACKING_LOG
FOR EACH ROW
BEGIN
    DECLARE v_new_status VARCHAR(30);

    -- Map trạng thái tracking → trạng thái đơn hàng
    CASE
        WHEN NEW.CurrentStatus LIKE '%Đã giao%' OR NEW.CurrentStatus LIKE '%giao hàng thành công%'
            THEN SET v_new_status = 'Đã giao';
        WHEN NEW.CurrentStatus LIKE '%Đang vận chuyển%' OR NEW.CurrentStatus LIKE '%xuất phát%'
            THEN SET v_new_status = 'Đang vận chuyển';
        WHEN NEW.CurrentStatus LIKE '%Đã hủy%'
            THEN SET v_new_status = 'Đã hủy';
        ELSE
            SET v_new_status = NULL; -- Không thay đổi status
    END CASE;

    IF v_new_status IS NOT NULL THEN
        UPDATE `ORDER`
        SET OrderStatus  = v_new_status,
            DeliveredDate = IF(v_new_status = 'Đã giao', NEW.Timestamp, DeliveredDate)
        WHERE OrderId = NEW.OrderId
          AND OrderStatus NOT IN ('Đã giao', 'Đã hủy');
    END IF;
END$$

DELIMITER;

SELECT 'Phase 2 — Triggers: OK' AS Status;
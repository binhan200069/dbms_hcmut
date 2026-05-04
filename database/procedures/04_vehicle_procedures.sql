-- =============================================================================
-- Phase 2 — File 2: CRUD Procedures cho VEHICLE
-- =============================================================================
USE logistics_db;

SET NAMES utf8mb4;

SET CHARACTER SET utf8mb4;

DROP PROCEDURE IF EXISTS sp_GetAllVehicles;

DROP PROCEDURE IF EXISTS sp_GetVehicleById;

DROP PROCEDURE IF EXISTS sp_CreateVehicle;

DROP PROCEDURE IF EXISTS sp_UpdateVehicle;

DROP PROCEDURE IF EXISTS sp_DeleteVehicle;

DROP PROCEDURE IF EXISTS sp_SearchVehicles;

DELIMITER $$

-- Lấy danh sách xe
CREATE PROCEDURE sp_GetAllVehicles()
BEGIN
    SELECT v.VehicleId, v.LicensePlate, v.VehicleType,
           v.LicenseExpiryDate, v.MaxWeightCapacity,
           IF(v.LicenseExpiryDate < CURDATE(), 'Hết hạn', 'Còn hạn') AS RegistrationStatus,
           GROUP_CONCAT(u.Name SEPARATOR ', ') AS Drivers
    FROM VEHICLE v
    LEFT JOIN DRIVER_VEHICLE dv ON v.VehicleId = dv.VehicleId
    LEFT JOIN `USER` u ON dv.UserId = u.UserId
    GROUP BY v.VehicleId;
END$$

-- Lấy xe theo ID
CREATE PROCEDURE sp_GetVehicleById(IN p_VehicleId INT UNSIGNED)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM VEHICLE WHERE VehicleId = p_VehicleId) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Không tìm thấy phương tiện!';
    END IF;

    SELECT v.VehicleId, v.LicensePlate, v.VehicleType,
           v.LicenseExpiryDate, v.MaxWeightCapacity,
           IF(v.LicenseExpiryDate < CURDATE(), 'Hết hạn', 'Còn hạn') AS RegistrationStatus
    FROM VEHICLE v
    WHERE v.VehicleId = p_VehicleId;
END$$

-- Tạo xe mới
CREATE PROCEDURE sp_CreateVehicle(
    IN p_LicensePlate       VARCHAR(15),
    IN p_VehicleType        VARCHAR(50),
    IN p_LicenseExpiryDate  DATE,
    IN p_MaxWeightCapacity  DECIMAL(10,2)
)
BEGIN
    -- Validate biển số
    IF p_LicensePlate IS NULL OR TRIM(p_LicensePlate) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Biển số xe không được để trống!';
    END IF;

    -- Validate loại xe
    IF p_VehicleType IS NULL OR TRIM(p_VehicleType) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Loại phương tiện không được để trống!';
    END IF;

    -- Validate ngày đăng kiểm
    IF p_LicenseExpiryDate IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Ngày hết hạn đăng kiểm không được để trống!';
    END IF;

    IF p_LicenseExpiryDate <= CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Ngày hết hạn đăng kiểm phải lớn hơn ngày hiện tại!';
    END IF;

    -- Validate tải trọng
    IF p_MaxWeightCapacity IS NULL OR p_MaxWeightCapacity <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Tải trọng tối đa phải lớn hơn 0 kg!';
    END IF;

    -- Kiểm tra biển số trùng
    IF EXISTS (SELECT 1 FROM VEHICLE WHERE LicensePlate = TRIM(p_LicensePlate)) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Biển số xe đã tồn tại trong hệ thống!';
    END IF;

    INSERT INTO VEHICLE (LicensePlate, VehicleType, LicenseExpiryDate, MaxWeightCapacity)
    VALUES (TRIM(p_LicensePlate), TRIM(p_VehicleType), p_LicenseExpiryDate, p_MaxWeightCapacity);

    SELECT LAST_INSERT_ID() AS VehicleId,
           'Thêm phương tiện thành công!' AS Message;
END$$

-- Cập nhật xe
CREATE PROCEDURE sp_UpdateVehicle(
    IN p_VehicleId          INT UNSIGNED,
    IN p_LicensePlate       VARCHAR(15),
    IN p_VehicleType        VARCHAR(50),
    IN p_LicenseExpiryDate  DATE,
    IN p_MaxWeightCapacity  DECIMAL(10,2)
)
BEGIN
    -- Kiểm tra xe tồn tại
    IF NOT EXISTS (SELECT 1 FROM VEHICLE WHERE VehicleId = p_VehicleId) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Phương tiện không tồn tại trong hệ thống!';
    END IF;

    IF p_LicensePlate IS NULL OR TRIM(p_LicensePlate) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Biển số xe không được để trống!';
    END IF;

    IF p_MaxWeightCapacity IS NULL OR p_MaxWeightCapacity <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Tải trọng tối đa phải lớn hơn 0 kg!';
    END IF;

    -- Biển số không trùng xe khác
    IF EXISTS (
        SELECT 1 FROM VEHICLE
        WHERE LicensePlate = TRIM(p_LicensePlate) AND VehicleId <> p_VehicleId
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Biển số xe đã được đăng ký cho phương tiện khác!';
    END IF;

    -- Xe đang chạy không được sửa tải trọng
    IF EXISTS (
        SELECT 1 FROM ASSIGNMENT
        WHERE VehicleId = p_VehicleId AND AssignmentStatus = 'Đang thực hiện'
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Không thể cập nhật phương tiện đang trong chuyến vận chuyển!';
    END IF;

    UPDATE VEHICLE
    SET LicensePlate      = TRIM(p_LicensePlate),
        VehicleType       = TRIM(p_VehicleType),
        LicenseExpiryDate = p_LicenseExpiryDate,
        MaxWeightCapacity = p_MaxWeightCapacity
    WHERE VehicleId = p_VehicleId;

    SELECT p_VehicleId AS VehicleId, 'Cập nhật phương tiện thành công!' AS Message;
END$$

-- XÓA xe (chỉ xóa nếu chưa có trong ASSIGNMENT)
CREATE PROCEDURE sp_DeleteVehicle(IN p_VehicleId INT UNSIGNED)
BEGIN
    DECLARE v_plate VARCHAR(15);

    SELECT LicensePlate INTO v_plate
    FROM VEHICLE WHERE VehicleId = p_VehicleId;

    IF v_plate IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Phương tiện không tồn tại trong hệ thống!';
    END IF;

    -- LOGIC CHẶN XÓA: xe đã từng có trong ASSIGNMENT
    IF EXISTS (SELECT 1 FROM ASSIGNMENT WHERE VehicleId = p_VehicleId) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = CONCAT(
            'Lỗi: Không thể xóa phương tiện [', v_plate, '] vì đã có lịch sử phân công vận chuyển! ',
            'Hãy vô hiệu hóa thay vì xóa để giữ toàn vẹn dữ liệu.'
        );
    END IF;

    -- Xóa driver_vehicle liên kết trước
    DELETE FROM DRIVER_VEHICLE WHERE VehicleId = p_VehicleId;
    DELETE FROM VEHICLE WHERE VehicleId = p_VehicleId;

    SELECT p_VehicleId AS VehicleId,
           CONCAT('Đã xóa phương tiện [', v_plate, '] thành công!') AS Message;
END$$

-- Tìm kiếm xe theo biển số / loại
CREATE PROCEDURE sp_SearchVehicles(
    IN p_LicensePlate   VARCHAR(15),
    IN p_VehicleType    VARCHAR(50)
)
BEGIN
    SELECT v.VehicleId, v.LicensePlate, v.VehicleType,
           v.LicenseExpiryDate, v.MaxWeightCapacity,
           IF(v.LicenseExpiryDate < CURDATE(), 'Hết hạn', 'Còn hạn') AS RegistrationStatus,
           GROUP_CONCAT(u.Name SEPARATOR ', ') AS Drivers
    FROM VEHICLE v
    LEFT JOIN DRIVER_VEHICLE dv ON v.VehicleId = dv.VehicleId
    LEFT JOIN `USER` u ON dv.UserId = u.UserId
    WHERE (p_LicensePlate IS NULL OR p_LicensePlate = ''
              OR v.LicensePlate LIKE CONCAT('%', p_LicensePlate, '%'))
      AND (p_VehicleType IS NULL OR p_VehicleType = ''
              OR v.VehicleType LIKE CONCAT('%', p_VehicleType, '%'))
    GROUP BY v.VehicleId
    ORDER BY v.VehicleId;
END$$

DELIMITER;

SELECT 'Phase 2 — Vehicle Procedures: OK' AS Status;
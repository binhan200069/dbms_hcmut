-- =============================================================================
-- LOGISTICS & SUPPLY CHAIN MANAGEMENT SYSTEM
-- Phase 1: Database Schema Creation
-- Database: logistics_db | Charset: utf8mb4
-- =============================================================================

CREATE DATABASE IF NOT EXISTS logistics_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE logistics_db;

SET NAMES utf8mb4;

SET CHARACTER SET utf8mb4;

-- =============================================================================
-- DROP ALL TABLES (reverse dependency order)
-- =============================================================================
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS TRACKING_LOG;

DROP TABLE IF EXISTS ASSIGNMENT;

DROP TABLE IF EXISTS ORDER_SHIPMENT;

DROP TABLE IF EXISTS SHIPMENT;

DROP TABLE IF EXISTS ITEM_ORDER;

DROP TABLE IF EXISTS `ORDER`;

DROP TABLE IF EXISTS INVENTORY;

DROP TABLE IF EXISTS ITEM;

DROP TABLE IF EXISTS WAREHOUSE;

DROP TABLE IF EXISTS ROUTE_SEGMENT;

DROP TABLE IF EXISTS ROUTE;

DROP TABLE IF EXISTS LOCATION;

DROP TABLE IF EXISTS DRIVER_VEHICLE;

DROP TABLE IF EXISTS VEHICLE;

DROP TABLE IF EXISTS SUPERVISE;

DROP TABLE IF EXISTS CUSTOMER;

DROP TABLE IF EXISTS DRIVER;

DROP TABLE IF EXISTS STAFF;

DROP TABLE IF EXISTS USER_PHONE;

DROP TABLE IF EXISTS `USER`;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 1. IAM & USERS
-- =============================================================================

CREATE TABLE `USER` (
    UserId INT UNSIGNED NOT NULL AUTO_INCREMENT,
    Account VARCHAR(50) NOT NULL,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    Status TINYINT NOT NULL DEFAULT 1 COMMENT '1=Active, 0=Inactive',
    Address VARCHAR(255) NULL,
    PRIMARY KEY (UserId),
    UNIQUE KEY uk_user_account (Account),
    UNIQUE KEY uk_user_email (Email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Bảng người dùng hệ thống';

-- -----------------------------------------------------------------------
CREATE TABLE USER_PHONE (
    UserId INT UNSIGNED NOT NULL,
    Phone VARCHAR(20) NOT NULL,
    PRIMARY KEY (UserId, Phone),
    CONSTRAINT fk_uphone_user FOREIGN KEY (UserId) REFERENCES `USER` (UserId) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Bảng số điện thoại người dùng (đa trị)';

-- -----------------------------------------------------------------------
CREATE TABLE STAFF (
    UserId INT UNSIGNED NOT NULL,
    Position VARCHAR(100) NULL COMMENT 'Chức vụ',
    Department VARCHAR(100) NULL COMMENT 'Phòng ban',
    PRIMARY KEY (UserId),
    CONSTRAINT fk_staff_user FOREIGN KEY (UserId) REFERENCES `USER` (UserId) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Bảng nhân viên';

-- -----------------------------------------------------------------------
CREATE TABLE CUSTOMER (
    UserId INT UNSIGNED NOT NULL,
    PayTerm VARCHAR(50) NULL COMMENT 'COD / Net15 / Net30 / Net60 / EOM / Prepaid',
    CustomerType VARCHAR(50) NULL COMMENT 'B2B / B2C / Wholesaler / Retailer / Loyalty',
    CreditLimit DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    StaffId INT UNSIGNED NULL COMMENT 'Nhân viên chăm sóc',
    CareDate DATETIME NULL COMMENT 'Ngày bắt đầu chăm sóc',
    PRIMARY KEY (UserId),
    CONSTRAINT fk_customer_user FOREIGN KEY (UserId) REFERENCES `USER` (UserId) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_customer_staff FOREIGN KEY (StaffId) REFERENCES STAFF (UserId) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Bảng khách hàng';

-- -----------------------------------------------------------------------
CREATE TABLE DRIVER (
    UserId INT UNSIGNED NOT NULL,
    LicenseNumber VARCHAR(20) NOT NULL COMMENT 'Số GPLX',
    LicenseClass VARCHAR(10) NOT NULL COMMENT 'Hạng GPLX: A1/A2/B1/B2/C/D/E/F',
    LicenseExpiryDate DATE NOT NULL COMMENT 'Ngày hết hạn GPLX',
    PRIMARY KEY (UserId),
    UNIQUE KEY uk_driver_license (LicenseNumber),
    CONSTRAINT fk_driver_user FOREIGN KEY (UserId) REFERENCES `USER` (UserId) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Bảng tài xế';

-- -----------------------------------------------------------------------
CREATE TABLE SUPERVISE (
    SuperviseeId INT UNSIGNED NOT NULL COMMENT 'Nhân viên bị quản lý',
    SupervisorId INT UNSIGNED NOT NULL COMMENT 'Người quản lý',
    ManageDate DATE NOT NULL COMMENT 'Ngày bắt đầu quản lý',
    PRIMARY KEY (SuperviseeId, SupervisorId),
    CONSTRAINT fk_supervise_ee FOREIGN KEY (SuperviseeId) REFERENCES STAFF (UserId) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_supervise_or FOREIGN KEY (SupervisorId) REFERENCES STAFF (UserId) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Bảng quan hệ quản lý-nhân viên';

-- =============================================================================
-- 2. TMS & FLEET (Tuyến đường & Phương tiện)
-- =============================================================================

CREATE TABLE VEHICLE (
    VehicleId INT UNSIGNED NOT NULL AUTO_INCREMENT,
    LicensePlate VARCHAR(15) NOT NULL COMMENT 'Biển số xe',
    VehicleType VARCHAR(50) NOT NULL COMMENT 'Loại xe: Xe máy / Xe tải / Container / Van',
    LicenseExpiryDate DATE NOT NULL COMMENT 'Ngày hết hạn đăng kiểm',
    MaxWeightCapacity DECIMAL(10, 2) NOT NULL COMMENT 'Tải trọng tối đa (kg)',
    PRIMARY KEY (VehicleId),
    UNIQUE KEY uk_vehicle_plate (LicensePlate),
    CONSTRAINT chk_vehicle_capacity CHECK (MaxWeightCapacity > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Bảng phương tiện vận tải';

-- -----------------------------------------------------------------------
CREATE TABLE DRIVER_VEHICLE (
    VehicleId INT UNSIGNED NOT NULL,
    UserId INT UNSIGNED NOT NULL COMMENT 'DriverId',
    PRIMARY KEY (VehicleId, UserId),
    CONSTRAINT fk_dv_vehicle FOREIGN KEY (VehicleId) REFERENCES VEHICLE (VehicleId) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dv_driver FOREIGN KEY (UserId) REFERENCES DRIVER (UserId) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Bảng liên kết tài xế - phương tiện';

-- -----------------------------------------------------------------------
CREATE TABLE LOCATION (
    LocationId INT UNSIGNED NOT NULL AUTO_INCREMENT,
    Address VARCHAR(255) NOT NULL,
    LocationName VARCHAR(150) NOT NULL COMMENT 'Tên địa điểm',
    LocationType VARCHAR(50) NOT NULL COMMENT 'Kho / Cảng / Trạm trung chuyển / Điểm giao',
    Latitude DECIMAL(10, 7) NULL COMMENT 'Vĩ độ',
    Longitude DECIMAL(10, 7) NULL COMMENT 'Kinh độ',
    PRIMARY KEY (LocationId)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Bảng địa điểm';

-- -----------------------------------------------------------------------
CREATE TABLE ROUTE (
    RouteId INT UNSIGNED NOT NULL AUTO_INCREMENT,
    RouteName VARCHAR(150) NOT NULL COMMENT 'Tên tuyến đường',
    RouteType VARCHAR(50) NOT NULL COMMENT 'Nội địa / Quốc tế / Đường bộ / Đường biển',
    TransitTime INT UNSIGNED NOT NULL COMMENT 'Thời gian vận chuyển dự kiến (phút)',
    PRIMARY KEY (RouteId)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Bảng tuyến đường';

-- -----------------------------------------------------------------------
CREATE TABLE ROUTE_SEGMENT (
    RouteId INT UNSIGNED NOT NULL,
    SequenceNo TINYINT UNSIGNED NOT NULL COMMENT 'Thứ tự điểm dừng trong tuyến',
    Distance DECIMAL(10, 2) NOT NULL COMMENT 'Khoảng cách đoạn này (km)',
    LocationId INT UNSIGNED NOT NULL,
    PRIMARY KEY (RouteId, SequenceNo),
    CONSTRAINT fk_rseg_route FOREIGN KEY (RouteId) REFERENCES ROUTE (RouteId) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_rseg_location FOREIGN KEY (LocationId) REFERENCES LOCATION (LocationId) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_rseg_distance CHECK (Distance > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Bảng các đoạn tuyến đường';

-- =============================================================================
-- 3. WMS (Kho bãi & Tồn kho)
-- =============================================================================

CREATE TABLE WAREHOUSE (
    WarehouseId INT UNSIGNED NOT NULL AUTO_INCREMENT,
    WarehouseType VARCHAR(50) NOT NULL COMMENT 'Kho lạnh / Kho thường / Cảng',
    Capacity DECIMAL(12, 2) NOT NULL COMMENT 'Sức chứa (m³ hoặc tấn)',
    WarehouseName VARCHAR(150) NOT NULL,
    TakeoverDate DATE NOT NULL COMMENT 'Ngày tiếp nhận vận hành',
    LocationId INT UNSIGNED NOT NULL,
    StaffId INT UNSIGNED NULL COMMENT 'Quản lý kho',
    PRIMARY KEY (WarehouseId),
    CONSTRAINT fk_wh_location FOREIGN KEY (LocationId) REFERENCES LOCATION (LocationId) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_wh_staff FOREIGN KEY (StaffId) REFERENCES STAFF (UserId) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_wh_capacity CHECK (Capacity > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Bảng kho bãi';

-- -----------------------------------------------------------------------
CREATE TABLE ITEM (
    ItemId INT UNSIGNED NOT NULL AUTO_INCREMENT,
    Description VARCHAR(255) NOT NULL COMMENT 'Mô tả hàng hóa',
    Weight DECIMAL(10, 3) NOT NULL COMMENT 'Trọng lượng (kg/đơn vị)',
    Unit VARCHAR(30) NOT NULL COMMENT 'Đơn vị: kg / cái / thùng / pallet',
    PRIMARY KEY (ItemId),
    CONSTRAINT chk_item_weight CHECK (Weight > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Bảng danh mục hàng hóa';

-- -----------------------------------------------------------------------
CREATE TABLE INVENTORY (
    InventoryId INT UNSIGNED NOT NULL AUTO_INCREMENT,
    ItemId INT UNSIGNED NOT NULL,
    Unit VARCHAR(30) NOT NULL,
    Quantity DECIMAL(12, 2) NOT NULL DEFAULT 0,
    Description VARCHAR(255) NULL,
    WarehouseId INT UNSIGNED NOT NULL,
    PRIMARY KEY (InventoryId),
    CONSTRAINT fk_inv_item FOREIGN KEY (ItemId) REFERENCES ITEM (ItemId) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_inv_warehouse FOREIGN KEY (WarehouseId) REFERENCES WAREHOUSE (WarehouseId) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_inv_qty CHECK (Quantity >= 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Bảng tồn kho';

-- =============================================================================
-- 4. OMS & DISPATCH (Đơn hàng & Điều phối)
-- =============================================================================

CREATE TABLE `ORDER` (
    OrderId INT UNSIGNED NOT NULL AUTO_INCREMENT,
    OrderDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    OrderStatus VARCHAR(30) NOT NULL DEFAULT 'Chờ xử lý' COMMENT 'Chờ xử lý / Đang xử lý / Đang vận chuyển / Đã giao / Đã hủy',
    PickupLocation INT UNSIGNED NOT NULL COMMENT 'LocationId điểm lấy hàng',
    FreightFactor DECIMAL(8, 4) NOT NULL DEFAULT 1.0000 COMMENT 'Hệ số cước',
    FreightCost DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Chi phí vận chuyển (VNĐ)',
    DeliveryLocation INT UNSIGNED NOT NULL COMMENT 'LocationId điểm giao hàng',
    DeliveredDate DATETIME NULL COMMENT 'Ngày giao hàng thực tế',
    StaffId INT UNSIGNED NULL COMMENT 'Nhân viên phụ trách',
    CustomerId INT UNSIGNED NOT NULL,
    PRIMARY KEY (OrderId),
    CONSTRAINT fk_order_pickup FOREIGN KEY (PickupLocation) REFERENCES LOCATION (LocationId) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_order_delivery FOREIGN KEY (DeliveryLocation) REFERENCES LOCATION (LocationId) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_order_staff FOREIGN KEY (StaffId) REFERENCES STAFF (UserId) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_order_customer FOREIGN KEY (CustomerId) REFERENCES CUSTOMER (UserId) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_order_cost CHECK (FreightCost >= 0),
    CONSTRAINT chk_order_factor CHECK (FreightFactor > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Bảng đơn hàng';

-- -----------------------------------------------------------------------
CREATE TABLE ITEM_ORDER (
    ItemId INT UNSIGNED NOT NULL,
    OrderId INT UNSIGNED NOT NULL,
    OrderQuantity DECIMAL(12, 2) NOT NULL COMMENT 'Số lượng hàng trong đơn',
    PRIMARY KEY (ItemId, OrderId),
    CONSTRAINT fk_io_item FOREIGN KEY (ItemId) REFERENCES ITEM (ItemId) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_io_order FOREIGN KEY (OrderId) REFERENCES `ORDER` (OrderId) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_io_qty CHECK (OrderQuantity > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Bảng chi tiết hàng hóa trong đơn hàng';

-- -----------------------------------------------------------------------
CREATE TABLE SHIPMENT (
    ShipmentId INT UNSIGNED NOT NULL AUTO_INCREMENT,
    TotalWeight DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Tổng trọng lượng (kg) - tự động tính',
    DepartureDate DATETIME NULL COMMENT 'Ngày giờ xuất phát',
    ActualArrivalTime DATETIME NULL COMMENT 'Thời gian đến thực tế',
    RouteId INT UNSIGNED NULL,
    PRIMARY KEY (ShipmentId),
    CONSTRAINT fk_shipment_route FOREIGN KEY (RouteId) REFERENCES ROUTE (RouteId) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_shipment_weight CHECK (TotalWeight >= 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Bảng chuyến hàng';

-- -----------------------------------------------------------------------
CREATE TABLE ORDER_SHIPMENT (
    OrderId INT UNSIGNED NOT NULL,
    ShipmentId INT UNSIGNED NOT NULL,
    RecordTime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian gộp đơn vào chuyến',
    ExpectedDeliveryDate DATE NULL COMMENT 'Ngày giao hàng dự kiến',
    PRIMARY KEY (OrderId, ShipmentId),
    CONSTRAINT fk_os_order FOREIGN KEY (OrderId) REFERENCES `ORDER` (OrderId) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_os_shipment FOREIGN KEY (ShipmentId) REFERENCES SHIPMENT (ShipmentId) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Bảng liên kết đơn hàng - chuyến hàng';

-- -----------------------------------------------------------------------
CREATE TABLE ASSIGNMENT (
    AssignmentId INT UNSIGNED NOT NULL AUTO_INCREMENT,
    AssignDate DATE NOT NULL COMMENT 'Ngày phân công',
    AssignmentStatus VARCHAR(30) NOT NULL DEFAULT 'Chờ xác nhận' COMMENT 'Chờ xác nhận / Đang thực hiện / Hoàn thành / Đã hủy',
    ShipmentId INT UNSIGNED NOT NULL,
    VehicleId INT UNSIGNED NOT NULL,
    UserId INT UNSIGNED NOT NULL COMMENT 'DriverId',
    PRIMARY KEY (AssignmentId),
    CONSTRAINT fk_assign_shipment FOREIGN KEY (ShipmentId) REFERENCES SHIPMENT (ShipmentId) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_assign_vehicle FOREIGN KEY (VehicleId) REFERENCES VEHICLE (VehicleId) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_assign_driver FOREIGN KEY (UserId) REFERENCES DRIVER (UserId) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Bảng phân công xe và tài xế cho chuyến hàng';

-- =============================================================================
-- 5. TRACKING (Theo dõi hành trình)
-- =============================================================================

CREATE TABLE TRACKING_LOG (
    TrackingId INT UNSIGNED NOT NULL AUTO_INCREMENT,
    OrderId INT UNSIGNED NOT NULL,
    CurrentStatus VARCHAR(100) NOT NULL COMMENT 'Trạng thái hiện tại của đơn hàng',
    Timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    LocationId INT UNSIGNED NULL COMMENT 'Vị trí địa điểm (nếu có)',
    LogLocation VARCHAR(255) NULL COMMENT 'Mô tả vị trí tự do',
    PRIMARY KEY (TrackingId),
    CONSTRAINT fk_tlog_order FOREIGN KEY (OrderId) REFERENCES `ORDER` (OrderId) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tlog_location FOREIGN KEY (LocationId) REFERENCES LOCATION (LocationId) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Bảng nhật ký theo dõi hành trình đơn hàng';
-- =============================================================================
-- LOGISTICS & SUPPLY CHAIN MANAGEMENT SYSTEM
-- Phase 1: Seed Data (Dữ liệu mẫu có ý nghĩa)
-- Tối thiểu 5 dòng mỗi bảng
-- =============================================================================

USE logistics_db;

SET NAMES utf8mb4;

SET CHARACTER SET utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;
-- Truncate theo thứ tự phụ thuộc ngược
TRUNCATE TABLE TRACKING_LOG;

TRUNCATE TABLE ASSIGNMENT;

TRUNCATE TABLE ORDER_SHIPMENT;

TRUNCATE TABLE ITEM_ORDER;

TRUNCATE TABLE `ORDER`;

TRUNCATE TABLE INVENTORY;

TRUNCATE TABLE SHIPMENT;

TRUNCATE TABLE ROUTE_SEGMENT;

TRUNCATE TABLE WAREHOUSE;

TRUNCATE TABLE ITEM;

TRUNCATE TABLE DRIVER_VEHICLE;

TRUNCATE TABLE ROUTE;

TRUNCATE TABLE LOCATION;

TRUNCATE TABLE VEHICLE;

TRUNCATE TABLE SUPERVISE;

TRUNCATE TABLE CUSTOMER;

TRUNCATE TABLE DRIVER;

TRUNCATE TABLE STAFF;

TRUNCATE TABLE USER_PHONE;

TRUNCATE TABLE `USER`;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 1. USER (15 người: 5 nhân viên, 5 khách hàng, 5 tài xế)
-- =============================================================================
INSERT INTO
    `USER` (
        Account,
        Name,
        Email,
        Status,
        Address
    )
VALUES
    -- Nhân viên
    (
        'nv.nguyenvana',
        'Nguyễn Văn A',
        'nguyenvana@logistics.vn',
        1,
        '12 Lê Lợi, Q.1, TP.HCM'
    ),
    (
        'nv.tranthib',
        'Trần Thị B',
        'tranthib@logistics.vn',
        1,
        '45 Nguyễn Huệ, Q.1, TP.HCM'
    ),
    (
        'nv.lequangc',
        'Lê Quang C',
        'lequangc@logistics.vn',
        1,
        '78 Hai Bà Trưng, Q.3, TP.HCM'
    ),
    (
        'nv.phamthid',
        'Phạm Thị D',
        'phamthid@logistics.vn',
        1,
        '23 Điện Biên Phủ, Q.Bình Thạnh, TP.HCM'
    ),
    (
        'nv.hoangvane',
        'Hoàng Văn E',
        'hoangvane@logistics.vn',
        0,
        '56 Cộng Hòa, Q.Tân Bình, TP.HCM'
    ),
    -- Khách hàng
    (
        'kh.cty_abc',
        'Công ty TNHH ABC',
        'billing@ctyabc.com',
        1,
        '100 Lý Thường Kiệt, Q.10, TP.HCM'
    ),
    (
        'kh.cty_xyz',
        'Tập đoàn XYZ',
        'purchasing@tapxyz.vn',
        1,
        '200 Nguyễn Oanh, Q.Gò Vấp, TP.HCM'
    ),
    (
        'kh.mai_thi_f',
        'Mai Thị F',
        'maithif@gmail.com',
        1,
        '88 Trần Hưng Đạo, Q.5, TP.HCM'
    ),
    (
        'kh.cty_delta',
        'Delta Imports Co.',
        'delta@deltaimport.com',
        1,
        '15 Bùi Viện, Q.1, TP.HCM'
    ),
    (
        'kh.thi_pham_g',
        'Thị Phạm G',
        'thiphamg@hotmail.com',
        0,
        '34 Âu Cơ, Q.Tân Phú, TP.HCM'
    ),
    -- Tài xế
    (
        'tx.cuongvong',
        'Cường Vong',
        'cuongvong@logistics.vn',
        1,
        '9 Kha Vạn Cân, Q.Thủ Đức, TP.HCM'
    ),
    (
        'tx.danh_nguyen',
        'Danh Nguyễn',
        'danhnguyen@logistics.vn',
        1,
        '3 Võ Văn Ngân, Q.Thủ Đức, TP.HCM'
    ),
    (
        'tx.em_tran',
        'Em Trần',
        'emtran@logistics.vn',
        1,
        '17 Lê Văn Việt, Q.9, TP.HCM'
    ),
    (
        'tx.fong_le',
        'Fong Lê',
        'fongle@logistics.vn',
        0,
        '22 Đỗ Xuân Hợp, Q.9, TP.HCM'
    ),
    (
        'tx.giang_ho',
        'Giang Hồ',
        'giangho@logistics.vn',
        1,
        '5 Linh Đông, Q.Thủ Đức, TP.HCM'
    );

-- =============================================================================
-- 2. USER_PHONE
-- =============================================================================
INSERT INTO
    USER_PHONE (UserId, Phone)
VALUES (1, '0901111001'),
    (1, '0281234567'),
    (2, '0902222002'),
    (3, '0903333003'),
    (4, '0904444004'),
    (5, '0905555005'),
    (6, '0286886001'),
    (6, '02838001234'),
    (7, '0917777007'),
    (8, '0908888008'),
    (8, '0908888088'),
    (9, '0909999009'),
    (10, '0910000010'),
    (11, '0931111011'),
    (12, '0932222012'),
    (12, '0932221212'),
    (13, '0933333013'),
    (14, '0934444014'),
    (15, '0935555015');

-- =============================================================================
-- 3. STAFF (UserId 1-5)
-- =============================================================================
INSERT INTO
    STAFF (UserId, Position, Department)
VALUES (
        1,
        'Trưởng phòng Vận hành',
        'Vận hành'
    ),
    (
        2,
        'Chuyên viên Kế hoạch',
        'Kế hoạch & Điều phối'
    ),
    (
        3,
        'Nhân viên Kinh doanh',
        'Kinh doanh'
    ),
    (4, 'Nhân viên Kho', 'Kho vận'),
    (
        5,
        'Nhân viên Điều phối',
        'Kế hoạch & Điều phối'
    );

-- =============================================================================
-- 4. SUPERVISE
-- =============================================================================
INSERT INTO
    SUPERVISE (
        SuperviseeId,
        SupervisorId,
        ManageDate
    )
VALUES (2, 1, '2024-01-15'),
    (3, 1, '2024-01-15'),
    (4, 1, '2024-03-01'),
    (5, 2, '2024-06-01');
-- Note: 1 là Trưởng phòng, không cần supervise record cho chính họ

-- =============================================================================
-- 5. CUSTOMER (UserId 6-10)
-- =============================================================================
INSERT INTO
    CUSTOMER (
        UserId,
        PayTerm,
        CustomerType,
        CreditLimit,
        StaffId,
        CareDate
    )
VALUES (
        6,
        'Net30',
        'B2B',
        50000000.00,
        3,
        '2024-02-01 09:00:00'
    ),
    (
        7,
        'Net60',
        'Wholesaler',
        200000000.00,
        3,
        '2024-02-15 09:00:00'
    ),
    (
        8,
        'COD',
        'B2C',
        2000000.00,
        3,
        '2024-03-01 09:00:00'
    ),
    (
        9,
        'Net15',
        'Retailer',
        30000000.00,
        5,
        '2024-04-01 09:00:00'
    ),
    (
        10,
        'Prepaid',
        'B2C',
        500000.00,
        5,
        '2024-05-01 09:00:00'
    );

-- =============================================================================
-- 6. DRIVER (UserId 11-15)
-- =============================================================================
INSERT INTO
    DRIVER (
        UserId,
        LicenseNumber,
        LicenseClass,
        LicenseExpiryDate
    )
VALUES (
        11,
        'GPLX-001-A2',
        'A2',
        '2027-05-20'
    ),
    (
        12,
        'GPLX-002-B2',
        'B2',
        '2028-08-15'
    ),
    (
        13,
        'GPLX-003-C',
        'C',
        '2026-11-30'
    ),
    (
        14,
        'GPLX-004-D',
        'D',
        '2025-03-10'
    ), -- Hết hạn sớm
    (
        15,
        'GPLX-005-B1',
        'B1',
        '2029-01-25'
    );

-- =============================================================================
-- 7. VEHICLE
-- =============================================================================
INSERT INTO
    VEHICLE (
        LicensePlate,
        VehicleType,
        LicenseExpiryDate,
        MaxWeightCapacity
    )
VALUES (
        '51A-12345',
        'Xe máy',
        '2027-01-01',
        150.00
    ),
    (
        '51B-23456',
        'Xe tải 1 tấn',
        '2027-06-15',
        1000.00
    ),
    (
        '51C-34567',
        'Xe tải 5 tấn',
        '2028-03-20',
        5000.00
    ),
    (
        '51D-45678',
        'Container 20ft',
        '2026-12-31',
        20000.00
    ),
    (
        '51E-56789',
        'Van Refrigerated',
        '2028-09-10',
        800.00
    );

-- =============================================================================
-- 8. DRIVER_VEHICLE
-- =============================================================================
INSERT INTO
    DRIVER_VEHICLE (VehicleId, UserId)
VALUES (1, 11), -- Cường Vong lái xe máy
    (2, 12), -- Danh Nguyễn lái xe tải 1 tấn
    (3, 13), -- Em Trần lái xe tải 5 tấn
    (4, 13), -- Em Trần cũng lái Container
    (4, 14), -- Fong Lê lái Container
    (5, 15), -- Giang Hồ lái Van
    (2, 15), -- Giang Hồ cũng lái xe tải 1 tấn
    (3, 15);
-- Giang Hồ cũng lái xe tải 5 tấn (cần cho ASSIGNMENT 5)


-- =============================================================================
-- THÊM 5 PHƯƠNG TIỆN MỚI (Giả định ID tự động tăng sẽ là 6, 7, 8, 9, 10)
-- =============================================================================
INSERT INTO
    VEHICLE (LicensePlate, VehicleType, LicenseExpiryDate, MaxWeightCapacity)
VALUES 
    ('51F-11111', 'Xe tải 2 tấn', '2028-12-31', 2000.00),     -- VehicleId: 6
    ('51G-22222', 'Xe tải 10 tấn', '2027-11-20', 10000.00),   -- VehicleId: 7
    ('51H-33333', 'Container 40ft', '2028-06-15', 30000.00),  -- VehicleId: 8
    ('51K-44444', 'Xe tải trung 3.5T', '2027-09-09', 3500.00),-- VehicleId: 9
    ('51L-55555', 'Xe bán tải', '2029-01-01', 900.00);        -- VehicleId: 10

-- =============================================================================
-- GÁN 5 XE MỚI CHO TẤT CẢ TÀI XẾ (UserId từ 11 đến 15)
-- =============================================================================
INSERT INTO
    DRIVER_VEHICLE (VehicleId, UserId)
VALUES 
    -- Gán Xe 6 (Tải 2 tấn) cho tất cả 5 tài xế
    (6, 11), (6, 12), (6, 13), (6, 14), (6, 15),
    
    -- Gán Xe 7 (Tải 10 tấn) cho tất cả 5 tài xế
    (7, 11), (7, 12), (7, 13), (7, 14), (7, 15),
    
    -- Gán Xe 8 (Container 40ft) cho tất cả 5 tài xế
    (8, 11), (8, 12), (8, 13), (8, 14), (8, 15),
    
    -- Gán Xe 9 (Tải trung 3.5T) cho tất cả 5 tài xế
    (9, 11), (9, 12), (9, 13), (9, 14), (9, 15),
    
    -- Gán Xe 10 (Xe bán tải) cho tất cả 5 tài xế
    (10, 11), (10, 12), (10, 13), (10, 14), (10, 15);

-- =============================================================================
-- 9. LOCATION
-- =============================================================================
INSERT INTO
    LOCATION (
        Address,
        LocationName,
        LocationType,
        Latitude,
        Longitude
    )
VALUES (
        'KCN Sóng Thần, Bình Dương',
        'Kho Sóng Thần',
        'Kho',
        10.9764280,
        106.7085860
    ),
    (
        'Cảng Cát Lái, Q.2, TP.HCM',
        'Cảng Cát Lái',
        'Cảng',
        10.7707160,
        106.7759180
    ),
    (
        'KCN Long Hậu, Long An',
        'Kho Long Hậu',
        'Kho',
        10.6123450,
        106.6456780
    ),
    (
        '46 Bến Vân Đồn, Q.4, TP.HCM',
        'Trạm Q.4',
        'Trạm trung chuyển',
        10.7572040,
        106.6978350
    ),
    (
        'Đường Nguyễn Văn Linh, Q.7, TP.HCM',
        'Trạm Nam Sài Gòn',
        'Trạm trung chuyển',
        10.7335450,
        106.6987230
    ),
    (
        'KCN Amata, Biên Hòa, Đồng Nai',
        'Kho Amata Đồng Nai',
        'Kho',
        10.9462310,
        106.8814790
    ),
    (
        'Số 10 Hà Nội, Đà Nẵng',
        'Kho Đà Nẵng',
        'Kho',
        16.0606720,
        108.1879140
    ),
    (
        '255 Lê Thánh Tông, Hà Nội',
        'Văn phòng Hà Nội',
        'Điểm giao',
        21.0113380,
        105.8430390
    ),
    (
        '100 Lý Thường Kiệt, Q.10, TP.HCM',
        'VP Công ty ABC',
        'Điểm giao',
        10.7693580,
        106.6661820
    ),
    (
        '200 Nguyễn Oanh, Q.Gò Vấp, TP.HCM',
        'VP Tập đoàn XYZ',
        'Điểm giao',
        10.8292760,
        106.6728650
    );

-- =============================================================================
-- 10. ROUTE
-- =============================================================================
INSERT INTO
    ROUTE (
        RouteName,
        RouteType,
        TransitTime
    )
VALUES (
        'TP.HCM → Bình Dương (Quốc lộ 13)',
        'Đường bộ nội địa',
        90
    ),
    (
        'TP.HCM → Đồng Nai (Xa lộ HN)',
        'Đường bộ nội địa',
        120
    ),
    (
        'TP.HCM → Long An (QL1A)',
        'Đường bộ nội địa',
        75
    ),
    (
        'Cảng Cát Lái → Kho Sóng Thần',
        'Đường bộ nội địa',
        60
    ),
    (
        'TP.HCM → Đà Nẵng (QL1A)',
        'Đường bộ liên tỉnh',
        960
    );

-- =============================================================================
-- 11. ROUTE_SEGMENT
-- =============================================================================
INSERT INTO
    ROUTE_SEGMENT (
        RouteId,
        SequenceNo,
        Distance,
        LocationId
    )
VALUES
    -- Route 1: HCM → Bình Dương
    (1, 1, 15.50, 4), -- Trạm Q.4
    (1, 2, 22.30, 5), -- Trạm Nam Sài Gòn
    (1, 3, 30.20, 1), -- Kho Sóng Thần (đích)
    -- Route 2: HCM → Đồng Nai
    (2, 1, 18.00, 4), -- Trạm Q.4
    (2, 2, 40.50, 6), -- Kho Amata Đồng Nai (đích)
    -- Route 3: HCM → Long An
    (3, 1, 12.00, 5), -- Trạm Nam Sài Gòn
    (3, 2, 35.70, 3), -- Kho Long Hậu (đích)
    -- Route 4: Cảng → Kho Sóng Thần
    (4, 1, 28.00, 2), -- Cảng Cát Lái
    (4, 2, 25.00, 1), -- Kho Sóng Thần
    -- Route 5: HCM → Đà Nẵng
    (5, 1, 18.00, 4), -- Trạm Q.4
    (5, 2, 285.00, 5), -- Trạm Nam Sài Gòn
    (5, 3, 520.00, 7);
-- Kho Đà Nẵng (đích)

-- =============================================================================
-- 12. WAREHOUSE
-- =============================================================================
INSERT INTO
    WAREHOUSE (
        WarehouseType,
        Capacity,
        WarehouseName,
        TakeoverDate,
        LocationId,
        StaffId
    )
VALUES (
        'Kho thường',
        5000.00,
        'Kho Sóng Thần - KV1',
        '2020-01-10',
        1,
        4
    ),
    (
        'Kho lạnh',
        1200.00,
        'Kho Lạnh Cát Lái',
        '2021-06-15',
        2,
        4
    ),
    (
        'Kho thường',
        3000.00,
        'Kho Long Hậu Long An',
        '2022-03-20',
        3,
        4
    ),
    (
        'Kho thường',
        8000.00,
        'Kho Amata Đồng Nai',
        '2019-11-01',
        6,
        4
    ),
    (
        'Cảng',
        2000.00,
        'Bãi Cảng Cát Lái',
        '2023-05-01',
        2,
        2
    );

-- =============================================================================
-- 13. ITEM
-- =============================================================================
INSERT INTO
    ITEM (Description, Weight, Unit)
VALUES (
        'Điện thoại thông minh Samsung Galaxy S25',
        0.185,
        'Hộp'
    ),
    (
        'Laptop Dell XPS 15 inch',
        2.100,
        'Cái'
    ),
    (
        'Tivi OLED LG 55 inch',
        18.500,
        'Cái'
    ),
    (
        'Gạo ST25 đóng bao 25kg',
        25.000,
        'Bao'
    ),
    (
        'Linh kiện ô tô (Bộ phanh ABS)',
        5.800,
        'Bộ'
    ),
    (
        'Mỹ phẩm Shiseido (Hộp 12 chai)',
        4.200,
        'Thùng'
    ),
    (
        'Vải cotton cuộn 50m',
        22.000,
        'Cuộn'
    ),
    (
        'Phân bón NPK 30kg',
        30.000,
        'Bao'
    );

-- =============================================================================
-- 14. INVENTORY
-- =============================================================================
INSERT INTO
    INVENTORY (
        ItemId,
        Unit,
        Quantity,
        Description,
        WarehouseId
    )
VALUES (
        1,
        'Hộp',
        500.00,
        'Lô hàng điện thoại nhập từ Samsung VN',
        1
    ),
    (
        2,
        'Cái',
        120.00,
        'Laptop xuất khẩu qua Cảng Cát Lái',
        2
    ),
    (
        3,
        'Cái',
        80.00,
        'Tivi tồn kho chờ phân phối',
        1
    ),
    (
        4,
        'Bao',
        2000.00,
        'Gạo ST25 vụ mới Long An',
        3
    ),
    (
        5,
        'Bộ',
        350.00,
        'Linh kiện nhập từ Nhật qua Cảng Cát Lái',
        2
    ),
    (
        6,
        'Thùng',
        200.00,
        'Mỹ phẩm kho lạnh Cát Lái',
        2
    ),
    (
        7,
        'Cuộn',
        1500.00,
        'Vải cotton nhập từ Đồng Nai',
        4
    ),
    (
        8,
        'Bao',
        3000.00,
        'Phân bón kho Long An',
        3
    );

-- =============================================================================
-- 15. SHIPMENT (tạo trước ORDER vì ORDER_SHIPMENT cần cả 2)
-- =============================================================================
INSERT INTO
    SHIPMENT (
        TotalWeight,
        DepartureDate,
        ActualArrivalTime,
        RouteId
    )
VALUES (
        0.00,
        '2026-04-01 06:00:00',
        '2026-04-01 07:30:00',
        1
    ),
    (
        0.00,
        '2026-04-03 08:00:00',
        '2026-04-03 10:00:00',
        2
    ),
    (
        0.00,
        '2026-04-05 07:00:00',
        '2026-04-05 08:30:00',
        3
    ),
    (
        0.00,
        '2026-04-10 05:00:00',
        NULL,
        4
    ),
    (
        0.00,
        '2026-04-15 20:00:00',
        NULL,
        5
    );
-- TotalWeight sẽ được tự động cập nhật bởi TRIGGER AFTER INSERT ORDER_SHIPMENT

-- =============================================================================
-- 16. ORDER
-- =============================================================================
INSERT INTO
    `ORDER` (
        OrderDate,
        OrderStatus,
        PickupLocation,
        FreightFactor,
        FreightCost,
        DeliveryLocation,
        DeliveredDate,
        StaffId,
        CustomerId
    )
VALUES (
        '2026-03-28 09:00:00',
        'Đã giao',
        1,
        1.0000,
        850000.00,
        9,
        '2026-04-01 07:30:00',
        2,
        6
    ),
    (
        '2026-03-30 14:00:00',
        'Đã giao',
        2,
        1.2000,
        2400000.00,
        6,
        '2026-04-03 10:00:00',
        3,
        7
    ),
    (
        '2026-04-02 10:00:00',
        'Đang vận chuyển',
        3,
        1.0000,
        450000.00,
        10,
        NULL,
        2,
        8
    ),
    (
        '2026-04-08 11:00:00',
        'Đang xử lý',
        1,
        1.5000,
        3600000.00,
        6,
        NULL,
        5,
        9
    ),
    (
        '2026-04-12 16:00:00',
        'Chờ xử lý',
        2,
        1.0000,
        900000.00,
        7,
        NULL,
        3,
        6
    ),
    (
        '2026-04-14 09:00:00',
        'Chờ xử lý',
        1,
        1.0000,
        760000.00,
        8,
        NULL,
        5,
        7
    );

-- =============================================================================
-- 17. ITEM_ORDER
-- =============================================================================
INSERT INTO
    ITEM_ORDER (
        ItemId,
        OrderId,
        OrderQuantity
    )
VALUES (1, 1, 50.00), -- 50 hộp điện thoại cho đơn 1
    (3, 1, 2.00), -- 2 cái tivi cho đơn 1
    (2, 2, 30.00), -- 30 laptop cho đơn 2
    (5, 2, 20.00), -- 20 bộ linh kiện cho đơn 2
    (4, 3, 100.00), -- 100 bao gạo cho đơn 3
    (6, 4, 40.00), -- 40 thùng mỹ phẩm cho đơn 4
    (7, 5, 15.00), -- 15 cuộn vải cho đơn 5
    (8, 5, 50.00), -- 50 bao phân bón cho đơn 5
    (1, 6, 20.00);
-- 20 hộp điện thoại cho đơn 6

-- =============================================================================
-- 18. ORDER_SHIPMENT (gộp đơn vào chuyến)
-- =============================================================================
INSERT INTO
    ORDER_SHIPMENT (
        OrderId,
        ShipmentId,
        RecordTime,
        ExpectedDeliveryDate
    )
VALUES (
        1,
        1,
        '2026-03-29 17:00:00',
        '2026-04-01'
    ),
    (
        2,
        2,
        '2026-03-31 10:00:00',
        '2026-04-03'
    ),
    (
        3,
        3,
        '2026-04-03 08:00:00',
        '2026-04-05'
    ),
    (
        4,
        4,
        '2026-04-09 09:00:00',
        '2026-04-11'
    ),
    (
        5,
        5,
        '2026-04-13 15:00:00',
        '2026-04-17'
    ),
    (
        6,
        5,
        '2026-04-14 10:00:00',
        '2026-04-17'
    );
-- Trigger AFTER INSERT sẽ tự động tính lại TotalWeight cho SHIPMENT

-- =============================================================================
-- 19. ASSIGNMENT
-- =============================================================================
INSERT INTO
    ASSIGNMENT (
        AssignDate,
        AssignmentStatus,
        ShipmentId,
        VehicleId,
        UserId
    )
VALUES (
        '2026-03-29',
        'Hoàn thành',
        1,
        2,
        12
    ),
    (
        '2026-03-31',
        'Hoàn thành',
        2,
        3,
        13
    ),
    (
        '2026-04-03',
        'Đang thực hiện',
        3,
        2,
        12
    ),
    (
        '2026-04-09',
        'Chờ xác nhận',
        4,
        4,
        13
    ),
    (
        '2026-04-13',
        'Chờ xác nhận',
        5,
        3,
        15
    );
-- Trigger BEFORE INSERT sẽ kiểm tra TotalWeight vs MaxWeightCapacity

-- =============================================================================
-- 20. TRACKING_LOG
-- =============================================================================
INSERT INTO
    TRACKING_LOG (
        OrderId,
        CurrentStatus,
        Timestamp,
        LocationId,
        LogLocation
    )
VALUES (
        1,
        'Đơn hàng được tạo',
        '2026-03-28 09:05:00',
        NULL,
        'Hệ thống'
    ),
    (
        1,
        'Đã xác nhận và chuẩn bị hàng',
        '2026-03-29 11:00:00',
        1,
        'Kho Sóng Thần - KV1'
    ),
    (
        1,
        'Xe đã xuất phát',
        '2026-04-01 06:10:00',
        4,
        'Trạm Q.4'
    ),
    (
        1,
        'Đã giao hàng thành công',
        '2026-04-01 07:35:00',
        9,
        'VP Công ty ABC - Q.10'
    ),
    (
        2,
        'Đơn hàng được tạo',
        '2026-03-30 14:10:00',
        NULL,
        'Hệ thống'
    ),
    (
        2,
        'Đang đóng gói tại cảng',
        '2026-03-31 08:00:00',
        2,
        'Cảng Cát Lái'
    ),
    (
        2,
        'Xe container xuất phát',
        '2026-04-03 08:15:00',
        6,
        'Kho Amata - Đồng Nai'
    ),
    (
        2,
        'Giao hàng thành công',
        '2026-04-03 10:05:00',
        6,
        'Kho Amata Đồng Nai'
    ),
    (
        3,
        'Đơn hàng được tạo',
        '2026-04-02 10:05:00',
        NULL,
        'Hệ thống'
    ),
    (
        3,
        'Đang lấy hàng tại kho Long An',
        '2026-04-03 07:00:00',
        3,
        'Kho Long Hậu Long An'
    ),
    (
        3,
        'Đang vận chuyển',
        '2026-04-05 07:10:00',
        5,
        'Trạm Nam Sài Gòn'
    ),
    (
        4,
        'Đơn hàng được tạo',
        '2026-04-08 11:05:00',
        NULL,
        'Hệ thống'
    ),
    (
        4,
        'Đang xử lý tại kho',
        '2026-04-09 09:00:00',
        1,
        'Kho Sóng Thần - KV1'
    ),
    (
        5,
        'Đơn hàng được tạo',
        '2026-04-12 16:05:00',
        NULL,
        'Hệ thống'
    ),
    (
        6,
        'Đơn hàng được tạo',
        '2026-04-14 09:05:00',
        NULL,
        'Hệ thống'
    );

-- =============================================================================
-- Tính lại TotalWeight thủ công (Trigger chưa load ở Phase 1)
-- Sau khi load Phase 2 triggers, mọi INSERT mới sẽ tự động tính
-- =============================================================================
UPDATE SHIPMENT s
SET
    TotalWeight = (
        SELECT COALESCE(
                SUM(io.OrderQuantity * i.Weight), 0
            )
        FROM
            ORDER_SHIPMENT os
            INNER JOIN ITEM_ORDER io ON os.OrderId = io.OrderId
            INNER JOIN ITEM i ON io.ItemId = i.ItemId
        WHERE
            os.ShipmentId = s.ShipmentId
    );

SELECT 'Phase 1 — Seed Data hoàn tất!' AS Status;

SELECT ShipmentId, ROUND(TotalWeight, 2) AS TotalWeight_kg
FROM SHIPMENT
ORDER BY ShipmentId;
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
        BEGIN
            DECLARE v_err_msg VARCHAR(255);
            SET v_err_msg = CONCAT(
            'Lỗi: Phương tiện quá tải! ',
            'Tổng trọng lượng chuyến hàng: ', ROUND(v_total_weight, 2), ' kg — ',
            'Tải trọng tối đa của xe [', v_vehicle_plate, ' - ', v_vehicle_type, ']: ',
            ROUND(v_max_capacity, 2), ' kg. ',
            'Vui lòng chọn phương tiện có tải trọng lớn hơn hoặc tách chuyến hàng.'
        );
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_err_msg;
        END;
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
        BEGIN
            DECLARE v_err_msg VARCHAR(255);
            SET v_err_msg = CONCAT(
            'Lỗi: Không thể chỉnh sửa đơn hàng đã ở trạng thái "',
            OLD.OrderStatus,
            '"! Chỉ có thể cập nhật đơn hàng ở trạng thái Chờ xử lý hoặc Đang xử lý.'
        );
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_err_msg;
        END;
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

DELIMITER ;

SELECT 'Phase 2 — Triggers: OK' AS Status;
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
           v.LicenseExpiryDate, v.MaxWeightCapacity, v.Status,
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
        BEGIN
            DECLARE v_err_msg VARCHAR(255);
            SET v_err_msg = CONCAT(
            'Lỗi: Không thể xóa phương tiện [', v_plate, '] vì đã có lịch sử phân công vận chuyển! ',
            'Hãy vô hiệu hóa thay vì xóa để giữ toàn vẹn dữ liệu.'
        );
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_err_msg;
        END;
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

DELIMITER ;

SELECT 'Phase 2 — Vehicle Procedures: OK' AS Status;
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
        BEGIN
            DECLARE v_err_msg VARCHAR(255);
            SET v_err_msg = CONCAT('Lỗi: Không thể sửa đơn hàng ở trạng thái "', v_status, '"!');
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_err_msg;
        END;
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
        BEGIN
            DECLARE v_err_msg VARCHAR(255);
            SET v_err_msg = CONCAT(
            'Lỗi: Chỉ có thể xóa đơn hàng ở trạng thái "Chờ xử lý". ',
            'Đơn hàng hiện tại đang ở trạng thái "', v_status, '".'
        );
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_err_msg;
        END;
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
        BEGIN
            DECLARE v_err_msg VARCHAR(255);
            SET v_err_msg = CONCAT('Lỗi: Không thể hủy đơn hàng đã ở trạng thái "', v_status, '"!');
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_err_msg;
        END;
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

DELIMITER ;

SELECT 'Phase 2 — Order Procedures: OK' AS Status;
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
        BEGIN
            DECLARE v_err_msg VARCHAR(255);
            SET v_err_msg = CONCAT(
            'Lỗi: Không thể gộp đơn hàng đang ở trạng thái "', v_order_status, '" vào chuyến!'
        );
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_err_msg;
        END;
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

DELIMITER ;

SELECT 'Phase 2 — Assignment/Shipment Procedures: OK' AS Status;
-- =============================================================================
-- Phase 2 — File 5: Dashboard Stats & Report Procedures + Function
-- =============================================================================
USE logistics_db;

SET NAMES utf8mb4;

SET CHARACTER SET utf8mb4;

DROP PROCEDURE IF EXISTS sp_DashboardStats;

DROP PROCEDURE IF EXISTS sp_GetTrackingLogs;

DROP PROCEDURE IF EXISTS sp_GetMonthlyRevenue;

DROP FUNCTION IF EXISTS fn_CalculateDriverBonus;

DELIMITER $$

-- =============================================================================
-- sp_DashboardStats: Thống kê tổng quan Dashboard
-- Trả về nhiều result set để frontend đọc tuần tự
-- =============================================================================
CREATE PROCEDURE sp_DashboardStats(IN p_Month INT, IN p_Year INT)
BEGIN
    DECLARE v_month INT DEFAULT COALESCE(p_Month, MONTH(CURDATE()));
    DECLARE v_year  INT DEFAULT COALESCE(p_Year,  YEAR(CURDATE()));

    -- ── Card 1: KPIs Tổng quan ──────────────────────────────────────────────
    SELECT
        (SELECT COUNT(*) FROM VEHICLE)                          AS TotalVehicles,
        (SELECT COUNT(*) FROM VEHICLE
            WHERE LicenseExpiryDate >= CURDATE())               AS ActiveVehicles,
        (SELECT COUNT(*) FROM ASSIGNMENT
            WHERE AssignmentStatus = 'Đang thực hiện')         AS ActiveShipments,
        (SELECT COUNT(*) FROM `ORDER`
            WHERE OrderStatus = 'Chờ xử lý')                   AS PendingOrders,
        (SELECT COUNT(*) FROM `ORDER`
            WHERE OrderStatus = 'Đang vận chuyển')             AS InTransitOrders,
        (SELECT COUNT(*) FROM DRIVER
            INNER JOIN `USER` u ON DRIVER.UserId = u.UserId
            WHERE u.Status = 1)                                  AS ActiveDrivers,
        -- Doanh thu tháng hiện tại
        (SELECT COALESCE(SUM(o.FreightCost), 0)
            FROM `ORDER` o
            WHERE o.OrderStatus = 'Đã giao'
              AND MONTH(o.DeliveredDate) = v_month
              AND YEAR(o.DeliveredDate)  = v_year)              AS MonthlyRevenue,
        -- Tổng đơn hàng tháng hiện tại
        (SELECT COUNT(*) FROM `ORDER`
            WHERE MONTH(OrderDate) = v_month
              AND YEAR(OrderDate)  = v_year)                    AS MonthlyOrders;

    -- ── Card 2: Doanh thu 6 tháng gần nhất (cho biểu đồ Line chart) ─────────
    SELECT
        DATE_FORMAT(o.OrderDate, '%Y-%m') AS MonthLabel,
        COUNT(o.OrderId)                  AS TotalOrders,
        COALESCE(SUM(CASE WHEN o.OrderStatus = 'Đã giao' THEN o.FreightCost ELSE 0 END), 0) AS Revenue
    FROM `ORDER` o
    WHERE o.OrderDate >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    GROUP BY DATE_FORMAT(o.OrderDate, '%Y-%m')
    ORDER BY MonthLabel ASC;

    -- ── Card 3: Phân phối trạng thái đơn hàng (cho Pie chart) ───────────────
    SELECT
        OrderStatus,
        COUNT(*) AS Count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM `ORDER`), 1) AS Percentage
    FROM `ORDER`
    GROUP BY OrderStatus
    ORDER BY Count DESC;

    -- ── Card 4: Top 5 khách hàng theo doanh thu ──────────────────────────────
    SELECT
        u.UserId, u.Name AS CustomerName, c.CustomerType,
        COUNT(o.OrderId)           AS TotalOrders,
        SUM(o.FreightCost)         AS TotalRevenue
    FROM `ORDER` o
    INNER JOIN CUSTOMER c ON o.CustomerId = c.UserId
    INNER JOIN `USER`   u ON c.UserId     = u.UserId
    WHERE o.OrderStatus = 'Đã giao'
    GROUP BY u.UserId
    ORDER BY TotalRevenue DESC
    LIMIT 5;

    -- ── Card 5: 5 đơn hàng mới nhất ─────────────────────────────────────────
    SELECT
        o.OrderId, o.OrderDate, o.OrderStatus,
        lp.LocationName AS From_Location,
        ld.LocationName AS To_Location,
        o.FreightCost,
        u.Name AS CustomerName
    FROM `ORDER` o
    LEFT JOIN LOCATION lp ON o.PickupLocation   = lp.LocationId
    LEFT JOIN LOCATION ld ON o.DeliveryLocation = ld.LocationId
    LEFT JOIN `USER`   u  ON o.CustomerId       = u.UserId
    ORDER BY o.OrderDate DESC
    LIMIT 5;
END$$

-- =============================================================================
-- sp_GetTrackingLogs: Lấy lịch sử tracking của đơn hàng
-- =============================================================================
CREATE PROCEDURE sp_GetTrackingLogs(
    IN p_OrderId    INT UNSIGNED,
    IN p_Limit      INT
)
BEGIN
    DECLARE v_limit INT DEFAULT COALESCE(p_Limit, 50);

    SELECT
        tl.TrackingId, tl.OrderId, tl.CurrentStatus,
        tl.Timestamp, tl.LogLocation,
        l.LocationName, l.Latitude, l.Longitude
    FROM TRACKING_LOG tl
    LEFT JOIN LOCATION l ON tl.LocationId = l.LocationId
    WHERE (p_OrderId IS NULL OR p_OrderId = 0 OR tl.OrderId = p_OrderId)
    ORDER BY tl.Timestamp DESC
    LIMIT v_limit;
END$$

-- =============================================================================
-- sp_GetMonthlyRevenue: Báo cáo doanh thu theo tháng
-- =============================================================================
CREATE PROCEDURE sp_GetMonthlyRevenue(IN p_Year INT)
BEGIN
    DECLARE v_year INT DEFAULT COALESCE(p_Year, YEAR(CURDATE()));

    SELECT
        MONTH(o.DeliveredDate)                       AS Month,
        DATE_FORMAT(o.DeliveredDate, '%m/%Y')        AS MonthLabel,
        COUNT(o.OrderId)                             AS DeliveredOrders,
        COALESCE(SUM(o.FreightCost), 0)              AS Revenue,
        COALESCE(AVG(o.FreightCost), 0)              AS AvgOrderValue
    FROM `ORDER` o
    WHERE o.OrderStatus = 'Đã giao'
      AND YEAR(o.DeliveredDate) = v_year
    GROUP BY MONTH(o.DeliveredDate)
    ORDER BY Month ASC;
END$$

-- =============================================================================
-- fn_CalculateDriverBonus: Tính thưởng tháng cho tài xế
-- Dựa trên tổng khoảng cách (km) các tuyến đã hoàn thành trong tháng
-- Thưởng: 0-500km: 0đ | 501-1000km: 500,000đ | >1000km: 1,200,000đ
-- Sử dụng CURSOR + LOOP + IF theo yêu cầu
-- =============================================================================
CREATE FUNCTION fn_CalculateDriverBonus(
    p_DriverId  INT UNSIGNED,
    p_Month     INT,
    p_Year      INT
)
RETURNS DECIMAL(12, 2)
READS SQL DATA
DETERMINISTIC
BEGIN
    -- Biến CURSOR
    DECLARE v_done          TINYINT DEFAULT FALSE;
    DECLARE v_route_id      INT UNSIGNED;
    DECLARE v_segment_dist  DECIMAL(10, 2);
    DECLARE v_total_dist    DECIMAL(12, 2) DEFAULT 0;
    DECLARE v_bonus         DECIMAL(12, 2) DEFAULT 0;

    -- CURSOR: lấy tất cả assignment đã hoàn thành của tài xế trong tháng
    -- JOIN sang SHIPMENT → ROUTE → ROUTE_SEGMENT để tính tổng khoảng cách
    DECLARE cur_routes CURSOR FOR
        SELECT rs.RouteId, SUM(rs.Distance) AS SegmentDist
        FROM ASSIGNMENT a
        INNER JOIN SHIPMENT s ON a.ShipmentId = s.ShipmentId
        INNER JOIN ROUTE_SEGMENT rs ON s.RouteId = rs.RouteId
        WHERE a.UserId = p_DriverId
          AND a.AssignmentStatus = 'Hoàn thành'
          AND MONTH(a.AssignDate) = p_Month
          AND YEAR(a.AssignDate)  = p_Year
        GROUP BY rs.RouteId;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    -- Mở CURSOR
    OPEN cur_routes;

    -- LOOP qua từng tuyến đường đã chạy
    read_loop: LOOP
        FETCH cur_routes INTO v_route_id, v_segment_dist;

        IF v_done THEN
            LEAVE read_loop;
        END IF;

        -- Cộng dồn khoảng cách
        SET v_total_dist = v_total_dist + v_segment_dist;
    END LOOP;

    CLOSE cur_routes;

    -- Tính tiền thưởng dựa trên tổng khoảng cách (IF / ELSEIF)
    IF v_total_dist = 0 THEN
        SET v_bonus = 0;
    ELSEIF v_total_dist <= 500 THEN
        -- Dưới 500km: thưởng cơ bản 200,000đ
        SET v_bonus = 200000;
    ELSEIF v_total_dist <= 1000 THEN
        -- 501-1000km: thưởng 500,000đ + (dist - 500) * 600đ/km
        SET v_bonus = 500000 + (v_total_dist - 500) * 600;
    ELSE
        -- Trên 1000km: thưởng 1,200,000đ + (dist - 1000) * 1000đ/km (tối đa 3,000,000đ)
        SET v_bonus = LEAST(1200000 + (v_total_dist - 1000) * 1000, 3000000);
    END IF;

    RETURN v_bonus;
END$$
DELIMITER ;


-- 1. Thêm 2 cột Status và Notes vào bảng VEHICLE
ALTER TABLE VEHICLE
ADD COLUMN Status VARCHAR(50) DEFAULT 'Sẵn sàng',
ADD COLUMN Notes TEXT;

-- 2. Xóa các Procedure cũ
DROP PROCEDURE IF EXISTS sp_CreateVehicle;
DROP PROCEDURE IF EXISTS sp_UpdateVehicle;

-- 3. Tạo lại Procedure Create (Nhận 6 tham số)
DELIMITER //
CREATE PROCEDURE sp_CreateVehicle(
    IN p_LicensePlate VARCHAR(20),
    IN p_VehicleType VARCHAR(50),
    IN p_LicenseExpiryDate DATE,
    IN p_MaxWeightCapacity DECIMAL(10,2),
    IN p_Status VARCHAR(50),
    IN p_Notes TEXT
)
BEGIN
    INSERT INTO VEHICLE (LicensePlate, VehicleType, LicenseExpiryDate, MaxWeightCapacity, Status, Notes)
    VALUES (p_LicensePlate, p_VehicleType, p_LicenseExpiryDate, p_MaxWeightCapacity, p_Status, p_Notes);
    
    SELECT * FROM VEHICLE WHERE VehicleId = LAST_INSERT_ID();
END //
DELIMITER ;

-- 4. Tạo lại Procedure Update (Nhận 7 tham số)
DELIMITER //
CREATE PROCEDURE sp_UpdateVehicle(
    IN p_VehicleId INT,
    IN p_LicensePlate VARCHAR(20),
    IN p_VehicleType VARCHAR(50),
    IN p_LicenseExpiryDate DATE,
    IN p_MaxWeightCapacity DECIMAL(10,2),
    IN p_Status VARCHAR(50),
    IN p_Notes TEXT
)
BEGIN
    UPDATE VEHICLE 
    SET LicensePlate = p_LicensePlate,
        VehicleType = p_VehicleType,
        LicenseExpiryDate = p_LicenseExpiryDate,
        MaxWeightCapacity = p_MaxWeightCapacity,
        Status = p_Status,
        Notes = p_Notes
    WHERE VehicleId = p_VehicleId;
    
    SELECT * FROM VEHICLE WHERE VehicleId = p_VehicleId;
END //
DELIMITER ;


SELECT 'Phase 2 — Dashboard & Function: OK' AS Status;




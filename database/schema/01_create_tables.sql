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



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
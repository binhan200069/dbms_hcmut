USE logistics_db;

DELETE FROM `ORDER`;

DELETE FROM `CUSTOMER`;

DELETE FROM `USER`;

ALTER TABLE `ORDER` AUTO_INCREMENT = 1;

ALTER TABLE `USER` AUTO_INCREMENT = 1;

INSERT INTO
    `USER` (Name, Phone)
VALUES (
        'Nguyen Thi Minh Anh',
        '0903123456'
    ),
    ('Tran Quoc Bao', '0912233445'),
    ('Le Hoang Ngan', '0938877665'),
    ('Pham Gia Han', '0987766554'),
    ('Vo Minh Khoa', '0973355779');

INSERT INTO
    `CUSTOMER` (UserId, CustomerType)
VALUES (1, 'Doanh nghiệp'),
    (2, 'Cá nhân'),
    (3, 'Đại lý'),
    (4, 'SME'),
    (5, 'Khách VIP');

INSERT INTO
    `ORDER` (
        OrderDate,
        OrderStatus,
        PickupLocation,
        DeliveryLocation,
        FreightCost,
        CustomerId
    )
VALUES (
        '2026-04-10 09:15:00',
        'Pending',
        '12 Nguyen Hue, Ben Nghe, Quan 1, TP HCM',
        '101 Tran Hung Dao, Hoan Kiem, Ha Noi',
        1850000.00,
        1
    ),
    (
        '2026-04-09 14:20:00',
        'Processing',
        '58 Le Loi, Ben Thanh, Quan 1, TP HCM',
        '45 Ba Trieu, Hai Ba Trung, Ha Noi',
        1320000.00,
        1
    ),
    (
        '2026-04-08 08:45:00',
        'Delivered',
        '91 Cach Mang Thang 8, Phuong 7, Quan 3, TP HCM',
        '27 Pham Ngoc Thach, Dong Da, Ha Noi',
        980000.00,
        2
    ),
    (
        '2026-04-07 16:10:00',
        'Cancelled',
        '220 Dien Bien Phu, Vo Thi Sau, Quan 3, TP HCM',
        '65 Tran Duy Hung, Cau Giay, Ha Noi',
        1560000.00,
        3
    ),
    (
        '2026-04-06 11:30:00',
        'Pending',
        '9 Nguyen Oanh, Phuong 10, Go Vap, TP HCM',
        '12 Le Duc Tho, Nam Tu Liem, Ha Noi',
        2100000.00,
        4
    );
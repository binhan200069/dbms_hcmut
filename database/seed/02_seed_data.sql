-- Active: 1776502546686@@127.0.0.1@3306
USE logistics_db;

DELETE FROM `ORDER`;

DELETE FROM `CUSTOMER`;

DELETE FROM `USER`;

ALTER TABLE `ORDER` AUTO_INCREMENT = 1;

ALTER TABLE `USER` AUTO_INCREMENT = 1;

start transaction;
insert into user(Account, Name, Email, Status) values
	('A1', 'Staff1', 'A1@gmail.com', 1),
    ('A2', 'Staff2', 'A2@gmail.com', 1),
    ('A3', 'Staff3', 'A3@gmail.com', 1),
    ('A4', 'Staff4', 'A4@gmail.com', 0),
    ('A5', 'Staff5', 'A5@gmail.com', default),
	('A6', 'Customer1', 'C1@gmail.com', 1),
    ('A7', 'Customer2', 'C2@gmail.com', 1),
    ('A8', 'Customer3', 'C3@gmail.com', 1),
    ('A9', 'Customer4', 'C4@gmail.com', 1),
    ('A10', 'Customer5', 'C5@gmail.com', 0),
	('A11', 'Driver1', 'D1@gmail.com', 1),
    ('A12', 'Driver2', 'D2@gmail.com', 1),
    ('A13', 'Driver3', 'D3@gmail.com', 1),
    ('A14', 'Driver4', 'D4@gmail.com', 0),
    ('A15', 'Driver5', 'D5@gmail.com', 0)
;

insert into user_phone(UserId, Phone) values
	(1, '0910000001'),
	(1, '0910000011'),
	(2, '0910000002'),
	(3, '0910000003'),
	(4, '0910000004'),
	(5, '0910000005'),
	(6, '0920000006'),
	(6, '0920000066'),
	(7, '0920000007'),
	(8, '0920000008'),
	(8, '0920000088'),
	(8, '0920000888'),
	(9, '0920000009'),
	(10, '0920000010'),
	(11, '0930000011'),  
	(12, '0930000012'), 
	(12, '0930001212'), 
	(13, '0930000013'),
	(14, '0930000014'),
	(15, '0930000015')
;

insert into staff(UserId, Position, Department) values
	(1, 'Coordinator', 'Makerting'),
	(2, 'Planner', 'Planning'),
	(3, 'Supplier', 'Planning'),
	(4, 'Supplier', 'Planning'),
	(5, 'Supplier', 'Planning')    
;

insert into customer (UserId, Payterm, CustomerType, CreditLimit, StaffId, CareDate) values
	(6, 'COD',		'Loyalty', 		500.00, 	2, '2026-04-01'), 		-- Cash On Delivery
	(7, 'Net15', 	'Wholesaler', 	1500.00, 	3, '2026-04-02'),		-- Paid in 15 days
	(8, 'Net60', 	'B2B', 			200000.00, 	3, '2026-04-03'),		-- Paid in 60 days
	(9, 'EOM', 		'Retailer', 	30000.00, 	4, '2026-04-04'),		-- End of Month
	(10, 'Prepaid', 'B2C', 			200.00, 	5, '2026-04-05')
;

insert into driver (UserId, LicenseNumber, LicenseClass, LicenseExpiryDate) values
	(11, 'M1', 'A1', '2021-01-01'),
	(12, 'M2', 'A2', '2022-02-02'),
	(13, 'C2', 'C1', '2023-03-03'),
	(14, 'T1', 'C2', '2024-04-04'),
	(15, 'T2', 'A1', '2025-05-05')    
;

insert into vehicle (VehicleId, LicensePlate, VehicleType, LicenseExpiryDate) values
	(1, '59A-001', 'Motor 75 cc', 	'2026-01-01'),
	(2, '59B-002', 'Container', 	'2027-02-02'),
	(3, '59C-003', 'Truck 10 ton', 	'2028-03-03'),
	(4, '59D-004', 'Van', 			'2029-04-04'),
	(5, '59E-005', 'Motor', 		'2030-05-05')    
;

insert into drive (UserId, VehicleId) values
	(11, 1),
	(11, 5),
	(12, 4),
	(13, 2),
	(14, 3),
	(15, 1),
	(15, 5)
;    

insert into route(RouteId, RouteName, RouteType, Transitime) values
	(1, 'Ho Chi Minh - Binh Duong', 'Highway', 1000),
	(2, 'Binh Duong - Dong Nai', 'Highway', 2000),
	(3, 'Ho Chi Minh - Dong Nai', 'Roadway', 5000),
	(4, 'Binh Duong - Dong Nai', 'Roadway', 10000),
	(5, 'Long An - Ho Chi Minh', 'Highway', 20000)
;

insert into shipment(ShipmentId, TotalWeight, DepartureDate, ActualArrivalTime, RouteId) values
	(1, '50 kg', '2026-04-01 08:00:00', '2026-04-01 11:00:00', 1),
	(2, 500.5, '2026-04-01 08:00:00', '2026-04-01 11:00:00', 1),
    (3, 2500.0, '2026-04-01 14:00:00', '2026-04-03 15:30:00', 2),
    (4, 50.0, '2026-04-02 09:00:00', '2026-04-02 11:15:00', 3),
    (5, 1200.0, '2026-04-02 22:00:00', '2026-04-03 04:00:00', 4),
    (6, 3000.0, '2026-04-03 06:00:00', '2026-04-06 08:00:00', 5);
;


insert into assignment(AssignmentId, AssignDate, AssignmentStatus, ShipmentId) values
	(1, '2026-04-01', 'Completed', '1'),
	(2, '2026-04-02', 'Processing', '1'),
	(3, '2026-04-03', 'Processing', '2'),
	(4, null, 'Pending', '3'),
	(5, null, 'Canceled', '4')
;

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
	IN p_FreightCost DECIMAL(12,2)
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

	IF NOT EXISTS (
		SELECT 1
		FROM `CUSTOMER`
		WHERE UserId = p_CustomerId
	) THEN
		SIGNAL SQLSTATE '45000'
		SET MESSAGE_TEXT = 'Lỗi: Khách hàng không tồn tại!';
	END IF;

	INSERT INTO `ORDER` (OrderDate, OrderStatus, PickupLocation, DeliveryLocation, FreightCost, CustomerId)
	VALUES (NOW(), 'Pending', TRIM(p_PickupLocation), TRIM(p_DeliveryLocation), p_FreightCost, p_CustomerId);

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


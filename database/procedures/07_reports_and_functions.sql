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

DELIMITER;

SELECT 'Phase 2 — Dashboard & Function: OK' AS Status;
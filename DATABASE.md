# Tài liệu Cơ sở Dữ liệu — Logistics & Supply Chain Management System

**Database:** `logistics_db` | **Charset:** `utf8mb4_unicode_ci` | **Engine:** InnoDB

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Sơ đồ quan hệ (ERD tóm tắt)](#2-sơ-đồ-quan-hệ-erd-tóm-tắt)
3. [Module 1 — IAM & Users](#3-module-1--iam--users)
4. [Module 2 — TMS & Fleet](#4-module-2--tms--fleet)
5. [Module 3 — WMS (Kho bãi)](#5-module-3--wms-kho-bãi)
6. [Module 4 — OMS & Dispatch](#6-module-4--oms--dispatch)
7. [Module 5 — Tracking](#7-module-5--tracking)
8. [Triggers nghiệp vụ](#8-triggers-nghiệp-vụ)
9. [Stored Procedures](#9-stored-procedures)
10. [Functions](#10-functions)
11. [Dữ liệu mẫu (Seed Data)](#11-dữ-liệu-mẫu-seed-data)

---

## 1. Tổng quan kiến trúc

Hệ thống chia thành 5 module chức năng:

| Module | Chức năng | Bảng chính |
|--------|-----------|------------|
| **IAM** | Quản lý người dùng, phân quyền | `USER`, `STAFF`, `CUSTOMER`, `DRIVER` |
| **TMS** | Quản lý tuyến đường & phương tiện | `VEHICLE`, `ROUTE`, `LOCATION` |
| **WMS** | Quản lý kho bãi & tồn kho | `WAREHOUSE`, `ITEM`, `INVENTORY` |
| **OMS** | Quản lý đơn hàng & điều phối | `ORDER`, `SHIPMENT`, `ASSIGNMENT` |
| **Tracking** | Theo dõi hành trình đơn hàng | `TRACKING_LOG` |

---

## 2. Sơ đồ quan hệ (ERD tóm tắt)

```
USER ──┬── STAFF ──┬── SUPERVISE (self-ref)
       │           ├── CUSTOMER
       │           └── WAREHOUSE (manager)
       ├── CUSTOMER ── ORDER ──┬── ITEM_ORDER ── ITEM ── INVENTORY ── WAREHOUSE
       │                       └── ORDER_SHIPMENT ── SHIPMENT ──┬── ROUTE ── ROUTE_SEGMENT ── LOCATION
       └── DRIVER ── DRIVER_VEHICLE ── VEHICLE                  └── ASSIGNMENT ── VEHICLE
                                                                                └── DRIVER
USER ── USER_PHONE (multi-value)
ORDER ── TRACKING_LOG ── LOCATION
```

---

## 3. Module 1 — IAM & Users

### 3.1 Bảng `USER`
> Bảng gốc cho mọi người dùng trong hệ thống (nhân viên, khách hàng, tài xế đều kế thừa từ đây).

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `UserId` | INT UNSIGNED | PK, AUTO_INCREMENT | ID người dùng |
| `Account` | VARCHAR(50) | UNIQUE NOT NULL | Tên đăng nhập |
| `Name` | VARCHAR(100) | NOT NULL | Họ tên |
| `Email` | VARCHAR(100) | UNIQUE NOT NULL | Email |
| `Status` | TINYINT | NOT NULL DEFAULT 1 | `1` = Active, `0` = Inactive |
| `Address` | VARCHAR(255) | NULL | Địa chỉ |

---

### 3.2 Bảng `USER_PHONE`
> Lưu số điện thoại đa trị (một user có thể có nhiều số).

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `UserId` | INT UNSIGNED | PK, FK → `USER` | ID người dùng |
| `Phone` | VARCHAR(20) | PK | Số điện thoại |

---

### 3.3 Bảng `STAFF`
> Nhân viên nội bộ — kế thừa `USER`.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `UserId` | INT UNSIGNED | PK, FK → `USER` | ID nhân viên |
| `Position` | VARCHAR(100) | NULL | Chức vụ |
| `Department` | VARCHAR(100) | NULL | Phòng ban |

---

### 3.4 Bảng `CUSTOMER`
> Khách hàng — kế thừa `USER`, có nhân viên chăm sóc.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `UserId` | INT UNSIGNED | PK, FK → `USER` | ID khách hàng |
| `PayTerm` | VARCHAR(50) | NULL | Kỳ thanh toán: `COD / Net15 / Net30 / Net60 / EOM / Prepaid` |
| `CustomerType` | VARCHAR(50) | NULL | Loại KH: `B2B / B2C / Wholesaler / Retailer / Loyalty` |
| `CreditLimit` | DECIMAL(15,2) | NOT NULL DEFAULT 0 | Hạn mức tín dụng (VNĐ) |
| `StaffId` | INT UNSIGNED | FK → `STAFF` | Nhân viên chăm sóc |
| `CareDate` | DATETIME | NULL | Ngày bắt đầu chăm sóc |

---

### 3.5 Bảng `DRIVER`
> Tài xế — kế thừa `USER`, lưu thông tin giấy phép lái xe.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `UserId` | INT UNSIGNED | PK, FK → `USER` | ID tài xế |
| `LicenseNumber` | VARCHAR(20) | UNIQUE NOT NULL | Số GPLX |
| `LicenseClass` | VARCHAR(10) | NOT NULL | Hạng GPLX: `A1/A2/B1/B2/C/D/E/F` |
| `LicenseExpiryDate` | DATE | NOT NULL | Ngày hết hạn GPLX |

---

### 3.6 Bảng `SUPERVISE`
> Quan hệ quản lý — tự tham chiếu trong `STAFF`.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `SuperviseeId` | INT UNSIGNED | PK, FK → `STAFF` | Nhân viên bị quản lý |
| `SupervisorId` | INT UNSIGNED | PK, FK → `STAFF` | Người quản lý |
| `ManageDate` | DATE | NOT NULL | Ngày bắt đầu quản lý |

---

## 4. Module 2 — TMS & Fleet

### 4.1 Bảng `VEHICLE`
> Danh mục phương tiện vận tải.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `VehicleId` | INT UNSIGNED | PK, AUTO_INCREMENT | ID phương tiện |
| `LicensePlate` | VARCHAR(15) | UNIQUE NOT NULL | Biển số xe |
| `VehicleType` | VARCHAR(50) | NOT NULL | Loại xe: `Xe máy / Xe tải / Container / Van` |
| `LicenseExpiryDate` | DATE | NOT NULL | Ngày hết hạn đăng kiểm |
| `MaxWeightCapacity` | DECIMAL(10,2) | NOT NULL, CHECK > 0 | Tải trọng tối đa (kg) |

---

### 4.2 Bảng `DRIVER_VEHICLE`
> Liên kết nhiều-nhiều giữa tài xế và phương tiện được phép lái.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `VehicleId` | INT UNSIGNED | PK, FK → `VEHICLE` | ID phương tiện |
| `UserId` | INT UNSIGNED | PK, FK → `DRIVER` | ID tài xế |

---

### 4.3 Bảng `LOCATION`
> Danh mục địa điểm (kho, cảng, trạm, điểm giao hàng).

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `LocationId` | INT UNSIGNED | PK, AUTO_INCREMENT | ID địa điểm |
| `Address` | VARCHAR(255) | NOT NULL | Địa chỉ |
| `LocationName` | VARCHAR(150) | NOT NULL | Tên địa điểm |
| `LocationType` | VARCHAR(50) | NOT NULL | Loại: `Kho / Cảng / Trạm trung chuyển / Điểm giao` |
| `Latitude` | DECIMAL(10,7) | NULL | Vĩ độ |
| `Longitude` | DECIMAL(10,7) | NULL | Kinh độ |

---

### 4.4 Bảng `ROUTE`
> Định nghĩa tuyến đường vận chuyển.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `RouteId` | INT UNSIGNED | PK, AUTO_INCREMENT | ID tuyến đường |
| `RouteName` | VARCHAR(150) | NOT NULL | Tên tuyến |
| `RouteType` | VARCHAR(50) | NOT NULL | Loại: `Nội địa / Quốc tế / Đường bộ / Đường biển` |
| `TransitTime` | INT UNSIGNED | NOT NULL | Thời gian vận chuyển dự kiến (phút) |

---

### 4.5 Bảng `ROUTE_SEGMENT`
> Các điểm dừng và khoảng cách trong một tuyến đường.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `RouteId` | INT UNSIGNED | PK, FK → `ROUTE` | ID tuyến đường |
| `SequenceNo` | TINYINT UNSIGNED | PK | Thứ tự điểm dừng |
| `Distance` | DECIMAL(10,2) | NOT NULL, CHECK > 0 | Khoảng cách đoạn (km) |
| `LocationId` | INT UNSIGNED | FK → `LOCATION` | ID địa điểm |

---

## 5. Module 3 — WMS (Kho bãi)

### 5.1 Bảng `WAREHOUSE`
> Danh mục kho bãi.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `WarehouseId` | INT UNSIGNED | PK, AUTO_INCREMENT | ID kho |
| `WarehouseType` | VARCHAR(50) | NOT NULL | Loại: `Kho lạnh / Kho thường / Cảng` |
| `Capacity` | DECIMAL(12,2) | NOT NULL, CHECK > 0 | Sức chứa (m³ hoặc tấn) |
| `WarehouseName` | VARCHAR(150) | NOT NULL | Tên kho |
| `TakeoverDate` | DATE | NOT NULL | Ngày tiếp nhận vận hành |
| `LocationId` | INT UNSIGNED | FK → `LOCATION` | Vị trí địa lý |
| `StaffId` | INT UNSIGNED | FK → `STAFF` | Nhân viên quản lý kho |

---

### 5.2 Bảng `ITEM`
> Danh mục hàng hóa.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `ItemId` | INT UNSIGNED | PK, AUTO_INCREMENT | ID hàng hóa |
| `Description` | VARCHAR(255) | NOT NULL | Mô tả hàng hóa |
| `Weight` | DECIMAL(10,3) | NOT NULL, CHECK > 0 | Trọng lượng (kg/đơn vị) |
| `Unit` | VARCHAR(30) | NOT NULL | Đơn vị: `kg / cái / thùng / pallet` |

---

### 5.3 Bảng `INVENTORY`
> Tồn kho thực tế theo từng kho.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `InventoryId` | INT UNSIGNED | PK, AUTO_INCREMENT | ID tồn kho |
| `ItemId` | INT UNSIGNED | FK → `ITEM` | ID hàng hóa |
| `Unit` | VARCHAR(30) | NOT NULL | Đơn vị tính |
| `Quantity` | DECIMAL(12,2) | NOT NULL DEFAULT 0, CHECK ≥ 0 | Số lượng tồn |
| `Description` | VARCHAR(255) | NULL | Ghi chú |
| `WarehouseId` | INT UNSIGNED | FK → `WAREHOUSE` | Kho chứa |

---

## 6. Module 4 — OMS & Dispatch

### 6.1 Bảng `ORDER`
> Đơn hàng của khách.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `OrderId` | INT UNSIGNED | PK, AUTO_INCREMENT | ID đơn hàng |
| `OrderDate` | DATETIME | NOT NULL DEFAULT NOW() | Ngày tạo đơn |
| `OrderStatus` | VARCHAR(30) | NOT NULL DEFAULT `'Chờ xử lý'` | `Chờ xử lý / Đang xử lý / Đang vận chuyển / Đã giao / Đã hủy` |
| `PickupLocation` | INT UNSIGNED | FK → `LOCATION` | Điểm lấy hàng |
| `FreightFactor` | DECIMAL(8,4) | NOT NULL DEFAULT 1.0, CHECK > 0 | Hệ số cước |
| `FreightCost` | DECIMAL(15,2) | NOT NULL DEFAULT 0, CHECK ≥ 0 | Chi phí vận chuyển (VNĐ) |
| `DeliveryLocation` | INT UNSIGNED | FK → `LOCATION` | Điểm giao hàng |
| `DeliveredDate` | DATETIME | NULL | Ngày giao thực tế |
| `StaffId` | INT UNSIGNED | FK → `STAFF` | Nhân viên phụ trách |
| `CustomerId` | INT UNSIGNED | FK → `CUSTOMER` | Khách hàng |

> **Lưu ý:** `PickupLocation ≠ DeliveryLocation` — được kiểm tra bởi trigger `trg_before_order_insert`.

---

### 6.2 Bảng `ITEM_ORDER`
> Chi tiết hàng hóa trong đơn hàng (nhiều-nhiều giữa `ITEM` và `ORDER`).

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `ItemId` | INT UNSIGNED | PK, FK → `ITEM` | ID hàng hóa |
| `OrderId` | INT UNSIGNED | PK, FK → `ORDER` | ID đơn hàng |
| `OrderQuantity` | DECIMAL(12,2) | NOT NULL, CHECK > 0 | Số lượng trong đơn |

---

### 6.3 Bảng `SHIPMENT`
> Chuyến hàng (gộp nhiều đơn hàng vào một chuyến).

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `ShipmentId` | INT UNSIGNED | PK, AUTO_INCREMENT | ID chuyến hàng |
| `TotalWeight` | DECIMAL(12,2) | NOT NULL DEFAULT 0, CHECK ≥ 0 | Tổng trọng lượng (kg) — tự động tính bởi trigger |
| `DepartureDate` | DATETIME | NULL | Ngày giờ xuất phát |
| `ActualArrivalTime` | DATETIME | NULL | Thời gian đến thực tế |
| `RouteId` | INT UNSIGNED | FK → `ROUTE` | Tuyến đường |

---

### 6.4 Bảng `ORDER_SHIPMENT`
> Liên kết nhiều-nhiều giữa `ORDER` và `SHIPMENT`.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `OrderId` | INT UNSIGNED | PK, FK → `ORDER` | ID đơn hàng |
| `ShipmentId` | INT UNSIGNED | PK, FK → `SHIPMENT` | ID chuyến hàng |
| `RecordTime` | DATETIME | NOT NULL DEFAULT NOW() | Thời gian gộp đơn |
| `ExpectedDeliveryDate` | DATE | NULL | Ngày giao hàng dự kiến |

---

### 6.5 Bảng `ASSIGNMENT`
> Phân công xe và tài xế cho chuyến hàng.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `AssignmentId` | INT UNSIGNED | PK, AUTO_INCREMENT | ID phân công |
| `AssignDate` | DATE | NOT NULL | Ngày phân công |
| `AssignmentStatus` | VARCHAR(30) | NOT NULL DEFAULT `'Chờ xác nhận'` | `Chờ xác nhận / Đang thực hiện / Hoàn thành / Đã hủy` |
| `ShipmentId` | INT UNSIGNED | FK → `SHIPMENT` | Chuyến hàng |
| `VehicleId` | INT UNSIGNED | FK → `VEHICLE` | Phương tiện |
| `UserId` | INT UNSIGNED | FK → `DRIVER` | Tài xế |

---

## 7. Module 5 — Tracking

### 7.1 Bảng `TRACKING_LOG`
> Nhật ký theo dõi hành trình đơn hàng (append-only).

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `TrackingId` | INT UNSIGNED | PK, AUTO_INCREMENT | ID log |
| `OrderId` | INT UNSIGNED | FK → `ORDER` | ID đơn hàng |
| `CurrentStatus` | VARCHAR(100) | NOT NULL | Trạng thái hiện tại |
| `Timestamp` | DATETIME | NOT NULL DEFAULT NOW() | Thời điểm ghi log |
| `LocationId` | INT UNSIGNED | FK → `LOCATION` | Vị trí địa điểm (nếu có) |
| `LogLocation` | VARCHAR(255) | NULL | Mô tả vị trí tự do |

---

## 8. Triggers nghiệp vụ

| Trigger | Bảng | Thời điểm | Chức năng |
|---------|------|-----------|-----------|
| `trg_before_assignment_insert` | `ASSIGNMENT` | BEFORE INSERT | Kiểm tra tải trọng xe, GPLX tài xế, đăng kiểm xe, quyền lái xe, xe không đang bận |
| `trg_after_order_shipment_insert` | `ORDER_SHIPMENT` | AFTER INSERT | Tự động cộng trọng lượng đơn vào `SHIPMENT.TotalWeight`; đổi trạng thái đơn → `Đang xử lý` |
| `trg_after_order_shipment_delete` | `ORDER_SHIPMENT` | AFTER DELETE | Tự động trừ trọng lượng khi gỡ đơn khỏi chuyến; hoàn trạng thái đơn → `Chờ xử lý` |
| `trg_before_order_insert` | `ORDER` | BEFORE INSERT | Validate dữ liệu: địa điểm không trùng, phí ≥ 0, hệ số cước > 0, KH đang active |
| `trg_before_order_update` | `ORDER` | BEFORE UPDATE | Chặn sửa đơn đã `Đã giao`/`Đã hủy`; chặn thay đổi địa điểm khi đang vận chuyển |
| `trg_after_tracking_insert` | `TRACKING_LOG` | AFTER INSERT | Đồng bộ `ORDER.OrderStatus` theo trạng thái log mới nhất |

### Logic kiểm tra tải trọng (`trg_before_assignment_insert`)

```
TotalWeight (SHIPMENT) > MaxWeightCapacity (VEHICLE)
  → SIGNAL lỗi: "Phương tiện quá tải!"
  → Gợi ý chọn xe lớn hơn hoặc tách chuyến
```

### Map trạng thái Tracking → Order (`trg_after_tracking_insert`)

| Từ khóa trong `CurrentStatus` | `OrderStatus` cập nhật |
|-------------------------------|------------------------|
| chứa `Đã giao` hoặc `giao hàng thành công` | `Đã giao` |
| chứa `Đang vận chuyển` hoặc `xuất phát` | `Đang vận chuyển` |
| chứa `Đã hủy` | `Đã hủy` |

---

## 9. Stored Procedures

### 9.1 VEHICLE Procedures

| Procedure | Tham số | Mô tả |
|-----------|---------|-------|
| `sp_GetAllVehicles()` | — | Danh sách tất cả xe kèm danh sách tài xế |
| `sp_GetVehicleById(VehicleId)` | `p_VehicleId` | Chi tiết một xe |
| `sp_CreateVehicle(...)` | `LicensePlate, VehicleType, ExpiryDate, Capacity` | Tạo xe mới (validate đầy đủ) |
| `sp_UpdateVehicle(...)` | `VehicleId + các trường cập nhật` | Cập nhật xe (chặn nếu đang chạy) |
| `sp_DeleteVehicle(VehicleId)` | `p_VehicleId` | Xóa xe (chặn nếu đã có lịch sử phân công) |
| `sp_SearchVehicles(...)` | `LicensePlate, VehicleType` | Tìm kiếm theo biển số / loại xe |

---

### 9.2 ORDER Procedures

| Procedure | Tham số | Mô tả |
|-----------|---------|-------|
| `sp_GetAllOrders()` | — | Tất cả đơn hàng với tổng items và trọng lượng |
| `sp_GetOrderById(OrderId)` | `p_OrderId` | Chi tiết đơn + danh sách hàng hóa |
| `sp_CreateOrder(...)` | `CustomerId, PickupLocation, DeliveryLocation, Factor, Cost, StaffId` | Tạo đơn mới |
| `sp_UpdateOrder(...)` | `OrderId + các trường` | Cập nhật đơn (chặn nếu đã giao/hủy) |
| `sp_DeleteOrder(OrderId)` | `p_OrderId` | Xóa đơn (chỉ khi `Chờ xử lý`) |
| `sp_CancelOrder(OrderId)` | `p_OrderId` | Hủy đơn + ghi `TRACKING_LOG` |
| `sp_AddItemToOrder(...)` | `OrderId, ItemId, Quantity` | Thêm hàng vào đơn (upsert) |
| `sp_SearchOrders(...)` | `FromDate, ToDate, Status, CustomerId` | Tìm kiếm đơn hàng |

---

### 9.3 SHIPMENT & ASSIGNMENT Procedures

| Procedure | Tham số | Mô tả |
|-----------|---------|-------|
| `sp_GetAllShipments()` | — | Danh sách chuyến hàng với số đơn và phân công |
| `sp_CreateShipment(...)` | `DepartureDate, RouteId` | Tạo chuyến hàng mới |
| `sp_AddOrderToShipment(...)` | `OrderId, ShipmentId, ExpectedDate` | Gộp đơn vào chuyến (trigger tự tính weight) |
| `sp_RemoveOrderFromShipment(...)` | `OrderId, ShipmentId` | Gỡ đơn khỏi chuyến (chặn nếu đang chạy) |
| `sp_CreateAssignment(...)` | `ShipmentId, VehicleId, DriverId, AssignDate` | Phân công xe + tài xế (trigger validate) |
| `sp_UpdateAssignmentStatus(...)` | `AssignmentId, NewStatus` | Cập nhật trạng thái phân công + đồng bộ đơn hàng |
| `sp_GetAllAssignments()` | — | Danh sách phân công đầy đủ |

---

### 9.4 Dashboard & Report Procedures

| Procedure | Tham số | Result Sets | Mô tả |
|-----------|---------|-------------|-------|
| `sp_DashboardStats(Month, Year)` | `p_Month, p_Year` | 5 result sets | KPIs + Revenue 6 tháng + Pie chart status + Top 5 KH + 5 đơn mới nhất |
| `sp_GetTrackingLogs(OrderId, Limit)` | `p_OrderId, p_Limit` | 1 | Lịch sử tracking có tọa độ |
| `sp_GetMonthlyRevenue(Year)` | `p_Year` | 1 | Doanh thu từng tháng trong năm |

---

## 10. Functions

### `fn_CalculateDriverBonus(DriverId, Month, Year)`

Tính tiền thưởng tháng cho tài xế dựa trên tổng khoảng cách đã hoàn thành.

**Thuật toán:**

```
Dùng CURSOR duyệt qua tất cả ASSIGNMENT có trạng thái 'Hoàn thành'
→ JOIN SHIPMENT → ROUTE → ROUTE_SEGMENT
→ Cộng dồn tổng Distance (km)
```

**Bậc thưởng:**

| Khoảng cách | Thưởng |
|------------|--------|
| 0 km | 0 đ |
| 1 – 500 km | 200,000 đ |
| 501 – 1,000 km | 500,000 đ + (dist − 500) × 600 đ/km |
| > 1,000 km | 1,200,000 đ + (dist − 1,000) × 1,000 đ/km *(tối đa 3,000,000 đ)* |

**Ví dụ sử dụng:**
```sql
SELECT fn_CalculateDriverBonus(12, 4, 2026) AS Bonus;
-- Trả về tiền thưởng tháng 4/2026 của tài xế UserId=12
```

---

## 11. Dữ liệu mẫu (Seed Data)

### Người dùng (15 users)

| Nhóm | UserId | Account | Vai trò |
|------|--------|---------|---------|
| Nhân viên | 1–5 | `nv.*` | Staff (Vận hành, Kế hoạch, Kinh doanh, Kho, Điều phối) |
| Khách hàng | 6–10 | `kh.*` | Customer (B2B, Wholesaler, B2C, Retailer) |
| Tài xế | 11–15 | `tx.*` | Driver (GPLX hạng A2, B1, B2, C, D) |

### Tuyến đường mẫu (5 routes)

| RouteId | Tên tuyến | Loại | Thời gian |
|---------|-----------|------|-----------|
| 1 | TP.HCM → Bình Dương | Đường bộ nội địa | 90 phút |
| 2 | TP.HCM → Đồng Nai | Đường bộ nội địa | 120 phút |
| 3 | TP.HCM → Long An | Đường bộ nội địa | 75 phút |
| 4 | Cảng Cát Lái → Kho Sóng Thần | Đường bộ nội địa | 60 phút |
| 5 | TP.HCM → Đà Nẵng | Đường bộ liên tỉnh | 960 phút |

### Chuyến hàng & trọng lượng tự động tính

Sau khi seed xong, trigger `trg_after_order_shipment_insert` sẽ tự cập nhật `TotalWeight`. Lệnh dưới đây dùng để tính thủ công nếu load dữ liệu mà chưa có trigger:

```sql
UPDATE SHIPMENT s
SET TotalWeight = (
    SELECT COALESCE(SUM(io.OrderQuantity * i.Weight), 0)
    FROM ORDER_SHIPMENT os
    INNER JOIN ITEM_ORDER io ON os.OrderId = io.OrderId
    INNER JOIN ITEM i ON io.ItemId = i.ItemId
    WHERE os.ShipmentId = s.ShipmentId
);
```

---

## Phụ lục — Thứ tự load Phase

| Phase | File | Nội dung |
|-------|------|----------|
| Phase 1 | Schema + Seed | Tạo bảng → Insert dữ liệu mẫu → Cập nhật TotalWeight thủ công |
| Phase 2 – File 1 | Triggers | 6 triggers nghiệp vụ |
| Phase 2 – File 2 | Vehicle CRUD | 6 stored procedures cho VEHICLE |
| Phase 2 – File 3 | Order CRUD | 9 stored procedures cho ORDER |
| Phase 2 – File 4 | Shipment/Assignment CRUD | 8 stored procedures cho SHIPMENT & ASSIGNMENT |
| Phase 2 – File 5 | Dashboard & Function | 3 procedures + 1 function tính thưởng |

> **Lưu ý:** Phải load Phase 2 – File 1 (Triggers) trước các file CRUD. Nếu load seed data sau khi đã có trigger, `TotalWeight` sẽ được tính tự động và không cần chạy lệnh UPDATE thủ công.
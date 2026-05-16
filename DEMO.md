# 🚚 HƯỚNG DẪN DEMO — HỆ THỐNG LOGISTICS & SUPPLY CHAIN MANAGEMENT
**Môn học:** Cơ sở Dữ liệu | **Trường:** HCMUT — 2026  
**Kiến trúc:** Database-First (MySQL Stored Procedures + Triggers + Functions)

---

## 📌 Thông tin kỹ thuật hệ thống

| Thành phần | Công nghệ | Địa chỉ |
|---|---|---|
| Frontend | React + Vite | http://localhost:5173 |
| Backend | Node.js + Express (API Gateway) | http://localhost:5000 |
| Database | MySQL 8.x | `logistics_db` |
| Chạy hệ thống | `npm run dev:all` | (từ thư mục gốc) |

### Người dùng demo mặc định (Mock Auth)
| Role | Người dùng | UserID | Ghi chú |
|---|---|---|---|
| **STAFF** | Nguyễn Văn A | 1 | Trưởng phòng Vận hành |
| **CUSTOMER** | Công ty TNHH ABC | 6 | Khách hàng B2B — 2 đơn hàng |
| **DRIVER** | Danh Nguyễn | 12 | Tài xế — 2 chuyến được phân công |

> **Chuyển role:** Click tên người dùng (góc trên bên phải) → Chọn Role cần demo

---

## 🔑 Kiến trúc phân quyền dữ liệu (Role-Based Data Filtering)

Hệ thống tự động lọc dữ liệu dựa trên header xác thực giả lập:

```
Frontend (axiosClient.js)
    → Header: x-mock-role: CUSTOMER, x-mock-user-id: 6
Backend (mockAuth.middleware.js)
    → req.mockUser = { role: "CUSTOMER", userId: 6 }
Controller (order.controller.js)
    → IF role=CUSTOMER → CALL sp_SearchOrders(NULL, NULL, NULL, 6)
    → IF role=STAFF    → CALL sp_GetAllOrders()
```

### SQL Stored Procedures chính
- `sp_GetAllOrders()` — STAFF: xem tất cả đơn hàng
- `sp_SearchOrders(fromDate, toDate, status, customerId)` — CUSTOMER: lọc theo CustomerId
- `sp_GetAllAssignments()` — STAFF: xem tất cả phân công
- `sp_GetAssignmentsByDriver(driverId)` — DRIVER: lọc theo UserId tài xế

---

## ═══════════════════════════════════════════
## LUỒNG 1: QUẢN LÝ PHƯƠNG TIỆN (CRUD CÓ RÀNG BUỘC)
## ═══════════════════════════════════════════

**Mục tiêu demo:** Chứng minh đầy đủ CRUD + Database Constraint thực thi qua Trigger  
**Trang:** http://localhost:5173/admin/vehicles  
**Role cần thiết:** STAFF (Nguyễn Văn A)

---

### BƯỚC 1 — Xem danh sách phương tiện (READ)

**Thao tác:**
1. Đăng nhập với role **STAFF** (Nguyễn Văn A)
2. Sidebar → MANAGEMENT → **Vehicles**

**Kết quả mong đợi:**
- Danh sách **10 xe** hiển thị với biển số, loại xe, tải trọng, trạng thái
- 4 thẻ KPI: Tổng phương tiện (10), Sẵn sàng (10), Đang vận chuyển (0), Cần chú ý (0)
- Tất cả xe đang ở trạng thái "Sẵn sàng" (badge xanh lá)

**SQL được gọi:**
```sql
CALL sp_GetAllVehicles();
-- JOIN Vehicle để lấy đầy đủ thông tin
```

---

### BƯỚC 2 — Thêm xe mới (CREATE)

**Thao tác:**
1. Click nút **"+ Thêm xe mới"** (góc trên phải)
2. Điền form:
   - **Biển số xe:** `51M-99999`
   - **Loại xe:** `Xe tải lớn`
   - **Tải trọng (kg):** `8000`
   - **Trạng thái:** `Sẵn sàng`
   - **Ghi chú:** `Xe demo báo cáo`
3. Click **"Thêm xe"**

**Kết quả mong đợi:**
- Toast màu xanh: ✅ "Đã thêm xe 51M-99999 vào hệ thống"
- Danh sách tự động refresh: số xe tăng từ 10 → **11**
- Xe mới xuất hiện trong bảng

**SQL được gọi:**
```sql
CALL sp_CreateVehicle('51M-99999', 'Xe tải lớn', '2030-12-31', 8000, 'Sẵn sàng', 'Xe demo báo cáo');
```

---

### BƯỚC 3 — Chỉnh sửa thông tin xe (UPDATE)

**Thao tác:**
1. Tìm xe vừa thêm (`51M-99999`) trong bảng
2. Click biểu tượng **bút chì** (✏️) ở cột "Thao tác"
3. Thay đổi:
   - **Tải trọng:** `8000` → `9500`
   - **Trạng thái:** `Sẵn sàng` → `Bảo dưỡng`
4. Click **"Lưu thay đổi"**

**Kết quả mong đợi:**
- Toast: ✅ "Đã cập nhật xe 51M-99999"
- Trong bảng: tải trọng hiển thị `9,500 kg`, badge đổi sang màu vàng "Bảo dưỡng"

**SQL được gọi:**
```sql
CALL sp_UpdateVehicle(11, '51M-99999', 'Xe tải lớn', '2030-12-31', 9500, 'Bảo dưỡng', 'Xe demo báo cáo');
```

---

### BƯỚC 4 — Thử xóa xe ĐÃ CÓ lịch sử phân công (TRIGGER HOẠT ĐỘNG)

> ⭐ **ĐÂY LÀ ĐIỂM DEMO QUAN TRỌNG NHẤT**  
> Chứng minh Database Trigger `trg_before_vehicle_delete` kiểm tra ràng buộc

**Thao tác:**
1. Tìm xe **`51B-23456`** (Xe tải 1 tấn — đã được gán vào chuyến hàng)
2. Click biểu tượng **thùng rác** (🗑️)
3. Trong hộp thoại xác nhận → đọc cảnh báo → Click **"Xóa phương tiện"**

**Kết quả mong đợi:**
- **Toast màu ĐỎ** xuất hiện với thông báo từ DB:  
  `"Lỗi: Không thể xóa phương tiện đã có lịch sử phân công!"`
- Xe **KHÔNG BỊ XÓA** khỏi hệ thống
- Backend trả HTTP 400, không phải lỗi frontend

**SQL Trigger được kích hoạt:**
```sql
-- database/procedures/03_triggers.sql (hoặc 03_procedures_triggers.sql)
CREATE TRIGGER trg_before_vehicle_delete
BEFORE DELETE ON VEHICLE
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1 FROM ASSIGNMENT WHERE VehicleId = OLD.VehicleId
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Không thể xóa phương tiện đã có lịch sử phân công!';
    END IF;
END;
```

**Luồng xử lý lỗi:**
```
DB TRIGGER → SIGNAL SQLSTATE '45000'
    → MySQL ném exception
    → Backend: next(err) → errorHandler middleware
    → HTTP 400 { error: "Lỗi: Không thể xóa..." }
    → axiosClient.js interceptor → err.message
    → toast.error(err.message) — hiển thị đúng câu lỗi từ DB
```

---

### BƯỚC 5 — Xóa xe MỚI THÊM (thành công)

**Thao tác:**
1. Tìm xe **`51M-99999`** (vừa tạo ở Bước 2, chưa có phân công)
2. Click 🗑️ → Click **"Xóa phương tiện"**

**Kết quả mong đợi:**
- Toast: ✅ "Đã xóa xe 51M-99999 khỏi hệ thống"
- Số xe giảm từ 11 → **10**

**SQL được gọi:**
```sql
CALL sp_DeleteVehicle(11);
-- Trigger kiểm tra → không có phân công → cho phép xóa
```

---

## ═══════════════════════════════════════════
## LUỒNG 2: ĐIỀU PHỐI CHUYẾN HÀNG (TRIGGER & FUNCTION)
## ═══════════════════════════════════════════

**Mục tiêu demo:** Chứng minh Database Trigger kiểm tra tải trọng + Function tính toán  
**Trang:** http://localhost:5173/admin/dispatch  
**Role cần thiết:** STAFF (cho phân công) + DRIVER (cập nhật hành trình)

---

### BƯỚC 1 — Xem danh sách chuyến hàng (STAFF)

**Thao tác:**
1. Role **STAFF**, Sidebar → OPERATIONS → **Phân công chuyến**

**Kết quả mong đợi:**
- Cột trái: Danh sách **5 chuyến hàng** với tuyến đường, ngày khởi hành, tổng KG
- Bảng phía dưới: **Lịch sử 5 phân công** kèm tài xế, xe, trạng thái

**SQL được gọi:**
```sql
CALL sp_GetAllShipments();     -- Danh sách chuyến
CALL sp_GetAllAssignments();   -- Lịch sử phân công
```

---

### BƯỚC 2 — Phân công xe VƯỢT TẢI TRỌNG (TRIGGER HOẠT ĐỘNG)

> ⭐ **ĐÂY LÀ ĐIỂM DEMO KỸ THUẬT TRIGGER QUAN TRỌNG**

**Thao tác:**
1. Click vào **Chuyến #5** (TP.HCM → Đà Nẵng) trong cột trái để chọn
2. Form bên phải:
   - **Phương tiện:** Chọn `51A-12345 — Xe máy (150 kg)`  
     *(chú ý: xe máy 150 kg nhưng chuyến có hàng nặng hơn)*
   - **Tài xế:** Chọn `Danh Nguyễn — GPLX: B2`
   - **Ngày phân công:** Giữ nguyên
3. Quan sát cảnh báo màu đỏ xuất hiện:  
   `"Cảnh báo vượt tải! Hàng X kg > Tải trọng 150 kg. DB Trigger sẽ từ chối phân công này!"`
4. Click **"⚠️ Phân công (sẽ bị DB từ chối)"** để demo trigger

**Kết quả mong đợi:**
- Toast màu **ĐỎ** xuất hiện với thông báo từ DB Trigger:  
  `"Lỗi: Tổng khối lượng hàng hóa (X kg) vượt quá tải trọng tối đa của xe (150 kg)!"`
- Phân công **KHÔNG được tạo** trong DB

**SQL Trigger được kích hoạt:**
```sql
-- Trigger trg_before_assignment_insert trong 03_triggers.sql
CREATE TRIGGER trg_before_assignment_insert
BEFORE INSERT ON ASSIGNMENT
FOR EACH ROW
BEGIN
    DECLARE v_total_weight  DECIMAL(12,2);
    DECLARE v_max_capacity  DECIMAL(12,2);

    -- Lấy tổng khối lượng hàng trong chuyến
    SELECT COALESCE(SUM(io.OrderQuantity * i.Weight), 0)
    INTO v_total_weight
    FROM ORDER_SHIPMENT os
    JOIN ITEM_ORDER io ON io.OrderId = os.OrderId
    JOIN ITEM i ON i.ItemId = io.ItemId
    WHERE os.ShipmentId = NEW.ShipmentId;

    -- Lấy tải trọng tối đa của xe
    SELECT MaxWeightCapacity INTO v_max_capacity
    FROM VEHICLE WHERE VehicleId = NEW.VehicleId;

    -- Kiểm tra ràng buộc tải trọng
    IF v_total_weight > v_max_capacity THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = CONCAT(
            'Lỗi: Tổng khối lượng hàng hóa (', v_total_weight,
            ' kg) vượt quá tải trọng tối đa của xe (', v_max_capacity, ' kg)!'
        );
    END IF;
END;
```

---

### BƯỚC 3 — Phân công hợp lệ (THÀNH CÔNG)

**Thao tác:**
1. Giữ nguyên chuyến đã chọn ở Bước 2
2. Đổi **Phương tiện** → `51D-45678 — Container 20ft (20,000 kg)`
3. Giữ nguyên **Tài xế:** Danh Nguyễn
4. Cảnh báo đổi sang **màu xanh lá:** `"Tải trọng phù hợp (X/20,000 kg)"`
5. Click **"✅ Xác nhận Phân công"**

**Kết quả mong đợi:**
- Toast: ✅ "Đã phân công xe & tài xế cho Chuyến #5"
- Bảng lịch sử phân công tự động reload → xuất hiện bản ghi mới #6
- Trạng thái: "Chờ xác nhận"

**SQL được gọi:**
```sql
CALL sp_CreateAssignment(5, 4, 12, CURDATE());
-- ShipmentId=5, VehicleId=4 (Container), DriverId=12 (Danh Nguyễn)
-- Trigger kiểm tra → tải trọng OK → INSERT thành công
```

---

### BƯỚC 4 — Tài xế cập nhật hành trình (DRIVER Dashboard)

**Thao tác:**
1. Click tên người dùng (góc trên phải) → Chuyển sang role **DRIVER (Danh Nguyễn)**
2. Sidebar → **Chuyến được phân** (My Trips)
3. Quan sát: Chỉ hiển thị **2 chuyến của Danh Nguyễn** (lọc theo UserId=12)
4. Chuyến #3 đang "Đang thực hiện" → Click **"Chuyển sang: Hoàn thành"**

**Kết quả mong đợi:**
- Toast: ✅ "Đã cập nhật trạng thái: Hoàn thành"
- Badge chuyến #3 chuyển từ màu xanh dương → màu xanh lá "Hoàn thành"

**SQL được gọi:**
```sql
CALL sp_UpdateAssignmentStatus(3, 'Hoàn thành');
-- Stored Procedure tự động:
--   1. Cập nhật ASSIGNMENT.AssignmentStatus = 'Hoàn thành'
--   2. Cập nhật SHIPMENT.ActualArrivalTime = NOW()
--   3. Cập nhật ORDER.OrderStatus = 'Đã giao', DeliveredDate = NOW()
```

---

### BƯỚC 5 — Kiểm tra cập nhật phản ánh về STAFF

**Thao tác:**
1. Chuyển lại role **STAFF**
2. Dashboard → Kiểm tra **Phân phối trạng thái** đơn hàng
3. Số "Đã giao" tăng thêm 1

**SQL Function (báo cáo):**
```sql
-- fn_GetTotalRevenue() — hàm tính tổng doanh thu
SELECT fn_GetTotalRevenue() AS TotalRevenue;

-- sp_GetDashboardStats() — aggregate KPI cho Staff Dashboard
CALL sp_GetDashboardStats();
```

---

## 📊 Tổng hợp Database Objects được demo

### Stored Procedures (9 SP chính được demo)
| SP | Được gọi khi | Vai trò |
|---|---|---|
| `sp_GetAllVehicles()` | Mở trang Vehicles | Lấy toàn bộ xe |
| `sp_CreateVehicle(...)` | Thêm xe mới | Tạo xe, validate biển số |
| `sp_UpdateVehicle(...)` | Sửa thông tin xe | Cập nhật, validate |
| `sp_DeleteVehicle(id)` | Xóa xe | Gọi trigger kiểm tra |
| `sp_GetAllShipments()` | Mở Dispatch Panel | Danh sách chuyến hàng |
| `sp_GetAllAssignments()` | STAFF xem phân công | Toàn bộ lịch sử |
| `sp_GetAssignmentsByDriver(id)` | DRIVER xem chuyến | Lọc theo tài xế |
| `sp_CreateAssignment(...)` | Phân công chuyến | Kích hoạt Trigger vượt tải |
| `sp_UpdateAssignmentStatus(...)` | Tài xế cập nhật | Cascade update đơn hàng |

### Triggers được demo trực tiếp
| Trigger | Kích hoạt | Chức năng |
|---|---|---|
| `trg_before_assignment_insert` | Khi tạo phân công | **Kiểm tra tải trọng xe** ← Demo Luồng 2 |
| `trg_before_vehicle_delete` | Khi xóa xe | **Chặn xóa xe có lịch sử** ← Demo Luồng 1 |
| `trg_after_order_shipment_insert` | Gộp đơn vào chuyến | Tự cập nhật TotalWeight |
| `trg_before_order_update` | Sửa đơn hàng | Chặn sửa đơn đã giao/hủy |

### Functions được sử dụng
| Function | Mục đích |
|---|---|
| `fn_GetTotalRevenue()` | Tính tổng doanh thu hệ thống |
| `fn_CalculateFreightCost(weight, factor)` | Tính cước phí vận chuyển (derived attribute) |

---

## 🗺️ Sơ đồ luồng dữ liệu tổng quan

```
[CUSTOMER]                    [STAFF]                    [DRIVER]
    │                             │                           │
    │ Tạo đơn hàng               │ Quản lý xe CRUD           │ Cập nhật hành trình
    │ GET /api/orders             │ GET /api/vehicles         │ PATCH /assignments/:id/status
    │ (filter by userId=6)        │ POST/PUT/DELETE           │ (filter by userId=12)
    ↓                             ↓                           ↓
[Backend API Gateway — Node.js]
    │ mockAuth.middleware.js → req.mockUser = {role, userId}
    │ order.controller.js → IF role=CUSTOMER → sp_SearchOrders(userId)
    │ vehicle.controller.js → sp_CreateVehicle / sp_DeleteVehicle
    │ shipment.controller.js → IF role=DRIVER → sp_GetAssignmentsByDriver(userId)
    ↓
[MySQL Database — logistics_db]
    │ Stored Procedures → Business Logic
    │ Triggers → Constraints & Validations
    │ Functions → Computed Attributes
```

---

## ⚙️ Cách chạy hệ thống cho demo

```bash
# 1. Đảm bảo MySQL đang chạy với database logistics_db đã được import

# 2. Chạy cả 2 server cùng lúc
npm run dev:all

# 3. Mở trình duyệt
http://localhost:5173/

# 4. Thêm stored procedure mới (chỉ cần chạy 1 lần)
node add_driver_sp.js
```

### Kiểm tra dữ liệu seed
```
Users: 15 người (5 Staff, 5 Customer, 5 Driver)
Vehicles: 10 xe (biển số 51A đến 51L)
Orders: 6 đơn hàng (phân bổ cho Customer 6, 7, 8, 9)
Shipments: 5 chuyến hàng
Assignments: 5 phân công (Driver 12, 13, 15)
```

---

*Được tạo tự động bởi Antigravity AI — Phục vụ báo cáo môn học Cơ sở Dữ liệu, HCMUT 2026*

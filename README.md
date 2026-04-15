# ĐẶC TẢ YÊU CẦU ỨNG DỤNG WEB (CUSTOMER & DRIVER ROLES)

## 1. Tổng quan kiến trúc dữ liệu và Ứng dụng
[cite_start]Chương trình minh họa việc kết nối ứng dụng với CSDL có thể là web, mobile hoặc desktop app[cite: 43]. Dưới đây là luồng hoạt động trên nền tảng Web, trong đó dữ liệu từ EERD sẽ được bóc tách và phân quyền hiển thị, thao tác dựa trên UserId.

## 2. Role Khách hàng (CUSTOMER)
Khách hàng là người tạo ra nhu cầu vận chuyển, theo dõi tiến trình và thanh toán. 

### 2.1 Các thực thể và thuộc tính liên quan trực tiếp
* **USER & CUSTOMER:** `UserId`, `Account`, `Name`, `Email`, `Phone` (bảng đa trị), `PaymentTerm`, `CustomerType`, `CreditLimit`.
* **ORDER & ITEM:** `OrderId`, `OrderDate`, `OrderStatus`, `PickupLocation`, `DeliveryLocation`, `FreightCost`, `ItemId`, `OrderQuantity`.
* **TRACKING_LOG:** `TrackingId`, `CurrentStatus`, `Timestamp`.

### 2.2 Các luồng chức năng chính (Main Flows)
* **Quản lý tài khoản cá nhân:** Xem và chỉnh sửa thông tin cá nhân (Email, Phone). 
* **Quản lý Đơn hàng (CRUD Operations):**
    * **Thêm mới đơn hàng (Create):** Khách hàng nhập thông tin điểm lấy hàng (`PickupLocation`), điểm giao (`DeliveryLocation`), chọn loại hàng hóa (`ITEM` từ `INVENTORY`), số lượng (`OrderQuantity`). [cite_start]Hệ thống sẽ gọi procedure để kiểm tra tính hợp lệ của dữ liệu đầu vào[cite: 14].
    * **Danh sách đơn hàng (Read):** Giao diện hiển thị danh sách các đơn hàng (`ORDER`) của chính khách hàng đó. [cite_start]Chức năng này bắt buộc phải sử dụng stored procedure có tham số truyền vào (ví dụ: lọc theo `OrderStatus` hoặc `OrderDate` thông qua combo box hoặc calendar picker)[cite: 56].
    * [cite_start]**Cập nhật/Xóa đơn hàng (Update/Delete):** Cho phép khách hàng chỉnh sửa hoặc hủy đơn hàng từ danh sách hiển thị[cite: 46]. [cite_start]**Lưu ý nghiệp vụ:** Chỉ cho phép hủy/sửa khi `OrderStatus` là "Đang chờ xử lý", thao tác này sẽ kích hoạt thủ tục kiểm tra trước khi thực thi lệnh DELETE/UPDATE dưới CSDL[cite: 17, 58].

### 2.3 Các luồng mở rộng (Future Flows)
* **Theo dõi lộ trình Real-time:** Khách hàng nhập `OrderId` để tra cứu lịch sử hành trình. Dữ liệu được truy vấn từ bảng `TRACKING_LOG` kết hợp với `LOCATION` để hiển thị bản đồ trực quan các điểm (Latitude, Longitude) mà đơn hàng đã đi qua.
* **Bảng điều khiển tài chính (Financial Dashboard):** Hiển thị tổng chi phí (`TotalFreightCost`) dựa trên các đơn hàng đã hoàn thành, đối chiếu với `CreditLimit` hiện tại của khách hàng.

---

## 3. Role Tài xế (DRIVER)
Tài xế là người trực tiếp nhận phân công, thực hiện chuyến đi (`SHIPMENT`) và cập nhật trạng thái thực tế.

### 3.1 Các thực thể và thuộc tính liên quan trực tiếp
* **USER & DRIVER:** `UserId`, `Name`, `LicenseNumber`, `LicenseClass`, `LicenseExpiryDate`.
* **ASSIGNMENT & VEHICLE:** `AssignmentId`, `AssignDate`, `AssignmentStatus`, `VehicleId`, `LicensePlate`.
* **SHIPMENT & ROUTE:** `ShipmentId`, `DepartureDate`, `ActualArrivalTime`, `RouteId`, `RouteName`.
* **TRACKING_LOG & LOCATION:** Để cập nhật quá trình di chuyển.

### 3.2 Các luồng chức năng chính (Main Flows)
* **Xem danh sách Phân công (Assignment Dashboard):** * Tài xế đăng nhập sẽ thấy danh sách các chuyến đi được phân công (`ASSIGNMENT`), bao gồm thông tin phương tiện (`VEHICLE`) và lô hàng (`SHIPMENT`).
    * [cite_start]Giao diện này cung cấp chức năng tìm kiếm, sắp xếp theo `AssignDate` hoặc `AssignmentStatus`[cite: 47].
* **Chi tiết Chuyến đi & Tuyến đường (Shipment & Route Detail):**
    * Khi chọn một lô hàng (`ShipmentId`), tài xế xem được chi tiết tuyến đường (`ROUTE`).
    * [cite_start]Hệ thống gọi procedure truy vấn phức tạp kết hợp các bảng `ROUTE`, `ROUTE_SEGMENT`, `LOCATION` để hiển thị danh sách các điểm cần dừng và khoảng cách (`Distance`)[cite: 32, 33].
* **Cập nhật Trạng thái (Thêm TRACKING_LOG):**
    * Tại mỗi trạm dừng hoặc khi hoàn tất giao hàng, tài xế cập nhật trạng thái (`CurrentStatus`).
    * Thao tác này gọi procedure `INSERT` vào bảng `TRACKING_LOG`. [cite_start]Nếu có thuộc tính dẫn xuất như `ActualArrivalTime` ở bảng `SHIPMENT` hoặc `OrderStatus` ở bảng `ORDER`, các trigger dưới CSDL sẽ tự động được kích hoạt để cập nhật đồng bộ[cite: 24, 25, 26].

### 3.3 Các luồng mở rộng (Future Flows)
* [cite_start]**Cảnh báo Bằng lái & Phương tiện:** Tự động cảnh báo trên giao diện nếu `LicenseExpiryDate` của tài xế sắp hết hạn, hoặc trọng tải lô hàng (`TotalWeight` trong `SHIPMENT`) vượt quá `MaxWeightCapacity` của phương tiện (Ràng buộc này có thể được cài đặt bằng trigger từ trước [cite: 20, 21, 22]).
* **Tối ưu hóa Tuyến đường (Route Optimization):** Tích hợp giao diện bản đồ, tự động gợi ý `NextRoute` dựa trên bảng `ROUTE_SEGMENT` hiện tại.

---
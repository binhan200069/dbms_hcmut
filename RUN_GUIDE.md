# Huong Dan Chay Du An Logistics (Team Guide)

Tai lieu nay dung cho nhom de setup va chay nhanh du an tren may moi.

## 1. Yeu Cau Moi Truong

- Node.js >= 18
- XAMPP (MySQL/MariaDB + phpMyAdmin)
- Git (khuyen nghi)

## 2. Cau Truc Thu Muc Chinh

### Backend

- backend/server.js: Entry point chay server
- backend/app.js: Khoi tao Express app
- backend/config/db.js: Cau hinh mysql2/promise
- backend/routes/: Dinh nghia endpoint
- backend/controllers/: Xu ly request/response
- backend/services/: Goi stored procedures
- backend/validators/: Validate input
- backend/middlewares/: Error handler va middleware dung chung

### Frontend

- frontend/src/pages/: Muc man hinh (page-level)
- frontend/src/components/orders/: Component theo domain don hang
- frontend/src/services/: Goi API
- frontend/src/utils/: Formatters, helpers
- frontend/src/styles/: CSS theo module man hinh

### Database

- database/schema/01_create_tables.sql
- database/seed/02_seed_data.sql
- database/procedures/03_procedures_triggers.sql

## 3. Chay Database (XAMPP/phpMyAdmin)

Mo phpMyAdmin, vao tab SQL va chay theo dung thu tu:

1. database/schema/01_create_tables.sql
2. database/seed/02_seed_data.sql
3. database/procedures/03_procedures_triggers.sql

Luu y:

- File procedures da dung DELIMITER //, co the chay truc tiep trong phpMyAdmin.
- Neu da co du lieu cu, script se xoa va tao lai bang dung schema hien tai.

## 4. Chay Backend

Mo terminal:

1. cd backend
2. npm install
3. npm start

Mac dinh backend chay tai:

- http://localhost:5000

Health check:

- GET http://localhost:5000/api/health

## 5. Chay Frontend

Mo terminal khac:

1. cd frontend
2. npm install
3. npm run dev

Frontend mac dinh chay tai URL ma Vite in ra (thuong la http://localhost:5173).

## 6. Bien Moi Truong Frontend (Tuy Chon)

Mac dinh frontend goi API tai:

- http://localhost:5000/api/orders

Neu can doi URL backend, tao file:

- frontend/.env

Noi dung vi du:

VITE_ORDER_API_BASE_URL=http://localhost:5000/api/orders

## 7. Quy Uoc Team De Lam Viec Song Song

- Nhom Backend API:
  - Sua route tai backend/routes
  - Them business logic tai backend/services
  - Validate input tai backend/validators
  - Controller chi giu vai tro dieu phoi

- Nhom Frontend UI:
  - Them giao dien trong frontend/src/pages
  - Tach component nho trong frontend/src/components
  - Khong goi axios truc tiep trong component, chi goi qua frontend/src/services

- Nhom Database:
  - DDL trong database/schema
  - Du lieu mau trong database/seed
  - SP/Trigger trong database/procedures

## 8. Loi Thuong Gap

### Backend khong len

- Kiem tra XAMPP MySQL da Start
- Kiem tra ten database la logistics_db
- Kiem tra cong 5000 co bi chiem khong

### Frontend bao loi API/CORS

- Kiem tra backend dang chay
- Kiem tra VITE_ORDER_API_BASE_URL neu co set trong frontend/.env

### SP bao loi SQLSTATE 45000

- Day la loi validate tu DB theo nghiep vu
- Frontend se hien thong bao qua toast

## 9. Lenh Kiem Tra Nhanh

Backend:

- cd backend
- npm start

Frontend:

- cd frontend
- npm run build
- npm run dev

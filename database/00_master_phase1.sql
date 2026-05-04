-- =============================================================================
-- MASTER IMPORT SCRIPT - PHASE 1
-- Chạy file này để tạo toàn bộ database, bảng và dữ liệu mẫu
-- Lệnh: mysql -u root -p < database/00_master_phase1.sql
-- =============================================================================

SOURCE database/schema/01_create_tables.sql;
SOURCE database/seed/02_seed_data.sql;

-- Xác nhận kết quả
SELECT 'Phase 1 hoàn tất!' AS Status;

SELECT TABLE_NAME,
       TABLE_ROWS,
       TABLE_COMMENT
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'logistics_db'
ORDER BY TABLE_NAME;

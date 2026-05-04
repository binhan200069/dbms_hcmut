-- =============================================================================
-- MASTER IMPORT SCRIPT — PHASE 2
-- Chạy sau Phase 1. Thực thi: mysql -u root -p < database/00_master_phase2.sql
-- =============================================================================

SOURCE database/procedures/03_triggers.sql;
SOURCE database/procedures/04_vehicle_procedures.sql;
SOURCE database/procedures/05_order_procedures.sql;
SOURCE database/procedures/06_assignment_procedures.sql;
SOURCE database/procedures/07_reports_and_functions.sql;

-- Xác nhận
SELECT 'Phase 2 hoàn tất — Tất cả Triggers, Procedures, Functions đã được cài đặt!' AS Status;

-- Liệt kê procedures đã tạo
SELECT ROUTINE_TYPE AS Type, ROUTINE_NAME AS Name
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_SCHEMA = 'logistics_db'
ORDER BY ROUTINE_TYPE, ROUTINE_NAME;

-- Liệt kê triggers đã tạo
SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, ACTION_TIMING
FROM INFORMATION_SCHEMA.TRIGGERS
WHERE TRIGGER_SCHEMA = 'logistics_db'
ORDER BY EVENT_OBJECT_TABLE;

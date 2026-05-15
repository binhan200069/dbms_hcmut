USE logistics_db;

DROP PROCEDURE IF EXISTS sp_GetItemsByWarehouse;

DELIMITER $$

CREATE PROCEDURE sp_GetItemsByWarehouse(IN p_WarehouseId INT UNSIGNED)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM WAREHOUSE WHERE WarehouseId = p_WarehouseId) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Loi: Kho hang khong ton tai!';
    END IF;

    SELECT
        inv.InventoryId,
        inv.WarehouseId,
        inv.ItemId,
        i.Description     AS ItemName,
        i.Weight          AS WeightPerUnit,
        i.Unit,
        inv.Quantity,
        ROUND(inv.Quantity * i.Weight, 2) AS TotalWeightKg
    FROM INVENTORY inv
    JOIN ITEM i ON inv.ItemId = i.ItemId
    WHERE inv.WarehouseId = p_WarehouseId
    ORDER BY i.Description ASC;
END$$

DELIMITER ;

SELECT 'FIX: sp_GetItemsByWarehouse (no LastUpdated) OK' AS Status;

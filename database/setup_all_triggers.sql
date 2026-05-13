
DROP TRIGGER IF EXISTS trg_before_set_manager;
DELIMITER $$
CREATE TRIGGER trg_before_set_manager
BEFORE UPDATE ON STAFF
FOR EACH ROW
BEGIN
    DECLARE v_ExistingManager INT;
    
    IF NEW.Position = 'Manager' THEN
        SELECT COUNT(*) INTO v_ExistingManager
        FROM STAFF
        WHERE Department  = NEW.Department
          AND Position    = 'Manager'
          AND UserID      != NEW.UserId;
        
        IF v_ExistingManager > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Please remove the current manager first.';
        END IF;
    END IF;
END$$

DELIMITER ;
DROP TRIGGER IF EXISTS trg_after_set_manager;
DELIMITER $$
CREATE TRIGGER trg_after_set_manager
AFTER UPDATE ON STAFF
FOR EACH ROW
BEGIN
    IF NEW.Position = 'Manager' THEN
        IF OLD.Position = 'Manager' THEN
            DELETE FROM supervise
            WHERE supervisorId = NEW.UserId;
        END IF;

        INSERT IGNORE INTO supervise (SuperviseeId, SupervisorId, ManageDate)
        SELECT 
            s.UserId,
            NEW.UserId,
            CURDATE()
        FROM staff s
        WHERE s.Department = NEW.Department
            AND s.UserId   != NEW.UserId
            AND s.Position != 'Manager';
    END IF;
END$$


DROP TRIGGER IF EXISTS trg_after_delete_manager
DELIMITER $$
CREATE TRIGGER trg_after_delete_manager
AFTER UPDATE ON staff
FOR EACH ROW
BEGIN
    IF OLD.Position = 'Manager' THEN
        DELETE FROM supervise
        WHERE SupervisorId = OLD.UserId;
    END IF;
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS trg_before_insert_user_phone;
DELIMITER $$
CREATE TRIGGER trg_before_insert_user_phone
BEFORE INSERT ON user_phone
FOR EACH ROW
BEGIN
    IF NEW.Phone NOT REGEXP '^0[0-9]{9,10}$' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Phone number must have 10 - 11 numbers';
    END IF;
END$$

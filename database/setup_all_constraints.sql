ALTER TABLE `USER`
ADD CONSTRAINT chk_user_name
    CHECK (`Name` REGEXP '^[A-Za-z.]+$'),

ALTER TABLE `ORDER`
    DROP FOREIGN KEY fk_order_staff,
    ADD CONSTRAINT fk_order_staff
        FOREIGN KEY (StaffId) REFERENCES STAFF(UserId)
        ON UPDATE CASCADE
        ON DELETE SET NULL;

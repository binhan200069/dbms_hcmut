create database if not exists assignment;

use assignment;
CREATE TABLE IF NOT EXISTS User (
    UserId INT UNSIGNED AUTO_INCREMENT,
    Account VARCHAR(50) NOT NULL UNIQUE,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Status TINYINT DEFAULT 0,
    PRIMARY KEY (Userid)
);

CREATE TABLE IF NOT EXISTS User_Phone (
    UserId INT UNSIGNED,
    Phone VARCHAR(20) NOT NULL,
    PRIMARY KEY (UserId , Phone),
    FOREIGN KEY (UserId)
        REFERENCES User (UserId)
		ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Staff (
    UserId INT UNSIGNED,
    Position VARCHAR(100),
    Department VARCHAR(100),
    PRIMARY KEY (UserId),
    FOREIGN KEY (UserId)
        REFERENCES User (UserId)
        on update cascade on delete cascade
);

CREATE TABLE IF NOT EXISTS Supervise (
    SuperviseeId INT UNSIGNED,
    SupervisorId INT UNSIGNED,
    ManageDate DATE,
    PRIMARY KEY (SuperviseeId),
    FOREIGN KEY (SuperviseeId)
        REFERENCES user (UserId),
    FOREIGN KEY (SupervisorId)
        REFERENCES user (UserId)
        on update cascade ON delete cascade
);

CREATE TABLE IF NOT EXISTS Customer (
    UserId INT UNSIGNED,
    PayTerm VARCHAR(50),
    CustomerType TINYINT DEFAULT 0,
    CreditLimit DECIMAL(10 , 2 ),
    StaffId INT UNSIGNED,
    CareDate DATETIME,
    PRIMARY KEY (UserId),
    FOREIGN KEY (UserId)
        REFERENCES user (UserId)
		on update cascade ON delete cascade,
    FOREIGN KEY (StaffId)
        REFERENCES Staff (UserId)
        on update cascade on delete set null
);

CREATE TABLE IF NOT EXISTS driver (
    UserId INT UNSIGNED,
    LicenseNumber VARCHAR(10) NOT NULL,
    LicenseClass TINYINT UNSIGNED,
    LicenseExpiryDate DATE,
    AssignmentId INT UNSIGNED,
    UNIQUE (LicenseNumber),
    PRIMARY KEY (UserId),
    FOREIGN KEY (UserId)
        REFERENCES USER (UserId),
    FOREIGN KEY (AssignmentId)
        REFERENCES assign (AssignmentId)
        on update cascade on delete set null
);

CREATE TABLE IF NOT EXISTS vehicle (
    VehicleId INT UNSIGNED AUTO_INCREMENT,
    LicensePlate VARCHAR(10) NOT NULL,
    VehicleType VARCHAR(10),
    LicenseExpiryDate DATE,
    MaxWeightCapacity VARCHAR(20),
    PRIMARY KEY (VehicleId),
    unique (LicensePlate)
);

CREATE TABLE IF NOT EXISTS drive (
    VehicleId INT UNSIGNED,
    UserId INT UNSIGNED,
    PRIMARY KEY (VehicleId , UserId),
    FOREIGN KEY (VehicleId)
        REFERENCES Vehicle (VehicleId)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (UserId)
        REFERENCES driver (UserId)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS route (
    RouteId INT UNSIGNED AUTO_INCREMENT,
    RouteName VARCHAR(100),
    RouteType INT UNSIGNED,
    Transitime TIME,
    PRIMARY KEY (RouteId)
);

CREATE TABLE IF NOT EXISTS shipment (
    ShipmentId INT UNSIGNED AUTO_INCREMENT,
    TotalWeight VARCHAR(20),
    DepartureDate DATE,
    ActualArrivalTime DATETIME,
    RouteId INT UNSIGNED,
    PRIMARY KEY (ShipmentId),
    FOREIGN KEY (RouteId)
        REFERENCES route (RouteId)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assignment (
    AssignmentId INT UNSIGNED AUTO_INCREMENT,
    AssignDate DATE NOT NULL,
    AssignmentStatus TINYINT UNSIGNED DEFAULT 0,
    ShipmentId INT UNSIGNED,
    PRIMARY KEY (AssignmentId),
    FOREIGN KEY (ShipmentId)
        REFERENCES shipment (ShipmentId)
        ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS assign (
    VehicleId INT UNSIGNED,
    UserId INT UNSIGNED,
    AssignmentId INT UNSIGNED,
    PRIMARY KEY (AssignmentId , UserId),
    FOREIGN KEY (VehicleId)
        REFERENCES Vehicle (VehicleId)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (UserId)
        REFERENCES driver (UserId)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (AssignmentId)
        REFERENCES Assignment (AssignmentId)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- drop database assignment;







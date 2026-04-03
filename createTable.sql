create database if not exists assignment;

use assignment;
CREATE TABLE IF NOT EXISTS User (
    UserId INT AUTO_INCREMENT PRIMARY KEY,
    Account VARCHAR(50) NOT NULL UNIQUE,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Status TINYINT DEFAULT 1
);

create table if not exists Staff (
	UserId Int auto_increment primary key,
    Position varchar(100),
    Department varchar(100),
    foreign key (UserId) References User(UserId)
);

create table if not exists Supervise(
	SuperviseeId int,
    SupervisorId int
);

create table if not exists Customer (
	UserId int auto_increment primary key,
    PayTerm varchar(50),
    CustomerType tinyint,
    CreditLimit int,
    StaffId int,
    foreign key (StaffId) references Staff(UserId)
);

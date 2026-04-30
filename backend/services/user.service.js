const db = require("../config/db");

async function getUserById(userId) {
    const [rows] = await db.query(
        `SELECT u.UserId AS id, u.Name AS name, c.CustomerType AS customerType
         FROM \`USER\` u
         LEFT JOIN \`CUSTOMER\` c ON u.UserId = c.UserId
         WHERE u.UserId = ?`,
        [userId]
    );

    return rows[0] || null;
}

async function getAllUsers() {
    const [rows] = await db.query(
        `SELECT u.UserId AS id, u.Name AS name, c.CustomerType AS customerType
         FROM \`USER\` u
         LEFT JOIN \`CUSTOMER\` c ON u.UserId = c.UserId`
    );

    return rows;
}

module.exports = {
    getUserById,
    getAllUsers
};

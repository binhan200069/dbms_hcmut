const db = require("../config/db");

async function getUserById(userId) {
    const [rows] = await db.query(
        `SELECT u.UserId AS id, u.Name AS name, u.Email AS email,
                c.CustomerType AS customerType,
                s.Position AS position,
                CASE
                    WHEN s.UserId IS NOT NULL THEN 'STAFF'
                    WHEN c.UserId IS NOT NULL THEN 'CUSTOMER'
                    WHEN d.UserId IS NOT NULL THEN 'DRIVER'
                    ELSE 'STAFF'
                END AS role
         FROM \`USER\` u
         LEFT JOIN \`CUSTOMER\` c ON u.UserId = c.UserId
         LEFT JOIN \`STAFF\` s ON u.UserId = s.UserId
         LEFT JOIN \`DRIVER\` d ON u.UserId = d.UserId
         WHERE u.UserId = ?`,
        [userId]
    );

    return rows[0] || null;
}

async function getAllUsers() {
    const [rows] = await db.query(
        `SELECT u.UserId AS id, u.Name AS name, u.Email AS email,
                c.CustomerType AS customerType,
                s.Position AS position,
                CASE
                    WHEN s.UserId IS NOT NULL THEN 'STAFF'
                    WHEN c.UserId IS NOT NULL THEN 'CUSTOMER'
                    WHEN d.UserId IS NOT NULL THEN 'DRIVER'
                    ELSE 'STAFF'
                END AS role
         FROM \`USER\` u
         LEFT JOIN \`CUSTOMER\` c ON u.UserId = c.UserId
         LEFT JOIN \`STAFF\` s ON u.UserId = s.UserId
         LEFT JOIN \`DRIVER\` d ON u.UserId = d.UserId`
    );

    return rows;
}


module.exports = {
    getUserById,
    getAllUsers
};

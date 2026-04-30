const userService = require("../services/user.service");

async function getUsers(req, res, next) {
    try {
        const users = await userService.getAllUsers();
        return res.status(200).json({ data: users });
    } catch (err) {
        return next(err);
    }
}

async function getUser(req, res, next) {
    try {
        const userId = Number.parseInt(req.params.id, 10);
        if (!userId || userId <= 0) {
            return res.status(400).json({ message: "Invalid user id." });
        }

        const user = await userService.getUserById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        return res.status(200).json({ data: user });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    getUsers,
    getUser
};

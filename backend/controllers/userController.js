const User = require("../models/User");

// Get all users
const getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");

        res.json(users);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch users"
        });
    }
};

// Change user role
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        const validRoles = [
            "Employee",
            "Reviewer",
            "Manager",
            "Administrator"
        ];

        if (!validRoles.includes(role)) {
            return res.status(400).json({
                message: "Invalid role"
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        user.role = role;
        await user.save();

        res.json({
            message: "User role updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update role"
        });
    }
};

// Delete user
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({
            message: "User deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete user"
        });
    }
};

module.exports = {
    getUsers,
    updateUserRole,
    deleteUser
};
const User = require("../models/User");

// =====================================================
// GET ALL USERS
// Administrator
// =====================================================

const getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");

        res.json(users);

    } catch (error) {
        console.error("Get users error:", error);

        res.status(500).json({
            message: "Failed to fetch users"
        });
    }
};


// =====================================================
// CHANGE USER ROLE
// Administrator
// =====================================================

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
        console.error("Update role error:", error);

        res.status(500).json({
            message: "Failed to update role"
        });
    }
};


// =====================================================
// DELETE USER
// Administrator
// =====================================================

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
        console.error("Delete user error:", error);

        res.status(500).json({
            message: "Failed to delete user"
        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    getUsers,
    updateUserRole,
    deleteUser
};
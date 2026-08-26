const express = require("express");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    getUsers,
    updateUserRole,
    deleteUser
} = require("../controllers/userController");

const router = express.Router();

// Protected profile route
router.get("/profile", protect, (req, res) => {
    res.json({
        message: "You accessed a protected route",
        user: req.user
    });
});

// Admin test route
router.get(
    "/admin",
    protect,
    authorizeRoles("Administrator"),
    (req, res) => {
        res.json({
            message: "Welcome Administrator"
        });
    }
);

// Manager test route
router.get(
    "/manager",
    protect,
    authorizeRoles("Manager", "Administrator"),
    (req, res) => {
        res.json({
            message: "Welcome Manager"
        });
    }
);

// Administrator: view all users
router.get(
    "/",
    protect,
    authorizeRoles("Administrator"),
    getUsers
);

// Administrator: change user's role
router.put(
    "/:id/role",
    protect,
    authorizeRoles("Administrator"),
    updateUserRole
);

// Administrator: delete user
router.delete(
    "/:id",
    protect,
    authorizeRoles("Administrator"),
    deleteUser
);

module.exports = router;
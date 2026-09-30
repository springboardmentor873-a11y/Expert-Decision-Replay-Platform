const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    getUsers,
    updateUserRole,
    deleteUser
} = require("../controllers/userController");


// =====================================================
// PROFILE
// =====================================================

router.get(
    "/profile",
    protect,
    (req, res) => {
        res.json({
            message: "You accessed a protected route",
            user: req.user
        });
    }
);


// =====================================================
// ADMIN TEST ROUTE
// =====================================================

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


// =====================================================
// MANAGER TEST ROUTE
// =====================================================

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


// =====================================================
// ADMIN USER MANAGEMENT
// =====================================================

// Get all users
router.get(
    "/",
    protect,
    authorizeRoles("Administrator"),
    getUsers
);


// Change user role
router.put(
    "/:id/role",
    protect,
    authorizeRoles("Administrator"),
    updateUserRole
);


// Delete user
router.delete(
    "/:id",
    protect,
    authorizeRoles("Administrator"),
    deleteUser
);


module.exports = router;
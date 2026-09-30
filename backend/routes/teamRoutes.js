const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    createTeam,
    getAllTeams,
    getMyTeams,
    requestToJoinTeam,
    getTeamJoinRequests,
    approveJoinRequest,
    rejectJoinRequest,
    removeMemberFromTeam,
    deleteTeam
} = require("../controllers/teamController");

// =====================================================
// EMPLOYEE / ALL AUTHENTICATED USERS
// =====================================================

// Get all active teams
router.get(
    "/",
    protect,
    getAllTeams
);

// Get teams where current user is a member
router.get(
    "/my-teams",
    protect,
    getMyTeams
);

// Request to join a team
router.post(
    "/join-request",
    protect,
    requestToJoinTeam
);

// =====================================================
// MANAGER / ADMINISTRATOR
// =====================================================

// Create a team
router.post(
    "/",
    protect,
    authorizeRoles("Manager", "Administrator"),
    createTeam
);

// Get pending join requests
router.get(
    "/join-requests",
    protect,
    authorizeRoles("Manager", "Administrator"),
    getTeamJoinRequests
);

// Approve join request
router.put(
    "/join-requests/:requestId/approve",
    protect,
    authorizeRoles("Manager", "Administrator"),
    approveJoinRequest
);

// Reject join request
router.put(
    "/join-requests/:requestId/reject",
    protect,
    authorizeRoles("Manager", "Administrator"),
    rejectJoinRequest
);

// Remove member
router.delete(
    "/:teamId/members/:memberId",
    protect,
    authorizeRoles("Manager", "Administrator"),
    removeMemberFromTeam
);

// Delete team
router.delete(
    "/:teamId",
    protect,
    authorizeRoles("Manager", "Administrator"),
    deleteTeam
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;
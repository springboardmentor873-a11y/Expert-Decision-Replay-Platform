const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    createTeam,
    getAllTeams,
    getMyTeams,
    getTeamDetails,
    requestToJoinTeam,
    getTeamJoinRequests,
    approveJoinRequest,
    rejectJoinRequest,
    removeMemberFromTeam,
    deleteTeam
} = require("../controllers/teamController");


// =====================================================
// GET ALL TEAMS
// =====================================================

router.get(
    "/",
    protect,
    getAllTeams
);


// =====================================================
// GET MY TEAMS
// =====================================================

router.get(
    "/my-teams",
    protect,
    getMyTeams
);


// =====================================================
// GET COMPLETE DETAILS OF ONE TEAM
// Members + Decisions + Statistics
// =====================================================

router.get(
    "/:teamId/details",
    protect,
    getTeamDetails
);


// =====================================================
// SEND JOIN REQUEST
// =====================================================

router.post(
    "/join-request",
    protect,
    requestToJoinTeam
);


// =====================================================
// CREATE TEAM
// Manager / Administrator only
// =====================================================

router.post(
    "/",
    protect,
    authorizeRoles(
        "Manager",
        "Administrator"
    ),
    createTeam
);


// =====================================================
// GET JOIN REQUESTS
// Manager / Administrator only
// =====================================================

router.get(
    "/join-requests",
    protect,
    authorizeRoles(
        "Manager",
        "Administrator"
    ),
    getTeamJoinRequests
);


// =====================================================
// APPROVE JOIN REQUEST
// Manager / Administrator only
// =====================================================

router.put(
    "/join-requests/:requestId/approve",
    protect,
    authorizeRoles(
        "Manager",
        "Administrator"
    ),
    approveJoinRequest
);


// =====================================================
// REJECT JOIN REQUEST
// Manager / Administrator only
// =====================================================

router.put(
    "/join-requests/:requestId/reject",
    protect,
    authorizeRoles(
        "Manager",
        "Administrator"
    ),
    rejectJoinRequest
);


// =====================================================
// REMOVE MEMBER
// Manager / Administrator only
// =====================================================

router.delete(
    "/:teamId/members/:memberId",
    protect,
    authorizeRoles(
        "Manager",
        "Administrator"
    ),
    removeMemberFromTeam
);


// =====================================================
// DELETE TEAM
// Manager / Administrator only
// =====================================================

router.delete(
    "/:teamId",
    protect,
    authorizeRoles(
        "Manager",
        "Administrator"
    ),
    deleteTeam
);


module.exports = router;
const Team = require("../models/Team");
const TeamJoinRequest = require("../models/TeamJoinRequest");
const User = require("../models/User");

// =====================================================
// CREATE TEAM
// Manager / Administrator
// =====================================================

const createTeam = async (req, res) => {
    try {
        const { name, description, icon } = req.body;

        if (!name || !description) {
            return res.status(400).json({
                message: "Team name and description are required"
            });
        }

        // Check if team with same name already exists
        const existingTeam = await Team.findOne({
            name: name.trim()
        });

        if (existingTeam) {
            return res.status(400).json({
                message: "A team with this name already exists"
            });
        }

        const team = await Team.create({
            name: name.trim(),
            description: description.trim(),
            icon: icon || "👥",
            manager: req.user.id,
            members: [req.user.id],
            status: "active"
        });

        const populatedTeam = await Team.findById(team._id)
            .populate("manager", "name email role")
            .populate("members", "name email role");

        res.status(201).json({
            message: "Team created successfully",
            team: populatedTeam
        });

    } catch (error) {
        console.error("Create team error:", error);

        res.status(500).json({
            message: "Failed to create team"
        });
    }
};


// =====================================================
// GET ALL ACTIVE TEAMS
// Employees can see available teams
// =====================================================

const getAllTeams = async (req, res) => {
    try {
        const teams = await Team.find({ status: "active" })
            .populate("manager", "name email")
            .populate("members", "name email role")
            .sort({ createdAt: -1 });

        res.json(teams);

    } catch (error) {
        console.error("Get teams error:", error);

        res.status(500).json({
            message: "Failed to fetch teams"
        });
    }
};


// =====================================================
// GET MY TEAMS
// Teams where current user is a member
// =====================================================

const getMyTeams = async (req, res) => {
    try {
        const teams = await Team.find({
            members: req.user.id,
            status: "active"
        })
            .populate("manager", "name email")
            .populate("members", "name email role")
            .sort({ createdAt: -1 });

        res.json(teams);

    } catch (error) {
        console.error("Get my teams error:", error);

        res.status(500).json({
            message: "Failed to fetch your teams"
        });
    }
};


// =====================================================
// REQUEST TO JOIN TEAM
// Employee
// =====================================================

const requestToJoinTeam = async (req, res) => {
    try {
        const { teamId } = req.body;

        if (!teamId) {
            return res.status(400).json({
                message: "Team ID is required"
            });
        }

        const team = await Team.findById(teamId);

        if (!team) {
            return res.status(404).json({
                message: "Team not found"
            });
        }

        if (team.status !== "active") {
            return res.status(400).json({
                message: "This team is not active"
            });
        }

        // Check whether already a member
        const alreadyMember = team.members.some(
            member => member.toString() === req.user.id.toString()
        );

        if (alreadyMember) {
            return res.status(400).json({
                message: "You are already a member of this team"
            });
        }

        // Check existing pending request
        const existingRequest = await TeamJoinRequest.findOne({
            team: teamId,
            employee: req.user.id,
            status: "Pending"
        });

        if (existingRequest) {
            return res.status(400).json({
                message: "You already have a pending request for this team"
            });
        }

        const request = await TeamJoinRequest.create({
            team: teamId,
            employee: req.user.id,
            status: "Pending"
        });

        const populatedRequest = await TeamJoinRequest.findById(request._id)
            .populate("team", "name description icon")
            .populate("employee", "name email role");

        res.status(201).json({
            message: "Join request sent successfully",
            request: populatedRequest
        });

    } catch (error) {
        console.error("Join request error:", error);

        res.status(500).json({
            message: "Failed to send join request"
        });
    }
};


// =====================================================
// GET JOIN REQUESTS FOR MANAGER
// =====================================================

const getTeamJoinRequests = async (req, res) => {
    try {
        const teams = await Team.find({
            manager: req.user.id
        }).select("_id");

        const teamIds = teams.map(team => team._id);

        const requests = await TeamJoinRequest.find({
            team: { $in: teamIds },
            status: "Pending"
        })
            .populate("team", "name description icon")
            .populate("employee", "name email role")
            .sort({ createdAt: -1 });

        res.json(requests);

    } catch (error) {
        console.error("Get join requests error:", error);

        res.status(500).json({
            message: "Failed to fetch join requests"
        });
    }
};


// =====================================================
// APPROVE JOIN REQUEST
// Manager
// =====================================================

const approveJoinRequest = async (req, res) => {
    try {
        const { requestId } = req.params;

        const request = await TeamJoinRequest.findById(requestId)
            .populate("team")
            .populate("employee", "name email role");

        if (!request) {
            return res.status(404).json({
                message: "Join request not found"
            });
        }

        if (request.status !== "Pending") {
            return res.status(400).json({
                message: "This request has already been processed"
            });
        }

        // Make sure current user manages this team
        if (
            request.team.manager.toString() !==
            req.user.id.toString()
        ) {
            return res.status(403).json({
                message: "You are not the manager of this team"
            });
        }

        // Add employee to team
        const alreadyMember = request.team.members.some(
            member =>
                member.toString() ===
                request.employee._id.toString()
        );

        if (!alreadyMember) {
            request.team.members.push(request.employee._id);
            await request.team.save();
        }

        // Update request
        request.status = "Approved";
        request.reviewedBy = req.user.id;
        request.reviewedAt = new Date();

        await request.save();

        res.json({
            message: `${request.employee.name} has been added to the team`,
            request
        });

    } catch (error) {
        console.error("Approve request error:", error);

        res.status(500).json({
            message: "Failed to approve join request"
        });
    }
};


// =====================================================
// REJECT JOIN REQUEST
// Manager
// =====================================================

const rejectJoinRequest = async (req, res) => {
    try {
        const { requestId } = req.params;

        const request = await TeamJoinRequest.findById(requestId)
            .populate("team")
            .populate("employee", "name email role");

        if (!request) {
            return res.status(404).json({
                message: "Join request not found"
            });
        }

        if (request.status !== "Pending") {
            return res.status(400).json({
                message: "This request has already been processed"
            });
        }

        if (
            request.team.manager.toString() !==
            req.user.id.toString()
        ) {
            return res.status(403).json({
                message: "You are not the manager of this team"
            });
        }

        request.status = "Rejected";
        request.reviewedBy = req.user.id;
        request.reviewedAt = new Date();

        await request.save();

        res.json({
            message: `${request.employee.name}'s request was rejected`,
            request
        });

    } catch (error) {
        console.error("Reject request error:", error);

        res.status(500).json({
            message: "Failed to reject join request"
        });
    }
};


// =====================================================
// REMOVE MEMBER FROM TEAM
// Manager
// =====================================================

const removeMemberFromTeam = async (req, res) => {
    try {
        const { teamId, memberId } = req.params;

        const team = await Team.findById(teamId);

        if (!team) {
            return res.status(404).json({
                message: "Team not found"
            });
        }

        // Only team manager can remove members
        if (
            team.manager.toString() !==
            req.user.id.toString()
        ) {
            return res.status(403).json({
                message: "Only the team manager can remove members"
            });
        }

        // Manager cannot remove themselves
        if (
            team.manager.toString() ===
            memberId.toString()
        ) {
            return res.status(400).json({
                message: "Team manager cannot be removed from the team"
            });
        }

        const isMember = team.members.some(
            member => member.toString() === memberId.toString()
        );

        if (!isMember) {
            return res.status(404).json({
                message: "User is not a member of this team"
            });
        }

        team.members = team.members.filter(
            member => member.toString() !== memberId.toString()
        );

        await team.save();

        res.json({
            message: "Member removed from team successfully"
        });

    } catch (error) {
        console.error("Remove member error:", error);

        res.status(500).json({
            message: "Failed to remove member"
        });
    }
};


// =====================================================
// DELETE TEAM
// Manager / Administrator
// =====================================================

const deleteTeam = async (req, res) => {
    try {
        const { teamId } = req.params;

        const team = await Team.findById(teamId);

        if (!team) {
            return res.status(404).json({
                message: "Team not found"
            });
        }

        // Manager can delete only their own team
        if (
            req.user.role === "Manager" &&
            team.manager.toString() !== req.user.id.toString()
        ) {
            return res.status(403).json({
                message: "You can only delete teams that you manage"
            });
        }

        await Team.findByIdAndDelete(teamId);

        // Remove related requests
        await TeamJoinRequest.deleteMany({
            team: teamId
        });

        res.json({
            message: "Team deleted successfully"
        });

    } catch (error) {
        console.error("Delete team error:", error);

        res.status(500).json({
            message: "Failed to delete team"
        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    createTeam,
    getAllTeams,
    getMyTeams,
    requestToJoinTeam,
    getTeamJoinRequests,
    approveJoinRequest,
    rejectJoinRequest,
    removeMemberFromTeam,
    deleteTeam
};
const express = require("express");

const router = express.Router();


const {

    getRelationships,

    getRelationshipById,

    createRelationship,

    deleteRelationship

} = require(
    "../controllers/relationshipController"
);


/* =========================
   GET ALL RELATIONSHIPS
========================= */

router.get(
    "/",
    getRelationships
);


/* =========================
   GET RELATIONSHIP BY ID
========================= */

router.get(
    "/:id",
    getRelationshipById
);


/* =========================
   CREATE RELATIONSHIP
========================= */

router.post(
    "/",
    createRelationship
);


/* =========================
   DELETE RELATIONSHIP
========================= */

router.delete(
    "/:id",
    deleteRelationship
);


module.exports = router;
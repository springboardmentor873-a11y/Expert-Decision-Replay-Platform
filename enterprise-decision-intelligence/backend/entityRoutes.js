const express = require("express");

const router = express.Router();


const {

    getEntities,

    getEntityById,

    createEntity,

    deleteEntity

} = require(
    "../controllers/entityController"
);


/* =========================
   GET ALL ENTITIES
========================= */

router.get(
    "/",
    getEntities
);


/* =========================
   GET ENTITY BY ID
========================= */

router.get(
    "/:id",
    getEntityById
);


/* =========================
   CREATE ENTITY
========================= */

router.post(
    "/",
    createEntity
);


/* =========================
   DELETE ENTITY
========================= */

router.delete(
    "/:id",
    deleteEntity
);


module.exports = router;
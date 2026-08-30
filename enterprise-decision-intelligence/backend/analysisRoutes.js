const express = require("express");

const router = express.Router();


const {
    getAnalysis
} = require(
    "../controllers/analysisController"
);


/* =========================
   GET ENTERPRISE ANALYSIS
========================= */

router.get(
    "/",
    getAnalysis
);


module.exports = router;
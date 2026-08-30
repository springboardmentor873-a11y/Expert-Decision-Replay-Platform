const decisionService =
    require("../services/decisionService");


/* =========================
   GET ENTERPRISE ANALYSIS
========================= */

const getAnalysis = async (
    req,
    res,
    next
) => {

    try {

        const analysis =
            await decisionService.getDecisionAnalysis();


        res.status(200).json(
            analysis
        );

    }

    catch (error) {

        next(error);

    }

};


/* =========================
   EXPORT CONTROLLER
========================= */

module.exports = {

    getAnalysis

};
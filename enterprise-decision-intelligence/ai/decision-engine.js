/* =========================================
   AI DECISION ENGINE
   Enterprise Decision Intelligence Platform
========================================= */


const {
    analyzeRisk
} = require(
    "../analytics/risk-analysis"
);


const {
    analyzeImpact
} = require(
    "../analytics/impact-analysis"
);


const {
    analyzeDependency
} = require(
    "../analytics/dependency-analysis"
);


const {
    analyzeDecision
} = require(
    "../analytics/decision-score"
);



/* =========================================
   MAIN DECISION ENGINE
========================================= */

function runDecisionEngine(
    entities,
    relationships
) {


    /* =========================
       TOTAL COUNTS
    ========================= */

    const totalEntities =
        entities.length;


    const totalRelationships =
        relationships.length;



    /* =========================
       RISK ANALYSIS
    ========================= */

    const riskAnalysis =
        analyzeRisk(
            relationships
        );



    /* =========================
       IMPACT ANALYSIS
    ========================= */

    const impactAnalysis =
        analyzeImpact(

            totalEntities,

            totalRelationships

        );



    /* =========================
       DEPENDENCY ANALYSIS
    ========================= */

    const dependencyAnalysis =
        analyzeDependency(

            totalEntities,

            totalRelationships

        );



    /* =========================
       DECISION ANALYSIS
    ========================= */

    const decisionAnalysis =
        analyzeDecision(

            impactAnalysis.impactScore,

            riskAnalysis.riskScore,

            dependencyAnalysis.dependencyScore

        );



    /* =========================
       FINAL RESULT
    ========================= */

    return {

        totalEntities:
            totalEntities,


        totalRelationships:
            totalRelationships,


        risk:
            riskAnalysis,


        impact:
            impactAnalysis,


        dependency:
            dependencyAnalysis,


        decision:
            decisionAnalysis

    };

}



/* =========================================
   EXPORT DECISION ENGINE
========================================= */

module.exports = {

    runDecisionEngine

};
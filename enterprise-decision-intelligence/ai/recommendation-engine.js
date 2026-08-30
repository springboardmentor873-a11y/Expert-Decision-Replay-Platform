/* =========================================
   AI RECOMMENDATION ENGINE
   Enterprise Decision Intelligence Platform
========================================= */


/* =========================================
   GENERATE RECOMMENDATIONS
========================================= */

function generateRecommendations(
    analysis
) {

    const recommendations = [];


    const riskScore =
        analysis.risk.riskScore;


    const impactScore =
        analysis.impact.impactScore;


    const dependencyScore =
        analysis.dependency.dependencyScore;


    const decisionScore =
        analysis.decision.decisionScore;



    /* =========================
       RISK RECOMMENDATION
    ========================= */

    if (
        riskScore >= 60
    ) {

        recommendations.push(
            "High enterprise risk detected. Reduce critical risks before implementation."
        );

    }

    else if (
        riskScore >= 30
    ) {

        recommendations.push(
            "Moderate risk detected. Monitor important enterprise risks."
        );

    }

    else {

        recommendations.push(
            "Enterprise risk level is manageable."
        );

    }



    /* =========================
       IMPACT RECOMMENDATION
    ========================= */

    if (
        impactScore >= 75
    ) {

        recommendations.push(
            "The proposed decision is expected to create high business impact."
        );

    }

    else if (
        impactScore >= 40
    ) {

        recommendations.push(
            "The decision has moderate expected business impact."
        );

    }

    else {

        recommendations.push(
            "The expected business impact is low. Review the decision benefits."
        );

    }



    /* =========================
       DEPENDENCY RECOMMENDATION
    ========================= */

    if (
        dependencyScore >= 70
    ) {

        recommendations.push(
            "High dependency detected. Review critical enterprise connections."
        );

    }

    else if (
        dependencyScore >= 40
    ) {

        recommendations.push(
            "Moderate dependencies detected. Monitor connected systems and departments."
        );

    }

    else {

        recommendations.push(
            "Enterprise dependencies are at a manageable level."
        );

    }



    /* =========================
       FINAL DECISION
    ========================= */

    if (
        decisionScore >= 75
    ) {

        recommendations.push(
            "Final Recommendation: Proceed with the decision while continuously monitoring risks and dependencies."
        );

    }

    else if (
        decisionScore >= 50
    ) {

        recommendations.push(
            "Final Recommendation: Proceed conditionally after addressing identified risks."
        );

    }

    else {

        recommendations.push(
            "Final Recommendation: Do not proceed yet. Perform additional analysis and risk reduction."
        );

    }



    return recommendations;

}



/* =========================================
   EXPORT RECOMMENDATION ENGINE
========================================= */

module.exports = {

    generateRecommendations

};
/* =========================================
   DECISION SCORE MODULE
   Enterprise Decision Intelligence Platform
========================================= */


/*
    Decision Intelligence Score Formula

    Positive Factors:
    - Impact Score
    - Low Risk
    - Low Dependency

    Formula:

    (
        Impact Score
        +
        (100 - Risk Score)
        +
        (100 - Dependency Score)
    ) / 3
*/


function calculateDecisionScore(
    impactScore,
    riskScore,
    dependencyScore
) {


    const decisionScore =
        Math.round(

            (

                impactScore +

                (100 - riskScore) +

                (100 - dependencyScore)

            )

            / 3

        );


    /*
        Ensure score stays
        between 0 and 100
    */

    return Math.max(

        0,

        Math.min(
            decisionScore,
            100
        )

    );

}



/*
    Determine Decision Status
*/


function getDecisionStatus(
    decisionScore
) {


    if (
        decisionScore >= 75
    ) {

        return "Recommended";

    }


    else if (
        decisionScore >= 50
    ) {

        return "Conditional";

    }


    else {

        return "Not Recommended";

    }

}



/*
    Generate Recommendation
*/


function generateRecommendation(
    decisionScore
) {


    if (
        decisionScore >= 75
    ) {

        return (
            "Proceed with the enterprise decision. " +
            "Continue monitoring critical risks and dependencies."
        );

    }


    else if (
        decisionScore >= 50
    ) {

        return (
            "The decision can proceed conditionally. " +
            "Reduce risks and dependencies before implementation."
        );

    }


    else {

        return (
            "The decision is not recommended at this stage. " +
            "Perform additional analysis and reduce enterprise risks."
        );

    }

}



/*
    Complete Decision Analysis
*/


function analyzeDecision(
    impactScore,
    riskScore,
    dependencyScore
) {


    const decisionScore =
        calculateDecisionScore(

            impactScore,

            riskScore,

            dependencyScore

        );


    const decisionStatus =
        getDecisionStatus(
            decisionScore
        );


    const recommendation =
        generateRecommendation(
            decisionScore
        );


    return {

        decisionScore:

            decisionScore,


        decisionStatus:

            decisionStatus,


        recommendation:

            recommendation

    };

}



/* =========================================
   EXPORT FUNCTIONS
========================================= */

module.exports = {

    calculateDecisionScore,

    getDecisionStatus,

    generateRecommendation,

    analyzeDecision

};
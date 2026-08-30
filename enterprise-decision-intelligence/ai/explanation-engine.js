/* =========================================
   AI EXPLANATION ENGINE
   Enterprise Decision Intelligence Platform
========================================= */


/* =========================================
   GENERATE DECISION EXPLANATION
========================================= */

function generateExplanation(
    analysis
) {

    const riskScore =
        analysis.risk.riskScore;


    const riskLevel =
        analysis.risk.riskLevel;


    const impactScore =
        analysis.impact.impactScore;


    const impactLevel =
        analysis.impact.impactLevel;


    const dependencyScore =
        analysis.dependency.dependencyScore;


    const dependencyLevel =
        analysis.dependency.dependencyLevel;


    const decisionScore =
        analysis.decision.decisionScore;


    const decisionStatus =
        analysis.decision.decisionStatus;


    let explanation = [];


    /* =========================
       OVERALL DECISION
    ========================= */

    explanation.push(

        `The enterprise decision score is ${decisionScore}%, ` +
        `and the decision status is "${decisionStatus}".`

    );



    /* =========================
       RISK EXPLANATION
    ========================= */

    explanation.push(

        `The enterprise risk score is ${riskScore}%, ` +
        `which represents a ${riskLevel} risk level.`

    );


    if (
        riskScore >= 60
    ) {

        explanation.push(

            "High risk factors should be reduced before implementing the decision."

        );

    }

    else if (
        riskScore >= 30
    ) {

        explanation.push(

            "Moderate risks are present and should be continuously monitored."

        );

    }

    else {

        explanation.push(

            "The current enterprise risk level is manageable."

        );

    }



    /* =========================
       IMPACT EXPLANATION
    ========================= */

    explanation.push(

        `The expected business impact score is ${impactScore}%, ` +
        `which indicates a ${impactLevel} impact level.`

    );


    if (
        impactScore >= 75
    ) {

        explanation.push(

            "The proposed decision is expected to create strong positive business value."

        );

    }

    else if (
        impactScore >= 40
    ) {

        explanation.push(

            "The decision is expected to provide a moderate level of business value."

        );

    }

    else {

        explanation.push(

            "The expected business impact is limited and should be reviewed."

        );

    }



    /* =========================
       DEPENDENCY EXPLANATION
    ========================= */

    explanation.push(

        `The dependency score is ${dependencyScore}%, ` +
        `which represents a ${dependencyLevel} dependency level.`

    );


    if (
        dependencyScore >= 70
    ) {

        explanation.push(

            "Critical dependencies between enterprise systems and departments should be reviewed."

        );

    }

    else if (
        dependencyScore >= 40
    ) {

        explanation.push(

            "Several enterprise components are interconnected and require monitoring."

        );

    }

    else {

        explanation.push(

            "Enterprise dependencies are currently at a manageable level."

        );

    }



    /* =========================
       FINAL EXPLANATION
    ========================= */

    if (
        decisionScore >= 75
    ) {

        explanation.push(

            "Overall, the available analysis supports proceeding with the enterprise decision."

        );

    }

    else if (
        decisionScore >= 50
    ) {

        explanation.push(

            "Overall, the decision can proceed conditionally after improving the identified risk areas."

        );

    }

    else {

        explanation.push(

            "Overall, the decision requires further analysis and improvement before implementation."

        );

    }



    return explanation;

}



/* =========================================
   EXPORT EXPLANATION ENGINE
========================================= */

module.exports = {

    generateExplanation

};
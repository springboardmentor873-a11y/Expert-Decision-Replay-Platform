/* =========================================
   RISK ANALYSIS MODULE
   Enterprise Decision Intelligence Platform
========================================= */


/*
    This function calculates enterprise risk
    based on relationship strength.

    High dependency  = Higher risk
    Medium dependency = Moderate risk
    Low dependency   = Lower risk
*/


function calculateRiskScore(
    relationships
) {

    let riskPoints = 0;


    relationships.forEach(
        relationship => {


            const strength =
                relationship.strength;


            if (
                strength === "High"
            ) {

                riskPoints += 10;

            }


            else if (
                strength === "Medium"
            ) {

                riskPoints += 5;

            }


            else if (
                strength === "Low"
            ) {

                riskPoints += 2;

            }

        }
    );


    /*
        Limit the risk score
        between 0 and 100
    */

    const riskScore =
        Math.min(
            riskPoints,
            100
        );


    return riskScore;

}



/*
    Determine Risk Level
*/


function getRiskLevel(
    riskScore
) {

    if (
        riskScore <= 30
    ) {

        return "Low";

    }


    else if (
        riskScore <= 60
    ) {

        return "Medium";

    }


    else {

        return "High";

    }

}



/*
    Complete Risk Analysis
*/


function analyzeRisk(
    relationships
) {

    const riskScore =
        calculateRiskScore(
            relationships
        );


    const riskLevel =
        getRiskLevel(
            riskScore
        );


    return {

        riskScore:

            riskScore,


        riskLevel:

            riskLevel

    };

}



/* =========================================
   EXPORT FUNCTIONS
========================================= */

module.exports = {

    calculateRiskScore,

    getRiskLevel,

    analyzeRisk

};
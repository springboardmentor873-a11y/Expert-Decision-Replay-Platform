/* =========================================
   IMPACT ANALYSIS MODULE
   Enterprise Decision Intelligence Platform
========================================= */


/*
    Impact Score Calculation

    More enterprise entities and
    relationships indicate a higher
    potential business impact.
*/


function calculateImpactScore(
    totalEntities,
    totalRelationships
) {


    /* Entity Contribution */

    const entityImpact =
        totalEntities * 3;


    /* Relationship Contribution */

    const relationshipImpact =
        totalRelationships * 2;


    /* Total Impact Score */

    let impactScore =
        entityImpact +
        relationshipImpact;


    /*
        Keep score between
        0 and 100
    */

    impactScore =
        Math.min(
            impactScore,
            100
        );


    return impactScore;

}



/*
    Determine Impact Level
*/


function getImpactLevel(
    impactScore
) {


    if (
        impactScore >= 75
    ) {

        return "High";

    }


    else if (
        impactScore >= 40
    ) {

        return "Medium";

    }


    else {

        return "Low";

    }

}



/*
    Complete Impact Analysis
*/


function analyzeImpact(
    totalEntities,
    totalRelationships
) {


    const impactScore =
        calculateImpactScore(

            totalEntities,

            totalRelationships

        );


    const impactLevel =
        getImpactLevel(
            impactScore
        );


    return {

        impactScore:

            impactScore,


        impactLevel:

            impactLevel

    };

}



/* =========================================
   EXPORT FUNCTIONS
========================================= */

module.exports = {

    calculateImpactScore,

    getImpactLevel,

    analyzeImpact

};
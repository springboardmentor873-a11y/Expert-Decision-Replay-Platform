/* =========================================
   DEPENDENCY ANALYSIS MODULE
   Enterprise Decision Intelligence Platform
========================================= */


/*
    Dependency Score Calculation

    More relationships compared to entities
    indicate higher dependency between
    enterprise components.
*/


function calculateDependencyScore(
    totalEntities,
    totalRelationships
) {


    /*
        Prevent division by zero
    */

    if (
        totalEntities === 0
    ) {

        return 0;

    }


    /*
        Dependency Formula

        Relationships
        ---------------- × 20
        Total Entities
    */

    let dependencyScore =
        Math.round(

            (
                totalRelationships /
                totalEntities
            )

            * 20

        );


    /*
        Keep score between
        0 and 100
    */

    dependencyScore =
        Math.min(
            dependencyScore,
            100
        );


    return dependencyScore;

}



/*
    Determine Dependency Level
*/


function getDependencyLevel(
    dependencyScore
) {


    if (
        dependencyScore >= 70
    ) {

        return "High";

    }


    else if (
        dependencyScore >= 40
    ) {

        return "Medium";

    }


    else {

        return "Low";

    }

}



/*
    Complete Dependency Analysis
*/


function analyzeDependency(
    totalEntities,
    totalRelationships
) {


    const dependencyScore =
        calculateDependencyScore(

            totalEntities,

            totalRelationships

        );


    const dependencyLevel =
        getDependencyLevel(
            dependencyScore
        );


    return {

        dependencyScore:

            dependencyScore,


        dependencyLevel:

            dependencyLevel

    };

}



/* =========================================
   EXPORT FUNCTIONS
========================================= */

module.exports = {

    calculateDependencyScore,

    getDependencyLevel,

    analyzeDependency

};
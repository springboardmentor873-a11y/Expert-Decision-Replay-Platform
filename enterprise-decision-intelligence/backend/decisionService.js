const db = require("../database");


/* =========================
   DATABASE COUNT FUNCTION
========================= */

const getCount = (tableName) => {

    return new Promise(
        (resolve, reject) => {

            db.get(

                `
                SELECT COUNT(*) AS count
                FROM ${tableName}
                `,

                [],

                (error, row) => {

                    if (error) {

                        reject(error);

                    }

                    else {

                        resolve(row.count);

                    }

                }

            );

        }

    );

};


/* =========================
   GET RELATIONSHIP STRENGTH
========================= */

const getRelationshipStrengths = () => {

    return new Promise(
        (resolve, reject) => {

            db.all(

                `
                SELECT strength
                FROM relationships
                `,

                [],

                (error, rows) => {

                    if (error) {

                        reject(error);

                    }

                    else {

                        resolve(rows);

                    }

                }

            );

        }

    );

};


/* =========================
   CALCULATE DECISION ANALYSIS
========================= */

const getDecisionAnalysis = async () => {

    /* Get Database Data */

    const totalEntities =
        await getCount("entities");


    const totalRelationships =
        await getCount("relationships");


    const relationships =
        await getRelationshipStrengths();



    /* =========================
       RISK ANALYSIS
    ========================= */

    let highRiskCount = 0;

    let mediumRiskCount = 0;

    let lowRiskCount = 0;


    relationships.forEach(
        relationship => {

            if (
                relationship.strength ===
                "High"
            ) {

                highRiskCount++;

            }

            else if (
                relationship.strength ===
                "Medium"
            ) {

                mediumRiskCount++;

            }

            else {

                lowRiskCount++;

            }

        }
    );


    /*
       Risk Formula

       High relationship dependencies
       increase enterprise risk.
    */

    let riskScore =
        Math.round(

            (
                (highRiskCount * 10) +
                (mediumRiskCount * 5) +
                (lowRiskCount * 2)
            )

        );


    /*
       Keep Risk Score
       between 0 and 100
    */

    riskScore =
        Math.min(
            riskScore,
            100
        );



    /* =========================
       IMPACT ANALYSIS
    ========================= */

    let impactScore =
        Math.round(

            (
                totalEntities * 3
            )

            +

            (
                totalRelationships * 2
            )

        );


    impactScore =
        Math.min(
            impactScore,
            100
        );



    /* =========================
       DEPENDENCY ANALYSIS
    ========================= */

    let dependencyScore = 0;


    if (
        totalEntities > 0
    ) {

        dependencyScore =
            Math.round(

                (
                    totalRelationships /
                    totalEntities
                )

                * 20

            );

    }


    dependencyScore =
        Math.min(
            dependencyScore,
            100
        );



    /* =========================
       DECISION SCORE
    ========================= */

    let decisionScore =
        Math.round(

            (

                impactScore +

                (100 - riskScore) +

                (100 - dependencyScore)

            )

            / 3

        );


    decisionScore =
        Math.max(
            0,

            Math.min(
                decisionScore,
                100
            )

        );



    /* =========================
       RISK LEVEL
    ========================= */

    let riskLevel;


    if (
        riskScore <= 30
    ) {

        riskLevel =
            "Low";

    }

    else if (
        riskScore <= 60
    ) {

        riskLevel =
            "Medium";

    }

    else {

        riskLevel =
            "High";

    }



    /* =========================
       RETURN ANALYSIS RESULT
    ========================= */

    return {

        totalEntities:

            totalEntities,


        totalRelationships:

            totalRelationships,


        riskScore:

            riskScore,


        impactScore:

            impactScore,


        dependencyScore:

            dependencyScore,


        decisionScore:

            decisionScore,


        riskLevel:

            riskLevel

    };

};


/* =========================
   EXPORT SERVICE
========================= */

module.exports = {

    getDecisionAnalysis

};
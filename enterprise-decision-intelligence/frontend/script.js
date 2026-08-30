const API = "http://localhost:5000/api";


/* =========================
   LOAD DASHBOARD DATA
========================= */

async function loadDashboard() {

    try {

        const response = await fetch(`${API}/analysis`);

        const data = await response.json();


        const entityCount =
            document.getElementById("entityCount");

        const relationshipCount =
            document.getElementById("relationshipCount");

        const decisionScore =
            document.getElementById("decisionScore");

        const riskLevel =
            document.getElementById("riskLevel");


        if (entityCount) {

            entityCount.innerText =
                data.totalEntities;

        }


        if (relationshipCount) {

            relationshipCount.innerText =
                data.totalRelationships;

        }


        if (decisionScore) {

            decisionScore.innerText =
                data.decisionScore + "%";

        }


        if (riskLevel) {

            riskLevel.innerText =
                data.riskLevel;

        }

    }

    catch (error) {

        console.log("Backend connection error:", error);


        /* Demo Data */

        const entityCount =
            document.getElementById("entityCount");

        const relationshipCount =
            document.getElementById("relationshipCount");

        const decisionScore =
            document.getElementById("decisionScore");

        const riskLevel =
            document.getElementById("riskLevel");


        if (entityCount) {

            entityCount.innerText = 25;

        }


        if (relationshipCount) {

            relationshipCount.innerText = 48;

        }


        if (decisionScore) {

            decisionScore.innerText = "87%";

        }


        if (riskLevel) {

            riskLevel.innerText = "Low";

        }

    }

}


/* =========================
   PAGE LOAD
========================= */

document.addEventListener(
    "DOMContentLoaded",
    loadDashboard
);
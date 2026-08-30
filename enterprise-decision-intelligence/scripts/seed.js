/* =========================================
   DATABASE SEED SCRIPT
   Enterprise Decision Intelligence Platform
========================================= */

const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();


/* =========================================
   FILE PATHS
========================================= */

const databasePath = path.join(
    __dirname,
    "..",
    "database",
    "enterprise.db"
);

const sampleDataPath = path.join(
    __dirname,
    "..",
    "data",
    "sample-data.json"
);


/* =========================================
   READ SAMPLE DATA
========================================= */

const sampleData = JSON.parse(
    fs.readFileSync(
        sampleDataPath,
        "utf8"
    )
);


/* =========================================
   CONNECT DATABASE
========================================= */

const db = new sqlite3.Database(
    databasePath,
    (error) => {

        if (error) {

            console.error(
                "Database connection error:",
                error.message
            );

        } else {

            console.log(
                "SQLite Database Connected"
            );

        }

    }
);


/* =========================================
   INSERT SAMPLE DATA
========================================= */

db.serialize(() => {


    /* =========================
       CLEAR OLD DATA
    ========================= */

    db.run(
        "DELETE FROM relationships"
    );

    db.run(
        "DELETE FROM entities"
    );


    /* =========================
       INSERT ENTITIES
    ========================= */

    const entityStatement = db.prepare(

        `
        INSERT INTO entities
        (
            name,
            type,
            description
        )

        VALUES (?, ?, ?)
        `

    );


    sampleData.entities.forEach(
        (entity) => {

            entityStatement.run(

                entity.name,

                entity.type,

                entity.description

            );

        }
    );


    entityStatement.finalize();


    console.log(
        "Sample entities inserted successfully"
    );


    /* =========================
       INSERT RELATIONSHIPS
    ========================= */

    const relationshipStatement = db.prepare(

        `
        INSERT INTO relationships
        (
            source_entity,
            relationship_type,
            target_entity,
            strength
        )

        VALUES (?, ?, ?, ?)
        `

    );


    sampleData.relationships.forEach(
        (relationship) => {

            relationshipStatement.run(

                relationship.source,

                relationship.type,

                relationship.target,

                relationship.strength

            );

        }
    );


    relationshipStatement.finalize();


    console.log(
        "Sample relationships inserted successfully"
    );


});


/* =========================================
   CLOSE DATABASE
========================================= */

db.close(
    (error) => {

        if (error) {

            console.error(
                "Database close error:",
                error.message
            );

        } else {

            console.log(
                "Database seeding completed successfully"
            );

        }

    }
);
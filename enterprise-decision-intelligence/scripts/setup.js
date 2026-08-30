/* =========================================
   PROJECT SETUP SCRIPT
   Enterprise Decision Intelligence Platform
========================================= */


const fs = require("fs");

const path = require("path");

const sqlite3 =
    require("sqlite3").verbose();



/* =========================================
   DATABASE PATH
========================================= */

const databaseDirectory =
    path.join(
        __dirname,
        "..",
        "database"
    );


const databasePath =
    path.join(
        databaseDirectory,
        "enterprise.db"
    );


const schemaPath =
    path.join(
        databaseDirectory,
        "schema.sql"
    );



/* =========================================
   CREATE DATABASE DIRECTORY
========================================= */

if (
    !fs.existsSync(
        databaseDirectory
    )
) {

    fs.mkdirSync(
        databaseDirectory,
        {
            recursive:
                true
        }
    );


    console.log(
        "Database directory created"
    );

}



/* =========================================
   READ DATABASE SCHEMA
========================================= */

const schema =
    fs.readFileSync(
        schemaPath,
        "utf8"
    );



/* =========================================
   CREATE DATABASE
========================================= */

const db =
    new sqlite3.Database(
        databasePath,
        (error) => {

            if (
                error
            ) {

                console.error(
                    "Database error:",
                    error.message
                );

            }

            else {

                console.log(
                    "Database connected successfully"
                );

            }

        }
    );



/* =========================================
   EXECUTE DATABASE SCHEMA
========================================= */

db.exec(
    schema,
    (error) => {

        if (
            error
        ) {

            console.error(
                "Schema execution error:",
                error.message
            );

        }

        else {

            console.log(
                "Database schema created successfully"
            );

        }


        /* Close Database */

        db.close();


    }
);
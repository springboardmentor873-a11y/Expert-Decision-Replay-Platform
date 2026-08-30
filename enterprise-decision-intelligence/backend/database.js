const sqlite3 = require("sqlite3").verbose();
const path = require("path");


/* =========================
   DATABASE PATH
========================= */

const databasePath = path.join(
    __dirname,
    "..",
    "database",
    "enterprise.db"
);


/* =========================
   CREATE DATABASE CONNECTION
========================= */

const db = new sqlite3.Database(
    databasePath,
    (error) => {

        if (error) {

            console.error(
                "Database connection error:",
                error.message
            );

        }

        else {

            console.log(
                "SQLite Database Connected"
            );

        }

    }
);


/* =========================
   CREATE TABLES
========================= */

db.serialize(() => {


    /* ENTITIES TABLE */

    db.run(`

        CREATE TABLE IF NOT EXISTS entities (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL,

            type TEXT NOT NULL,

            description TEXT

        )

    `);



    /* RELATIONSHIPS TABLE */

    db.run(`

        CREATE TABLE IF NOT EXISTS relationships (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            source_entity TEXT NOT NULL,

            relationship_type TEXT NOT NULL,

            target_entity TEXT NOT NULL,

            strength TEXT DEFAULT 'Medium'

        )

    `);


});


module.exports = db;
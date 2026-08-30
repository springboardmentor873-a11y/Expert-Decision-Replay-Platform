/* =========================================
   DATABASE BACKUP SCRIPT
   Enterprise Decision Intelligence Platform
========================================= */

const fs = require("fs");

const path = require("path");


/* =========================================
   DATABASE PATH
========================================= */

const sourceDatabasePath = path.join(
    __dirname,
    "..",
    "database",
    "enterprise.db"
);


/* =========================================
   BACKUP DIRECTORY
========================================= */

const backupDirectory = path.join(
    __dirname,
    "..",
    "database",
    "backups"
);


/* =========================================
   CREATE BACKUP DIRECTORY
========================================= */

if (
    !fs.existsSync(
        backupDirectory
    )
) {

    fs.mkdirSync(
        backupDirectory,
        {
            recursive: true
        }
    );

    console.log(
        "Backup directory created"
    );

}


/* =========================================
   CHECK DATABASE EXISTS
========================================= */

if (
    !fs.existsSync(
        sourceDatabasePath
    )
) {

    console.error(
        "Database file not found. Run setup.js first."
    );

    process.exit(1);

}


/* =========================================
   CREATE BACKUP FILE NAME
========================================= */

const now = new Date();


const timestamp =

    now.getFullYear() +

    "-" +

    String(
        now.getMonth() + 1
    ).padStart(
        2,
        "0"
    )

    +

    "-" +

    String(
        now.getDate()
    ).padStart(
        2,
        "0"
    )

    +

    "_" +

    String(
        now.getHours()
    ).padStart(
        2,
        "0"
    )

    +

    "-" +

    String(
        now.getMinutes()
    ).padStart(
        2,
        "0"
    )

    +

    "-" +

    String(
        now.getSeconds()
    ).padStart(
        2,
        "0"
    );


const backupFileName =

    `enterprise-backup-${timestamp}.db`;


/* =========================================
   BACKUP FILE PATH
========================================= */

const backupPath = path.join(
    backupDirectory,
    backupFileName
);


/* =========================================
   COPY DATABASE
========================================= */

fs.copyFile(

    sourceDatabasePath,

    backupPath,

    (error) => {

        if (
            error
        ) {

            console.error(
                "Backup failed:",
                error.message
            );

        }

        else {

            console.log(
                "Database backup created successfully"
            );


            console.log(
                "Backup location:",
                backupPath
            );

        }

    }

);
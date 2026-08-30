const path = require("path");


/* =========================================
   DATABASE CONFIGURATION
========================================= */


const databaseConfig = {

    /* Database Type */

    type:
        "sqlite",


    /* Database File Path */

    databasePath:

        path.join(
            __dirname,
            "..",
            "database",
            "enterprise.db"
        )


};


module.exports =
    databaseConfig;
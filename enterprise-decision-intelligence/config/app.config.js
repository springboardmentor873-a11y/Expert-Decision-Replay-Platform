/* =========================================
   APPLICATION CONFIGURATION
   Enterprise Decision Intelligence Platform
========================================= */


const appConfig = {


    /* Application Name */

    appName:

        "Enterprise Decision Intelligence Platform",



    /* Application Version */

    version:

        "1.0.0",



    /* Server Configuration */

    port:

        process.env.PORT || 5000,



    /* API Configuration */

    apiPrefix:

        "/api",



    /* Environment */

    environment:

        process.env.NODE_ENV || "development"


};


module.exports =
    appConfig;
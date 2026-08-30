/* =========================
   GLOBAL ERROR HANDLER
========================= */

const errorHandler = (
    error,
    req,
    res,
    next
) => {


    /* Display error in terminal */

    console.error(
        "Server Error:",
        error.message
    );


    /* Send JSON error response */

    res.status(
        error.statusCode || 500
    ).json({

        success: false,

        message:

            error.message ||

            "Internal Server Error"

    });

};


module.exports =
    errorHandler;
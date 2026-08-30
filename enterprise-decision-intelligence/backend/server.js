const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");


// Load environment variables

dotenv.config();


// Initialize Express

const app = express();


// Middleware

app.use(cors());

app.use(express.json());


// Initialize Database

require("./database");


// Routes

const entityRoutes =
    require("./routes/entityRoutes");

const relationshipRoutes =
    require("./routes/relationshipRoutes");

const analysisRoutes =
    require("./routes/analysisRoutes");


// API Routes

app.use(
    "/api/entities",
    entityRoutes
);

app.use(
    "/api/relationships",
    relationshipRoutes
);

app.use(
    "/api/analysis",
    analysisRoutes
);


// Test API

app.get(
    "/",
    (req, res) => {

        res.json({

            message:
                "Enterprise Decision Intelligence Platform API is running"

        });

    }
);


// Error Handler

const errorHandler =
    require("./middleware/errorHandler");

app.use(
    errorHandler
);


// Server Port

const PORT =
    process.env.PORT || 5000;


// Start Server

app.listen(
    PORT,
    () => {

        console.log(
            `Server running on http://localhost:${PORT}`
        );

    }
);
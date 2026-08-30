const entityService =
    require("../services/entityService");


/* =========================
   GET ALL ENTITIES
========================= */

const getEntities = async (
    req,
    res,
    next
) => {

    try {

        const entities =
            await entityService.getAllEntities();


        res.status(200).json(
            entities
        );

    }

    catch (error) {

        next(error);

    }

};



/* =========================
   GET ENTITY BY ID
========================= */

const getEntityById = async (
    req,
    res,
    next
) => {

    try {

        const entity =
            await entityService.getEntityById(
                req.params.id
            );


        if (!entity) {

            return res.status(404).json({

                message:
                    "Entity not found"

            });

        }


        res.status(200).json(
            entity
        );

    }

    catch (error) {

        next(error);

    }

};



/* =========================
   CREATE ENTITY
========================= */

const createEntity = async (
    req,
    res,
    next
) => {

    try {

        const {

            name,

            type,

            description

        } = req.body;


        /* Validation */

        if (!name || !type) {

            return res.status(400).json({

                message:
                    "Entity name and type are required"

            });

        }


        const newEntity =
            await entityService.createEntity({

                name,

                type,

                description

            });


        res.status(201).json({

            message:
                "Entity created successfully",

            entity:
                newEntity

        });

    }

    catch (error) {

        next(error);

    }

};



/* =========================
   DELETE ENTITY
========================= */

const deleteEntity = async (
    req,
    res,
    next
) => {

    try {

        const deleted =
            await entityService.deleteEntity(
                req.params.id
            );


        if (!deleted) {

            return res.status(404).json({

                message:
                    "Entity not found"

            });

        }


        res.status(200).json({

            message:
                "Entity deleted successfully"

        });

    }

    catch (error) {

        next(error);

    }

};



/* =========================
   EXPORT CONTROLLERS
========================= */

module.exports = {

    getEntities,

    getEntityById,

    createEntity,

    deleteEntity

};
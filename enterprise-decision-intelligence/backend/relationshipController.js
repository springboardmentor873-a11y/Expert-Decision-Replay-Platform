const relationshipService =
    require("../services/relationshipService");


/* =========================
   GET ALL RELATIONSHIPS
========================= */

const getRelationships = async (
    req,
    res,
    next
) => {

    try {

        const relationships =
            await relationshipService.getAllRelationships();


        res.status(200).json(
            relationships
        );

    }

    catch (error) {

        next(error);

    }

};


/* =========================
   GET RELATIONSHIP BY ID
========================= */

const getRelationshipById = async (
    req,
    res,
    next
) => {

    try {

        const relationship =
            await relationshipService.getRelationshipById(
                req.params.id
            );


        if (!relationship) {

            return res.status(404).json({

                message:
                    "Relationship not found"

            });

        }


        res.status(200).json(
            relationship
        );

    }

    catch (error) {

        next(error);

    }

};


/* =========================
   CREATE RELATIONSHIP
========================= */

const createRelationship = async (
    req,
    res,
    next
) => {

    try {

        const {

            source_entity,

            relationship_type,

            target_entity,

            strength

        } = req.body;


        /* Validation */

        if (
            !source_entity ||
            !relationship_type ||
            !target_entity
        ) {

            return res.status(400).json({

                message:
                    "Source, relationship type and target are required"

            });

        }


        /* Source and Target validation */

        if (
            source_entity ===
            target_entity
        ) {

            return res.status(400).json({

                message:
                    "Source and target entity cannot be the same"

            });

        }


        const newRelationship =
            await relationshipService.createRelationship({

                source_entity,

                relationship_type,

                target_entity,

                strength:
                    strength || "Medium"

            });


        res.status(201).json({

            message:
                "Relationship created successfully",

            relationship:
                newRelationship

        });

    }

    catch (error) {

        next(error);

    }

};


/* =========================
   DELETE RELATIONSHIP
========================= */

const deleteRelationship = async (
    req,
    res,
    next
) => {

    try {

        const deleted =
            await relationshipService.deleteRelationship(
                req.params.id
            );


        if (!deleted) {

            return res.status(404).json({

                message:
                    "Relationship not found"

            });

        }


        res.status(200).json({

            message:
                "Relationship deleted successfully"

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

    getRelationships,

    getRelationshipById,

    createRelationship,

    deleteRelationship

};
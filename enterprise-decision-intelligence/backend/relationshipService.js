const db = require("../database");


/* =========================
   GET ALL RELATIONSHIPS
========================= */

const getAllRelationships = () => {

    return new Promise(
        (resolve, reject) => {

            db.all(

                `
                SELECT *
                FROM relationships
                ORDER BY id DESC
                `,

                [],

                (error, rows) => {

                    if (error) {

                        reject(error);

                    }

                    else {

                        resolve(rows);

                    }

                }

            );

        }

    );

};


/* =========================
   GET RELATIONSHIP BY ID
========================= */

const getRelationshipById = (
    id
) => {

    return new Promise(
        (resolve, reject) => {

            db.get(

                `
                SELECT *
                FROM relationships
                WHERE id = ?
                `,

                [id],

                (error, row) => {

                    if (error) {

                        reject(error);

                    }

                    else {

                        resolve(row);

                    }

                }

            );

        }

    );

};


/* =========================
   CREATE RELATIONSHIP
========================= */

const createRelationship = (
    relationship
) => {

    return new Promise(
        (resolve, reject) => {

            const {

                source_entity,

                relationship_type,

                target_entity,

                strength

            } = relationship;


            db.run(

                `
                INSERT INTO relationships
                (
                    source_entity,
                    relationship_type,
                    target_entity,
                    strength
                )

                VALUES (?, ?, ?, ?)
                `,

                [

                    source_entity,

                    relationship_type,

                    target_entity,

                    strength

                ],

                function (
                    error
                ) {

                    if (error) {

                        reject(error);

                    }

                    else {

                        resolve({

                            id:
                                this.lastID,

                            source_entity:

                                source_entity,

                            relationship_type:

                                relationship_type,

                            target_entity:

                                target_entity,

                            strength:

                                strength

                        });

                    }

                }

            );

        }

    );

};


/* =========================
   DELETE RELATIONSHIP
========================= */

const deleteRelationship = (
    id
) => {

    return new Promise(
        (resolve, reject) => {

            db.run(

                `
                DELETE FROM relationships
                WHERE id = ?
                `,

                [id],

                function (
                    error
                ) {

                    if (error) {

                        reject(error);

                    }

                    else {

                        resolve(

                            this.changes > 0

                        );

                    }

                }

            );

        }

    );

};


/* =========================
   EXPORT SERVICES
========================= */

module.exports = {

    getAllRelationships,

    getRelationshipById,

    createRelationship,

    deleteRelationship

};
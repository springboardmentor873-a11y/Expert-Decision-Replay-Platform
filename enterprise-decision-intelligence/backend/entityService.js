const db = require("../database");


/* =========================
   GET ALL ENTITIES
========================= */

const getAllEntities = () => {

    return new Promise(
        (resolve, reject) => {

            db.all(

                `
                SELECT *
                FROM entities
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
   GET ENTITY BY ID
========================= */

const getEntityById = (
    id
) => {

    return new Promise(
        (resolve, reject) => {

            db.get(

                `
                SELECT *
                FROM entities
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
   CREATE ENTITY
========================= */

const createEntity = (
    entity
) => {

    return new Promise(
        (resolve, reject) => {

            const {

                name,

                type,

                description

            } = entity;


            db.run(

                `
                INSERT INTO entities
                (
                    name,
                    type,
                    description
                )

                VALUES (?, ?, ?)
                `,

                [

                    name,

                    type,

                    description

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

                            name:

                                name,

                            type:

                                type,

                            description:

                                description

                        });

                    }

                }

            );

        }

    );

};



/* =========================
   DELETE ENTITY
========================= */

const deleteEntity = (
    id
) => {

    return new Promise(
        (resolve, reject) => {

            db.run(

                `
                DELETE FROM entities
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

    getAllEntities,

    getEntityById,

    createEntity,

    deleteEntity

};

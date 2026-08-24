import mongoose from "mongoose";

async function connectDB() {
    await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`)
}
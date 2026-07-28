import mongoose from "mongoose";
import { Database_Name } from "./dbName.js";

let isConnected = false;

const ConnectDB = async () => {
    // Reuse existing MongoDB connection
    if (isConnected) {
        return mongoose.connection;
    }

    try {
        const connection = await mongoose.connect(
            `${process.env.MONGODB_URI}${Database_Name}`
        );

        isConnected = true;

        console.log(
            `MongoDB Connected! DB HOST: ${connection.connection.host}`
        );

        return connection;
    } catch (error) {
        console.error("MongoDB Connection Error:", error);
        throw error;
    }
}

export default ConnectDB;
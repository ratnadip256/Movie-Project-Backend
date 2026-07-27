import mongoose, { connect } from "mongoose";
import { Database_Name } from "./dbName.js";

const ConnectDB= async () => {
    try {
        const connectionsInstance = await mongoose.connect(`${process.env.MONGODB_URI}${Database_Name}`);
        console.log(`MongoDb connected! DB HOST: ${connectionsInstance.connection.host}`);
    } catch (error) {
        console.log("MongoDb connect error: ", error)
        process.exit(1);
    }
}
export default ConnectDB;
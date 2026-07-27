import app from "../src/app.js";
import connectDB from "../src/db/connectDB.js";

let isConnected = false;

export default async (req, res) => {
    if (!isConnected) {
        await connectDB();
        isConnected = true;
    }
    return app(req, res);
};

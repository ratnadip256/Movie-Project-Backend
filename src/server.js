import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import ConnectDB from "./db/connectDB.js";
import app from "./app.js";

ConnectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, (req, res) => {
      console.log(
        `Server is successfully Listening on port: ${process.env.PORT}`
      );
    });
  })
  .catch((err) => console.log("Server Connection Error: ", err));

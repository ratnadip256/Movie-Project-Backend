import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import {v2 as cloudinary} from "cloudinary";
import fs from "fs";


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})


const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null; // agr koi data yani files, images, videos, etc... nhi bheja gya user se to return ro null ko ki aage kya hoga pta nhi.

    // if user send data or file have a filepath, then we upload it on cloudinary.
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // console.log("File Successfully Uploaded.", response.url);
    fs.unlinkSync(localFilePath)
    return response;
    
  } catch (error) {
  console.log("Cloudinary Upload Error:", error);
  if (localFilePath) {
    fs.unlinkSync(localFilePath);
  }
  return null;
}
}

export {uploadOnCloudinary} ;
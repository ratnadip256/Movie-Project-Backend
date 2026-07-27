import nodemailer from "nodemailer";
import 'dotenv/config'
import { apiError } from "../utils/apiError.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import handlebars from "handlebars";


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const emailSend = async (otp, email) => {
  try {
    const emailTemplateSource = fs.readFileSync(
      path.join(__dirname, "template.hbs"),
      "utf-8"
    );

    const emailTemplate = handlebars.compile(emailTemplateSource);

    const htmlToSend = emailTemplate({ otp });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const mailConfiguration = {
      from: `"SCENIX" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Your SCENIX Verification Code",
      html: htmlToSend,
    };

    
    await transporter.sendMail(mailConfiguration);

  } catch (error) {
    throw new apiError(500, error.message);
  }
};

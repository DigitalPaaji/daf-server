import nodemailer from "nodemailer"
import dotenv from "dotenv"
dotenv.config()



const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});




 export const sendOtpMail = async(email :string, otp :string)=>{
  try {
    const mailOptions = {
      from: `"Shudyam" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Shudyam Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Shudyam</h2>
          <p>Hello,</p>
          <p>Thank you for choosing <strong>Shudyam</strong>. Use the following OTP to complete your verification process. This code is valid for 5 minutes.</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #d9534f;">
            ${otp}
          </div>
          <p style="margin-top: 20px;">If you did not request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #888; text-align: center;">&copy; 2026 Shudyam. All rights reserved.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error : any) {
    console.error("Error sending OTP email:", error);
    return { success: false, error: error.message };
  }
};
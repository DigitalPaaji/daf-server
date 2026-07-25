import type { NextFunction, Request ,Response} from "express";
import User from "../../model/userModel";
import { sendOtpMail } from "../../helper/sendOtpMail";
import redisClient from "../../helper/redisServer";
import bcript from "bcrypt"
import JWT from "jsonwebtoken"
import { OAuth2Client } from "google-auth-library"



 export const sendOtp= async(req:Request,res:Response,next:NextFunction)=>{
try {
    
   const email = String(req.body.email || "")
      .trim()
      .toLowerCase();



          if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }
   

 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }



const existingUser = await User.findOne({ email }).select("_id");
       if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }
    

    const cooldownKey = `otp:cooldown:${email}`;
    const cooldownExists = await redisClient.get(cooldownKey);

  if (cooldownExists) {
      return res.status(429).json({
        success: false,
        message: "Please wait before requesting another OTP",
      });
    }



    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    

    const mailSent = await sendOtpMail(email, otp);

    if (!mailSent) {
      return res.status(500).json({
        success: false,
        message: "Unable to send OTP email",
      });
    }   


await redisClient.set(`email:otp:${email}`, otp, {
      EX: 5 * 60,
    });


await redisClient.set(cooldownKey, "1", {
      EX: 60,
    });


 return res.status(200).json({
      success: true,
      message: "OTP sent successfully. It is valid for 5 minutes.",
    });




} catch (error) {
    next(error)
}
}

export const verifyOtp = async(req:Request,res:Response,next:NextFunction)=>{
try {
  const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const otp = String(req.body.otp || "").trim();
    const password = String(req.body.password || "");
    const name = String(req.body.name || "").trim();

    if (!email || !otp || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Name, email, OTP and password are required",
      });
    }


const existingUser = await User.findOne({ email }).select("_id");
       if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const redisKey = `email:otp:${email}`;
    const storedOtp = await redisClient.get(redisKey);
   if (!storedOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }
    
    if (storedOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

     await redisClient.del(redisKey);
    await redisClient.del(`otp:cooldown:${email}`);

  
  const SALT_ROUNDS = 10;
  
  const hashpassword = await bcript.hash(password,SALT_ROUNDS)
   
     const user= await User.create({email,password:hashpassword,name})


const token = await JWT.sign({id:user._id},process.env.JWT_SECRET!,{
  expiresIn:"90d"
})

res.cookie("user_token",token,{
  httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 90 * 24 * 60 * 60 * 1000,
      path: "/",
})

 return res.status(201).json({
      success: true,
      message: "Account created successfully",
    });


} catch (error) {
    next(error)
}

}


export const loginUser = async(req:Request,res:Response,next:NextFunction)=>{
try {
 const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    
    const jwtSecret = process.env.JWT_SECRET;

    

    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured");
    }

    // Add .select("+password") if password has select: false in schema
    const user = await User.findOne({ email }).select("+password");

    // Keep the same message for invalid email and password
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcript.compare(
      password,
      user.password
    );
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

// const cart = JSON.parse(req.body.cart)




    const token = JWT.sign(
      {
        id: user._id.toString(),
      },
      jwtSecret,
      {
        expiresIn: "90d",
      }
    );

    res.cookie("user_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
      maxAge: 90 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
   
    });

} catch (error) {
  next(error)
}

}


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID!);


export const loginByGoogle= async(req:Request,res:Response,next:NextFunction)=>{
try {
  const {token} = req.body;
  if(!token){
    return
  }
 const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
const payload = ticket.getPayload();
    const { email, name } = payload as any;
 
        let user = await User.findOne({ email });

 if (!user) {
      user = await User.create({
        name,
        email,
       
      
      });
    }


 const jwtSecret = process.env.JWT_SECRET as string;
const tokenID = JWT.sign(
      {
        id: user._id.toString(),
      },
      jwtSecret!,
      {
        expiresIn: "90d",
      }
    );

    res.cookie("user_token", tokenID, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
      maxAge: 90 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
   
    });

    
} catch (error) {
next(error)
}
}


export interface RequestAuth extends Request{
    user:any;
}

export const myUser = async(req:RequestAuth,res:Response,next:NextFunction)=>{
  try {
    const user = req.user;
    return res.status(200).json({success:true,user})
  } catch (error) {
    next(error)
  }
}






import type { Request, Response } from "express";
import User from "../model/userModel";
import Otp from "../model/otpModel";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Cart from "../model/cartModel";
import mongoose from "mongoose";
import Address from "../model/addressModel";
import redisClient from "../helper/redisServer";
import { sendOtpMail } from "../helper/sendOtpMail";
import { Types } from "mongoose";


const USER_JWT_SECRET = process.env.JWT_SECRET;

export const loginUser = async(req:Request,res:Response)=>{
  try {
    const {email}= req.body;
    const otp =  `${Math.floor(100000 + Math.random() * 900000)}`;

    const key = `otp_limit:${email}`;
     
    const count = await redisClient.get(key);

      if (count && Number(count) >= 3) {
      return res.status(429).json({
        success: false,
        message: "Too many OTP requests. Try again after 5 minutes."
      });
    }
        await sendOtpMail(email, otp );

 await redisClient.set(
      `otp:${email}`,   
      otp.toString(),   
      {
        EX: 300     
      }
    );

 if (!count) {
      await redisClient.set(key, 1, { EX: 300 }); 
    } else {
      await redisClient.incr(key); 
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully"
    });
  } catch (error) {
    console.log(error)
      return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
}
 

export  const verifyOtp= async(req:Request,res:Response)=>{
  try {
      const { email, otp ,cart } = req.body;

         const storedOtp = await redisClient.get(`otp:${email}`);

 if (!storedOtp) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (storedOtp !== String(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

 await redisClient.del(`otp:${email}`);

let user = await User.findOne({email});

if(!user){
 user = await User.create({
email
  })
 


await  user.save()
} 

  if (cart.length > 0) {
      await Cart.deleteMany({user : user._id  });

      const cartData = cart.map((item : any)  => ({
        ...item,
        user: user._id,product:item.productId,productvarient:item.variantId
      }));

      await Cart.insertMany(cartData); 
    }



 const token = jwt.sign(
      { id: user._id, roles: user.role },
      USER_JWT_SECRET!,
      { expiresIn: "30d" }
    );

    res.status(200).cookie("userToken", token, {
  path:'/',
        httpOnly:true,
        expires: new Date(Date.now()+ 1000 *60 *60 * 24 * 30),
        sameSite:'none',
      secure:true,
})



return res.status(200).json({
      success: true,
      message: "Login successful",
  

   
    });


  } catch (error) {
        console.error(error);

     return res.status(500).json({
      message: "Server error",
    });
  }
}


// export const sendOtp = async (req: Request, res: Response) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({ message: "Email is required" });
//     }

//     const alreadyUser = await User.findOne({ email });
//     if (alreadyUser) {
//       return res.status(409).json({ message: "User already exists" });
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000);
//     const expiry = new Date(Date.now() + 5 * 60 * 1000);

//     let otpRecord = await Otp.findOne({ email });

//     if (otpRecord) {
//       otpRecord.otp = otp;
//       otpRecord.expiresAt = expiry;
//       await otpRecord.save();
//     } else {
//       otpRecord = await Otp.create({
//         email,
//         otp,
//         expiresAt: expiry,
//       });
//     }

//     // TODO: send email here (nodemailer)
//     // await sendOtpMail(email, otp);

//     return res.status(200).json({
//       message: "OTP sent successfully",
//     });
//   } catch (error) {
//     console.error("Send OTP Error:", error);
//     return res.status(500).json({
//       message: "Internal server error",
//     });
//   }
// };

// export const verifyOtp = async (req: Request, res: Response) => {
//   try {
//     const { email, name, password, otp } = req.body;

//     if (!email || !otp || !password || !name) {
//       return res.status(400).json({
//         message: "All fields are required",
//       });
//     }
//     const otpRecord = await Otp.findOne({ email });
//     if (!otpRecord) {
//       return res.status(400).json({
//         message: "OTP not found or expired",
//       });
//     }

//     if (otpRecord.expiresAt < new Date()) {
//       await otpRecord.deleteOne();
//       return res.status(400).json({
//         message: "OTP expired",
//       });
//     }

//     if (otpRecord.otp !== Number(otp)) {
//       return res.status(400).json({
//         message: "Invalid OTP",
//       });
//     }

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(409).json({
//         message: "User already exists",
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//     });

//     await otpRecord.deleteOne();

//     return res.status(201).json({
//       message: "Account created successfully",
//       success: true,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       message: "Internal server error",
//     });
//   }
// };

export const getAllUser = async (req:Request,res:Response)=>{
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
    const limit = 15;
    const skip = (page - 1) * limit;



        const users = await User.find().skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }).select("-password")
   const userCount = await User.countDocuments()

   
    return res.status(200).json({
      success: true,
      page:{
      page,
      totalPages: Math.ceil(userCount / limit),
      totalUsers: userCount,
      
      },
      users,
      
    });



    } catch (error) {
     return  res.status(500).json({
        message:"User Not Found"
     })   
    }
}

export const getSingleUser = async (req:Request,res:Response)=>{
  try {
    const {id} = req.params;
     
      const user = await User.findById(id).select("-password");


 if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

const cart = await Cart.find({user: user._id }).populate("product")
   const addresses = await Address.find({ user: user._id });

    return res.status(200).json({
      message: "User fetched successfully",
      user,
      cart,
      addresses,

    });

  } catch (error) {
     return res.status(500).json({ message: "Server error" });
  }
}



// export const userLogin = async(req:Request,res:Response)=>{
// try {
//   const {email,password}= req.body;
//   if(!email || !password){
//     return 
//   }
  
//   const user = await User.findOne({email});
//    if(!user){
//     return
//    }
  
//    const verifypassword = await bcrypt.compare(password,user.password);

//    if(!verifypassword){
//     return 
//    }

//    const token = jwt.sign(
//         { id: user._id },
//         process.env.JWT_SECRET as string,
//         { expiresIn: "30d" }
//       );

//         res.cookie("user_auth", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//       maxAge: 1000 * 60 * 60 * 24 * 30, 
//       path: "/",
//     }); 
//   return res.status(200).json({
//       success: true,
//       message: "User login successful",
//     });

// } catch (error) {
//       return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
// }
// }



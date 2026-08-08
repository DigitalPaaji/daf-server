import type { NextFunction, Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken"
import User from "../model/userModel";


interface AdminJwtPayload extends JwtPayload {
  id: string;
}


export interface RequestAuth extends Request{
    user:any;
}

export const verifyUser = async (req:RequestAuth ,res:Response,next:NextFunction)=>{
    try {
const token = req.cookies.user_token


           if (!token) {
      return res.status(401).json({success:false, message: "Unauthorized: No token" });
    }
       const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as AdminJwtPayload;
    
    const user = await User.findById(decoded.id).select("-password");
   if (!user) {
      return res.status(404).json({success:false, message: "Admin not found" });
    }

req.user= user 
     next();

    } catch (error) {


            return res.status(401).json({success:false, message: "Invalid or expired token" });

    }
}

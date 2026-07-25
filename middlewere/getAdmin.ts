import type { NextFunction, Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken"
import Admin from "../model/adminModel"


interface AdminJwtPayload extends JwtPayload {
  id: string;
}


export interface RequestAuth extends Request{
    admin:any;
}

export const verifyAdmin = async (req:RequestAuth ,res:Response,next:NextFunction)=>{
    try {
const token = req.cookies.admin_dash


           if (!token) {
      return res.status(401).json({success:false, message: "Unauthorized: No token" });
    }
       const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as AdminJwtPayload;
    
    const admin = await Admin.findById(decoded.id).select("-password");
   if (!admin) {
      return res.status(404).json({success:false, message: "Admin not found" });
    }

        //  c.set("admin", admin);
req.admin= admin
     next();

    } catch (error) {
            return res.status(401).json({success:false, message: "Invalid or expired token" });

    }
}

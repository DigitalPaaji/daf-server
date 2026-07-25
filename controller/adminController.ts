
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Admin from "../model/adminModel";
import { removeImage } from "../helper/removeImage";


export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

   
    if (!name || !email || !password || password.length > 25 || password.length < 5) {
      return res.status(400).json({ success: false, message: "Invalid input" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

                   
    const alreadyExists = await Admin.findOne({ email });
    if (alreadyExists) {
      return res.status(409).json({
        success: false,
        message: "Admin already exists",
      });
    }

    
    const hashPassword = await bcrypt.hash(password, 10);

 
    await Admin.create({
      name,
      email,
      password: hashPassword,
    });

    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
    });
  } catch (error) {
    console.error("Create admin error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // ✅ Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // ✅ Find admin
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ✅ Verify password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ✅ Generate JWT
    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    // ✅ Set cookie
    res.cookie("admin_dash", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


interface AuthRequest extends Request{
    admin :any
}

export const getAdmin = async (req: AuthRequest, res: Response) => {
  try {
    // admin set by auth middleware
    const admin = req.admin

    return res.status(200).json({
      success: true,
      admin,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const editAdmin = async(req: AuthRequest, res: Response) =>{
  try {
    const { email,password, newemail,newpassword  } = req.body
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }
    const admin = req.admin;

     if (!admin) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
    if(admin.email !==email){
    return res.status(403).json({
        message: "Invalid admin email",
      });
    }

      const findAdmin = await Admin.findOne({email});
      if(!findAdmin){
        return res.status(404).json({
        message: "Admin not found",
      });
      }

      const MatchPassword = await bcrypt.compare(password,findAdmin.password);

if(!MatchPassword){
   return res.status(401).json({
        message: "Incorrect password",
      });
}

if(newemail){
  findAdmin.email = newemail
}
 if (newpassword) {
      if (newpassword.length < 6 && newpassword.length > 25) {
        return res.status(400).json({
          message: "Password must be at least 6 characters and max 25",
        });
      }
      findAdmin.password = await bcrypt.hash(newpassword, 10);
    }
const logo = req.file?.filename;

if(logo){
    if(findAdmin.logo){  await removeImage({imgpath:findAdmin.logo})}
    findAdmin.logo =  `/uploads/banners/${logo}`
}
 
await findAdmin.save()

return res.status(200).json({
      message: "Admin updated successfully",
    });



  } catch (error) {
     return res.status(500).json({
      message: "Internal server error",
    });
  }
}




export const logoutAdmin = async (req: AuthRequest, res: Response) => {
  try {
    res.clearCookie("admin_dash", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Admin logged out successfully",
    });

  } catch (error: any) {
    console.error("Logout Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

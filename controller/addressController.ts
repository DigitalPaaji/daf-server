import type { Request, Response } from "express";
import Address from "../model/addressModel";


interface UserAuth extends Request{
    user:any
}

export const createAddress = async (req: UserAuth, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      firstName,
      lastName,
      phone,
      pincode,
      state,
      city,
      houseNo,
      area,
      landmark,
      addressType,
      isDefault,
    } = req.body;

  
    if (
      !firstName ||
      !lastName ||
      !phone ||
      !pincode ||
      !state ||
      !city ||
      !houseNo ||
      !area
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All required fields must be filled" });
    }

    if (isDefault) {
      await Address.updateMany(
        { user: user._id },
        { $set: { isDefault: false } }
      );
    }

    const address = await Address.create({
      user: user._id,
      firstName,
      lastName,
      phone,
      pincode,
      state,
      city,
      houseNo,
      area,
      landmark,
      addressType,
      isDefault: isDefault || false,
    });

    return res.status(201).json({
      success: true,
      message: "Address created successfully",
      data: address,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

export const getAllAddress = async (req: UserAuth, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    const addresses = await Address.find({ user: user._id });

    return res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};


export const deleteAddress = async(req: UserAuth, res: Response)=>{
try {
  const {id} = req.params;
 const  user = req.user 

   if (!user?._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    } 

  const address = await Address.findOne({_id:id,user:user._id});

if(!address){
   return res.status(404).json({
        success: false,
        message: "Address not found",
      });
}
    const wasDefault = address.isDefault;

await address.deleteOne()

 if (wasDefault) {
      const nextAddress = await Address.findOne({
        user: user._id,
      }).sort({ createdAt: -1 });

      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });


} catch (error) {
  return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
}
}

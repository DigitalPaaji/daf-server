import type { NextFunction, Request, Response } from "express";
import Coupon from "../model/couponModel";

export const CreateCouponcode = async(req:Request,res:Response,next:NextFunction)=>{
try {
       const {
      code,
      description,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      validFrom,
      validTill,
      usageLimit,
      perUserLimit,
      isActive,
    } = req.body;

if (
      !code ||
      !discountType ||
      discountValue === undefined ||
      !validFrom ||
      !validTill
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Code, discount type, discount value, valid from and valid till are required",
      });
    }

     if (!["percentage", "fixed"].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: "Discount type must be percentage or fixed",
      });
    }

    const numericDiscountValue = Number(discountValue);


 if (
      Number.isNaN(numericDiscountValue) ||
      numericDiscountValue <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Discount value must be greater than 0",
      });
    }

    if (
      discountType === "percentage" &&
      numericDiscountValue > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot be greater than 100",
      });
    }


const startDate = new Date(validFrom);
    const endDate = new Date(validTill);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid coupon dates",
      });
    }
   
    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: "Valid till date must be after valid from date",
      });
    }

    const normalizedCode = String(code).trim().toUpperCase();

    const existingCoupon = await Coupon.findOne({
      code: normalizedCode,
    });
     if (existingCoupon) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }
   const coupon = await Coupon.create({
      code: normalizedCode,
      description: description?.trim() || "",
      discountType,
      discountValue: numericDiscountValue,
      minPurchase: Number(minPurchase || 0),
      maxDiscount:
        maxDiscount !== undefined &&
        maxDiscount !== null &&
        maxDiscount !== ""
          ? Number(maxDiscount)
          : null,
      validFrom: startDate,
      validTill: endDate,
      usageLimit:
        usageLimit !== undefined &&
        usageLimit !== null &&
        usageLimit !== ""
          ? Number(usageLimit)
          : null,
      usedCount: 0,
      perUserLimit: Number(perUserLimit || 1),
       isActive: isActive ?? true,
    });
     return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
} catch (error) {
    next(error)
}
}

export const getAllCoupons = async(req:Request,res:Response,next:NextFunction)=>{
try {
    const allcoupones = await Coupon.find();

    return res.status(200).json({success:true,coupons:allcoupones})



} catch (error) {
next(error)    
}
}

export const deleteCoupon = async(req:Request,res:Response,next:NextFunction)=>{
    try {
const {id} = req.params        
    const coupon = await Coupon.findByIdAndDelete(id);
      if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
      coupon,
    });
    } catch (error) {
        next(error)
    }
}

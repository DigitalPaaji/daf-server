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


interface UserAuth extends Request{
    user : any
} 
export const ApplyCouponCode = async(req:UserAuth,res:Response,next:NextFunction)=>{
  try {

    const {couponcode,amount} = req.body;
    const user = req.user;
     if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    if (!couponcode?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

 const purchaseAmount = Number(amount);

   if (!Number.isFinite(purchaseAmount) || purchaseAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase amount",
      });
    }

   const normalizedCode = couponcode.trim().toUpperCase();
    const now = new Date();

    const coupon = await Coupon.findOne({
      code: normalizedCode,
    });

    if(!coupon){
    return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });    }

      if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: "This coupon is currently inactive",
      });
    }
     
  if (now < coupon.validFrom) {
      return res.status(400).json({
        success: false,
        message: "This coupon is not active yet",
      });
    }

    if (now > coupon.validTill) {
      return res.status(400).json({
        success: false,
        message: "This coupon has expired",
      });
    }
        if (
      coupon.usageLimit != null &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      return res.status(400).json({
        success: false,
        message: "Coupon usage limit has been reached",
      });
    }
     if (purchaseAmount < coupon.minPurchase) {
      const requiredAmount = coupon.minPurchase - purchaseAmount;

      return res.status(400).json({
        success: false,
        message: `Add ₹${requiredAmount.toFixed(
          2
        )} more to use this coupon`,
        minPurchase: coupon.minPurchase,
        requiredAmount,
      });
    }
  const userId = user._id;
const userUsage = coupon.users.find((item : any) => String(item.user) === String(userId));

    if (
      userUsage &&
      userUsage.usedCount >= coupon.perUserLimit
    ) {
      return res.status(400).json({
        success: false,
        message: "You have already reached the usage limit for this coupon",
      });
    }

    let discountAmount = 0;

    if (coupon.discountType === "percentage") {
      discountAmount =
        (purchaseAmount * coupon.discountValue) / 100;

      if (
        coupon.maxDiscount != null &&
        discountAmount > coupon.maxDiscount
      ) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    // Discount cannot exceed the cart amount
    discountAmount = Math.min(discountAmount, purchaseAmount);

    discountAmount = Number(discountAmount.toFixed(2));

    const payableAmount = Number(
      Math.max(0, purchaseAmount - discountAmount).toFixed(2)
    );

    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      coupon: {
        id: coupon._id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscount: coupon.maxDiscount,
      },
      pricing: {
        originalAmount: purchaseAmount,
        discountAmount,
        payableAmount,
      },
    });
   } catch (error) {
    next(error)
  }
}

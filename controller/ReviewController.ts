import type { Request, Response } from "express";
import Review from "../model/ReviewModel";
import mongoose from "mongoose";



export  const createReview = async(req: Request, res: Response)=>{
try {
const {name,des,work,productid} = req.body
if (!name?.trim() || !des?.trim() || !work?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name, description and work are required",
      });
    }

    if (!productid) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }
  const review = await Review.create({
      name: name.trim(),
      des: des.trim(),
      work: work.trim(),
      productid,
    });


 return res.status(201).json({
      success: true,
      message: "Review created successfully",
      review
    });
    
} catch (error) {
      return res.status(500).json({
      success: false,
      message: "Failed to create review",
    });
}
}

export const getReviews = async(req: Request, res: Response)=>{
try {
         const { productid } = req.params;

    if (!productid) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    

    const reviews = await Review.find({
      productid,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
} catch (error) {
     return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
    });
}

 }


 export const deleteReviews = async(req: Request, res: Response)=>{
    try {
        const {reviewid} = req.params
        const review = await Review.findByIdAndDelete(reviewid);

        if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
   
    });
    } catch (error) {
          return res.status(500).json({
      success: false,
      message: "Failed to delete review",
    });
    }
 }
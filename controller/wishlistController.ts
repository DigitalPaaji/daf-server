import type { Request, Response } from "express";
import Wishlist from "../model/wishlistModel";
import { Types } from "mongoose";


interface UserAuth extends Request{
    user:any
}

export const addToWishlist = async (req: UserAuth, res: Response) => {
  try {
    const user = req.user;
    const productId = req.params.productId as string; 

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    let wishlist = await Wishlist.findOne({ user: user._id });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: user._id,
        product: [productId]
      });

      return res.status(201).json({
        message: "Wishlist created and product added",
        wishlist,
      });
    }

   
    const productExists = wishlist.product.some(
      (id: any) => id.toString() === productId
    );

    if (productExists) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    wishlist.product.push(new Types.ObjectId(productId));
    await wishlist.save();

    return res.status(200).json({
      message: "Product added to wishlist",
      wishlist,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const removeFromWishlist = async  (req: UserAuth, res: Response) => {
    try {
        const user = req.user;
    const productId = req.params?.productId; 
 if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    let wishlist = await Wishlist.findOne({ user: user._id });

    if(!wishlist){
             return res.status(404).json({ message: "Wishlist not found" });

    }
wishlist.product = wishlist.product.filter(
      (id: any) => id.toString() !== productId
    );
await wishlist.save();



  return res.status(200).json({
      message: "Product removed from wishlist",
      wishlist,
    });
    } catch (error) {
            return res.status(500).json({ message: "Server error" });

    }
}

export const emptyWishList = async (req:UserAuth,res:Response)=>{
    try {
        const user = req.user;


        const wishlist = await Wishlist.findOne({user:user._id});

          if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }
        wishlist.product = [];

        await wishlist.save();

  return res.status(200).json({
      message: "Wishlist emptied successfully",
      wishlist,
    });
    } catch (error) {
            return res.status(500).json({ message: "Server error" });

    }
} 
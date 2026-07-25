import type { Request, Response } from "express";
import redisClient from "../../helper/redisServer";
import Category from "../../model/categoryModel";
import Product from "../../model/productSchema";
import mongoose from "mongoose";

export const getAllCategory = async (req: Request, res: Response) => {
    try {
        const key = "category";

      
        const cacheData = await redisClient.get(key);

        if (cacheData) {
            res.status(200).json({
                success: true,
                source: "cache",
                data: JSON.parse(cacheData),
            });
            return;
        }

     
        const categories = await Category.find().sort({ createdAt: -1 });

    
        await redisClient.setEx(
            key,
            3600,
            JSON.stringify(categories)
        );

        res.status(200).json({
            success: true,
            source: "database",
            data: categories,
        });

    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const getSingleProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({ slug })
      .populate("category");

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      data: product,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message,
    });
  }
};

export const getProduts = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = 15;
    const skip = (page - 1) * limit;
   const filter: any = {};

if(req.query.category){
filter.category = req.query.category;
}


    const [products, total] = await Promise.all([
      Product.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }).select("name slug shortDescription  images category variants isFeatured").populate("category"),

      Product.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      page:{
      page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
      
      },
      products,
      
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

export const getCartProduct=async(req:Request,res:Response)=>{
  try {
    const cartItems  = req.body ;

       if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty or invalid.",
      });
    }

  const productIds = [
      ...new Set(
        cartItems.map((item) =>
          new mongoose.Types.ObjectId(item.productId)
        )
      ),
    ];


  const products = await Product.find({
      _id: { $in: productIds },
    }).lean();



  const cartProducts = cartItems.map((item) => {
      const product = products.find(
        (p) => p._id.toString() === item.productId
      );

      if (!product) return null;

      const variant = product.variants.find(
        (v: any) => v._id.toString() == item.variantId
      );

      if (!variant) return null;

         


      return {
        productId: product._id,
        
        name: product.name,
        image: variant.images || product.images?.[0],
        price: variant.mrp,
        quantity: item.quantity,
        stock: variant.stock,
        total:  Number(variant.mrp) * item.quantity,
        variant,
      };
    }).filter(Boolean); 



 const grandTotal = cartProducts.reduce(
      (sum: number, item: any) => sum + item.total,
      0
    );

    return res.status(200).json({
      success: true,
      count: cartProducts.length,
      grandTotal,
      data: cartProducts,
    });


    
  } catch (error) {
      console.error("Error fetching cart products:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export const getWishlistProduct = async(req:Request,res:Response)=>{
  try {
    const {wishlist} = req.body;
     

    if (!Array.isArray(wishlist) || wishlist.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Wishlist must be a non-empty array",
      });
    }

     const products = await Product.find({
      _id: { $in: wishlist },
    }).lean().select("category images name variants slug").populate("category");

    
     return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
     


  } catch (error) {
      return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}





import type { Request, Response } from "express";
import slugify from "slugify";
import Category from "../model/categoryModel";
import { removeImage } from "../helper/removeImage";
import redisClient from "../helper/redisServer";



export const createCategory = async (req:Request,res:Response) => {
  try {
    const {name} = await req.body;
  const image = req.file?.filename

   

    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    if (!image) {
      return res.status(400).json({ success: false, message: "Category image is required" });
    }

    const slug = slugify(name, { lower: true });

  
    const alreadyCategory = await Category.findOne({ name });
    if (alreadyCategory) {
      return res.status(409).json(
        { success: false, message: "Category already exists" } );
    }


   ;

    const category = await Category.create({
      name,
      image:`/uploads/category/${image}`,
      slug,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });

  } catch (error: any) {
    console.error(error);
    return res.status(500).json(
      { success: false, message: "Internal server error" });
  }
};

export const getCategory = async (req:Request,res:Response) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: categories,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json(
      { success: false, message: "Failed to fetch categories" }
    );
  }
};

export const deleteCategory= async(req:Request,res:Response)=>{
    try {
       const  id  = req.params.id;
        if (!id) {
      return res.status(400).json(
        { success: false, message: "Category ID is required" });
    } 
        const category = await Category.findById(id);
        if (!category) {
      return res.status(404).json(
        { success: false, message: "Category not found" });
    } 
           if (category.product?.length > 0) {
      return res.status(409).json(
        {
          success: false,
          message: "Cannot delete category with linked products",
        });
    }

        if(category.image){
            await removeImage({imgpath:category.image})
        }
        await category.deleteOne()
   return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });


    } catch (error) {
          return  res.json(500).json(
      { success: false, message: "Failed to delete category" } );
    }
}


export const getCacheCat = async (
  req: Request,
  res: Response
)=> {
  try {
    const cacheKey = "categories";

    
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      return res.status(200).json({
        success: true,
        cached: true,
        categories: JSON.parse(cachedData),
      });
    }

    // Fetch from MongoDB
    const categories = await Category.find()
      .sort({ createdAt: -1 })
      .lean();

    // Cache for 5 minutes
    await redisClient.set(cacheKey, JSON.stringify(categories), {
      EX: 300,
    });

    return res.status(200).json({
      success: true,
      cached: false,
      categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};
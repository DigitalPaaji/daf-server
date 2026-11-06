import type { Request, Response } from "express";
import slugify from "slugify";
import Category from "../model/categoryModel";
import { removeImage } from "../helper/removeImage";
import redisClient from "../helper/redisServer";

// interface MulterRequest extends Request {
//   files?: {
//     image?: Express.Multer.File[];
//     desktop?: Express.Multer.File[];
//     mobile?: Express.Multer.File[];
//   };
// }

export const createCategory = async (req:Request,res:Response) => {
  try {
    const {name} = await req.body;
const files = req.files as {
  [fieldname: string]: Express.Multer.File[];
};

     const image = files?.image?.[0]?.filename;
     const desktop = files?.desktop?.[0]?.filename;
     const mobile = files?.mobile?.[0]?.filename;
  
   if (!image || !desktop || !mobile) {
  return res.status(400).json({
    success: false,
    message: "Category, desktop and mobile images are required",
  });
}



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
      desktop:`/uploads/category/${desktop}`,
      mobile:`/uploads/category/${mobile}`,
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
            await removeImage({imgpath:category.desktop})
            await removeImage({imgpath:category.mobile})
        }
        await category.deleteOne()
      return res.status(200).json({success: true, message: "Category deleted successfully"});


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
    const cacheKey = "categories-daf";

    
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


export const EditCategory = async (
  req: Request,
  res: Response
): Promise<any> => {
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  const image = files?.image?.[0]?.filename;
  const desktop = files?.desktop?.[0]?.filename;
  const mobile = files?.mobile?.[0]?.filename;

  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // Store old image filenames
    const oldImage = category.image;
    const oldDesktop = category.desktop;
    const oldMobile = category.mobile;

    // Update category
    category.name = name.trim();

    if (image) category.image = `/uploads/category/${image}`;
    if (desktop) category.desktop = `/uploads/category/${desktop}`;
    if (mobile) category.mobile = `/uploads/category/${mobile}`;

    await category.save();

    // Remove old images after successful update
    const imagesToRemove = [
      image ? oldImage : null,
      desktop ? oldDesktop : null,
      mobile ? oldMobile : null,
    ];



    for (const oldimage of imagesToRemove) {
      if (oldimage) {
        try {
          await removeImage({ imgpath: oldimage });
        } catch (error) {
          console.error("Unable to remove old image:", error);
        }
      }
    }


    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });

  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
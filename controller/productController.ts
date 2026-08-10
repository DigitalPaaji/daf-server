import type { Request, Response } from "express";
import Product from "../model/productSchema";
import Category from "../model/categoryModel";
import type  { PipelineStage } from "mongoose";

import { Types } from "mongoose";
import { removeImage } from "../helper/removeImage";
import redisClient from "../helper/redisServer";

export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      shortDescription,
      category,
      slug,
     isBestSaller,
      isFeatured,
      isNewArrived,
      variants,
      tags,
      seo,
      details
    } = req.body;

    if (!name || !description || !category) {
      return res.status(400).json({
        message: "Name, Description, and Category are required",
      });
    }

    // -------- Slug --------
    let productSlug = slug;
    if (!productSlug) {
      productSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    const existingProduct = await Product.findOne({ slug: productSlug });
    if (existingProduct) {
      productSlug = `${productSlug}-${Date.now()}`;
    }

    // -------- Parse JSON fields --------
    let parsedTags: string[] = [];
    let parsedSeo: any = {};

    try {
      if (tags) parsedTags = JSON.parse(tags);
      if (seo) parsedSeo = JSON.parse(seo);
    } catch {
      return res
        .status(400)
        .json({ message: "Invalid JSON in tags or seo" });
    }

    // -------- Images --------
   const files = req.files as {
  thumbnail?: Express.Multer.File[];
  images?: Express.Multer.File[];
};


    const images = files?.images?.map(
      (file) => `/uploads/product/${file.filename}`
    );
    const thumbnail = files?.thumbnail?.[0] ?`/uploads/product/${files.thumbnail[0].filename}`: "";

    const getdetails =  details ? JSON.parse(details) :{}
  
    const product = await Product.create({
      name,
      slug: productSlug,
      description,
      shortDescription,
      thumbnail,
      category,
      tags: parsedTags,
      seo: parsedSeo,
      images,
      isFeatured,
      isBestSaller,
      isNewArrived,
      variants:JSON.parse(variants),
      details:getdetails
    });


    const findCaegory = await Category.findById(category)
      if(!findCaegory){
        return res.status(401).json({success:false})
      }
   
findCaegory.product.push(product._id as Types.ObjectId);

    await findCaegory.save()

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}; 

export const getProduts = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = 15;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }).select("name slug shortDescription  thumbnail category variants isFeatured").populate("category"),

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

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

 
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // 2️⃣ Remove images associated with the product
    // Use Promise.all so all images are deleted before proceeding
    if (product.images && product.images.length > 0) {
      await Promise.all(product.images.map(img => removeImage({ imgpath: img })));
    }
   await removeImage({ imgpath: product.thumbnail })




    // 3️⃣ Find the category
    const category = await Category.findById(product.category);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

   
    category.product = category.product.filter(
      item => item.toString() !== product._id.toString()
    );
    await Promise.all(
        product.images.map((item) => removeImage({ imgpath: item }))
    )
    
    await category.save();

   
    await product.deleteOne();

    return res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const GetSingleProduct = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Product slug is required",
      });
    }
    const {cat} = req.query;

    let product ;
    if(cat){
product = await Product.findOne({ slug })
    }else{
      product = await Product.findOne({ slug }).populate("category")
    }

     
    

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });

  } catch (error: any) {
    console.error("GetSingleProduct Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const updateProduct = async(req: Request, res: Response)=>{
try {
  const slug = req.params.slug
  const product = await Product.findOne({slug});

  if(!product){
       return res.status(404).json({ message: "Product not found" });

  }

  const {name,description,shortDescription,category,tags,isFeatured,isNewArrived,isBestSaller,isActive,seo,deleteImg,details,variants} = req.body;

    const parsedSeo = seo ? JSON.parse(seo) : {};
    const parsedTags = tags ? JSON.parse(tags) : [];
    const deletimgArry: string[] = deleteImg ? JSON.parse(deleteImg) : [];
    const parseddetails = details? JSON.parse(details) : {};
    product.name = name;
    product.description = description;
    product.shortDescription = shortDescription;

    product.seo = parsedSeo;
    product.isFeatured = isFeatured ?? product.isFeatured;
    product.isNewArrived = isNewArrived ?? product.isNewArrived;
    product.isBestSaller = isBestSaller ?? product.isBestSaller;
    product.isActive = isActive ?? product.isActive;
    product.tags = parsedTags;
    product.details = parseddetails;
// let deletimgArry = JSON.parse(deleteImg) as string[];
    product.variants= JSON.parse(variants) 
   if (Array.isArray(deletimgArry) && deletimgArry.length > 0) {
      await Promise.all(
        deletimgArry.map((item) => removeImage({ imgpath: item }))
      ); 
    product.images = product.images.filter(
        (img) => !deletimgArry.includes(img)

      );
    }


const files= req.files as {
  newthumbnail: Express.Multer.File[],
  newimage: Express.Multer.File[],

}

if (files.newthumbnail?.[0]) {
  await removeImage({ imgpath: product.thumbnail });

  product.thumbnail = `/uploads/product/${files.newthumbnail[0].filename}`;
}



   const newImages = (files.newimage )?.map(
        (file) => `/uploads/product/${file.filename}`
      ) || [];

    if (newImages.length > 0) {
      product.images = [...product.images, ...newImages];
    }

if(category && category.toString() !== product.category.toString()){

  const oldCat = await Category.findById(product.category);
if (!oldCat) {
    return res.status(404).json({ message: "Old category not found" });
  }


 oldCat.product = oldCat.product.filter(
  (item) => item.toString() !== product._id.toString()
);
  const newCat = await Category.findById(category);
   if (!newCat) {
    return res.status(404).json({ message: "New category not found" });
  }
 if (!newCat.product.includes(product._id)) {
    newCat.product.push(product._id);
  }
  await Promise.all([oldCat.save(), newCat.save()]);

product.category= category;



}


    await product.save();

    return res.status(200).json({
      message: "Product updated successfully",
      product,
    });

} catch (error : any) {
  console.log(error.message)
      return res.status(500).json({ message: "Server Error" });
}
}


export const SearchProduct = async(req: Request, res: Response)=>{
try {
  const search = String(req.params.search).trim();

if (!search) {
      return res.status(400).json({
        success: false,
        message: "Search value is required",
      });
    }

    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");



const products = await Product.find({
  isActive: true,
  name: {
    $regex: safeSearch,
    $options: "i",
  },
}).select("name slug thumbnail").sort({ createdAt: -1 })
      .limit(10)
      .lean();;

return res.status(200).json({
      success: true,
      total: products.length,
      products,
    });
} catch (error) {
    console.error("Search product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search products",
    });
}
}

export const getWishlistProduct = async(req: Request, res: Response)=>{
try {
  
  const {wishlist}=  req.body;
 if (!Array.isArray(wishlist)) {
      return res.status(400).json({
        success: false,
        message: "Wishlist must be an array",
      });
    }
     if (wishlist.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Wishlist is empty",
        products: [],
      });
    }
  const product = await  Product.find({  _id: { $in: wishlist }}).select("name slug shortDescription category thumbnail").populate({path:"category",select:"name slug"})

return res.status(200).json({
      success: true,
      message: "Wishlist products fetched successfully",
      count: product.length,
      product,
    });
} catch (error : any) {
     return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
}
}




////////////cash ///////////

export const getBestSellerProduct = async(req: Request, res: Response)=>{
try {
  const key = "daf-bestseller";

    // Check cached products
    const cachedProducts = await redisClient.get(key);

    if (cachedProducts) {
      return res.status(200).json({
        success: true,
       
        products: JSON.parse(cachedProducts),
      });
    }

    // Fetch from database
    const products = await Product.find({
      isActive: true,
      isBestSaller: true,
    }).select(" variants name  thumbnail slug")
      .sort({ createdAt: -1 })
      .lean();

    // Cache for 5 minutes
    await redisClient.set(key, JSON.stringify(products), {
      EX: 300,
    });

    return res.status(200).json({
      success: true,
   
      products,
    });
  } catch (error) {
    console.error("Get bestseller products error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch bestseller products",
    });
  }
}
export const getFeaturedProduct = async(req: Request, res: Response)=>{
try {
  const key = "daf-featured";

    // Check cached products
    const cachedProducts = await redisClient.get(key);

    if (cachedProducts) {
      return res.status(200).json({
        success: true,
       
        products: JSON.parse(cachedProducts),
      });
    }

    // Fetch from database
    const products = await Product.find({
      isActive: true,
      isFeatured: true,
    }).select(" variants name  thumbnail slug")
      .sort({ createdAt: -1 })
      .lean();

    // Cache for 5 minutes
    await redisClient.set(key, JSON.stringify(products), {
      EX: 300,
    });

    return res.status(200).json({
      success: true,
   
      products,
    });
  } catch (error) {
    console.error("Get Featured products error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Featured products",
    });
  }
}

export const getSingleProduct = async(req:Request,res:Response)=>{
  try {
     const { slug } = req.params;
      if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Product slug is required",
      });
    }

       const product = await Product.findOne({
      slug,
      isActive: true,
    }).populate("category");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

      return res.status(200).json({
      success: true,
      product,
    });



  } catch (error) {
    
       return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
}

export const getProductbycat=async(req:Request,res:Response)=>{
  try {
       const {categoryid} = req.params
 
       const products = await Product.find({ isActive: true,category:categoryid}).select(" variants name  thumbnail slug").populate("category")
      .sort({ createdAt: -1 })
      .lean();
       return res.status(200).json({
      success: true,
  
      products,
    });
  } catch (error) {
     return res.status(500).json({
      success: false,
      message: "Failed to fetch products by category.",
    });
  }
}




type ProductSort =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc"
  | "price-low"
  | "price-high";

const getQueryString = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0].trim();
  }

  return "";
};

export const getProducts = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
  
const pageQuery = Number(req.query.page);

const limit = 16;
const skip = limit * (pageQuery-1) 
const categorySlug = req.query.category;
const sortValue = getQueryString(req.query.sort) || "newest";
const minPriceQuery = getQueryString(req.query.min);
const maxPriceQuery = getQueryString(req.query.max);

 const productMatch: Record<string, unknown> = {
      isActive: true,
    };


 if (categorySlug) {
       const category = await Category.findOne({
         slug: categorySlug,
       })
         .select("_id")
         .lean();

       if (!category) {
         return res.status(200).json({
           success: true,
           products: [],
           pagination: {
             totalProducts: 0,
             totalPages: 0,
             currentPage: pageQuery,
             limit,
             hasNextPage: false,
             hasPreviousPage: false,
           },
         });
       }

       productMatch.category = category._id;
     }
 let sortQuery: Record<string, 1 | -1> = {
      createdAt: -1,
      _id: -1,
    };

switch (sortValue) {
      case "oldest":
        sortQuery = {
          createdAt: 1,
          _id: 1,
        };
        break;

      case "name-asc":
        sortQuery = {
          name: 1,
          _id: 1,
        };
        break;

      case "name-desc":
        sortQuery = {
          name: -1,
          _id: -1,
        };
        break;

      

     

      case "newest":
      default:
        sortQuery = {
          createdAt: -1,
          _id: -1,
        };
        break;
    }
 let minPrice: number | undefined;
  let maxPrice: number | undefined;

 if (minPriceQuery !== "") {
      minPrice = Number(minPriceQuery);

      if (!Number.isFinite(minPrice) || minPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Minimum price must be a valid positive number",
        });
      }
    }

    if (maxPriceQuery !== "") {
      maxPrice = Number(maxPriceQuery);

      if (!Number.isFinite(maxPrice) || maxPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Maximum price must be a valid positive number",
        });
      }
    }



  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      return res.status(400).json({
        success: false,
        message: "Minimum price cannot be greater than maximum price",
      });
    }

 const priceConditions: Record<string, unknown>[] = [
    
      {
        $isNumber: "$$variant.mrp",
      },
    ];

    if (minPrice !== undefined) {
      priceConditions.push({
        $gte: ["$$variant.mrp", minPrice],
      });
    }

    if (maxPrice !== undefined) {
      priceConditions.push({
        $lte: ["$$variant.mrp", maxPrice],
      });
    }





const pipeline: PipelineStage[] = [
      {
        $match: productMatch,
      },


     {
        $set: {
          variants: {
            $filter: {
              input: {
                $ifNull: ["$variants", []],
              },
              as: "variant",
              cond: {
                $eq: ["$$variant.isActive", true],
              },
            },
          },
        },
      },

    
      {
        $match: {
          "variants.0": {
            $exists: true,
          },
        },
      },

     
      {
        $set: {
          priceMatchedVariants: {
            $filter: {
              input: "$variants",
              as: "variant",
              cond: {
                $and: priceConditions,
              },
            },
          },
        },
      },

     
      {
        $match: {
          "priceMatchedVariants.0": {
            $exists: true,
          },
        },
      },

      
      {
        $set: {
          sortPrice: {
            $min: {
              $map: {
                input: "$priceMatchedVariants",
                as: "variant",
                in: "$$variant.mrp",
              },
            },
          },
        },
      },



       {
        $lookup:{
            from: Category.collection.name, 
            localField: "category",
            foreignField: "_id",
            as: "category",
    
        }
      },
       {
           $set: {
             category: {
             $arrayElemAt: ["$category", 0],
         },
        },
      },




  
{
   $facet: {

     products: [
            {
              $sort: sortQuery,
            },
            {
              $skip: skip,
            },
            {
              $limit: limit,
            },
           {
        $project:{
          name:1,
          slug:1,
          thumbnail: 1,
      
          variants: 1,
          createdAt: 1,
          category: {
         _id: "$category._id",
        name: "$category.name",
        slug: "$category.slug",
      
      },

        }
      },
          ],
    pagination: [
            {
              $count: "totalProducts",
            },
          ],
   }
},



     
  ]


const [result]  = await Product.aggregate(pipeline).collation({
      locale: "en",
      strength: 2,
    });

    const products = result?.products ?? [];

    const totalProducts =
      result?.pagination?.[0]?.totalProducts ?? 0;
const totalPages = Math.ceil(totalProducts / limit);

    return res.status(200).json({
      success: true,
      products,
      pagination: {
        totalProducts,
        totalPages,
        currentPage: pageQuery,
        limit,
        hasNextPage: pageQuery < totalPages,
        hasPreviousPage: pageQuery > 1,
      // },
      // filters: {
      //   category: categorySlug || null,
      //   minPrice: minPrice ?? null,
      //   maxPrice: maxPrice ?? null,
      //   sort,
      },
    });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};



export const getRandomProduct = async(req: Request, res: Response)=>{
  try {
     
     const catid = req.params.catid
     const key = `RandomProduct-${catid}-daf`;
  const getCachProduct =  await redisClient.get(key);
if(getCachProduct){

  return res.status(200).json({
        success: true,
        message: "Random products fetched successfully",
        products: JSON.parse(getCachProduct),
        
      });
}

let products
if(catid =="All"){
 products = await Product.find({
          isActive: true,
}).select("name slug thumbnail category variants").populate({
      path: "category",
      select: "name slug image",
    })
}
else{
 products = await Product.find({
   category: catid,
          isActive: true,
}).select("name slug thumbnail category variants").populate({
      path: "category",
      select: "name slug image",
    })
}




    await redisClient.set(key, JSON.stringify(products), {
      EX: 300,
    });

    return res.status(200).json({
      success: true,
      message: "Random products fetched successfully",
     
      products,
    
    });



  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
}

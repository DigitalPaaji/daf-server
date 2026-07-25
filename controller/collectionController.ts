import type { Request, Response } from "express";
import Collection from "../model/collectionsModel";
import Product from "../model/productSchema";


export const createCollection = async(req:Request,res:Response)=>{
try {
    const {name,description}= req.body;
  if (!name) {
      return res.status(400).json({
        success: false,
        message: "Collection name is required",
      });
    }

    const slug = name.toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
const existing = await Collection.findOne({ slug });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Collection already exists",
      });
    }
  const file=   req?.file as Express.Multer.File

           const image = file?.filename || "";

        const collection=  await  Collection.create({
            name,description,slug,image :`/uploads/collection/${image}`
        })

           return res.status(201).json({
      success: true,
      message: "Collection created successfully",
      data: collection,
    });

} catch (error:any) {
     return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
}
}

export const getCollection = async (req: Request, res: Response) => {
  try {
    const collections = await Collection.find()
      .populate({
        path: "products",
        select: "slug name images", 
      });

    return res.status(200).json({
      success: true,
      data: collections,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};


export const removeProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;   
    const { pid } = req.body;    
    const collection = await Collection.findById(id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    collection.products = collection.products.filter(
      (item) => item.toString() !== pid
    );

    await collection.save();

    return res.status(200).json({
      success: true,
      message: "Product removed successfully",
      collection,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error,
    });
  }
};


export const addProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;   
    const { pid } = req.body;    
    const collection = await Collection.findById(id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    // collection.products = collection.products.filter(
    //   (item) => item.toString() !== pid
    // );


    if(collection.products.includes(pid)){
      return
    }
    collection.products.push(pid)
    await collection.save();

    return res.status(200).json({
      success: true,
      message: "Product removed successfully",
      collection,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error,
    });
  }
};


export const getSingleCollection = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const collection = await Collection.find({slug}).populate([{path:"products",select:"name slug shortDescription  thumbnail category variants isFeatured"}]).lean();

 if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

 return res.status(200).json({
      success: true,
      collection,
    });
  } catch (error) {
     return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}





export const getAllProduct = async (req: Request, res: Response) => {
  try {
    const products = await Product.find().select("slug name images");

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error,
    });
  }
};




export const deleteCollection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;   
 
    const collection = await Collection.findById(id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

 

    await collection.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Collection removed successfully",
    
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error,
    });
  }
};






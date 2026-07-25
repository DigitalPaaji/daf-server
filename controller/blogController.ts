import  type { Request, Response } from "express";
import { removeImage } from "../helper/removeImage";
import Blog from "../model/BlogModel";
import redisClient from "../helper/redisServer";

export const createSlug = (text: string): string => {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};


export const createBlog = async(req:Request,res:Response)=>{
    let uploadedThumbnail = "";
try {



    const {
      title,
      des,
      readingtime,
      fulldes,
      status,
    } = req.body;

    const file = req.file as Express.Multer.File | undefined;

        if (!des?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Blog description is required",
      });
    } 
    if (!readingtime || Number(readingtime) < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid reading time is required",
      });
    }


    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Blog thumbnail is required",
      });
    }
     uploadedThumbnail = `/uploads/blog/${file.filename}`;

    let parsedFullDescription = [];

     if (fulldes) {
      try {
        parsedFullDescription =
          typeof fulldes === "string"
            ? JSON.parse(fulldes)
            : fulldes;

        if (!Array.isArray(parsedFullDescription)) {
          throw new Error("fulldes must be an array");
        }
      } catch {
        await removeImage({
          imgpath: uploadedThumbnail,
        });

        return res.status(400).json({
          success: false,
          message: "Invalid full description format",
        });
      }
    }
const slug = createSlug(title)
const blog = await Blog.create({
      title: title.trim(),
      slug,
      des: des.trim(),
      readingtime: Number(readingtime),
      thumbnail: uploadedThumbnail,
      fulldes: parsedFullDescription,
      status:
        status === undefined
          ? true
          : status === true || status === "true",
    });
 return res.status(201).json({
      success: true,
      message: "Blog created successfully",
      blog,
    });
    
} catch (error) {
    
    if (uploadedThumbnail) {
      try {
        await removeImage({
          imgpath: uploadedThumbnail,
        });
      } catch (fileError) {
        console.error("Thumbnail cleanup error:", fileError);
      }
    }

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create blog",
    });
}
}

export const getallBlogs = async(req:Request,res:Response)=>{
    try {
        const blogs = await Blog.find();
  
return res.status(200).json({
      success: true,
      count: blogs.length,
      blogs,
    });

    } catch (error) {
         return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch blogs",
    });
    }
}

export const deleteBlog =async(req:Request,res:Response)=>{
try {
    const id = req.params.id;
const blog = await Blog.findById(id);

if(!blog){
       return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
}

await removeImage({imgpath:blog.thumbnail})

await blog.deleteOne();



  return res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });

} catch (error) {
    
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete blog",
    });
}


}


/////cache


export const getBlogs=async(req:Request,res:Response)=>{
try {
    const key= "blogs"

const cacheBlogs = await redisClient.get(key);

if(cacheBlogs){
    return res.status(200).json({
        success:true,
        blogs:JSON.parse(cacheBlogs)
    })
};


const blogs = await Blog.aggregate([
      {
        $match: {
          status: true,
        },
      },
      {
        $sample: {
          size: 3,
        },
      },
    ]);


await redisClient.set(
      key,
      JSON.stringify(blogs),
      {
        EX: 300,
      }
    );

    return res.status(200).json({
      success: true,

      blogs,
   
    });






} catch (error) {
      return res.status(500).json({
         success: false,
          message:
            error instanceof Error
           ? error.message
           : "Failed to fetch random blogs",
    });
}

}

export const getSingleBlog= async(req:Request,res:Response)=>{
try {
  const {slug} = req.params;
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Blog slug is required",
      });
    }

  const blog = await Blog.findOne({slug,status:true});

 if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }
      return res.status(200).json({
      success: true,
      message: "Blog fetched successfully",
      blog,
    });


} catch (error) {
 
  return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
}
}

export const getallBlogsUser = async (req:Request,res:Response)=>{
  try {
    const blogs = await Blog.find({status:true}).sort({ createdAt: -1 });;
     

  return res.status(200).json({
      success: true,
      message: "Blogs fetched successfully",
      count: blogs.length,
      blogs,
    });

  } catch (error) {
      return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}


  
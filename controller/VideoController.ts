import { Request, Response } from "express";
import mongoose from "mongoose";
import Video from "../model/videoModel";
import { removeImage } from "../helper/removeImage";
import redisClient from "../helper/redisServer";

export const createVideo = async (
  req: Request,
  res: Response
) => {
  try {
    const videoFile = req.file as Express.Multer.File | undefined;
    const { productid } = req.body;

    if (!videoFile) {
      return res.status(400).json({
        success: false,
        message: "Video file is required",
      });
    }

    if (!productid) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productid)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const createdVideo = await Video.create({
      video: `/uploads/videos/${videoFile.filename}`,
      product: productid,
    });

    return res.status(201).json({
      success: true,
      message: "Video uploaded successfully",
      video: createdVideo,
    });
  } catch (error) {
    console.error("Create video error:", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to upload video",
    });
  }
};

export const getVideos = async(req: Request,res: Response)=>{
try {
   const videos = await Video.find()
      .populate({
        path: "product",
        select: "name slug thumbnail",
      })  .sort({ createdAt: -1 })
      .lean();

        return res.status(200).json({
      success: true,
      count: videos.length,
      videos,
    });

} catch (error) {
    console.error("Get videos error:", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch videos",
    });
}
  }

  export const videoDelete= async(req: Request,res: Response)=>{
try {
   const id = req.params.id;
   const video = await Video.findById(id)
   
   if(!video){
     return res.status(404).json({
        success: false,
        message: "Video not found",
      });
   }
  await removeImage({imgpath:video.video})

  
 await Video.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Video deleted successfully",
    });



} catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete video",
    });
}
  }




  export const getRandomVideo = async(req: Request,res: Response)=>{
try {
     const key = "random-videos";

    const cachedVideos = await redisClient.get(key);

    if (cachedVideos) {
      const videos = JSON.parse(cachedVideos);

      return res.status(200).json({
        success: true,
    
        videos,
      
      });
    }
  
    const randomVideos = await Video.aggregate([
      {
        $match: {
          status: true,
        },
      },
      {
        $sample: {
          size: 10,
        },
      },
    ]);
const videos = await Video.populate(randomVideos, {
      path: "product",
      select: "name slug thumbnail",
    });

    // Cache for 5 minutes
    await redisClient.set(key, JSON.stringify(videos), {
      EX: 300,
    });

    return res.status(200).json({
      success: true,
      
      videos,
   
    });

} catch (error) {
     return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch random videos",
    });
}
  }
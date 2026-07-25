import type { Request, Response } from "express";
import Banners from "../model/bannersModel";
import { removeImage } from "../helper/removeImage";
import redisClient from "../helper/redisServer";

export const createBanner = async (req: Request, res: Response) => {
  try {
    const files = req.files as {
      desktop_Image?: Express.Multer.File[];
      mobile_Image?: Express.Multer.File[];
    };

    if (!files?.desktop_Image || !files?.mobile_Image) {
      return res.status(400).json({
        success: false,
        message: "Desktop and Mobile images are required",
      });
    }

    const desktop_Image_Path = files.desktop_Image[0].filename as string;
    const mobile_Image_Path = files.mobile_Image[0].filename as string;

    const count = await Banners.countDocuments();

    const banner = await Banners.create({
      desktop_Image: `/uploads/banners/${desktop_Image_Path}`,
      mobile_Image: `/uploads/banners/${mobile_Image_Path}`,
      count: count + 1,
    });

    return res.json({
      success: true,
      message: "Banner created successfully",
      data: banner,
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getBanners = async (req: Request, res: Response) => {
  try {
    const cashekey = "banner";

    const bannerCashe = await redisClient.get(cashekey);
    if (bannerCashe) {
      return res.json({
        success: true,
        data: JSON.parse(bannerCashe),
      });
    }

    const banners = await Banners.find().sort({ count: 1 });

    await redisClient.set(cashekey, JSON.stringify(banners), {
      EX: 300,
    });

    return res.json({
      success: true,
      data: banners,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch banners" });
  }
};

export const bannerForAminPAnel = async (req: Request, res: Response) => {
  try {
    const banners = await Banners.find().sort({ count: 1 });

    return res.json({
      success: true,
      data: banners,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch banners" });
  }
};
export const deleteBanner = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const banner = await Banners.findById(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    // ✅ Delete Desktop Image
    if (banner.desktop_Image) {
      await removeImage({ imgpath: banner.desktop_Image });
    }

    // ✅ Delete Mobile Image
    if (banner.mobile_Image) {
      await removeImage({ imgpath: banner.mobile_Image });
    }

    // ✅ Delete Banner from DB
    await banner.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete Banner Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const toggleBanner = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const banner = await Banners.findById(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }
    banner.status = !banner.status;

    await banner.save();

    return res.status(200).json({
      success: true,
      message: `Banner ${banner.status ? "activated" : "deactivated"} successfully`,
      data: banner,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

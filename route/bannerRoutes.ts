import express from "express";
import { uploadBanners } from "../helper/addImages";
import { bannerForAminPAnel, createBanner, deleteBanner, getBanners, toggleBanner } from "../controller/bannerController";
import { verifyAdmin } from "../middlewere/getAdmin";

const route = express.Router();

route.post(
  "/create",verifyAdmin as any,
    uploadBanners.fields([
    { name: "desktop_Image", maxCount: 1 },
    { name: "mobile_Image", maxCount: 1 },
  ]),createBanner
);

route.get("/get-all",verifyAdmin as any,bannerForAminPAnel)
route.delete("/delete/:id",verifyAdmin as any,deleteBanner)
route.put("/toggle/:id",verifyAdmin as any,toggleBanner)


export default route;

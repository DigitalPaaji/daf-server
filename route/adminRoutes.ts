import express from "express";
import { createAdmin, editAdmin, getAdmin, loginAdmin, logoutAdmin } from "../controller/adminController";
import { verifyAdmin } from "../middlewere/getAdmin";
import { uploadBanners } from "../helper/addImages";
import { rateLimiter } from "../helper/rateLimiter";
const route = express.Router();

route.post("/create",createAdmin)
route.post("/login",rateLimiter(5,60),loginAdmin)
route.get("/get",verifyAdmin as any,getAdmin as any)
route.put("/update",verifyAdmin as any,uploadBanners.single("logo"),editAdmin as any)
route.get ("/logout",verifyAdmin as any,logoutAdmin as any);

export default route;
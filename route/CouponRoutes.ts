
import express from "express";
import { CreateCouponcode, deleteCoupon, getAllCoupons } from "../controller/couponController";
const routes = express.Router();


routes.post("/create",CreateCouponcode)
routes.get("/getall",getAllCoupons)
routes.delete('/delete/:id',deleteCoupon)

export default routes
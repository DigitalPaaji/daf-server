
import express from "express";
import { ApplyCouponCode, CreateCouponcode, deleteCoupon, getAllCoupons } from "../controller/couponController";
import { verifyUser } from "../middlewere/getUser";
const routes = express.Router();


routes.post("/create",CreateCouponcode)
routes.get("/getall",getAllCoupons)
routes.delete('/delete/:id',deleteCoupon)


routes.post("/apply",verifyUser as any,ApplyCouponCode as any)


export default routes
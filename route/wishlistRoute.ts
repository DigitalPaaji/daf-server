import express from "express";
import { addToWishlist, removeFromWishlist } from "../controller/wishlistController";
import { verifyUser } from "../middlewere/getUser";
const route =  express.Router();


route.post("/add-to-wishlist/:productId",verifyUser as any,addToWishlist as any)
route.post("/remove-from-wishlist/:productId",verifyUser as any,removeFromWishlist as any)


export default route
import express from "express";
import { createProduct, deleteProduct, getProduts, GetSingleProduct, getWishlistProduct, SearchProduct, updateProduct } from "../controller/productController";
import { uploadProducts } from "../helper/addImages";
const route = express.Router();


route.post("/create",uploadProducts.fields([
    {name:"thumbnail",maxCount :10},
{name:"images",maxCount :10}

]),createProduct)
route.get("/all",getProduts)
route.delete("/delete/:id",deleteProduct)

route.get("/single/:slug",GetSingleProduct)

route.put("/update/:slug",uploadProducts.fields([
    {name:"newthumbnail",maxCount:1},
    {name:"newimage",maxCount:10}
]),updateProduct)

route.get("/search/:search",SearchProduct)
route.patch("/wishlist",getWishlistProduct)



export default route;



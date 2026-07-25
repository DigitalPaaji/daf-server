import express from "express";
import { getAllCategory, getCartProduct, getProduts, getSingleProduct, getWishlistProduct } from "../../controller/user/dataController";
import { loginUser, verifyOtp } from "../../controller/userContoller";



const route = express.Router();


route.get("/category",getAllCategory)


route.get("/product/:slug",getSingleProduct)
route.get("/products",getProduts)
route.post("/getcart_product",getCartProduct)
route.post("/getwishlist_product",getWishlistProduct)


////// auth   ////////////
route.post("/login",loginUser)
route.post("/verifyotp",verifyOtp)


/////oder ////// 

// route.post("/createOrder",verifyUser as any,createOrder as any)
// route.post("/verifyorder",verifyUser as any,verifyOrder as any)

////addresss///
// route.post("/address/create",verifyUser as any,createAddress as any)
// route.get("/address/get",verifyUser as any,getAllAddress as any)



export default route
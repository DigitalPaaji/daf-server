import express from "express";
import { verifyUser } from "../../middlewere/getUser";
import { addIncrement, addToCart, cartDecrement, deleteCart, getAllCartitem, getCartProductsLocal } from "../../controller/cartController";

const route = express.Router();


route.post("/add",verifyUser as any,addToCart as any)

route.get("/get",verifyUser as any,getAllCartitem as any)
route.get("/increment/:cartid",verifyUser as any,addIncrement as any)
route.post("/getlocal",getCartProductsLocal)

route.get("/decrement/:cartid",verifyUser as any,cartDecrement as any)

route.delete("/delete/:id",verifyUser as any,deleteCart as any)







export default route

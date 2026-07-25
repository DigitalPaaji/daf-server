import express from "express";
import { ChangeStatus, createOrder, GetMyOrder, getOrders, getSingleOrder, verifyRazorpayPayment } from "../controller/orderController";
import { verifyAdmin } from "../middlewere/getAdmin";
import { verifyUser } from "../middlewere/getUser";
const route = express.Router(); 


route.get("/getall",verifyAdmin as any,getOrders)
route.get("/get/:id",verifyAdmin as any,getSingleOrder)
route.patch("/update/:id",verifyAdmin as any,ChangeStatus)
route.post("/create",verifyUser as any,createOrder as any)
route.post("/verify",verifyUser as any,verifyRazorpayPayment as any)
route.get("/get-my",verifyUser as any,GetMyOrder as any)




export default route
import express from "express";
import { createAddress, deleteAddress, getAllAddress } from "../controller/addressController";
import { verifyUser } from "../middlewere/getUser";

const route = express.Router();

route.post("/create",verifyUser as any,createAddress as any)
route.get("/get",verifyUser as any,getAllAddress as any)
// route.delete("/delete/:id",verifyUser as any,deleteAddress as any)
export default route

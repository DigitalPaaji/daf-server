import express from "express";
import { addProduct, createCollection, deleteCollection, getAllProduct, getCollection, getSingleCollection, removeProduct } from "../controller/collectionController";
import { uploadCollection } from "../helper/addImages";

const route  = express.Router();

route.post("/create",uploadCollection.single("image"),createCollection)
route.get("/get",getCollection)
route.put("/removeproduct/:id",removeProduct)
route.put("/addproduct/:id",addProduct)
route.get("/getproduct",getAllProduct)
route.get("/getsingleproduct/:slug",getSingleCollection)
route.delete("/delete/:id",deleteCollection)
export default route;
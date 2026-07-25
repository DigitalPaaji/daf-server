import express from "express";
import { createCategory, deleteCategory, getCategory } from "../controller/categoryController";
import { uploadCategory } from "../helper/addImages";
const route = express.Router();

route.post("/create",uploadCategory.single("image"),createCategory)
route.get("/get-all",getCategory)
route.delete("/delete/:id",deleteCategory)




export default route;



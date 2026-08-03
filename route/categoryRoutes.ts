import express from "express";
import { createCategory, deleteCategory, getCategory,EditCategory } from "../controller/categoryController";
import { uploadCategory } from "../helper/addImages";
const route = express.Router();

route.post("/create",uploadCategory.single("image"),createCategory)
route.get("/get-all",getCategory)
route.delete("/delete/:id",deleteCategory)
route.put("/edit/:id",uploadCategory.single("image"),EditCategory)



export default route;



import express from "express";
import { createCategory, deleteCategory, getCategory,EditCategory } from "../controller/categoryController";
import { uploadCategory } from "../helper/addImages";
const route = express.Router();

route.post("/create",uploadCategory.fields([
{name:"image",maxCount:1},
{name:"desktop",maxCount:1},
{name:"mobile",maxCount:1},

]),createCategory)
route.get("/get-all",getCategory)
route.delete("/delete/:id",deleteCategory)
route.put("/edit/:id",uploadCategory.fields([
{name:"image",maxCount:1},
{name:"desktop",maxCount:1},
{name:"mobile",maxCount:1},

]),EditCategory)



export default route;



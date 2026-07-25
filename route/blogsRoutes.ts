import express from "express"
import { createBlog, deleteBlog, getallBlogs } from "../controller/blogController";
import { uploadBlogs } from "../helper/addImages";
const route = express.Router();

route.post("/create",uploadBlogs.single("thumbnail"),createBlog)
route.get("/get",getallBlogs)
route.delete("/delete/:id",deleteBlog)


export default route

import express from "express";
import { getCacheCat } from "../controller/categoryController";
import { getBestSellerProduct, getFeaturedProduct, getProductbycat, getProducts, getRandomProduct, getSingleProduct, SearchProduct } from "../controller/productController";
import { getRandomVideo } from "../controller/VideoController";
import { getallBlogsUser, getBlogs, getSingleBlog } from "../controller/blogController";
import { getReviews } from "../controller/ReviewController";




const routes = express.Router()

routes.get("/categorys",getCacheCat)
routes.get("/product/bestseller",getBestSellerProduct)
routes.get("/product/featured",getFeaturedProduct)
routes.get("/product/single/:slug",getSingleProduct)
routes.get("/product/category/:categoryid",getProductbycat)
routes.get("/product/get",getProducts)
routes.get("/product/search/:search",SearchProduct)

routes.get("/product/random/:catid",getRandomProduct)

routes.get("/videos/random",getRandomVideo)
routes.get("/blogs/random",getBlogs)
routes.get("/blogs",getallBlogsUser)
routes.get("/review/:productid",getReviews)

routes.get("/blog/:slug",getSingleBlog)




export default routes


 
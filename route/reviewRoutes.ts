import express from "express";
import { createReview, deleteReviews, getReviews } from "../controller/ReviewController";
const routes = express.Router();
routes.post("/create",createReview)
routes.get("/get/:productid",getReviews)
routes.delete("/delete/:reviewid",deleteReviews)



export default routes
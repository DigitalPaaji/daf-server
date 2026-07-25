import express from "express";
import { createVideo, getVideos, videoDelete } from "../controller/VideoController";
import { uploadVideo } from "../helper/videoUpload";
const route =  express.Router();

route.post("/create",uploadVideo.single("video"),createVideo)
route.get("/getall",getVideos)
route.delete("/delete/:id",videoDelete)



export default route
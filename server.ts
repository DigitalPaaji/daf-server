import dotenv from "dotenv";
dotenv.config()
import express from "express";
import type { Request, Response } from "express"
import mongoose from "mongoose";
import cors from "cors"
import cookieParser from "cookie-parser"
import path from "path";

import adminuser from "./route/adminRoutes"
import bannersuses from "./route/bannerRoutes"
import categoryuses from "./route/categoryRoutes"
import productRoutes from "./route/productRoutes"
import userRoutes from "./route/userRoutes"
import videoRoutes from "./route/videoRoutes"
import blogRoutes from "./route/blogsRoutes"
import ReviewRoutes from "./route/reviewRoutes"
import CouponRoutes from "./route/CouponRoutes"
import cartRoutes from "./route/user/cartRoutes"
import addressRoutes from "./route/addressRoutes"
import collectionRoutes from "./route/collectionRoutes"
import OrderRoutes from "./route/orderRoutes"
import { rateLimiter } from "./helper/rateLimiter";
import UserData  from "./route/user/dataRoutes"
import cacheRotes  from "./route/cacheRoutes"
import AuthRoutes from "./route/user/AuthRoutes"

import http from "http"
import { Server } from "socket.io";
const app = express()

const server = http.createServer(app)

app.use(express.json());
app.use(cookieParser());
app.use( cors({
    origin: process.env.FRONTEND_URL!.split(","),
    credentials: true,               
    methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }))
 
app.use( 
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"),
 {
    maxAge: "7d",              
    etag: true,               
    lastModified: true,        
    immutable: true            
  })
);



app.get("/",async(req:Request,res:Response)=>{
  return res.json({working:"okm"})
})

//caches   ///


app.use("/api/v1/cache",cacheRotes)


////

app.use("/api/v1/admin",adminuser)
app.use("/api/v1/banners",bannersuses)
app.use("/api/v1/category",categoryuses)
app.use("/api/v1/products",productRoutes)
app.use("/api/v1/user",userRoutes)
app.use("/api/v1/video",videoRoutes)
app.use("/api/v1/blog",blogRoutes)
app.use("/api/v1/review",ReviewRoutes)
app.use("/api/v1/coupon",CouponRoutes)




////usersssss      
app.use("/api/v1/auth",AuthRoutes)





app.use("/api/v1/cart",cartRoutes)
app.use("/api/v1/address",addressRoutes)
app.use("/api/v1/collection",collectionRoutes)
app.use("/api/v1/order",OrderRoutes)






app.use("/api/v1/user/get",UserData)





const PORT = process.env.PORT;

mongoose.connect(process.env.DB_URL!).then(()=>{
 server.listen(PORT,()=>{
     
  console.log(`server running on http://localhost:${PORT}`);
 
})
    
})

const io = new Server(server,{
   cors:{
    origin: process.env.FRONTEND_URL!.split(","),
               
    methods: ["GET", "POST"],
    }})


io.on("connection",(socket)=>{

let currentPage: string | null = null;

socket.on("join-page",(pageUrl)=>{

if (currentPage ) {
      socket.leave(currentPage);
      updateViewerCount(currentPage);
    }
currentPage = pageUrl;
socket.join(currentPage as string);
updateViewerCount(currentPage as string);
})
socket.on('disconnect', () => {
    if (currentPage) {
      updateViewerCount(currentPage);[]
    }
  });
  function updateViewerCount(pageId: string) {

    const viewers = io.sockets.adapter.rooms.get(pageId)?.size || 0;
    
    // Broadcast the count ONLY to people in that specific room
    io.to(pageId).emit('update-viewers', viewers);
  }

})



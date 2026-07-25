import type  { Request, Response, NextFunction } from "express";
import redisClient from "./redisServer";

export const rateLimiter =(limit: number, duration: number)=>{


return async (req:Request,res:Response,next:NextFunction)=>{
    try {
        const key = `rate:${req.ip}`;
         const requests = await redisClient.incr(key);

      if (requests === 1) {
        await redisClient.expire(key, duration * 60);
      }
     if (requests > limit) {
        return res.status(429).json({
          success: false,
          message: "Too many requests. Try again later."
        });
      }

 next();


    } catch (error) {
         next();
    }
}

}
import express from "express";
import { loginByGoogle, loginUser, myUser, sendOtp, verifyOtp } from "../../controller/user/AuthController";
import { rateLimiter } from "../../helper/rateLimiter";
import { verifyUser } from "../../middlewere/getUser";

const routes = express.Router();


routes.post("/sendotp",rateLimiter(5,5),sendOtp)
// routes.post("/sendotp",sendOtp)
routes.post("/verifyOtp",rateLimiter(5,5),verifyOtp)
routes.post("/login",rateLimiter(5,5),loginUser)
routes.post("/google",rateLimiter(5,5),loginByGoogle)
routes.get("/verify-user",verifyUser as any ,myUser as any)
export default routes
 
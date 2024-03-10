// to verfiy user hai ya nahi (using access and refresh tokens) jaise logout , like , post ke waqt.

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req ,_, next)=>{
    // res , ka use nahi hai.
 try {
     const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer" , "");
     // mobile ke browser se bhi aa sakta isliye || ke baad wala code hai.
   
     if(!token) {
       throw new ApiError(401 , "Unauthorized request");
     }
   
     // agar token hai to verfy karo aor data lo;
   
      const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET);
      // token jo user ke pass hai aor jo database me gya hai alag alag hai
      // user ke pass encrypted jata hai aor hame raw token chahiye

      const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
   
      if(!user){
          throw new ApiError(401 , "Invalid access token");
       }
   
       // TODO: discuss about frontend .
     
       // agar user hai to req me ik naya object add kar denge
       req.user = user; 
       // is middleware ke baad logoutUser route hit hoga jis se logoutUser ke pass req.user ka access mil jayega . 
       next();
 } catch (error) {
    throw new ApiError(401 , error?.message || "Invalid access token")
 }

});



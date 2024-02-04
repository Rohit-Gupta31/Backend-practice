import { asyncHandler } from '../utils/asyncHandler.js';
import {ApiError} from '../utils/apiError.js';
import { User } from '../models/user.models.js';
import { uploadOnCloudinary } from '../utils/uploadOnCloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const registerUser = asyncHandler( async( req , res) =>{
    // res.status(200).json({
        //     message : "ok"
        // });
        // above for just check
        
        // steps for registration->
        // get user details from frontend(postman)
        // validation - not empty
        // check if user already exists : using username , email
        // check for images , check for avatar
        // upoad them to cloudinary  , check for avatar
        // create user object - create entry in db
        // remove password and refresh token field from response
        // check for user creation 
        // return response
        
        const { fullname , email , password , username} = req.body;
        // through destructuring
        console.log(" email: " , email); // just check through postman(POST -> body -> raw -> json(send json data))
        console.log(req.body); // just for check
        
        //    if(fullname === ""){
            //     throw new ApiError(400 , "fullname is required")
            //    }  // begineer level to check all field one by one
            
            
            if([fullname , email , password , username].some((field)=>field?.trim() === "")){
                throw new ApiError(400 , "All fields are required");   
            }
            
            const existedUser = User.findOne({
                $or: [{username},{email}] 
            })
            console.log(existedUser); // just for check
            
            if(existedUser){
                throw new ApiError(409 , "User with email or username already exists")
   }
   
   
   // multer give access of req.files as body-parser give req.body
   const avatarLocalPath = req.files?.avatar[0]?.path
   
   console.log(avatar); // just for check
   console.log(req.files) // just for check
   console.log("local path as it is on our server and not on cloudinary ",avatarLocalPath );
   
   
   const coverImageLocalPath = req.files?.coverImage[0]?.path
   
   //   As avatar is required field in User model
   if(!avatarLocalPath){
       throw new ApiError(400 , "Avatar file is required");
    }
    
    // const registerUser = asyncHandler( async( req , res) =>{
     // as upload takes time so we alraedy take async in starting 

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    

    if(!avatar){
        throw new ApiError(400 , "Avatar file is required");
    }

    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase(),
    })

      const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
      );

      console.log(createdUser); // just for check

      if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
      }

    return res.status(201).json(
        new ApiResponse(200 , createdUser , "User registered successfully")
    )
    //  createdUser as data

});


export { registerUser}

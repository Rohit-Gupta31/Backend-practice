import { asyncHandler } from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import { User } from '../models/user.models.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken";
import { response } from 'express';

const generateAccessAndRefreshTokens = async(userId)=>{
  try{
     const user = await User.findById(userId);
     const accessToken = user.generateAccessToken();
     const refreshToken = user.generateRefreshToken();

    //  refresh token ko database me kaise rakhe =>
    user.refreshToken = refreshToken;
    // database me save kar denge .
    await user.save({validateBeforeSave : false});

    return { accessToken , refreshToken };

  } catch(error){
    throw new ApiError(500 , "Something went wrong while generating access and refresh token");
  }
}
 // generateAccessAndRefreshToken method jo yahi use karenge koi web request nahi kar rahe hai isliye asynhandler use nahi kar rahe hai.


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
        
        const { fullName , email , password , username} = req.body;
        // through destructuring
        console.log(" email: " , email); // just check through postman(POST -> body -> raw -> json(send json data))
        console.log("req.body : " ,req.body); // just for check
        
        //    if(fullname === ""){
            //     throw new ApiError(400 , "fullname is required")
            //    }  // begineer level to check all field one by one
            
            
            if([fullName , email , password , username].some((field)=>field?.trim() === "")){
                throw new ApiError(400 , "All fields are required");   
            }
            
            const existedUser = await User.findOne({
                $or: [{username},{email}] 
            })
            console.log("existedUser : ",existedUser); // just for check
            
            if(existedUser){
                throw new ApiError(409 , "User with email or username already exists")
   }
   
   
   // multer give access of req.files as body-parser give req.body
   const avatarLocalPath = req.files?.avatar[0]?.path
   
   //console.log(avatar); // just for check
   console.log(req.files) // just for check
   console.log("local path as it is on our server and not on cloudinary ",avatarLocalPath );
   
   
   
   //   const coverImageLocalPath = req.files?.coverImage[0]?.path; =>
  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage)  && req.files.coverImage.length>0) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

//   Array.isArray(req.files.coverImage)=> req.files.coverImage array hai ya nahi
   
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
        fullName,
        // same as fullName : fullName.
        avatar : avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase(),
    });



      const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
      );
      // User me se password and refresh token remove karke bhejenge.

      console.log("createdUser : " ,createdUser); // just for check

      if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
      }

    return res.status(201).json(
        new ApiResponse(200 , createdUser , "User registered successfully")
    )
    //  createdUser as data

});

const loginUser = asyncHandler( async (req, res) => {
    // req body se data le aao
    // username or email 
    // find the user
    // password check
    // access and refresh token
    // send tokens in form of cookie


    const {email , username, password} = req.body;
   
    console.log(email,username,password);

    if(!(username || email)){
      throw new ApiError(400 , "username or email is required");
    }
   
  
  // alternative code for above logic.
//   if (!username && !email) {
//     throw new ApiError(400, "username and email is required")
// }

    const user =  await User.findOne({
      $or: [{username} , {email}]
    })
   
    if(!user){
      throw new ApiError(404 , "User does not exist");
    }

    // "User" mongodb(mongoose) ka object hai to jo mongoose ke methods hai jaise findOne , create wo User ko available hai. isliye User ke aage await laga rahe hai kyuki mongodb se baat kar rahe hai.
    // isPasswordCorrect , generateAccessToken  ye sab methods hamare user me available hai "user"(database se instance liya hai )

    const isPasswordValid = await user.isPasswordCorrect(password);
      // password user ka hai jo send kiya hai and this.password se saved user ka password milega.
    if(!isPasswordValid) {
      throw new ApiError(401 , "Invalid user credentials");
    }
    
    // generate access token and refresh token is common so we make separate method.
    // Access token to user ko de dete hai lekin refresh token apne database me bhi rakhte hai (access token shortlived aor refresh token longlived hote hai) taki baar baar password na puchna pade user se .

    const {accessToken , refreshToken } = await generateAccessAndRefreshTokens(user._id);
  // access token and refresh token mil gya.
   // above function me user me refrreshToken hai but function ke nadar variable user me hamare pass below line me user User.findOne se mila jisme refreshToken empty hai.(isi user ko update kar dete hai bajaye ki database se phir se request karne ke );

   const loggedInUser = await User.findById(user.id).select("-password -refreshToken");

   
   const options = {
    httpOnly : true,
    secure : true,
   }
// cookie by default modifiable hoti hai but httpOnly and secure true ke baad kewal server se hi modify ho sakti hai frontend se modifiable nahi hoti hai. 

// cookie-parser se cookie ka access mil jayega => app.js me middleware config kar chuke hai .(req and res dono me cookie access kar sakte hai)

return res
.status(200)
.cookie("accessToken" , accessToken , options)
.cookie("refreshToken" , refreshToken , options)
.json(
  new ApiResponse(
    200, 
      {
        user: loggedInUser, accessToken , refreshToken
      }, // data field hai 
      "User logged in successfully"
    
  )
)


});

const logoutUser = asyncHandler( async(req, res) => {

 // User.findById() => User hamne email ya password(req.body ) ke through liya tha but logout karte waqt email ya password thode lenge 
 // middleware => jane se pahle mil ke jana .
 // auth.middleware.js design karenge.
     

    await User.findByIdAndUpdate(
      req.user._id , // find kaise karna hai
      {
         $set: {
          refreshToken: undefined
         }
      } , // koun  koun sa field update karna hai
      {
        new : true 
      }
    )
  
    const options = {
      httpOnly : true,
      secure : true,
     }

     return res
     .status(200)
     .clearCookie("accessToken" , options)
     .clearCookie("refreshToken" , options)
     .json( new ApiResponse(200 , {} , "User logged Out"))

})




// Access Token - Short lived, not stored in db
// Refresh Token - Long lived, stored in db
// When access token expires, the frontend sends the refresh token to the backend to validate user (login), once again.


const refreshAccessToken = asyncHandler(async(req, res) => {

  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if(!incomingRefreshToken){
    throw new ApiError(401 , "Unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
    // verify karne ke baad id milegi user ki in decodedToken variable
    // incomingRefreshToken === process.env.REFRESH_TOKEN_SECRET aise direct nahi kar sakte kyuki user ke pass encrypted jata hai so use jwt to verify.
    
    console.log("decodedToken in user.controller.js : " , decodedToken);
    
   const user = await User.findById(decodedToken?._id);
  
     if(!user){
      throw new ApiError(401 , "Invalid refresh token")
    }
    
  
    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401 , "Refresh token is expired or used ")
    }
    
    // agar incomingRefreshToken === user?.refreshToken -->
    // sara verification to ho gya hai to nya generate karke de dete hain.
  
   const {accessToken , newRefreshToken } = await generateAccessAndRefreshTokens(user._id);
  
    const options = {
      httpOnly : true,
      secure : true,
     }
   
      return res
      .status(200)
      .cookie("accessToken" ,accessToken , options )
      .cookie("refreshToken" ,newRefreshToken , options)
      .json(
        new ApiResponse(
          200,
          {accessToken , refreshToken : newRefreshToken},
          "Access Token refreshed"
        )
      )
  
  } catch (error) {
    throw new ApiError(401 , error?.message || "Invlalid refresh Token")
  }


})

// User logged in tabhi password change kar payega .



// update controllers for user --
 const changeCurrentPassword = asyncHandler(async (req , res) => {
   const {oldPassword, newPassword} =req.body;

   const user = await User.findById(req.user?._id);

   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

   if(!isPasswordCorrect){
    throw new ApiError(400 , "Invalid old password")
   }

  user.password = newPassword;
  await user.save({validateBeforeSave: false})
  // save se pahle pre hook chaelga

  return res
  .status(200)
  .json(
    new ApiResponse(200,
      {},
      "Password changed successfully"
      )
  )

 })

// alag alag jagah currentUsre chahiye hoga so ik endPoint bna lenge

// agar user logged in hai to currentUser aram se de sakte hai.
 const getCurrentUser = asyncHandler(async (req , res) => {
   return res
   .status(200)
   .json(
    new ApiResponse(200 , 
    req.user
    ,"Current user fetched successfully"))
 });

//  baki aor kya kya upadte karna allow kar sakte hai password ke liye alag se bna rakha hai changeCurrentPassword

const updateAccountDetails = asyncHandler(async (req , res) => {
   const {fullName, email, } = req.body ;

   if(!fullName || !email){
    throw new ApiError(400, "All fields are required");
   }
 // password ke time ik hi field tha to direct hi update kar diya tha 
  const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set : {
          fullName ,
          email : email
        }
      },
     { new : true}  
   ).select("-password")

 return res
  .status(200)
  .json(new ApiResponse(200 , user , "Account details updated successfully"))
});
 

// files update separately handle karenge
const updateUserAvatar = asyncHandler(async (req,res) => {
 // req.file ka access multer middleware ke through hai
//  file not files kyuki ik hi file chahye.

  const avatarLocalPath = req.file?.path;
 //local pe multer ne upload kar di hogi

  if(!avatarLocalPath){
    throw new ApiError(400 , "Avatar file is missing")
  }
  
  // TODO : delete old image - assignment

 const avatar = await uploadOnCloudinary(avatarLocalPath)
 
 console.log("avatar in upadteUserAvatar : " , avatar );

 if(!avatar.url){
  throw new ApiError(400 , "Error while uploading on avatar")
 }

 const user =  User.findByIdAndUpdate(
  req.user?._id,
  {
    $set : {
     avatar : avatar.url
    }
  },
 { new : true}  
).select("-password");

return res
.status(200)
.json( 
  new ApiResponse(200 , user , "avatar image updated successfully")
)

})


//similarly for coverImage.
const updateUsercoverImage = asyncHandler(async (req,res) => {
  // req.file ka access multer middleware ke through hai
 //  file not files kyuki ik hi file chahye.
 
   const coverImageLocalPath = req.file?.path;
  //local pe multer ne upload kar di hogi
 
   if(!coverImageLocalPath){
     throw new ApiError(400 , "coverImage  file is missing")
   }
 
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  
  console.log("avatar in upadteUsercoverImage : " , coverImage );
 
  if(!coverImage.url){
   throw new ApiError(400 , "Error while uploading on coverImage")
  }
 
  const user =  User.findByIdAndUpdate(
   req.user?._id,
   {
     $set : {
      coverImage : coverImage.url
     }
   },
  { new : true}  
 ).select("-password")

  return res
  .status(200)
  .json( 
    new ApiResponse(200 , user , "cover image updated successfully")
  )
 
 })


export { registerUser , 
  loginUser ,
  logoutUser ,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUsercoverImage
  }

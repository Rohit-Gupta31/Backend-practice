import mongoose , {Schema} from "mongoose";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName:{
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    avatar : {
        type: String, // cloudinary url
        required: true,
    },
    coverImage : {
        type: String, // cloudinary url
    },
    watchHistory : [
        {
            type: Schema.Types.ObjectId,
            ref : "Video"
        }
    ],
    password : {
        type : String, 
        required : [true , 'Password is required']
    },
    refreshToken : {
        type: String,
    }

},{timestamps: true});

// userSchema.pre("save" , async function(req, res, next){
userSchema.pre("save" , async function(next){
    if(!this.isModified("password")){
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10)
    next();
// agar password modify hua hai to hi encrypt karna(kyuki jab bhi save karenge kuch bhi to pre chalega). 
});

// Pre middleware functions are executed one after another, when each middleware calls next.=>(data save karne se pahle encrypt kar do)
//   (req ,res ) is not necessary here just for understanding. we cant use arrow function here because
//  arrow function does not have context(this)  


// export karne se pahle ik baar check kar lenge ki password sahi hai ya nahi

userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password , this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
        _id : this._id,  // mongoDb se mil jayega
        email : this.email,
        username : this.username,
        fullName : this.fullName
    },
     process.env.ACCESS_TOKEN_SECRET,
     {
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY
     }  // expiry_token object me hi likhte hai (syntex hai)
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
        _id : this._id,  // mongoDb se mil jayega
          // refresh token bar bar use hota hai isliye halka rakhenge
    },
     process.env.REFRESH_TOKEN_SECRET,
     {
        expiresIn : process.env.REFRESH_TOKEN_EXPIRY
     } 
    )
}

//userSchema.methods. methods inject kar rahe hai.


export const User = mongoose.model('User', userSchema);



//Brcypt: Its primary use is to securely hash user passwords before storing them in a database. By using bcrypt, developers can ensure that passwords are securely stored and not stored in plaintext.

/* jsonwebtoken is used for generating and verifying JSON Web Tokens (JWTs). JWTs are a compact and self-contained way of transmitting information between parties in JSON format.
 JWTs consist of three parts: a header, a payload, and a signature. They are commonly used for implementing stateless authentication mechanisms in web applications.
 */
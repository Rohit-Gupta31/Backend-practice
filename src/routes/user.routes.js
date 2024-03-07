import { Router }  from 'express';
import { loginUser, registerUser , logoutUser , refreshAccessToken} from '../controllers/user.controller.js';
import { upload} from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1,
        },
        {
            name : "coverImage",
            maxCount: 1 ,
        }
    ]), 
    // function(registerUser) call karne se pahle multer ke middleware(upload) se mil ke jana 
    registerUser
    );

 
router.route("/login").post(loginUser) ;

// secured routes
router.route("/logout").post(verifyJWT , logoutUser) ;
router.route("/refresh-token").post(refreshAccessToken) ;

/* router.route("/logout").post(verifyJWT , anotherMiddleware ,  logoutUser) ;
 aise ik aor middleware laga sakte hai named anotherMiddleware*/
 
export default router;




 /*explaination of line : router.route("/register").post(registerUser);
router: It seems to be an instance of an Express router. In Express.js, routers are used to group route handlers for a particular part of your application.

.route("/register"): This line specifies that the following operations (like post, get, put, delete, etc.) should be applied to the route /register. In other words, it sets up a middleware for the HTTP POST method on the /register endpoint.

.post(registerUser): This line indicates that when an HTTP POST request is made to the /register endpoint, the function registerUser will be called to handle the request. registerUser is assumed to be a callback function that contains the logic for handling the registration process.

So, when a client sends an HTTP POST request to the /register endpoint of the server, the registerUser function will be invoked to process the registration request.
*/
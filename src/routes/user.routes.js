import { Router }  from 'express';
import { registerUser } from '../controllers/user.controller.js';

const router = Router();

router.route("/register").post(registerUser);
// router.route("/login").post(login);

export default router;




 /*explaination of line : router.route("/register").post(registerUser);
router: It seems to be an instance of an Express router. In Express.js, routers are used to group route handlers for a particular part of your application.

.route("/register"): This line specifies that the following operations (like post, get, put, delete, etc.) should be applied to the route /register. In other words, it sets up a middleware for the HTTP POST method on the /register endpoint.

.post(registerUser): This line indicates that when an HTTP POST request is made to the /register endpoint, the function registerUser will be called to handle the request. registerUser is assumed to be a callback function that contains the logic for handling the registration process.

So, when a client sends an HTTP POST request to the /register endpoint of the server, the registerUser function will be invoked to process the registration request.
*/
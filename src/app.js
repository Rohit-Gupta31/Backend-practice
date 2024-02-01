import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
}));

app.use(express.json({limit : "16kb"})); 
// we accept data in JSON format with limit of 16kb

app.use(express.urlencoded({extended: true , limit : "16kb"}));
// we accept data in through URL with limit of 16kb(extended=>URL me object ke andar bhi object tak accept karte hai)

app.use(express.static("public"));
// we keep all our static files like img, vid etc

app.use(cookieParser());
// user ke browser me jo cookie pe CRUD opertion karne ke liye


export { app };
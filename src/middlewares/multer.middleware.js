import multer from 'multer';


// https://github.com/expressjs/multer#readme

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {

      cb(null, file.originalname) 
    }
  });

  // Each function gets passed both the request (req) and some information about the file (file) to aid with the decision.(multer is specifically used for file part)
  
  export const upload = multer({ storage: storage })
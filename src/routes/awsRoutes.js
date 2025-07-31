import express from "express";
import { getS3UploadUrl, uploadOnS3 } from "../controllers/awsController.js";

const awsRoutes = express.Router();

// post

awsRoutes.post("/getS3UploadUrl",  getS3UploadUrl);
awsRoutes.post("/uploadOnS3",  uploadOnS3);


export default awsRoutes;

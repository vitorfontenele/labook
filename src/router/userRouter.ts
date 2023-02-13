import express from "express";
import { UserController } from "../controller/UserController";

const userController = new UserController();
export const userRouter = express.Router();

userRouter.get("/", userController.getUsers);
userRouter.post("/signup", userController.createUser);
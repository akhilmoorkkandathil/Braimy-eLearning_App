const express = require('express');
const userController = require('../controllers/userController')
const userRouter = express.Router();



userRouter.post('/register_user', userController.userRegister);
userRouter.patch('/resendOtp',userController.resendOTP);
userRouter.patch('/verify_user',userController.verifyOtp);
userRouter.post('/login',userController.userLogin);


module.exports = userRouter;
const express = require('express');
const userController = require('../controllers/userController');
const checkUserStatus = require('../middlewares/userStatus');
const checkCoordinatorBlockStatus = require('../middlewares/coordinatorStatus');
const userRouter = express.Router();



userRouter.post('/register_user', userController.userRegister);
userRouter.patch('/resend_otp',userController.resendOTP);
userRouter.patch('/verify_user',userController.verifyOtp);
userRouter.post('/login',checkUserStatus,userController.userLogin);
userRouter.post('/saveUser',userController.saveUserData);
userRouter.post('/set_otp',userController.setOtp);
userRouter.get('/getUser',userController.getUserList);
userRouter.get('/getTutorUser',userController.getTutorUser);
userRouter.post('/addStudent',userController.addStudent);
userRouter.patch('/blockStudent/:id',checkCoordinatorBlockStatus,userController.blockStudent);
userRouter.patch('/unblockStudent/:id',checkCoordinatorBlockStatus,userController.unblockStudent);
userRouter.get('/getStudent/:id',userController.getStudent);
userRouter.post('/updateStudent/:id',checkCoordinatorBlockStatus,userController.updateStudent);
userRouter.post('/subscribe',userController.subscribe);
userRouter.get('/blockStatus',userController.blockStatus);
userRouter.get('/getStudentClasses',userController.getStudentClasses)

module.exports = userRouter;

const userModel = require('../models/userModel');
const userOtpModel = require('../models/userOtpModel');
const {CreateSuccess} = require("../utils/success");
const bcrypt = require('bcrypt');
const {CreateError} = require('../utils/error');
const {sendVerifyMail} = require('../utils/sendVerifyMail');
const jwt = require('jsonwebtoken');


module.exports = {
     userRegister : async(req,res,next) => {
        try {
            let OTP;
            const user = await userModel.findOne({email: req.body.email});
            if(user)
            {
                res.send(CreateError(400, "User already registered"));
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password, salt);
            console.log(req.body);
            const newUser = new userModel({
                fullName:req.body.fullName,
                email: req.body.email,
                userName: req.body.phone,
                password: hashedPassword
            });
            await newUser.save();
            
    
             
            
            if(newUser)
                {
                    OTP = await sendVerifyMail(req.body.fullName,req.body.email,newUser._id);
                    console.log(`check otp inisde register fn =`, OTP);
                    const newUserOtp = new userOtpModel({
                        userId: newUser._id,
                        OTP: OTP
                    });
                    await newUserOtp.save();
                    const data = {
                        id: newUser._id, 
                        OTP: OTP,
                        userType: "user"
                    }
                    return next(CreateSuccess(200, 'Regsitration Successful. Please verify your mail.', data));
        }
        else
        {
            return next(CreateError(406, 'Regsitration Failed!'))
        }
            
        } catch (error) {
            console.log("Register error",  error);
        }
    },
    setOtp : async (req,res,next)=>{
        try {
            const userId = req.params.userId;
            console.log(userId);
            const user = await userModel.findById(userId);
            if(!user)
                return next(CreateError(404, "User not found"));
    
            const OTP = await sendVerifyMail(user.fullName,user.email);
    
            const otpExists = await userOtpModel.findOne({userId:user._id});
    
            if(otpExists)
            {
                await userOtpModel.findOneAndDelete({userId:user._id}); 
            }
                
            const newUserOtp = new userOtpModel({
                userId: user._id,
                OTP: OTP
            });
    
            const newOTP = await newUserOtp.save();
    
            if(newOTP)
            {
                console.log(" new otp: ", newOTP);
                return next(CreateSuccess(200, "OTP has been send!"));
            }
            return next(CreateError(400, "Failed to sent OTP!"));
        } catch (error) {
            console.log(error.message);
            return next(CreateError(500, "Something went wrong while sending the OTP."))
        }
    },

    verifyOtp : async (req,res,next)=>{
        try
        {
            //console.log(`inside verifymail req.body ${req.body.otp} and req.query = ${req.query.userId}`);
            
            const user = await userModel.findById(req.query.userId);
            console.log('check id user is found', user);
            if(user.isVerified)
            {
                return next(CreateSuccess(200,'User has been already verified.'))
            }
    
            const userOtp = await userOtpModel.findOne({userId:user._id});
    
            if(!userOtp){
                return next(CreateError(402, "OTP has been expired"));
            } 
    
            const enteredOTP = req.body.otp;
            if (userOtp.OTP === enteredOTP) {
                await userModel.updateOne({_id:req.query.userId},{$set:{isVerified:true}});
                return next(CreateSuccess(200, 'Your Email has been verified.'));
            }
            else{
                return next(CreateError(403, "OTP doesn't match"))
            }
        }
        catch(err)
        {
            console.error("Error verifying user's email:", err.message);
    
            let errorMessage = "An error occurred while verifying the email.";
    
            if (err.name === "CastError" && err.kind === "ObjectId") {
                errorMessage = "Invalid user ID provided.";
            }
            return next(CreateError(406, errorMessage));
        }
    },
    resendOTP : async (req,res,next)=>{
        try {
            const user = await userModel.findById(req.body.userId);
            if(!user)
                return next(CreateError(404, "User not found"));
    
            if(user)
            {
                if(user.isVerified)
                {
                    return next(CreateError(403, 'User has been already verified'))
                }
                const OTP = await sendVerifyMail(user.fullName,user.email,user._id);
                //await User.findByIdAndUpdate({_id:user._id},{$set:{OTP: OTP}});
                otpExists = await userOtpModel.findOne({userId:user._id});
    
                if(otpExists)
                {
                    await userOtpModel.findOneAndDelete({userId:user._id}); 
                }
                
                const newUserOtp = new userOtpModel({
                    userId: user._id,
                    OTP: OTP
                });
    
                await newUserOtp.save();
    
                if(newUserOtp)
                    return next(CreateSuccess(200, 'OTP has been resent.'));
                else
                    return next(CreateSuccess(402, 'Failed to resed OTP.'));
    
            }
            else
            {
                return next(CreateError(406, 'OTP resend Failed!'))
            }
        } catch (error) {
            console.log(error.message);
            return next(CreateError(500, 'Something went wrong!'))
        }
    },
    userLogin : async (req,res,next)=>{
        try {
            const user = await userModel.findOne({email: req.body.email});
            
            if(!user)
            {
                return next(CreateError(404,'User not found'))
            }
            if(user.isDeleted)
            {
                return next(CreateError(406,'User is deleted'));
            }
            const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
            if(!isPasswordCorrect)
            {
                return next(CreateError(400,'Icorrect password'));
            }
            
            if(user.isBlocked)
            {
                return next(CreateError(402,'User is blocked'));
            }
    
            if(!user.isVerified)
            {
                return next(CreateError(402,'User is not verified'));
            }
    
            const token = jwt.sign({id: user._id, isUser: true}, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN,
              });
    
            //req.session.access_token = token;
            //req.session.cookie.access_token=token;
            const userData = {
                userId : user._id,
                fullName: user.fullName,
                email : user.email
            }
            
            res.cookie("user_access_token", token, {httpOnly: true, maxAge:24*60*60*1000})
               .status(200)
               .json({
                    status: 200,
                    message: "Login Success",
                    data: userData,
                    user_token: token
               });
    
        } catch (error) {
                return next(CreateError(500,'Something went wrong!'));
        }
    }
}
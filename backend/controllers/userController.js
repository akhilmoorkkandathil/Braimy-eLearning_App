
const userModel = require('../models/userModel');
const userOtpModel = require('../models/userOtpModel');
const {CreateSuccess} = require("../utils/success");
const bcrypt = require('bcrypt');
const {CreateError} = require('../utils/error');
const {sendVerifyMail} = require('../utils/sendVerifyMail');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const studentModel = require('../models/userModel')


module.exports = {
     userRegister : async(req,res,next) => {
        try {
            let OTP;
            const user = await userModel.findOne({email: req.body.email});
            if(user)
            {
                return next(CreateError(400, "User already registered"));
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password, salt);
            console.log(req.body);
            const newUser = new userModel({
                username:req.body.fullName,
                email: req.body.email,
                phone: req.body.phone,
                password: hashedPassword
            });
            await newUser.save();
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
               
            
        } catch (error) {
            console.log("Register Failes",  error);
            return next(CreateError(500,"Registration failed"))
        }
    },
    saveUserData:async(req,res,next)=>{
        try {
            const { name, email, photoUrl} = req.body;
        
            // Check if user already exists
            let user = await userModel.findOne({ email: email });
        
            if (user) {
              return next(CreateSuccess(200, "User already exists!", user));
            }
        
            // Create a new user
            const userData = new userModel({
              username: name,
              email: email,
              isVerified: true,
              photoUrl:photoUrl 
            });
        
            await userData.save();
        
            return next(CreateSuccess(200, "User data saved!", user));
          } catch (error) {
            return next(CreateError(500, "Error saving user data", error));
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
            console.log("OTP",OTP);
            const otpExists = await userOtpModel.findOne({userId:user._id});

            console.log("otpExists",otpExists);
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
            let errorMessage = "An error occurred while verifying the email."
            return next(CreateError(406, errorMessage));
        }
    },
    resendOTP : async (req,res,next)=>{
        try {
            const user = await userModel.findById(req.body.userId);
            if(!user) return next(CreateError(404, "User not found"));
    
            if(user.isVerified)
                {
                    return next(CreateError(403, 'User has been already verified'))
                }
                const OTP = await sendVerifyMail(user.fullName,user.email,user._id);
                await userOtpModel.findOneAndUpdate(
                    { userId: user._id }, 
                    {
                        $set: {
                            OTP: OTP,
                            createdAt: Date.now() 
                        }
                    },
                    { upsert: true, new: true } 
                );
    
                //await newUserOtp.save();
                return next(CreateSuccess(200, 'OTP has been resent.'));
        } catch (error) {
            console.log(error.message);
            return next(CreateSuccess(402, 'Failed to resed OTP.'));
        }
    },
    userLogin : async (req,res,next)=>{
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return next(CreateError(400, 'Email and password are required'));
            }
    
            const user = await userModel.findOne({ email,isAdmin:false });
            if (!user) {
                return next(CreateError(404, 'User not found'));
            }
    
            if (user.isDeleted) {
                return next(CreateError(406, 'User is deleted'));
            }

            if(!user.password){
                return next(CreateError(400, 'Incorrect password'));
            }
            const isPasswordCorrect = await bcrypt.compare(password, user.password);
            if (!isPasswordCorrect) {
                return next(CreateError(400, 'Incorrect password'));
            }
            if (user.isBlocked) {
                return next(CreateError(402, 'User is blocked'));
            }
            if (!user.isVerified) {
                return next(CreateError(402, 'User is not verified'));
            }
            const token = jwt.sign(
                { id: user._id, isUser: true },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            const userData = {
                userId: user._id,
                userName: user.username,
                email: user.email
            };
            console.log(userData);
    
            res.cookie("user_access_token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
                .status(200)
                .json({
                    status: 200,
                    message: "Login Success",
                    data: userData,
                    user_token: token
                });
    
        } catch (error) {
            console.error('Error during login:', error); // Log the error for debugging
            return next(CreateError(500, 'Something went wrong!'));
        }
    },

    getUserList:async(req,res,next)=>{
        try {
            const students = await userModel.find({ isAdmin: false })
            .populate('tutor', 'username') // Populate tutor details (name field only)
            .populate('course', 'courseName'); // Populate course details (courseName field only)

    
            return next(CreateSuccess(200, 'Fetched students successfully', students));
        } catch (error) {
            return next(CreateError(500,"Something went wrong while fetching users"));
        }
    },
    getTutorUser:async(req,res,next)=>{
        try {
            // Fetch all students data from the database
            const students = await userModel.find({tutor:req.session.tutorId});
            const formattedStudents = students.map((student, index) => ({
                _id:student._id,
                position: index + 1,
                name: student.username,
                phone: student.phone,
                class:student.class,
                status:student.isBlocked
              }));
            return next(CreateSuccess(200, 'Fetched students successfully', formattedStudents, null));
        } catch (error) {
            return next(CreateError(500,"Something went wrong while fetching users"));
        }
    },


    addStudent:async(req,res,next)=>{
        try {
            const { studentName, studentClass, phone, email, password, tutor, coordinator, course } = req.body;
            
            // Generate salt and hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
    
            // Create a new student document with references to tutor, coordinator, and course
            const newStudent = new userModel({
                username: studentName,
                class: studentClass,
                password: hashedPassword,
                isVerified: true,
                email,
                phone,
                tutor,
                coordinator,
                course
            });
    
            // Save the new student document
            await newStudent.save();
    
            // Send success response
            return next(CreateSuccess(200, "Student added successfully", newStudent));
        } catch (error) {
            console.error('Error adding student:', error);
            return next(CreateError(500, "Something went wrong while adding the student"));
        }
    },
    blockStudent:async(req,res,next)=>{
        const studentId = req.params.id;

        try {
            const student = await userModel.findById(studentId);

            if (!student) {
                return next(CreateError(404, "Student not found"));
            }
            if (student.isBlocked) {
                return next(CreateSuccess(200, "Student already Blocked"));
            }

            student.isBlocked = true; // Assuming you have a 'blocked' field in your user schema
            await student.save();
            return next(CreateSuccess(200, "Student blocked successfully"));
        } catch (error) {
            return next(CreateError(500,  'Error blocking student'));
        }
    },
    unblockStudent:async(req,res,next)=>{
        const studentId = req.params.id;

        try {
            const student = await userModel.findById(studentId);

            if (!student) {
                return next(CreateError(404, "Student not found"));
            }
            if (!student.isBlocked) {
                return next(CreateSuccess(200, "Student already Unblocked"));
            }

            student.isBlocked = false; // Assuming you have a 'blocked' field in your user schema
            await student.save();
            return next(CreateSuccess(200, "Student unblocked successfully"));
        } catch (error) {
            return next(CreateError(500,  'Error unblocking student'));
        }
    },
    getStudent:async(req,res,next)=>{
        const studentId = req.params.id;

        try {
            const student = await userModel.findById(studentId);

            if (!student) {
                return next(CreateError(404, "Student not found"));
            }
            return next(CreateSuccess(200, "Student data fetched successfully",student));
        } catch (error) {
            return next(CreateError(500,  'Error blocking student'));
        }
    },
    updateStudent:async(req,res,next)=>{
        console.log(req.body.studentData);
        const studentId = req.params.id;
        const { studentName, studentClass, phone, password, email } = req.body.studentData;
        try {
        let student = await userModel.findById(studentId);
        console.log(student);
        if (!student) {
            return next(CreateError(404, "Student not found"));
        }
        student.username = studentName;
        student.class = studentClass;
        student.phone = phone;
        student.email = email;
        console.log(password);
        if (password[0]!=="*") {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            student.password = hashedPassword;
        }

        await student.save();

        return next(CreateSuccess(200, "Student updated successfully"));
    } catch (err) {
        console.error("Error updating student:", err);
        return next(CreateError(500, "Error updating student"));
    }
    },
    subscribe:async(req,res,next)=>{
        try {
            const { subscription, token } = req.body;

            function parseJwt (token) {
                return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            }
            let jwtPayload = parseJwt(token);
            const studentId = jwtPayload.id;
            const addSubscription = await userModel.findOneAndUpdate({_id:studentId}, {
                $set: { subscription:subscription }
            });
            return next(CreateSuccess(200, "Subscription saved successfully"));


        } catch (error) {
            return next(CreateError(500, "Subscription saving faied"));
        }
    },
    blockStatus:async(req,res,next)=>{
        try {
            function parseJwt(token) {
                try {
                    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
                } catch (e) {
                    throw new Error('Invalid token');
                }
            }
    
            // Ensure the token is present in cookies
            const token = req.cookies.user_access_token;
            if (!token) {
                return res.status(401).json({ blocked: true }); 
            }
            // Parse the JWT token
            const jwtPayload = parseJwt(token);
            const studentId = jwtPayload.id;
            // Fetch the student from the database
            const student = await userModel.findById(studentId).exec();
            console.log(student);
            if (!student) {
                return res.status(404).json({ blocked: true }); 
            }
    
            // Send the block status in the response
            res.status(200).json({ blocked: student.isBlocked });
        } catch (error) {
            console.error('Block status error:', error);
            next(CreateError(500, 'Error retrieving block status'));
        }
    },
    getStudentClasses:async(req,res,next)=>{
        try {
            function parseJwt(token) {
                try {
                    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
                } catch (e) {
                    throw new Error('Invalid token');
                }
            }
    
            // Ensure the token is present in cookies
            const token = req.cookies.user_access_token;
            if (!token) {
                return res.status(401).json({ blocked: true }); 
            }
            // Parse the JWT token
            const jwtPayload = parseJwt(token);
            const studentId = jwtPayload.id;
            const today = moment().format('ddd');
        const students = await studentModel.find({ isAdmin: false,_id:studentId })
            .populate('tutor', 'username')
            .populate('course', 'courseName');
            console.log(students);
        const todayClasses = students.filter(student => student.selectedDays.includes(today)).slice(0,4);
        
        // console.log(todayClasses);
        return next(CreateSuccess(200, "Fetched classes successfully", todayClasses));
            
        } catch (error) {
            console.error('Error fetching upcoming classes:', error);
            return next(CreateError(500, "Error fetching upcoming classes"));
        }
    }


}

const coordinatorModel = require('../models/coordinatorModel');
const studentModel = require('../models/userModel')
const {CreateSuccess} = require("../utils/success");
const {CreateError} = require('../utils/error');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const CompletedClass = require('../models/completedClassModel');
const dotenv = require('dotenv');
const webpush = require('web-push');

dotenv.config();





module.exports = {
    //  /user/
     coordinatorRegister : async(req,res,next) => {
        try {
            const coordinator = await coordinatorModel.findOne({email: req.body.email});
            if(coordinator)
            {
                return next(CreateError(400, "Coordinator already registered"));
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password, salt);
            console.log(req.body);
            const newCoordinator = new coordinatorModel({
                username:req.body.fullName,
                email: req.body.email,
                phone: req.body.phone,
                password: hashedPassword
            });
            await newCoordinator.save();
            
            return next(CreateSuccess(200, 'Regsitration Successful.'));
            
        } catch (error) {
            console.log("Register error",  error);
        }
    },
    coordinatorLogin: async(req,res,next)=>{
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return next(CreateError(400, 'Email and password are required'));
            }
    
            const coordinator = await coordinatorModel.findOne({ email });
            req.session.coordinatorId = coordinator._id;
            if (!coordinator) {
                return next(CreateError(404, 'coordinator not found'));
            }
    
            if (coordinator.isDeleted) {
                return next(CreateError(406, 'coordinator is deleted'));
            }

            if(!coordinator.password){
                return next(CreateError(400, 'Reset Password'));
            }
            const isPasswordCorrect = await bcrypt.compare(password, coordinator.password);
            if (!isPasswordCorrect) {
                return next(CreateError(400, 'Incorrect password'));
            }
            if (coordinator.isBlocked) {
                return next(CreateError(402, 'coordinator is blocked'));
            }
            if (!coordinator.isVerified) {
                return next(CreateError(402, 'coordinator is not verified'));
            }
            req.session.coordinatorId = coordinator._id;
            const token = jwt.sign(
                { id: coordinator._id, isUser: true },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            const coordinatorData = {
                coordinatorId: coordinator._id,
                username: coordinator.username,
                email: coordinator.email
            };
            console.log(coordinatorData);
    
            res.cookie("user_access_token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
                .status(200)
                .json({
                    status: 200,
                    message: "Login Success",
                    data: coordinatorData,
                    user_token: token
                });
    
        } catch (error) {
            console.error('Error during login:', error); // Log the error for debugging
            return next(CreateError(500, 'Something went wrong!'));
        }
    },
    getCoordinatorsList:async(req,res,next)=>{
        try {
            // Fetch all students data from the database
            const Coordinators = await coordinatorModel.find({isDeleted:false});
            const formattedCoordinators = Coordinators.map((coordinator, index) => ({
                _id:coordinator._id,
                position: index + 1,
                name: coordinator.username,
                email: coordinator.email,
                phone: coordinator.phone,
                isVerified:coordinator.isVerified,
                isBlocked:coordinator.isBlocked,
              }));
            return next(CreateSuccess(200, 'Fetched Coordinators successfully', formattedCoordinators, null));
        } catch (error) {
            return next(CreateError(500,"Something went wrong while fetching users"));
        }
    },
    addCoordinator:async(req,res,next)=>{
        try {
            console.log(req.body);
            const { coordinatorName, email, phone, description, password } = req.body;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const newCoordinator = new coordinatorModel({
                username:coordinatorName,
                email,
                phone,
                description,
                password:hashedPassword,
                isVerified:true
            });
    
            await newCoordinator.save();
    
            return next(CreateSuccess(200, "Coordinator added successfully", newCoordinator));
        } catch (error) {
            console.error('Error adding course:', error);
            return next(CreateError(500, "Something went wrong while adding the course"));
        }
    },
    blockCoordinator: async (req, res, next) => {
        const coordinatorId = req.params.id;

        try {
            const coordinator = await coordinatorModel.findById(coordinatorId);

            if (!coordinator) {
                return next(CreateError(404, "Coordinator not found"));
            }
            if (coordinator.isBlocked) {
                return next(CreateSuccess(200, "Coordinator already blocked"));
            }

            coordinator.isBlocked = true;
            await coordinator.save();
            return next(CreateSuccess(200, "Coordinator blocked successfully"));
        } catch (error) {
            return next(CreateError(500, 'Error blocking coordinator'));
        }
    },

    verifyCoordinator: async (req, res, next) => {
        const coordinatorId = req.params.id;

        try {
            const coordinator = await coordinatorModel.findById(coordinatorId);

            if (!coordinator) {
                return next(CreateError(404, "Coordinator not found"));
            }
            if (coordinator.isVerified) {
                return next(CreateSuccess(200, "Coordinator already verified"));
            }

            coordinator.isVerified = true;
            await coordinator.save();
            return next(CreateSuccess(200, "Coordinator verified successfully"));
        } catch (error) {
            return next(CreateError(500, 'Error verifying coordinator'));
        }
    },

    deleteCoordinator: async (req, res, next) => {
        const coordinatorId = req.params.id;

        try {
            const coordinator = await coordinatorModel.findById(coordinatorId);

            if (!coordinator) {
                return next(CreateError(404, "Coordinator not found"));
            }

            coordinator.isDeleted = true;
            await coordinator.save();
            return next(CreateSuccess(200, "Coordinator deleted successfully"));
        } catch (error) {
            return next(CreateError(500, 'Error deleting coordinator'));
        }
    },

    getCoordinator: async (req, res, next) => {
        const coordinatorId = req.params.id;

        try {
            const coordinator = await coordinatorModel.findById(coordinatorId);

            if (!coordinator) {
                return next(CreateError(404, "Coordinator not found"));
            }
            return next(CreateSuccess(200, "Coordinator data fetched successfully", coordinator));
        } catch (error) {
            return next(CreateError(500, 'Error fetching coordinator data'));
        }
    },

    unblockCoordinator: async (req, res, next) => {
        const coordinatorId = req.params.id;

        try {
            const coordinator = await coordinatorModel.findById(coordinatorId);

            if (!coordinator) {
                return next(CreateError(404, "Coordinator not found"));
            }
            if (!coordinator.isBlocked) {
                return next(CreateSuccess(200, "Coordinator already unblocked"));
            }

            coordinator.isBlocked = false;
            await coordinator.save();
            return next(CreateSuccess(200, "Coordinator unblocked successfully"));
        } catch (error) {
            return next(CreateError(500, 'Error unblocking coordinator'));
        }
    },

    updateCoordinator: async (req, res, next) => {
        const coordinatorId = req.params.id;
        const { coordinatorName, phone, password, email } = req.body.coordinatorData;

        try {
            let coordinator = await coordinatorModel.findById(coordinatorId);

            if (!coordinator) {
                return next(CreateError(404, "Coordinator not found"));
            }

            coordinator.username = coordinatorName;
            coordinator.phone = phone;
            coordinator.email = email;

            if (password[0] !== "*") {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                coordinator.password = hashedPassword;
            }

            await coordinator.save();

            return next(CreateSuccess(200, "Coordinator updated successfully"));
        } catch (error) {
            console.error("Error updating coordinator:", error);
            return next(CreateError(500, "Error updating coordinator"));
        }
    },
    manageStudent:async(req,res,next)=>{
        console.log("hello",req.body);
        try {
            const {
                studentName,
                studentClass,
                phone,
                email,
                tutor,
                course,
                preferredTime,
                selectedDays,
                duration
            } = req.body;
            const updatedStudent = await studentModel.findOneAndUpdate(
                { email: email },
                {
                    username: studentName,
                    class: studentClass,
                    phone: phone,
                    tutor: tutor,
                    course: course,
                    preferredTime: preferredTime,
                    selectedDays: selectedDays,
                    classDuration:duration
                }
            );
    
            if (!updatedStudent) {
                return next(CreateError(404, "Student not found"));
            }
    
            return next(CreateSuccess(200, "Student data updated successfully"));
        } catch (error) {
            console.error('Error adding student:', error);
            return next(CreateError(500, "Error in adding student data"));
        }        
    },
    todaysClasses:async(req,res,next)=>{
        try {
            // Get the current day of the week (e.g., 'Mon', 'Tue', 'Wed', etc.)
            const today = moment().format('ddd');  // Formats as 'Mon', 'Tue', etc.
    
            // Fetch all students data from the database
            const students = await studentModel.find({ isAdmin: false })
                .populate('tutor', 'username')  // Populate tutor details
                .populate('course', 'courseName');  // Populate course details
    
            // Filter students to include only those whose `selectedDays` include today's day
            const filteredStudents = students.filter(student => student.selectedDays.includes(today));

            return next(CreateSuccess(200, "Fetched today\'s classes successfully",filteredStudents));
            
        } catch (error) {
            console.error('Error fetching today\'s classes:', error);
            return next(CreateError(500, "Error fetching today\'s classes"));
        }
    },
    upcomingClasses:async(req,res,next)=>{
        try {
            const today = moment().format('ddd');
        const students = await studentModel.find({ isAdmin: false })
            .populate('tutor', 'username') 
            .populate('course', 'courseName');
        const todayClasses = students.filter(student => student.selectedDays.includes(today)).slice(0,4);
        
        // console.log(todayClasses);
        return next(CreateSuccess(200, "Fetched upcoming classes successfully", todayClasses));
            
        } catch (error) {
            console.error('Error fetching today\'s upcoming classes:', error);
            return next(CreateError(500, "Error fetching today\'s upcoming classes"));
        }
    },
    approveClass:async(req,res,next)=>{
        try {
            const userId = req.params.id;
            let student = await studentModel.findById({_id: userId});
    
            if (!student) {
                return next(CreateError(404, "Student not found"));
            }
            if (student.classStatus!=='Completed') {
                return next(CreateError(404, "Class not completed"));
            }
            student.approvalStatus = 'Approved';

            student.save();
            const newCompletedClass = new CompletedClass({
                studentId: student._id,
                tutorId: student.tutor,
                coordinatorId: student.coordinator,
                courseId: student.course,
                duration: student.classDuration,
                classStatus: 'Completed',
                approvalStatus: 'Approved'
            });
    
            await newCompletedClass.save();
    
            return next(CreateSuccess(200, "Approved"));
    
        } catch (error) {
            console.error('Error in mark complete:', error);
            return next(CreateError(500, "Error in mark complete"));
        }
    },
    notificationSend:async(req,res,next)=>{
        try {
            const userId = req.params.id;
            let student = await studentModel.findById({_id: userId});
            if (!student) {
                return next(CreateError(404, "Student not found"));
            }
            const publicKey = process.env.PUBLIC_KEY;
            const privateKey = process.env.PRIVATE_KEY;
            try {
                webpush.setVapidDetails('mailto:akhildasxyz@gmail.com', publicKey, privateKey);
            } catch (error) {
                return next(CreateError(500, "Error setting VAPID details: " + error.message));
            }
            let  image = ('')
            const payLoad = {
                notification: {
                    title: "Braimy", // Title of the notification
                    body: "Class starts soon...", // Message to be displayed in the notification
                    vibrate: [100, 50, 100], // Vibration pattern for the notification
                    icon: "../assets/download.pn", // Path to the custom icon
                    data: {
                        additionalData: "Any additional data you want to send" // Optional field for additional data
                    }
                }
            };
            

            webpush.sendNotification(student.subscription, JSON.stringify(payLoad))
            .then(() => {
                return next(CreateSuccess(200, "Notification sent"));
            })
            .catch(error => {
                console.log(error);
                return next(CreateError(500, "Error sending notification: "));
            });

            
        } catch (error) {
            console.log(error);
            return next(CreateError(500, "Error in sending notification"));
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
            const coordinatorId = jwtPayload.id;
            // Fetch the coordinator from the database
            const coordinator = await coordinatorModel.findById(coordinatorId).exec();
            console.log(coordinator);
            if (!coordinator) {
                return res.status(404).json({ blocked: true }); 
            }
    
            // Send the block status in the response
            res.status(200).json({ blocked: coordinator.isBlocked });
        } catch (error) {
            console.error('Block status error:', error);
            next(CreateError(500, 'Error retrieving block status'));
        }
    }
}
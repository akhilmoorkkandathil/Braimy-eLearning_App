
const adminModel = require('../models/userModel');
const {CreateSuccess} = require("../utils/success");
const {CreateError} = require('../utils/error');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const courseModel = require('../models/courseModel');
const paymentModel  = require('../models/paymentModel');
const expenceModel = require('../models/expenseSchema');
const studentModel = require('../models/userModel');
const tutorModel = require('../models/tutorModel');
const classModel = require('../models/completedClassModel');
const CompletedClassModel = require('../models/completedClassModel');

const cloudinary = require('cloudinary').v2;
//s3 bucket -presigned url
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDNAME,
  api_key: process.env.CLOUDAPIKEY,
  api_secret: process.env.CLOUDINARYSECRET
});



module.exports = {
    
    adminLogin: async(req,res,next)=>{
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return next(CreateError(400, 'Email and password are required'));
            }
    
            const admin = await adminModel.findOne({ email,isAdmin:true });
            console.log(admin);
            if (!admin) {
                return next(CreateError(404, 'admin not found'));
            }
            if(!admin.password){
                return next(CreateError(400, 'Password not found'));
            }
            const isPasswordCorrect = await bcrypt.compare(password, admin.password);
            if (!isPasswordCorrect) {
                return next(CreateError(400, 'Incorrect password'));
            }
            const token = jwt.sign(
                { id: admin._id, isUser: true },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            const adminData = {
                adminId: admin._id,
                userName: admin.username,
                email: admin.email
            };
            res.cookie("user_access_token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
                .status(200)
                .json({
                    status: 200,
                    message: "Login Success",
                    data: adminData,
                    token: token
                });
    
        } catch (error) {
            console.error('Error during login:', error); // Log the error for debugging
            return next(CreateError(500, 'Something went wrong!'));
        }
    },

    addCourse:async(req,res,next)=>{
        try {
            const { courseName, class: courseClass, subject, description, topic } = req.body;
            const image = req.file.path; // Assuming req.file contains the uploaded file path
            const result = await cloudinary.uploader.upload(image);

            const newCourse = new courseModel({
            courseName,
            class: courseClass,
            subject,
            description,
            topic,
            imageUrl:result.url // Save the file path to the database
            });
            await newCourse.save();
    
            return next(CreateSuccess(200, "Course added successfully", newCourse));
        } catch (error) {
            console.error('Error adding course:', error);
            return next(CreateError(500, "Something went wrong while adding the course"));
        }
    },
    
getCourses:async(req,res,next)=>{
    try {
        // Fetch all courses data from the database
        const courses = await courseModel.find({isDeleted:false});
        const formattedCourses = courses.map((course, index) => ({
            _id:course._id,
            position: index + 1,
            courseName: course.courseName,
            class: course.class,
            subject: course.subject,
            description: course.description,
            topic: course.topic
          }));
          //creat a common methode
        return next(CreateSuccess(200, 'Fetched courses successfully', formattedCourses, null));
    } catch (error) {
        return next(CreateError(500,"Something went wrong while fetching courses"));
    }
},

addPayment:async(req,res,next)=>{
    try {
        const { studentName, courseSelected, phone, amount, description } = req.body;

      // Create a new Payment instance based on the schema
      const newPayment = new paymentModel({
        studentName,
        courseSelected,
        phone,
        amountPaid: amount,
        description,
        date: new Date().toISOString().split('T')[0],
        isDeleted:false
      });

      // Save the payment to the database
      await newPayment.save();

     

        return next(CreateSuccess(200, "Payment added successfully"));
    } catch (error) {
        console.log("while adding payment",error);
        return next(CreateError(500, "Something went wrong while adding the payment"));
    }
},

addExpense:async(req,res,next)=>{
    try {
        const { payedTo, paymentMethode, amount, reason, description } = req.body;

      // Create a new Expense instance based on the schema
      const newExpense = new expenceModel({
        amountPaidTo: payedTo,
        paymentMethod: paymentMethode,
        amount: amount,
        reason: reason,
        description: description,
        date: new Date().toISOString().split('T')[0] // Format date as dd-mm-yyyy
      });

      // Save the expense to the database
      await newExpense.save();
        

        return next(CreateSuccess(200, "Expense added successfully"));
    } catch (error) {
        console.error('Error adding expense:', error);
        return next(CreateError(500, "Something went wrong while adding the expence"));
    }
},
getPayments:async(req,res,next)=>{
    try {
        // Fetch all payments data from the database
        const paymets = await paymentModel.find({isDeleted:false});
        const formattedPayments = paymets.map((payment, index) => ({
            _id:payment._id,
            position: index + 1,
            date: payment.date,
            studentName: payment.studentName,
            courseSelected: payment.courseSelected,
            phone: payment.phone,
            description: payment.description,
            amount: payment.amountPaid,
            
          }));
          
          
        return next(CreateSuccess(200, 'Fetched payments successfully', formattedPayments, null));
    } catch (error) {
        return next(CreateError(500,"Something went wrong while fetching payments"));
    }
},
getExpenses:async(req,res,next)=>{
    try {
        // Fetch all expenses data from the database
        const expenses = await expenceModel.find({isDeleted:false});
        const formattedExpenses = expenses.map((expense, index) => ({
            _id:expense._id,
            position: index + 1,
            date: expense.date,
            payedTo: expense.amountPaidTo,
            paymentMethod: expense.paymentMethod,
            amount: expense.amount,
            description: expense.description,
            reason: expense.reason
          }));
        return next(CreateSuccess(200, 'Fetched expenses successfully', formattedExpenses, null));
    } catch (error) {
        return next(CreateError(500,"Something went wrong while fetching expenses"));
    }
},
getCourse: async (req, res, next) => {
    const courseId = req.params.id;

    try {
        const course = await courseModel.findById(courseId);

        if (!course) {
            return next(CreateError(404, "Course not found"));
        }
        return next(CreateSuccess(200, "Course data fetched successfully", course));
    } catch (error) {
        return next(CreateError(500, 'Error fetching course data'));
    }
},

 updateCourse: async (req, res, next) => {
    const courseId = req.params.id;
    const { courseName, class: courseClass, subject, topic, description } = req.body.courseData;

    try {
        let course = await courseModel.findById(courseId);

        if (!course) {
            return next(CreateError(404, "Course not found"));
        }

        course.courseName = courseName;
        course.class = courseClass;
        course.subject = subject;
        course.topic = topic;
        course.description = description;

        await course.save();

        return next(CreateSuccess(200, "Course updated successfully"));
    } catch (error) {
        console.error("Error updating course:", error);
        return next(CreateError(500, "Error updating course"));
    }
},

 deleteCourse : async (req, res, next) => {
    const courseId = req.params.id;
    try {
        const course = await courseModel.findById(courseId);

        if (!course) {
            return next(CreateError(404, "Course not found"));
        }
        course.isDeleted = true;
        await course.save();
        return next(CreateSuccess(200, "Course deleted successfully"));
    } catch (error) {
        return next(CreateError(500, 'Error deleting course'));
    }
},
getExpense :async (req, res, next) => {
    const expenseId = req.params.id;

    try {
        const expense = await expenceModel.findById(expenseId);

        if (!expense) {
            return next(CreateError(404, "Expense not found"));
        }
        return next(CreateSuccess(200, "Expense data fetched successfully", expense));
    } catch (error) {
        return next(CreateError(500, 'Error fetching expense data'));
    }
},

 updateExpense : async (req, res, next) => {
    const expenseId = req.params.id;
    const { payedTo, paymentMethode, amount, reason, description } = req.body.expenseData;

    try {
        let expense = await expenceModel.findById(expenseId);

        if (!expense) {
            return next(CreateError(404, "Expense not found"));
        }

        expense.amountPaidTo = payedTo;
        expense.paymentMethod = paymentMethode;
        expense.amount = amount;
        expense.reason = reason;
        expense.description = description;
        await expense.save();

        return next(CreateSuccess(200, "Expense updated successfully"));
    } catch (error) {
        console.error("Error updating expense:", error);
        return next(CreateError(500, "Error updating expense"));
    }
},
 
deleteExpense : async (req, res, next) => {
    const expenceId = req.params.id;

    try {
        const expense = await expenceModel.findById(expenceId);

        if (!expense) {
            return next(CreateError(404, "Expense not found"));
        }

          expense.isDeleted = true
         expense.save()
        return next(CreateSuccess(200, "Expense deleted successfully"));
    } catch (error) {
        return next(CreateError(500, 'Error deleting expense'));
    }
},
getPayment :async (req, res, next) => {
    const paymentId = req.params.id;

    try {
        const payment = await paymentModel.findById(paymentId);

        if (!payment) {
            return next(CreateError(404, "Payment not found"));
        }
        return next(CreateSuccess(200, "Payment data fetched successfully", payment));
    } catch (error) {
        return next(CreateError(500, 'Error fetching payment data'));
    }
},

 updatePayment : async (req, res, next) => {
    const paymentId = req.params.id;
    const { studentName, courseSelected, phone, amount, description } = req.body.paymentData;

    try {
        let payment = await paymentModel.findById(paymentId);

        if (!payment) {
            return next(CreateError(404, "Payment not found"));
        }

        payment.studentName = studentName;
        payment.courseSelected = courseSelected;
        payment.phone = phone;
        payment.amountPaid = amount;
        payment.description = description;

        await payment.save();

        return next(CreateSuccess(200, "Payment updated successfully"));
    } catch (error) {
        console.error("Error updating payment:", error);
        return next(CreateError(500, "Error updating payment"));
    }
},

 deletePayment : async (req, res, next) => {
    const paymentId = req.params.id;

    try {
        const payment = await paymentModel.findById(paymentId);

        if (!payment) {
            return next(CreateError(404, "Payment not found"));
        }

        payment.isDeleted = true;
        payment.save();
        return next(CreateSuccess(200, "Payment deleted successfully"));
    } catch (error) {
        return next(CreateError(500, 'Error deleting payment'));
    }
},
dashboardData:async(req,res,next)=>{
    try {
        const students = await studentModel.find();
        const tutors = await tutorModel.find();
        const course = await CompletedClassModel.find()

        const data = {
            students : students.length-1,
            tutors:tutors.length,
            courseCompleted :course.length
        }
        return next(CreateSuccess(200, "Dashboard data fetched successfully",data));

    } catch (error) {
        return next(CreateError(500, 'Error in fetching dashboard data'));
    }
}
    
}
const express = require('express');
const adminController = require('../controllers/adminController')
const multer = require('multer');
const adminRouter = express.Router();


// Multer configuration for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/'); // Specify the directory where files will be stored
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname); // Specify how files should be named
    }
  });
  
  const upload = multer({ storage: storage });


adminRouter.post('/login',adminController.adminLogin );

adminRouter.post('/addCourse', upload.single('image'),adminController.addCourse);
adminRouter.get('/getCourses',adminController.getCourses);
adminRouter.post('/updateCourse/:id',adminController.updateCourse);
adminRouter.get('/getCourse/:id',adminController.getCourse);
adminRouter.delete('/deleteCourse/:id',adminController.deleteCourse);

adminRouter.post('/addPayment',adminController.addPayment);
adminRouter.get('/getPayments',adminController.getPayments);
adminRouter.post('/updatePayment/:id',adminController.updatePayment);
adminRouter.get('/getPayment/:id',adminController.getPayment);
adminRouter.post('/deletePayment/:id',adminController.deletePayment);

adminRouter.put('/addExpense',adminController.addExpense);
adminRouter.get('/getExpenses',adminController.getExpenses);
adminRouter.put('/updateExpense/:id',adminController.updateExpense);
adminRouter.get('/getExpense/:id',adminController.getExpense);
adminRouter.post('/deleteExpense/:id',adminController.deleteExpense);

adminRouter.get('/dashboardData',adminController.dashboardData)

module.exports = adminRouter;


// {
//   publicKey: 'BD_qZ0tyVaPC6DVg2kKmWTqw9C4NOMyHiZYyLJIwDmoKvhdF0ieqIw9vaffOnfJCoI2fWAyBk1Pib8KWsp5Lsd8',
//   privateKey: '2nw58tdYMC-e4tTyiD13_7lJT_wYFofk8mz2n6fuT5Q'
// }
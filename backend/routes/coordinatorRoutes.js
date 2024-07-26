const express = require('express');
const coordintorController = require('../controllers/coordinatorController');
const coordinatorController = require('../controllers/coordinatorController');
const checkCoordinatorBlockStatus = require('../middlewares/coordinatorStatus');
const coordinatorRouter = express.Router();


coordinatorRouter.post('/register_coordinator',coordintorController.coordinatorRegister );
coordinatorRouter.post('/login',checkCoordinatorBlockStatus,coordintorController.coordinatorLogin);
coordinatorRouter.get('/getCoordinators',coordintorController.getCoordinatorsList);
coordinatorRouter.post('/addCoordinator',coordintorController.addCoordinator);
coordinatorRouter.patch('/blockCoordinator/:id', coordintorController.blockCoordinator);
coordinatorRouter.patch('/verifyCoordinator/:id', coordintorController.verifyCoordinator);
coordinatorRouter.patch('/unblockCoordinator/:id', coordintorController.unblockCoordinator);
coordinatorRouter.delete('/deleteCoordinator/:id', coordintorController.deleteCoordinator);
coordinatorRouter.get('/getCoordinator/:id', coordintorController.getCoordinator);
coordinatorRouter.put('/updateCoordinator/:id', coordintorController.updateCoordinator);
coordinatorRouter.post('/manageStudent',coordinatorController.manageStudent);
coordinatorRouter.get('/todaysClasses',coordinatorController.todaysClasses);
coordinatorRouter.get('/upcomingClasses',coordinatorController.upcomingClasses);
coordinatorRouter.get('/approveClass/:id',coordinatorController.approveClass);
coordinatorRouter.get('/notificationSend/:id',coordinatorController.notificationSend);
coordinatorRouter.get('/blockStatus',coordinatorController.blockStatus);


module.exports = coordinatorRouter;
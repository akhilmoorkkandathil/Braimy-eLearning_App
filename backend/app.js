const express = require('express');
const http = require('http')
const mongoose = require('mongoose');
const path = require('path')
const dotenv = require('dotenv');
const cors = require('cors');
const { Server } = require('socket.io');


const cookieParser = require('cookie-parser');
const session = require('express-session');

const userRouter = require('./routes/userRoutes');
// const adminRouter = require('./routes//adminRoutes');
// const coordinatorRouter = require("./routes/coordinatorRoutes");

const app = express();
dotenv.config();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(express.static('public'));
app.use(cors(
    {
        origin: process.env.BASE_URL_CLIENT,
        credentials: true
    }
)); 

// Initialize and use the session middleware
app.use(session({
    secret: process.env.SECRET_KEY, // Replace with a secret key for session encryption
    resave: true,
    saveUninitialized: true,
}));

// Prevent caching
app.use((req,res,next)=>{
    res.header('Cache-Control','no-cache,private,no-store,must-revalidate');
    res.header('Expires','0');
    res.header('Pragma','no-cache');
    next();
});

// Setup Cookie middleware
app.use((req,res,next)=>{
    res.cookie('myCookie', 'Hello, this is my cookie!', { maxAge: 3600000 });
    next();
});

function connectMongoDB(){
    mongoose.connect(process.env.MONNGO_CONNECTION_STRING)
.then(()=>{
    console.log("Connected to Database!");
})
.catch((error)=>{
    console.log("Mongodb Connection error",error);
})

}

app.use("/images",express.static(path.join('backend/images')))

app.use('/user', userRouter);



const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.BASE_URL_CLIENT,
        methods: ["GET", "POST"],
        credentials: true
    }
});

io.on('connection', (socket)=>{
    console.log('socket io connected');
    socket.on('message', (data)=> {
        console.log(data);
        socket.broadcast.emit('received', {data: data, message: 'This is a test message from server'})
    })
})

//Response Handler middleware
app.use((responseObj,req,res,next)=>{
    //console.log('checkResponseObj',responseObj);
    const statusCode = responseObj.status || 500;
    const message = responseObj.message || "Something went wrong!";
    return res.status(statusCode).json({
        success: [200,204,201].some(a=> a===statusCode)? true : false,
        status: statusCode,
        message: message,
        data: responseObj.data,
        token: responseObj.token
    });
});

server.listen(8000, ()=>{
    connectMongoDB();
    console.log('Connected to backend');
});
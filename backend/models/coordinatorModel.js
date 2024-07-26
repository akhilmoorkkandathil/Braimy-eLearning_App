const mongoose = require("mongoose");

const CoordinatorSchema = mongoose.Schema({
    username:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
    },
    phone:{
        type: String
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    photoUrl:{
        type:String
    }
    ,
    isBlocked: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    isAdmin:{
        type:Boolean,
        default:false
    }
});

//export default mongoose.model('User', userSchema);
const Coordinator= mongoose.model('Coordinator',CoordinatorSchema);

module.exports = Coordinator;
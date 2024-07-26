const mongoose = require("mongoose");

const tutorSchema = mongoose.Schema({
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
    },
    education:{
        type:String,
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
});

const Tutor= mongoose.model('Tutor',tutorSchema);
module.exports = Tutor;
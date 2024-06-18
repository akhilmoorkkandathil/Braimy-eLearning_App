const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    fullName:{
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
        required: true,
    },
    phone:{
        type: String
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
});

//export default mongoose.model('User', userSchema);
const User= mongoose.model('User',userSchema);

module.exports = User;
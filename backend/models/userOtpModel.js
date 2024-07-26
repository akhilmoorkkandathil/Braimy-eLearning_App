const mongoose = require("mongoose");

const userOtpSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    OTP: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60  
    }
    
});
userOtpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 });

const UserOtp= mongoose.model('UserOtp',userOtpSchema);

module.exports = UserOtp;
const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    class: {
        type: Number
    },
    password: {
        type: String
    },
    phone: {
        type: String
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    photoUrl: {
        type: String
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    OTP: {
        type: String,
        default: null
    },
    tutor: {
        type: Schema.Types.ObjectId,
        ref: 'Tutor'
    },
    coordinator: {
        type: Schema.Types.ObjectId,
        ref: 'Coordinator' // Assuming your coordinator collection/model is named 'Coordinator'
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course' // Assuming your course collection/model is named 'Course'
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    selectedDays: {
        type: [String], // Array of strings to store selected days
    },
    preferredTime: {
        type: String, // String to store preferred time
    },
    classDuration: {
        type: String, // String to store preferred time
    },
    classStatus: {
      type: String,
      enum: ['Scheduled', 'Completed'],
      default: 'Scheduled'
    },
    approvalStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    subscription: {
        type: Object,
        default: null
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;

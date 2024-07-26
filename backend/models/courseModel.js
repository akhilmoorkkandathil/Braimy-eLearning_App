const mongoose = require('mongoose');

const CourseSchema = mongoose.Schema({
  courseName: {
    type: String,
    required: true,
  },
  class: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  isDeleted:{
    type:Boolean,
    default:false
  },
  imageUrl:{
      type:String
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Course = mongoose.model('Course', CourseSchema);

module.exports = Course;

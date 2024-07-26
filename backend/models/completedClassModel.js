const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const completedClassSchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  tutorId: {
    type: Schema.Types.ObjectId,
    ref: 'Tutor',
    required: true
  },
  coordinatorId: {
    type: Schema.Types.ObjectId,
    ref: 'Coordinator',
    required: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: String,
    required: true
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
  }
}, {
  timestamps: true
});

const CompletedClass = mongoose.model('CompletedClass', completedClassSchema);

module.exports = CompletedClass;

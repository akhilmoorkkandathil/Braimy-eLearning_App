const mongoose = require('mongoose');

const PaymentSchema = mongoose.Schema({
  studentName: {
    type: String,
    required: true,
  },
  courseSelected: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  amountPaid: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  isDeleted:{
    type:Boolean,
  },
  date: {
    type: String,
    default: Date.now,
  }
});

const Payment = mongoose.model('Payment', PaymentSchema);

module.exports = Payment;

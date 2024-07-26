const { TopologyType } = require('mongodb');
const mongoose = require('mongoose');

const ExpenseSchema = mongoose.Schema({
  amountPaidTo: {
    type: String,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  amount: {
    type: String,
    required: true,
  },
  reason: {
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
  date: {
    type: String,
    default: Date.now,
  },
});

const Expense = mongoose.model('Expense', ExpenseSchema);

module.exports = Expense;

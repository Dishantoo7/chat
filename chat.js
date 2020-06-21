const mongoose = require("mongoose");

const msg = mongoose.Schema({
  username: {
    type: String,
  },
  msg: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("msg", msg);

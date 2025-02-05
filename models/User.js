const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  shoppingList: [
    {
      item: String,
      checked: Boolean,
      createdAt: Date,
      addedBy: String,
    },
  ],
});

module.exports = mongoose.model("User", userSchema);

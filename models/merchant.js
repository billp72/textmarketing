const mongoose = require("mongoose");

const MerchantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: false
    },
    other: {}
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("merchant", MerchantSchema);

const mongoose = require("mongoose");
var config = require('./../settings');

const { "db":{ MONGOOSE_URI, MONGOOSE_USER, MONGOOSE_PASS, MONGOOSE_DB }} = config;

if (!MONGOOSE_URI) {
  throw new Error("$MONGOOSE_URI must be set in env.");
}

mongoose
  .connect(MONGOOSE_URI, {
    user: MONGOOSE_USER,
    pass: MONGOOSE_PASS,
    dbName: MONGOOSE_DB,
    auth: {
      authdb: "admin"
    },
    useNewUrlParser: true,
    useUnifiedTopology: true
  },() => {
    console.log("Mongoose server connected")}
  )
  .catch(e => {
    console.error(e);
    process.exit(1);
  });

const models = {
  customer: require("./merchant") 
};

module.exports = models;

const path = require("path");
const express = require("express");
var cors = require("cors");
const sequelize = require("./util/database");
const User = require("./models/users");
const Order = require("./models/orders");
const Expense = require("./models/expenses");
const purchaseRoutes = require("./routes/purchase");
const userRoutes = require("./routes/user");
const app = express();
const dotenv = require("dotenv");
// get config vars
dotenv.config();
app.use(cors());
// app.use(bodyParser.urlencoded());  ////this is for handling forms
app.use(express.json()); //this is for handling jsons
app.use(express.static(path.join(__dirname, "public")));
app.use("/user", userRoutes);
app.use("/purchase", purchaseRoutes);
User.hasMany(Expense);
Expense.belongsTo(User);

User.hasMany(Order);
Order.belongsTo(User);
sequelize
  .sync()
  .then(() => {
    app.listen(3000);
    console.log("server is running on 3000 port");
  })
  .catch((err) => {
    console.log(err);
  });

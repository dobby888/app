const path = require("path");
const express = require("express");
var cors = require("cors");
const sequelize = require("./util/database");
const User = require("./models/users");
const Expense = require("./models/expenses");
const Order = require("./models/orders");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const userController = require("./controller/user");
const app = express();
const dotenv = require("dotenv");
const userRoutes = require("./routes/user");
const expenseRoutes = require("./routes/expense");
const purchaseRoutes = require("./routes/purchase");
const premiumRoutes = require("./routes/premiumFeature");
const Razorpay = require("razorpay");

// get config vars
dotenv.config();
app.use(cors());
// app.use(bodyParser.urlencoded());  ////this is for handling forms
app.use(express.json()); //this is for handling jsons
app.use(express.static(path.join(__dirname, "public")));

// app.use("/user", userRoutes);
// app.use("/expense", expenseRoutes);
// app.use("/premium", purchaseRoutes);
// app.use("/premium", premiumRoutes);

const authenticate = (req, res, next) => {
  try {
    const token = req.header("authorization");

    console.log("token:", token);

    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    const userid = Number(decoded.userId);
    User.findByPk(userid)
      .then((user) => {
        console.log(JSON.stringify(user));
        req.user = user;
        next();
      })
      .catch((err) => {
        throw new Error(err);
      });
  } catch (err) {
    console.log(err);
    return res.status(401).json({ success: false });
    // err
  }
};

function generateAccessToken(id, name, ispremiumuser) {
  return jwt.sign(
    { userId: id, name: name, ispremiumuser: ispremiumuser },
    process.env.TOKEN_SECRET
  );
}
app.get("/user/signup", (req, res, next) => {
  res.send(`
  <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
    <link rel="stylesheet" type="text/css" href="/styles/styles.css">
</head>
<body>
    <h1>Sign Up:</h1>
    <form onsubmit="signup(event)">
        <label for="name">Name:</label>
        <input type="text" name="name" required placeholder="Enter your name...."><br>

        <label for="email">Email:</label>
        <input type="email" name="email" required><br>

        <label for="password">Password:</label>
        <input type="password" name="password" required><br>
        <button type="submit">Signup</button>
        <a href="/user/login">Existng User?Signup Now</a>
    </form>
    <script src="http://cdnjs.cloudflare.com/ajax/libs/axios/0.21.1/axios.min.js" integrity="sha512-bZS47S7sPOxkjU/4Bt0zrhEtWx0y0CRkhEp8IckzK+ltifIIE9EMIMTuT/mEzoIMewUINruDBIR/jJnbguonqQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script src="/Signup/signup.js" ></script>
</body>
</html> `);
});
app.post("/user/signup", (req, res) => {
  const { name, email, password } = req.body;
  const saltRounds = 10;
  bcrypt.genSalt(saltRounds, function (err, salt) {
    bcrypt.hash(password, salt, function (err, hash) {
      // Store hash in your password DB.
      if (err) {
        console.log("Unable to create new user");
        res.json({ message: "Unable to create new user" });
      }
      User.create({ name, email, password: hash })
        .then(() => {
          console.log("a new user is created:", req.body);
          res.status(201).json({ message: "Successfuly create new user" });
        })
        .catch((err) => {
          res.status(403).json(err);
        });
    });
  });
});
app.get("/user/login", (req, res, next) => {
  res.send(`
  <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
    <link rel="stylesheet" type="text/css" href="/styles/styles.css">
</head>
<body>
    <h1>Login:</h1>
    <form onsubmit="login(event)">
        <label for="email">Email:</label>
        <input type="email" name="email" required><br>
        <label for="password">Password:</label>
        <input type="password" name="password" required><br>
        <button type="submit">Login</button>
        <a href="/user/signup">New User?Signup Now</a>
    </form>

    <script src="http://cdnjs.cloudflare.com/ajax/libs/axios/0.21.1/axios.min.js" integrity="sha512-bZS47S7sPOxkjU/4Bt0zrhEtWx0y0CRkhEp8IckzK+ltifIIE9EMIMTuT/mEzoIMewUINruDBIR/jJnbguonqQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script src="/Login/login.js" ></script>
</body>
</html> `);
});
app.post("/user/login", (req, res) => {
  const { email, password } = req.body;
  console.log(password);
  User.findAll({ where: { email } }).then((user) => {
    if (user.length > 0) {
      bcrypt.compare(password, user[0].password, function (err, response) {
        if (err) {
          console.log("error while generating password:", err);
          return res.json({ success: false, message: "Something went wrong" });
        }
        if (response) {
          console.log(JSON.stringify(user));
          const jwttoken = generateAccessToken(
            user[0].id,
            user[0].name,
            user[0].ispremiumuser
          );
          // console.log(generateAccessToken(user[0]));
          res.status(200).json({
            token: jwttoken,
            user: user[0],
            success: true,
            message: "Successfully Logged In",
          });
          // Send JWT
        } else {
          // response is OutgoingMessage object that server response http request
          return res
            .status(401)
            .json({ success: false, message: "passwords do not match" });
        }
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "passwords do not match" });
    }
  });
});
app.get("/expense/addexpense", (req, res, next) => {
  res.send(`<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>Document</title>
      <link rel="stylesheet" type="text/css" href="/styles/styles.css">
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  </head>
  <body>
      <h1 id="loginName"></h1>
      <form onsubmit="addNewExpense(event)">
          <label for="expenseamount">Expenseamount:</label>
          <input type="number" id="expenseamount" name="expenseamount" required><br>

          <label for="description">Description:</label>
          <input type="text" id="description" name="description" required><br>
          <label for="category">Choose a Category:</label>
          <select id="category" name="category">
              <option value="fuel">fuel</option>
              <option value="food">food</option>
              <option value="electricity">electricity</option>
              <option value="Movie">Movie</option>
          </select><br>
          <button type="submit">Add Expense</button>
      </form>
      <div id='premiumMessage'></div>
      <div id='leaderBoardButton'></div>
      <div id='leaderBoard'></div>
      <button id="rzp-button1">Buy Premium  Membership</button>
      <ul id='listOfExpenses'>
          <h2>Expense List:</h2>
      </ul>
      <script src='/ExpenseTracker/index.js'></script>
      <script src="http://cdnjs.cloudflare.com/ajax/libs/axios/0.21.1/axios.min.js" integrity="sha512-bZS47S7sPOxkjU/4Bt0zrhEtWx0y0CRkhEp8IckzK+ltifIIE9EMIMTuT/mEzoIMewUINruDBIR/jJnbguonqQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  </body>
  </html>  `);
});
app.post("/expense/addexpense", authenticate, (req, res) => {
  const { expenseamount, description, category } = req.body;
  req.user
    .createExpense({
      expenseamount,
      description,
      category,
      userId: req.user.id,
    })
    .then((expense) => {
      const total_expenses =
        Number(req.user.total_expenses) + Number(expenseamount);
      console.log("Expenses added are these:", req.body);
      User.update(
        { total_expenses: total_expenses },
        {
          where: { id: req.user.id },
        }
      ).then(async () => {
        return res.status(201).json({ expense, success: true });
      });
    })
    .catch((err) => {
      return res.status(403).json({ success: false, error: err });
    });
});
app.get("/expense/getexpenses", authenticate, (req, res) => {
  req.user
    .getExpenses()
    .then((expenses) => {
      return res.status(200).json({ expenses, success: true });
    })
    .catch((err) => {
      return res.status(402).json({ error: err, success: false });
    });
});
app.delete("/expense/deleteexpense/:expenseid", authenticate, (req, res) => {
  const expenseid = req.params.expenseid;
  Expense.destroy({ where: { id: expenseid } })
    .then(() => {
      return res
        .status(204)
        .json({ success: true, message: "Deleted Successfuly" });
    })
    .catch((err) => {
      console.log(err);
      return res.status(403).json({ success: true, message: "Failed" });
    });
});

app.get("/premium/premiummembership", authenticate, async (req, res) => {
  try {
    var rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,

      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const amount = 2500;

    rzp.orders.create({ amount, currency: "INR" }, (err, order) => {
      if (err) {
        throw new Error(JSON.stringify(err));
      }

      req.user
        .createOrder({ orderid: order.id, status: "PENDING" })
        .then(() => {
          return res.status(201).json({ order, key_id: rzp.key_id });
        })
        .catch((err) => {
          throw new Error(err);
        });
    });
  } catch (err) {
    console.log(err);

    res.status(403).json({ message: "Sometghing went wrong", error: err });
  }
});

app.post("/premium/updatetransactionstatus", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("........", req.body);
    const { payment_id, order_id } = req.body;

    const order = await Order.findOne({ where: { orderid: order_id } }); //2

    const promise1 = order.update({
      paymentid: payment_id,
      status: "SUCCESSFUL",
      ispremiumuser: true,
    });

    const promise2 = req.user.update({ ispremiumuser: true });

    Promise.all([promise1, promise2])
      .then(() => {
        const newToken = userController.generateAccessToken(
          userId,
          undefined,
          true
        );
        return res.status(202).json({
          sucess: true,
          message: "Transaction Successful",
          token: newToken,
        });
      })
      .catch((error) => {
        throw new Error(error);
      });
  } catch (err) {
    console.log(err);

    res.status(403).json({ errpr: err, message: "Sometghing went wrong" });
  }
});

app.get("/premium/leaderboard", authenticate, async (req, res) => {
  try {
    const leaderboardofusers = await User.findAll({
      order: [["total_expenses", "DESC"]], // Order by total_cost in descending order
    });

    res.status(200).json(leaderboardofusers);
  } catch (err) {
    console.log("error while getting the leader board: ", err);
    res.status(500).json(err);
  }
});

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

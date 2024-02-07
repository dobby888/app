const path = require("path");
const express = require("express");
var cors = require("cors");
const sequelize = require("./util/database");
const bodyParser = require("body-parser");
const User = require("./models/users");
const Expense = require("./models/expenses");
const Order = require("./models/orders");
const ForgotPasswordRequests = require("./models/forgotPasswordRequests");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const userController = require("./controller/user");
const app = express();
const dotenv = require("dotenv");
dotenv.config();

// const userRoutes = require("./routes/user");
// const expenseRoutes = require("./routes/expense");
// const purchaseRoutes = require("./routes/purchase");
// const premiumRoutes = require("./routes/premiumFeature");
const Razorpay = require("razorpay");
const Sib = require("sib-api-v3-sdk");
const client = Sib.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.API_KEY;
const tranEmailApi = new Sib.TransactionalEmailsApi();
const { v4: uuidv4 } = require("uuid");
const { json } = require("sequelize");

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
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
        <a href="/user/login">Existng User?Login Now</a>
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
    <a href='/password/forgotpassword'>Forgot Password?</a>
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

app.get("/password/forgotpassword", (req, res, next) => {
  res.send(`
  <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <link rel="stylesheet" type="text/css" href="/styles/styles.css">
</head>
<body>
    <h2>find Your Account</h2>
    <p>Please enter your email address to search for your account.</p>
    <form onsubmit='getForgotPassword(event)'>
        <label for="email">EmailId:</label>
        <input type="email" id="email" name="email" required><br>
        <button onclick="cancelForgotPassword(event)">Cancel</button>
        <button>Get Password</button>
    </form>
    <script src="http://cdnjs.cloudflare.com/ajax/libs/axios/0.21.1/axios.min.js" integrity="sha512-bZS47S7sPOxkjU/4Bt0zrhEtWx0y0CRkhEp8IckzK+ltifIIE9EMIMTuT/mEzoIMewUINruDBIR/jJnbguonqQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script src="/Password/password.js"></script>
</body>
</html>
  `);
});

app.post("/password/forgotpassword", async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const id = uuidv4();
    await ForgotPasswordRequests.create({ id, userId: user.id });

    const sender = {
      email: "pabbathisreevalli1705@gmail.com",
    };

    const receivers = [
      {
        email: email, // Add the recipient's email address here
      },
    ];

    console.log("receivers array: ", receivers);
    const emailData = {
      sender,
      to: receivers,
      subject: "Reset Password Request", // Add your email subject here
      htmlContent: `
      <h3>Reset ur password here:</h3>
      <a href='http://localhost:3000/password/resetpassword/${id}'>Link</a>
    `,
    };

    // Make the request to Sendinblue API
    tranEmailApi
      .sendTransacEmail(emailData)
      .then((response) => {
        console.log("Email sent successfully:", response);
        res
          .status(200)
          .json({ success: true, message: "Email sent successfully" });
      })
      .catch((error) => {
        console.log("Error sending email:", error);
        res
          .status(500)
          .json({ success: false, error: "Internal server error" });
      });
  } catch (error) {
    console.log("errro sending password reset email", error);
    return res.status(500).json({ error: "internal server error" });
  }
});

app.get("/password/resetpassword/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await ForgotPasswordRequests.findOne({
      where: { id },
    });
    if (!request) {
      return res.status(404).json({ message: "invalid or expired reset link" });
    }
    if (!request.isActive) {
      return res.status(403).json({ message: "reset link is not active" });
    }

    request.isActive = false;
    await request.save();

    res.send(`
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <h3>Reset your Password:</h3>
    <form action='/password/resetpassword/${id}' method='POST'>
      <label for='newPassword'>Enter new Password:</label>
      <input type='password' name='newPassword' id='newPassword' required>
      <button type='submit'>Reset</button>
    </form>
</body>
</html>
    `);
  } catch (err) {
    console.log("error resetting password: ", err);
    return res.status(500).json({ error: "internal server error" });
  }
});

app.post("/password/resetpassword/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("id>>>>>>>", id);
    const request = await ForgotPasswordRequests.findOne({
      where: { id },
    });
    console.log("request>>>>>>>>>>>", request);

    if (!request) {
      return res.status(404).json({ message: "Invalid or expired reset link" });
    }

    // Extract the new password from the request body
    const { newPassword } = req.body;
    console.log("new password::::", newPassword);
    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    console.log("newpassword>>>>>>>>", newPassword);

    const saltRounds = 10;

    bcrypt.genSalt(saltRounds, async (err, salt) => {
      if (err) {
        console.error("Error generating salt:", err);
        return res.status(500).json({ message: "Unable to reset password" });
      }

      console.log("Salt>>>>>>", salt);

      bcrypt.hash(newPassword, salt, async (err, hashedPassword) => {
        if (err) {
          console.error("Error hashing password:", err);
          return res.status(500).json({ message: "Unable to reset password" });
        }

        console.log("Hashed Password:", hashedPassword);

        // Update user's password in the User table
        const user = await User.findByPk(request.userId);
        user.password = hashedPassword;
        await user.save();

        // Delete the forgot password request
        await request.destroy();

        return res.redirect("/user/login");
      });
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
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

app.post("/expense/addexpense", authenticate, async (req, res) => {
  try {
    const t = await sequelize.transaction();
    const { expenseamount, description, category } = req.body;
    req.user
      .createExpense(
        {
          expenseamount,
          description,
          category,
          userId: req.user.id,
        },
        { transaction: t }
      )
      .then((expense) => {
        const total_expenses =
          Number(req.user.total_expenses) + Number(expenseamount);
        console.log("Expenses added are these:", req.body);
        User.update(
          { total_expenses: total_expenses },
          {
            where: { id: req.user.id },
            transaction: t,
          }
        )
          .then(async () => {
            t.commit();
            return res.status(201).json({ expense, success: true });
          })
          .catch(async (err) => {
            await t.rollback();
            return res.status(500).json({ success: false, error: err });
          });
      })
      .catch(async (err) => {
        await t.rollback();
        return res.status(403).json({ success: false, error: err });
      });
  } catch (err) {
    await t.rollback();
    console.log(err);
    res.status(403).json({ success: false, error: err });
  }
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

app.delete(
  "/expense/deleteexpense/:expenseid",
  authenticate,
  async (req, res) => {
    try {
      const expenseid = req.params.expenseid;
      const expense = await Expense.findOne({
        where: { id: expenseid, userId: req.user.id },
      });

      if (!expense) {
        return res
          .status(404)
          .json({ success: false, message: "Expense not found" });
      }

      const deletedAmount = expense.expenseamount;
      const t = await sequelize.transaction();

      await Expense.destroy({
        where: { id: expenseid, userId: req.user.id },
        transaction: t,
      });
      const total_expenses =
        Number(req.user.total_expenses) - Number(deletedAmount);

      await User.update(
        { total_expenses: total_expenses },
        { where: { id: req.user.id }, transaction: t }
      );
      await t.commit();

      return res
        .status(204)
        .json({ success: true, message: "Deleted successfully" });
    } catch (err) {
      console.log("Error while deleting the expense:", err);
      return res
        .status(500)
        .json({ success: false, error: "Internal server error" });
    }
  }
);

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
      order: [["total_expenses", "DESC"]], // Order by total_expenses in descending order
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

User.hasMany(ForgotPasswordRequests);
ForgotPasswordRequests.belongsTo(User);
sequelize
  .sync()
  .then(() => {
    app.listen(3000);
    console.log("server is running on 3000 port");
  })
  .catch((err) => {
    console.log(err);
  });

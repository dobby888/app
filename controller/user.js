const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/users");
const path = require("path");
const getsignup = (req, res, next) => {
  res.sendFile(path.join(__dirname, "..", "views", "Signup", "signup.html"));
};
const signup = (req, res) => {
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
};
const getlogin = (req, res, next) => {
  res.sendFile(path.join(__dirname, "..", "views", "Login", "login.html"));
};
function generateAccessToken(id) {
  return jwt.sign(id, process.env.TOKEN_SECRET);
}
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (isstringinvalid(email) || isstringinvalid(password)) {
      return res
        .status(400)
        .json({ message: "EMail idor password is missing ", success: false });
    }
    console.log(password);
    const user = await User.findAll({ where: { email } });
    if (user.length > 0) {
      bcrypt.compare(password, user[0].password, (err, result) => {
        if (err) {
          throw new Error("Something went wrong");
        }
        if (result === true) {
          return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            token: generateAccessToken(
              user[0].id,
              user[0].name,
              user[0].ispremiumuser
            ),
          });
        } else {
          return res
            .status(400)
            .json({ success: false, message: "Password is incorrect" });
        }
      });
    } else {
      console.log(err);
      return res
        .status(404)
        .json({ success: false, message: "User Doesnot exitst" });
    }
  } catch (err) {
    res.status(500).json({ message: err, success: false });
  }
};

module.exports = {
  generateAccessToken,
  getsignup,
  signup,
  getlogin,
  login,
};

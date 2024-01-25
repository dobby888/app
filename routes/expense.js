const express = require("express");
const userController = require("../controller/user");
const expenseController = require("../controller/expense");
const path = require("path");
const authenticatemiddleware = require("../middleware/auth");

const router = express.Router();

router.get("/addexpense", expenseController.getaddexpenses);

router.post(
  "/addexpense",
  authenticatemiddleware.authenticate,
  expenseController.addexpense
);

router.get(
  "/getexpenses",
  authenticatemiddleware.authenticate,
  expenseController.getexpenses
);

router.delete(
  "/deleteexpense/:expenseid",
  authenticatemiddleware.authenticate,
  expenseController.deleteexpense
);

module.exports = router;

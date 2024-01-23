const Expense = require("../models/expenses");
const path = require("path");

const getaddexpenses = (req, res, next) => {
  res.sendFile(
    path.join(__dirname, "..", "views", "ExpenseTracker", "index.html")
  );
};

const addexpense = (req, res) => {
  const { expenseamount, description, category } = req.body;
  req.user
    .createExpense({ expenseamount, description, category })
    .then((expense) => {
      console.log("Expenses added are these:", req.body);
      return res.status(201).json({ expense, success: true });
    })
    .catch((err) => {
      return res.status(403).json({ success: false, error: err });
    });
};

const getexpenses = (req, res) => {
  req.user
    .getExpenses()
    .then((expenses) => {
      return res.status(200).json({ expenses, success: true });
    })
    .catch((err) => {
      return res.status(402).json({ error: err, success: false });
    });
};

const deleteexpense = (req, res) => {
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
};

module.exports = {
  getaddexpenses,
  deleteexpense,
  getexpenses,
  addexpense,
};

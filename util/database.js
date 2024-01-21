const Sequelize = require("sequelize");

const sequelize = new Sequelize("expense_app", "root", "Dobby@888", {
  dialect: "mysql",

  host: "localhost",
});

module.exports = sequelize;

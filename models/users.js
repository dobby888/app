const Sequelize = require("sequelize");
const sequelize = require("../util/database");
const path = require("path");

const User = sequelize.define("user", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  name: Sequelize.STRING,
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  password: Sequelize.STRING,
  ispremiumuser: Sequelize.BOOLEAN,
  total_expenses: {
    type: Sequelize.INTEGER,
    defaultValue: 0, // Default value is set to 0
  },
});
module.exports = User;

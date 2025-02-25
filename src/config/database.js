const { Sequelize } = require('sequelize');
const config = require('./index');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: config.database.dialect,
  storage: config.database.storage,
  logging: false
});

// Test the connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
}

module.exports = {
  sequelize,
  testConnection
};

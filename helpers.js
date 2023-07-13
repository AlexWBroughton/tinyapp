const { get } = require("request");



const getUserByEmail = function (email, database) {
  for (const userID in database) {
    if (email === database[userID].email) {
      return database[userID];
    }
  }
};

module.exports = { getUserByEmail };
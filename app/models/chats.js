var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var chatSchema = mongoose.Schema({

      users : Array,
      chats : Array

});



// create the model for users and expose it to our app
module.exports = mongoose.model('chat', chatSchema);

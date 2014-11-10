'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var authTypes = ['github', 'twitter', 'facebook', 'google'];

var ProjectSchema = new Schema({
  // username: String,
  // hashedPassword: String,
  // password: String,
  projectname: String,
  projectdeveloper: String,
  email: { type: String, lowercase: true },
  projectdescription: String,
  projectduration: String,
  projectgoals: String,
  image: {data:Buffer, contentType: String},
  id: Number,
  userId: String
});

// Virtuals - what are virtuals???
// ProjectSchema
//   .virtual('password')
//   .set(function(password){
//     this._password = password;
//     this.salt = this.makeSalt();
//     this.hashedPassword = this.encryptPassword(password);
//   })
//   .get(function(){
//     return this._password;
//   });

// Validations
// ProjectSchema
//   .path('email')
//   .validate(function(email) {
//     if (authTypes.indexOf(this.provider) !== -1) return true;
//     return email.length;
//   }, 'Email cannot be blank');

// // Validate empty password
// ProjectSchema
//   .path('hashedPassword')
//   .validate(function(hashedPassword) {
//     if (authTypes.indexOf(this.provider) !== -1) return true;
//     return hashedPassword.length;
//   }, 'Password cannot be blank');

// Validate email is not taken
ProjectSchema
  .path('email')
  .validate(function(value, respond) {
    var self = this;
    this.constructor.findOne({email: value}, function(err, user) {
      if(err) throw err;
      if(user) {
        if(self.id === user.id) return respond(true);
        return respond(false);
      }
      respond(true);
    });
}, 'The specified email address is already in use.');

var validatePresenceOf = function(value) {
  return value && value.length;
};

// pre-save hook - what is this doing?
ProjectSchema
  .pre('save', function(next){
    if (!this.isNew) return next();

    if (!validatePresenceOf(this.hashedPassword) && authTypes.indexOf(this.provider) === -1)
      next(new Error('Invalid password'));
    else
      next();
  });

// Methods
ProjectSchema.methods = {
  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */
  authenticate: function(plainText) {
    return this.encryptPassword(plainText) === this.hashedPassword;
  },

  /**
   * Make salt
   *
   * @return {String}
   * @api public
   */
  makeSalt: function() {
    return crypto.randomBytes(16).toString('base64');
  },

  /**
   * Encrypt password
   *
   * @param {String} password
   * @return {String}
   * @api public
   */
  encryptPassword: function(password) {
    if (!password || !this.salt) return '';
    var salt = new Buffer(this.salt, 'base64');
    return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
  }
}


module.exports = mongoose.model('Project', ProjectSchema);
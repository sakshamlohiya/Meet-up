

const mongoose = require('mongoose');

const UserSchema1 = new mongoose.Schema({
	name          : {
		type     : String,
		required : true
	},
	Username          : {
		type     : String,
		required : true
	},
	meetingCode      : {
		type     : String,
		required : true
	 }
});

const Contact = mongoose.model('Contact', UserSchema1);

module.exports = Contact;

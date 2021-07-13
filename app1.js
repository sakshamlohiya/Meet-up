var express = require("express")
var app = express();
var mongoose = require("mongoose")
var passport = require("passport-local")
var bodyParser = require("body-parser")
var LocalStrategy = require("passport")
var passportLocalMongoose =
	require("passport-local-mongoose")
var User = require("./models/users");
var Contact = require("./models/contact")
// var port = process.env.PORT || 3000;
const passwordValidator = require('password-validator')
require('dotenv').config();



var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
let code = "";
let name = "";



const session = require("express-session");
const flash = require("connect-flash");

app.use(flash());




mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
const url = 'mongodb+srv://Saksham:Saksham.1204@m1.la76v.mongodb.net/Saksham?retryWrites=true&w=majority';
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
	if (!err) {
		console.log('Connected');

	} else {
		console.log('error' + err);
	}
})


app.use(express.static(path.join(__dirname, '/public')));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(require("express-session")({
	secret: "Rusty is a dog",
	resave: false,
	saveUninitialized: false
}));


//=====================
// ROUTES
//=====================

// Showing home page
app.get("/", function (req, res) {
	res.render("home");
});

// Showing register form
app.get("/register", function (req, res) {
	res.render("login");
});

const check = new passwordValidator();

// Handling user signup
app.post("/register", function (req, res) {
	var username = req.body.username
	var password = req.body.password
	var email = req.body.email
	var phone = req.body.phone

	check.has().uppercase().has().lowercase().has().digits(2);
	let errors = [];
	if (!username || !email || !password || !phone) {
		errors.push({ msg: 'All fields are compulsory' });
	}
	if (phone.length != 10) {
		errors.push({ msg: 'Wrong Phone number' });
	}
	if (password.length < 6) {
		errors.push({ msg: 'Passwords too short' });
	}
	if (check.validate(password) == false) {
		errors.push({ msg: 'Password too weak' });
	}

	if (errors.length > 0) {
		res.render('home', { errors, name, email, password });
	} else {
		User.findOne({ name: username })
			.then((user) => {
				if (user) {
					errors.push({ msg: 'username already exists' });
					res.render('home', { errors, name, email, password, phone });
				} else {
					const newUser = new User({
						name: username,
						password: password,
						email: email,
						phone: phone
					});
					res.redirect('login')
					console.log(newUser)
					newUser.save(function (err, newUser) {
						if (err) return console.error(err);
					})

				}
			})
			.catch((e) => console.log(e));
	}

});

//Showing login form
app.get("/login", function (req, res) {
	res.render("login");
});


app.post("/login", function (req, res) {
	name = req.body.username
	var password = req.body.password
	User.findOne({ name: name, password: password }, function (err, k) {
		if (err) return console.error(err);
		else {
			if (k) {
				console.log(k);
				req.flash('message', 'Logged in Successfully')
				res.redirect('/mainpage')
			} else {
				res.redirect('/login')
			}

		}
	})
});

//Handling user logout
app.get("/logout", function (req, res) {
	req.logout();
	res.redirect("login");
});

app.get("/mainpage", function (req, res) {

	res.render('mainpage', { name: name, message: req.flash('message') })
})

app.get("/conference", function (req, res) {
	res.render('conference', { name: name })
})

app.get("/calendar", function (req, res) {
	res.render('calendar', { name: name })
})

app.get('/contact', function (req, res) {
	Contact.find({ Username: name }, (err, contact) => {
		if (err) console.log(err)
		else {
			console.log(contact)
			res.render('Addcontact', { contact: contact, name: name })
		}
	})


})
app.post("/contact", function (req, res) {
	var username = req.body.name
	var code = req.body.code


	const newContact = new Contact({
		name: username,
		Username: name,
		meetingCode: code
	})
	newContact.save(function (err, newUser) {
		if (err) return console.error(err);

	})
	res.redirect('/contact')

})

app.get("/forgot", function (req, res) {
	res.render('ForgotPassword')
})

let fname = ""

app.post("/forgot", function (req, res) {
	fname = req.body.fname
	var fphone = req.body.fphone
	User.find({ name: fname, phone: fphone }, function (err, k) {
		if (err) return console.error(err);
		res.render('createp')
	})

})

app.post('/newp', function (req, res) {
	var newPassword = req.body.npassword
	var rePassword = req.body.rpassword

	check.has().uppercase().has().lowercase().has().digits(2);
	let errors = [];

	if (newPassword.length < 6) {
		errors.push({ msg: 'Passwords too short' });
	}
	if (check.validate(newPassword) == false) {
		errors.push({ msg: 'Password too weak' });
	}

	if (errors.length > 0) {
		res.render('createp', { errors, newPassword, rePassword });
	} else if (newPassword === rePassword) {
		User.findOneAndUpdate({ name: fname }, { password: rePassword }, function (err, newr) {
			if (err) console.log(err)
			else {
				res.redirect('login')
				console.log('Updated')

			}
		})
	}

})


app.post('/generate', function (req, res) {
	code = Math.floor(Math.random() * (9000) + 1000);
	code = '#' + code;
	console.log(code)
	res.redirect('/chati')
})
app.post('/delete', function (req, res) {
	var na = req.body.name
	console.log(na)
	Contact.findOneAndDelete({name:na}, (err) => {
		if (err) {
			console.log(err);
		} else {
			res.redirect('/contact')
		}
	})
})




























// For mainpage 
function arrayRemove(arr, value) {

	return arr.filter(function (ele) {
		return ele != value;
	});
}


// signaling
let rc = [];
io.on('connection', function (socket) {
	console.log('a user connected');

	socket.on('create or join', function (room) {
		console.log('create or join to room ', room);

		let numClients = 0;
		if (rc.length === 0) {
			rc.push(room)
			numClients = 0;
		}
		else {
			console.log(rc)
			let m = rc.length;
			console.log(m)
			for (i = 0; i <= m; i++) {
				if (rc[i] === room) {
					numClients = 1;
					console.log(numClients)
				}
			}
			if (numClients === 0 && rc.length > 0) {
				rc.push(room)

			}

		}
		app.post('/leave', function (req, res) {
			res.redirect('conference')
			rc = arrayRemove(rc, room);
			console.log(rc)
		})


		console.log(room, ' has ', numClients, ' clients');

		if (numClients == 0) {
			socket.join(room);
			socket.emit('created', room);
		} else if (numClients == 1) {
			socket.join(room);
			socket.emit('joined', room);
		} else {
			socket.emit('full', room);
		}
	});

	socket.on('ready', function (room) {
		socket.broadcast.to(room).emit('ready');
	});

	socket.on('candidate', function (event) {
		socket.broadcast.to(event.room).emit('candidate', event);
	});

	socket.on('offer', function (event) {
		socket.broadcast.to(event.room).emit('offer', event.sdp);
	});

	socket.on('answer', function (event) {
		socket.broadcast.to(event.room).emit('answer', event.sdp);
	});

});
































// For calendar
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb').ObjectId;

async function main() {
	
	const client = new MongoClient(url, {
		useUnifiedTopology: true,
		useNewUrlParser: true,
	});
	try {
		// Connect to the MongoDB cluster
		await client.connect();
		// Make the appropriate DB calls
		await init(client);

	} catch (e) {
		console.error(e);
	}
}
main().catch(console.err);


async function init(client) {
	
	app.use(bodyParser.json());

	const db = client.db('eventList')
	const events = db.collection('events')

	app.get('/init', function (req, res) {
		events.insertOne({
			text: "Some Helpful event",
			start_date: new Date(2018, 8, 1),
			end_date: new Date(2018, 8, 5)
		})
		events.insertOne({
			text: "Another Cool Event",
			start_date: new Date(2018, 8, 11),
			end_date: new Date(2018, 8, 11)
		})
		events.insertOne({
			text: "Super Activity",
			start_date: new Date(2018, 8, 9),
			end_date: new Date(2018, 8, 10)
		})
		res.send("Test events were added to the database")
	});

	app.get('/data', function (req, res) {
		events.find().toArray(function (err, data) {
			//set the id property for all client records to the database records, which are stored in ._id field
			for (var i = 0; i < data.length; i++) {
				data[i].id = data[i]._id;
				delete data[i]["!nativeeditor_status"];
			}
			//output response
			res.send(data);
		});
	});


	app.post('/data', function (req, res) {
		var data = req.body;
		var mode = data["!nativeeditor_status"];
		var sid = data.id;
		var tid = sid;

		function update_response(err) {
			if (err)
				mode = "error";
			else if (mode == "inserted") {
				tid = data._id;
			}
			res.setHeader("Content-Type", "application/json");
			res.send({ action: mode, sid: sid, tid: String(tid) });
		}

		if (mode == "updated") {
			events.updateOne({ "_id": ObjectId(tid) }, { $set: data }, update_response);
		} else if (mode == "inserted") {
			events.insertOne(data, update_response);
		} else if (mode == "deleted") {
			events.deleteOne({ "_id": ObjectId(tid) }, update_response)
		} else
			res.send("Not supported operation");
	});
};



const formatMessage = require('./models/messages');
const {
	userJoin,
	getCurrentUser,
	userLeave,
	getRoomUsers
} = require('./models/userschat');

app.get('/chati', function (req, res) {
	res.render('index', { name: name, code: code })

})

app.get('/chat', function (req, res) {
	res.render('chat', { name: name })


})

const botName = 'ChatCord ';

// Run when client connects
io.on('connection', socket => {
	socket.on('joinRoom', ({ username, room }) => {
		const user = userJoin(socket.id, username, room);

		socket.join(user.room);

		// Welcome current user
		socket.emit('message', formatMessage(botName, 'Welcome to ChatCord!'));

		// Broadcast when a user connects
		socket.broadcast
			.to(user.room)
			.emit(
				'message',
				formatMessage(botName, `${user.username} has joined the chat`)
			);

		// Send users and room info
		io.to(user.room).emit('roomUsers', {
			room: user.room,
			users: getRoomUsers(user.room)
		});
	});

	// Listen for chatMessage
	socket.on('chatMessage', msg => {
		const user = getCurrentUser(socket.id);

		io.to(user.room).emit('message', formatMessage(user.username, msg));
	});

	// Runs when client disconnects
	socket.on('disconnect', () => {
		const user = userLeave(socket.id);

		if (user) {
			io.to(user.room).emit(
				'message',
				formatMessage(botName, `${user.username} has left the chat`)
			);

			// Send users and room info
			io.to(user.room).emit('roomUsers', {
				room: user.room,
				users: getRoomUsers(user.room)
			});
		}
	});
});










const { PORT=3000, LOCAL_ADDRESS='0.0.0.0' } = process.env
server.listen(PORT, LOCAL_ADDRESS, () => {
  const address = server.address();
  console.log('server listening at', address);
});







//listen
// http.listen(3000, () => console.log('server had started'))

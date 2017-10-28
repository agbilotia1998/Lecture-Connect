var express = require('express'),
	app = express(),
	path = require('path'),
	cookieParser = require('cookie-parser'),
	session = require('express-session'), 
	config = require('./config/config.js'),
	connectMongo = require('connect-mongo')(session),
	mongoose = require('mongoose').connect(config.dbURL),
	passport = require('passport'),
	FBStrategy = require('passport-facebook').Strategy, 
	rooms = [],
	todocontroller = require('./controller/controller.js')

app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('hogan-express'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(session({secret:'I am lulululu', resave:true, saveUninitialized:true}));


var env = process.env.NODE_ENV || 'development';
if (env === 'development') {
	app.use(session({secret:config.sessionSecret}))
} else {
	app.use(session({
		secret:config.sessionSecret,
		store:new connect-mongo({
			//url:config.dbURL,
			mongoose_connection:mongoose.connection[0],
			string:true
		})
	}))
}

app.use(passport.initialize());
app.use(passport.session());

require('./auth/passportauth.js')(passport, FBStrategy, config, mongoose);
require('./routes/routes.js')(express, app, passport, config, rooms);
/*
app.listen(9000, function() {
	console.log('ChatBox is working on port 9000');
	console.log('Current mode is '+ env);
})*/
app.set('port', process.env.PORT || 9000);
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
require('./socket/socket.js')(io, rooms);
server.listen(app.get('port'), function() {
	console.log('ChatBox is working on ' + app.get('port')); 
})
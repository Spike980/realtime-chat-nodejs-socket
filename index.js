var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var storage = require('node-persist');

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {

	var users;
	storage.initSync({
	    dir: __dirname + '/persist',
	    stringify: JSON.stringify,
	    parse: JSON.parse,
	    encoding: 'utf8',
	    logging: false,  // can also be custom logging function
	    continuous: true,
	    interval: false, // milliseconds
	});

	console.log('socket connection with user established');
	socket.on('disconnect', function() {
		var username = storage.getItemSync(socket.id);
		console.log(username);
		users = Object.keys(io.sockets.connected).map(function(key) {
			return io.sockets.connected[key].name;
		});
		io.emit('user disconnect', users, username);

	});

	socket.on('chat message', function(msg) {
		console.log('message:' + msg);
		// socket.broadcast.emit('hi'); 	send to everyone except certain socket
		socket.broadcast.emit('chat message', msg);
	});

	socket.on('new user', function(name) {

		socket.name = name;
		socket.broadcast.emit('new user', socket.name + ' has joined');
		users = Object.keys(io.sockets.connected).map(function(key) {
			return io.sockets.connected[key].name;
		});
		console.log(users);
		io.emit('user add', socket.name);
		io.emit('new user', users);
		storage.setItemSync(socket.id, socket.name, {ttl: 30000 * 60 })

	})

	socket.on('message status', function(msg) {
		socket.broadcast.emit('message status', msg);
	})

});

http.listen(3000, function() {
	console.log("server running at http://localhost:3000")
});


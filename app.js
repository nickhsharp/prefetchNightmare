var express = require('express')
  , http = require('http')
  , https = require('https')
  , path = require('path')
  , fs = require('fs')
  , webSocket = require('ws')
	,	webSocketServer = webSocket.Server
		

var app = express();

app.set('port', process.env.PORT || 1337);
app.use(express.errorHandler());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('preFetch Nightmare'));
app.use(express.cookieSession());
app.use(app.router);

app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
  res.sendfile(__dirname + '/public/index.html');
});

app.get('/json/data.json', function(req,res) {
	console.log("Getting /json/data.json", new Date().getTime());
	res.setHeader('Content-Type', 'application/json');
	res.send('{"name":"data.json"}');
});

app.get('/json/api.json', function(req,res) {
	console.log("Getting /json/api.json", new Date().getTime());
	res.setHeader('Content-Type', 'application/json');
	res.send('{"name":"api.json"}');
});

app.get('/json/lazyload1.json', function(req,res) {
	console.log("Getting /json/lazyload1.json", new Date().getTime());
	res.setHeader('Content-Type', 'application/json');
	res.send('{"name":"lazyload1.json"}');
});

app.get('/json/lazyload2.json', function(req,res) {
	console.log("Getting /json/lazyload2.json", new Date().getTime());
	res.setHeader('Content-Type', 'application/json');
	res.send('{"name":"lazyload2.json"}');
});

app.use(function(req, res){
	console.log("Sending index.html again due to route")
  res.sendfile(__dirname + '/public/index.html');
});

var server = http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'), new Date().getTime());
});

var wss = new webSocketServer({server: server});
wss.on('connection', function(ws) {
	console.log("WebSocket Connected", new Date().getTime());
	ws.on('message', function(data, flags){
		console.log("WebSocket Message Received", data, new Date().getTime());
	});
	ws.on('close', function(e) {
		console.log("WebSocket Closed", new Date().getTime())
	});
	ws.send("HELLO");
});
var express = require('express')
 , app = express.createServer()
 , io = require('socket.io').listen(app);

// disable heartbeats for the clients
io.disable('heartbeats');

app.use(express.bodyParser());
app.use('/static', express.static( __dirname + '/static'));
app.listen(8888);

var browserNr = 0;
var browsers = new Array();
var browserIds = new Array();
var currentSocket;

app.get('/', function (req, res) {
  console.log("Get request recieved");
  res.sendfile(__dirname + '/index.html');
});

app.post('/update', function(req, res) {
	console.log("Post request recieved!");
	for (var key in req.body)
	{
		var accelerometerData = key;
		console.log(key);
		currentSocket.emit('acceleromessage', accelerometerData);
		break;
	}
});

io.sockets.on('connection', function (socket) {
	socket.on("buttonClick", function (data){
		console.log("button click event!");
        browsers[browserNr-1].emit('buttonClick', data);

        var splitData = data.split('|');
		var playerID = splitData[0];
		var button = splitData[1];
        if (button === "button1")
        {
        	var message = "1|" + playerID + "|" + "2.123" + "|";
			console.log('button1');
			browsers[browserNr-1].emit('acceleroUDP', message.toString());
        }
        else if (button === "button2")
        {
        	var message = "1|" + playerID + "|" + "-2.123" + "|";
        	console.log('button2');
			browsers[browserNr-1].emit('acceleroUDP', message.toString());
        }
    });

    socket.on("handshake", function (data)
    {
    	var splitData = data.split('|');
		var client = splitData[0];
		var playerID = splitData[1];
		console.log("handshake: " + data);
    	if (client === 'browser')
    	{
    		browsers[browserNr] = socket;
			browserIds[browserNr] = generateBrowserID(browserNr);
			browserNr++;
			currentSocket = socket;
			browsers[browserNr-1].emit('message', 'First message from server');
			browsers[browserNr-1].emit('browserID', browserIds[browserNr-1].toString());

			console.log("browser client connected!");
    	}
    	else if (data === 'player')
    	{
    		browsers[browserNr-1].emit('arduinoPlayerConnected', playerID);

    		console.log("player " + playerID + " connected");
    	}
    });
});

function generateBrowserID(browserNr)
{
	var browserID = browserNr * 100;
	var randomnumber = Math.floor(Math.random()*100);
	return (browserID + randomnumber).toString();
}

// UDP accelerometer data communication
var dgram = require("dgram");
var server = dgram.createSocket("udp4");

server.on("message", function (msg, rinfo) {
	console.log("server got: " + msg + " from " + rinfo.address + ":" + rinfo.port);
	var stringMessage = msg.toString();
	var splitData = stringMessage.split('|');
	var message_type = splitData[0];
	var browserID = splitData[1];
	var playerID = splitData[2];
	var accelero_data = splitData[3];
	var additional_data = splitData[4];
	
	if (message_type === "1")
	{
		for (var i = 0; i < browserNr; i++)
		{
			if (browserIds[i] === browserID)
			{
				// the server to browser message has the following structure:
				// message_type|player_id|accelero_data|additional_message
				// where message_type = 0 if there was an error, 1 if the message
				// contains the accelerometer data
				
				// no additional message
				var message = "1|" + playerID + "|" + accelero_data + "|";
				browsers[i].emit('acceleroUDP', message.toString());
				break;
			}
		}
	}
});

server.on("listening", function () {
	var address = server.address();
	console.log("server listening " + address.address + ":" + address.port);
});

server.bind(8085);
// server listening 0.0.0.0:41234

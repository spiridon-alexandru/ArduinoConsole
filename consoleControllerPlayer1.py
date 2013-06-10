from pyfirmata import Arduino, util
import time
import sys
import urllib2
import websocket
import uuid

HOSTNAME = "127.0.0.1"
PORT = 8888

def handshake(host, port):
    u = urllib2.urlopen("http://%s:%d/socket.io/1/" % (host, port))
    if u.getcode() == 200:
        response = u.readline()
        (sid, hbtimeout, ctimeout, supported) = response.split(":")
        supportedlist = supported.split(",")
        if "websocket" in supportedlist:
            return (sid, hbtimeout, ctimeout)
        else:
            raise TransportException()
    else:
        raise InvalidResponseException()

try:
    (sid, hbtimeout, ctimeout) = handshake(HOSTNAME, PORT) #handshaking according to socket.io spec.
except Exception as e:
    print e
    sys.exit(1)
ws = websocket.create_connection("ws://%s:%d/socket.io/1/websocket/%s" % (HOSTNAME, PORT, sid))

# handshake this player with the server
playerID = uuid.uuid4();
ws.send('5:1::{"name":"handshake", "args":"player|' + str(playerID) + '"}')

board = Arduino("COM6")

it = util.Iterator(board)
it.start()

button1Pin = board.get_pin('d:2:i')
button1Pin.enable_reporting()

button2Pin = board.get_pin('d:3:i')
button2Pin.enable_reporting()

ledPin = board.get_pin('d:13:o')

while 1:
   b1Val = button1Pin.read()
   b2Val = button2Pin.read()

   if b1Val == True:
      print("button 1 click")
      ws.send('5:1::{"name":"buttonClick", "args":"' + str(playerID) + '|button1"}')

   if b2Val == True:
      print("button 2 click")
      ws.send('5:1::{"name":"buttonClick", "args":"' + str(playerID) + '|button2"}')

   time.sleep(0.02)

"""
   #test led 13 by blinking   
   ledPin.write(1)
   time.sleep(0.2)
   ledPin.write(0)
   time.sleep(0.2)
"""

#print ws.recv()
#ws.send("2::")
#print ws.recv()
#print "Closing connection"
#ws.close()
var express = require('express');
var app = express()
var server = app.listen(3000);

app.use(express.static('public'));

var socket = require('socket.io');
var io = socket(server);
io.sockets.on('connection', emitData);

function emitData(socket){
  socket.on('player_turn',process_playerturn);

  function process_playerturn(data){
    socket.broadcast.emit('player_turn',data);
  }
}

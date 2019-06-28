 /* ESTABLISH SERVER */
var express = require('express'), 
    app = express(),
    http = require('http'),
    fs = require('fs'),
    socketIo = require('socket.io');

var server =  http.createServer(app);
var io = socketIo.listen(server);
var port = 8080;

// print process.argv
/*process.argv.forEach(function (val, index, array) {
  if(index == 2){
    val = parseInt(val);
    if(val >= 0 && val <= 65535) {
      port = val;
    }
  }

});*/
//port as a parameter disabled due to client sided dependency


server.listen(port);

app.use(express.static(__dirname + '/public'));

/* Dictionary of random words */
var dictionary = JSON.parse(fs.readFileSync('words.json', 'utf8'));
var dictionary_length = Object.keys(dictionary).length

var array_rooms = [];
for(var i = 0; i < 6; i++){
  array_rooms.push(new room(i));
}

function contains_blacklisted_words(text){

  let blacklist_words = [
  /* */"<html>"
  ];

  var contains = false;
  for(var i = 0; i < (blacklist_words).length; i++){
    if ( text.includes(blacklist_words[i]) ){
      contains = true;
    }
  }

  return contains;
}

function room(id){
  this.id = id;
  this.name = dictionary[random_number_from(0, dictionary_length-1)];
  this.line_history = [];
  this.line_history_plain = [];
  this.players = [];
};

var avatars_default = [
  'demonic_deity',
  'dracula',
  'elf',
  'joker',
  'king',
  'knight',
  'leprechaun',
  'little_red_riding_hood',
  'medusa',
  'princess',
  'queen',
  'wizard'
];
/* 
No need for player object. Socket = Player
Custom attrs:  
  - Socket.id
  - Socket.name
  - Socket.avatar
*/
console.log("\nServer running on 127.0.0.1:"+port+"\n--------------------------------")
function loop_log(){
  console.clear(); // Win only
  console.log("");

  console.log("Server running on 127.0.0.1:"+port+"\n--------------------------------");
  var curr_players_count = 0;

  for(var i = 0; i < array_rooms.length; i++){
    if(array_rooms[i].players.length == 0){
      console.log("(Players: 0) Room " + i + ": [ / ]");
    } else {
      var tmp_arr = [];
      var j
      for(j = 0; j < array_rooms[i].players.length; j++){
        tmp_arr.push(array_rooms[i].players[j].name);
        curr_players_count++;
      }
      console.log("(Players: " + j + ")" + " Room " + i + ": [ " + tmp_arr + " ]");
    }
  }
  console.log("\nPlayers online: " + curr_players_count);
}

io.on('connection', function (socket) {

  // Socket data 
  socket.name = dictionary[random_number_from(0, dictionary_length-1)];
  socket.avatar = avatars_default[random_number_from(0, avatars_default.length-1)];

   // TODO: ENCRYPT ID
  socket.emit('socket_credentials', {id:socket.id, name:socket.name});

  // Pick a room and join it
  var room_id = random_number_from(0, array_rooms.length-1);
  socket.join(room_id);
  array_rooms[room_id].players.push({ id:socket.id, name:socket.name, avatar:socket.avatar });


  io.to(room_id).emit('draw_users', { room:{id:room_id, name:array_rooms[room_id].name, players:array_rooms[room_id].players}, lobbies:{array_rooms} });

  // Send the drawing history of the room you just joined

  //  1 BY 1
  //  for (var i in array_rooms[room_id].line_history) {
  //  socket.emit('draw', { line: array_rooms[room_id].line_history[i] } );
  //}
  //  ALL TOGETHER
  socket.emit('draw_history', { lines: array_rooms[room_id].line_history } );

  // Handle client-evoked functions
  socket.on('draw_line', function (data) {
    array_rooms[room_id].line_history.push(data.line);
    array_rooms[room_id].line_history_plain.push([ data.line[0].x, data.line[0].y, data.line[2].color ]);
    io.to(room_id).emit('draw', { line: data.line } );
  });

  socket.on('paint_bucket', function (data) {

  });

  socket.on('send_chat', function(data) {

    if(contains_blacklisted_words(data.text)){
      io.to(room_id).emit('append_to_chat_styled', { text : '<span style="font-style: italic; font-weight: bold;"> ' + data.name + '...</span>'})
      return;
    }

    data.text = data.text.trim();
    if(data.text.length > 0 && data.text.length < 75) {
      data.text = data.text.replace(/</g, "&lt;").replace(/>/g, "&gt;")
      io.to(room_id).emit('append_to_chat', { name : data.name, text : data.text });
    } 
  });

  socket.on('change_lobby', function(data){
    socket.leave(room_id);
    var socket_index = array_rooms[room_id].players.findIndex(_x => _x.id === socket.id);
    array_rooms[room_id].players.splice(socket_index, 1);
    room_id = data.lobbyid;
    socket.join(room_id);
    array_rooms[room_id].players.push({ id:socket.id, name:socket.name, avatar:socket.avatar });
    socket.emit('draw_history', { lines: array_rooms[room_id].line_history } );

    for(var i = 0; i < array_rooms.length; i++){
      io.to(array_rooms[i].id).emit('draw_users', {room:{id:room_id, name:array_rooms[room_id].name, players:array_rooms[room_id].players},  lobbies:{array_rooms} });
    }

  });

  socket.on('erase_all', function(data){
    array_rooms[room_id].line_history = [];
    io.to(room_id).emit('erase_all');
  });

  socket.on('undo_line', function(data){
    if(array_rooms[room_id].line_history.length == 0){
      return
    }
    last_line_index = array_rooms[room_id].line_history[(array_rooms[room_id].line_history).length-1][3]['lineIndex'];
    line_history_copy = array_rooms[room_id].line_history;

    for(var i = 0; i < (line_history_copy).length; i++){
      if(last_line_index == (line_history_copy)[i][3]['lineIndex']){
        line_history_copy[i] = null;
      }
    }

    var filtered = line_history_copy.filter(function(e){return e});
    array_rooms[room_id].line_history = filtered;
    //io.to(room_id).emit('draw_history', { lines: array_rooms[room_id].line_history } );
    socket.emit('draw_history', { lines: array_rooms[room_id].line_history } );

  });

  socket.on('disconnect', function() {
      socket.leave(room_id);
      var socket_index = array_rooms[room_id].players.findIndex(_x => _x.id === socket.id);
      array_rooms[room_id].players.splice(socket_index, 1);

      io.to(room_id).emit('draw_users', {room:{id:room_id, name:array_rooms[room_id].name, players:array_rooms[room_id].players},  lobbies:{array_rooms} });
      
  });

  loop_log();

});

function random_number_from(min,max) {
  // min and max included
  return Math.floor(Math.random()*(max-min+1)+min);
}

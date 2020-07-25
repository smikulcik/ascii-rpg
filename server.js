var express = require('express'),
    app = express(),
    expressWs = require('express-ws')(app);

app.use(express.static('dist'));


var wss = expressWs.getWss('/ws');

app.ws('/ws', function connection(ws){
    console.log("CONNECTED" + " numClients:" + wss.clients.length);
    var clients = [];
    for(var c in wss.clients){
      clients.push(wss.clients[c].readyState);
    }
    console.log(clients);
    var player;

    ws.onclose = function(msg){
      console.log("DISCONNECTED" + " numClients:" + wss.clients.length)
      var clients = [];
      for(var c in wss.clients){
        clients.push(wss.clients[c].readyState);
      }
      console.log(clients);
      // remove this player from the game
      for(var p in players){
        if(player !== undefined && players[p].id === player.id){
          players.pop(p);
        }
      }
    }
    ws.on('message', function incoming(message){
        try{
            var data = JSON.parse(message);
            if(data.action === "register"){
            //action=register
                player = new Player(Math.floor(Math.random()*1000));
                players.push(player);
                sendMsg(ws, "authResponse", player);

                broadcast("updateAllPlayers", players);
            }
            if(data.action === "updatePlayer"){
            //action=updatePlayer, data=player
                player.updateSelf(data.data);
                broadcast("updateAllPlayers", players);
                console.log(players);
            }
            if(data.action === "enterRoom"){
              player.room = data.data;
            }
        }catch(err){
            console.error(err);
            throw err;
        }
    });

    ws.send((new Player()).stringify());
});

var broadcast = function(type, data){
  console.log("Broadcast");
  //update everyone for all
  wss.clients.forEach(function(client){
      sendMsg(client, type, data);
  });
};

var sendMsg = function(handle, type, data){
  if(handle !== undefined && handle.readyState === handle.OPEN){
    console.log("B");
    handle.send(JSON.stringify({
        'type':type,
        'data':data
    }));
  }
};

app.listen(3000);

var players = [];


var DOWN = 0;
var LEFT = 1;
var RIGHT = 2;
var UP = 3;

var Player = function(id){
    this.id = id;
    this.x = 0;
    this.y = 0;
    this.direction = DOWN;
    this.room = 1;
};

Player.prototype.updateSelf = function(player){
  this.x = player.x;
  this.y = player.y;
  this.direction = player.direction;
  this.room = player.room;
};

console.log("Starting");

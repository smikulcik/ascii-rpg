
/**
Get the address of the websocket given a relative path
**/
var getWsURL = function(path){
  //http://stackoverflow.com/a/10418013
  var loc = window.location, new_uri;
  if (loc.protocol === "https:") {
      new_uri = "wss:";
  } else {
      new_uri = "ws:";
  }
  new_uri += "//" + loc.host;
  new_uri += loc.pathname + path;
  return new_uri;
};


var Server = function(){
  this.pendingMessages = [];
};

Server.prototype.setOnMessage = function(onmessage){
  this.onmessage = onmessage;
};

Server.prototype.setupConnection = function(){
  var that = this;
  this.ws = new WebSocket(getWsURL("ws"));

  this.ws.onopen = function(){

    var player;
    var players = [];
    that.isAuthenticated = false;

    that.ws.onclose = function(event){
      // auto-reconnect
      setTimeout(setupConnection, 1000);
    };

    that.ws.onmessage = function(event){
			var msg = JSON.parse(event.data);
			var type = msg.type;
			var data = msg.data;
      if(type === "authResponse"){
        that.isAuthenticated = true;

        // send all pending messages
        while(that.pendingMessages.length > 0){
          that.ws.send(that.pendingMessages.pop());
        }
      }

      that.onmessage(type, data);
    };

    //auto-login on connect
    that.ws.send(JSON.stringify({'action':'register'}));
  };

  this.ws.onerror = function(event){
    setTimeout(setupConnection, 1000);
  };

};

Server.prototype.send = function(action, data){
  var msg = JSON.stringify({'action': action, 'data': data});
  if(!this.isAuthenticated)
    this.pendingMessages.push(msg);
  else
    this.ws.send(msg);
};
